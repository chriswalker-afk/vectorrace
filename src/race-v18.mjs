import { CIRCUITS, getCircuit } from './circuit.mjs';
import { renderColumnVector, vectorDescription } from './vector-notation.mjs';
import { ACCELERATION_GRID, drawAccelerationPad } from './acceleration-pad.mjs';
import { createSnowshiftArtwork } from './race-art-v17.mjs';
import { parseGameSettings, createHotseat, playHotseatMove, nextHotseatPlayer,
  activateHotseatPlayer, hotseatFinished, hotseatStandings, selectUrl } from './pass-play.mjs';
import { biomeForCircuit, tierFromLevel } from './biomes.mjs';
import { modePolicy, moveExplanation } from './assistance.mjs';
import { brakingForecast, corneringMessage } from './race-coach.mjs';
import { createRecordStore } from './race-records.mjs';
import {
  createRace, previewMove, possibleMoves, takeTurn, score, onTrack,
  glassIceZoneAt, accelerationAllowed, windZoneAt, boostZoneAt, movingObstaclePeriod
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
const urlParams = new URLSearchParams(location.search);
const gameSettings = parseGameSettings(urlParams);
const multiplayer = gameSettings.gameType === 'pass-play';
const requestedTrack = urlParams.get('track');
// Never silently begin Track 1 on missing or outdated navigation.
if (!CIRCUITS.some(c => c.id === requestedTrack))
  location.replace(selectUrl(gameSettings.gameType, gameSettings.players));
let circuit = getCircuit(requestedTrack);
let match = multiplayer ? createHotseat(circuit, gameSettings.players) : null;
let state = multiplayer ? match.players[0].state : createRace(circuit);
let handoffPending = false;
let awaitingNextPlayer = false;
let selection = { x: 1, y: 0 };
let heading = 0;
let animation = null;
let hazardMotion = null;
let flashUntil = 0;
let requestedFrame = 0;
let burst = null;
let toastUntil = 0;
let ghostEnabled = true;
const storage = (() => { try { return window.localStorage; } catch { return null; } })();
let records = createRecordStore(storage, circuit.id);
let bestRecord = multiplayer ? null : records.load();
let turnFrames = [{ ...state.position }];
let mode = 'guided';
let gridEnabled = true;
let tutorialStep = -1;
let canvasFit = { scale: 1, offsetX: 0, offsetY: 0 };
const artwork = createSnowshiftArtwork(() => scheduleDraw());

// Twin Routes extends a little farther north than earlier circuits.
 // A 20px map translation keeps its outer snowbank visibly inside the board.
 // Earlier maps preserve their exact V10 camera and art framing.
const world = p => ({
  x: OFFSET_X + p.x * SCALE,
  y: OFFSET_Y + (circuit.id==='twin-routes'?20:0) - p.y * SCALE
});
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
  ctx.strokeStyle = biomeForCircuit(circuit).detail;
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
    ctx.strokeStyle = current ? biomeForCircuit(circuit).accent : biomeForCircuit(circuit).pale;
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
    ctx.fillStyle = active ? biomeForCircuit(circuit).accent : '#09293fda';
    ctx.strokeStyle = biomeForCircuit(circuit).pale;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(p.x - 23, p.y - 12, 46, 24, 5);
    ctx.fill();
    ctx.stroke();
    ctx.font = '900 12px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = active ? biomeForCircuit(circuit).uiBg : '#eff9fb';
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
  ctx.strokeStyle = selected.valid ? biomeForCircuit(circuit).accent : COLORS.flare;
  ctx.lineWidth = 4.8;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(target.x, target.y);
  ctx.stroke();
  ctx.setLineDash([]);

  const choicesToDraw = (policy.allDestinations
    ? possibleMoves(state, circuit) : [selected])
    .filter(move=>!move.zoneBlocked);
  for (const move of choicesToDraw) {
    const p = world(move.to);
    const highlighted = move.to.x === selected.to.x && move.to.y === selected.to.y;
    if (p.x < -15 || p.x > WIDTH + 15 || p.y < -15 || p.y > HEIGHT + 15) continue;
    ctx.beginPath();
    ctx.arc(p.x, p.y, highlighted ? 12 : 7.5, 0, Math.PI * 2);
    ctx.fillStyle = move.valid ? '#bbe9f6' : '#ff7557';
    ctx.fill();
    ctx.strokeStyle = highlighted ? (move.valid ? biomeForCircuit(circuit).accent : '#8d222a') : '#14384b';
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
  if (multiplayer || !ghostEnabled || !modePolicy(mode).selectedDestination || !bestRecord) return;
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

function paintOtherPlayers() {
  if(!multiplayer) return;
  match.players.forEach((player,index)=>{
    if(index===match.activeIndex)return;
    const p=world(player.state.position);
    ctx.save();
    ctx.globalAlpha=player.state.finished?.55:.95;
    ctx.fillStyle=player.color;
    ctx.strokeStyle='#082538';
    ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(p.x,p.y,8,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.font='900 10px system-ui,sans-serif';
    ctx.textAlign='center';
    ctx.fillStyle='#071e30';
    ctx.fillText(String(player.id),p.x,p.y+3.5);
    ctx.restore();
  });
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
      (i % 2 ? biomeForCircuit(circuit).accent : '#bdefff');
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
  if(multiplayer) return;
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
  // Render actual slab positions from the same linear interpolation as collision.
  // Dashed rings show NEXT centres; solid numbered slabs are present NOW.
  const hazardTurn=hazardMotion?hazardMotion.fromTurn:state.moves;
  const hazardProgress=hazardMotion
    ? clamp((now-hazardMotion.start)/hazardMotion.duration,0,1):0;
  artwork.drawMovingObstacles(ctx,circuit,world,hazardTurn,hazardProgress);
  paintGhost(now);
  paintTrail(now);
  paintOtherPlayers();
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
  if (hazardMotion && now >= hazardMotion.start + hazardMotion.duration) {
    hazardMotion = null;
  }
  if (toastUntil && now >= toastUntil) {
    toastUntil = 0;
    $('eventToast').hidden = true;
  }
  draw(now);
  const burstActive = !!burst && now < burst.start + burst.duration;
  if(animation || hazardMotion || now < flashUntil || toastUntil || burstActive) scheduleDraw();
  else if(multiplayer && handoffPending){
    handoffPending=false;
    if(hotseatFinished(match))showMatchResults();
    else showHandoff();
  }else if(!multiplayer && state.finished){
    $('finalScore').textContent=score(state,circuit);
    $('finishPanel').hidden=false;
  }
}


function renderCircuitUI() {
  const number=String(CIRCUITS.indexOf(circuit)+1).padStart(2,'0');
  const biome=biomeForCircuit(circuit);
  document.documentElement.dataset.biome=biome.id;
  document.documentElement.dataset.hazards=circuit.movingObstacles?.length?'moving':'none';
  document.documentElement.dataset.gameType=gameSettings.gameType;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',biome.uiBg);
  $('biomeShort').textContent=(multiplayer?'P&P · ':'')+biome.shortName;
  $('mapNumber').textContent=number;
  $('mapName').textContent=circuit.name.toUpperCase();
  $('mapLevel').childNodes[0].textContent=circuit.level+' ';
  $('circuitHeading').textContent=number+' / '+circuit.name.toUpperCase();
  $('mapPicker').setAttribute('aria-label','Change track. Current: '+circuit.name+', '+circuit.level);
  $('mapPicker').title='Change track · '+biome.name;
  $('mapName').closest('.game-board').setAttribute('aria-label',circuit.name+' race circuit');
  const chooser=selectUrl(gameSettings.gameType,gameSettings.players);
  $('mapPicker').href=chooser;
  $('finishChooseTrack').href=chooser;
  document.title='SNOWSHIFT · '+(multiplayer?'Pass & Play · ':'')+circuit.name;
  $('reset').title=multiplayer?'Restart this entire Pass & Play match':'Restart race';
  $('reset').setAttribute('aria-label',multiplayer?'Restart match':'Reset race');
  $('playerStrip').hidden=!multiplayer;
  $('microHint').hidden=multiplayer;
  if(multiplayer)renderPlayers();
}

function renderPlayers() {
  if(!multiplayer)return;
  const strip=$('playerStrip');
  strip.replaceChildren();
  match.players.forEach((player,i)=>{
    const chip=document.createElement('span');
    chip.className='player-chip'+(i===match.activeIndex?' is-active':'')+
      (player.state.finished?' is-finished':'');
    chip.style.setProperty('--player-color',player.color);
    chip.textContent='P'+player.id+' '+(player.state.finished?'✓':score(player.state,circuit));
    chip.title=player.name+' · '+(player.state.finished?'finished':score(player.state,circuit)+' points');
    strip.appendChild(chip);
  });
}

function showHandoff() {
  const current=match.players[match.activeIndex];
  const nextIndex=nextHotseatPlayer(match);
  if(nextIndex<0)return showMatchResults();
  if(nextIndex===match.activeIndex){
    selection={x:1,y:0};renderHUD();scheduleDraw();return;
  }
  const next=match.players[nextIndex];
  awaitingNextPlayer=true;
  $('handoffPrevious').textContent=current.name.toUpperCase()+
    (current.state.finished?' FINISHED · SCORE '+score(current.state,circuit):' · TURN COMPLETE');
  $('handoffSummary').textContent=current.name+' has '+score(current.state,circuit)+
    ' points after '+current.state.moves+' glides.';
  $('handoffName').textContent=next.name.toUpperCase();
  $('handoffName').style.color=next.color;
  $('beginTurn').textContent='START '+next.name.toUpperCase()+' ↗';
  $('handoffPanel').hidden=false;
  $('beginTurn').focus();
}

function startNextTurn() {
  if(!multiplayer||!awaitingNextPlayer)return;
  const next=nextHotseatPlayer(match);
  if(next<0)return showMatchResults();
  match=activateHotseatPlayer(match,next);
  state=match.players[next].state;
  heading=match.players[next].heading;
  turnFrames=match.players[next].frames;
  selection={x:1,y:0};
  animation=null;hazardMotion=null;burst=null;flashUntil=0;toastUntil=0;
  $('eventToast').hidden=true;
  $('handoffPanel').hidden=true;
  awaitingNextPlayer=false;
  closeTutorial();
  renderHUD();
  scheduleDraw();
}

function showMatchResults() {
  awaitingNextPlayer=false;
  $('handoffPanel').hidden=true;
  const standings=hotseatStandings(match,circuit);
  const winner=standings[0];
  const tied=standings.filter(p=>p.points===winner.points);
  $('finishTitle').textContent=tied.length>1?'TIE AT THE TOP!':'RACE RESULTS';
  $('finishIntro').textContent=tied.length>1
    ? tied.map(p=>p.name).join(' & ')+' share the win!'
    : winner.name+' wins the '+circuit.name+' race!';
  $('finishScoreLabel').textContent='LOWEST SCORE WINS';
  $('finalScore').textContent=String(winner.points);
  $('bestResult').textContent='TURNS + 3 POINTS PER CRASH';
  const rows=$('matchResults');
  rows.replaceChildren();
  rows.hidden=false;
  standings.forEach(player=>{
    const item=document.createElement('div');item.className='result-row';
    const label=document.createElement('strong');
    label.style.color=player.color;
    label.textContent=player.place+'. '+player.name;
    const points=document.createElement('span');
    points.textContent=player.points+' pts · '+player.state.moves+' turns · '+player.state.crashes+' crashes';
    item.append(label,points);rows.appendChild(item);
  });
  $('finishPanel').hidden=false;
  $('raceAgain').focus();
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
    : tutorialStep === 3 && circuit.id === 'frost-chicane'
      ? 'Two bends come quickly. Brake early, reverse sideways momentum, then accelerate away.'
      : tutorialStep === 3 && circuit.id === 'narrow-passage'
        ? 'The south straight becomes narrow for a moment. Hold a careful line, with room on both sides.'
        : tutorialStep === 3 && circuit.id === 'hairpin-hollow'
          ? 'A long straight ends in a sharp U-turn. Brake before the nose, reverse your horizontal velocity, then head west.'
          : tutorialStep === 3 && circuit.id === 'twin-routes'
            ? 'Two paths around the glacier: the INNER shortcut is narrow but faster. The OUTER line is longer and wider. Pick your path before accelerating.'
            : tutorialStep === 3 && circuit.id === 'glass-ice'
              ? 'The turquoise GLASS ICE patch allows only one nonzero acceleration component per turn. No diagonal changes of velocity until you leave. Brake early before the hairpin.'
              : tutorialStep === 3 && circuit.id === 'crosswind-ridge'
                ? 'The purple WIND zone adds (0, −1) to velocity on each turn STARTING in the patch: next v = v + a + w. Select a_y = +1 to cancel the southward drift. All nine vectors still work.'
                : tutorialStep === 3 && circuit.id === 'icebound-rapids'
                  ? 'Welcome to Ember Rift. Copper BOOST strips add +2 east or −2 west on a move STARTING inside the patch: next v = v + a + boost. Since your acceleration is limited to −1, 0 or +1 per axis, you cannot cancel a +2 boost in one turn. Brake BEFORE the strip and plan the next bend.'
                  : tutorialStep === 3 && circuit.id === 'broken-passage'
                    ? 'Two basalt rocks follow a six-turn cycle. Every GLIDE moves both one step, even on a crash. Solid rocks mark NOW; dashed rings mark NEXT. The rocks and skimmer move together, so crossing paths can crash even if the landing point looks clear. Watch the phase number and brake before crossing.'
                    : tutorialStep === 3 && circuit.id === 'frozen-gauntlet'
                      ? 'UPPER: GLASS and WIND work together. Use just one acceleration axis, then add the known wind (0,−1). LOWER: a BOOST (−2,0) adds speed while the two rocks follow their six-step clock. Filled rock = NOW; dashed ring = NEXT. Brake before the boost, and time the crossing.'
                    : tutorialStep === 3 && circuit.id === 'arctic-grand-prix'
                      ? 'THE ECLIPSE CUP: Race TWO laps without a restart. THREE moving sentinels advance each GLIDE (filled = now; dashed = next). Glass + Wind restricts acceleration to one axis and adds (0,−1); a westward BOOST adds (−2,0). Your speed and rock phase carry into lap two. Clear all gates on BOTH laps.'
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
  if (!accelerationAllowed(state,{x,y},circuit)) return;
  selection = { x, y };
  if (tutorialStep === 1) setTutorialStep(2);
  renderHUD();
  scheduleDraw();
}

function renderHUD() {
  const glassZone=glassIceZoneAt(state.position,circuit);
  const windZone=windZoneAt(state.position,circuit);
  const boostZone=boostZoneAt(state.position,circuit);
  const obstaclePeriod=movingObstaclePeriod(circuit);
  const hazardPhase=state.moves%obstaclePeriod;
  const nextHazardPhase=(hazardPhase+1)%obstaclePeriod;
  const hasHazards=obstaclePeriod>1;
  const isGauntlet=['frozen-gauntlet','arctic-grand-prix'].includes(circuit.id);
  const isGrandPrix=circuit.id==='arctic-grand-prix';
  document.documentElement.dataset.finale=isGrandPrix?'grand-prix':'none';
  const coupled=!!glassZone && !!windZone;
  const phaseLabel='ROCKS '+(hazardPhase+1)+'→'+(nextHazardPhase+1)+' / '+obstaclePeriod;
  document.documentElement.dataset.surface=isGauntlet
    ? coupled?'coupled':glassZone?'glass':boostZone?'boost':hasHazards?'moving':'normal'
    : hasHazards?'moving':boostZone?'boost':windZone?'wind':glassZone?'glass':'normal';
  document.documentElement.dataset.coupled=coupled?'true':'false';
  // An acceleration selected on normal ice may become unavailable after
  // entering the patch. Reset that choice to a safe visible coast, never
  // silently execute an illegal diagonal or charge a collision penalty.
  if(!accelerationAllowed(state,selection,circuit))selection={x:0,y:0};
  const selected = previewMove(state, selection, circuit);
  const defaultNotation=modePolicy(mode).accelerationNotation==='columns'
    ? 'TOP x · BOTTOM y' : '−1, 0 or +1 each axis';
  $('accelNotationHint').textContent=isGauntlet
    ? coupled?'GLASS + WIND ↓ · R'+(hazardPhase+1)+'→'+(nextHazardPhase+1)
      : boostZone?'BOOST ← −2 · R'+(hazardPhase+1)+'→'+(nextHazardPhase+1)
      : glassZone?'GLASS 1 AXIS · R'+(hazardPhase+1)+'→'+(nextHazardPhase+1)
      : phaseLabel
    : hasHazards ? phaseLabel
    : boostZone ? (boostZone.vector.x>0?'BOOST → (+2,0)':'BOOST ← (−2,0)')
    : windZone ? 'WIND ↓ (0,−1)'
    : glassZone ? 'GLASS ICE · 1 AXIS' : defaultNotation;
  $('accelerationPad').setAttribute('aria-label',isGauntlet
    ? (coupled
      ? 'Coupled Glass Ice and southward wind: choose only one acceleration axis; (0,-1) wind still adds to the next velocity. Basalt phase '+(hazardPhase+1)+' to '+(nextHazardPhase+1)
      : boostZone
        ? 'Westward (-2,0) boost adds velocity while the moving basalt slabs advance from phase '+(hazardPhase+1)+' to '+(nextHazardPhase+1)
        : glassZone
          ? 'Return Glass Ice: only one acceleration axis allowed; moving basalt phases '+(hazardPhase+1)+' to '+(nextHazardPhase+1)
          : 'Moving basalt phases '+(hazardPhase+1)+' to '+(nextHazardPhase+1)+' of '+obstaclePeriod+'; choose a vector')
    : hasHazards
      ? 'Two basalt rocks move together from step '+(hazardPhase+1)+' to '+(nextHazardPhase+1)+' of '+obstaclePeriod+' when you glide; all nine accelerations available'
    : boostZone ? 'Boost adds '+(boostZone.vector.x>0?'+2 east':'-2 west')+' to velocity this turn; all nine acceleration choices remain'
    : windZone ? 'Crosswind adds (0,-1) to velocity this turn; all nine accelerations remain available'
    : glassZone ? 'Glass ice: only five single-axis acceleration vectors available'
    : 'Choose a change in velocity');
  const policy = modePolicy(mode);
  renderColumnVector($('currentVelocity'), state.velocity, { name: 'Velocity' });
  renderColumnVector($('selectedAcceleration'), selection, { name: 'Acceleration' });
  renderColumnVector($('nextVelocity'), selected.velocity, {
    name: 'Next velocity', hidden: !policy.nextVelocity
  });
  $('moves').textContent = String(state.moves).padStart(2, '0');
  $('crashes').textContent = String(state.crashes).padStart(2, '0');
  $('score').textContent = String(score(state, circuit)).padStart(2, '0');
  $('lap').textContent = state.finished ? 'FINISHED' :
    'LAP ' + (state.laps+1) + ' / ' + circuit.targetLaps;

  const explanation = moveExplanation(state, selection, mode, selected);
  if(isGauntlet && !state.finished && (mode==='guided'||mode==='standard') && selected.movingObstacle){
    $('nextMoveLabel').textContent='MOVING ROCK · CHANGE LINE OR PHASE';
    $('nextMoveLabel').dataset.tone='danger';
  }else if(isGauntlet && coupled && !state.finished){
    $('nextMoveLabel').textContent='GLASS + WIND · ONE AXIS · (0,−1) ADDED';
    $('nextMoveLabel').dataset.tone='glass';
  }else if(glassZone && !state.finished){
    $('nextMoveLabel').textContent='GLASS ICE · ONE AXIS PER TURN';
    $('nextMoveLabel').dataset.tone='glass';
  }else if(isGauntlet && boostZone && !state.finished){
    $('nextMoveLabel').textContent='BOOST −2 WEST · WATCH THE MOVING SLAB';
    $('nextMoveLabel').dataset.tone='danger';
  }else if (mode === 'guided' && !state.finished) {
    const forecast = brakingForecast(state, selection, circuit);
    $('nextMoveLabel').textContent = selected.movingObstacle
      ? 'MOVING ROCK · CHANGE LINE OR PHASE' : corneringMessage(forecast);
    $('nextMoveLabel').dataset.tone = forecast.risk === 'clear' ? 'safe' : 'danger';
  } else {
    $('nextMoveLabel').textContent = mode==='standard' && selected.movingObstacle
      ? 'MOVING ROCK · TIMED COLLISION' : explanation.message;
    $('nextMoveLabel').dataset.tone = selected.movingObstacle && mode==='standard'
      ? 'danger' : explanation.tone;
  }
  $('recordBadge').textContent = bestRecord ? '· PB ' + bestRecord.score : '· PB —';
  $('message').textContent=isGauntlet && !state.finished
    ? (state.lastEvent.endsWith('cleared') ? state.lastEvent.toUpperCase()
      : isGrandPrix&&state.lastEvent==='Lap 1'
        ? 'LAP ONE COMPLETE · FINAL LAP · PHASE '+(hazardPhase+1)+' / 6'
      : isGrandPrix&&state.moves===0
        ? 'ARCTIC GRAND PRIX · TWO LAPS · THREE TIMED SENTINELS'
      : coupled?'GLASS 1 AXIS + WIND ↓ (0,−1) · '+phaseLabel
      : boostZone?'BOOST ← (−2,0) + MOVING ROCK · '+phaseLabel
      : glassZone?'GLASS 1 AXIS · '+phaseLabel
      : state.moves===0?'FROZEN GAUNTLET · COMBINE WIND, GLASS, BOOST AND TIMING'
      : isGrandPrix?'ECLIPSE CUP · '+phaseLabel
      : 'TIMED BASALT · '+phaseLabel)
    : hasHazards && !state.finished
    ? (state.lastEvent.endsWith('cleared')
      ? state.lastEvent.toUpperCase()
      : 'ROCK PHASE '+(hazardPhase+1)+'→'+(nextHazardPhase+1)+' / '+obstaclePeriod+' · GLIDE ADVANCES BOTH')
    : boostZone && !state.finished
    ? (boostZone.vector.x>0?'BOOST → (+2,0) · BRAKE BEFORE THE BEND':'BOOST ← (−2,0) · BRAKE BEFORE THE SWEEP')
    : circuit.id==='icebound-rapids' && state.moves===0
      ? 'TWIN BOOST STRIPS AHEAD · PLAN YOUR BRAKING'
      : windZone && !state.finished
        ? 'WIND ↓ (0,−1) · COUNTER ↑ (+1 y)'
    : circuit.id==='crosswind-ridge' && state.moves===0
      ? 'CROSSWIND AHEAD ↓ (0,−1)'
      : glassZone && !state.finished
        ? 'GLASS ICE · NO DIAGONALS'
        : circuit.id==='glass-ice' && state.moves===0
          ? 'GLASS ICE AHEAD · BRAKE EARLY'
          : circuit.id==='twin-routes' && state.moves===0
            ? 'INNER SHORTCUT · OUTER WIDE'
            : state.lastEvent.toUpperCase();
  $('commit').disabled=!!animation || state.finished || selected.zoneBlocked;

  for (const button of $('accelerationPad').querySelectorAll('button')) {
    const pressed = Number(button.dataset.x) === selection.x &&
      Number(button.dataset.y) === selection.y;
    button.setAttribute('aria-pressed', String(pressed));
    const acceleration={x:Number(button.dataset.x),y:Number(button.dataset.y)};
    const blocked=!accelerationAllowed(state,acceleration,circuit);
    button.dataset.glassBlocked=String(blocked);
    button.title=blocked
      ? 'Unavailable on GLASS ICE: choose one axis only'
      : vectorDescription(acceleration,'Acceleration');
    button.setAttribute('aria-label',blocked
      ? 'Unavailable on glass ice. '+vectorDescription(acceleration,'Acceleration')
      : vectorDescription(acceleration,'Acceleration'));
    button.disabled=!!animation || state.finished || blocked;
  }
  for (const [i, li] of [...document.querySelectorAll('[data-checkpoint]')].entries()) {
    li.classList.toggle('cleared', state.finished || i < state.checkpoint);
    li.classList.toggle('active', !state.finished && i === state.checkpoint);
  }
}

function commit() {
  if (animation || state.finished || !accelerationAllowed(state,selection,circuit)) return;
  const before = state;
  const beforePreview=previewMove(before,selection,circuit);
  const boostAtStart=boostZoneAt(before.position,circuit);
  const now = performance.now();
  state = takeTurn(state, selection, circuit);
  turnFrames.push({ ...state.position });
  if (tutorialStep === 2) setTutorialStep(3);
  if (state.crashes > before.crashes) {
    flashUntil = now + (useReducedMotion.matches ? 0 : 340);
    if (!useReducedMotion.matches) spawnBurst(state.position, 'crash', now);
    showToast(beforePreview.movingObstacle
      ? 'MOVING BASALT! +3 PENALTY':'SNOWBANK! +3 PENALTY', 'crash', 1050);
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
    } else if (state.laps>before.laps) {
      if (!useReducedMotion.matches) spawnBurst(state.position, 'gate', now);
      showToast('LAP '+state.laps+' COMPLETE · FINAL LAP!', 'gate', 1650);
    } else if (state.checkpoint !== before.checkpoint) {
      if (!useReducedMotion.matches) spawnBurst(state.position, 'gate', now);
      showToast(state.lastEvent.toUpperCase() + ' ✓', 'gate', 900);
    } else if (boostAtStart) {
      showToast(boostAtStart.vector.x>0?'BOOST +2 EAST!':'BOOST -2 WEST!', 'gate', 900);
    }
  }
  // Every attempt, including a crash, advances the six-step oscillator.
  // Both the skimmer and slabs move linearly through the same turn duration.
  if (circuit.movingObstacles?.length && !useReducedMotion.matches) {
    hazardMotion={fromTurn:before.moves,start:now,
      duration:animation?.duration??360};
  }
  renderHUD();
  scheduleDraw();
}

function reset() {
  state = createRace(circuit);
  selection = { x: 1, y: 0 };
  animation = null;
  hazardMotion = null;
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
$('finishChooseTrack').addEventListener('click', () => {
  $('finishPanel').hidden = true;
  reset();
  toggleMapMenu();
  $('mapPicker').focus();
});
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
    if(candidate.zoneBlocked)continue;
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
if (showTrackPickerOnEntry) {
  toggleMapMenu();
}
