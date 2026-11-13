import test from 'node:test';
import assert from 'node:assert/strict';
import { NORTHERN_LOOP, AURORA_SPLIT } from '../src/circuit.mjs';
import { findLegalLap } from '../scripts/solve-lap.mjs';
import { createRace, takeTurn, onTrack, segmentOnTrack } from '../src/engine.mjs';

test('Aurora Split has a completely playable crash-free lap via the exact racing engine', () => {
  const actions = findLegalLap(AURORA_SPLIT);
  assert.ok(actions.length > 0 && actions.length <= 75);
  let state = createRace(AURORA_SPLIT);
  let furthestEast = state.position.x;
  for (const action of actions) {
    const next = takeTurn(state, action, AURORA_SPLIT);
    assert.equal(next.crashes, 0, 'Collision in test route at turn ' + next.moves);
    assert.equal(segmentOnTrack(state.position, next.position, AURORA_SPLIT), true);
    furthestEast = Math.max(furthestEast, next.position.x);
    state = next;
  }
  assert.equal(state.finished,true);
  assert.equal(state.checkpoint,0);
  assert.equal(state.laps,1);
  assert.equal(state.moves,actions.length);
  assert.ok(furthestEast>=26);
  assert.ok(actions.length >= findLegalLap(NORTHERN_LOOP).length,
    'Beginner 2 should not be shorter than the introductory circuit');
});

test('the course obstruction actually forces an upper or lower lane',()=>{
  const c=AURORA_SPLIT;
  for(const point of [{x:18,y:19},{x:22,y:19}])
    assert.equal(onTrack(point,c),true);
  for(const y of [17,21])
    assert.equal(segmentOnTrack({x:17,y},{x:23,y},c),true);
  assert.equal(segmentOnTrack({x:17,y:19},{x:23,y:19},c),false);
});
