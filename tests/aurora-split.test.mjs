import test from 'node:test';
import assert from 'node:assert/strict';
import { NORTHERN_LOOP, AURORA_SPLIT, CIRCUITS, getCircuit } from '../src/circuit.mjs';
import {
  createRace, onTrack, segmentOnTrack, previewMove, takeTurn,
  directedGateCrossing, gateProgress
} from '../src/engine.mjs';

const p=(x,y)=>({x,y});

test('two differently shaped beginner courses are in stable menu order',()=>{
  assert.deepEqual(CIRCUITS.map(c=>c.id),['northern-loop','aurora-split']);
  assert.strictEqual(getCircuit('northern-loop'), NORTHERN_LOOP);
  assert.strictEqual(getCircuit('aurora-split'), AURORA_SPLIT);
  assert.strictEqual(getCircuit('unknown'), NORTHERN_LOOP);
  assert.notDeepEqual(AURORA_SPLIT.outer,NORTHERN_LOOP.outer);
  assert.notDeepEqual(AURORA_SPLIT.inner,NORTHERN_LOOP.inner);
  assert.equal(AURORA_SPLIT.obstacles.length,1);
});

test('both circuits start safely and use the same deterministic velocity rules',()=>{
  for(const circuit of CIRCUITS){
    const initial=createRace(circuit);
    assert.equal(onTrack(initial.position,circuit),true);
    assert.deepEqual(initial.velocity,p(0,0));
    const first=previewMove(initial,p(1,0),circuit);
    assert.deepEqual(first.velocity,p(1,0));
    assert.deepEqual(first.to,p(14,19));
    const next=takeTurn(initial,p(1,0),circuit);
    assert.equal(next.moves,1);
    assert.equal(next.crashes,0);
  }
});

test('the ice floe is genuinely impassable although it sits inside the road',()=>{
  const c=AURORA_SPLIT;
  assert.equal(onTrack(p(17,20),c),true);
  assert.equal(onTrack(p(23,20),c),true);
  assert.equal(onTrack(p(19.7,20),c),false);
  assert.equal(segmentOnTrack(p(17,20),p(23,20),c),false);
  assert.equal(segmentOnTrack(p(17,22),p(23,22),c),true);
  assert.equal(segmentOnTrack(p(17,18),p(23,18),c),true);
});

test('the polygon is not just decorative: a legal-point jump through it crashes',()=>{
  const c=AURORA_SPLIT;
  const s={...createRace(c),position:p(17,20),velocity:p(5,0)};
  const move=previewMove(s,p(1,0),c);
  assert.equal(onTrack(move.from,c),true);
  assert.equal(onTrack(move.to,c),true);
  assert.equal(move.valid,false);
  const next=takeTurn(s,p(1,0),c);
  assert.equal(next.crashes,1);
  assert.equal(next.moves,1);
  assert.deepEqual(next.velocity,p(0,0));
  assert.deepEqual(next.position,s.position);
});

test('touching the physical floe boundary remains legal like other snowbanks',()=>{
  const c=AURORA_SPLIT;
  const tip=c.obstacles[0].polygon[0];
  assert.equal(onTrack(tip,c),true);
  assert.equal(segmentOnTrack(p(17,19.9),tip,c),true);
});

test('the second course retains all three sequential directional gates',()=>{
  const c=AURORA_SPLIT;
  assert.ok(directedGateCrossing(p(26,16),p(26,10),c.checkpoints[0]));
  assert.ok(directedGateCrossing(p(18,6),p(14,6),c.checkpoints[1]));
  assert.ok(directedGateCrossing(p(5,10),p(5,16),c.checkpoints[2]));
  assert.equal(gateProgress(p(15,19),p(18,19),0,0,c).laps,0);
  assert.equal(gateProgress(p(15,19),p(18,19),3,0,c).finished,true);
});

test('classic circuit has no new hidden obstacles or changed collision semantics',()=>{
  assert.equal(NORTHERN_LOOP.obstacles,undefined);
  assert.equal(segmentOnTrack(p(13,19),p(23,19),NORTHERN_LOOP),true);
  assert.equal(segmentOnTrack(p(16,19),p(16,5),NORTHERN_LOOP),false);
});
