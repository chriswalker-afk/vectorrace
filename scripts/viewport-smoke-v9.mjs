/**
 * No-dependency Chromium DevTools smoke runner.
 *
 * Unlike --window-size, Emulation.setDeviceMetricsOverride checks REAL 320px
 * and 360px CSS viewports even when headless Chrome clamps outer window width.
 *
 * Usage: node scripts/viewport-smoke-v9.mjs
 * Requires a local web server at http://127.0.0.1:8765 and Chromium/Chrome.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findLegalLap } from './solve-lap.mjs';
import { recordKeyForCircuit } from '../src/race-records.mjs';
import { HAIRPIN_HOLLOW } from '../src/circuit.mjs';
import { HAIRPIN_HOLLOW_CLEAR_LAP } from './hairpin-hollow-qa-route.mjs';

const cases = [
  [1440,900], [1280,720], [1024,768],
  [820,1180], [390,844], [360,640], [320,568],
  [844,390], [667,375]
];
const origin = 'http://127.0.0.1:8765';
const browser = process.env.CHROME_BIN || 'google-chrome';
const profile = mkdtempSync(join(tmpdir(),'snowshift-v9-cdp-'));
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
  document.querySelector('[data-mode="master"]').click();
  const masterPad = document.getElementById('accelerationPad');
  const allColumns = masterPad.dataset.notation === 'columns' &&
    masterPad.querySelectorAll('button .column-vector').length === 9;
  const nextHidden = document.getElementById('nextVelocity').dataset.hidden === 'true';
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
    ghostHidden:document.getElementById('ghostToggle').hidden,
    masterSelected:document.querySelector('[data-mode="master"]').getAttribute('aria-pressed')==='true',
    allColumns, nextHidden
  };
}
function restartGhostBrowser() {
  const finish=document.getElementById('finishPanel');
  const text=document.getElementById('bestResult').textContent;
  const visible=!finish.hidden;
  document.getElementById('raceAgain').click();
  const toggle=document.getElementById('ghostToggle');
  const masterHides=toggle.hidden; // Restart retains the completed race's Master mode.
  document.querySelector('[data-mode="guided"]').click();
  const canSee=!toggle.hidden;
  const before=document.getElementById('score').textContent;
  toggle.click();
  const toggledOff=toggle.getAttribute('aria-pressed')==='false';
  toggle.click();
  const toggledOn=toggle.getAttribute('aria-pressed')==='true';
  document.querySelector('[data-mode="expert"]').click();
  const expertHides=toggle.hidden;
  document.querySelector('[data-mode="master"]').click();
  const backToMasterHides=toggle.hidden;
  document.querySelector('[data-mode="guided"]').click();
  return {visible,text,canSee,before,toggledOff,toggledOn,expertHides,masterHides,backToMasterHides};
}


function verifyCircuitRecordsBrowser() {
  const picker=document.getElementById('mapPicker');
  const grab=()=>({
    score:document.getElementById('score').textContent,
    badge:document.getElementById('recordBadge').textContent,
    ghostHidden:document.getElementById('ghostToggle').hidden,
    name:document.getElementById('mapName').textContent
  });
  const switchTo=id=>{
    picker.click();
    document.querySelector('[data-circuit="'+id+'"]').click();
    return grab();
  };
  const hairpin=grab();
  const northern=switchTo('northern-loop');
  const aurora=switchTo('aurora-split');
  const frost=switchTo('frost-chicane');
  const narrow=switchTo('narrow-passage');
  const restored=switchTo('hairpin-hollow');
  return {hairpin,northern,aurora,frost,narrow,restored};
}
function crashThroughRockBrowser() {
  document.getElementById('mapPicker').click();
  document.querySelector('[data-circuit="aurora-split"]').click();
  document.getElementById('reset').click();
  const east=document.querySelector('#accelerationPad [data-x="1"][data-y="0"]');
  for(let n=0;n<4;n++){east.click();document.getElementById('commit').click();}
  return {
    turns:document.getElementById('moves').textContent,
    crashes:document.getElementById('crashes').textContent,
    score:document.getElementById('score').textContent,
    velocity:[...document.querySelectorAll('#currentVelocity [data-component]')].map(el=>el.textContent),
    toast:document.getElementById('eventToast').textContent
  };
}

function ghostLayoutBrowser() {
  const ghost=document.getElementById('ghostToggle');
  const rect=ghost.getBoundingClientRect();
  const width=innerWidth,height=innerHeight;
  return {
    width,height,visible:!ghost.hidden,
    inBounds:rect.width>=25&&rect.height>=24&&rect.left>=0&&rect.top>=0&&
      rect.right<=width+1&&rect.bottom<=height+1,
    noScroll:document.documentElement.scrollWidth<=width+1&&
      document.documentElement.scrollHeight<=height+1,
    hintHidden:getComputedStyle(document.getElementById('microHint')).display==='none'
  };
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
    velocity:[...document.querySelectorAll('#currentVelocity [data-component]')]
      .map(element=>element.textContent),
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
      await send('Page.navigate',{url:origin+'/race-v9.html?qa=1&track=hairpin-hollow'});
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
      // The smallest portrait and landscape screens use a special 3×2
      // selector. Preserve screenshots of the OPEN menu for actual readability
      // QA, not just bounding-box assertions.
      if(size==='320x568'||size==='667x375'){
        await send('Page.navigate',{url:origin+'/race-v9.html?track=hairpin-hollow'});
        await waitFor(send,async()=>{
          const ready=await evaluation(send,
            'document.readyState==="complete" && document.querySelectorAll("#mapMenu .map-option").length===5');
          return ready?true:null;
        });
        await evaluation(send,'document.getElementById("mapPicker").click()');
        await delay(180);
        const menuPng=await send('Page.captureScreenshot',{
          format:'png',captureBeyondViewport:false,fromSurface:true
        });
        writeFileSync('screenshots/snowshift-v9-open-menu-'+size+'.png',
          Buffer.from(menuPng.data,'base64'));
      }
      if(size==='1440x900'||size==='390x844'||size==='844x390'){
        await send('Page.navigate',{url:origin+'/race-v9.html?track=hairpin-hollow'});
        await waitFor(send,async()=>{
          const ready=await evaluation(send,'document.readyState==="complete" && document.querySelectorAll("#accelerationPad button").length===9');
          return ready?true:null;
        });
        await delay(650);
        const screenshot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
        writeFileSync('screenshots/snowshift-v9-'+size+'.png',Buffer.from(screenshot.data,'base64'));
        await evaluation(send,'document.querySelector(\'[data-mode="master"]\').click()');
        await delay(150);
        const masterScreenshot=await send('Page.captureScreenshot',{
          format:'png',captureBeyondViewport:false,fromSurface:true
        });
        writeFileSync('screenshots/snowshift-v9-master-'+size+'.png',
          Buffer.from(masterScreenshot.data,'base64'));
      }
    }finally{
      ws.close();
      await fetch('http://127.0.0.1:'+port+'/json/close/'+target.id).catch(()=>{});
    }
  }

  // Full-lap browser integration: real UI buttons, no physics API shortcuts.
  // Reduced motion removes gliding delays without changing the deterministic engine.
  const actions=HAIRPIN_HOLLOW_CLEAR_LAP;
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
    await send('Page.navigate',{url:origin+'/race-v9.html?track=hairpin-hollow'});
    await waitFor(send,async()=>{
      const ready=await evaluation(send,
        'document.readyState==="complete" && document.querySelectorAll("#accelerationPad button").length===9');
      return ready?true:null;
    });
    const script='('+playLegalLapInBrowser.toString()+')('+
      JSON.stringify(actions)+','+JSON.stringify(recordKeyForCircuit(HAIRPIN_HOLLOW.id))+')';
    const lap=await evaluation(send,script);
    if(!lap.record || lap.record.moves!==actions.length ||
       lap.record.frames?.length!==actions.length+1 ||
       lap.record.score!==actions.length ||
       !lap.commitDisabled || lap.crashes!=='00' ||
       lap.gateMessages.length!==3 || !lap.ghostHidden ||
       !lap.masterSelected || !lap.allColumns || !lap.nextHidden){
      console.error('FAIL full-lap browser integration',lap,'expected moves',actions.length);
      failed++;
    }else{
      console.log('PASS Hairpin Hollow Master lap',actions.length,'moves / 9 column controls / 3 checkpoints / local best persisted');
    }
    await waitFor(send,async()=>{
      const visible=await evaluation(send,'!document.getElementById("finishPanel").hidden');
      return visible?true:null;
    },10000);
    const restart=await evaluation(send,'('+restartGhostBrowser.toString()+')()');
    if(!restart.visible || !restart.canSee || restart.before!=='00' ||
       !restart.toggledOff || !restart.toggledOn || !restart.expertHides ||
       !restart.masterHides || !restart.backToMasterHides ||
       !/NEW LOCAL BEST/.test(restart.text)){
      console.error('FAIL ghost / personal-best / restart',restart);
      failed++;
    }else{
      console.log('PASS finish, Race Again and local ghost toggle; Expert/Master hide ghost');
    }
    // Once a record exists, the new GHOST control must also fit on small screens.
    for(const [width,height] of [[390,844],[320,568],[844,390]]) {
      await send('Emulation.setDeviceMetricsOverride',{
        width,height,deviceScaleFactor:1,mobile:width<500,
        screenWidth:width,screenHeight:height
      });
      await delay(170);
      const layout=await evaluation(send,'('+ghostLayoutBrowser.toString()+')()');
      if(!layout.visible || !layout.inBounds || !layout.noScroll || !layout.hintHidden ||
         layout.width!==width || layout.height!==height){
        console.error('FAIL recorded-ghost viewport',width+'x'+height,layout);
        failed++;
      }else{
        console.log('PASS recorded ghost',width+'x'+height,'single screen');
      }
    }
    await send('Emulation.setDeviceMetricsOverride',{
      width:1280,height:720,deviceScaleFactor:1,mobile:false,
      screenWidth:1280,screenHeight:720
    });
    await evaluation(send,'('+moveNorthOnceBrowser.toString()+')()');
    await delay(350);
    const ghostPng=await send('Page.captureScreenshot',{
      format:'png',captureBeyondViewport:false,fromSurface:true
    });
    writeFileSync('screenshots/snowshift-v9-personal-ghost.png',
      Buffer.from(ghostPng.data,'base64'));
    const records=await evaluation(send,'('+verifyCircuitRecordsBrowser.toString()+')()');
    if(records.hairpin.name!=='HAIRPIN HOLLOW' || records.hairpin.ghostHidden ||
       /PB —/.test(records.hairpin.badge) ||
       records.northern.score!=='00' || !records.northern.ghostHidden ||
       !/PB —/.test(records.northern.badge) ||
       records.aurora.score!=='00' || !records.aurora.ghostHidden ||
       !/PB —/.test(records.aurora.badge) ||
       records.frost.score!=='00' || !records.frost.ghostHidden ||
       !/PB —/.test(records.frost.badge) ||
       records.narrow.score!=='00' || !records.narrow.ghostHidden ||
       !/PB —/.test(records.narrow.badge) ||
       records.restored.name!=='HAIRPIN HOLLOW' || records.restored.ghostHidden ||
       /PB —/.test(records.restored.badge)){
      console.error('FAIL five separate personal best records',records);
      failed++;
    }else{
      console.log('PASS five independent track records: saved Hairpin Hollow best survives switching');
    }
    const rockCrash=await evaluation(send,'('+crashThroughRockBrowser.toString()+')()');
    if(rockCrash.turns!=='04' || rockCrash.crashes!=='01' ||
       rockCrash.score!=='07' || rockCrash.velocity.join(',')!=='0,0' ||
       !/SNOWBANK/.test(rockCrash.toast)){
      console.error('FAIL 4-turn small-rock collision',rockCrash);
      failed++;
    }else{
      console.log('PASS small-rock collision through actual acceleration controls');
    }

    const crash=await evaluation(send,'('+crashThreeNorthBrowser.toString()+')()');
    if(crash.turns!=='03' || crash.crashes!=='01' ||
       crash.score!=='06' || crash.velocity?.join(',')!=='0,0' ||
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
