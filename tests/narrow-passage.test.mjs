import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CIRCUITS, NARROW_PASSAGE, FROST_CHICANE,
  NORTHERN_LOOP, AURORA_SPLIT, getCircuit
} from '../src/circuit.mjs';
import { createRace, onTrack, segmentOnTrack, takeTurn } from '../src/engine.mjs';
import { findLegalLap } from '../scripts/solve-lap.mjs';
import { NARROW_PASSAGE_CLEAR_LAP } from '../scripts/narrow-passage-qa-route.mjs';
import {
  MIN_RECOMMENDED_CLEARANCE, visibleSkimmerClearance,
  visualSkimmerPathClearance
} from '../scripts/track-clearance.mjs';

const p=(x,y)=>({x,y});

test('fourth track extends beginner progression without new physics',()=>{
  assert.deepEqual(CIRCUITS.map(c=>c.id),[
    'northern-loop','aurora-split','frost-chicane','narrow-passage'
  ]);
  assert.strictEqual(getCircuit('narrow-passage'),NARROW_PASSAGE);
  assert.strictEqual(getCircuit('frost-chicane'),FROST_CHICANE);
  assert.strictEqual(getCircuit('northern-loop'),NORTHERN_LOOP);
  assert.strictEqual(getCircuit('aurora-split'),AURORA_SPLIT);
  assert.deepEqual(NARROW_PASSAGE.outer,FROST_CHICANE.outer);
  assert.notDeepEqual(NARROW_PASSAGE.inner,FROST_CHICANE.inner);
  assert.equal(NARROW_PASSAGE.obstacles,undefined);
  assert.deepEqual(NARROW_PASSAGE.start,FROST_CHICANE.start);
  assert.deepEqual(NARROW_PASSAGE.checkpoints.map(c=>c.id),
    ['east','south','west']);
  assert.equal(NARROW_PASSAGE.crashPenalty,3);
});

test('the single narrow passage is short, clearly defined and car-width safe',()=>{
  const c=NARROW_PASSAGE, zone=c.featuredPassage;
  assert.equal(zone.yMax-zone.yMin,3.2);
  assert.ok(zone.xMax-zone.xMin<=3.5);
  assert.ok(zone.xMax-zone.xMin>=3);
  assert.ok(zone.yMax-zone.yMin>2*MIN_RECOMMENDED_CLEARANCE,
    'Full skimmer plus two safety margins must fit');
  for(let i=0;i<=34;i++){
    const x=zone.xMin+i/10;
    const point=p(x,zone.passingLineY);
    assert.equal(onTrack(point,c),true,'Narrow racing line blocked at x='+x);
    const clearance=visibleSkimmerClearance(point,c);
    assert.ok(clearance>=MIN_RECOMMENDED_CLEARANCE+0.15-1e-8,
      'Insufficient skimmer clearance at x='+x+' : '+clearance);
  }
  // Actual full movement segment, not merely legal discrete endpoints.
  assert.equal(segmentOnTrack(p(14,5),p(19,5),c),true);
  const clearance=visualSkimmerPathClearance(p(14,5),p(19,5),c);
  assert.ok(clearance>=1.2-1e-8,'Centre line hugs island or bank: '+clearance);
});

test('a previously valid higher line now collides with the island bottleneck',()=>{
  assert.equal(onTrack(p(16,7),FROST_CHICANE),true);
  assert.equal(onTrack(p(16,7),NARROW_PASSAGE),false);
  assert.equal(segmentOnTrack(p(13,7),p(20,7),NARROW_PASSAGE),false);
  assert.equal(segmentOnTrack(p(13,5),p(20,5),NARROW_PASSAGE),true);
  // Physically cut-down gate spans only the truly passable road, not the island.
  assert.equal(NARROW_PASSAGE.checkpoints[1].b.y,6.2);
});

test('exact engine can complete the fourth course without crashes',()=>{
  const actions=findLegalLap(NARROW_PASSAGE);
  const frost=findLegalLap(FROST_CHICANE).length;
  assert.ok(actions.length>=frost,
    'Track 04 should not be shorter than the previous beginner challenge');
  assert.ok(actions.length<=frost+6,
    'Track 04 should be a gradual, not abrupt, difficulty increase');
  let state=createRace(NARROW_PASSAGE);
  for(const acceleration of actions){
    state=takeTurn(state,acceleration,NARROW_PASSAGE);
    assert.equal(state.crashes,0,'Solver hit snow at turn '+state.moves);
  }
  assert.equal(state.finished,true);
  assert.equal(state.laps,1);
  assert.equal(state.checkpoint,0);
});

test('a real 26-move race passes through the bottleneck with full car clearance',()=>{
  let state=createRace(NARROW_PASSAGE);
  let passedPassage=false,checked=0;
  for(const acceleration of NARROW_PASSAGE_CLEAR_LAP){
    const next=takeTurn(state,acceleration,NARROW_PASSAGE);
    assert.equal(next.crashes,0,'QA lap crashed at turn '+next.moves);
    assert.equal(segmentOnTrack(state.position,next.position,NARROW_PASSAGE),
      true,'QA move crossed snow at turn '+next.moves);
    const overlapsPassage=(
      Math.max(state.position.x,next.position.x)>=14.8 &&
      Math.min(state.position.x,next.position.x)<=18.2 &&
      state.checkpoint===1
    );
    if(overlapsPassage){
      passedPassage=true;
      const clearance=visualSkimmerPathClearance(
        state.position,next.position,NARROW_PASSAGE
      );
      assert.ok(clearance>=MIN_RECOMMENDED_CLEARANCE+0.15-1e-8,
        'QA move '+next.moves+' scrapes the bottleneck: '+clearance);
      checked++;
    }
    state=next;
  }
  assert.equal(passedPassage,true,'QA lap bypasses the narrow passage');
  assert.ok(checked>=1,'No approach/exit movement checked');
  assert.equal(state.finished,true);
  assert.equal(state.moves,NARROW_PASSAGE_CLEAR_LAP.length);
  assert.equal(state.crashes,0);
  assert.equal(state.laps,1);
});

test('first three circuits remain unchanged and independent',()=>{
  assert.equal(NORTHERN_LOOP.obstacles,undefined);
  assert.equal(AURORA_SPLIT.obstacles.length,1);
  assert.equal(FROST_CHICANE.obstacles,undefined);
  assert.equal(segmentOnTrack(p(14,7),p(19,7),FROST_CHICANE),true);
});
