import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NORTHERN_LOOP, AURORA_SPLIT, FROST_CHICANE, CIRCUITS, getCircuit
} from '../src/circuit.mjs';
import { createRace, takeTurn, segmentOnTrack, onTrack } from '../src/engine.mjs';
import { findLegalLap } from '../scripts/solve-lap.mjs';
import { FROST_CHICANE_CLEAR_LAP } from '../scripts/frost-chicane-qa-route.mjs';
import {
  MIN_RECOMMENDED_CLEARANCE, visualSkimmerPathClearance
} from '../scripts/track-clearance.mjs';

const p=(x,y)=>({x,y});

test('third circuit appears after first two with no new physics/obstacle mechanics',()=>{
  assert.deepEqual(CIRCUITS.map(c=>c.id),[
    'northern-loop','aurora-split','frost-chicane'
  ]);
  assert.strictEqual(getCircuit('frost-chicane'), FROST_CHICANE);
  assert.strictEqual(getCircuit('northern-loop'), NORTHERN_LOOP);
  assert.strictEqual(getCircuit('aurora-split'), AURORA_SPLIT);
  assert.equal(FROST_CHICANE.obstacles,undefined);
  assert.equal(FROST_CHICANE.crashPenalty,NORTHERN_LOOP.crashPenalty);
  assert.deepEqual(FROST_CHICANE.start,NORTHERN_LOOP.start);
  assert.deepEqual(FROST_CHICANE.checkpoints.map(g=>g.id),
    ['east','south','west']);
  assert.notDeepEqual(FROST_CHICANE.outer,AURORA_SPLIT.outer);
  assert.notDeepEqual(FROST_CHICANE.inner,NORTHERN_LOOP.inner);
  assert.ok(FROST_CHICANE.outer.length>NORTHERN_LOOP.outer.length);
});

test('a straight glide through the first chicane bend is not a free shortcut',()=>{
  assert.equal(onTrack(p(18,20),FROST_CHICANE),false,
    'the outer snowbank should force the car to move inward');
  assert.equal(onTrack(p(23,17),FROST_CHICANE),false,
    'the inner snowbank should force the car outward at the next bend');
  assert.equal(segmentOnTrack(p(17,19),p(23,19),FROST_CHICANE),false);
  assert.equal(onTrack(p(19,17),FROST_CHICANE),true);
  assert.equal(onTrack(p(23,20),FROST_CHICANE),true);
});

test('the actual engine finds a crash-free completed lap with a modest increase',()=>{
  const oldShortest=findLegalLap(NORTHERN_LOOP).length;
  const auroraShortest=findLegalLap(AURORA_SPLIT).length;
  const route=findLegalLap(FROST_CHICANE);
  assert.ok(route.length>=oldShortest && route.length>=auroraShortest,
    'Frost Chicane should not be easier than previous beginner maps');
  assert.ok(route.length<=Math.max(oldShortest,auroraShortest)+7,
    'Frost Chicane should not jump sharply in theoretical difficulty');
  let race=createRace(FROST_CHICANE);
  for(const acceleration of route){
    race=takeTurn(race,acceleration,FROST_CHICANE);
    assert.equal(race.crashes,0,'solver route crashed on turn '+race.moves);
  }
  assert.equal(race.finished,true);
  assert.equal(race.checkpoint,0);
  assert.equal(race.laps,1);
});

test('a full chicane-driving lap stays clear of the skimmer AND painted snowbanks',()=>{
  let race=createRace(FROST_CHICANE);
  let passedFirstBend=false,passedSecondBend=false;
  let minClearance=Infinity;
  for(const acceleration of FROST_CHICANE_CLEAR_LAP){
    const next=takeTurn(race,acceleration,FROST_CHICANE);
    assert.equal(next.crashes,0,'crashed on turn '+next.moves);
    assert.equal(segmentOnTrack(race.position,next.position,FROST_CHICANE),
      true,'crossed snowbank on turn '+next.moves);
    // 17.5..25 is the deliberately new geometry, not the old-course gates.
    if(Math.max(race.position.x,next.position.x)>=17.5 &&
       Math.min(race.position.x,next.position.x)<=25 &&
       next.checkpoint===0){
      const clearance=visualSkimmerPathClearance(
        race.position,next.position,FROST_CHICANE
      );
      minClearance=Math.min(minClearance,clearance);
      assert.ok(clearance >= MIN_RECOMMENDED_CLEARANCE+0.2-1e-8,
        'turn '+next.moves+' has only '+clearance.toFixed(2)+
        ' units of margin; at least '+(MIN_RECOMMENDED_CLEARANCE+0.2)+' needed');
    }
    if(next.position.x===19 && next.position.y===17)passedFirstBend=true;
    if(next.position.x===23 && next.position.y===21)passedSecondBend=true;
    race=next;
  }
  assert.equal(passedFirstBend,true,'did not drive through the inward bend');
  assert.equal(passedSecondBend,true,'did not drive through the outward bend');
  assert.ok(minClearance>=MIN_RECOMMENDED_CLEARANCE+0.2);
  assert.equal(race.moves,FROST_CHICANE_CLEAR_LAP.length);
  assert.equal(race.crashes,0);
  assert.equal(race.checkpoint,0);
  assert.equal(race.laps,1);
  assert.equal(race.finished,true);
});

test('previous maps retain their original drivable corridors and rock tests',()=>{
  assert.equal(NORTHERN_LOOP.obstacles,undefined);
  assert.equal(AURORA_SPLIT.obstacles?.length,1);
  assert.equal(segmentOnTrack(p(18,19),p(23,19),NORTHERN_LOOP),true);
  assert.equal(segmentOnTrack(p(18,19),p(23,19),AURORA_SPLIT),false);
});
