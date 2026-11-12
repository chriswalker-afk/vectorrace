/**
 * Optional two-stage cornering guidance.
 *
 * All calculations call the exact, tested vector engine. No hidden friction,
 * changes to acceleration, or new collision rules. In Guided mode we can
 * project the *selected* move, then a maximal componentwise braking sequence.
 */
import { previewMove, possibleMoves } from './engine.mjs';
import { NORTHERN_LOOP } from './circuit.mjs';

export function brakingAcceleration(v) {
  return { x: v.x === 0 ? 0 : -Math.sign(v.x), y: v.y === 0 ? 0 : -Math.sign(v.y) };
}

export function brakeRun(position, velocity, circuit = NORTHERN_LOOP) {
  if (![position.x, position.y, velocity.x, velocity.y].every(Number.isFinite)) {
    throw new TypeError('Position and velocity must have finite components');
  }
  if (![velocity.x, velocity.y].every(Number.isInteger)) {
    throw new TypeError('Velocity components must be integers');
  }
  const steps = Math.max(Math.abs(velocity.x), Math.abs(velocity.y));
  if (steps > 128) throw new RangeError('Braking forecast velocity exceeds safe bounds');
  const segments = [];
  let current = { position: { ...position }, velocity: { ...velocity } };
  for (let n = 0; n < steps; n++) {
    const move = previewMove(current, brakingAcceleration(current.velocity), circuit);
    segments.push(move);
    if (!move.valid) {
      return {
        safe: false, segments, steps: steps,
        failedAt: n + 1, stop: null
      };
    }
    current = { position: move.to, velocity: move.velocity };
  }
  return {
    safe: true, segments, steps, failedAt: null,
    stop: { ...current.position }
  };
}

export function stoppingDisplacement(v) {
  const component = n => n === 0 ? 0 : Math.sign(n) * Math.abs(n) * (Math.abs(n) - 1) / 2;
  return { x: component(v.x), y: component(v.y) };
}

export function brakingForecast(state, acceleration, circuit = NORTHERN_LOOP) {
  const selected = previewMove(state, acceleration, circuit);
  if (!selected.valid) {
    return {
      selected, legalNext: 0, braking: null,
      risk: 'crash'
    };
  }
  const projected = { position: selected.to, velocity: selected.velocity };
  const legalNext = possibleMoves(projected, circuit).filter(move => move.valid).length;
  const braking = brakeRun(selected.to, selected.velocity, circuit);
  return {
    selected, legalNext, braking,
    risk: legalNext === 0 ? 'trapped' : braking.safe ? 'clear' : 'braking-line'
  };
}

export function corneringMessage(forecast) {
  if (forecast.risk === 'crash') return 'CRASH RISK · This move crosses snow';
  if (forecast.risk === 'trapped') return 'TRAPPED NEXT TURN · Choose a slower approach';
  if (forecast.risk === 'braking-line') return 'BRAKE EARLIER · Full-stop line leaves the track';
  if (forecast.braking.steps >= 3) {
    return 'FAST GLIDE · ' + forecast.braking.steps + ' turns to stop';
  }
  if (forecast.braking.steps === 0) return 'FULL STOP · Ready to accelerate';
  return 'CLEAR · ' + forecast.braking.steps + (forecast.braking.steps === 1 ?
    ' turn to stop' : ' turns to stop');
}
