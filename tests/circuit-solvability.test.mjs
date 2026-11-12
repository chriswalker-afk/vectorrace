import test from 'node:test';
import assert from 'node:assert/strict';
import { NORTHERN_LOOP } from '../src/circuit.mjs';
import { createRace, previewMove, gateProgress, ACCELERATIONS } from '../src/engine.mjs';

test('Northern Loop has at least one mathematically legal, crash-free complete lap', () => {
  const initial = createRace(NORTHERN_LOOP);
  const key = s => [
    s.position.x, s.position.y, s.velocity.x, s.velocity.y, s.checkpoint
  ].join(',');

  const visited = new Set([key(initial)]);
  const queue = [{ ...initial, depth: 0 }];
  let head = 0, completed = null;

  while (head < queue.length && queue.length < 220000) {
    const state = queue[head++];
    if (state.depth >= 75) continue;
    for (const a of ACCELERATIONS) {
      const move = previewMove(state, a, NORTHERN_LOOP);
      if (!move.valid) continue;
      if (Math.abs(move.velocity.x) > 4 || Math.abs(move.velocity.y) > 4) continue;
      const progress = gateProgress(
        move.from, move.to, state.checkpoint, state.laps, NORTHERN_LOOP
      );
      if (progress.finished) {
        completed = { moves: state.depth + 1, visited: visited.size };
        break;
      }
      const next = {
        position: move.to, velocity: move.velocity,
        checkpoint: progress.checkpoint,
        laps: progress.laps, depth: state.depth + 1
      };
      const nextKey = key(next);
      if (visited.has(nextKey)) continue;
      visited.add(nextKey);
      queue.push(next);
    }
    if (completed) break;
  }

  assert.ok(
    completed,
    'No legal complete lap found after exploring ' + visited.size + ' movement states'
  );
  assert.ok(completed.moves <= 75, 'Completion should be achievable in a sensible number of turns');
});
