/**
 * Snowshift V18 browser QA: title -> mode -> all 12 tracks -> race and
 * three-player round-robin on 4 desktop/mobile CSS viewports.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const origin='http://127.0.0.1:8765';
const sizes=[[1440,900],[390,844],[320,568],[667,375]];
const profile=mkdtempSync(join(tmpdir(),'snowshift-v18-'));
const chrome=spawn(process.env.CHROME_BIN||'google-chrome',[
  '--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu',
  '--no-first-run','--remote-allow-origins=*','--remote-debugging-port=0',
  '--user-data-dir='+profile,'about:blank'
],{stdio:'ignore'});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
function quit(){
  if(chrome.exitCode===null)chrome.kill('SIGKILL');
  try{rmSync(profile,{recursive:true,force:true});}catch{}
}
function connect(url){
  return new Promise((resolve,reject)=>{
    const socket=new WebSocket(url);
    const alarm=setTimeout(()=>reject(new Error('CDP socket timed out')),7000);
    socket.addEventListener('open',()=>{clearTimeout(alarm);resolve(socket)},{once:true});
    socket.addEventListener('error',()=>{clearTimeout(alarm);reject(new Error('CDP socket error'))},{once:true});
  });
}
function commands(socket){
  let seq=0;
  const pending=new Map();
  socket.addEventListener('message',event=>{
    let value;try{value=JSON.parse(event.data)}catch{return}
    const entry=pending.get(value.id);
    if(!entry)return;
    pending.delete(value.id);
    if(value.error)entry.reject(new Error(value.error.message));
    else entry.resolve(value.result);
  });
  return (method,params={})=>new Promise((resolve,reject)=>{
    const id=++seq;
    pending.set(id,{resolve,reject});
    socket.send(JSON.stringify({id,method,params}));
    setTimeout(()=>{
      if(pending.has(id)){pending.delete(id);reject(new Error('CDP timeout '+method))}
    },12000);
  });
}
async function evaluate(send,expression){
  const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw new Error('Browser JS: '+(r.exceptionDetails.exception?.description||r.exceptionDetails.text));
  return r.result?.value;
}
async function until(send,expression,timeout=9000){
  const now=Date.now();
  while(Date.now()-now<timeout){
    if(await evaluate(send,expression))return;
    await delay(100);
  }
  throw new Error('Condition timed out: '+expression);
}
async function navigate(send,path,ready){
  await send('Page.navigate',{url:origin+path});
  await until(send,ready);
}
async function shot(send,name){
  mkdirSync('screenshots',{recursive:true});
  const png=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
  writeFileSync('screenshots/snowshift-v18-'+name+'.png',Buffer.from(png.data,'base64'));
}
function check(ok,why){if(!ok)throw new Error(why)}
async function verify(send,size){
  await navigate(send,'/index.html',
    'document.readyState==="complete" && document.querySelectorAll(".mode-card").length===2');
  const links=await evaluate(send,'[...document.querySelectorAll(".mode-card")].map(a=>a.getAttribute("href"))');
  check(links[0].includes('mode=single')&&links[1].includes('mode=pass-play'),'Wrong home mode order');
  await evaluate(send,'document.querySelectorAll(".mode-card")[0].click()');
  await until(send,'document.querySelectorAll(".track-card").length===12');
  const cards=await evaluate(send,'[...document.querySelectorAll(".region")].map(r=>r.querySelectorAll(".track-card").length)');
  const ids=await evaluate(send,'new Set([...document.querySelectorAll(".track-card")].map(c=>c.dataset.circuit)).size');
  check(cards.join(',')==='4,4,3,1'&&ids===12,'Bad / duplicate track list');
  check(await evaluate(send,'document.querySelectorAll("#styleChoices .style-option").length===4 && !!document.getElementById("carPreview")'),
    'Four body styles and live car preview not available');
  await evaluate(send,`(()=>{
    document.querySelector('#styleChoices [data-style="glider"]').click();
    const body=document.getElementById('customBody');
    body.value='#3488cc';body.dispatchEvent(new Event('input',{bubbles:true}));
    const trim=document.getElementById('customTrim');
    trim.value='#ffcc00';trim.dispatchEvent(new Event('input',{bubbles:true}));
  })()`);
  check(await evaluate(send,'document.getElementById("carPreviewName").textContent.includes("GLIDER") && location.search.includes("cars=glider-3488cc-ffcc00")'),
    'Solo garage choice did not update preview or track URL');
  if(size==='1440x900'||size==='390x844')await shot(send,'select-'+size);
  await evaluate(send,'document.querySelector("[data-circuit=frozen-gauntlet]").click()');
  await until(send,'document.getElementById("mapName")?.textContent==="FROZEN GAUNTLET" && document.querySelectorAll("#accelerationPad button").length===9');
  check(await evaluate(send,'document.documentElement.dataset.biome==="advanced" && location.search.includes("frozen-gauntlet")'),'Solo track incorrect');
  check(await evaluate(send,'document.documentElement.dataset.carStyle==="glider" && document.documentElement.dataset.carBody==="#3488cc" && document.documentElement.dataset.carTrim==="#ffcc00"'),
    'Selected solo car shape or paint was lost in the race');
  check(await evaluate(send,'!document.getElementById("mapMenu") && document.getElementById("playerStrip").hidden'),
    'In-game duplicate menu or solo multiplayer strip');
  check(!(await evaluate(send,'document.documentElement.scrollHeight>innerHeight+1 || document.documentElement.scrollWidth>innerWidth+1')),
    'Solo race needs document scrolling');
  await evaluate(send,'document.getElementById("homeLink").click()');
  await until(send,'document.querySelectorAll(".mode-card").length===2');
  check((await evaluate(send,'location.pathname')).endsWith('/index.html'),'Home did not return to title');
  await evaluate(send,'document.querySelectorAll(".mode-card")[0].click()');
  await until(send,'document.querySelectorAll(".track-card").length===12');
  check(await evaluate(send,'document.getElementById("customBody").value==="#3488cc" && document.getElementById("customTrim").value==="#ffcc00" && document.getElementById("carPreviewName").textContent.includes("GLIDER")'),
    'Solo design was not remembered after returning Home');
  await evaluate(send,'document.querySelector(".back-link").click()');
  await until(send,'document.querySelectorAll(".mode-card").length===2');

  await evaluate(send,'document.querySelectorAll(".mode-card")[1].click()');
  await until(send,'document.querySelectorAll(".track-card").length===12');
  check(await evaluate(send,'!document.getElementById("playerSetup").hidden'),'Pass & Play setup missing');
  await evaluate(send,'document.getElementById("morePlayers").click()');
  check(await evaluate(send,'document.getElementById("playerCountDisplay").textContent')==='3','Player count not updated');
  await evaluate(send,`(()=>{
    document.querySelector('#styleChoices [data-style="rally"]').click();
    document.querySelector('#bodyColours [data-colour="#f7518a"]').click();
    document.querySelector('#carRoster [data-player="2"]').click();
    document.querySelector('#styleChoices [data-style="glider"]').click();
    document.querySelector('#bodyColours [data-colour="#8098ff"]').click();
  })()`);
  check(await evaluate(send,'document.querySelector("#carRoster .racer-option:nth-child(2)").getAttribute("aria-pressed")==="true" && location.search.includes("rally-f7518a") && location.search.includes("glider-8098ff")'),
    'Pass & Play cars did not maintain independent designs');
  if(size==='390x844'||size==='1440x900')await shot(send,'multiplayer-garage-'+size);
  await evaluate(send,'document.querySelector("[data-circuit=northern-loop]").click()');
  await until(send,'document.documentElement.dataset.gameType==="pass-play" && document.querySelectorAll(".player-chip").length===3');
  check(await evaluate(send,'document.querySelectorAll(".player-chip").length')===3,'Not three racers');
  check(await evaluate(send,'document.documentElement.dataset.gameType==="pass-play"'),'Wrong game mode');
  check(await evaluate(send,'document.getElementById("message").textContent.startsWith("P1 · ")'),'Player 1 not active');
  check(await evaluate(send,'document.documentElement.dataset.carStyle==="rally" && document.documentElement.dataset.carBody==="#f7518a"'),
    'Player 1 chosen car was not drawn as active');
  check(!(await evaluate(send,'document.documentElement.scrollHeight>innerHeight+1 || document.documentElement.scrollWidth>innerWidth+1')),
    'Multiplayer race requires scrolling');
  await evaluate(send,'document.getElementById("commit").click()');
  await until(send,'!document.getElementById("handoffPanel").hidden',7000);
  check(await evaluate(send,'document.getElementById("handoffName").textContent')==='PLAYER 2','P1 -> P2 handoff failed');
  check(await evaluate(send,'document.querySelector("#handoffCarPreview")?.getContext("2d")?.getImageData(0,0,1,1)?.data[3]===255'),
    'Next player customised-car preview missing');
  check(await evaluate(send,'(()=>{ const e=document.querySelector(".handoff-card"); const r=e.getBoundingClientRect(); return r.top>=0 && r.bottom<=innerHeight+1 && e.scrollHeight<=e.clientHeight+1; })()'),'Handoff overlay clipped');
  if(size==='390x844'||size==='667x375')await shot(send,'handoff-'+size);
  await evaluate(send,'document.getElementById("beginTurn").click()');
  check(await evaluate(send,'document.getElementById("moves").textContent')==='00','P2 inherited P1 turns');
  check(await evaluate(send,'document.documentElement.dataset.carStyle==="glider" && document.documentElement.dataset.carBody==="#8098ff"'),
    'Player 2 did not receive their own car appearance');
  await evaluate(send,'document.getElementById("commit").click()');
  await until(send,'!document.getElementById("handoffPanel").hidden',7000);
  check(await evaluate(send,'document.getElementById("handoffName").textContent')==='PLAYER 3','P2 -> P3 failed');
  await evaluate(send,'document.getElementById("beginTurn").click()');
  await evaluate(send,'document.getElementById("commit").click()');
  await until(send,'!document.getElementById("handoffPanel").hidden',7000);
  check(await evaluate(send,'document.getElementById("handoffName").textContent')==='PLAYER 1','P3 -> P1 failed');
  await evaluate(send,'document.getElementById("beginTurn").click()');
  check(await evaluate(send,'document.getElementById("moves").textContent')==='01','P1 state was not retained');
  check(await evaluate(send,'document.documentElement.dataset.carStyle==="rally" && document.documentElement.dataset.carBody==="#f7518a"'),
    'Player 1 car appearance was lost after the turn cycle');
  await evaluate(send,'window.confirm=()=>true; document.getElementById("reset").click()');
  check(await evaluate(send,'document.getElementById("moves").textContent')==='00','Reset did not restart everyone');
  check(await evaluate(send,'document.documentElement.dataset.carStyle==="rally" && document.documentElement.dataset.carBody==="#f7518a"'),
    'Restart lost Player 1 custom paint');
  check(await evaluate(send,'[...document.querySelectorAll(".player-chip")].every(c=>c.textContent.endsWith(" 0"))'),
    'Reset did not clear scores');
  await evaluate(send,'document.getElementById("mapPicker").click()');
  await until(send,'document.querySelectorAll(".track-card").length===12');
  check(await evaluate(send,'location.search.includes("mode=pass-play") && location.search.includes("players=3")'),
    'Change Track did not preserve multiplayer setup');
  check(await evaluate(send,'location.search.includes("rally-f7518a") && location.search.includes("glider-8098ff") && document.querySelector("#carRoster .racer-option:nth-child(2)")'),
    'Change Track did not preserve each multiplayer car');
  console.log('PASS '+size+' car garage, solo persistence, 3 individual car skins, handoff, reset and track change');
}
async function main(){
  if(typeof WebSocket!=='function')throw new Error('Node 22 WebSocket required');
  let port=null;
  for(let i=0;i<120;i++){
    const file=join(profile,'DevToolsActivePort');
    if(existsSync(file)){port=Number(readFileSync(file,'utf8').split('\n')[0]);break}
    if(chrome.exitCode!==null)throw new Error('Chromium stopped before ready');
    await delay(100);
  }
  if(!port)throw new Error('Chromium DevTools port not created');
  for(const [width,height] of sizes){
    const response=await fetch('http://127.0.0.1:'+port+'/json/new?about:blank',{method:'PUT'});
    if(!response.ok)throw new Error('Could not open Chrome tab');
    const target=await response.json();
    const socket=await connect(target.webSocketDebuggerUrl);
    const send=commands(socket);
    try{
      await send('Page.enable');
      await send('Runtime.enable');
      await send('Emulation.setDeviceMetricsOverride',{
        width,height,deviceScaleFactor:1,mobile:width<=920,screenWidth:width,screenHeight:height
      });
      await send('Emulation.setEmulatedMedia',{
        features:[{name:'prefers-reduced-motion',value:'reduce'}]
      });
      await verify(send,width+'x'+height);
    }finally{
      socket.close();
      await fetch('http://127.0.0.1:'+port+'/json/close/'+target.id).catch(()=>{});
    }
  }
}
try{await main()}catch(error){console.error(error);process.exitCode=1}
finally{quit()}
