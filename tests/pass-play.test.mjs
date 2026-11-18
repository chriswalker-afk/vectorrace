import test from 'node:test';
import assert from 'node:assert/strict';
import { NORTHERN_LOOP, CROSSWIND_RIDGE, ARCTIC_GRAND_PRIX } from '../src/circuit.mjs';
import { createRace, score, takeTurn } from '../src/engine.mjs';
import {
  PLAYER_COLORS, parseGameSettings, raceUrl, selectUrl,
  createHotseat, playHotseatMove, nextHotseatPlayer,
  activateHotseatPlayer, hotseatFinished, hotseatStandings
} from '../src/pass-play.mjs';

test('mode and player count are safe on missing and malformed links',()=>{
  assert.deepEqual(parseGameSettings(''),{gameType:'single',players:2});
  assert.deepEqual(parseGameSettings('mode=pass-play&players=3'),{gameType:'pass-play',players:3});
  for(const bad of ['0','1','5','-1','nan','2.5','999','']){
    assert.equal(parseGameSettings('mode=pass-play&players='+bad).players,2);
  }
  assert.equal(parseGameSettings('mode=unknown&players=4').gameType,'single');
});

test('mode -> selector -> race retains the selected circuit and game type',()=>{
  assert.equal(selectUrl('single'),'./select-track.html?mode=single');
  assert.equal(selectUrl('pass-play',4),'./select-track.html?mode=pass-play&players=4');
  assert.equal(raceUrl('arctic-grand-prix'),'./race.html?track=arctic-grand-prix&mode=single');
  const multi=raceUrl('glass-ice','pass-play',3);
  const q=new URLSearchParams(multi.split('?')[1]);
  assert.deepEqual(parseGameSettings(q),{gameType:'pass-play',players:3});
  assert.equal(q.get('track'),'glass-ice');
  assert.throws(()=>raceUrl('../track'),TypeError);
});

test('new match starts 2–4 distinct states at identical fair positions',()=>{
  for(let n=2;n<=4;n++){
    const match=createHotseat(NORTHERN_LOOP,n);
    assert.equal(match.players.length,n);
    assert.equal(match.activeIndex,0);
    assert.deepEqual(match.players.map(p=>p.id),Array.from({length:n},(_,i)=>i+1));
    assert.deepEqual(match.players.map(p=>p.color),PLAYER_COLORS.slice(0,n));
    assert.deepEqual(match.players.map(p=>p.state.position),Array.from({length:n},()=>NORTHERN_LOOP.start));
    assert.ok(match.players.every(p=>p.state.moves===0 && p.frames.length===1));
    assert.notEqual(match.players[0].state,match.players[1].state);
    assert.notEqual(match.players[0].frames,match.players[1].frames);
  }
  assert.throws(()=>createHotseat(NORTHERN_LOOP,1),RangeError);
  assert.throws(()=>createHotseat(NORTHERN_LOOP,5),RangeError);
});

test('one glide changes only the active racer; next player keeps independent progress',()=>{
  let match=createHotseat(NORTHERN_LOOP,3);
  match=playHotseatMove(match,{x:1,y:0},NORTHERN_LOOP);
  assert.equal(match.players[0].state.moves,1);
  assert.deepEqual(match.players.slice(1).map(p=>p.state.moves),[0,0]);
  assert.equal(match.players[0].frames.length,2);
  assert.equal(nextHotseatPlayer(match),1);
  match=activateHotseatPlayer(match,1);
  match=playHotseatMove(match,{x:0,y:1},NORTHERN_LOOP);
  assert.equal(match.players[0].state.moves,1);
  assert.equal(match.players[1].state.moves,1);
  assert.equal(match.players[2].state.moves,0);
  match=activateHotseatPlayer(match,nextHotseatPlayer(match));
  assert.equal(match.activeIndex,2);
  match=playHotseatMove(match,{x:1,y:0},NORTHERN_LOOP);
  match=activateHotseatPlayer(match,nextHotseatPlayer(match));
  assert.equal(match.activeIndex,0);
  assert.equal(match.players[0].state.moves,1);
  assert.equal(match.players[0].frames.length,2);
});

test('a pass-play glide uses the exact unchanged race engine',()=>{
  for(const circuit of [NORTHERN_LOOP,CROSSWIND_RIDGE,ARCTIC_GRAND_PRIX]){
    const match=createHotseat(circuit,2);
    const a={x:1,y:0};
    const expected=takeTurn(createRace(circuit),a,circuit);
    const actual=playHotseatMove(match,a,circuit);
    assert.deepEqual(actual.players[0].state,expected);
    assert.equal(actual.players[0].frames.length,2);
    assert.deepEqual(actual.players[1].state,createRace(circuit));
    assert.equal(actual.players[1].frames.length,1);
  }
});

test('finished racers are skipped, remaining racer can keep taking turns',()=>{
  let match=createHotseat(NORTHERN_LOOP,4);
  match.players[1].state={...match.players[1].state,finished:true};
  match.players[3].state={...match.players[3].state,finished:true};
  assert.equal(nextHotseatPlayer(match),2);
  match=activateHotseatPlayer(match,2);
  assert.equal(nextHotseatPlayer(match),0);
  match.players[0].state={...match.players[0].state,finished:true};
  assert.equal(nextHotseatPlayer(match),2);
  assert.throws(()=>activateHotseatPlayer(match,1),RangeError);
  assert.equal(hotseatFinished(match),false);
  match.players[2].state={...match.players[2].state,finished:true};
  assert.equal(nextHotseatPlayer(match),-1);
  assert.equal(hotseatFinished(match),true);
});

test('rankings compare per-player turns + 3 per crash and honour ties',()=>{
  const circuit=NORTHERN_LOOP;
  const match=createHotseat(circuit,4);
  match.players[0].state={...match.players[0].state,finished:true,moves:15,crashes:1}; // 18
  match.players[1].state={...match.players[1].state,finished:true,moves:14,crashes:0}; // 14
  match.players[2].state={...match.players[2].state,finished:true,moves:11,crashes:1}; // 14
  match.players[3].state={...match.players[3].state,finished:true,moves:19,crashes:0}; // 19
  const standings=hotseatStandings(match,circuit);
  assert.deepEqual(standings.map(p=>[p.id,p.points,p.place]),[
    [2,14,1],[3,14,1],[1,18,3],[4,19,4]
  ]);
  for(const p of standings)assert.equal(p.points,score(p.state,circuit));
});
