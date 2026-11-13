import { NORTHERN_LOOP } from './circuit.mjs';

export const EPSILON = 1e-9;
export const ACCELERATIONS = Object.freeze(
  [-1, 0, 1].flatMap(y => [-1, 0, 1].map(x => Object.freeze({ x, y })))
);

const sub = (p, q) => ({ x: p.x - q.x, y: p.y - q.y });
const cross = (p, q) => p.x * q.y - p.y * q.x;
const dot = (p, q) => p.x * q.x + p.y * q.y;
const add = (p, q) => ({ x: p.x + q.x, y: p.y + q.y });
const scale = (p, n) => ({ x: p.x * n, y: p.y * n });
const lerp = (a, b, t) => add(a, scale(sub(b, a), t));

export function validAcceleration(a) {
  return a !== null && typeof a === 'object' &&
    Number.isInteger(a.x) && Number.isInteger(a.y) &&
    Math.abs(a.x) <= 1 && Math.abs(a.y) <= 1;
}

function onEdge(p, a, b) {
  const ab = sub(b, a), ap = sub(p, a);
  const length = Math.hypot(ab.x, ab.y);
  return Math.abs(cross(ab, ap)) <= EPSILON * Math.max(length, 1) &&
    dot(ap, ab) >= -EPSILON &&
    dot(sub(p, b), ab) <= EPSILON;
}

function onPolygonEdge(p, poly) {
  return poly.some((a, i) => onEdge(p, a, poly[(i + 1) % poly.length]));
}

function strictlyInsidePolygon(p, poly) {
  if (onPolygonEdge(p, poly)) return false;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > p.y) !== (b.y > p.y)) {
      const x = a.x + (p.y - a.y) * (b.x - a.x) / (b.y - a.y);
      if (p.x < x) inside = !inside;
    }
  }
  return inside;
}

/**
 * A glass-ice rule is active only when the car STARTS its turn on the marked
 * polygon, including the painted edge. Passing over a patch without landing
 * inside does not retroactively alter a turn.
 */
export function glassIceZoneAt(point, circuit = NORTHERN_LOOP) {
  return (circuit.glassZones ?? []).find(zone =>
    onPolygonEdge(point,zone.polygon) ||
    strictlyInsidePolygon(point,zone.polygon)
  ) ?? null;
}

/**
 * Predictable wind applies only if the skimmer STARTS the turn in the marked
 * zone. A point on the painted polygon border counts as inside. Unlike
 * Glass Ice, the wind NEVER disables a player's 3×3 acceleration choices.
 */
export function windZoneAt(point, circuit = NORTHERN_LOOP) {
  return (circuit.windZones ?? []).find(zone =>
    onPolygonEdge(point,zone.polygon) ||
    strictlyInsidePolygon(point,zone.polygon)
  ) ?? null;
}

export function windVectorAt(point, circuit = NORTHERN_LOOP) {
  const zone=windZoneAt(point,circuit);
  return zone ? {...zone.vector} : {x:0,y:0};
}

export function accelerationAllowed(state, acceleration, circuit = NORTHERN_LOOP) {
  if (!validAcceleration(acceleration)) return false;
  const zone=glassIceZoneAt(state.position,circuit);
  // One-axis-only grip: legal accelerations are (±1,0), (0,±1), and (0,0).
  // The normal nine-vector choice returns immediately on normal ice.
  return !zone || zone.rule!=='axis-only' ||
    acceleration.x===0 || acceleration.y===0;
}

export function onTrack(point, circuit = NORTHERN_LOOP) {
  const outer = onPolygonEdge(point, circuit.outer) ||
    strictlyInsidePolygon(point, circuit.outer);
  const forbiddenIsland = strictlyInsidePolygon(point, circuit.inner);
  const forbiddenObstacle = (circuit.obstacles ?? []).some(
    obstacle => strictlyInsidePolygon(point, obstacle.polygon)
  );
  return outer && !forbiddenIsland && !forbiddenObstacle;
}

// Insert every parameter where the moving segment intersects a polygon edge.
// Splitting the motion at those locations allows exact midpoint classification
// without missing a narrow island between two individually valid endpoints.
function collectIntersectionParameters(from, to, polygon, parameters) {
  const r = sub(to, from);
  const rr = dot(r, r);
  if (rr < EPSILON) return;

  for (let i = 0; i < polygon.length; i++) {
    const q = polygon[i], q2 = polygon[(i + 1) % polygon.length];
    const s = sub(q2, q), qp = sub(q, from);
    const denom = cross(r, s);

    if (Math.abs(denom) > EPSILON) {
      const t = cross(qp, s) / denom;
      const u = cross(qp, r) / denom;
      if (t >= -EPSILON && t <= 1 + EPSILON &&
          u >= -EPSILON && u <= 1 + EPSILON) {
        parameters.push(Math.max(0, Math.min(1, t)));
      }
    } else if (Math.abs(cross(qp, r)) <= EPSILON) {
      // Collinear overlaps can begin or end in the middle of a movement.
      for (const endpoint of [q, q2]) {
        const t = dot(sub(endpoint, from), r) / rr;
        if (t > 0 && t < 1) parameters.push(t);
      }
    }
  }
}

export function segmentOnTrack(from, to, circuit = NORTHERN_LOOP) {
  if (!onTrack(from, circuit) || !onTrack(to, circuit)) return false;
  if (Math.hypot(to.x - from.x, to.y - from.y) < EPSILON) return true;
  const ts = [0, 1];
  collectIntersectionParameters(from, to, circuit.outer, ts);
  collectIntersectionParameters(from, to, circuit.inner, ts);
  for (const obstacle of circuit.obstacles ?? []) {
    collectIntersectionParameters(from, to, obstacle.polygon, ts);
  }
  ts.sort((a, b) => a - b);
  for (let i = 1; i < ts.length; i++) {
    if (ts[i] - ts[i - 1] < EPSILON) continue;
    const midpoint = lerp(from, to, (ts[i - 1] + ts[i]) / 2);
    if (!onTrack(midpoint, circuit)) return false;
  }
  return true;
}

// Returns where a line segment crosses a gate in its prescribed direction,
// or null. Starting on a gate and departing in the correct direction counts;
// arriving on the gate counts on the subsequent departure instead.
export function directedGateCrossing(from, to, gate) {
  const d0 = dot(sub(from, gate.a), gate.direction);
  const d1 = dot(sub(to, gate.a), gate.direction);
  if (d0 > EPSILON || d1 <= EPSILON) return null;
  const delta = d1 - d0;
  if (delta <= EPSILON) return null;
  const t = -d0 / delta;
  if (t < -EPSILON || t >= 1 + EPSILON) return null;
  const contact = lerp(from, to, Math.max(0, Math.min(1, t)));
  if (!onEdge(contact, gate.a, gate.b)) return null;
  return { gate: gate.id, t: Math.max(0, t) };
}

export function gateProgress(from, to, checkpoint = 0, laps = 0, circuit = NORTHERN_LOOP) {
  const gates = [...circuit.checkpoints, circuit.finish];
  const crossings = gates.map(gate => directedGateCrossing(from, to, gate))
    .filter(Boolean).sort((a, b) => a.t - b.t);
  let nextCheckpoint = checkpoint;
  let nextLaps = laps;
  let message = null;
  for (const crossing of crossings) {
    const expected = circuit.checkpoints[nextCheckpoint];
    if (expected && expected.id === crossing.gate) {
      nextCheckpoint++;
      message = expected.label + ' cleared';
    } else if (!expected && crossing.gate === circuit.finish.id) {
      nextLaps++;
      nextCheckpoint = 0;
      message = nextLaps >= circuit.targetLaps ? 'Finish line crossed!' : 'Lap ' + nextLaps;
    }
  }
  return {
    checkpoint: nextCheckpoint,
    laps: nextLaps,
    finished: nextLaps >= circuit.targetLaps,
    message
  };
}

export function createRace(circuit = NORTHERN_LOOP) {
  if (!onTrack(circuit.start, circuit)) throw new Error('Start must lie on the circuit');
  return {
    position: { ...circuit.start },
    velocity: { x: 0, y: 0 },
    moves: 0,
    crashes: 0,
    checkpoint: 0,
    laps: 0,
    finished: false,
    lastEvent: 'Ready to race',
    trail: []
  };
}

export function previewMove(state, acceleration, circuit = NORTHERN_LOOP) {
  if (!validAcceleration(acceleration)) throw new RangeError('Acceleration components must be -1, 0 or 1');
  const wind=windVectorAt(state.position,circuit);
  const nextVelocity=add(add(state.velocity,acceleration),wind);
  const destination=add(state.position,nextVelocity);
  const zone=glassIceZoneAt(state.position,circuit);
  const zoneBlocked=!accelerationAllowed(state,acceleration,circuit);
  const roadClear=!zoneBlocked && segmentOnTrack(state.position,destination,circuit);
  return {
    from: { ...state.position },
    to: destination,
    velocity: nextVelocity,
    acceleration: { ...acceleration },
    valid: !zoneBlocked && roadClear,
    // Rejected glass-ice controls are NOT collisions and incur no penalty.
    zoneBlocked,
    reason: zoneBlocked?'glass-axis-only':roadClear?null:'snowbank',
    surface: zone?.id ?? null,
    wind,
    windZone:windZoneAt(state.position,circuit)?.id ?? null
  };
}

export function possibleMoves(state, circuit = NORTHERN_LOOP) {
  return ACCELERATIONS.map(acceleration => previewMove(state, acceleration, circuit));
}

export function score(state, circuit = NORTHERN_LOOP) {
  return state.moves + state.crashes * circuit.crashPenalty;
}

export function takeTurn(state, acceleration, circuit = NORTHERN_LOOP) {
  if (state.finished) return state;
  const move = previewMove(state, acceleration, circuit);
  if (move.zoneBlocked) {
    // Illegal diagonal commands do not advance a turn or cause a crash.
    // The UI also greys them out; this is the authoritative engine guard.
    return { ...state, lastEvent:'Glass Ice: one axis per turn' };
  }
  if (!move.valid) {
    // A crash keeps the player at the last legal grid point, kills velocity,
    // and costs one attempted turn plus an additional score penalty.
    return {
      ...state,
      velocity: { x: 0, y: 0 },
      moves: state.moves + 1,
      crashes: state.crashes + 1,
      lastEvent: 'Crash: reset velocity to zero'
    };
  }
  const progress = gateProgress(move.from, move.to, state.checkpoint, state.laps, circuit);
  return {
    ...state,
    position: move.to,
    velocity: move.velocity,
    moves: state.moves + 1,
    checkpoint: progress.checkpoint,
    laps: progress.laps,
    finished: progress.finished,
    lastEvent: progress.message || 'Clean glide',
    trail: [...state.trail, { from: move.from, to: move.to, velocity: move.velocity }]
  };
}
