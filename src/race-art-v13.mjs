import { biomeForCircuit, biomeForLevel } from './biomes.mjs';
import { paintBiomeAtmosphere, paintBiomeLand, paintBiomeBeacon } from './biome-scenery.mjs';

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
  for (const obstacle of circuit.obstacles ?? []) {
    trace(ctx, obstacle.polygon, world);
  }
}

function imgReady(img) {
  return !!(img && img.complete && img.naturalWidth > 0);
}

export function createSnowshiftArtwork(requestRender = () => {}) {
  const images = new Map();
  const patterns = new Map();
  let staticScene = null;
  let sceneDirty = true;
  let lastCircuitId = null;
  let lastBiomeId = null;
  let activeBiome = biomeForLevel('BEGINNER');
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

  function snowfield(ctx, width, height, biome=activeBiome) {
    const g = ctx.createLinearGradient(0, 0, width, height);
    for(const [index, stop] of [0,.38,.82,1].entries())
      g.addColorStop(stop,biome.ground[index]);
    ctx.fillStyle=g;
    ctx.fillRect(0,0,width,height);
    repeating(ctx,'snow',width,height,biome.groundTextureAlpha);

    // Broad snow pillows + fine contour strokes give a miniature-diorama relief.
    ctx.save();
    ctx.strokeStyle = biome.contour;
    ctx.lineCap = 'round';
    for (let i = 0; i < 25; i++) {
      const x = (i * 139 + i * i * 23) % (width + 160) - 80;
      const y = (i * 89 + i * i * 37) % (height + 120) - 60;
      ctx.globalAlpha = (biome.id==='beginner'?.15:.07) + (i % 3) * .035;
      ctx.lineWidth = 3 + (i % 4) * 1.2;
      ctx.beginPath();
      ctx.moveTo(x - 34, y);
      ctx.bezierCurveTo(x - 8, y - 11, x + 20, y - 14, x + 41, y - 2);
      ctx.stroke();
    }
    ctx.restore();
    paintBiomeAtmosphere(ctx,width,height,biome);
  }

  function drawOutdoorScenery(ctx, world, circuit, width, height, biome=activeBiome) {
    ctx.save();
    // Exterior art is only visible outside the same mathematically defined road.
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    trace(ctx, circuit.outer, world);
    ctx.clip('evenodd');

    if(biome.id!=='beginner'){
      paintBiomeLand(ctx,world,circuit,biome,'outer');
      ctx.restore();
      return;
    }
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

  function drawIsland(ctx, circuit, world, biome=activeBiome) {
    ctx.save();
    polygonPath(ctx, circuit.inner, world);
    ctx.clip();
    if(biome.id!=='beginner'){
      paintBiomeLand(ctx,world,circuit,biome,'island');
      ctx.restore();
      return;
    }

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

  /**
   * Draw the active slippery polygon with obvious paneled *transparent ice*
   * material. This is a physics zone, not a solid obstacle: it is clipped to
   * the road, and the shape is taken from circuit.glassZones exactly.
   */
  function drawGlassIceZone(ctx, zone, world) {
    const points=zone.polygon.map(world);
    const minX=Math.min(...points.map(p=>p.x));
    const maxX=Math.max(...points.map(p=>p.x));
    const minY=Math.min(...points.map(p=>p.y));
    const maxY=Math.max(...points.map(p=>p.y));
    const width=maxX-minX,height=maxY-minY;
    ctx.save();
    polygonPath(ctx,zone.polygon,world);
    ctx.clip();
    const layer=ctx.createLinearGradient(minX,minY,maxX,maxY);
    layer.addColorStop(0,'#ceffffdf');
    layer.addColorStop(.27,'#87f9f9c4');
    layer.addColorStop(.55,'#57bfeaab');
    layer.addColorStop(.84,'#72dbf1b8');
    layer.addColorStop(1,'#dafcffd5');
    ctx.fillStyle=layer;
    ctx.fillRect(minX,minY,width,height);
    // Faceted glass panes — visual, no collision and no opaque rocks.
    ctx.lineWidth=1.5;
    for(let i=-2;i<13;i++){
      const x=minX+i*29;
      ctx.strokeStyle=i%2?'#e8ffff8c':'#257fbc80';
      ctx.beginPath();
      ctx.moveTo(x,minY-15);
      ctx.lineTo(x+40,maxY+14);
      ctx.stroke();
    }
    ctx.lineWidth=1.2;
    for(let j=0;j<5;j++){
      const y=minY+j*22;
      ctx.strokeStyle=j%2?'#ffffff73':'#3a8dbf82';
      ctx.beginPath();
      ctx.moveTo(minX-9,y);
      ctx.lineTo(maxX+9,y+10);
      ctx.stroke();
    }
    // Long transparent specular streaks distinguish a slick road from land.
    ctx.lineWidth=4;
    ctx.strokeStyle='#f2ffff85';
    ctx.beginPath();ctx.moveTo(minX+15,minY+12);
    ctx.lineTo(maxX-30,minY+9);ctx.stroke();
    ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(minX+48,maxY-17);
    ctx.lineTo(maxX-19,maxY-22);ctx.stroke();
    ctx.restore();

    // Boundary is the real zone threshold (active from turn START on edge).
    ctx.save();
    ctx.lineWidth=2.4;
    ctx.strokeStyle='#eaffff';
    ctx.setLineDash([7,5]);
    polygonPath(ctx,zone.polygon,world);
    ctx.stroke();
    ctx.setLineDash([]);
    const centre=world({x:(zone.polygon[0].x+zone.polygon[1].x)/2,
      y:zone.polygon[2].y-.35});
    ctx.font='900 15px system-ui, sans-serif';
    ctx.textAlign='center';
    ctx.lineWidth=3;
    ctx.strokeStyle='#155a83b5';
    ctx.fillStyle='#f7ffff';
    ctx.strokeText('GLASS ICE',centre.x,centre.y);
    ctx.fillText('GLASS ICE',centre.x,centre.y);
    ctx.restore();
  }

  /**
   * Real wind-force area: legal racing ice, NEVER an obstacle. Both the trigger
   * and its dashed art boundary use the exact circuit.windZones polygon.
   * Directional arrows indicate the added velocity w=(0,-1) in math coords:
   * south/down on the canvas. All paint is clipped to the legal roadway.
   */
  function drawWindZone(ctx,zone,world) {
    const points=zone.polygon.map(world);
    const minX=Math.min(...points.map(p=>p.x));
    const maxX=Math.max(...points.map(p=>p.x));
    const minY=Math.min(...points.map(p=>p.y));
    const maxY=Math.max(...points.map(p=>p.y));
    ctx.save();
    polygonPath(ctx,zone.polygon,world);
    ctx.clip();
    const g=ctx.createLinearGradient(minX,minY,maxX,maxY);
    g.addColorStop(0,'#aa8df388');
    g.addColorStop(.42,'#8fc4f387');
    g.addColorStop(.76,'#53b6dd89');
    g.addColorStop(1,'#a6e7fa85');
    ctx.fillStyle=g;
    ctx.fillRect(minX,minY,maxX-minX,maxY-minY);
    // Wind ribbons are gentle vertical curves, not fake solid road edges.
    ctx.lineCap='round';
    for(let k=0;k<10;k++){
      const x=minX+13+k*25;
      ctx.strokeStyle=k%2?'#f0e5ff48':'#acffff60';
      ctx.lineWidth=5+k%3;
      ctx.beginPath();
      ctx.moveTo(x-17,minY-16);
      ctx.bezierCurveTo(x-28,minY+24,x+8,maxY-38,x-7,maxY+20);
      ctx.stroke();
    }
    // Repeated fixed SOUTH arrows keep the direction unambiguous when zoomed
    // out. Their stems remain faint enough to show skimmer and grid beneath.
    ctx.lineWidth=3;
    ctx.lineJoin='round';
    ctx.strokeStyle='#fff1c9c9';
    for(const y of [minY+39,minY+98]){
      for(let i=0;i<5;i++){
        const x=minX+28+i*41;
        ctx.beginPath();
        ctx.moveTo(x,y-15);ctx.lineTo(x,y+11);
        ctx.moveTo(x-8,y+3);ctx.lineTo(x,y+11);ctx.lineTo(x+8,y+3);
        ctx.stroke();
      }
    }
    ctx.restore();

    ctx.save();
    ctx.lineWidth=2.4;
    ctx.strokeStyle='#ffe2ac';
    ctx.setLineDash([9,5]);
    polygonPath(ctx,zone.polygon,world);
    ctx.stroke();
    ctx.setLineDash([]);
    const label=world({x:21.5,y:23.8});
    ctx.textAlign='center';
    ctx.font='900 16px system-ui, sans-serif';
    ctx.lineWidth=3.6;
    ctx.strokeStyle='#241d54';
    ctx.fillStyle='#fff0c9';
    ctx.strokeText('WIND ↓ (0,−1)',label.x,label.y);
    ctx.fillText('WIND ↓ (0,−1)',label.x,label.y);
    ctx.restore();
  }

  function drawTrackSurface(ctx, circuit, world, width, height, biome=activeBiome) {
    // The road itself is rendered from the physics polygons, not a painted bitmap.
    ctx.save();
    corridorPath(ctx, circuit, world);
    ctx.fillStyle = biome.roadBase;
    ctx.fill('evenodd');
    ctx.clip('evenodd');

    const g = ctx.createLinearGradient(0, 40, width, height);
    for(const [index, stop] of [0,.4,.76,1].entries())
      g.addColorStop(stop,biome.road[index]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
    repeating(ctx, 'ice', width, height, biome.iceTextureAlpha);

    // Banks cast dark blue shadow onto the ice, *clipped within* the legal road.
    for (const edge of [circuit.outer, circuit.inner]) {
      polygonPath(ctx, edge, world);
      ctx.strokeStyle = biome.bankShadow;
      ctx.lineWidth = 32;
      ctx.stroke();
      polygonPath(ctx, edge, world);
      ctx.strokeStyle = biome.bankGlow;
      ctx.lineWidth = 15;
      ctx.stroke();
    }

    // Subtle etched travel marks, not a false solid racing line.
    ctx.strokeStyle = biome.etch;
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
    for(const zone of circuit.glassZones ?? [])
      drawGlassIceZone(ctx,zone,world);
    for(const zone of circuit.windZones ?? [])
      drawWindZone(ctx,zone,world);
    ctx.restore();

    // Bright snow ridges sit exactly on both hit-test boundaries.
    for (const edge of [circuit.outer, circuit.inner]) {
      ctx.save();
      ctx.lineJoin = 'round';
      polygonPath(ctx, edge, world);
      ctx.strokeStyle = biome.bankDark;
      ctx.lineWidth = 19;
      ctx.stroke();
      polygonPath(ctx, edge, world);
      ctx.strokeStyle = biome.bankMid;
      ctx.lineWidth = 14;
      ctx.stroke();
      polygonPath(ctx, edge, world);
      ctx.strokeStyle = biome.bankLight;
      ctx.lineWidth = 8;
      ctx.stroke();
      polygonPath(ctx, edge, world);
      ctx.strokeStyle = biome.bankEdge;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }
  }

  /**
   * Elongated Aurora glacier: solid LAND, not a huge stretched boulder image.
   * Uses the exact collision polygon and clips every facet/ice crystal inside
   * it. Fine edge strokes stay below the 5px visual clearance budget.
   */
  function drawGlacialDivider(ctx, obstacle, world, biome=activeBiome) {
    const polygon=obstacle.polygon;
    const vertices=polygon.map(world);
    const minX=Math.min(...vertices.map(p=>p.x));
    const maxX=Math.max(...vertices.map(p=>p.x));
    const minY=Math.min(...vertices.map(p=>p.y));
    const maxY=Math.max(...vertices.map(p=>p.y));
    const w=maxX-minX,h=maxY-minY;
    ctx.save();
    polygonPath(ctx,polygon,world);
    ctx.clip();
    const frozen=ctx.createLinearGradient(minX,minY,maxX,maxY);
    frozen.addColorStop(0,'#edf6ff');
    frozen.addColorStop(.22,'#c1dfff');
    frozen.addColorStop(.54,'#8db5ec');
    frozen.addColorStop(.8,'#6175c4');
    frozen.addColorStop(1,'#342f77');
    ctx.fillStyle=frozen;
    ctx.fillRect(minX,minY,w,h);

    // Small ice planes follow the island length instead of enlarging its
    // physical footprint or creating a road-wide grey rectangle.
    ctx.fillStyle='#ecfaff5c';
    ctx.beginPath();
    ctx.moveTo(minX+8,minY+h*.36);
    ctx.lineTo(minX+w*.22,minY+5);
    ctx.lineTo(minX+w*.61,minY+h*.18);
    ctx.lineTo(maxX-5,minY+h*.32);
    ctx.lineTo(maxX-w*.21,minY+h*.49);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle='#dfffff9a';ctx.lineWidth=1.2;
    for(let i=0;i<12;i++){
      const x=minX+12+i*w/12;
      const y=minY+12+(i%3)*7;
      ctx.beginPath();
      ctx.moveTo(x,y);
      ctx.lineTo(x+11,y+8);
      ctx.lineTo(x+22,y+5);
      ctx.stroke();
    }
    // Original, low relief Aurora crystals; entirely on the divider land.
    for(let i=0;i<7;i++){
      const center=world({x:14.6+i*1.13,y:20.08+(i%2?.15:-.14)});
      const radius=13+(i%3)*3;
      ctx.save();
      ctx.translate(center.x,center.y);
      ctx.rotate((i%2?1:-1)*.12);
      const light=ctx.createLinearGradient(-radius,-radius,radius,radius);
      light.addColorStop(0,'#f7ffff');
      light.addColorStop(.5,'#abc8ff');
      light.addColorStop(1,'#7158b3');
      ctx.fillStyle=light;
      ctx.strokeStyle='#f2faffdd';
      ctx.lineWidth=1.2;
      ctx.beginPath();
      ctx.moveTo(0,-radius);
      ctx.lineTo(radius*.7,-radius*.12);
      ctx.lineTo(radius*.38,radius*.7);
      ctx.lineTo(-radius*.42,radius*.7);
      ctx.lineTo(-radius*.7,-radius*.08);
      ctx.closePath();ctx.fill();ctx.stroke();
      ctx.strokeStyle='#e3ffffc0';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(0,-radius);ctx.lineTo(0,radius*.7);ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // The real obstacle outline, not an oversized false collision bank.
    ctx.save();ctx.lineJoin='round';
    polygonPath(ctx,polygon,world);
    ctx.strokeStyle='#322762';ctx.lineWidth=3;ctx.stroke();
    polygonPath(ctx,polygon,world);
    ctx.strokeStyle='#e1d7ff';ctx.lineWidth=1.5;ctx.stroke();
    ctx.restore();
  }

  function drawRockObstacles(ctx, circuit, world) {
    for (const obstacle of circuit.obstacles ?? []) {
      if(obstacle.artStyle==='glacial-divider'){
        drawGlacialDivider(ctx,obstacle,world,activeBiome);
        continue;
      }
      const polygon = obstacle.polygon;
      ctx.save();
      polygonPath(ctx, polygon, world);
      ctx.clip();
      const cx = polygon.reduce((n,p)=>n+p.x,0) / polygon.length;
      const cy = polygon.reduce((n,p)=>n+p.y,0) / polygon.length;
      const center = world({x:cx,y:cy});
      const xValues = polygon.map(p=>world(p).x);
      const yValues = polygon.map(p=>world(p).y);
      const width = Math.max(...xValues)-Math.min(...xValues);
      const height = Math.max(...yValues)-Math.min(...yValues);
      const shadow = ctx.createRadialGradient(
        center.x-8,center.y-11,2,center.x,center.y,Math.max(width,height)
      );
      shadow.addColorStop(0,'#fafffd');
      shadow.addColorStop(.36,'#c0e1e5');
      shadow.addColorStop(.9,'#548ca6');
      ctx.fillStyle=shadow;
      ctx.fillRect(Math.min(...xValues),Math.min(...yValues),width,height);
      // Sized to the actual rock polygon. Previous 90×65px minimum made this
      // 35px-wide obstacle look enormous next to the skimmer.
      stamp(ctx, 'rock', center.x, center.y,
        width * .92, height * .88, .87);
      // Fine fractured ice visible on the obstacle, never painted into valid ice.
      ctx.strokeStyle='#f6ffffcc';
      ctx.lineWidth=1.1;
      ctx.beginPath();
      ctx.moveTo(center.x-width*.2,center.y-height*.1);
      ctx.lineTo(center.x-width*.03,center.y+height*.09);
      ctx.lineTo(center.x+width*.22,center.y-height*.13);
      ctx.moveTo(center.x+width*.1,center.y+height*.2);
      ctx.lineTo(center.x+width*.19,center.y+height*.03);
      ctx.stroke();
      ctx.restore();

      // Small, precise rim. Broad 19–32px snowbank outlines belong to the
      // main track edge and would visually swallow a one-cell obstacle.
      ctx.save();
      ctx.lineJoin='round';
      polygonPath(ctx,polygon,world);
      ctx.strokeStyle='#17485b';
      ctx.lineWidth=3;
      ctx.stroke();
      polygonPath(ctx,polygon,world);
      ctx.strokeStyle='#e4f8fc';
      ctx.lineWidth=1.5;
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawGateFlags(ctx, circuit, world, biome=activeBiome) {
    // All flags are placed off-road; numerical gate segments stay canonical.
    const positions = [
      { x: 31.8, y: 12.6 },
      { x: 16, y: 1.1 },
      { x: .35, y: 12.5 },
      // Twin Routes' outer bank is high: the old (16,24.4) marker would
      // sit IN the scenic driving lane. Place it inside the central island.
      ['twin-routes','crosswind-ridge'].includes(circuit.id)
        ? { x: 11.2, y: 13.1 }
        : { x: 16, y: 24.4 }
    ];
    for (const point of positions) {
      const p = world(point);
      if(biome.id==='beginner')stamp(ctx,'flag',p.x,p.y,37,52,1);
      else paintBiomeBeacon(ctx,p.x,p.y,biome);
    }
    for (const point of [
      { x: 2.5, y: 21.4 }, { x: 30.7, y: 21.3 },
      { x: 3, y: 3.1 }, { x: 30.5, y: 3.5 }
    ]) {
      const p = world(point);
      if(biome.id==='beginner')stamp(ctx,'lantern',p.x,p.y,70,70,.9);
      else paintBiomeBeacon(ctx,p.x,p.y,biome);
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
    // Tiny trim strictly within the 72×40 skimmer artwork, never a larger hitbox.
    if(activeBiome.id!=='beginner'){
      ctx.strokeStyle=activeBiome.accent;
      ctx.lineWidth=2.2;ctx.globalAlpha=.8;
      ctx.beginPath();ctx.moveTo(-16,-2);ctx.lineTo(9,-2);ctx.stroke();
      ctx.globalAlpha=1;
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
    activeBiome=biomeForCircuit(circuit);
    if (circuit.id !== lastCircuitId || activeBiome.id !== lastBiomeId) {
      sceneDirty=true;
      lastCircuitId=circuit.id;
      lastBiomeId=activeBiome.id;
    }
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
      snowfield(background,width,height,activeBiome);
      drawOutdoorScenery(background,world,circuit,width,height,activeBiome);
      drawTrackSurface(background,circuit,world,width,height,activeBiome);
      drawIsland(background,circuit,world,activeBiome);
      drawRockObstacles(background,circuit,world);
      drawGateFlags(background,circuit,world,activeBiome);
      sceneDirty = false;
    }
    ctx.drawImage(staticScene, 0, 0, width, height);
  }

  return {
    assets: ASSETS,
    paintScene,
    getBiome:()=>activeBiome,
    snowfield,
    drawOutdoorScenery,
    drawTrackSurface,
    drawIsland,
    drawRockObstacles,
    drawGateFlags,
    drawSkimmer
  };
}
