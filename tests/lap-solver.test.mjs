import test from 'node:test';
import assert from 'node:assert/strict';
import { findLegalLap } from '../scripts/solve-lap.mjs';
import { createRace, takeTurn } from '../src/engine.mjs';

test('the browser QA route really completes Northern Loop with zero crashes',()=>{
  const route=findLegalLap();
  assert.ok(route.length>12&&route.length<=75);
  let state=createRace();
  for(const a of route)state=takeTurn(state,a);
  assert.equal(state.finished,true);
  assert.equal(state.crashes,0);
  assert.equal(state.moves,route.length);
  assert.equal(state.checkpoint,0);
});
