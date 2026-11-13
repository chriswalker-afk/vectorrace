import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CIRCUITS, NORTHERN_LOOP, AURORA_SPLIT, FROST_CHICANE,
  NARROW_PASSAGE, HAIRPIN_HOLLOW, TWIN_ROUTES, getCircuit
} from '../src/circuit.mjs';
import { createRace, onTrack, segmentOnTrack, previewMove, takeTurn } from '../src/engine.mjs';
import { findLegalLap } from '../scripts/solve-lap.mjs';
import {
  TWIN_ROUTES_SHORTCUT_LAP, TWIN_ROUTES_WIDE_LAP
} from '../scripts/twin-routes-qa-laps.mjs';
import {
  MIN_RECOMMENDED_CLEARANCE, visibleSkimmerClearance,
  visualSkimmerPathClearance
} from '../scripts/track-clearance.mjs';

const p=(x,y)=>({x,y});

test('Track 06 adds only a second Intermediate course in Aurora Vale',()=>{
  assert.deepEqual(CIRCUITS.slice(0,6).map(c=>c.id),[
    'northern-loop','aurora-split','frost-chicane',
    'narrow-passage','hairpin-hollow','twin-routes'
  ]);
  assert.strictEqual(getCircuit('twin-routes'),TWIN_ROUTES);
  for(const original of [NORTHERN_LOOP,AURORA_SPLIT,FROST_CHICANE,NARROW_PASSAGE,HAIRPIN_HOLLOW])
    assert.strictEqual(getCircuit(original.id),original);
  assert.equal(TWIN_ROUTES.level,'INTERMEDIATE 2');
  assert.deepEqual(TWIN_ROUTES.checkpoints.map(g=>g.id),['east','south','west']);
  assert.equal(TWIN_ROUTES.crashPenalty,3);
  assert.deepEqual(createRace(TWIN_ROUTES).velocity,p(0,0));
  assert.equal(TWIN_ROUTES.obstacles.length,1);
  assert.equal(TWIN_ROUTES.obstacles[0].id,'glacier-divider');
  assert.equal(TWIN_ROUTES.obstacles[0].artStyle,'glacial-divider');
});

test('the divider creates two genuine, car-width routes and a wider safe corridor',()=>{
  const c=TWIN_ROUTES,divider=c.obstacles[0].polygon;
  const x=18;
  const btm=18.45,top=21.5,innerTop=15+(18-12)/11,outerTop=26.3-(18-14)*1.3/12;
  const shortWidth=btm-innerTop,wideWidth=outerTop-top;
  assert.ok(shortWidth>2*MIN_RECOMMENDED_CLEARANCE,
    'Shortcut is physically too narrow for visible skimmer');
  assert.ok(wideWidth>shortWidth+1.2,
    'Outer route must be demonstrably wider, not an identical lane');
  assert.ok(wideWidth>4);
  assert.equal(onTrack(p(x,20),c),false,'Divider must be genuinely impassable');
  assert.equal(onTrack(p(x,17),c),true);
  assert.equal(onTrack(p(x,23.5),c),true);
  assert.equal(segmentOnTrack(p(18,17),p(18,23.5),c),false,
    'Cannot jump between routes through solid divider');
  assert.equal(segmentOnTrack(p(15,17),p(22,17),c),true);
  assert.equal(segmentOnTrack(p(15,23.5),p(22,23.5),c),true);
  const shortMargin=visibleSkimmerClearance(p(x,17),c);
  const wideMargin=visibleSkimmerClearance(p(x,23.5),c);
  assert.ok(shortMargin>=1.3,'Inner shortcut is not skimmer-width safe');
  assert.ok(wideMargin>=shortMargin+.45,
    'Wide lane should have meaningfully greater vehicle clearance');
});

function lapByRoute(route,expectedBranch,requiredMargin) {
  let race=createRace(TWIN_ROUTES);
  const events=[];
  let length=0, minimum=Infinity, observedFork=null;
  for(const acceleration of route) {
    const preview=previewMove(race,acceleration,TWIN_ROUTES);
    assert.equal(preview.valid,true,'Illegal segment on turn '+(race.moves+1));
    const margin=visualSkimmerPathClearance(
      race.position,preview.to,TWIN_ROUTES
    );
    minimum=Math.min(minimum,margin);
    assert.ok(margin >= requiredMargin-1e-8,
      expectedBranch+' at turn '+(race.moves+1)+
      ' visually grazes snowbank or divider: '+margin.toFixed(3));
    length+=Math.hypot(
      preview.to.x-race.position.x,preview.to.y-race.position.y
    );
    // The divider spans x 13.6..22.6; x=18 lies strictly within it.
    if(race.checkpoint===0 && race.position.x<=18 && preview.to.x>=18 &&
       preview.to.x>race.position.x) {
      const t=(18-race.position.x)/(preview.to.x-race.position.x);
      const y=race.position.y+(preview.to.y-race.position.y)*t;
      observedFork=y>=21.5?'outer':y<=18.45?'inner':'blocked';
    }
    race=takeTurn(race,acceleration,TWIN_ROUTES);
    assert.equal(race.crashes,0,'Route crashed on turn '+race.moves);
    if(race.lastEvent.endsWith('cleared'))events.push(race.lastEvent);
  }
  assert.equal(observedFork,expectedBranch,
    'Expected the route to cross the actual '+expectedBranch+' fork');
  assert.deepEqual(events,[
    'East Gate cleared','South Gate cleared','West Gate cleared'
  ]);
  assert.equal(race.finished,true,'Route did not cross finish');
  assert.equal(race.laps,1);
  assert.equal(race.checkpoint,0);
  return {moves:race.moves,distance:length,clearance:minimum,score:race.moves};
}

test('INNER shortcut completes 23 turns without shaving the vehicle against land',()=>{
  const route=lapByRoute(TWIN_ROUTES_SHORTCUT_LAP,'inner',1.0);
  assert.equal(route.moves,23);
  assert.ok(route.distance>69 && route.distance<71);
  assert.ok(route.clearance>=MIN_RECOMMENDED_CLEARANCE);
});

test('OUTER wide route completes 24 turns with an extra half-car margin',()=>{
  const route=lapByRoute(TWIN_ROUTES_WIDE_LAP,'outer',1.4);
  assert.equal(route.moves,24);
  assert.ok(route.distance>75 && route.distance<78);
  assert.ok(route.clearance>=1.4);
});

test('the chosen short line really saves distance and a turn versus safe reference',()=>{
  const short=lapByRoute(TWIN_ROUTES_SHORTCUT_LAP,'inner',1.0);
  const safe=lapByRoute(TWIN_ROUTES_WIDE_LAP,'outer',1.4);
  assert.ok(safe.distance-short.distance>5,
    'The alternative must be genuinely longer, not just labelled scenic');
  assert.equal(safe.moves-short.moves,1,
    'Our tested racing lines should illustrate a practical turn/score tradeoff');
  assert.ok(safe.clearance-short.clearance>.35,
    'Conservative line must offer meaningfully larger buffer');
});

test('full engine finds a crash-free complete lap without invoking route fixtures',()=>{
  const actions=findLegalLap(TWIN_ROUTES);
  assert.ok(actions.length>=18 && actions.length<=34);
  let race=createRace(TWIN_ROUTES);
  for(const a of actions){
    race=takeTurn(race,a,TWIN_ROUTES);
    assert.equal(race.crashes,0,'Shortest solver crashed');
  }
  assert.equal(race.finished,true);
  assert.equal(race.laps,1);
});
