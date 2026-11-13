import test from 'node:test';
import assert from 'node:assert/strict';
import { AURORA_SPLIT, NORTHERN_LOOP } from '../src/circuit.mjs';
import { createRace, takeTurn, onTrack, segmentOnTrack } from '../src/engine.mjs';
import {
  SKIMMER_HALF_WIDTH, VISUAL_SAFETY_MARGIN,
  MIN_RECOMMENDED_CLEARANCE, visibleSkimmerClearance
} from '../scripts/track-clearance.mjs';

const p=(x,y)=>({x,y});
const obstacle=AURORA_SPLIT.obstacles[0];

test('rock is small relative to the drawn skimmer and placed in a wide section',()=>{
  const xs=obstacle.polygon.map(v=>v.x);
  const ys=obstacle.polygon.map(v=>v.y);
  const width=Math.max(...xs)-Math.min(...xs);
  const height=Math.max(...ys)-Math.min(...ys);
  assert.ok(width<=1.6,'Rock is too wide: '+width);
  assert.ok(height<=1.1,'Rock is too tall: '+height);
  assert.equal(obstacle.label,'Snow-covered Rock');
  assert.equal(SKIMMER_HALF_WIDTH,0.8);
  assert.equal(MIN_RECOMMENDED_CLEARANCE,SKIMMER_HALF_WIDTH+VISUAL_SAFETY_MARGIN);
});

test('both upper and lower lanes have car-width clearance for the entire rock',()=>{
  for(const [lane,y] of [['lower',17],['upper',21]]){
    let narrowest=Infinity;
    for(let step=0;step<=60;step++){
      const x=18+step/10;
      const position=p(x,y);
      assert.equal(onTrack(position,AURORA_SPLIT),true,
        lane+' lane blocked at x='+x);
      const clearance=visibleSkimmerClearance(position,AURORA_SPLIT);
      narrowest=Math.min(narrowest,clearance);
      assert.ok(clearance >= MIN_RECOMMENDED_CLEARANCE-1e-8,
        lane+' lane at x='+x+' has only '+clearance.toFixed(2)+
          ' world units clearance (needs '+MIN_RECOMMENDED_CLEARANCE+')');
    }
    assert.ok(narrowest>1.15,lane+' lane too close to snowbanks for a visible skimmer');
  }
});

test('both lanes are reachable by real acceleration choices from the actual start',()=>{
  const choices=[
    {name:'lower',y:17,accelerations:[
      p(1,-1),p(1,1),p(0,0),p(0,0),p(0,0)
    ]},
    {name:'upper',y:21,accelerations:[
      p(1,1),p(1,-1),p(0,1),p(0,-1),p(0,0)
    ]}
  ];
  for(const {name,y,accelerations} of choices){
    let state=createRace(AURORA_SPLIT);
    for(const acceleration of accelerations){
      const next=takeTurn(state,acceleration,AURORA_SPLIT);
      assert.equal(next.crashes,0,name+' lane crashed on turn '+next.moves);
      assert.equal(segmentOnTrack(state.position,next.position,AURORA_SPLIT),
        true,name+' lane not continuously legal');
      state=next;
    }
    assert.deepEqual(state.position,p(22,y),name+' lane did not pass the rock');
    assert.ok(visibleSkimmerClearance(state.position,AURORA_SPLIT)>
      MIN_RECOMMENDED_CLEARANCE);
  }
});

test('a straight high-speed jump through the smaller rock remains a collision',()=>{
  const a=p(19,19),b=p(23,19);
  assert.equal(onTrack(a,AURORA_SPLIT),true);
  assert.equal(onTrack(b,AURORA_SPLIT),true);
  assert.equal(segmentOnTrack(a,b,AURORA_SPLIT),false);
});

test('classic Northern Loop remains unchanged and has no new obstruction',()=>{
  assert.equal(NORTHERN_LOOP.obstacles,undefined);
  assert.equal(segmentOnTrack(p(18,19),p(23,19),NORTHERN_LOOP),true);
});
