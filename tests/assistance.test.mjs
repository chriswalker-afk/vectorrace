import test from 'node:test';
import assert from 'node:assert/strict';
import { NORTHERN_LOOP } from '../src/circuit.mjs';
import { createRace, previewMove, takeTurn, score } from '../src/engine.mjs';
import { MODES, modePolicy, moveExplanation } from '../src/assistance.mjs';

test('assistance modes expose progressively less mathematical prediction', () => {
  assert.deepEqual(MODES, ['guided','standard','expert','master']);
  const guided=modePolicy('guided'),standard=modePolicy('standard'),expert=modePolicy('expert'),master=modePolicy('master');
  assert.equal(guided.allDestinations,true);
  assert.equal(standard.allDestinations,false);
  assert.equal(standard.selectedDestination,true);
  assert.equal(expert.selectedDestination,false);
  assert.equal(expert.nextVelocity,false);
  assert.equal(expert.warnings,false);
  assert.equal(expert.accelerationNotation,'arrows');
  assert.equal(master.accelerationNotation,'columns');
  assert.deepEqual({...master,accelerationNotation:'arrows'},expert);
  assert.equal(master.coordinateGrid,false);
  assert.throws(()=>modePolicy('unknown'),RangeError);
});

test('difficulty changes hints but never changes the physics', () => {
  const initial=createRace(NORTHERN_LOOP);
  const acceleration={x:1,y:0};
  const predicted=previewMove(initial,acceleration,NORTHERN_LOOP);
  const outcomes=MODES.map(mode=>({
    mode, message:moveExplanation(initial,acceleration,mode,predicted),
    state:takeTurn(initial,acceleration,NORTHERN_LOOP)
  }));
  assert.deepEqual(outcomes[0].state,outcomes[1].state);
  assert.deepEqual(outcomes[1].state,outcomes[2].state);
  assert.deepEqual(outcomes[2].state,outcomes[3].state);
  assert.equal(score(outcomes[0].state),1);
  assert.match(outcomes[2].message.message,/No prediction/);
  assert.deepEqual(outcomes[2].message,outcomes[3].message);
});

test('Guided and Standard warn about a full-path crash; Expert does not disclose risk', () => {
  const state={...createRace(), position:{x:16,y:19}, velocity:{x:0,y:-14}};
  const preview=previewMove(state,{x:0,y:0});
  assert.equal(preview.valid,false);
  for(const mode of ['guided','standard']){
    const result=moveExplanation(state,{x:0,y:0},mode,preview);
    assert.equal(result.tone,'danger');
    assert.match(result.message,/CRASH RISK/);
  }
  for(const mode of ['expert','master'])
    assert.equal(moveExplanation(state,{x:0,y:0},mode,preview).tone,'neutral');
});

test('zero-velocity planning has a clear explanation',()=>{
  const state=createRace();
  const p=previewMove(state,{x:0,y:0});
  assert.match(moveExplanation(state,{x:0,y:0},'guided',p).message,/STOP/);
});
