import { vectorEntries, vectorDescription } from './vector-notation.mjs';

/**
 * A force/boost is a vector added to velocity, not a scalar speed bonus.
 * Use the existing x-on-top, y-on-bottom column-vector convention whenever
 * an actual mathematical symbol is displayed.
 */
export function forceComponents(vector) {
  return vectorEntries(vector).map(value => value.replace('-', '−'));
}
export function inlineVector(vector) {
  return '(' + forceComponents(vector).join(', ') + ')';
}
export function forceDirection(vector) {
  vectorEntries(vector); // validate the components even when no arrow applies
  if (vector.x > 0 && vector.y === 0) return '→';
  if (vector.x < 0 && vector.y === 0) return '←';
  if (vector.x === 0 && vector.y > 0) return '↑';
  if (vector.x === 0 && vector.y < 0) return '↓';
  return '';
}
export function inlineForce(kind, vector) {
  return kind + (forceDirection(vector) ? ' ' + forceDirection(vector) : '') +
    ' ' + inlineVector(vector);
}
export function describeAppliedForce(kind, vector) {
  return vectorDescription(vector, kind) + '; added to the next velocity';
}

/**
 * Paint a proper two-entry (x above y) column vector next to a map label.
 * Anchors are in the same map/world pixels as the existing zone labels.
 * The force vector is read from the SAME zone.vector used by the physics.
 */
export function drawMapForceLabel(ctx, kind, vector, anchor, options = {}) {
  const [top, bottom] = forceComponents(vector);
  const fontSize = options.fontSize ?? 12;
  const componentSize = options.componentSize ?? 12;
  const color = options.color ?? '#fff4d1';
  const outline = options.outline ?? '#492021';
  const name = kind + (forceDirection(vector) ? ' ' + forceDirection(vector) : '');
  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = '900 ' + fontSize + 'px system-ui,sans-serif';
  const nameWidth = ctx.measureText(name).width;
  ctx.font = '900 ' + componentSize + 'px Cambria,Georgia,serif';
  const numberWidth = Math.max(ctx.measureText(top).width, ctx.measureText(bottom).width);
  const columnWidth = Math.max(22, numberWidth + 12);
  const gap = 6;
  const start = anchor.x - (nameWidth + gap + columnWidth) / 2;
  const labelX = start;
  const columnX = start + nameWidth + gap;
  const textX = columnX + columnWidth / 2;

  ctx.font = '900 ' + fontSize + 'px system-ui,sans-serif';
  ctx.lineWidth = 3.3;
  ctx.strokeStyle = outline;
  ctx.fillStyle = color;
  ctx.strokeText(name, labelX, anchor.y);
  ctx.fillText(name, labelX, anchor.y);

  // Two numerical components visibly stacked inside continuous round brackets.
  ctx.font = '900 ' + componentSize + 'px Cambria,Georgia,serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 2.5;
  ctx.strokeText(top, textX, anchor.y - 7.1);
  ctx.strokeText(bottom, textX, anchor.y + 7.1);
  ctx.fillText(top, textX, anchor.y - 7.1);
  ctx.fillText(bottom, textX, anchor.y + 7.1);

  ctx.lineWidth = 1.6;
  ctx.strokeStyle = color;
  const left = columnX + 3;
  const right = columnX + columnWidth - 3;
  const high = anchor.y - 14;
  const low = anchor.y + 14;
  ctx.beginPath();
  ctx.moveTo(left + 3, high);
  ctx.bezierCurveTo(left - 4, high + 3, left - 4, low - 3, left + 3, low);
  ctx.moveTo(right - 3, high);
  ctx.bezierCurveTo(right + 4, high + 3, right + 4, low - 3, right - 3, low);
  ctx.stroke();
  ctx.restore();
}
