/**
 * Test-only shortest legal lap reconstruction.
 * Engine is the single source of truth. This solver is NOT imported by game UI.
 */
import { ACCELERATIONS, createRace, previewMove, gateProgress } from '../src/engine.mjs';
import { NORTHERN_LOOP } from '../src/circuit.mjs';

export function findLegalLap(circuit = NORTHERN_LOOP) {
  const start = createRace(circuit);
  const key = s => [s.position.x,s.position.y,s.velocity.x,s.velocity.y,s.checkpoint].join(',');
  const nodes = [{ state: start, parent: -1, acceleration: null, depth: 0 }];
  const visited = new Set([key(start)]);
  const maxStates = 220000;
  for(let head = 0; head < nodes.length && nodes.length < maxStates; head++) {
    const node = nodes[head];
    if(node.depth >= 75) continue;
    for(const acceleration of ACCELERATIONS) {
      const move = previewMove(node.state, acceleration, circuit);
      if(!move.valid) continue;
      if(Math.abs(move.velocity.x)>4 || Math.abs(move.velocity.y)>4) continue;
      const progress = gateProgress(move.from,move.to,node.state.checkpoint,node.state.laps,circuit);
      const next = {
        position: move.to,
        velocity: move.velocity,
        checkpoint: progress.checkpoint,
        laps: progress.laps
      };
      // Completion must be checked BEFORE visited-key deduplication: after the
      // finish the checkpoint counter wraps to zero and can match an older state.
      if(progress.finished) {
        const reverse=[{...acceleration}];
        for(let at=head;at>0;at=nodes[at].parent)reverse.push(nodes[at].acceleration);
        return reverse.reverse();
      }
      const k=key(next);
      if(visited.has(k)) continue;
      visited.add(k);
      nodes.push({state:next,parent:head,acceleration:{...acceleration},depth:node.depth+1});
    }
  }
  throw new Error('No crash-free lap found after '+visited.size+' states');
}
