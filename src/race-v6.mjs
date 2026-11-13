import { CIRCUITS, getCircuit } from './circuit.mjs';
import { renderColumnVector, vectorDescription } from './vector-notation.mjs';
import { ACCELERATION_GRID, drawAccelerationPad } from './acceleration-pad.mjs';
import { createSnowshiftArtwork } from './race-art.mjs';
import { modePolicy, moveExplanation } from './assistance.mjs';
import { brakingForecast, corneringMessage } from './race-coach.mjs';
import { createRecordStore } from './race-records.mjs';
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
const useReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let circuit = getCircuit(new URLSearchParams(location.search).get('track'));
let state = createRace(circuit);
let selection = { x: 1, y: 0 };
let heading = 0;
let animation = null;
let flashUntil = 0;
let requestedFrame = 0;
let burst = null;
let toastUntil = 0;
let ghostEnabled = true;
const storage = (() => { try { return window.localStorage; } catch { return null; } })();
let records = createRecordStore(storage, circuit.id);
let bestRecord = records.load();
let turnFrames = [{ ...state.position }];
let mode = 'guided';
let gridEnabled = true;
let tutorialStep = -1;
let canvasFit = { scale: 1, offsetX: 0, offsetY: 0 };
const artwork = createSnowshiftArtwork(() => scheduleDraw());

const world = p => ({ x: OFFSET_X + p.x * SCALE, y: OFFSET_Y - p.y * SCALE });
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


function paintGhost(now) {
  if (!ghostEnabled || !modePolicy(mode).selectedDestination || !bestRecord) return;
  const frames = bestRecord.frames;
  const i = Math.min(state.moves, frames.length - 1);
  const prev = frames[Math.max(0, i - 1)];
  const current = frames[i];
  if (!current) return;
  let position = current;
  if (animation && i > 0) {
    const t = clamp((now - animation.start) / animation.duration, 0, 1);
    position = interpolate(prev, current, t);
  }
  ctx.save();
  ctx.lineWidth = 2.3;
  ctx.strokeStyle = '#b3f5ffbd';
  ctx.setLineDash([3, 6]);
  for (let k = Math.max(1, i - 7); k <= i; k++) {
    const start = world(frames[k - 1]);
    let end = world(frames[k]);
    if (k === i && animation) end = world(position);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  const p = world(position);
  ctx.translate(p.x, p.y);
  const vx = current.x - prev.x;
  const vy = current.y - prev.y;
  ctx.rotate(vx || vy ? Math.atan2(-vy, vx) : 0);
  ctx.globalAlpha = .83;
  ctx.fillStyle = '#bbfaff';
  ctx.strokeStyle = '#12374b';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(19, 0);
  ctx.lineTo(-11, -10);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-11, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function paintMomentum() {
  if (!state.velocity.x && !state.velocity.y) return;
  const p = world(state.position);
  const dx = state.velocity.x * 11;
  const dy = -state.velocity.y * 11;
  const norm = Math.hypot(dx, dy);
  if (!norm) return;
  const ex = p.x + dx, ey = p.y + dy;
  const nx = dx / norm, ny = dy / norm;
  ctx.save();
  ctx.strokeStyle = '#aef7ffe4';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ex - nx * 8 + ny * 5, ey - ny * 8 - nx * 5);
  ctx.lineTo(ex, ey);
  ctx.lineTo(ex - nx * 8 - ny * 5, ey - ny * 8 + nx * 5);
  ctx.stroke();
  ctx.restore();
}

// Guided forecast: selected move, followed by the strongest component-wise
// braking at each future turn. The exact engine validates every segment.
function paintBrakeGuide() {
  if (mode !== 'guided' || state.finished) return;
  const forecast = brakingForecast(state, selection, circuit);
  if (!forecast.selected.valid || !forecast.braking?.segments.length) return;
  ctx.save();
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.setLineDash([3, 7]);
  for (const move of forecast.braking.segments) {
    const a = world(move.from), b = world(move.to);
    ctx.strokeStyle = move.valid ? '#ffd78fd3' : '#ff7557';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    if (!move.valid) break;
  }
  ctx.setLineDash([]);
  if (forecast.braking.safe && forecast.braking.stop) {
    const p = world(forecast.braking.stop);
    ctx.strokeStyle = '#ffe29a';
    ctx.fillStyle = '#183f56eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffe29a';
    ctx.font = '900 12px system-ui';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText('S', p.x, p.y + .5); // Stopping point, not a goal.
  }
  ctx.restore();
}
function spawnBurst(position, kind, now) {
  burst = { position: world(position), kind, start: now, duration: kind === 'crash' ? 650 : 800 };
}
function paintBurst(now) {
  if (!burst) return;
  const t = clamp((now - burst.start) / burst.duration, 0, 1);
  if (t >= 1) { burst = null; return; }
  const { x, y } = burst.position;
  const count = burst.kind === 'crash' ? 17 : 14;
  const radius = burst.kind === 'crash' ? 78 : 64;
  ctx.save();
  ctx.globalAlpha = (1 - t) * (1 - t);
  ctx.lineWidth = burst.kind === 'crash' ? 3.5 : 2.6;
  ctx.strokeStyle = burst.kind === 'crash' ? '#ff9e78' : '#e3ff92';
  ctx.beginPath();
  ctx.arc(x, y, 10 + t * radius * .66, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < count; i++) {
    const angle = i * Math.PI * 2 / count + state.moves * .23;
    const distance = (10 + t * radius) * (.75 + ((i * 7) % 5) * .075);
    const px = x + Math.cos(angle) * distance;
    const py = y + Math.sin(angle) * distance;
    ctx.fillStyle = burst.kind === 'crash' ? (i % 3 ? '#eaffff' : '#ffad72') :
      (i % 2 ? '#d4fc77' : '#bdefff');
    ctx.beginPath();
    ctx.arc(px, py, 2 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
function showToast(text, tone = 'gate', duration = 980) {
  const toast = $('eventToast');
  toast.hidden = false;
  toast.textContent = text;
  toast.dataset.tone = tone;
  toastUntil = performance.now() + duration;
  scheduleDraw();
}
function recordFinishedRace() {
  const result = records.saveIfBetter(
    score(state, circuit), state.moves, state.crashes, turnFrames
  );
  bestRecord = result.best;
  $('recordBadge').textContent = bestRecord ? '· PB ' + bestRecord.score : '· PB —';
  $('ghostToggle').hidden = !bestRecord || !modePolicy(mode).selectedDestination;
  $('bestResult').textContent = result.improved
    ? result.persisted ? 'NEW LOCAL BEST! · ' + result.best.score :
      'NEW SESSION BEST · ' + result.best.score
    : bestRecord ? 'LOCAL BEST ' + bestRecord.score + ' · SCORE ' + score(state,circuit) :
      'SCORE ' + score(state,circuit);
  showToast(result.improved ? 'NEW PERSONAL BEST!' : 'FINISH LINE!', 'record', 1100);
}

function draw(now = performance.now()) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  artwork.paintScene(ctx, WIDTH, HEIGHT, world, circuit);
  paintGrid();
  paintGates();
  paintGhost(now);
  paintTrail(now);
  if (!animation) {
    paintBrakeGuide();
    paintPreview();
    paintMomentum();
  }
  let skimmerPosition = state.position;
  if (animation) {
    const t = clamp((now - animation.start) / animation.duration, 0, 1);
    // The visual position is linear in t, never a smoothed curved shortcut.
    skimmerPosition = interpolate(animation.from, animation.to, t);
  }
  artwork.drawSkimmer(ctx, world(skimmerPosition), heading, Math.hypot(state.velocity.x, state.velocity.y));
  if (!useReducedMotion.matches) paintBurst(now);
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
  if (toastUntil && now >= toastUntil) {
    toastUntil = 0;
    $('eventToast').hidden = true;
  }
  draw(now);
  const burstActive = !!burst && now < burst.start + burst.duration;
  if (animation || now < flashUntil || toastUntil || burstActive) scheduleDraw();
  else if (state.finished) {
    $('finalScore').textContent = score(state, circuit);
    $('finishPanel').hidden = false;
  }
}


function renderCircuitUI() {
  const number = String(CIRCUITS.indexOf(circuit) + 1).padStart(2, '0');
  $('mapNumber').textContent = number;
  $('mapName').textContent = circuit.name.toUpperCase();
  $('mapLevel').childNodes[0].textContent = circuit.level + ' ';
  $('circuitHeading').textContent = number + ' / ' + circuit.name.toUpperCase();
  $('mapPicker').setAttribute('aria-label',
    'Choose race circuit. Current: ' + circuit.name + ', ' + circuit.level);
  $('mapName').closest('.game-board').setAttribute('aria-label',circuit.name+' race circuit');
  document.title = 'SNOWSHIFT · ' + circuit.name + ' · Race V6';
  for(const option of document.querySelectorAll('[data-circuit]')) {
    option.setAttribute('aria-current',String(option.dataset.circuit === circuit.id));
  }
}
function closeMapMenu() {
  $('mapMenu').hidden = true;
  $('mapPicker').setAttribute('aria-expanded','false');
}
function toggleMapMenu() {
  const open=$('mapMenu').hidden;
  $('mapMenu').hidden = !open;
  $('mapPicker').setAttribute('aria-expanded',String(open));
}
function switchCircuit(nextId) {
  const next = getCircuit(nextId);
  closeMapMenu();
  if (next.id === circuit.id) return;
  circuit = next;
  records = createRecordStore(storage, circuit.id);
  bestRecord = records.load();
  closeTutorial();
  reset();
  renderCircuitUI();
  $('ghostToggle').hidden = !bestRecord || !modePolicy(mode).selectedDestination;
  // Deep-linkable track selection while preserving ?qa=1 if active.
  const url = new URL(window.location.href);
  url.searchParams.set('track',circuit.id);
  history.replaceState(null,'',url);
  showToast(circuit.name.toUpperCase()+' · '+circuit.level, 'gate', 1100);
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
    text:'The amber S shows where full braking stops you. Brake early and clear the gates.',
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
  $('tourText').textContent = tutorialStep === 1 && mode === 'master'
    ? 'Choose a column vector. Top is horizontal (x), bottom is vertical (y).'
    : step.text;
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
  drawAccelerationPad($('accelerationPad'), mode);
  $('accelNotationHint').textContent = policy.accelerationNotation === 'columns'
    ? 'TOP x · BOTTOM y' : '−1, 0 or +1 each axis';
  $('ghostToggle').hidden = !bestRecord || !policy.selectedDestination;
  if (tutorialStep >= 0) renderTutorial();
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
  renderColumnVector($('currentVelocity'), state.velocity, { name: 'Velocity' });
  renderColumnVector($('selectedAcceleration'), selection, { name: 'Acceleration' });
  renderColumnVector($('nextVelocity'), selected.velocity, {
    name: 'Next velocity', hidden: !policy.nextVelocity
  });
  $('moves').textContent = String(state.moves).padStart(2, '0');
  $('crashes').textContent = String(state.crashes).padStart(2, '0');
  $('score').textContent = String(score(state, circuit)).padStart(2, '0');
  $('lap').textContent = state.finished ? 'FINISHED' : 'LAP 1 / ' + circuit.targetLaps;

  const explanation = moveExplanation(state, selection, mode, selected);
  if (mode === 'guided' && !state.finished) {
    const forecast = brakingForecast(state, selection, circuit);
    $('nextMoveLabel').textContent = corneringMessage(forecast);
    $('nextMoveLabel').dataset.tone = forecast.risk === 'clear' ? 'safe' : 'danger';
  } else {
    $('nextMoveLabel').textContent = explanation.message;
    $('nextMoveLabel').dataset.tone = explanation.tone;
  }
  $('recordBadge').textContent = bestRecord ? '· PB ' + bestRecord.score : '· PB —';
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
  const now = performance.now();
  state = takeTurn(state, selection, circuit);
  turnFrames.push({ ...state.position });
  if (tutorialStep === 2) setTutorialStep(3);
  if (state.crashes > before.crashes) {
    flashUntil = now + (useReducedMotion.matches ? 0 : 340);
    if (!useReducedMotion.matches) spawnBurst(state.position, 'crash', now);
    showToast('SNOWBANK! +3 PENALTY', 'crash', 1050);
  } else {
    if (state.velocity.x || state.velocity.y) {
      heading = Math.atan2(-state.velocity.y, state.velocity.x);
    }
    const distance = Math.hypot(
      state.position.x - before.position.x,
      state.position.y - before.position.y
    );
    if (distance && !useReducedMotion.matches) {
      animation = {
        from: before.position, to: state.position,
        start: now, duration: clamp(210 + distance * 49, 270, 650)
      };
    }
    if (state.finished) {
      if (!useReducedMotion.matches) spawnBurst(state.position, 'gate', now);
      recordFinishedRace();
    } else if (state.checkpoint !== before.checkpoint) {
      if (!useReducedMotion.matches) spawnBurst(state.position, 'gate', now);
      showToast(state.lastEvent.toUpperCase() + ' ✓', 'gate', 900);
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
  burst = null;
  toastUntil = 0;
  $('eventToast').hidden = true;
  turnFrames = [{ ...state.position }];
  $('finishPanel').hidden = true;
  renderHUD();
  scheduleDraw();
}

const pad = $('accelerationPad');
for (const { x, y, symbol } of ACCELERATION_GRID) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.x = x;
  button.dataset.y = y;
  button.dataset.symbol = symbol;
  button.textContent = symbol;
  button.title = vectorDescription({ x, y }, 'Acceleration');
  button.setAttribute('aria-label', vectorDescription({ x, y }, 'Acceleration'));
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
$('mapPicker').addEventListener('click', toggleMapMenu);
for (const option of document.querySelectorAll('[data-circuit]')) {
  option.addEventListener('click', () => switchCircuit(option.dataset.circuit));
}
document.addEventListener('pointerdown', event => {
  if ($('mapMenu').hidden) return;
  if (event.target instanceof Node && !$('mapMenu').contains(event.target)
      && !$('mapPicker').contains(event.target)) closeMapMenu();
});
$('ghostToggle').addEventListener('click', () => {
  ghostEnabled = !ghostEnabled;
  $('ghostToggle').setAttribute('aria-pressed', String(ghostEnabled));
  scheduleDraw();
});
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
  if (event.code === 'Escape' && !$('mapMenu').hidden) {
    event.preventDefault(); closeMapMenu(); $('mapPicker').focus(); return;
  }
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
renderCircuitUI();
$('recordBadge').textContent = bestRecord ? '· PB ' + bestRecord.score : '· PB —';
$('ghostToggle').hidden = !bestRecord;
renderHUD();
resize();
