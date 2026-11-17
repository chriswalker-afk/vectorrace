import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CIRCUITS, BROKEN_PASSAGE, ICEBOUND_RAPIDS, CROSSWIND_RIDGE,
  GLASS_ICE, getCircuit
} from '../src/circuit.mjs';
import {
  ACCELERATIONS, createRace, takeTurn, previewMove, score,
  onTrack, segmentOnTrack, movingObstaclePosition,
  movingObstaclePeriod, movingObstacleApproach, movingObstaclePathClearance,
  movingObstacleImpact, SKIMMER_HAZARD_HALF_WIDTH
} from '../src/engine.mjs';
import { brakingForecast, brakeRun } from '../src/race-coach.mjs';
import { findLegalLap } from '../scripts/solve-lap.mjs';
import { BROKEN_PASSAGE_CLEAR_LAP } from '../scripts/broken-passage-qa-route.mjs';
import { MIN_RECOMMENDED_CLEARANCE, visualSkimmerPathClearance } from '../scripts/track-clearance.mjs';

const p=(x,y)=>({x,y});
const c=BROKEN_PASSAGE;

test('Track 10 is Advanced 2, in Ember Rift, and only introduces moving obstacles',()=>{
  assert.equal(CIRCUITS.length,10);
  assert.equal(CIRCUITS[8],ICEBOUND_RAPIDS);
  assert.equal(CIRCUITS[9],c);
  assert.strictEqual(getCircuit(c.id),c);
  assert.equal(c.level,'ADVANCED 2');
  assert.equal(c.crashPenalty,3);
  assert.equal(c.targetLaps,1);
  assert.deepEqual(c.start,p(9,21));
  assert.equal(c.boostZones,undefined,'Combined boost-and-motion belongs in a later level');
  assert.equal(c.windZones,undefined);
  assert.equal(c.glassZones,undefined);
  assert.equal(c.obstacles,undefined);
  assert.equal(c.movingObstacles.length,2);
  assert.deepEqual(c.movingObstacles.map(h=>h.id),['north-shuttle','south-shuttle']);
  assert.equal(movingObstaclePeriod(c),6);
  assert.equal(c.featuredMotion.period,6);
  assert.deepEqual(c.checkpoints.map(g=>g.id),['east','south','west']);
  assert.notDeepEqual(c.outer,ICEBOUND_RAPIDS.outer);
  assert.notDeepEqual(c.inner,ICEBOUND_RAPIDS.inner);
  for(const old of CIRCUITS.slice(0,9)){
    assert.equal(old.movingObstacles,undefined);
    assert.equal(movingObstaclePeriod(old),1);
  }
});

test('both obstacle positions are published, symmetric and six-turn periodic',()=>{
  const [north,south]=c.movingObstacles;
  assert.deepEqual(north.positions.map(x=>x.y),[19.7,20.7,21.8,22.8,21.8,20.7]);
  assert.deepEqual(south.positions.map(x=>x.y),[9.7,10.8,12,12.8,12,10.8]);
  for(const obstacle of c.movingObstacles){
    assert.equal(obstacle.radius,0.55);
    assert.equal(obstacle.positions.length,6);
    assert.equal(obstacle.positions[0].x,obstacle.positions[3].x);
    for(let t=0;t<18;t++){
      assert.deepEqual(movingObstaclePosition(obstacle,t),movingObstaclePosition(obstacle,t+6));
      assert.ok(onTrack(movingObstaclePosition(obstacle,t),c));
      const before=movingObstaclePosition(obstacle,t);
      const after=movingObstaclePosition(obstacle,t+1);
      assert.ok(segmentOnTrack(before,after,c),'Moving slab must never animate through a bank');
      assert.ok(Math.hypot(after.x-before.x,after.y-before.y)<=1.2+1e-9,
        'An obstacle cannot teleport or move more than one slow phase step');
      assert.ok(visualSkimmerPathClearance(before,after,c) > obstacle.radius+0.15,
        'The painted slab must fit inside legal track boundaries');
    }
  }
  assert.throws(()=>movingObstaclePosition(north,-1),RangeError);
  assert.throws(()=>movingObstaclePosition(north,1.5),RangeError);
});

test('simultaneous full-segment sweep catches a crossing missed by endpoint checks',()=>{
  const north=c.movingObstacles[0];
  const from=p(18,22),to=p(22,22),turn=4;
  assert.ok(Math.hypot(from.x-20,from.y-21.8)>north.radius+SKIMMER_HAZARD_HALF_WIDTH);
  assert.ok(Math.hypot(to.x-20,to.y-20.7)>north.radius+SKIMMER_HAZARD_HALF_WIDTH);
  assert.ok(movingObstacleApproach(from,to,north,turn)<1.35,
    'Both endpoints clear, but two moving paths intersect at an intermediate fraction');
  assert.equal(movingObstacleImpact(from,to,c,turn).id,'north-shuttle');
  assert.ok(movingObstaclePathClearance(from,to,c,turn)<0);
  const state={...createRace(c),position:from,velocity:p(3,1),moves:turn};
  const preview=previewMove(state,p(1,-1),c);
  assert.deepEqual(preview.to,to);
  assert.equal(preview.reason,'moving-obstacle');
  assert.equal(preview.movingObstacle,'north-shuttle');
  assert.equal(preview.valid,false);
  assert.equal(onTrack(preview.to,c),true,'The crash is dynamic, not a snowbank collision');
  const after=takeTurn(state,p(1,-1),c);
  assert.equal(after.moves,5);
  assert.equal(after.crashes,1);
  assert.deepEqual(after.position,from);
  assert.deepEqual(after.velocity,p(0,0));
  assert.equal(score(after,c),after.moves+3*after.crashes);
  assert.match(after.lastEvent,/moving basalt/i);
});

test('identical upper racing move is unsafe at phase 5 but safe at phase 6',()=>{
  const from=p(18,22),a=p(1,-1);
  const early=previewMove({...createRace(c),position:from,velocity:p(3,1),moves:4},a,c);
  const timed=previewMove({...createRace(c),position:from,velocity:p(3,1),moves:5},a,c);
  assert.equal(early.valid,false);
  assert.equal(timed.valid,true);
  assert.equal(timed.movingObstacle,null);
  assert.ok(movingObstaclePathClearance(from,timed.to,c,5)>0.35);
  assert.equal(brakingForecast({...createRace(c),position:from,velocity:p(3,1),moves:4},a,c).risk,'crash');
  assert.notEqual(brakingForecast({...createRace(c),position:from,velocity:p(3,1),moves:5},a,c).risk,'crash');
});

test('return obstacle also requires timing; same westbound glide reverses its safety',()=>{
  const from=p(22,10),to=p(18,10);
  const a=p(-1,1);
  const early={...createRace(c),position:from,velocity:p(-3,-1),moves:12};
  const later={...early,moves:13};
  assert.deepEqual(previewMove(early,a,c).to,to);
  assert.equal(previewMove(early,a,c).movingObstacle,'south-shuttle');
  assert.equal(previewMove(early,a,c).valid,false);
  assert.equal(previewMove(later,a,c).valid,true);
  assert.ok(movingObstaclePathClearance(from,to,c,13)>0.4);
});

test('a stationary car still risks a collision when a basalt slab moves onto it',()=>{
  const state={...createRace(c),position:p(20,21.1),velocity:p(0,0),moves:0};
  assert.equal(onTrack(state.position,c),true);
  const movement=previewMove(state,p(0,0),c);
  assert.deepEqual(movement.to,state.position);
  assert.equal(movement.movingObstacle,'north-shuttle');
  assert.equal(movement.valid,false);
  const crash=takeTurn(state,p(0,0),c);
  assert.equal(crash.moves,1);
  assert.equal(crash.crashes,1);
  assert.deepEqual(crash.position,state.position);
});

test('old nine courses have unchanged movement and no turn-indexed hazard hitboxes',()=>{
  for(const old of CIRCUITS.slice(0,9)){
    const before=createRace(old);
    const move=previewMove(before,p(1,0),old);
    assert.equal(move.movingObstacle,null);
    assert.equal(movingObstacleImpact(before.position,move.to,old,before.moves),null);
    assert.equal(movingObstaclePathClearance(before.position,move.to,old,before.moves),Infinity);
    assert.equal(takeTurn(before,p(1,0),old).moves,1);
    assert.strictEqual(getCircuit(old.id),old);
  }
  assert.deepEqual(previewMove({...createRace(CROSSWIND_RIDGE),position:p(18,20)},p(0,0),CROSSWIND_RIDGE).wind,p(0,-1));
  assert.deepEqual(previewMove({...createRace(ICEBOUND_RAPIDS),position:p(18,20)},p(-1,0),ICEBOUND_RAPIDS).boost,p(2,0));
  assert.equal(previewMove({...createRace(GLASS_ICE),position:p(18,20)},p(1,1),GLASS_ICE).zoneBlocked,true);
});

test('representative 24-turn lap crosses both active shuttles with safe visible clearance',()=>{
  const route=BROKEN_PASSAGE_CLEAR_LAP;
  assert.equal(route.length,24);
  let state=createRace(c),minBank=Infinity,minMoving=Infinity;
  const gates=[];
  let northCross=false,southCross=false;
  for(const [i,a] of route.entries()){
    const move=previewMove(state,a,c);
    assert.equal(move.valid,true,'Illegal route at turn '+(i+1)+': '+move.reason);
    const bank=visualSkimmerPathClearance(move.from,move.to,c);
    const moving=movingObstaclePathClearance(move.from,move.to,c,state.moves);
    minBank=Math.min(bank,minBank);
    minMoving=Math.min(moving,minMoving);
    assert.ok(bank>=MIN_RECOMMENDED_CLEARANCE,
      'Skimmer too close to the broken bank on turn '+(i+1)+': '+bank);
    assert.ok(moving>=0.35,
      'Skimmer too close to a moving basalt slab on turn '+(i+1)+': '+moving);
    if(move.from.x<=20&&move.to.x>=20&&move.from.y>18)northCross=true;
    if(move.from.x>=18&&move.to.x<=18&&move.from.y<14)southCross=true;
    state=takeTurn(state,a,c);
    assert.equal(state.crashes,0);
    assert.equal(state.moves,i+1,'Each glide advances the public six-phase clock');
    if(state.lastEvent.endsWith('cleared'))gates.push(state.lastEvent);
  }
  assert.equal(northCross,true);
  assert.equal(southCross,true);
  assert.ok(minBank>=1.19);
  assert.ok(minMoving>=0.39);
  assert.deepEqual(gates,['East Break Gate cleared','Return Break Gate cleared','West Basalt Gate cleared']);
  assert.equal(state.laps,1);
  assert.equal(state.finished,true);
  assert.equal(score(state,c),24);
});

test('independent BFS includes hazard phase in visited key and completes a real lap',()=>{
  const route=findLegalLap(c);
  assert.ok(route.length>=18&&route.length<=42);
  let state=createRace(c);
  for(const [index,a] of route.entries()){
    assert.equal(previewMove(state,a,c).valid,true,'Solver route unsafe on move '+(index+1));
    state=takeTurn(state,a,c);
    assert.equal(state.crashes,0);
  }
  assert.equal(state.finished,true);
  assert.equal(state.laps,1);
});

test('Guided braking must advance the obstacle phase for each predicted future move',()=>{
  const s={...createRace(c),position:p(18,22),velocity:p(3,1),moves:5};
  const a=p(1,-1);
  const selected=previewMove(s,a,c);
  assert.equal(selected.valid,true);
  const forecast=brakingForecast(s,a,c);
  assert.equal(forecast.selected.valid,true);
  const stopped=brakeRun(selected.to,selected.velocity,c,s.moves+1);
  assert.deepEqual(forecast.braking,stopped);
  for(const x of forecast.braking.segments)assert.ok(typeof x.valid==='boolean');
  assert.equal(ACCELERATIONS.length,9);
});
