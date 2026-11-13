/**
 * Present velocity and acceleration as vertical (x,y) column vectors.
 * A point's position is different and may still be written as (x, y).
 *
 * DOM visuals use two vertically stacked entries inside curved brackets.
 * One concise aria-label describes the two components for screen readers.
 */
export function vectorEntries(vector, hidden = false) {
  if (hidden) return ['?', '?'];
  if (!vector || !Number.isInteger(vector.x) || !Number.isInteger(vector.y)) {
    throw new TypeError('Column vector entries must be integer x and y components');
  }
  return [String(vector.x), String(vector.y)];
}

export function vectorDescription(vector, name = 'Vector', hidden = false) {
  if (hidden) return name + ' column vector: both components hidden in Expert mode';
  const [x, y] = vectorEntries(vector);
  return name + ' column vector: top x-component ' + x + ', bottom y-component ' + y;
}

export function renderColumnVector(element, vector, options = {}) {
  if (!element) throw new TypeError('A vector display element is required');
  const { name = 'Vector', hidden = false } = options;
  let matrix = element.querySelector('.column-vector');
  if (!matrix) {
    matrix = document.createElement('span');
    matrix.className = 'column-vector';
    matrix.setAttribute('aria-hidden', 'true');
    for (const component of ['x', 'y']) {
      const entry = document.createElement('span');
      entry.setAttribute('data-component', component);
      matrix.appendChild(entry);
    }
    element.replaceChildren(matrix);
  }
  const [x, y] = vectorEntries(vector, hidden);
  matrix.querySelector('[data-component="x"]').textContent = x;
  matrix.querySelector('[data-component="y"]').textContent = y;
  element.classList.add('vector-display');
  element.setAttribute('role', 'img');
  element.setAttribute('aria-label', vectorDescription(vector, name, hidden));
  element.dataset.hidden = String(hidden);
}
