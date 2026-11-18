import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CIRCUITS, ICEBOUND_RAPIDS, CROSSWIND_RIDGE, FROZEN_GAUNTLET, ARCTIC_GRAND_PRIX } from '../src/circuit.mjs';
import { createRace, previewMove, takeTurn, boostZoneAt, windZoneAt } from '../src/engine.mjs';
import { vectorDescription } from '../src/vector-notation.mjs';
import {
  forceComponents, inlineVector, forceDirection, inlineForce,
  describeAppliedForce, drawMapForceLabel
} from '../src/force-notation.mjs';

test('forces are vectors with x above y, never a naked scalar +2',()=>{
  assert.deepEqual(forceComponents({x:2,y:0}),['2','0']);
  assert.deepEqual(forceComponents({x:-2,y:0}),['−2','0']);
  assert.deepEqual(forceComponents({x:0,y:-1}),['0','−1']);
  assert.equal(inlineVector({x:2,y:0}),'(2, 0)');
  assert.equal(inlineVector({x:-2,y:0}),'(−2, 0)');
  assert.equal(inlineVector({x:0,y:-1}),'(0, −1)');
  assert.equal(inlineForce('BOOST',{x:2,y:0}),'BOOST → (2, 0)');
  assert.equal(inlineForce('BOOST',{x:-2,y:0}),'BOOST ← (−2, 0)');
  assert.equal(inlineForce('WIND',{x:0,y:-1}),'WIND ↓ (0, −1)');
  assert.equal(forceDirection({x:0,y:1}),'↑');
  assert.equal(forceDirection({x:0,y:0}),'');
  assert.equal(forceDirection({x:1,y:1}),'');
  assert.match(describeAppliedForce('Boost',{x:-2,y:0}),/top x-component -2, bottom y-component 0; added/);
  assert.throws(()=>inlineVector({x:2.5,y:0}),TypeError);
  assert.throws(()=>forceDirection({x:NaN,y:0}),TypeError);
});

function fakeContext(){
  const log=[];
  const ctx={log};
  for(const k of ['save','restore','strokeText','fillText','beginPath','moveTo',
    'bezierCurveTo','stroke']){
    ctx[k]=(...args)=>log.push([k,...args]);
  }
  ctx.measureText=text=>({width:text.length*7});
  return ctx;
}
test('track artwork paints two vertically stacked force components in parentheses',()=>{
  for(const [name,vector,componentTop,componentBottom,arrow] of [
    ['BOOST',{x:2,y:0},'2','0','→'],
    ['BOOST',{x:-2,y:0},'−2','0','←'],
    ['WIND',{x:0,y:-1},'0','−1','↓'],
    ['GLASS + WIND',{x:0,y:-1},'0','−1','↓']
  ]){
    const ctx=fakeContext();
    drawMapForceLabel(ctx,name,vector,{x:200,y:100});
    const labels=ctx.log.filter(op=>op[0]==='fillText');
    assert.equal(labels[0][1],name+' '+arrow);
    const top=labels.find(op=>op[1]===componentTop);
    const bottom=labels.find(op=>op[1]===componentBottom);
    assert.ok(top&&bottom);
    assert.ok(top[3]<bottom[3],'x component must be ABOVE y');
    assert.ok(ctx.log.filter(op=>op[0]==='bezierCurveTo').length===2,'draw both curved brackets');
    assert.equal(ctx.log.at(-1)[0],'restore');
    assert.ok(labels.every(op=>!/^BOOST [←→] [+-]?2$/.test(op[1])),
      'must not show scalar boost label');
  }
});

test('every external force in all twelve circuits has an explicit directional two-component vector',()=>{
  assert.equal(CIRCUITS.length,12);
  const counts={wind:0,boost:0};
  for(const circuit of CIRCUITS){
    for(const [kind,zones] of [['wind',circuit.windZones??[]],['boost',circuit.boostZones??[]]]){
      for(const zone of zones){
        counts[kind]++;
        assert.ok(Number.isInteger(zone.vector.x)&&Number.isInteger(zone.vector.y),circuit.id);
        assert.ok(forceDirection(zone.vector),circuit.id+' ambiguous force direction');
        const words=inlineForce(kind.toUpperCase(),zone.vector);
        assert.match(words,/\([−\d]+, [−\d]+\)/);
        assert.doesNotMatch(zone.label,/(?:Boost|boost)\s*[+−-]\s*2\b/);
      }
    }
  }
  assert.deepEqual(counts,{wind:3,boost:4}); // Crosswind, Gauntlet, Grand Prix; Icebound twice plus two returns.
  assert.deepEqual(ICEBOUND_RAPIDS.boostZones.map(z=>forceComponents(z.vector)),[['2','0'],['−2','0']]);
  assert.deepEqual(CROSSWIND_RIDGE.windZones.map(z=>forceComponents(z.vector)),[['0','−1']]);
  for(const circuit of [FROZEN_GAUNTLET,ARCTIC_GRAND_PRIX]){
    assert.deepEqual(forceComponents(circuit.windZones[0].vector),['0','−1']);
    assert.deepEqual(forceComponents(circuit.boostZones[0].vector),['−2','0']);
  }
});

test('boost and wind vectors used by the label are those actually added to velocity',()=>{
  for(const circuit of [CROSSWIND_RIDGE,ICEBOUND_RAPIDS,FROZEN_GAUNTLET,ARCTIC_GRAND_PRIX]){
    for(const zone of [...(circuit.windZones??[]),...(circuit.boostZones??[])]){
      const p={x:(zone.polygon[0].x+zone.polygon[2].x)/2,
        y:(zone.polygon[0].y+zone.polygon[2].y)/2};
      const forceWind=windZoneAt(p,circuit);
      const forceBoost=boostZoneAt(p,circuit);
      const force=(circuit.windZones??[]).includes(zone)?forceWind:forceBoost;
      assert.equal(force?.id,zone.id);
      const origin={...createRace(circuit),position:p,velocity:{x:0,y:0}};
      const v=previewMove(origin,{x:0,y:0},circuit);
      const actual=(circuit.windZones??[]).includes(zone)?v.wind:v.boost;
      assert.deepEqual(actual,zone.vector);
      assert.equal(inlineVector(actual),inlineVector(zone.vector));
    }
  }
});

test('public race, circuit selector, tutorial, toast and engine all use actual vector source data',()=>{
  const race=readFileSync('src/race-v18.mjs','utf8');
  const art=readFileSync('src/race-art-v17.mjs','utf8');
  const selector=readFileSync('src/track-select.mjs','utf8');
  const html=readFileSync('race.html','utf8');
  const circuit=readFileSync('src/circuit.mjs','utf8');
  const engine=readFileSync('src/engine.mjs','utf8');
  assert.match(html,/id="appliedForces"/);
  assert.match(html,/force-notation\.css/);
  assert.match(race,/renderColumnVector\(vector,zone\.vector/);
  assert.match(race,/renderAppliedForces\(windZone,boostZone\)/);
  assert.match(race,/inlineForce\('BOOST',boostAtStart\.vector\)/);
  assert.match(art,/drawMapForceLabel\(ctx,'BOOST',zone\.vector/);
  assert.match(art,/drawMapForceLabel\(ctx,'WIND',zone\.vector/);
  assert.match(art,/drawMapForceLabel\(ctx,'GLASS \+ WIND',wind\.vector/);
  assert.match(selector,/renderColumnVector\(vector,zone\.vector/);
  assert.match(engine,/inlineForce\('BOOST',move\.boost\)/);
  assert.doesNotMatch(art,/BOOST\s*[←→]\s*[+−-]2\b/);
  assert.doesNotMatch(race,/BOOST\s*[←→]\s*[+−-]2\b/);
  assert.doesNotMatch(circuit,/label:\s*'[^']*Boost\s*[+−-]2\b/i);
  assert.equal(vectorDescription({x:2,y:0},'Boost'),
    'Boost column vector: top x-component 2, bottom y-component 0');
});
