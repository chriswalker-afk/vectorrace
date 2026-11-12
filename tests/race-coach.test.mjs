import test from 'node:test';
import assert from 'node:assert/strict';
import { NORTHERN_LOOP } from '../src/circuit.mjs';
import { createRace, previewMove } from '../src/engine.mjs';
import {
  brakingAcceleration, stoppingDisplacement, brakeRun,
  brakingForecast, corneringMessage
} from '../src/race-coach.mjs';

test('maximal componentwise braking reduces each nonzero component by one',()=>{
  assert.deepEqual(brakingAcceleration({x:3,y:-2}),{x:-1,y:1});
  assert.deepEqual(brakingAcceleration({x:0,y:0}),{x:0,y:0});
  assert.deepEqual(brakingAcceleration({x:-2,y:0}),{x:1,y:0});
});

test('braking displacement is triangular and exact for all signs',()=>{
  assert.deepEqual(stoppingDisplacement({x:4,y:-3}),{x:6,y:-3});
  assert.deepEqual(stoppingDisplacement({x:1,y:0}),{x:0,y:0});
});

test('braking from a safe straight is deterministic and fully stops',()=>{
  const run=brakeRun({x:13,y:19},{x:3,y:0},NORTHERN_LOOP);
  assert.equal(run.safe,true);
  assert.equal(run.steps,3);
  assert.deepEqual(run.stop,{x:16,y:19});
  assert.deepEqual(run.segments.map(s=>s.velocity.x),[2,1,0]);
  assert.equal(run.segments.every(s=>s.valid),true);
});

test('diagonal braking respects both velocity components independently',()=>{
  const run=brakeRun({x:13,y:19},{x:2,y:1},NORTHERN_LOOP);
  assert.equal(run.safe,true);
  assert.deepEqual(run.stop,{x:14,y:19});
  assert.deepEqual(run.segments.map(s=>s.velocity),[{x:1,y:0},{x:0,y:0}]);
});

test('the coach checks the whole future path and detects island intrusion',()=>{
  const run=brakeRun({x:16,y:19},{x:0,y:-3},NORTHERN_LOOP);
  assert.equal(run.safe,false);
  assert.equal(run.failedAt,2);
  assert.equal(run.segments[0].valid,true);
  assert.equal(run.segments[1].valid,false);
  assert.equal(run.stop,null);
});

test('forecast does not confuse a valid endpoint with a legal braking future',()=>{
  const state={...createRace(),position:{x:16,y:19},velocity:{x:0,y:-1}};
  const forecast=brakingForecast(state,{x:0,y:-1});
  assert.equal(forecast.selected.valid,true);
  assert.equal(forecast.braking.safe,false);
  assert.equal(forecast.legalNext,0);
  assert.equal(forecast.risk,'trapped');
  assert.match(corneringMessage(forecast),/TRAPPED/);
  assert.deepEqual(state.position,{x:16,y:19}); // Pure prediction only.
});

test('a move crossing snow is flagged before evaluating its braking sequence',()=>{
  const state={...createRace(),position:{x:16,y:19},velocity:{x:0,y:-3}};
  const forecast=brakingForecast(state,{x:0,y:0});
  assert.equal(forecast.risk,'crash');
  assert.equal(forecast.braking,null);
  assert.match(corneringMessage(forecast),/CRASH RISK/);
});

test('forecast preserves exact selected destination from the engine',()=>{
  const state=createRace();
  const first=previewMove(state,{x:1,y:0});
  const forecast=brakingForecast(state,{x:1,y:0});
  assert.deepEqual(forecast.selected,first);
  assert.equal(forecast.risk,'clear');
  assert.equal(forecast.legalNext,9);
  assert.match(corneringMessage(forecast),/CLEAR|STOP/);
});

test('bad velocity inputs cannot create runaway loops',()=>{
  assert.throws(()=>brakeRun({x:1,y:1},{x:129,y:0}),RangeError);
  assert.throws(()=>brakeRun({x:1,y:1},{x:1.5,y:0}),TypeError);
});
