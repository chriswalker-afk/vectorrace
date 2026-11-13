/**
 * Optional two-stage cornering guidance.
 *
 * All calculations call the exact vector engine and its announced surface
 * rules. On Glass Ice only one axis can change per turn; the braking forecast
 * must respect that restriction instead of drawing impossible diagonals.
 * Guided mode projects the selected move, then a legal braking sequence.
 */
import { previewMove, possibleMoves, glassIceZoneAt } from './engine.mjs';
import { NORTHERN_LOOP } from './circuit.mjs';

export function brakingAcceleration(v) {
  return { x: v.x === 0 ? 0 : -Math.sign(v.x), y: v.y === 0 ? 0 : -Math.sign(v.y) };
}

/**
 * Glass Ice permits one acceleration axis per turn. When both components
 * move, spend this braking turn on the larger component (horizontal on ties).
 * Once off-glass, normal diagonal componentwise braking returns.
 */
export function surfaceBrakingAcceleration(position, velocity, circuit=NORTHERN_LOOP) {
  const usual=brakingAcceleration(velocity);
  if(!glassIceZoneAt(position,circuit) || !usual.x || !usual.y) return usual;
  return Math.abs(velocity.x)>=Math.abs(velocity.y)
    ? {x:usual.x,y:0}
    : {x:0,y:usual.y};
}

export function brakeRun(position, velocity, circuit = NORTHERN_LOOP) {
  if (![position.x, position.y, velocity.x, velocity.y].every(Number.isFinite)) {
    throw new TypeError('Position and velocity must have finite components');
  }
  if (![velocity.x, velocity.y].every(Number.isInteger)) {
    throw new TypeError('Velocity components must be integers');
  }
  const maxComponent=Math.max(Math.abs(velocity.x),Math.abs(velocity.y));
  if (maxComponent>128) throw new RangeError('Braking forecast velocity exceeds safe bounds');
  // On a patch the worst-case number of required braking turns is the sum
  // of the two speed components. On ordinary ice it remains the maximum.
  const limit=Math.abs(velocity.x)+Math.abs(velocity.y);
  const segments=[];
  let current={position:{...position},velocity:{...velocity}};
  for(let n=0;n<limit;n++){
    if(current.velocity.x===0&&current.velocity.y===0) break;
    const move=previewMove(current,
      surfaceBrakingAcceleration(current.position,current.velocity,circuit),circuit);
    segments.push(move);
    if(!move.valid){
      return {
        safe:false,segments,steps:segments.length,
        failedAt:n+1,stop:null
      };
    }
    current={position:move.to,velocity:move.velocity};
  }
  return {
    safe:current.velocity.x===0 && current.velocity.y===0,
    segments,steps:segments.length,failedAt:null,
    stop:{...current.position}
  };
}

export function stoppingDisplacement(v) {
  const component = n => Math.abs(n) <= 1 ? 0 : Math.sign(n) * Math.abs(n) * (Math.abs(n) - 1) / 2;
  return { x: component(v.x), y: component(v.y) };
}

export function brakingForecast(state, acceleration, circuit = NORTHERN_LOOP) {
  const selected = previewMove(state, acceleration, circuit);
  if (!selected.valid) {
    return {
      selected, legalNext: 0, braking: null,
      risk: selected.zoneBlocked?'glass':'crash'
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
  if (forecast.risk === 'glass') return 'GLASS ICE · Change only one velocity component';
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
