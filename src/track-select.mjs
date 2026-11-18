import { CIRCUITS } from './circuit.mjs';
import { biomeForCircuit, tierFromLevel } from './biomes.mjs';
import { parseGameSettings, raceUrl } from './pass-play.mjs';

const params = new URLSearchParams(location.search);
const settings = parseGameSettings(params);
const multiplayer = settings.gameType === 'pass-play';
let playerCount = settings.players;
const $ = id => document.getElementById(id);

$('playerSetup').hidden = !multiplayer;
$('modeKicker').textContent = multiplayer ? 'PASS & PLAY / CHOOSE A CIRCUIT' : 'SINGLE PLAYER / CHOOSE A CIRCUIT';
$('modeDescription').textContent = multiplayer
  ? 'Race together on one device. Each player takes one vector glide and passes it on. Finish with the lowest score to win.'
  : 'Choose a course, then race for a personal best. Tracks increase in difficulty from Beginner to Expert.';

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
    const start=document.createElement('span');
    start.className='start';
    start.textContent='RACE THIS TRACK ↗';
    card.append(number,level,name,hint,start);
    cards.appendChild(card);
    anchors.push({card,circuit});
  });
  section.appendChild(cards);
  $('trackList').appendChild(section);
}

function renderLinks(){
  $('playerCountDisplay').textContent=String(playerCount);
  $('playerCount').value=String(playerCount);
  $('lessPlayers').disabled=playerCount===2;
  $('morePlayers').disabled=playerCount===4;
  for(const {card,circuit} of anchors)card.href=raceUrl(circuit.id, settings.gameType, playerCount);
  const url=new URL(location.href);
  if(multiplayer)url.searchParams.set('players',String(playerCount));
  history.replaceState(null,'',url);
}
$('lessPlayers').addEventListener('click',()=>{playerCount=Math.max(2,playerCount-1);renderLinks()});
$('morePlayers').addEventListener('click',()=>{playerCount=Math.min(4,playerCount+1);renderLinks()});
renderLinks();
