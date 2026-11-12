/**
 * No-dependency Chromium DevTools smoke runner.
 *
 * Unlike --window-size, Emulation.setDeviceMetricsOverride checks REAL 320px
 * and 360px CSS viewports even when headless Chrome clamps outer window width.
 *
 * Usage: node scripts/viewport-smoke-v5.mjs
 * Requires a local web server at http://127.0.0.1:8765 and Chromium/Chrome.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findLegalLap } from './solve-lap.mjs';
import { RECORD_KEY } from '../src/race-records.mjs';

const cases = [
  [1440,900], [1280,720], [1024,768],
  [820,1180], [390,844], [360,640], [320,568],
  [844,390], [667,375]
];
const origin = 'http://127.0.0.1:8765';
const browser = process.env.CHROME_BIN || 'google-chrome';
const profile = mkdtempSync(join(tmpdir(),'snowshift-v5-cdp-'));
const child = spawn(browser, [
  '--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
  '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  '--no-default-browser-check', '--remote-allow-origins=*',
  '--remote-debugging-port=0', '--user-data-dir='+profile, 'about:blank'
], { stdio:'ignore' });
const delay = ms => new Promise(r=>setTimeout(r,ms));
const quit = () => {
  if (child.exitCode === null) child.kill('SIGKILL');
  try { rmSync(profile,{recursive:true,force:true}); } catch {}
};
process.on('SIGINT',()=>{quit();process.exit(130)});

function openSocket(url){
  return new Promise((resolve,reject)=>{
    const socket = new WebSocket(url);
    const timeout=setTimeout(()=>reject(new Error('CDP connection timed out')),6000);
    socket.addEventListener('open',()=>{clearTimeout(timeout);resolve(socket);},{once:true});
    socket.addEventListener('error',()=>{clearTimeout(timeout);reject(new Error('CDP websocket error'));},{once:true});
  });
}
function protocol(ws) {
  let seq=0;
  const pending=new Map();
  ws.addEventListener('message',event=>{
    let data;
    try{data=JSON.parse(event.data);}catch{return;}
    if(!data.id||!pending.has(data.id))return;
    const record=pending.get(data.id);pending.delete(data.id);
    if(data.error)record.reject(new Error(data.error.message||JSON.stringify(data.error)));
    else record.resolve(data.result);
  });
  return function send(method,params={}){
    const id=++seq;
    return new Promise((resolve,reject)=>{
      pending.set(id,{resolve,reject});
      ws.send(JSON.stringify({id,method,params}));
      setTimeout(()=>{
        if(pending.has(id)){pending.delete(id);reject(new Error('CDP timeout: '+method));}
      },8000);
    });
  };
}
async function evaluation(send,expression){
  const out=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(out.exceptionDetails)throw new Error('Browser JS exception: '+out.exceptionDetails.text);
  return out.result?.value;
}
async function waitFor(send,predicate,timeout=10000){
  const started=Date.now();
  while(Date.now()-started<timeout){
    const v=await predicate();
    if(v!==null&&v!==undefined&&v!==false)return v;
    await delay(110);
  }
  throw new Error('Timed out waiting for browser readiness');
}

function playLegalLapInBrowser(actions, recordKey) {
  const gateMessages = [];
  for(const a of actions) {
    const button=document.querySelector('#accelerationPad [data-x="'+a.x+'"][data-y="'+a.y+'"]');
    if(!button) throw new Error('Missing acceleration button');
    button.click();
    document.getElementById('commit').click();
    const message=document.getElementById('message').textContent;
    if(message.includes('GATE CLEARED'))gateMessages.push(message);
  }
  let record=null;
  try{record=JSON.parse(localStorage.getItem(recordKey));}catch{}
  return {
    turns:document.getElementById('moves').textContent,
    crashes:document.getElementById('crashes').textContent,
    commitDisabled:document.getElementById('commit').disabled,
    record,gateMessages,
    score:document.getElementById('score').textContent,
    badge:document.getElementById('recordBadge').textContent,
    ghostHidden:document.getElementById('ghostToggle').hidden
  };
}
function restartGhostBrowser() {
  const finish=document.getElementById('finishPanel');
  const text=document.getElementById('bestResult').textContent;
  const visible=!finish.hidden;
  document.getElementById('raceAgain').click();
  const toggle=document.getElementById('ghostToggle');
  const canSee=!toggle.hidden;
  const before=document.getElementById('score').textContent;
  toggle.click();
  const toggledOff=toggle.getAttribute('aria-pressed')==='false';
  toggle.click();
  const toggledOn=toggle.getAttribute('aria-pressed')==='true';
  document.querySelector('[data-mode="expert"]').click();
  const expertHides=toggle.hidden;
  document.querySelector('[data-mode="guided"]').click();
  return {visible,text,canSee,before,toggledOff,toggledOn,expertHides};
}
function moveNorthOnceBrowser() {
  document.querySelector('#accelerationPad [data-x="0"][data-y="1"]').click();
  document.getElementById('commit').click();
  return document.getElementById('moves').textContent;
}
function crashThreeNorthBrowser() {
  document.getElementById('reset').click();
  const up=document.querySelector('#accelerationPad [data-x="0"][data-y="1"]');
  for(let i=0;i<3;i++){up.click();document.getElementById('commit').click();}
  return {
    turns:document.getElementById('moves').textContent,
    crashes:document.getElementById('crashes').textContent,
    score:document.getElementById('score').textContent,
    velocity:document.getElementById('currentVelocity').textContent,
    toast:document.getElementById('eventToast').textContent
  };
}

async function main(){
  if(typeof WebSocket!=='function')throw new Error('Node 22 WebSocket is required');
  let port=null;
  for(let i=0;i<120;i++){
    const p=join(profile,'DevToolsActivePort');
    if(existsSync(p)){
      port=Number(readFileSync(p,'utf8').split('\n')[0]);
      break;
    }
    if(child.exitCode!==null)throw new Error('Chromium terminated prematurely');
    await delay(100);
  }
  if(!port)throw new Error('Chromium DevTools port not created');
  mkdirSync('screenshots',{recursive:true});
  let failed=0;
  for(const [width,height] of cases){
    const size=width+'x'+height;
    const response=await fetch('http://127.0.0.1:'+port+'/json/new?about:blank',{method:'PUT'});
    if(!response.ok)throw new Error('Could not create Chrome CDP page: '+response.status);
    const target=await response.json();
    const ws=await openSocket(target.webSocketDebuggerUrl);
    const send=protocol(ws);
    try{
      await send('Page.enable');
      await send('Runtime.enable');
      await send('Emulation.setDeviceMetricsOverride',{
        width,height,deviceScaleFactor:1,mobile:width<=920,screenWidth:width,screenHeight:height
      });
      await send('Page.navigate',{url:origin+'/race-v5.html?qa=1'});
      const result=await waitFor(send,async()=>{
        const value=await evaluation(send,
          '({ qa:document.documentElement?.dataset?.qa||null, report:document.getElementById("qa-report")?.textContent||null, width:innerWidth,height:innerHeight })');
        return value?.qa?value:null;
      });
      if(result.width!==width||result.height!==height){
        console.error('FAIL',size,'emulated CSS viewport mismatch',result.width,result.height);
        failed++;
      }else if(result.qa!=='PASS'){
        console.error('FAIL',size,result.report);
        failed++;
      }else{
        console.log('PASS',size,'all controls inside viewport; modes and glide work');
      }
      if(size==='1440x900'||size==='390x844'||size==='844x390'){
        await send('Page.navigate',{url:origin+'/race-v5.html'});
        await waitFor(send,async()=>{
          const ready=await evaluation(send,'document.readyState==="complete" && document.querySelectorAll("#accelerationPad button").length===9');
          return ready?true:null;
        });
        await delay(650);
        const screenshot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
        writeFileSync('screenshots/snowshift-v5-'+size+'.png',Buffer.from(screenshot.data,'base64'));
      }
    }finally{
      ws.close();
      await fetch('http://127.0.0.1:'+port+'/json/close/'+target.id).catch(()=>{});
    }
  }

  // Full-lap browser integration: real UI buttons, no physics API shortcuts.
  // Reduced motion removes gliding delays without changing the deterministic engine.
  const actions=findLegalLap();
  const response=await fetch('http://127.0.0.1:'+port+'/json/new?about:blank',{method:'PUT'});
  if(!response.ok)throw new Error('Could not create full-lap browser page');
  const target=await response.json();
  const ws=await openSocket(target.webSocketDebuggerUrl);
  const send=protocol(ws);
  try {
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride',{
      width:1280,height:720,deviceScaleFactor:1,mobile:false,
      screenWidth:1280,screenHeight:720
    });
    await send('Emulation.setEmulatedMedia',{
      features:[{name:'prefers-reduced-motion',value:'reduce'}]
    });
    await send('Page.navigate',{url:origin+'/race-v5.html'});
    await waitFor(send,async()=>{
      const ready=await evaluation(send,
        'document.readyState==="complete" && document.querySelectorAll("#accelerationPad button").length===9');
      return ready?true:null;
    });
    const script='('+playLegalLapInBrowser.toString()+')('+
      JSON.stringify(actions)+','+JSON.stringify(RECORD_KEY)+')';
    const lap=await evaluation(send,script);
    if(!lap.record || lap.record.moves!==actions.length ||
       lap.record.frames?.length!==actions.length+1 ||
       lap.record.score!==actions.length ||
       !lap.commitDisabled || lap.crashes!=='00' ||
       lap.gateMessages.length!==3 || lap.ghostHidden){
      console.error('FAIL full-lap browser integration',lap,'expected moves',actions.length);
      failed++;
    }else{
      console.log('PASS full lap',actions.length,'moves / 3 checkpoints / local best persisted');
    }
    await waitFor(send,async()=>{
      const visible=await evaluation(send,'!document.getElementById("finishPanel").hidden');
      return visible?true:null;
    },10000);
    const restart=await evaluation(send,'('+restartGhostBrowser.toString()+')()');
    if(!restart.visible || !restart.canSee || restart.before!=='00' ||
       !restart.toggledOff || !restart.toggledOn || !restart.expertHides ||
       !/NEW LOCAL BEST/.test(restart.text)){
      console.error('FAIL ghost / personal-best / restart',restart);
      failed++;
    }else{
      console.log('PASS finish, Race Again and local ghost toggle; Expert hides ghost');
    }
    await evaluation(send,'('+moveNorthOnceBrowser.toString()+')()');
    await delay(350);
    const ghostPng=await send('Page.captureScreenshot',{
      format:'png',captureBeyondViewport:false,fromSurface:true
    });
    writeFileSync('screenshots/snowshift-v5-personal-ghost.png',
      Buffer.from(ghostPng.data,'base64'));
    const crash=await evaluation(send,'('+crashThreeNorthBrowser.toString()+')()');
    if(crash.turns!=='03' || crash.crashes!=='01' ||
       crash.score!=='06' || !/0, 0/.test(crash.velocity) ||
       !/SNOWBANK/.test(crash.toast)){
      console.error('FAIL crash and penalty recovery',crash);
      failed++;
    }else{
      console.log('PASS crash recovery, +3 score penalty and collision notification');
    }
  }finally{
    ws.close();
    await fetch('http://127.0.0.1:'+port+'/json/close/'+target.id).catch(()=>{});
  }

  if(failed)throw new Error(failed+' actual viewport check(s) failed');
}
try{await main();}catch(error){console.error(error);process.exitCode=1;}finally{quit();}
