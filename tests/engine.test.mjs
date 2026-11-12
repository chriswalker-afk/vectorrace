import test from 'node:test';
import assert from 'node:assert/strict';
import { NORTHERN_LOOP } from '../src/circuit.mjs';
import {
  ACCELERATIONS, validAcceleration, onTrack, segmentOnTrack,
  directedGateCrossing, gateProgress, createRace,
  previewMove, possibleMoves, takeTurn, score
} from '../src/engine.mjs';

const vec = (x, y) => ({ x, y });

test('exactly nine distinct component-wise accelerations', () => {
  assert.equal(ACCELERATIONS.length, 9);
  assert.equal(new Set(ACCELERATIONS.map(a => a.x + ',' + a.y)).size, 9);
  assert.equal(ACCELERATIONS.every(validAcceleration), true);
  for (const a of [vec(2, 0), vec(0, -2), vec(.5, 0), vec(1, NaN), null]) {
    assert.equal(validAcceleration(a), false);
  }
});

test('initial state is stationary on the top racing corridor', () => {
  const s = createRace();
  assert.deepEqual(s.velocity, vec(0, 0));
  assert.deepEqual(s.position, vec(13, 19));
  assert.equal(onTrack(s.position), true);
  assert.equal(s.checkpoint, 0);
  assert.equal(s.finished, false);
});

test('velocity is accumulated exactly with no hidden friction', () => {
  let s = createRace();
  s = takeTurn(s, vec(1, 0));
  assert.deepEqual(s.position, vec(14, 19));
  assert.deepEqual(s.velocity, vec(1, 0));
  s = takeTurn(s, vec(0, 0));
  assert.deepEqual(s.position, vec(15, 19));
  assert.deepEqual(s.velocity, vec(1, 0));
  const m = previewMove(s, vec(-1, 1));
  assert.deepEqual(m.velocity, vec(0, 1));
  assert.deepEqual(m.to, vec(15, 20));
  assert.equal(m.valid, true);
});

test('stillness counts as a valid turn and retains the same position', () => {
  const s = createRace();
  const next = takeTurn(s, vec(0, 0));
  assert.deepEqual(next.position, s.position);
  assert.equal(next.moves, 1);
  assert.equal(next.trail.length, 1);
});

test('invalid accelerations throw and do not mutate state', () => {
  const s = createRace();
  assert.throws(() => takeTurn(s, vec(3, 0)), RangeError);
  assert.deepEqual(s.velocity, vec(0, 0));
  assert.equal(s.moves, 0);
});

test('the road includes its outlines but excludes snowfield and centre island', () => {
  assert.equal(onTrack(vec(16, 19)), true);
  assert.equal(onTrack(vec(16, 22)), true); // outer boundary
  assert.equal(onTrack(vec(16, 17)), true); // inner boundary
  assert.equal(onTrack(vec(16, 12)), false);
  assert.equal(onTrack(vec(0, 0)), false);
});

test('a movement must stay on the road all the way, not just at the endpoint', () => {
  assert.equal(segmentOnTrack(vec(13, 19), vec(23, 19)), true);
  assert.equal(segmentOnTrack(vec(16, 19), vec(16, 5)), false);
  assert.equal(onTrack(vec(16, 19)), true);
  assert.equal(onTrack(vec(16, 5)), true);
  assert.equal(segmentOnTrack(vec(6, 12), vec(26, 12)), false);
  assert.equal(segmentOnTrack(vec(7, 22), vec(24, 3)), false);
});

test('travelling exactly along an inner boundary is legal', () => {
  assert.equal(segmentOnTrack(vec(10, 17), vec(21, 17)), true);
});

test('all nine previews are derived from state and stay immutable', () => {
  const s = createRace();
  const moves = possibleMoves(s);
  assert.equal(moves.length, 9);
  assert.equal(moves.every(m => m.valid), true);
  moves[0].to.x = 999;
  assert.equal(s.position.x, 13);
});

test('finish crossing requires correct direction and gate location', () => {
  const finish = NORTHERN_LOOP.finish;
  assert.ok(directedGateCrossing(vec(15, 19), vec(18, 19), finish));
  assert.equal(directedGateCrossing(vec(18, 19), vec(15, 19), finish), null);
  assert.equal(directedGateCrossing(vec(15, 10), vec(18, 10), finish), null);
  assert.ok(directedGateCrossing(vec(16, 19), vec(17, 19), finish));
  assert.equal(directedGateCrossing(vec(15, 19), vec(16, 19), finish), null);
});

test('ordered checkpoints are required before a finishing lap', () => {
  const top = gateProgress(vec(15, 19), vec(18, 19));
  assert.equal(top.laps, 0);
  assert.equal(top.checkpoint, 0);

  const east = gateProgress(vec(27, 16), vec(27, 10));
  assert.equal(east.checkpoint, 1);
  assert.equal(east.laps, 0);

  const south = gateProgress(vec(18, 5), vec(14, 5), 1, 0);
  assert.equal(south.checkpoint, 2);

  const west = gateProgress(vec(5, 10), vec(5, 16), 2, 0);
  assert.equal(west.checkpoint, 3);

  const finish = gateProgress(vec(15, 19), vec(18, 19), 3, 0);
  assert.equal(finish.laps, 1);
  assert.equal(finish.finished, true);
  assert.equal(finish.checkpoint, 0);
});

test('backwards gates and out-of-order checkpoints do not award progress', () => {
  assert.equal(gateProgress(vec(27, 10), vec(27, 16)).checkpoint, 0);
  assert.equal(gateProgress(vec(18, 5), vec(14, 5)).checkpoint, 0);
  assert.equal(gateProgress(vec(15, 19), vec(18, 19), 2, 0).laps, 0);
});

test('crashing resets velocity at the last legal point with an explicit penalty', () => {
  const s = { ...createRace(), position: vec(16, 19), velocity: vec(0, -14) };
  const next = takeTurn(s, vec(0, 0));
  assert.deepEqual(next.position, s.position);
  assert.deepEqual(next.velocity, vec(0, 0));
  assert.equal(next.moves, 1);
  assert.equal(next.crashes, 1);
  assert.equal(score(next), 4);
  assert.equal(next.trail.length, 0);
});

test('a completed race cannot accidentally consume extra turns', () => {
  const s = { ...createRace(), position: vec(15, 19), velocity: vec(2, 0), checkpoint: 3 };
  const finished = takeTurn(s, vec(0, 0));
  assert.equal(finished.finished, true);
  assert.equal(finished.laps, 1);
  assert.strictEqual(takeTurn(finished, vec(0, 0)), finished);
});
