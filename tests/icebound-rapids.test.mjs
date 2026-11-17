import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CIRCUITS, ICEBOUND_RAPIDS, CROSSWIND_RIDGE, GLASS_ICE,
  getCircuit
} from '../src/circuit.mjs';
import {
  ACCELERATIONS, accelerationAllowed, createRace, onTrack,
  segmentOnTrack, previewMove, takeTurn, boostZoneAt, boostVectorAt,
  score
} from '../src/engine.mjs';
import { surfaceBrakingAcceleration, brakeRun, brakingForecast } from '../src/race-coach.mjs';
import { findLegalLap } from '../scripts/solve-lap.mjs';
import { ICEBOUND_RAPIDS_CLEAR_LAP } from '../scripts/icebound-rapids-qa-route.mjs';
import { visualSkimmerPathClearance, MIN_RECOMMENDED_CLEARANCE } from '../scripts/track-clearance.mjs';

const p=(x,y)=>({x,y});
const c=ICEBOUND_RAPIDS;

test('Icebound Rapids is Advanced 1 in the ninth map slot, with two +2 copper pads',()=>{
  assert.equal(CIRCUITS.length,9);
  assert.equal(CIRCUITS[8],c);
  assert.equal(getCircuit('icebound-rapids'),c);
  assert.equal(c.level,'ADVANCED 1');
  assert.equal(c.boostZones.length,2);
  assert.deepEqual(c.boostZones.map(z=>z.id),['east-rapids','west-rapids']);
  assert.deepEqual(c.boostZones.map(z=>z.vector),[p(2,0),p(-2,0)]);
  assert.equal(c.windZones,undefined);
  assert.equal(c.glassZones,undefined);
  assert.equal(c.obstacles,undefined);
  assert.deepEqual(c.checkpoints.map(g=>g.id),['east','south','west']);
  assert.deepEqual(createRace(c).velocity,p(0,0));
  assert.equal(c.crashPenalty,3);
  assert.ok(c.outer.length>15&&c.inner.length>10,
    'Advanced circuit must use its own distinct polygon silhouette');
  for(const old of CIRCUITS.slice(0,8)){
    assert.equal(old.boostZones,undefined,'No old map may gain a forced boost');
  }
});

test('exact boost polygons are entirely legal racing surface and include their edges',()=>{
  const [east,west]=c.boostZones;
  for(const q of [p(15.5,20),p(18,20),p(19.5,20),p(18,24.1)]){
    assert.strictEqual(boostZoneAt(q,c),east);
    assert.deepEqual(boostVectorAt(q,c),p(2,0));
    assert.equal(onTrack(q,c),true);
  }
  for(const q of [p(13.5,10),p(15,10),p(17.5,10),p(15,11.3)]){
    assert.strictEqual(boostZoneAt(q,c),west);
    assert.deepEqual(boostVectorAt(q,c),p(-2,0));
    assert.equal(onTrack(q,c),true);
  }
  for(const q of [p(13,20),p(20,20),p(18,12),p(18,10)]){
    assert.equal(boostZoneAt(q,c),null);
    assert.deepEqual(boostVectorAt(q,c),p(0,0));
  }
  assert.equal(segmentOnTrack(p(15,20),p(21,20),c),true);
  assert.equal(segmentOnTrack(p(13.5,10),p(17.5,10),c),true);
});

test('boost uses START-OF-TURN location, never retroactively accelerates an entering move',()=>{
  const s={...createRace(c),position:p(15,20),velocity:p(2,0)};
  const entering=previewMove(s,p(1,0),c);
  assert.equal(entering.boostZone,null);
  assert.deepEqual(entering.boost,p(0,0));
  assert.deepEqual(entering.velocity,p(3,0));
  assert.deepEqual(entering.to,p(18,20));
  const landed=takeTurn(s,p(1,0),c);
  assert.equal(landed.crashes,0);
  const launched=previewMove(landed,p(-1,0),c);
  assert.equal(launched.boostZone,'east-rapids');
  assert.deepEqual(launched.boost,p(2,0));
  assert.deepEqual(launched.velocity,p(4,0));
  assert.deepEqual(launched.to,p(22,20));
  assert.equal(launched.valid,true);
  const coast=previewMove(landed,p(0,0),c);
  assert.deepEqual(coast.velocity,p(5,0));
  assert.equal(coast.valid,true);
  const fired=takeTurn(landed,p(-1,0),c);
  assert.deepEqual(fired.position,p(22,20));
  assert.equal(fired.moves,2);
  assert.equal(score(fired,c),2);
  assert.match(fired.lastEvent,/Boost engaged/);
  const after=previewMove(fired,p(-1,0),c);
  assert.equal(after.boostZone,null,'Leaving the pad disables the force next turn');
  assert.deepEqual(after.velocity,p(3,0));
});

test('west strip forces an extra negative velocity despite opposite acceleration',()=>{
  const s={...createRace(c),position:p(15,10),velocity:p(-3,0)};
  const move=previewMove(s,p(1,-1),c);
  assert.equal(move.boostZone,'west-rapids');
  assert.deepEqual(move.boost,p(-2,0));
  assert.deepEqual(move.velocity,p(-4,-1));
  assert.deepEqual(move.to,p(11,9));
  assert.equal(move.valid,true);
  assert.deepEqual(takeTurn(s,p(1,-1),c).velocity,p(-4,-1));
  assert.equal(ACCELERATIONS.filter(a=>accelerationAllowed(s,a,c)).length,9);
});

test('Guided braking understands +2 forces and cannot claim a stop on an active pad',()=>{
  assert.deepEqual(surfaceBrakingAcceleration(p(18,20),p(0,0),c),p(-1,0));
  assert.deepEqual(surfaceBrakingAcceleration(p(15,10),p(-3,0),c),p(1,0));
  const brake=brakeRun(p(18,20),p(0,0),c);
  assert.ok(brake.steps>0,'A zero-velocity skimmer cannot just sit on an active +2 pad');
  assert.ok(brake.segments.length===brake.steps);
  assert.deepEqual(brake.segments[0].boost,p(2,0));
  assert.deepEqual(brake.segments[0].velocity,p(1,0));
  const state={...createRace(c),position:p(18,20),velocity:p(3,0)};
  const guided=brakingForecast(state,p(-1,0),c);
  assert.deepEqual(guided.selected.velocity,p(4,0));
  assert.deepEqual(guided.selected.boost,p(2,0));
  assert.ok(['clear','braking-line','trapped'].includes(guided.risk));
  assert.deepEqual(brakeRun(p(19,20),p(2,0),CROSSWIND_RIDGE)
    .segments[0].wind,p(0,-1));
});

test('eight earlier circuits keep their own acceleration and zone rules',()=>{
  for(const old of CIRCUITS.slice(0,8)){
    const s=createRace(old);
    const move=previewMove(s,p(1,0),old);
    assert.deepEqual(move.boost,p(0,0));
    assert.equal(move.boostZone,null);
    assert.deepEqual(move.velocity,p(1,0));
    assert.equal(takeTurn(s,p(1,0),old).velocity.x,1);
    assert.equal(getCircuit(old.id),old);
  }
  assert.equal(previewMove({...createRace(GLASS_ICE),position:p(18,20)},p(1,1),GLASS_ICE).zoneBlocked,true);
  assert.deepEqual(previewMove({...createRace(CROSSWIND_RIDGE),position:p(18,20),velocity:p(3,0)},p(0,0),CROSSWIND_RIDGE).wind,p(0,-1));
});

test('23-turn safety route fires both boost strips and clears all gates with car-width margin',()=>{
  let state=createRace(c),minClearance=Infinity;
  let boostTurns=0,boostDirections=[];
  const events=[];
  for(const [index,a] of ICEBOUND_RAPIDS_CLEAR_LAP.entries()){
    const active=boostZoneAt(state.position,c);
    if(active){
      boostTurns++;
      boostDirections.push(active.vector.x);
      assert.ok([4,14].includes(index),'QA route engages pads on turns 5 and 15 only');
    }
    const move=previewMove(state,a,c);
    assert.equal(move.valid,true,'Unsafe move '+(index+1));
    assert.equal(move.zoneBlocked,false);
    const clearance=visualSkimmerPathClearance(state.position,move.to,c);
    minClearance=Math.min(minClearance,clearance);
    assert.ok(clearance>=MIN_RECOMMENDED_CLEARANCE-1e-9,
      'Skimmer scrapes bank on move '+(index+1)+': '+clearance.toFixed(3));
    state=takeTurn(state,a,c);
    assert.equal(state.crashes,0);
    if(state.lastEvent.endsWith('cleared'))events.push(state.lastEvent);
  }
  assert.equal(ICEBOUND_RAPIDS_CLEAR_LAP.length,23);
  assert.equal(boostTurns,2);
  assert.deepEqual(boostDirections,[2,-2]);
  assert.ok(minClearance>=1.19);
  assert.deepEqual(events,[
    'East Rapids Gate cleared','South Return Gate cleared','West Rift Gate cleared'
  ]);
  assert.equal(state.finished,true);
  assert.equal(state.laps,1);
  assert.equal(state.moves,23);
  assert.equal(score(state,c),23);
});

test('independent exact-engine graph search finds a separate fully legal completed lap',()=>{
  const route=findLegalLap(c);
  assert.ok(route.length>=16 && route.length<=38);
  let state=createRace(c);
  for(const [index,a] of route.entries()){
    assert.equal(previewMove(state,a,c).valid,true,'Illegal solver turn '+(index+1));
    state=takeTurn(state,a,c);
    assert.equal(state.crashes,0);
  }
  assert.equal(state.laps,1);
  assert.equal(state.finished,true);
});
