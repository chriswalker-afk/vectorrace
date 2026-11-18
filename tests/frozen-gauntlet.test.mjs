import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CIRCUITS,FROZEN_GAUNTLET,BROKEN_PASSAGE,ICEBOUND_RAPIDS,
  GLASS_ICE,CROSSWIND_RIDGE,getCircuit
} from '../src/circuit.mjs';
import {
  ACCELERATIONS,createRace,previewMove,takeTurn,score,
  glassIceZoneAt,windVectorAt,windZoneAt,boostZoneAt,boostVectorAt,
  movingObstaclePeriod,movingObstaclePathClearance,movingObstaclePosition,
  accelerationAllowed,onTrack
} from '../src/engine.mjs';
import {surfaceBrakingAcceleration,brakingForecast} from '../src/race-coach.mjs';
import {findLegalLap} from '../scripts/solve-lap.mjs';
import {FROZEN_GAUNTLET_CLEAR_LAP} from '../scripts/frozen-gauntlet-qa-route.mjs';
import {MIN_RECOMMENDED_CLEARANCE,visualSkimmerPathClearance} from '../scripts/track-clearance.mjs';
const c=FROZEN_GAUNTLET,p=(x,y)=>({x,y});

test('Frozen Gauntlet is the 11th Advanced circuit, no new core physics',()=>{
  assert.equal(CIRCUITS.length,11);
  assert.strictEqual(CIRCUITS[10],c);
  assert.strictEqual(getCircuit('frozen-gauntlet'),c);
  assert.equal(c.level,'ADVANCED 3');
  assert.equal(c.targetLaps,1);
  assert.equal(c.crashPenalty,3);
  assert.equal(c.checkpoints.length,3);
  assert.equal(c.windZones.length,1);
  assert.equal(c.glassZones.length,2);
  assert.equal(c.boostZones.length,1);
  assert.equal(c.movingObstacles.length,2);
  assert.equal(movingObstaclePeriod(c),6);
  assert.deepEqual(c.windZones[0].vector,p(0,-1));
  assert.deepEqual(c.boostZones[0].vector,p(-2,0));
  assert.notDeepEqual(c.outer,BROKEN_PASSAGE.outer);
  assert.notDeepEqual(c.inner,BROKEN_PASSAGE.inner);
  assert.notStrictEqual(c.movingObstacles,BROKEN_PASSAGE.movingObstacles);
  assert.ok(Math.max(...c.outer.map(q=>q.y))<=25.3,'north bank must fit viewport');
});

test('shared polygon simultaneously applies Glass Ice restriction AND south wind',()=>{
  const [glass]=c.glassZones,[wind]=c.windZones;
  assert.deepEqual(glass.polygon,wind.polygon);
  assert.equal(glass.rule,'axis-only');
  for(const at of [p(15,21),p(18,22),p(12.6,20),p(21.6,22)]){
    assert.strictEqual(glassIceZoneAt(at,c),glass);
    assert.strictEqual(windZoneAt(at,c),wind);
    assert.deepEqual(windVectorAt(at,c),p(0,-1));
  }
  assert.equal(windZoneAt(p(12,20),c),null);
  const s={...createRace(c),position:p(15,21),velocity:p(3,1),moves:4};
  assert.equal(accelerationAllowed(s,p(1,1),c),false);
  assert.equal(previewMove(s,p(1,1),c).zoneBlocked,true);
  const noTurn=takeTurn(s,p(1,1),c);
  assert.equal(noTurn.moves,4);
  assert.equal(noTurn.crashes,0);
  assert.deepEqual(surfaceBrakingAcceleration(p(15,21),p(3,1),c),p(-1,0));
  const first=previewMove(s,p(0,1),c);
  assert.equal(first.valid,true);
  assert.deepEqual(first.wind,p(0,-1));
  assert.deepEqual(first.velocity,p(3,1));
  assert.deepEqual(first.to,p(18,22));
  const second=previewMove({...s,position:first.to,velocity:first.velocity,moves:5},p(1,0),c);
  assert.equal(second.valid,true);
  assert.deepEqual(second.velocity,p(4,0));
  assert.deepEqual(second.to,p(22,22));
});

test('return boost combines with moving basalt, rather than introducing new behaviour',()=>{
  const s={...createRace(c),position:p(22,10),velocity:p(-3,-1),moves:13};
  const right=previewMove(s,p(1,1),c);
  assert.equal(right.boostZone,'gauntlet-west-boost');
  assert.deepEqual(right.boost,p(-2,0));
  assert.deepEqual(right.velocity,p(-4,0));
  assert.deepEqual(right.to,p(18,10));
  assert.equal(right.valid,true);
  assert.ok(movingObstaclePathClearance(right.from,right.to,c,s.moves)>.5);
  assert.notDeepEqual(movingObstaclePosition(c.movingObstacles[1],13),
    movingObstaclePosition(c.movingObstacles[1],14));
  assert.deepEqual(previewMove(s,p(-1,1),c).velocity,p(-6,0));
  assert.deepEqual(boostVectorAt(p(18,10),c),p(0,0));
});

test('lower Glass Ice is clearly separate from boost and wind and only permits five vectors',()=>{
  for(const at of [p(18,10),p(14,10),p(16,8)]){
    assert.equal(glassIceZoneAt(at,c)?.id,'return-glass');
    assert.equal(windZoneAt(at,c),null);
    assert.equal(boostZoneAt(at,c),null);
  }
  const s={...createRace(c),position:p(18,10),velocity:p(-4,0),moves:14};
  assert.equal(previewMove(s,p(1,1),c).zoneBlocked,true);
  assert.equal(ACCELERATIONS.filter(a=>accelerationAllowed(s,a,c)).length,5);
  assert.equal(accelerationAllowed(s,p(0,-1),c),true);
});

test('all active zone polygons and moving-slab waypoints stay on real racing ice',()=>{
  for(const zone of [...c.glassZones,...c.windZones,...c.boostZones]){
    for(const at of zone.polygon){
      assert.equal(onTrack(at,c),true,zone.id+': '+JSON.stringify(at));
    }
  }
  for(const slab of c.movingObstacles){
    for(let i=0;i<slab.positions.length;i++){
      const from=movingObstaclePosition(slab,i),to=movingObstaclePosition(slab,i+1);
      assert.equal(onTrack(from,c),true);
      assert.ok(visualSkimmerPathClearance(from,to,c)>=slab.radius+.15);
    }
  }
});

test('24-turn safe full lap genuinely uses ALL four mechanics with whole-segment margin',()=>{
  assert.equal(FROZEN_GAUNTLET_CLEAR_LAP.length,24);
  let state=createRace(c),minBank=Infinity,minRock=Infinity;
  const active=[],gates=[];
  for(const [i,a] of FROZEN_GAUNTLET_CLEAR_LAP.entries()){
    const m=previewMove(state,a,c);
    assert.equal(m.valid,true,'Unsafe turn '+(i+1)+': '+m.reason);
    const bank=visualSkimmerPathClearance(m.from,m.to,c);
    const rock=movingObstaclePathClearance(m.from,m.to,c,state.moves);
    assert.ok(bank>=MIN_RECOMMENDED_CLEARANCE-1e-9,'Bank too close on turn '+(i+1));
    assert.ok(rock>=.49,'Moving rock too close on turn '+(i+1));
    minBank=Math.min(minBank,bank);
    minRock=Math.min(minRock,rock);
    const glass=glassIceZoneAt(state.position,c)?.id??null;
    if(glass||m.windZone||m.boostZone)
      active.push({turn:i+1,glass,wind:m.windZone,boost:m.boostZone});
    state=takeTurn(state,a,c);
    assert.equal(state.crashes,0);
    if(state.lastEvent.endsWith('cleared'))gates.push(state.lastEvent);
  }
  assert.deepEqual(active,[
    {turn:5,glass:'gauntlet-glass-and-wind',wind:'gauntlet-southwind',boost:null},
    {turn:6,glass:'gauntlet-glass-and-wind',wind:'gauntlet-southwind',boost:null},
    {turn:14,glass:null,wind:null,boost:'gauntlet-west-boost'},
    {turn:15,glass:'return-glass',wind:null,boost:null},
    {turn:16,glass:'return-glass',wind:null,boost:null}
  ]);
  assert.deepEqual(gates,['East Gauntlet Gate cleared','Return Gauntlet Gate cleared','West Gauntlet Gate cleared']);
  assert.ok(minBank>=1.19);
  assert.ok(minRock>=.51);
  assert.equal(state.finished,true);
  assert.equal(state.laps,1);
  assert.equal(state.moves,24);
  assert.equal(score(state,c),24);
});

test('independent six-phase solver finds another clean lap using glass-wind and boost',()=>{
  const route=findLegalLap(c);
  assert.ok(route.length>=19&&route.length<=45);
  let s=createRace(c),coupled=0,boost=0,glass=0;
  for(const a of route){
    const m=previewMove(s,a,c);
    assert.equal(m.valid,true);
    const zone=glassIceZoneAt(s.position,c);
    if(zone)glass++;
    if(zone?.id==='gauntlet-glass-and-wind'&&m.windZone)coupled++;
    if(m.boostZone)boost++;
    s=takeTurn(s,a,c);
    assert.equal(s.crashes,0);
  }
  assert.ok(coupled>=1);
  assert.ok(boost>=1);
  assert.ok(glass>=2);
  assert.equal(s.finished,true);
});

test('Guided forecast uses actual wind+glass and older ten courses still use original physics',()=>{
  const state={...createRace(c),position:p(15,21),velocity:p(3,1),moves:4};
  const forecast=brakingForecast(state,p(0,1),c);
  assert.deepEqual(forecast.selected.velocity,p(3,1));
  assert.equal(forecast.selected.valid,true);
  for(const old of CIRCUITS.slice(0,10)){
    assert.strictEqual(getCircuit(old.id),old);
    const before=createRace(old);
    assert.deepEqual(previewMove(before,p(1,0),old).velocity,p(1,0));
    assert.equal(takeTurn(before,p(1,0),old).moves,1);
  }
  assert.equal(BROKEN_PASSAGE.glassZones,undefined);
  assert.equal(ICEBOUND_RAPIDS.windZones,undefined);
  assert.equal(GLASS_ICE.boostZones,undefined);
  assert.equal(CROSSWIND_RIDGE.movingObstacles,undefined);
});
