import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CIRCUITS, NORTHERN_LOOP, AURORA_SPLIT, FROST_CHICANE,
  NARROW_PASSAGE, HAIRPIN_HOLLOW, getCircuit
} from '../src/circuit.mjs';
import {
  createRace, onTrack, segmentOnTrack, takeTurn,
  previewMove, gateProgress
} from '../src/engine.mjs';
import { findLegalLap } from '../scripts/solve-lap.mjs';
import { HAIRPIN_HOLLOW_CLEAR_LAP } from '../scripts/hairpin-hollow-qa-route.mjs';
import {
  MIN_RECOMMENDED_CLEARANCE, visibleSkimmerClearance,
  visualSkimmerPathClearance
} from '../scripts/track-clearance.mjs';

const p=(x,y)=>({x,y});

test('fifth circuit is Intermediate 1 and retains baseline vector rules',()=>{
  assert.deepEqual(CIRCUITS.slice(0,5).map(c=>c.id),[
    'northern-loop','aurora-split','frost-chicane',
    'narrow-passage','hairpin-hollow'
  ]);
  assert.strictEqual(getCircuit('hairpin-hollow'),HAIRPIN_HOLLOW);
  for(const original of [NORTHERN_LOOP,AURORA_SPLIT,FROST_CHICANE,NARROW_PASSAGE])
    assert.strictEqual(getCircuit(original.id),original);
  assert.equal(HAIRPIN_HOLLOW.level,'INTERMEDIATE 1');
  assert.equal(HAIRPIN_HOLLOW.obstacles,undefined);
  assert.equal(HAIRPIN_HOLLOW.crashPenalty,3);
  assert.deepEqual(HAIRPIN_HOLLOW.checkpoints.map(g=>g.id),
    ['east','south','west']);
  assert.deepEqual(createRace(HAIRPIN_HOLLOW).velocity,p(0,0));
});

test('long eastbound straight is safely raceable before the reversal',()=>{
  const c=HAIRPIN_HOLLOW;
  for(let x=11;x<=24;x++){
    assert.equal(onTrack(p(x,20),c),true,'straight at x='+x);
    const clearance=visibleSkimmerClearance(p(x,20),c);
    assert.ok(clearance>=MIN_RECOMMENDED_CLEARANCE,
      'unfair straight at x='+x+': '+clearance);
  }
  assert.equal(segmentOnTrack(p(11,20),p(24,20),c),true);
  assert.ok(c.featuredHairpin.approach.xMax-c.featuredHairpin.approach.xMin>=12);
});

test('east gate makes a real U-turn mandatory: upper and lower lanes separate',()=>{
  const c=HAIRPIN_HOLLOW;
  assert.equal(onTrack(p(20,20),c),true);
  assert.equal(onTrack(p(20,12),c),true);
  assert.equal(onTrack(p(20,16),c),false,'island must split the two lanes');
  assert.equal(segmentOnTrack(p(20,20),p(20,12),c),false,
    'must not jump through the central island');
  assert.equal(onTrack(p(28,17),c),true,'hairpin nose must be driveable');
  const eastGate=c.checkpoints[0];
  const crossing=gateProgress(p(28,17),p(28,15),0,0,c);
  assert.equal(crossing.checkpoint,1);
  assert.equal(eastGate.direction.y,-1);
  const southGate=c.checkpoints[1];
  assert.equal(southGate.direction.x,-1,
    'return gate must require actual westbound movement after the U-turn');
});

test('a complete crash-free lap exists with base-game deterministic physics',()=>{
  const c=HAIRPIN_HOLLOW;
  const actions=findLegalLap(c);
  assert.ok(actions.length>=18&&actions.length<=38,
    'The hairpin should be demanding but not an endurance test');
  let state=createRace(c);
  for(const a of actions){
    state=takeTurn(state,a,c);
    assert.equal(state.crashes,0,'shortest legal lap crashed on turn '+state.moves);
  }
  assert.equal(state.finished,true);
  assert.equal(state.laps,1);
  assert.equal(state.checkpoint,0);
});

test('safe lap brakes +4 to zero and accelerates to -4 around the eastern hairpin',()=>{
  const c=HAIRPIN_HOLLOW;
  let state=createRace(c),min=Infinity;
  let maxPositive=0,minNegative=0;
  let zeroAtHairpin=false,eastGate=false,southGate=false,westGate=false;
  let nose=false;
  const progress=[];
  for(const a of HAIRPIN_HOLLOW_CLEAR_LAP){
    const preview=previewMove(state,a,c);
    assert.equal(preview.valid,true,'illegal full movement segment at move '+(state.moves+1));
    const clearance=visualSkimmerPathClearance(state.position,preview.to,c);
    min=Math.min(min,clearance);
    assert.ok(clearance>=MIN_RECOMMENDED_CLEARANCE+0.19-1e-8,
      'Car would visually scrape bank on move '+(state.moves+1)+
      ': '+clearance.toFixed(3)+' world units');
    state=takeTurn(state,a,c);
    assert.equal(state.crashes,0,'unexpected crash');
    maxPositive=Math.max(maxPositive,state.velocity.x);
    minNegative=Math.min(minNegative,state.velocity.x);
    if(state.position.x>=27&&state.position.y>=15&&state.position.y<=19&&
       state.velocity.x===0)zeroAtHairpin=true;
    if(state.position.x===28&&state.position.y===17)nose=true;
    if(state.checkpoint>progress.at(-1))progress.push(state.checkpoint);
    eastGate||=state.lastEvent==='East Hairpin Gate cleared';
    southGate||=state.lastEvent==='Return Straight Gate cleared';
    westGate||=state.lastEvent==='West Sweep Gate cleared';
  }
  assert.equal(HAIRPIN_HOLLOW_CLEAR_LAP.length,25);
  assert.equal(maxPositive,4);
  assert.equal(minNegative,-4);
  assert.equal(zeroAtHairpin,true);
  assert.equal(nose,true);
  assert.ok(min>=1.19);
  assert.equal(eastGate,true);
  assert.equal(southGate,true);
  assert.equal(westGate,true);
  assert.equal(state.finished,true);
  assert.equal(state.laps,1);
  assert.equal(state.checkpoint,0);
  assert.equal(state.moves,25);
});
