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
  if(failed)throw new Error(failed+' actual viewport check(s) failed');
}
try{await main();}catch(error){console.error(error);process.exitCode=1;}finally{quit();}
