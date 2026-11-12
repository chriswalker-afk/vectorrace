/**
 * Snowshift's original art layer (PR #3).
 * No race state, collision decisions or gate logic are kept here.
 *
 * Everything composits on the same exact polygon geometry as src/engine.mjs.
 * The SVG sprite and texture files are independent reusable assets.
 */
const ASSETS = Object.freeze({
  skimmer: '../assets/art/ice-skimmer-flare.svg',
  pine: '../assets/art/pine-canopy.svg',
  rock: '../assets/art/granite-outcrop.svg',
  cabin: '../assets/art/alpine-cabin.svg',
  snow: '../assets/art/snowfield.svg',
  ice: '../assets/art/ice-surface.svg',
  flag: '../assets/art/race-flag.svg',
  lantern: '../assets/art/lantern.svg'
});

const white = '#eff9fb';
const ice = '#164b65';
const raceOrange = '#ff7557';

const outsideTrees = [
  [-1, 25, 69], [2, 25.5, 52], [6, 25.7, 83], [10, 26.5, 49],
  [25, 25.8, 62], [28.5, 26, 84], [34, 25, 76],
  [34, 20, 67], [35, 16, 85], [35.1, 11, 67], [35, 5, 86],
  [30.5, -.4, 62], [26, -1, 88], [20, -2, 57],
  [11, -.4, 66], [7, -.8, 77], [1, -.3, 64],
  [-1.4, 5, 80], [-2, 11, 70], [-2, 19, 63]
];
const islandTrees = [
  [11.2, 13.4, 56], [13.1, 14.5, 60], [19.6, 14.6, 65],
  [22.2, 12.5, 58], [19.9, 11.1, 60], [12.4, 11, 53]
];

function trace(ctx, polygon, world) {
  const p = world(polygon[0]);
  ctx.moveTo(p.x, p.y);
  for (let i = 1; i < polygon.length; i++) {
    const q = world(polygon[i]);
    ctx.lineTo(q.x, q.y);
  }
  ctx.closePath();
}

function polygonPath(ctx, polygon, world) {
  ctx.beginPath();
  trace(ctx, polygon, world);
}

function corridorPath(ctx, circuit, world) {
  ctx.beginPath();
  trace(ctx, circuit.outer, world);
  trace(ctx, circuit.inner, world);
}

function imgReady(img) {
  return !!(img && img.complete && img.naturalWidth > 0);
}

export function createSnowshiftArtwork(requestRender = () => {}) {
  const images = new Map();
  const patterns = new Map();
  let staticScene = null;
  let sceneDirty = true;
  for (const [key, relativePath] of Object.entries(ASSETS)) {
    const img = new Image();
    images.set(key, img);
    img.addEventListener('load', () => {
      sceneDirty = true;
      requestRender();
    });
    img.addEventListener('error', () => {
      console.warn('Snowshift art asset unavailable:', relativePath);
      sceneDirty = true;
      requestRender();
    });
    img.src = new URL(relativePath, import.meta.url).href;
  }

  function stamp(ctx, key, x, y, width, height, alpha = 1) {
    const img = images.get(key);
    if (!imgReady(img)) return false;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.drawImage(img, x - width / 2, y - height / 2, width, height);
    ctx.restore();
    return true;
  }

  function repeating(ctx, key, width, height, alpha = 1) {
    const img = images.get(key);
    if (!imgReady(img)) return false;
    let entry = patterns.get(key);
    // Patterns belong to their rendering context. The browser prototype uses one canvas.
    if (!entry || entry.context !== ctx) {
      entry = { context: ctx, pattern: ctx.createPattern(img, 'repeat') };
      patterns.set(key, entry);
    }
    if (!entry.pattern) return false;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = entry.pattern;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
    return true;
  }

  function snowfield(ctx, width, height) {
    const g = ctx.createLinearGradient(0, 0, width, height);
    g.addColorStop(0, '#e4f1f2');
    g.addColorStop(.38, '#c1dce6');
    g.addColorStop(.82, '#aacfd9');
    g.addColorStop(1, '#91bcca');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
    repeating(ctx, 'snow', width, height, .46);

    // Broad snow pillows + fine contour strokes give a miniature-diorama relief.
    ctx.save();
    ctx.strokeStyle = '#f3ffff';
    ctx.lineCap = 'round';
    for (let i = 0; i < 25; i++) {
      const x = (i * 139 + i * i * 23) % (width + 160) - 80;
      const y = (i * 89 + i * i * 37) % (height + 120) - 60;
      ctx.globalAlpha = .15 + (i % 3) * .05;
      ctx.lineWidth = 3 + (i % 4) * 1.2;
      ctx.beginPath();
      ctx.moveTo(x - 34, y);
      ctx.bezierCurveTo(x - 8, y - 11, x + 20, y - 14, x + 41, y - 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawOutdoorScenery(ctx, world, circuit, width, height) {
    ctx.save();
    // Exterior art is only visible outside the same mathematically defined road.
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    trace(ctx, circuit.outer, world);
    ctx.clip('evenodd');

    for (const [x, y, size] of outsideTrees) {
      const p = world({ x, y });
      stamp(ctx, 'pine', p.x, p.y, size, size);
      if ((Math.round(x * 10) + Math.round(y * 10)) % 3 === 0) {
        stamp(ctx, 'pine', p.x + size * .45, p.y + size * .26, size * .62, size * .62, .92);
      }
    }
    for (const [x, y, w] of [
      [-.8, 23.1, 140], [31.8, 24.2, 150],
      [34, 6, 136], [2.5, .2, 158], [28.6, 1, 165]
    ]) {
      const p = world({ x, y });
      stamp(ctx, 'rock', p.x, p.y, w, w * .69, .91);
    }
    ctx.restore();
  }

  function drawIsland(ctx, circuit, world) {
    ctx.save();
    polygonPath(ctx, circuit.inner, world);
    ctx.clip();

    // Grounding: snow-coloured island is not part of the permitted track.
    for (const [x, y, w] of [
      [9.8, 12.5, 103], [15, 15.4, 118], [21.7, 14.3, 112]
    ]) {
      const p = world({ x, y });
      stamp(ctx, 'rock', p.x, p.y, w, w * .69, .8);
    }
    const cabin = world({ x: 16.5, y: 12.1 });
    stamp(ctx, 'cabin', cabin.x, cabin.y, 132, 108, 1);
    for (const [x, y, size] of islandTrees) {
      const p = world({ x, y });
      stamp(ctx, 'pine', p.x, p.y, size, size);
    }
    ctx.restore();
  }

  function drawTrackSurface(ctx, circuit, world, width, height) {
    // The road itself is rendered from the physics polygons, not a painted bitmap.
    ctx.save();
    corridorPath(ctx, circuit, world);
    ctx.fillStyle = ice;
    ctx.fill('evenodd');
    ctx.clip('evenodd');

    const g = ctx.createLinearGradient(0, 40, width, height);
    g.addColorStop(0, '#205a75');
    g.addColorStop(.4, '#16435f');
    g.addColorStop(.76, '#24647e');
    g.addColorStop(1, '#113b58');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
    repeating(ctx, 'ice', width, height, .46);

    // Banks cast dark blue shadow onto the ice, *clipped within* the legal road.
    for (const edge of [circuit.outer, circuit.inner]) {
      polygonPath(ctx, edge, world);
      ctx.strokeStyle = '#071d33b0';
      ctx.lineWidth = 32;
      ctx.stroke();
      polygonPath(ctx, edge, world);
      ctx.strokeStyle = '#3c91aa8a';
      ctx.lineWidth = 15;
      ctx.stroke();
    }

    // Subtle etched travel marks, not a false solid racing line.
    ctx.strokeStyle = '#d4f5f530';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 95; i++) {
      const x = (i * 67 + i * i * 19) % width;
      const y = (i * 131 + i * i * 11) % height;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 18 + i % 25, y - 3 - i % 7);
      ctx.stroke();
    }
    ctx.restore();

    // Bright snow ridges sit exactly on both hit-test boundaries.
    for (const edge of [circuit.outer, circuit.inner]) {
      ctx.save();
      ctx.lineJoin = 'round';
      polygonPath(ctx, edge, world);
      ctx.strokeStyle = '#2e6880a0';
      ctx.lineWidth = 19;
      ctx.stroke();
      polygonPath(ctx, edge, world);
      ctx.strokeStyle = '#93bccb';
      ctx.lineWidth = 14;
      ctx.stroke();
      polygonPath(ctx, edge, world);
      ctx.strokeStyle = '#edf9fb';
      ctx.lineWidth = 8;
      ctx.stroke();
      polygonPath(ctx, edge, world);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawGateFlags(ctx, circuit, world) {
    // All flags are placed off-road; numerical gate segments stay canonical.
    const positions = [
      { x: 31.8, y: 12.6 },
      { x: 16, y: 1.1 },
      { x: .35, y: 12.5 },
      { x: 16, y: 24.4 }
    ];
    for (const point of positions) {
      const p = world(point);
      stamp(ctx, 'flag', p.x, p.y, 37, 52, 1);
    }
    for (const point of [
      { x: 2.5, y: 21.4 }, { x: 30.7, y: 21.3 },
      { x: 3, y: 3.1 }, { x: 30.5, y: 3.5 }
    ]) {
      const p = world(point);
      stamp(ctx, 'lantern', p.x, p.y, 70, 70, .9);
    }
  }

  function drawSkimmer(ctx, p, heading, speed = 0) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(heading);
    const flare = Math.min(.9, Math.max(0, speed) * .14);
    if (flare > 0) {
      ctx.save();
      ctx.globalAlpha = flare;
      const exhaust = ctx.createRadialGradient(-27, 0, 0, -35, 0, 35);
      exhaust.addColorStop(0, '#c9faffd6');
      exhaust.addColorStop(.55, '#74d2ec80');
      exhaust.addColorStop(1, '#74d2ec00');
      ctx.fillStyle = exhaust;
      ctx.beginPath();
      ctx.ellipse(-36, 0, 42, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Exact physics center remains at (p.x,p.y); sprite is visual only.
    if (!stamp(ctx, 'skimmer', 0, 0, 72, 40)) {
      // Minimal fallback if an SVG fails to load.
      ctx.fillStyle = raceOrange;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(28, 0);
      ctx.lineTo(-15, -13);
      ctx.lineTo(-9, 0);
      ctx.lineTo(-15, 13);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  function paintScene(ctx, width, height, world, circuit) {
    const density = 2;
    if (!staticScene || staticScene.width !== width * density ||
        staticScene.height !== height * density) {
      staticScene = document.createElement('canvas');
      staticScene.width = width * density;
      staticScene.height = height * density;
      sceneDirty = true;
    }
    if (sceneDirty) {
      const background = staticScene.getContext('2d');
      background.setTransform(density, 0, 0, density, 0, 0);
      background.clearRect(0, 0, width, height);
      snowfield(background, width, height);
      drawOutdoorScenery(background, world, circuit, width, height);
      drawTrackSurface(background, circuit, world, width, height);
      drawIsland(background, circuit, world);
      drawGateFlags(background, circuit, world);
      sceneDirty = false;
    }
    ctx.drawImage(staticScene, 0, 0, width, height);
  }

  return {
    assets: ASSETS,
    paintScene,
    snowfield,
    drawOutdoorScenery,
    drawTrackSurface,
    drawIsland,
    drawGateFlags,
    drawSkimmer
  };
}
