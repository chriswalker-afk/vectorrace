import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CIRCUITS, NORTHERN_LOOP, AURORA_SPLIT, FROST_CHICANE,
  NARROW_PASSAGE, HAIRPIN_HOLLOW, TWIN_ROUTES, GLASS_ICE, getCircuit
} from '../src/circuit.mjs';
import {
  createRace, onTrack, segmentOnTrack, takeTurn, previewMove, possibleMoves,
  glassIceZoneAt, accelerationAllowed
} from '../src/engine.mjs';
import {
  brakeRun, brakingForecast, corneringMessage, surfaceBrakingAcceleration
} from '../src/race-coach.mjs';
import { GLASS_ICE_CLEAR_LAP } from '../scripts/glass-ice-qa-route.mjs';
import { findLegalLap } from '../scripts/solve-lap.mjs';
import {
  MIN_RECOMMENDED_CLEARANCE, visualSkimmerPathClearance
} from '../scripts/track-clearance.mjs';

const p=(x,y)=>({x,y});

test('seven courses, with one Intermediate 3 single-patch Aurora circuit',()=>{
  assert.deepEqual(CIRCUITS.slice(0,7).map(c=>c.id),[
    'northern-loop','aurora-split','frost-chicane',
    'narrow-passage','hairpin-hollow','twin-routes','glass-ice'
  ]);
  assert.equal(getCircuit('glass-ice'),GLASS_ICE);
  for(const c of [NORTHERN_LOOP,AURORA_SPLIT,FROST_CHICANE,NARROW_PASSAGE,HAIRPIN_HOLLOW,TWIN_ROUTES])
    assert.equal(getCircuit(c.id),c);
  assert.equal(GLASS_ICE.level,'INTERMEDIATE 3');
  assert.equal(GLASS_ICE.glassZones.length,1);
  assert.equal(GLASS_ICE.glassZones[0].rule,'axis-only');
  assert.equal(GLASS_ICE.glassZones[0].id,'northern-glass');
  assert.equal(GLASS_ICE.obstacles,undefined);
  assert.deepEqual(GLASS_ICE.checkpoints.map(g=>g.id),['east','south','west']);
  assert.equal(GLASS_ICE.crashPenalty,3);
});

test('physical glass is visible on the road and triggers from turn-start position',()=>{
  const c=GLASS_ICE,z=c.glassZones[0];
  assert.equal(glassIceZoneAt(p(18,20),c),z);
  assert.equal(glassIceZoneAt(p(17,20),c),z,'painted edge is active');
  assert.equal(glassIceZoneAt(p(22,22.2),c),z);
  assert.equal(glassIceZoneAt(p(16,20),c),null);
  assert.equal(glassIceZoneAt(p(27,20),c),null);
  assert.equal(onTrack(p(18,20),c),true);
  assert.equal(onTrack(p(22,20),c),true);
  assert.equal(segmentOnTrack(p(16,20),p(27,20),c),true,
    'Glass is a legal piece of the racing road, not a collision island');
  assert.equal(z.polygon.length,4);
  assert.ok(c.featuredGlass.xMax-c.featuredGlass.xMin<=10);
});

test('exactly five acceleration vectors are available while ON glass',()=>{
  const c=GLASS_ICE,zoneState={...createRace(c),position:p(18,20),velocity:p(2,0)};
  const moves=possibleMoves(zoneState,c);
  assert.equal(moves.length,9,'the mathematical pad keeps its nine visible choices');
  assert.equal(moves.filter(m=>!m.zoneBlocked).length,5);
  const disallowed=moves.filter(m=>m.zoneBlocked);
  assert.equal(disallowed.length,4);
  assert.equal(disallowed.every(m=>!m.valid&&m.reason==='glass-axis-only'),true);
  for(const a of [p(-1,0),p(0,-1),p(0,0),p(1,0),p(0,1)]){
    assert.equal(accelerationAllowed(zoneState,a,c),true);
  }
  for(const a of [p(-1,-1),p(-1,1),p(1,-1),p(1,1)]){
    assert.equal(accelerationAllowed(zoneState,a,c),false);
  }
});

test('blocked diagonal is a NO-OP, not a crash or scoring penalty',()=>{
  const s={...createRace(GLASS_ICE),position:p(21,20),velocity:p(2,0),moves:4};
  const move=previewMove(s,p(-1,-1),GLASS_ICE);
  assert.equal(move.valid,false);
  assert.equal(move.zoneBlocked,true);
  assert.equal(move.surface,'northern-glass');
  const after=takeTurn(s,p(-1,-1),GLASS_ICE);
  assert.equal(after.moves,4);
  assert.equal(after.crashes,0);
  assert.deepEqual(after.position,s.position);
  assert.deepEqual(after.velocity,s.velocity);
  assert.match(after.lastEvent,/one axis/i);
  const legal=takeTurn(s,p(-1,0),GLASS_ICE);
  assert.equal(legal.moves,5);
  assert.equal(legal.crashes,0);
  assert.deepEqual(legal.velocity,p(1,0));
});

test('braking coach obeys glass restriction; slowing both axes takes longer',()=>{
  const on=p(20,20),v=p(1,1);
  assert.deepEqual(surfaceBrakingAcceleration(on,v,GLASS_ICE),p(-1,0));
  assert.deepEqual(surfaceBrakingAcceleration(on,v,HAIRPIN_HOLLOW),p(-1,-1));
  const glass=brakeRun(on,v,GLASS_ICE);
  const normal=brakeRun(on,v,HAIRPIN_HOLLOW);
  assert.equal(glass.safe,true);
  assert.equal(glass.steps,2);
  assert.deepEqual(glass.stop,p(20,21));
  assert.equal(normal.safe,true);
  assert.equal(normal.steps,1);
  assert.equal(glass.segments.every(m=>m.valid&&!m.zoneBlocked),true);
  const s={...createRace(GLASS_ICE),position:on,velocity:v};
  const forecast=brakingForecast(s,p(-1,-1),GLASS_ICE);
  assert.equal(forecast.risk,'glass');
  assert.match(corneringMessage(forecast),/GLASS ICE/);
  assert.equal(forecast.braking,null);
});

test('ordinary tracks keep all nine accelerations and original full physics',()=>{
  for(const circuit of CIRCUITS.slice(0,6)){
    assert.equal(glassIceZoneAt(circuit.start,circuit),null);
    const state={...createRace(circuit),position:p(13,19)};
    assert.equal(accelerationAllowed(state,p(-1,-1),circuit),true);
    assert.equal(accelerationAllowed(state,p(1,1),circuit),true);
    assert.equal(possibleMoves(state,circuit).every(m=>!m.zoneBlocked),true);
  }
});

test('24-move vehicle-clear lap demonstrates early braking while glass is active',()=>{
  let state=createRace(GLASS_ICE);
  const events=[];
  let glassTurns=0,glideSpeed=0,min=Infinity;
  for(const a of GLASS_ICE_CLEAR_LAP){
    const onGlass=glassIceZoneAt(state.position,GLASS_ICE);
    if(onGlass){
      glassTurns++;
      assert.ok(!a.x||!a.y,
        'QA route used illegal diagonal on glass at turn '+(state.moves+1));
      if(state.velocity.x>0&&a.x===-1)glideSpeed++;
    }
    const preview=previewMove(state,a,GLASS_ICE);
    assert.equal(preview.valid,true,'Illegal preview at turn '+(state.moves+1));
    assert.equal(preview.zoneBlocked,false);
    const clearance=visualSkimmerPathClearance(state.position,preview.to,GLASS_ICE);
    min=Math.min(min,clearance);
    assert.ok(clearance>=MIN_RECOMMENDED_CLEARANCE-1e-8,
      'Real skimmer scrapes bank on turn '+(state.moves+1)+': '+clearance);
    state=takeTurn(state,a,GLASS_ICE);
    assert.equal(state.crashes,0,'Crash at turn '+state.moves);
    if(state.lastEvent.endsWith('cleared'))events.push(state.lastEvent);
  }
  assert.equal(GLASS_ICE_CLEAR_LAP.length,24);
  assert.equal(glassTurns,3,'Demo should actually drive on glass three turns');
  assert.ok(glideSpeed>=2,'Demo should demonstrate deliberate braking while on glass');
  assert.deepEqual(events,[
    'East Glass Gate cleared','Return Straight Gate cleared','West Sweep Gate cleared'
  ]);
  assert.ok(min>=1);
  assert.equal(state.finished,true);
  assert.equal(state.moves,24);
  assert.equal(state.laps,1);
  assert.equal(state.checkpoint,0);
});

test('independent exact engine solver finds another legal lap with the zone rule',()=>{
  const actions=findLegalLap(GLASS_ICE);
  assert.ok(actions.length>=20&&actions.length<=38);
  let state=createRace(GLASS_ICE);
  for(const a of actions){
    assert.equal(accelerationAllowed(state,a,GLASS_ICE),true);
    state=takeTurn(state,a,GLASS_ICE);
    assert.equal(state.crashes,0);
  }
  assert.equal(state.finished,true);
});
