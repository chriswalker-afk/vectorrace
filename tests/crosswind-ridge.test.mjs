import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CIRCUITS, NORTHERN_LOOP, AURORA_SPLIT, FROST_CHICANE,
  NARROW_PASSAGE, HAIRPIN_HOLLOW, TWIN_ROUTES, GLASS_ICE,
  CROSSWIND_RIDGE, getCircuit
} from '../src/circuit.mjs';
import {
  createRace, onTrack, segmentOnTrack, takeTurn, previewMove, possibleMoves,
  windZoneAt, windVectorAt
} from '../src/engine.mjs';
import {
  brakeRun, brakingForecast, surfaceBrakingAcceleration
} from '../src/race-coach.mjs';
import { findLegalLap } from '../scripts/solve-lap.mjs';
import { CROSSWIND_RIDGE_CLEAR_LAP } from '../scripts/crosswind-ridge-qa-route.mjs';
import {
  MIN_RECOMMENDED_CLEARANCE, visualSkimmerPathClearance
} from '../scripts/track-clearance.mjs';

const p=(x,y)=>({x,y});

test('Track 08 is Intermediate 4 with one explicit constant southward wind field',()=>{
  assert.deepEqual(CIRCUITS.map(c=>c.id),[
    'northern-loop','aurora-split','frost-chicane',
    'narrow-passage','hairpin-hollow','twin-routes',
    'glass-ice','crosswind-ridge'
  ]);
  assert.strictEqual(getCircuit('crosswind-ridge'),CROSSWIND_RIDGE);
  for(const original of [
    NORTHERN_LOOP,AURORA_SPLIT,FROST_CHICANE,NARROW_PASSAGE,
    HAIRPIN_HOLLOW,TWIN_ROUTES,GLASS_ICE
  ])assert.strictEqual(getCircuit(original.id),original);
  assert.equal(CROSSWIND_RIDGE.level,'INTERMEDIATE 4');
  assert.equal(CROSSWIND_RIDGE.windZones.length,1);
  assert.equal(CROSSWIND_RIDGE.glassZones,undefined);
  assert.equal(CROSSWIND_RIDGE.obstacles,undefined);
  assert.equal(CROSSWIND_RIDGE.windZones[0].id,'ridge-crosswind');
  assert.deepEqual(CROSSWIND_RIDGE.windZones[0].vector,p(0,-1));
  assert.deepEqual(CROSSWIND_RIDGE.checkpoints.map(g=>g.id),[
    'east','south','west'
  ]);
  assert.equal(CROSSWIND_RIDGE.crashPenalty,3);
  assert.deepEqual(createRace(CROSSWIND_RIDGE).velocity,p(0,0));
});

test('the visible wind polygon is driveable roadway, active at turn start and its border',()=>{
  const c=CROSSWIND_RIDGE,zone=c.windZones[0];
  for(const at of [p(18,20),p(22,21),p(17,20),p(26,20),p(21,24.2)]){
    assert.strictEqual(windZoneAt(at,c),zone);
    assert.deepEqual(windVectorAt(at,c),p(0,-1));
  }
  for(const at of [p(16,20),p(27,20),p(20,18.5)]){
    assert.equal(windZoneAt(at,c),null);
    assert.deepEqual(windVectorAt(at,c),p(0,0));
  }
  assert.equal(onTrack(p(20,20),c),true);
  assert.equal(onTrack(p(22,20),c),true);
  assert.equal(segmentOnTrack(p(16,20),p(27,20),c),true);
});

test('preview and actual turn add the fixed wind exactly once, with all nine options',()=>{
  const c=CROSSWIND_RIDGE;
  const on={...createRace(c),position:p(18,20),velocity:p(3,0)};
  const east=previewMove(on,p(1,0),c);
  assert.deepEqual(east.wind,p(0,-1));
  assert.equal(east.windZone,'ridge-crosswind');
  assert.deepEqual(east.velocity,p(4,-1));
  assert.deepEqual(east.to,p(22,19));
  assert.equal(east.valid,true);
  const counter=previewMove(on,p(1,1),c);
  assert.deepEqual(counter.velocity,p(4,0));
  assert.deepEqual(counter.to,p(22,20));
  assert.equal(counter.valid,true);
  const advanced=takeTurn(on,p(1,1),c);
  assert.deepEqual(advanced.velocity,p(4,0));
  assert.deepEqual(advanced.position,p(22,20));
  assert.equal(advanced.moves,on.moves+1);
  assert.equal(advanced.crashes,0);
  const moves=possibleMoves(on,c);
  assert.equal(moves.length,9);
  assert.equal(moves.filter(m=>m.zoneBlocked).length,0,
    'Wind must NOT copy the Glass Ice five-option rule');
  assert.equal(moves.find(m=>m.acceleration.x===1 && m.acceleration.y===0)
    .velocity.y,-1);
});

test('entering a zone does not apply wind mid-turn; first affected step follows landing',()=>{
  const c=CROSSWIND_RIDGE;
  const before={...createRace(c),position:p(15,20),velocity:p(2,0)};
  const entering=previewMove(before,p(1,0),c);
  assert.deepEqual(entering.wind,p(0,0));
  assert.deepEqual(entering.to,p(18,20));
  assert.equal(entering.windZone,null);
  const landed=takeTurn(before,p(1,0),c);
  assert.deepEqual(windVectorAt(landed.position,c),p(0,-1));
  assert.deepEqual(previewMove(landed,p(0,0),c).velocity,p(3,-1));
  assert.deepEqual(previewMove(landed,p(0,1),c).velocity,p(3,0));
});

test('students who fail to counter the crosswind drift towards the island',()=>{
  const c=CROSSWIND_RIDGE;
  let state={...createRace(c),position:p(18,20),velocity:p(3,0)};
  state=takeTurn(state,p(1,0),c);
  assert.deepEqual(state.position,p(22,19));
  assert.equal(state.crashes,0);
  const move=previewMove(state,p(-1,0),c);
  assert.deepEqual(move.velocity,p(3,-2));
  assert.deepEqual(move.to,p(25,17));
  assert.equal(move.valid,false,'Uncorrected drift must cause a real collision');
  const after=takeTurn(state,p(-1,0),c);
  assert.equal(after.crashes,1);
  assert.equal(after.moves,state.moves+1);
  assert.deepEqual(after.velocity,p(0,0));
});

test('wind-aware Guided coach accounts for counterforce and never invents a stop',()=>{
  const c=CROSSWIND_RIDGE;
  const position=p(18,20),velocity=p(2,0);
  assert.deepEqual(surfaceBrakingAcceleration(position,velocity,c),p(-1,1));
  assert.deepEqual(
    surfaceBrakingAcceleration(position,velocity,GLASS_ICE),p(-1,0)
  );
  const run=brakeRun(position,velocity,c);
  assert.equal(run.safe,true);
  assert.equal(run.steps,2);
  assert.deepEqual(run.stop,p(19,20));
  assert.deepEqual(run.segments.map(m=>m.acceleration),[p(-1,1),p(-1,1)]);
  assert.deepEqual(run.segments.map(m=>m.wind),[p(0,-1),p(0,-1)]);
  assert.ok(run.segments.every(m=>m.valid));
  const game={...createRace(c),position,velocity};
  const forecast=brakingForecast(game,p(0,1),c);
  assert.deepEqual(forecast.selected.velocity,p(2,0));
  assert.deepEqual(forecast.selected.wind,p(0,-1));
  assert.ok(forecast.braking.segments.every(m=>m.valid));
});

test('all seven existing circuits are physically unchanged and wind-free',()=>{
  for(const c of CIRCUITS.slice(0,7)){
    assert.equal(windZoneAt(c.start,c),null);
    assert.deepEqual(windVectorAt(c.start,c),p(0,0));
    const state=createRace(c);
    const move=previewMove(state,p(1,0),c);
    assert.deepEqual(move.wind,p(0,0));
    assert.deepEqual(move.velocity,p(1,0));
    const actual=takeTurn(state,p(1,0),c);
    assert.deepEqual(actual.velocity,p(1,0));
  }
  const oldGlass={...createRace(GLASS_ICE),position:p(18,20)};
  assert.equal(previewMove(oldGlass,p(1,1),GLASS_ICE).zoneBlocked,true);
});

test('24-turn full lap requires three deliberate counterwind decisions',()=>{
  let state=createRace(CROSSWIND_RIDGE);
  const events=[];let windTurns=0,minMargin=Infinity;
  for(const a of CROSSWIND_RIDGE_CLEAR_LAP){
    const active=windZoneAt(state.position,CROSSWIND_RIDGE);
    if(active){
      windTurns++;
      assert.equal(a.y,1,
        'QA route must deliberately counter southward wind on turn '+(state.moves+1));
      assert.equal(state.velocity.y,0);
    }
    const preview=previewMove(state,a,CROSSWIND_RIDGE);
    assert.equal(preview.valid,true,'Illegal route at turn '+(state.moves+1));
    const clearance=visualSkimmerPathClearance(
      state.position,preview.to,CROSSWIND_RIDGE
    );
    minMargin=Math.min(minMargin,clearance);
    assert.ok(clearance>=MIN_RECOMMENDED_CLEARANCE-1e-9,
      'Visible skimmer scrapes a bank at move '+(state.moves+1)+
      ' clearance '+clearance.toFixed(3));
    state=takeTurn(state,a,CROSSWIND_RIDGE);
    assert.equal(state.crashes,0);
    if(state.lastEvent.endsWith('cleared'))events.push(state.lastEvent);
  }
  assert.equal(CROSSWIND_RIDGE_CLEAR_LAP.length,24);
  assert.equal(windTurns,3);
  assert.deepEqual(events,[
    'East Wind Gate cleared',
    'Return Straight Gate cleared',
    'West Ridge Gate cleared'
  ]);
  assert.ok(minMargin>=1);
  assert.equal(state.moves,24);
  assert.equal(state.laps,1);
  assert.equal(state.finished,true);
});

test('independent shortest-lap solver uses the true wind physics',()=>{
  const actions=findLegalLap(CROSSWIND_RIDGE);
  assert.ok(actions.length>=16&&actions.length<=38);
  let state=createRace(CROSSWIND_RIDGE);
  for(const a of actions){
    const preview=previewMove(state,a,CROSSWIND_RIDGE);
    assert.equal(preview.valid,true);
    state=takeTurn(state,a,CROSSWIND_RIDGE);
    assert.equal(state.crashes,0);
  }
  assert.equal(state.finished,true);
  assert.equal(state.laps,1);
});
