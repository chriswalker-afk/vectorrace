import { NORTHERN_LOOP as circuit } from './circuit.mjs';
import { createSnowshiftArtwork } from './race-art.mjs';
import { modePolicy, moveExplanation } from './assistance.mjs';
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
let mode = 'guided';
let gridEnabled = true;
let tutorialStep = -1;
let canvasFit = { scale: 1, offsetX: 0, offsetY: 0 };
const artwork = createSnowshiftArtwork(() => scheduleDraw());

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

function paintGrid() {
  if (!gridEnabled) return;
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

  // Gate callouts sit off-road so they cannot mask legal landing positions.
  const callouts = [
    { x: 31.7, y: 14.8, text: 'CP1' },
    { x: 17.4, y: 1.5, text: 'CP2' },
    { x: .8, y: 15, text: 'CP3' }
  ];
  for (const [i, label] of callouts.entries()) {
    const p = world(label);
    const active = state.checkpoint === i && !state.finished;
    ctx.save();
    ctx.fillStyle = active ? '#d4fc77' : '#09293fda';
    ctx.strokeStyle = '#c5eaf1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(p.x - 23, p.y - 12, 46, 24, 5);
    ctx.fill();
    ctx.stroke();
    ctx.font = '900 12px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = active ? '#102b3a' : '#eff9fb';
    ctx.fillText(label.text, p.x, p.y);
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
  const policy = modePolicy(mode);
  if (!policy.selectedDestination) return; // Expert means no prediction.
  const start = world(state.position);
  const selected = previewMove(state, selection, circuit);
  const target = world(selected.to);

  ctx.save();
  ctx.strokeStyle = selected.valid ? COLORS.lime : COLORS.flare;
  ctx.lineWidth = 4.8;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(target.x, target.y);
  ctx.stroke();
  ctx.setLineDash([]);

  const choicesToDraw = policy.allDestinations
    ? possibleMoves(state, circuit) : [selected];
  for (const move of choicesToDraw) {
    const p = world(move.to);
    const highlighted = move.to.x === selected.to.x && move.to.y === selected.to.y;
    if (p.x < -15 || p.x > WIDTH + 15 || p.y < -15 || p.y > HEIGHT + 15) continue;
    ctx.beginPath();
    ctx.arc(p.x, p.y, highlighted ? 12 : 7.5, 0, Math.PI * 2);
    ctx.fillStyle = move.valid ? '#bbe9f6' : '#ff7557';
    ctx.fill();
    ctx.strokeStyle = highlighted ? (move.valid ? '#d4fc77' : '#8d222a') : '#14384b';
    ctx.lineWidth = highlighted ? 4 : 2;
    ctx.stroke();
    if (!move.valid) {
      ctx.strokeStyle = '#10283a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x - 4, p.y - 4);ctx.lineTo(p.x + 4, p.y + 4);
      ctx.moveTo(p.x + 4, p.y - 4);ctx.lineTo(p.x - 4, p.y + 4);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function draw(now = performance.now()) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  artwork.paintScene(ctx, WIDTH, HEIGHT, world, circuit);
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
  artwork.drawSkimmer(ctx, world(skimmerPosition), heading, Math.hypot(state.velocity.x, state.velocity.y));
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

const tour = [
  {
    title:'Keep your momentum',
    text:'Your velocity carries over. Choose an acceleration rather than a destination.',
    next:'SHOW ME'
  },
  {
    title:'Choose an acceleration',
    text:'Tap an arrow. Each velocity component changes by −1, 0 or +1.',
    next:'NEXT'
  },
  {
    title:'Commit your glide',
    text:'Press GLIDE. Your new velocity determines your next position.',
    next:'NEXT'
  },
  {
    title:'Plan before the corners',
    text:'Brake before corners. Pass East, South and West gates, then finish.',
    next:'GOT IT'
  }
];

function renderTutorial() {
  const visible = tutorialStep >= 0;
  $('tutorial').hidden = !visible;
  $('help').setAttribute('aria-expanded', String(visible));
  if (!visible) return;
  const step = tour[tutorialStep];
  $('tourIndex').textContent = (tutorialStep + 1) + ' / ' + tour.length;
  $('tourTitle').textContent = step.title;
  $('tourText').textContent = step.text;
  $('tourNext').textContent = step.next + ' ↗';
  document.querySelector('.acceleration-pad').classList.toggle('tour-focus', tutorialStep === 1);
  $('commit').classList.toggle('tour-focus', tutorialStep === 2);
}
function closeTutorial() {
  tutorialStep = -1;
  $('tutorial').hidden = true;
  $('help').setAttribute('aria-expanded', 'false');
  document.querySelector('.acceleration-pad').classList.remove('tour-focus');
  $('commit').classList.remove('tour-focus');
}
function setTutorialStep(next) {
  if (next >= tour.length) return closeTutorial();
  tutorialStep = next;
  renderTutorial();
}

function setMode(nextMode) {
  const policy = modePolicy(nextMode);
  mode = nextMode;
  // Grid is a freely overridable preference. A mode change restores its recommended default.
  gridEnabled = policy.coordinateGrid;
  for (const button of document.querySelectorAll('[data-mode]')) {
    button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
  }
  $('showGrid').setAttribute('aria-pressed', String(gridEnabled));
  $('showGrid').querySelector('span').textContent = gridEnabled ? 'GRID ON' : 'GRID OFF';
  renderHUD();
  scheduleDraw();
}
function setAcceleration(x, y) {
  if (animation || state.finished) return;
  selection = { x, y };
  if (tutorialStep === 1) setTutorialStep(2);
  renderHUD();
  scheduleDraw();
}

function renderHUD() {
  const selected = previewMove(state, selection, circuit);
  const policy = modePolicy(mode);
  $('currentVelocity').textContent = vectorText(state.velocity);
  $('selectedAcceleration').textContent = vectorText(selection);
  $('nextVelocity').textContent = policy.nextVelocity ? vectorText(selected.velocity) : '( ?, ? )';
  $('nextVelocity').setAttribute('aria-label', policy.nextVelocity
    ? 'Next velocity ' + vectorText(selected.velocity) : 'Next velocity hidden in Expert mode');
  $('moves').textContent = String(state.moves).padStart(2, '0');
  $('crashes').textContent = String(state.crashes).padStart(2, '0');
  $('score').textContent = String(score(state, circuit)).padStart(2, '0');
  $('lap').textContent = state.finished ? 'FINISHED' : 'LAP 1 / ' + circuit.targetLaps;

  const explanation = moveExplanation(state, selection, mode, selected);
  $('nextMoveLabel').textContent = explanation.message;
  $('nextMoveLabel').dataset.tone = explanation.tone;
  $('message').textContent = state.lastEvent.toUpperCase();
  $('commit').disabled = !!animation || state.finished;

  for (const button of $('accelerationPad').querySelectorAll('button')) {
    const pressed = Number(button.dataset.x) === selection.x &&
      Number(button.dataset.y) === selection.y;
    button.setAttribute('aria-pressed', String(pressed));
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
  if (tutorialStep === 2) setTutorialStep(3);
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
for (const button of $('modeOptions').querySelectorAll('button')) {
  button.addEventListener('click', () => setMode(button.dataset.mode));
}
$('commit').addEventListener('click', commit);
$('reset').addEventListener('click', reset);
$('raceAgain').addEventListener('click', reset);
$('showGrid').addEventListener('click', () => {
  gridEnabled = !gridEnabled;
  $('showGrid').setAttribute('aria-pressed', String(gridEnabled));
  $('showGrid').querySelector('span').textContent = gridEnabled ? 'GRID ON' : 'GRID OFF';
  scheduleDraw();
});
$('help').addEventListener('click', () => tutorialStep >= 0 ? closeTutorial() : setTutorialStep(0));
$('closeTutorial').addEventListener('click', closeTutorial);
$('tourSkip').addEventListener('click', closeTutorial);
$('tourNext').addEventListener('click', () => setTutorialStep(tutorialStep + 1));

canvas.addEventListener('click', event => {
  if (animation || state.finished || !modePolicy(mode).selectedDestination) return;
  const rect = canvas.getBoundingClientRect();
  const sceneX = ((event.clientX - rect.left) - canvasFit.offsetX) / canvasFit.scale;
  const sceneY = ((event.clientY - rect.top) - canvasFit.offsetY) / canvasFit.scale;
  let best = null;
  let nearest = (22 / canvasFit.scale) ** 2;
  for (const candidate of possibleMoves(state, circuit)) {
    const p = world(candidate.to);
    const distance = (p.x - sceneX) ** 2 + (p.y - sceneY) ** 2;
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
  if (event.code === 'Escape' && tutorialStep >= 0) {
    event.preventDefault(); closeTutorial(); return;
  }
  const coordinates = {
    Digit1: [-1, -1], Digit2: [0, -1], Digit3: [1, -1],
    Digit4: [-1, 0], Digit5: [0, 0], Digit6: [1, 0],
    Digit7: [-1, 1], Digit8: [0, 1], Digit9: [1, 1],
    Numpad1: [-1, -1], Numpad2: [0, -1], Numpad3: [1, -1],
    Numpad4: [-1, 0], Numpad5: [0, 0], Numpad6: [1, 0],
    Numpad7: [-1, 1], Numpad8: [0, 1], Numpad9: [1, 1]
  };
  if (coordinates[event.code]) {
    event.preventDefault(); setAcceleration(...coordinates[event.code]);
  } else if (event.code === 'KeyR') {
    event.preventDefault(); reset();
  } else if (event.code === 'KeyG') {
    event.preventDefault(); $('showGrid').click();
  } else if (event.code === 'KeyH') {
    event.preventDefault(); $('help').click();
  } else if ((event.code === 'Enter' || event.code === 'Space') &&
             !(event.target instanceof HTMLElement && event.target.closest('button'))) {
    event.preventDefault(); commit();
  } else if (event.code.startsWith('Arrow')) {
    event.preventDefault();
    const dx = event.code === 'ArrowRight' ? 1 : event.code === 'ArrowLeft' ? -1 : 0;
    const dy = event.code === 'ArrowUp' ? 1 : event.code === 'ArrowDown' ? -1 : 0;
    setAcceleration(clamp(selection.x + dx, -1, 1), clamp(selection.y + dy, -1, 1));
  }
});

function resize() {
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  const pixelX = canvas.width / rect.width, pixelY = canvas.height / rect.height;
  const scale = Math.min(rect.width / WIDTH, rect.height / HEIGHT);
  const offsetX = (rect.width - WIDTH * scale) / 2;
  const offsetY = (rect.height - HEIGHT * scale) / 2;
  canvasFit = { scale, offsetX, offsetY };
  ctx.setTransform(scale * pixelX, 0, 0, scale * pixelY,
    offsetX * pixelX, offsetY * pixelY);
  scheduleDraw();
}
if (typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(resize).observe(canvas);
} else {
  window.addEventListener('resize', resize);
}
setMode('guided');
renderHUD();
resize();
