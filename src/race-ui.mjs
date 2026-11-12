import { NORTHERN_LOOP as circuit } from './circuit.mjs';
import {
  createRace, previewMove, possibleMoves, takeTurn, score, onTrack
} from './engine.mjs';

const $ = id => document.getElementById(id);
const canvas = $('course');
const ctx = canvas.getContext('2d');
const WIDTH = 960, HEIGHT = 700, SCALE = 25, OFFSET_X = 80, OFFSET_Y = 650;
const COLORS = {
  night: '#0a192b', ice: '#164b65', frost: '#b9eaf0',
  white: '#eff8fb', flare: '#ff7557', lime: '#d4fc77'
};
const choices = [
  [-1, 1, '↖'], [0, 1, '↑'], [1, 1, '↗'],
  [-1, 0, '←'], [0, 0, '•'], [1, 0, '→'],
  [-1, -1, '↙'], [0, -1, '↓'], [1, -1, '↘']
];
const useReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let state = createRace(circuit);
let selection = { x: 1, y: 0 };
let heading = 0;
let animation = null;
let flashUntil = 0;
let requestedFrame = 0;

const world = p => ({ x: OFFSET_X + p.x * SCALE, y: OFFSET_Y - p.y * SCALE });
const vectorText = p => '( ' + (p.x > 0 ? '+' : '') + p.x + ', ' +
  (p.y > 0 ? '+' : '') + p.y + ' )';
const interpolate = (a, b, t) => ({
  x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t
});
const clamp = (x, min, max) => Math.min(max, Math.max(min, x));

function tracePolygon(poly) {
  const p = world(poly[0]);
  ctx.moveTo(p.x, p.y);
  for (let i = 1; i < poly.length; i++) {
    const q = world(poly[i]);
    ctx.lineTo(q.x, q.y);
  }
  ctx.closePath();
}

function drawPine(x, y, radius) {
  const p = world({ x, y });
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = '#56788250';
  ctx.beginPath();
  ctx.ellipse(6, 9, radius * .66, radius * .34, -.3, 0, Math.PI * 2);
  ctx.fill();
  for (const [offset, factor, tone] of [
    [-.55, .78, '#163b4c'], [0, 1, '#205368'], [.35, .92, '#2e6175']
  ]) {
    ctx.fillStyle = tone;
    ctx.beginPath();
    ctx.moveTo(0, -radius * (1 + offset * .25));
    ctx.lineTo(-radius * .57 * factor, radius * (.42 + offset));
    ctx.lineTo(radius * .57 * factor, radius * (.42 + offset));
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = '#dbf3f2';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, -radius * .95);
  ctx.lineTo(-radius * .18, -radius * .42);
  ctx.stroke();
  ctx.restore();
}

function paintBackdrop() {
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, '#d0e6ea');
  gradient.addColorStop(.52, '#adcbd5');
  gradient.addColorStop(1, '#8cbbcb');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Deterministic, lightweight snow shadows. No nondeterministic animation.
  for (let i = 0; i < 110; i++) {
    const x = (i * 113 + i * i * 17) % WIDTH;
    const y = (i * 67 + i * i * 23) % HEIGHT;
    ctx.fillStyle = i % 3 === 0 ? '#f0fbf980' : '#568a9b29';
    ctx.beginPath();
    ctx.ellipse(x, y, 28 + i % 25, 4 + i % 7, -.26, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 125; i++) {
    const x = ((i * 13 + i * i * 7) % 39) - 3;
    const y = ((i * 19 + i * i * 11) % 31) - 3;
    if (!onTrack({ x, y }, circuit) && i % 3 !== 0) {
      drawPine(x, y, 11 + i % 11);
    }
  }
  // The central island becomes a tiny frosted alpine grove.
  for (const [x, y, r] of [
    [12, 12, 19], [14, 14, 13], [18, 12, 20], [20, 15, 16],
    [17, 15, 12], [11, 14, 15], [15, 11, 13], [21, 12, 14]
  ]) drawPine(x, y, r);
}

function paintTrack() {
  ctx.save();
  ctx.shadowColor = '#153b55a0';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 7;
  ctx.fillStyle = '#e7f8fa';
  ctx.beginPath();
  tracePolygon(circuit.outer);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  tracePolygon(circuit.outer);
  tracePolygon(circuit.inner);
  ctx.fillStyle = '#28566b';
  ctx.fill('evenodd');

  // The same polygon vertices define collision detection and painted edges.
  ctx.lineJoin = 'round';
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#e6faf9';
  ctx.beginPath();
  tracePolygon(circuit.outer);
  ctx.stroke();
  ctx.beginPath();
  tracePolygon(circuit.inner);
  ctx.stroke();

  ctx.lineWidth = 2;
  ctx.strokeStyle = '#77b1c7';
  ctx.beginPath();
  tracePolygon(circuit.outer);
  ctx.stroke();
  ctx.beginPath();
  tracePolygon(circuit.inner);
  ctx.stroke();

  ctx.beginPath();
  tracePolygon(circuit.outer);
  tracePolygon(circuit.inner);
  ctx.clip('evenodd');
  ctx.strokeStyle = '#c2e8eb1e';
  ctx.lineWidth = 2;
  for (let i = -10; i < WIDTH + 200; i += 29) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 100, HEIGHT);
    ctx.stroke();
  }
  ctx.restore();
}

function paintGrid() {
  if (!$('showGrid').checked) return;
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#2c5f72';
  ctx.globalAlpha = .15;
  for (let x = 0; x <= 34; x++) {
    const p = world({ x, y: 0 });
    ctx.beginPath();
    ctx.moveTo(p.x, 0);
    ctx.lineTo(p.x, HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= 27; y++) {
    const p = world({ x: 0, y });
    ctx.beginPath();
    ctx.moveTo(0, p.y);
    ctx.lineTo(WIDTH, p.y);
    ctx.stroke();
  }
  ctx.restore();
}

function paintGates() {
  for (const [i, gate] of circuit.checkpoints.entries()) {
    const a = world(gate.a), b = world(gate.b);
    const current = state.checkpoint === i && !state.finished;
    ctx.save();
    ctx.lineCap = 'butt';
    ctx.strokeStyle = current ? COLORS.lime : '#dcf5f5';
    ctx.globalAlpha = current ? .98 : .52;
    ctx.lineWidth = current ? 5 : 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Checkered start/finish ribbon, derived from the actual finish gate.
  const a = world(circuit.finish.a), b = world(circuit.finish.b);
  const segments = 12;
  ctx.save();
  for (let i = 0; i < segments; i++) {
    const h = Math.abs((b.y - a.y) / segments);
    const y = Math.min(a.y, b.y) + i * h;
    for (let j = 0; j < 2; j++) {
      ctx.fillStyle = (i + j) % 2 === 0 ? '#eef9f8' : '#16374a';
      ctx.fillRect(a.x - 8 + 8 * j, y, 8, h);
    }
  }
  ctx.restore();
}

function paintTrail(now) {
  ctx.save();
  for (let i = 0; i < state.trail.length; i++) {
    const segment = state.trail[i];
    const from = world(segment.from);
    let to = world(segment.to);
    if (animation && i === state.trail.length - 1) {
      const fraction = clamp((now - animation.start) / animation.duration, 0, 1);
      to = world(interpolate(animation.from, animation.to, fraction));
    }
    const dx = to.x - from.x, dy = to.y - from.y;
    const distance = Math.hypot(dx, dy);
    if (distance < .1) continue;
    const nx = -dy / distance * 3, ny = dx / distance * 3;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ddf5f5bf';
    for (const sign of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(from.x + nx * sign, from.y + ny * sign);
      ctx.lineTo(to.x + nx * sign, to.y + ny * sign);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function paintPreview() {
  if (state.finished) return;
  const p = world(state.position);
  const selected = previewMove(state, selection, circuit);
  const target = world(selected.to);

  ctx.save();
  ctx.lineWidth = 4;
  ctx.strokeStyle = selected.valid ? COLORS.lime : COLORS.flare;
  ctx.setLineDash([7, 7]);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(target.x, target.y);
  ctx.stroke();
  ctx.setLineDash([]);

  const moves = $('showOptions').checked ? possibleMoves(state, circuit) : [selected];
  for (const move of moves) {
    const point = world(move.to);
    const isSelected = move.to.x === selected.to.x &&
      move.to.y === selected.to.y;
    if (point.x < -20 || point.x > WIDTH + 20 ||
        point.y < -20 || point.y > HEIGHT + 20) continue;
    ctx.beginPath();
    ctx.arc(point.x, point.y, isSelected ? 10 : 6, 0, Math.PI * 2);
    ctx.fillStyle = move.valid ? '#b9eaf0' : '#ff7557';
    ctx.fill();
    ctx.lineWidth = isSelected ? 4 : 1.5;
    ctx.strokeStyle = isSelected ? (move.valid ? COLORS.lime : '#941c2b') : '#103044';
    ctx.stroke();
    if (!move.valid) {
      ctx.strokeStyle = '#0b2535';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(point.x - 3.5, point.y - 3.5);
      ctx.lineTo(point.x + 3.5, point.y + 3.5);
      ctx.moveTo(point.x + 3.5, point.y - 3.5);
      ctx.lineTo(point.x - 3.5, point.y + 3.5);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function paintSkimmer(p) {
  const { x, y } = world(p);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(heading);
  ctx.fillStyle = '#07192355';
  ctx.beginPath();
  ctx.ellipse(5, 7, 24, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  // Twin ice runners, slim canopy and the distinctive Flare nose.
  ctx.fillStyle = '#f2f8f5';
  ctx.fillRect(-24, -15, 47, 5);
  ctx.fillRect(-24, 10, 47, 5);
  ctx.beginPath();
  ctx.moveTo(29, 0);
  ctx.lineTo(-7, -14);
  ctx.lineTo(-21, -8);
  ctx.lineTo(-15, 0);
  ctx.lineTo(-21, 8);
  ctx.lineTo(-7, 14);
  ctx.closePath();
  ctx.fillStyle = COLORS.flare;
  ctx.strokeStyle = '#fff5e7';
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(-9, -6);
  ctx.lineTo(-15, 0);
  ctx.lineTo(-9, 6);
  ctx.closePath();
  ctx.fillStyle = COLORS.night;
  ctx.fill();
  ctx.restore();
}

function draw(now = performance.now()) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  paintBackdrop();
  paintTrack();
  paintGrid();
  paintGates();
  paintTrail(now);
  if (!animation) paintPreview();
  let skimmerPosition = state.position;
  if (animation) {
    const t = clamp((now - animation.start) / animation.duration, 0, 1);
    // The visual position is linear in t, never a smoothed curved shortcut.
    skimmerPosition = interpolate(animation.from, animation.to, t);
  }
  paintSkimmer(skimmerPosition);
  if (now < flashUntil) {
    ctx.fillStyle = '#ff755733';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}

function scheduleDraw() {
  if (!requestedFrame) requestedFrame = requestAnimationFrame(frame);
}

function frame(now) {
  requestedFrame = 0;
  if (animation && now >= animation.start + animation.duration) {
    animation = null;
    renderHUD();
  }
  draw(now);
  if (animation || now < flashUntil) scheduleDraw();
  else if (state.finished) {
    $('finalScore').textContent = score(state, circuit);
    $('finishPanel').hidden = false;
  }
}

function setAcceleration(x, y) {
  if (animation || state.finished) return;
  selection = { x, y };
  renderHUD();
  scheduleDraw();
}

function renderHUD() {
  $('currentVelocity').textContent = vectorText(state.velocity);
  $('selectedAcceleration').textContent = vectorText(selection);
  const preview = previewMove(state, selection, circuit);
  $('nextVelocity').textContent = vectorText(preview.velocity);
  $('moves').textContent = String(state.moves).padStart(2, '0');
  $('crashes').textContent = String(state.crashes).padStart(2, '0');
  $('score').textContent = String(score(state, circuit)).padStart(2, '0');
  $('lap').textContent = state.finished ? 'RACE FINISHED' : 'LAP 1 / ' + circuit.targetLaps;
  $('message').textContent = state.lastEvent.toUpperCase();
  $('nextMoveLabel').textContent = state.finished ? 'Circuit completed!' :
    preview.valid ? 'Valid glide — endpoint (' + preview.to.x + ', ' + preview.to.y + ')' :
      'CRASH WARNING — the full path leaves the race track.';
  $('nextMoveLabel').classList.toggle('warning-state', !preview.valid);
  $('commit').disabled = !!animation || state.finished;
  const buttons = [...$('accelerationPad').querySelectorAll('button')];
  for (const button of buttons) {
    const active = Number(button.dataset.x) === selection.x &&
      Number(button.dataset.y) === selection.y;
    button.setAttribute('aria-pressed', String(active));
    button.disabled = !!animation || state.finished;
  }
  for (const [i, li] of [...document.querySelectorAll('[data-checkpoint]')].entries()) {
    li.classList.toggle('cleared', state.finished || i < state.checkpoint);
    li.classList.toggle('active', !state.finished && i === state.checkpoint);
  }
}

function commit() {
  if (animation || state.finished) return;
  const before = state;
  state = takeTurn(state, selection, circuit);
  if (state.crashes > before.crashes) {
    flashUntil = performance.now() + (useReducedMotion.matches ? 100 : 350);
  } else {
    if (state.velocity.x || state.velocity.y) {
      heading = Math.atan2(-state.velocity.y, state.velocity.x);
    }
    const distance = Math.hypot(
      state.position.x - before.position.x, state.position.y - before.position.y
    );
    if (distance && !useReducedMotion.matches) {
      animation = {
        from: before.position, to: state.position,
        start: performance.now(), duration: clamp(250 + distance * 44, 300, 690)
      };
    }
  }
  renderHUD();
  scheduleDraw();
}

function reset() {
  state = createRace(circuit);
  selection = { x: 1, y: 0 };
  animation = null;
  heading = 0;
  flashUntil = 0;
  $('finishPanel').hidden = true;
  renderHUD();
  scheduleDraw();
}

const pad = $('accelerationPad');
for (const [x, y, symbol] of choices) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.x = x;
  button.dataset.y = y;
  button.textContent = symbol;
  button.title = 'Acceleration ' + vectorText({ x, y });
  button.setAttribute('aria-label', 'Acceleration ' + vectorText({ x, y }));
  button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => setAcceleration(x, y));
  pad.appendChild(button);
}

$('commit').addEventListener('click', commit);
$('reset').addEventListener('click', reset);
$('raceAgain').addEventListener('click', reset);
$('showGrid').addEventListener('change', scheduleDraw);
$('showOptions').addEventListener('change', scheduleDraw);

canvas.addEventListener('click', event => {
  if (animation || state.finished) return;
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * WIDTH / rect.width;
  const y = (event.clientY - rect.top) * HEIGHT / rect.height;
  let best = null, nearest = 24 * 24;
  for (const candidate of possibleMoves(state, circuit)) {
    const pos = world(candidate.to);
    const distance = (pos.x - x) ** 2 + (pos.y - y) ** 2;
    if (distance < nearest) {
      nearest = distance;
      best = candidate.acceleration;
    }
  }
  if (best) setAcceleration(best.x, best.y);
});

window.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.target instanceof HTMLElement && event.target.matches('input')) return;
  const coordinates = {
    Digit1: [-1, -1], Digit2: [0, -1], Digit3: [1, -1],
    Digit4: [-1, 0], Digit5: [0, 0], Digit6: [1, 0],
    Digit7: [-1, 1], Digit8: [0, 1], Digit9: [1, 1],
    Numpad1: [-1, -1], Numpad2: [0, -1], Numpad3: [1, -1],
    Numpad4: [-1, 0], Numpad5: [0, 0], Numpad6: [1, 0],
    Numpad7: [-1, 1], Numpad8: [0, 1], Numpad9: [1, 1]
  };
  if (coordinates[event.code]) {
    event.preventDefault();
    setAcceleration(...coordinates[event.code]);
  } else if (event.code === 'KeyR') {
    event.preventDefault();
    reset();
  } else if ((event.code === 'Enter' || event.code === 'Space') &&
             !(event.target instanceof HTMLElement && event.target.closest('button'))) {
    event.preventDefault();
    commit();
  } else if (event.code.startsWith('Arrow')) {
    event.preventDefault();
    const dx = event.code === 'ArrowRight' ? 1 : event.code === 'ArrowLeft' ? -1 : 0;
    const dy = event.code === 'ArrowUp' ? 1 : event.code === 'ArrowDown' ? -1 : 0;
    setAcceleration(clamp(selection.x + dx, -1, 1), clamp(selection.y + dy, -1, 1));
  }
});

function resize() {
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);
  scheduleDraw();
}
if (typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(resize).observe(canvas);
} else {
  window.addEventListener('resize', resize);
}
renderHUD();
resize();
