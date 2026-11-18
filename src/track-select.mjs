import { CIRCUITS } from './circuit.mjs';
import { renderColumnVector } from './vector-notation.mjs';
import { forceDirection } from './force-notation.mjs';
import { biomeForCircuit, tierFromLevel } from './biomes.mjs';
import { parseGameSettings, raceUrl } from './pass-play.mjs';
import { CAR_STYLES, BODY_COLORS, TRIM_COLORS, normalizeCar,
  decodeCars, encodeCars, loadSoloCar, saveSoloCar, paintCarPreview, styleName
} from './car-customization.mjs';

const params = new URLSearchParams(location.search);
const settings = parseGameSettings(params);
const multiplayer = settings.gameType === 'pass-play';
let playerCount = settings.players;
const $ = id => document.getElementById(id);
let selectedPlayer=0;
let cars=decodeCars(params.get('cars'),4);
// A solo player's design is remembered on this device, not uploaded anywhere.
const storage=(()=>{try{return window.localStorage}catch{return null}})();
if(!params.has('cars')&&!multiplayer)cars[0]=loadSoloCar(storage);

$('playerSetup').hidden = !multiplayer;
$('modeKicker').textContent = multiplayer ? 'PASS & PLAY / CHOOSE A CIRCUIT' : 'SINGLE PLAYER / CHOOSE A CIRCUIT';
$('modeDescription').textContent = multiplayer
  ? 'Customise each player’s car, then choose one of the twelve circuits. Take turns on the same device — lowest score wins.'
  : 'Customise your car, then choose a circuit to race for a personal best. The design changes appearance, never the physics.';

const tiers = [
  { id:'beginner', title:'BEGINNER', summary:'Learn velocity, turns and careful braking' },
  { id:'intermediate', title:'INTERMEDIATE', summary:'Bigger decisions, trickier bends and new forces' },
  { id:'advanced', title:'ADVANCED', summary:'Boost strips, moving rocks and combined mechanics' },
  { id:'expert', title:'EXPERT', summary:'The two-lap Arctic Grand Prix finale' }
];
const anchors=[];
for (const tier of tiers) {
  const section=document.createElement('section');
  section.className='region';
  section.dataset.tier=tier.id;
  const heading=document.createElement('div');
  heading.className='region-head';
  const title=document.createElement('h2');
  title.textContent=tier.title;
  const desc=document.createElement('p');
  desc.textContent=tier.summary;
  heading.append(title,desc);
  section.appendChild(heading);
  const cards=document.createElement('div');
  cards.className='cards';
  CIRCUITS.forEach((circuit,index) => {
    if(tierFromLevel(circuit.level)!==tier.id)return;
    const biome=biomeForCircuit(circuit);
    const card=document.createElement('a');
    card.className='track-card';
    card.dataset.circuit=circuit.id;
    card.setAttribute('aria-label','Circuit '+(index+1)+': '+circuit.name+', '+circuit.level+' in '+biome.name);
    const number=document.createElement('span');
    number.className='track-no';
    number.textContent=String(index+1).padStart(2,'0');
    const level=document.createElement('small');
    level.textContent=circuit.level+' · '+biome.name.toUpperCase();
    const name=document.createElement('strong');
    name.textContent=circuit.name.toUpperCase();
    const hint=document.createElement('p');
    hint.textContent=circuit.tagline||circuit.menuHint||'Vector racing challenge';
    const effects=document.createElement('div');
    effects.className='card-effects';
    const seen=new Set();
    for(const [kind,zones] of [['WIND',circuit.windZones??[]],['BOOST',circuit.boostZones??[]]]){
      for(const zone of zones){
        const key=kind+':'+zone.vector.x+','+zone.vector.y;
        if(seen.has(key))continue;
        seen.add(key);
        const badge=document.createElement('span');
        badge.className='card-force';
        const title=document.createElement('span');
        title.textContent=kind+' '+forceDirection(zone.vector);
        const vector=document.createElement('strong');
        renderColumnVector(vector,zone.vector,{name:kind+' added to velocity'});
        badge.append(title,vector);
        effects.appendChild(badge);
      }
    }
    const start=document.createElement('span');
    start.className='start';
    start.textContent='RACE THIS TRACK ↗';
    card.append(number,level,name,hint);
    if(seen.size)card.appendChild(effects);
    card.appendChild(start);
    cards.appendChild(card);
    anchors.push({card,circuit});
  });
  section.appendChild(cards);
  $('trackList').appendChild(section);
}


function changeCar(patch){
  cars[selectedPlayer]=normalizeCar({...cars[selectedPlayer],...patch},selectedPlayer);
  if(!multiplayer)saveSoloCar(storage,cars[0]);
  renderGarage();
}

for(const style of CAR_STYLES){
  const button=document.createElement('button');
  button.type='button';
  button.className='style-option';
  button.dataset.style=style.id;
  const title=document.createElement('strong');title.textContent=style.name;
  const small=document.createElement('small');small.textContent=style.description;
  button.append(title,small);
  button.addEventListener('click',()=>changeCar({style:style.id}));
  $('styleChoices').appendChild(button);
}
function fillSwatches(id,colours,part){
  const container=$(id);
  for(const colour of colours){
    const button=document.createElement('button');
    button.type='button';
    button.className='paint-choice';
    button.dataset.part=part;
    button.dataset.colour=colour;
    button.style.setProperty('--colour',colour);
    button.setAttribute('aria-label',colour+' '+part+' colour');
    button.title=colour+' '+part+' colour';
    button.addEventListener('click',()=>changeCar({[part]:colour}));
    container.appendChild(button);
  }
}
fillSwatches('bodyColours',BODY_COLORS,'body');
fillSwatches('trimColours',TRIM_COLORS,'trim');
$('customBody').addEventListener('input',value=>changeCar({body:value.target.value}));
$('customTrim').addEventListener('input',value=>changeCar({trim:value.target.value}));

function renderLinks(){
  const count=multiplayer?playerCount:1;
  $('playerCountDisplay').textContent=String(playerCount);
  $('playerCount').value=String(playerCount);
  $('lessPlayers').disabled=playerCount===2;
  $('morePlayers').disabled=playerCount===4;
  for(const {card,circuit} of anchors)
    card.href=raceUrl(circuit.id,settings.gameType,playerCount,cars);
  const url=new URL(location.href);
  if(multiplayer)url.searchParams.set('players',String(playerCount));
  url.searchParams.set('cars',encodeCars(cars,count));
  history.replaceState(null,'',url);
}
function renderGarage(){
  const count=multiplayer?playerCount:1;
  if(selectedPlayer>=count)selectedPlayer=count-1;
  const roster=$('carRoster');
  roster.replaceChildren();
  roster.hidden=!multiplayer;
  if(multiplayer){
    for(let i=0;i<count;i++){
      const button=document.createElement('button');
      button.type='button';
      button.className='racer-option';
      button.setAttribute('aria-pressed',String(selectedPlayer===i));
      button.setAttribute('aria-label','Customise Player '+(i+1));
      button.dataset.player=String(i+1);
      const label=document.createElement('span');
      label.textContent='P'+(i+1);
      const thumb=document.createElement('canvas');
      thumb.width=100;thumb.height=48;
      thumb.setAttribute('aria-hidden','true');
      button.append(label,thumb);
      paintCarPreview(thumb,cars[i]);
      button.addEventListener('click',()=>{selectedPlayer=i;renderGarage()});
      roster.appendChild(button);
    }
  }
  const selected=cars[selectedPlayer];
  paintCarPreview($('carPreview'),selected);
  $('carPreviewName').textContent=(multiplayer?'PLAYER '+(selectedPlayer+1):'YOUR CAR')+
    ' · '+styleName(selected);
  $('carPreviewCaption').textContent=CAR_STYLES.find(s=>s.id===selected.style).description;
  for(const button of $('styleChoices').querySelectorAll('button'))
    button.setAttribute('aria-pressed',String(button.dataset.style===selected.style));
  for(const button of document.querySelectorAll('.paint-choice')){
    const part=button.dataset.part;
    button.setAttribute('aria-pressed',String(button.dataset.colour===selected[part]));
  }
  $('customBody').value=selected.body;
  $('customTrim').value=selected.trim;
  renderLinks();
}
$('lessPlayers').addEventListener('click',()=>{
  playerCount=Math.max(2,playerCount-1);renderGarage();
});
$('morePlayers').addEventListener('click',()=>{
  playerCount=Math.min(4,playerCount+1);renderGarage();
});
renderGarage();
