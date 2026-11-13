/**
 * Presentation only. Every button keeps its original coordinate data,
 * position, event handler, focus, selected state and physics semantics.
 *
 * Master shows the nine acceleration choices as genuine stacked (x over y)
 * column vectors. Other modes keep the arrow-based 3×3 keypad.
 */
import { modePolicy } from './assistance.mjs';
import { vectorDescription, vectorEntries } from './vector-notation.mjs';

export const ACCELERATION_GRID = Object.freeze([
  Object.freeze({ x: -1, y: 1, symbol: '↖' }),
  Object.freeze({ x:  0, y: 1, symbol: '↑' }),
  Object.freeze({ x:  1, y: 1, symbol: '↗' }),
  Object.freeze({ x: -1, y: 0, symbol: '←' }),
  Object.freeze({ x:  0, y: 0, symbol: '•' }),
  Object.freeze({ x:  1, y: 0, symbol: '→' }),
  Object.freeze({ x: -1, y:-1, symbol: '↙' }),
  Object.freeze({ x:  0, y:-1, symbol: '↓' }),
  Object.freeze({ x:  1, y:-1, symbol: '↘' })
]);

export function accelerationChoice(x, y) {
  if (!Number.isInteger(x) || !Number.isInteger(y)) {
    throw new TypeError('Acceleration components must be integers');
  }
  const choice = ACCELERATION_GRID.find(a => a.x === x && a.y === y);
  if (!choice) throw new RangeError('Only −1, 0 and +1 are allowed per component');
  return choice;
}

export function accelerationChoiceDescription(x, y) {
  return vectorDescription(accelerationChoice(x, y), 'Acceleration');
}

export function drawAccelerationPad(pad, mode) {
  if (!pad) throw new TypeError('Acceleration pad is required');
  const notation = modePolicy(mode).accelerationNotation;
  const buttons = [...pad.querySelectorAll('button[data-x][data-y]')];
  if (buttons.length !== 9) throw new RangeError('Acceleration pad must contain nine buttons');
  for (const button of buttons) {
    const choice = accelerationChoice(Number(button.dataset.x), Number(button.dataset.y));
    button.title = accelerationChoiceDescription(choice.x, choice.y);
    button.setAttribute('aria-label', accelerationChoiceDescription(choice.x, choice.y));
    if (notation === 'columns') {
      const [x, y] = vectorEntries(choice);
      const matrix = document.createElement('span');
      matrix.className = 'column-vector';
      matrix.setAttribute('aria-hidden', 'true');
      const top = document.createElement('span');
      top.dataset.component = 'x';
      top.textContent = x;
      const bottom = document.createElement('span');
      bottom.dataset.component = 'y';
      bottom.textContent = y;
      matrix.replaceChildren(top, bottom);
      button.replaceChildren(matrix);
    } else {
      button.textContent = choice.symbol;
    }
  }
  pad.dataset.notation = notation;
  return notation;
}
