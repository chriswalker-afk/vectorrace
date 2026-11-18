/**
 * No-dependency Chromium DevTools smoke runner.
 *
 * Unlike --window-size, Emulation.setDeviceMetricsOverride checks REAL 320px
 * and 360px CSS viewports even when headless Chrome clamps outer window width.
 *
 * Usage: node scripts/viewport-smoke-v17.mjs
 * Requires a local web server at http://127.0.0.1:8765 and Chromium/Chrome.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findLegalLap } from './solve-lap.mjs';
import { recordKeyForCircuit } from '../src/race-records.mjs';
import { CROSSWIND_RIDGE, ICEBOUND_RAPIDS, BROKEN_PASSAGE, FROZEN_GAUNTLET, ARCTIC_GRAND_PRIX } from '../src/circuit.mjs';
import { ARCTIC_GRAND_PRIX_CLEAR_RACE, GRAND_PRIX_LAP_ONE } from './arctic-grand-prix-qa-route.mjs';
import { FROZEN_GAUNTLET_CLEAR_LAP } from './frozen-gauntlet-qa-route.mjs';
import { BROKEN_PASSAGE_CLEAR_LAP } from './broken-passage-qa-route.mjs';
import { ICEBOUND_RAPIDS_CLEAR_LAP } from './icebound-rapids-qa-route.mjs';
import { CROSSWIND_RIDGE_CLEAR_LAP } from './crosswind-ridge-qa-route.mjs';

const cases = [
  [1440,900], [1280,720], [1024,768],
  [820,1180], [390,844], [360,640], [320,568],
  [844,390], [667,375]
];
const origin = 'http://127.0.0.1:8765';
const browser = process.env.CHROME_BIN || 'google-chrome';
const profile = mkdtempSync(join(tmpdir(),'snowshift-v17-cdp-'));
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
  if(out.exceptionDetails)throw new Error('Browser JS exception: '+
    (out.exceptionDetails.exception?.description||out.exceptionDetails.text));
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
  const gateMessages=[];
  let hazardTurns=0,disabledOnHazard=[],phaseReadouts=[],stageStates=[],lapTransition=null;
  for(const [index,a] of actions.entries()){
    const surface=document.documentElement.dataset.surface;
    const hint=document.getElementById('accelNotationHint').textContent;
    const enabled=masterPad.querySelectorAll('button:not([disabled])').length;
    const phase=(index%6)+1,next=((index+1)%6)+1;
    const info={turn:index+1,surface,hint,enabled};
    stageStates.push(info);
    if(document.documentElement.dataset.hazards!=='moving')
      throw new Error('Arctic Grand Prix must use the rock clock on every turn');
    if(!hint.includes(phase+'→'+next))
      throw new Error('Missing real six-step rock phase on turn '+(index+1)+': '+hint);
    if(document.documentElement.dataset.biome!=='expert')
      throw new Error('Arctic Grand Prix lost its Eclipse Summit biome');
    if(['glass','coupled'].includes(surface) ? enabled!==5 : enabled!==9)
      throw new Error('Bad legal-vector count for '+surface+' on turn '+(index+1));
    if(index===4||index===5){
      if(surface!=='coupled'||!hint.includes('GLASS + WIND')||
         document.documentElement.dataset.coupled!=='true')
        throw new Error('Coupled glass and wind not explained on turn '+(index+1));
    }
    if(index===13 && (surface!=='boost'||!hint.includes('BOOST ←')))
      throw new Error('Return boost rule hidden on turn 14');
    if([14,15,41].includes(index) && surface!=='glass')
      throw new Error('Return Glass Ice not explained on turn '+(index+1));
    if([29,30,31].includes(index) && surface!=='coupled')
      throw new Error('Second-lap Glass + Wind is not marked at turn '+(index+1));
    if(index===39 && surface!=='boost')
      throw new Error('Second-lap boost must be disclosed on turn 40');
    hazardTurns++;
    disabledOnHazard.push(9-enabled);
    phaseReadouts.push(hint);
    const button=document.querySelector('#accelerationPad [data-x="'+a.x+'"][data-y="'+a.y+'"]');
    if(!button) throw new Error('Missing acceleration button');
    button.click();
    document.getElementById('commit').click();
    const message=document.getElementById('message').textContent;
    if(message.includes('GATE CLEARED'))gateMessages.push(message);
    if(index===27){
      lapTransition={
        label:document.getElementById('lap').textContent,
        message,
        toast:document.getElementById('eventToast').textContent,
        turns:document.getElementById('moves').textContent,
        score:document.getElementById('score').textContent,
        crashes:document.getElementById('crashes').textContent,
        velocity:[...document.querySelectorAll('#currentVelocity [data-component]')]
          .map(el=>Number(el.textContent)),
        commitEnabled:!document.getElementById('commit').disabled,
        recordAlreadyPresent:!!localStorage.getItem(recordKey)
      };
    }
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
    allColumns,nextHidden,hazardTurns,disabledOnHazard,phaseReadouts,stageStates,lapTransition
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
  const grand=grab();
  const frozen=switchTo('frozen-gauntlet');
  const moving=switchTo('broken-passage');
  const boost=switchTo('icebound-rapids');
  const wind=switchTo('crosswind-ridge');
  const northern=switchTo('northern-loop');
  const aurora=switchTo('aurora-split');
  const frost=switchTo('frost-chicane');
  const narrow=switchTo('narrow-passage');
  const hairpin=switchTo('hairpin-hollow');
  const twin=switchTo('twin-routes');
  const glass=switchTo('glass-ice');
  const restored=switchTo('arctic-grand-prix');
  return {grand,frozen,moving,boost,wind,northern,aurora,frost,narrow,hairpin,twin,glass,restored};
}
function inspectActiveWindBrowser(actions) {
  document.getElementById('reset').click();
  document.querySelector('[data-mode="master"]').click();
  for(const a of actions){
    const control=document.querySelector(
      '#accelerationPad [data-x="'+a.x+'"][data-y="'+a.y+'"]'
    );
    if(!control)throw new Error('Missing Master acceleration choice');
    control.click();
    document.getElementById('commit').click();
  }
  const pad=document.getElementById('accelerationPad');
  const current=[...document.querySelectorAll('#currentVelocity [data-component]')]
    .map(el=>el.textContent);
  return {
    turns:document.getElementById('moves').textContent,
    crashes:document.getElementById('crashes').textContent,
    current,
    surface:document.documentElement.dataset.surface,
    enabled:[...pad.querySelectorAll('button')].filter(b=>!b.disabled).length,
    labels:[...pad.querySelectorAll('button')].every(b=>b.getAttribute('aria-label')),
    banner:document.getElementById('message').textContent,
    notation:document.getElementById('accelNotationHint').textContent,
    master:pad.dataset.notation==='columns',
    hidden:document.getElementById('nextVelocity').dataset.hidden==='true',
    region:document.getElementById('biomeShort').textContent
  };
}

function compareWindMovementBrowser(actions) {
  document.getElementById('reset').click();
  document.querySelector('[data-mode="master"]').click();
  function advance(){
    for(const a of actions){
      document.querySelector('#accelerationPad [data-x="'+a.x+'"][data-y="'+a.y+'"]').click();
      document.getElementById('commit').click();
    }
  }
  function inspect(a){
    document.querySelector('#accelerationPad [data-x="'+a.x+'"][data-y="'+a.y+'"]').click();
    document.getElementById('commit').click();
    return {
      turns:document.getElementById('moves').textContent,
      crashes:document.getElementById('crashes').textContent,
      velocity:[...document.querySelectorAll('#currentVelocity [data-component]')]
        .map(e=>Number(e.textContent))
    };
  }
  advance();
  const uncancelled=inspect({x:0,y:0});
  document.getElementById('reset').click();
  advance();
  const corrected=inspect({x:0,y:1});
  return {uncancelled,corrected};
}

function compareBoostMovementBrowser(actions,west=false) {
  document.getElementById('reset').click();
  document.querySelector('[data-mode="master"]').click();
  function drive(){
    for(const a of actions){
      document.querySelector('#accelerationPad [data-x="'+a.x+'"][data-y="'+a.y+'"]').click();
      document.getElementById('commit').click();
    }
  }
  function inspect(a){
    document.querySelector('#accelerationPad [data-x="'+a.x+'"][data-y="'+a.y+'"]').click();
    document.getElementById('commit').click();
    return {
      turns:document.getElementById('moves').textContent,
      crashes:document.getElementById('crashes').textContent,
      velocity:[...document.querySelectorAll('#currentVelocity [data-component]')].map(e=>Number(e.textContent))
    };
  }
  drive();const coast=inspect({x:0,y:0});
  document.getElementById('reset').click();drive();
  const braking=inspect(west?{x:1,y:-1}:{x:-1,y:0});
  return {coast,braking};
}
function crashIntoMovingBasaltBrowser(){
  document.getElementById('reset').click();
  document.querySelector('[data-mode="master"]').click();
  const glide=(x,y)=>{
    const control=document.querySelector('#accelerationPad [data-x="'+x+'"][data-y="'+y+'"]');
    if(!control)throw new Error('Missing Master matrix for rock collision');
    control.click();document.getElementById('commit').click();
  };
  glide(1,-1);glide(1,1);glide(1,0);glide(1,0);
  const before=document.getElementById('message').textContent;
  glide(-1,0); // Driveable bank path, but slab intersects the fifth glide.
  return {
    before,
    turns:document.getElementById('moves').textContent,
    crashes:document.getElementById('crashes').textContent,
    score:document.getElementById('score').textContent,
    velocity:[...document.querySelectorAll('#currentVelocity [data-component]')]
      .map(x=>Number(x.textContent)),
    phase:document.getElementById('accelNotationHint').textContent,
    toast:document.getElementById('eventToast').textContent,
    nextHidden:document.getElementById('nextVelocity').dataset.hidden==='true'
  };
}
function crashIntoGlacierBrowser() {
  document.getElementById('reset').click();
  document.getElementById('mapPicker').click();
  document.querySelector('[data-circuit="twin-routes"]').click();
  const drive=(x,y)=>{
    document.querySelector('#accelerationPad [data-x="'+x+'"][data-y="'+y+'"]').click();
    document.getElementById('commit').click();
  };
  drive(1,1);
  drive(1,0);
  drive(1,0);
  return {
    turns:document.getElementById('moves').textContent,
    crashes:document.getElementById('crashes').textContent,
    score:document.getElementById('score').textContent,
    velocity:[...document.querySelectorAll('#currentVelocity [data-component]')]
      .map(e=>e.textContent),
    toast:document.getElementById('eventToast').textContent
  };
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
      await send('Page.navigate',{url:origin+'/race-v17.html?qa=1&track=arctic-grand-prix'});
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
      // The smallest portrait and landscape screens use a compact 3×4
      // selector. Preserve screenshots of the OPEN menu for actual readability
      // QA, not just bounding-box assertions.
      if(size==='320x568'||size==='667x375'){
        await send('Page.navigate',{url:origin+'/race-v17.html?track=arctic-grand-prix'});
        await waitFor(send,async()=>{
          const ready=await evaluation(send,
            'document.readyState==="complete" && document.querySelectorAll("#mapMenu .map-option").length===12');
          return ready?true:null;
        });
        await evaluation(send,'document.getElementById("mapPicker").click()');
        await delay(180);
        const menuPng=await send('Page.captureScreenshot',{
          format:'png',captureBeyondViewport:false,fromSurface:true
        });
        writeFileSync('screenshots/snowshift-v17-open-menu-'+size+'.png',
          Buffer.from(menuPng.data,'base64'));
      }
      if(size==='1440x900'||size==='390x844'||size==='844x390'){
        await send('Page.navigate',{url:origin+'/race-v17.html?track=arctic-grand-prix'});
        await waitFor(send,async()=>{
          const ready=await evaluation(send,'document.readyState==="complete" && document.querySelectorAll("#accelerationPad button").length===9');
          return ready?true:null;
        });
        await delay(650);
        const screenshot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
        writeFileSync('screenshots/snowshift-v17-'+size+'.png',Buffer.from(screenshot.data,'base64'));
        await evaluation(send,'document.querySelector(\'[data-mode="master"]\').click()');
        await delay(150);
        const masterScreenshot=await send('Page.captureScreenshot',{
          format:'png',captureBeyondViewport:false,fromSurface:true
        });
        writeFileSync('screenshots/snowshift-v17-master-'+size+'.png',
          Buffer.from(masterScreenshot.data,'base64'));
      }
    }finally{
      ws.close();
      await fetch('http://127.0.0.1:'+port+'/json/close/'+target.id).catch(()=>{});
    }
  }

  // Full-lap browser integration: real UI buttons, no physics API shortcuts.
  // Reduced motion removes gliding delays without changing the deterministic engine.
  const actions=ARCTIC_GRAND_PRIX_CLEAR_RACE;
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
    await send('Page.navigate',{url:origin+'/race-v17.html?track=arctic-grand-prix'});
    await waitFor(send,async()=>{
      const ready=await evaluation(send,
        'document.readyState==="complete" && document.querySelectorAll("#accelerationPad button").length===9');
      return ready?true:null;
    });
    const script='('+playLegalLapInBrowser.toString()+')('+
      JSON.stringify(actions)+','+JSON.stringify(recordKeyForCircuit(ARCTIC_GRAND_PRIX.id))+')';
    const lap=await evaluation(send,script);
    if(!lap.record || lap.record.moves!==actions.length ||
       lap.record.frames?.length!==actions.length+1 ||
       lap.record.score!==actions.length ||
       !lap.commitDisabled || lap.crashes!=='00' ||
       lap.gateMessages.length!==6 || !lap.ghostHidden ||
       !lap.masterSelected || !lap.allColumns || !lap.nextHidden ||
       lap.hazardTurns!==actions.length || lap.stageStates?.length!==actions.length ||
       !lap.phaseReadouts.every((text,i)=>text.includes((i%6+1)+'→'+((i+1)%6+1))) ||
       lap.stageStates[4]?.surface!=='coupled' ||
       lap.stageStates[5]?.surface!=='coupled' ||
       lap.stageStates[13]?.surface!=='boost' ||
       lap.stageStates[14]?.surface!=='glass' ||
       lap.stageStates[15]?.surface!=='glass' ||
       lap.stageStates[29]?.surface!=='coupled' ||
       lap.stageStates[30]?.surface!=='coupled' ||
       lap.stageStates[31]?.surface!=='coupled' ||
       lap.stageStates[39]?.surface!=='boost' ||
       lap.stageStates[41]?.surface!=='glass' ||
       lap.lapTransition?.label!=='LAP 2 / 2' ||
       lap.lapTransition?.turns!=='28' ||
       lap.lapTransition?.crashes!=='00' ||
       lap.lapTransition?.velocity.join(',')!=='1,0' ||
       !lap.lapTransition?.message.includes('LAP ONE COMPLETE') ||
       !lap.lapTransition?.toast.includes('LAP 1 COMPLETE') ||
       !lap.lapTransition?.commitEnabled || lap.lapTransition?.recordAlreadyPresent){
      console.error('FAIL full-lap browser integration',lap,'expected moves',actions.length);
      failed++;
    }else{
      console.log('PASS Arctic Grand Prix two-lap Master race',actions.length,'moves / BOTH laps / three timed sentinels / six ordered gates / coupled Glass+Wind / boosted return / personal best');
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
    writeFileSync('screenshots/snowshift-v17-personal-ghost.png',
      Buffer.from(ghostPng.data,'base64'));
    // After finishing, the Glass Ice personal best remains on its own map.
    await evaluation(send,'document.getElementById("reset").click();document.querySelector(\'[data-mode="guided"]\').click()');
    const records=await evaluation(send,'('+verifyCircuitRecordsBrowser.toString()+')()');
    if(records.grand.name!=='ARCTIC GRAND PRIX' || records.grand.ghostHidden ||
       /PB —/.test(records.grand.badge) ||
       records.frozen.score!=='00' || !records.frozen.ghostHidden ||
       !/PB —/.test(records.frozen.badge) ||
       records.moving.score!=='00' || !records.moving.ghostHidden ||
       !/PB —/.test(records.moving.badge) ||
       records.boost.score!=='00' || !records.boost.ghostHidden ||
       !/PB —/.test(records.boost.badge) ||
       records.wind.score!=='00' || !records.wind.ghostHidden ||
       !/PB —/.test(records.wind.badge) ||
       records.northern.score!=='00' || !records.northern.ghostHidden ||
       !/PB —/.test(records.northern.badge) ||
       records.aurora.score!=='00' || !records.aurora.ghostHidden ||
       !/PB —/.test(records.aurora.badge) ||
       records.frost.score!=='00' || !records.frost.ghostHidden ||
       !/PB —/.test(records.frost.badge) ||
       records.narrow.score!=='00' || !records.narrow.ghostHidden ||
       !/PB —/.test(records.narrow.badge) ||
       records.hairpin.score!=='00' || !records.hairpin.ghostHidden ||
       !/PB —/.test(records.hairpin.badge) ||
       records.twin.score!=='00' || !records.twin.ghostHidden ||
       !/PB —/.test(records.twin.badge) ||
       records.glass.score!=='00' || !records.glass.ghostHidden ||
       !/PB —/.test(records.glass.badge) ||
       records.restored.name!=='ARCTIC GRAND PRIX' ||
       records.restored.ghostHidden || /PB —/.test(records.restored.badge)){
      console.error('FAIL twelve independent personal best records',records);
      failed++;
    }else{
      console.log('PASS twelve independent personal bests: Grand Prix champion record preserved');
    }

    // Check actual combined rules using the Master-mode controls, not just
    // engine functions. A coupled field enables only five buttons but still
    // applies southward force; the rock clock remains public.
    const coupled=await evaluation(send,'('+inspectActiveWindBrowser.toString()+')('+
      JSON.stringify(GRAND_PRIX_LAP_ONE.slice(0,4))+')');
    if(coupled.turns!=='04'||coupled.crashes!=='00'||
       coupled.surface!=='coupled'||coupled.enabled!==5||
       !coupled.notation.includes('GLASS + WIND')||
       !coupled.notation.includes('5→6')||
       !coupled.banner.includes('GLASS 1 AXIS + WIND')||
       coupled.current.join(',')!=='3,1'||
       !coupled.master||!coupled.hidden||coupled.region!=='ECLIPSE'){
      console.error('FAIL Expert simultaneous Glass+Wind Master teaching state',coupled);failed++;
    }else console.log('PASS paired Glass+Wind in Master: only five options, public -1 south force');
    await delay(200);
    const combinedPng=await send('Page.captureScreenshot',{
      format:'png',captureBeyondViewport:false,fromSurface:true
    });
    writeFileSync('screenshots/snowshift-v17-coupled-glass-wind-master.png',
      Buffer.from(combinedPng.data,'base64'));
    const windGlass=await evaluation(send,'('+inspectActiveWindBrowser.toString()+')('+
      JSON.stringify(GRAND_PRIX_LAP_ONE.slice(0,6))+')');
    if(windGlass.turns!=='06'||windGlass.crashes!=='00'||
       windGlass.current.join(',')!=='4,0'||
       windGlass.notation.includes('GLASS + WIND')||
       !windGlass.master||!windGlass.hidden){
      console.error('FAIL two valid coupled moves do not produce correct final velocity',windGlass);failed++;
    }else console.log('PASS coupled Glass+Wind arithmetic: v=(3,1) to (4,0)');

    const timedBoost=await evaluation(send,'('+inspectActiveWindBrowser.toString()+')('+
      JSON.stringify(GRAND_PRIX_LAP_ONE.slice(0,13))+')');
    if(timedBoost.turns!=='13'||timedBoost.crashes!=='00'||
       timedBoost.surface!=='boost'||timedBoost.enabled!==9||
       !timedBoost.notation.includes('BOOST ←')||
       !timedBoost.banner.includes('BOOST ←')||
       timedBoost.current.join(',')!=='-3,-1'||
       !timedBoost.master||!timedBoost.hidden){
      console.error('FAIL timed boosted return stage',timedBoost);failed++;
    }else console.log('PASS boosted rock crossing: published (-2,0) with six-phase timing');
    await delay(200);
    const boostedPng=await send('Page.captureScreenshot',{
      format:'png',captureBeyondViewport:false,fromSurface:true
    });
    writeFileSync('screenshots/snowshift-v17-timed-boost-master.png',
      Buffer.from(boostedPng.data,'base64'));
    const returnIce=await evaluation(send,'('+inspectActiveWindBrowser.toString()+')('+
      JSON.stringify(GRAND_PRIX_LAP_ONE.slice(0,14))+')');
    if(returnIce.turns!=='14'||returnIce.crashes!=='00'||
       returnIce.surface!=='glass'||returnIce.enabled!==5||
       !returnIce.notation.includes('GLASS 1 AXIS')||
       returnIce.current.join(',')!=='-4,0'||
       !returnIce.master||!returnIce.hidden){
      console.error('FAIL return Glass Ice after boost',returnIce);failed++;
    }else console.log('PASS boost to Glass Ice transition without extra hidden rules');

    // Track 10 remains playable after introducing the Expert finale.
    await evaluation(send,
      'document.getElementById("mapPicker").click();document.querySelector("[data-circuit=broken-passage]").click()');

    // The two six-step shuttles are real, not decorative barriers.
    const phaseInfo=await evaluation(send,'('+inspectActiveWindBrowser.toString()+')('+
      JSON.stringify(BROKEN_PASSAGE_CLEAR_LAP.slice(0,5))+')');
    if(phaseInfo.turns!=='05'||phaseInfo.crashes!=='00'||
       phaseInfo.surface!=='moving'||phaseInfo.enabled!==9||
       !phaseInfo.notation.includes('ROCKS 6→1')||
       !phaseInfo.banner.includes('ROCK PHASE 6→1')||
       !phaseInfo.master||!phaseInfo.hidden||
       phaseInfo.region!=='EMBER RIFT'){
      console.error('FAIL timed rocks Master HUD',phaseInfo);failed++;
    }else console.log('PASS active moving rocks: six-step phase, all controls and hidden next velocity');
    await delay(180);
    const movingShot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
    writeFileSync('screenshots/snowshift-v17-active-moving-rocks-master.png',
      Buffer.from(movingShot.data,'base64'));
    const rock=await evaluation(send,'('+crashIntoMovingBasaltBrowser.toString()+')()');
    if(rock.turns!=='05'||rock.crashes!=='01'||rock.score!=='08'||
       rock.velocity.join(',')!=='0,0'||!rock.toast.includes('MOVING BASALT')||
       !rock.before.includes('ROCK PHASE 5→6')||
       !rock.phase.includes('ROCKS 6→1')||!rock.nextHidden){
      console.error('FAIL moving basalt intercept/crash/clock advance',rock);
      failed++;
    }else console.log('PASS real moving-rock crash: bank-legal glide intercepted, +3, clock progresses');

    // Preserve all Track 09 boost QA in the V15 runtime.
    await evaluation(send,
      'document.getElementById("mapPicker").click();document.querySelector("[data-circuit=icebound-rapids]").click()');

    // Test BOTH signed strips through the actual Master-mode buttons, with
    // public pad information and hidden future velocities.
    const boostInfo=await evaluation(send,'('+inspectActiveWindBrowser.toString()+')('+
      JSON.stringify(ICEBOUND_RAPIDS_CLEAR_LAP.slice(0,4))+')');
    if(boostInfo.turns!=='04'||boostInfo.crashes!=='00'||
       boostInfo.surface!=='boost'||boostInfo.enabled!==9||
       !boostInfo.notation.includes('BOOST →')||!boostInfo.banner.includes('BOOST')||
       !boostInfo.master||!boostInfo.hidden||
       boostInfo.current.join(',')!=='3,0'||boostInfo.region!=='EMBER RIFT'){
      console.error('FAIL active east boost Master mode',boostInfo);failed++;
    }else console.log('PASS Ember Rift east boost disclosed in Master without predictions');
    await delay(180);
    const boostPic=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
    writeFileSync('screenshots/snowshift-v17-active-east-boost-master.png',Buffer.from(boostPic.data,'base64'));
    const east=await evaluation(send,'('+compareBoostMovementBrowser.toString()+')('+
      JSON.stringify(ICEBOUND_RAPIDS_CLEAR_LAP.slice(0,4))+',false)');
    if(east.coast.turns!=='05'||east.coast.crashes!=='00'||
       east.coast.velocity.join(',')!=='5,0'||
       east.braking.turns!=='05'||east.braking.crashes!=='00'||
       east.braking.velocity.join(',')!=='4,0'){
      console.error('FAIL east boost +2 arithmetic',east);failed++;
    }else console.log('PASS east pad: coast -> 5, brake -> 4 velocity');

    const westInfo=await evaluation(send,'('+inspectActiveWindBrowser.toString()+')('+
      JSON.stringify(ICEBOUND_RAPIDS_CLEAR_LAP.slice(0,14))+')');
    if(westInfo.turns!=='14'||westInfo.crashes!=='00'||
       westInfo.surface!=='boost'||westInfo.enabled!==9||
       !westInfo.notation.includes('BOOST ←')||!westInfo.banner.includes('BOOST')||
       !westInfo.master||!westInfo.hidden||
       westInfo.current.join(',')!=='-3,0'||westInfo.region!=='EMBER RIFT'){
      console.error('FAIL active west boost Master mode',westInfo);failed++;
    }else console.log('PASS Ember Rift west boost disclosed in Master without predictions');
    await delay(180);
    const westPic=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
    writeFileSync('screenshots/snowshift-v17-active-west-boost-master.png',Buffer.from(westPic.data,'base64'));
    const west=await evaluation(send,'('+compareBoostMovementBrowser.toString()+')('+
      JSON.stringify(ICEBOUND_RAPIDS_CLEAR_LAP.slice(0,14))+',true)');
    if(west.coast.turns!=='15'||west.coast.crashes!=='00'||
       west.coast.velocity.join(',')!=='-5,0'||
       west.braking.turns!=='15'||west.braking.crashes!=='00'||
       west.braking.velocity.join(',')!=='-4,-1'){
      console.error('FAIL west boost -2 arithmetic',west);failed++;
    }else console.log('PASS west pad: coast -> -5, brake -> (-4,-1)');

    await evaluation(send,'document.getElementById("mapPicker").click();document.querySelector("[data-circuit=crosswind-ridge]").click()');

    // Photograph the real Southwind field in Master without revealing v_next.
    const inspection=await evaluation(send,'('+inspectActiveWindBrowser.toString()+')('+
      JSON.stringify(CROSSWIND_RIDGE_CLEAR_LAP.slice(0,4))+')');
    if(inspection.turns!=='04'||inspection.crashes!=='00'||
       inspection.surface!=='wind'||inspection.enabled!==9||
       !inspection.labels||!inspection.banner.includes('COUNTER')||
       !inspection.notation.includes('WIND')||
       !inspection.master||!inspection.hidden||
       inspection.current.join(',')!=='3,0'||
       inspection.region!=='AURORA'){
      console.error('FAIL active wind vector in Master mode',inspection);
      failed++;
    }else{
      console.log('PASS wind field: Master shows force, keeps nine controls, hides prediction');
    }
    await delay(220);
    const windPng=await send('Page.captureScreenshot',{
      format:'png',captureBeyondViewport:false,fromSurface:true
    });
    writeFileSync('screenshots/snowshift-v17-active-wind-master.png',
      Buffer.from(windPng.data,'base64'));

    const counter=await evaluation(send,'('+compareWindMovementBrowser.toString()+')('+
      JSON.stringify(CROSSWIND_RIDGE_CLEAR_LAP.slice(0,4))+')');
    if(counter.uncancelled.turns!=='05'||counter.uncancelled.crashes!=='00'||
       counter.uncancelled.velocity.join(',')!=='3,-1'||
       counter.corrected.turns!=='05'||counter.corrected.crashes!=='00'||
       counter.corrected.velocity.join(',')!=='3,0'){
      console.error('FAIL real Master vector controls do not reflect wind and counterwind',counter);
      failed++;
    }else{
      console.log('PASS actual wind arithmetic: coast yields v=(3,-1); a=(0,+1) yields v=(3,0)');
    }

    const glacierCrash=await evaluation(send,'('+crashIntoGlacierBrowser.toString()+')()');
    if(glacierCrash.turns!=='03' || glacierCrash.crashes!=='01' ||
       glacierCrash.score!=='06' || glacierCrash.velocity.join(',')!=='0,0' ||
       !/SNOWBANK/.test(glacierCrash.toast)){
      console.error('FAIL glacier divider solid-segment collision',glacierCrash);
      failed++;
    }else{
      console.log('PASS impassable glacial divider: real control collision and +3 penalty');
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


  // Four complete scene renderings, using the same training geometry, are
  // compared pixel-by-pixel. Expert now hosts the real Grand Prix finale.
  const galleryResponse=await fetch('http://127.0.0.1:'+port+'/json/new?about:blank',{method:'PUT'});
  if(!galleryResponse.ok)throw new Error('Could not create biome comparison page');
  const galleryTarget=await galleryResponse.json();
  const gallerySocket=await openSocket(galleryTarget.webSocketDebuggerUrl);
  const gallerySend=protocol(gallerySocket);
  try{
    await gallerySend('Page.enable');
    await gallerySend('Runtime.enable');
    await gallerySend('Emulation.setDeviceMetricsOverride',{
      width:1440,height:1950,deviceScaleFactor:1,mobile:false,
      screenWidth:1440,screenHeight:1950
    });
    await gallerySend('Page.navigate',{url:origin+'/theme-gallery.html'});
    await waitFor(gallerySend,async()=>{
      const count=await evaluation(gallerySend,
        'document.readyState==="complete" && document.querySelectorAll("main canvas").length===4');
      return count?true:null;
    });
    await delay(850); // allow all reused SVG textures to finish loading
    const imageProof=await evaluation(gallerySend,`(()=>{
      const ids=['beginner','intermediate','advanced','expert'];
      return ids.map(id=>{
        const canvas=document.getElementById('preview-'+id);
        const ctx=canvas.getContext('2d');
        const pixel=(x,y)=>Array.from(ctx.getImageData(x,y,1,1).data);
        return {id,road:pixel(460,180),ground:pixel(50,50),drawn:pixel(490,350)[3]===255};
      });
    })()`);
    if(!imageProof?.every(p=>p.drawn) ||
       new Set(imageProof.map(p=>p.road.join(','))).size!==4 ||
       new Set(imageProof.map(p=>p.ground.join(','))).size!==4) {
      console.error('FAIL four visually distinct biome palettes',imageProof);
      failed++;
    }else{
      console.log('PASS four uniquely coloured worlds: road AND exterior, same course geometry',imageProof);
    }
    const galleryPng=await gallerySend('Page.captureScreenshot',{
      format:'png',captureBeyondViewport:true,fromSurface:true
    });
    writeFileSync('screenshots/snowshift-v17-four-biome-gallery.png',
      Buffer.from(galleryPng.data,'base64'));
  }finally{
    gallerySocket.close();
    await fetch('http://127.0.0.1:'+port+'/json/close/'+galleryTarget.id).catch(()=>{});
  }

  if(failed)throw new Error(failed+' actual viewport check(s) failed');
}
try{await main();}catch(error){console.error(error);process.exitCode=1;}finally{quit();}
