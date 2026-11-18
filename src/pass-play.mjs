import { createRace, takeTurn, score } from './engine.mjs';
import { normalizeCar, encodeCars } from './car-customization.mjs';

export const PLAYER_COLORS = Object.freeze(['#ff7557','#75dfff','#d4fc77','#e5abfa']);

export function parseGameSettings(search) {
  const query = search instanceof URLSearchParams ? search : new URLSearchParams(search);
  const gameType = query.get('mode') === 'pass-play' ? 'pass-play' : 'single';
  const raw = Number(query.get('players'));
  const players = gameType === 'pass-play' && Number.isInteger(raw) && raw >= 2 && raw <= 4 ? raw : 2;
  return { gameType, players };
}

export function raceUrl(trackId, gameType = 'single', count = 2, cars = null) {
  const validId = typeof trackId==='string' && /^[a-z0-9-]{1,48}$/.test(trackId);
  if(!validId)throw new TypeError('Invalid track identifier');
  const params = new URLSearchParams({track:trackId,mode:gameType==='pass-play'?'pass-play':'single'});
  if(gameType==='pass-play')params.set('players',String(Math.max(2,Math.min(4,count))));
  if(Array.isArray(cars))params.set('cars',encodeCars(cars,gameType==='pass-play'?count:1));
  return './race.html?'+params.toString();
}

export function selectUrl(gameType = 'single', count = 2, cars = null) {
  const params=new URLSearchParams({mode:gameType==='pass-play'?'pass-play':'single'});
  if(gameType==='pass-play')params.set('players',String(Math.max(2,Math.min(4,count))));
  if(Array.isArray(cars))params.set('cars',encodeCars(cars,gameType==='pass-play'?count:1));
  return './select-track.html?'+params.toString();
}

export function createHotseat(circuit, count = 2, cars = null) {
  if(!Number.isInteger(count)||count<2||count>4)throw new RangeError('Pass & Play requires 2–4 players');
  return {
    activeIndex:0,
    players:Array.from({length:count},(_,i)=>{
      const state=createRace(circuit);
      const car=normalizeCar(Array.isArray(cars)?cars[i]:null,i);
      return {id:i+1,name:'Player '+(i+1),color:car.body,car,state,
        heading:0,frames:[{...state.position}]};
    })
  };
}

export function playHotseatMove(match, acceleration, circuit) {
  const p=match.players[match.activeIndex];
  if(p.state.finished)return match;
  const after=takeTurn(p.state,acceleration,circuit);
  return {
    ...match,
    players:match.players.map((player,i)=>i===match.activeIndex?
      {...player,state:after,frames:[...player.frames,{...after.position}]}:player)
  };
}

export function nextHotseatPlayer(match) {
  const n=match.players.length;
  for(let offset=1;offset<=n;offset++){
    const i=(match.activeIndex+offset)%n;
    if(!match.players[i].state.finished)return i;
  }
  return -1;
}

export function activateHotseatPlayer(match,index) {
  if(!Number.isInteger(index)||index<0||index>=match.players.length||
    match.players[index].state.finished)throw new RangeError('Cannot activate an unavailable racer');
  return {...match,activeIndex:index};
}

export function hotseatFinished(match) {
  return match.players.every(p=>p.state.finished);
}

export function hotseatStandings(match,circuit) {
  const sorted=match.players.map(p=>({...p,points:score(p.state,circuit)}))
    .sort((a,b)=>a.points-b.points || a.state.crashes-b.state.crashes || a.id-b.id);
  return sorted.map((p,i)=>({...p,place:sorted.findIndex(q=>q.points===p.points)+1}));
}
