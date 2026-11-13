import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACCELERATION_GRID, accelerationChoice, accelerationChoiceDescription
} from '../src/acceleration-pad.mjs';
import { modePolicy } from '../src/assistance.mjs';
import { vectorEntries } from '../src/vector-notation.mjs';
import { createRace, takeTurn, previewMove } from '../src/engine.mjs';

test('the Master keypad keeps the standard nine accelerations in spatial order',()=>{
  assert.equal(ACCELERATION_GRID.length,9);
  assert.deepEqual(ACCELERATION_GRID.map(({x,y})=>[x,y]),[
    [-1,1],[0,1],[1,1],
    [-1,0],[0,0],[1,0],
    [-1,-1],[0,-1],[1,-1]
  ]);
  assert.equal(new Set(ACCELERATION_GRID.map(c=>c.x+','+c.y)).size,9);
  assert.deepEqual(vectorEntries(accelerationChoice(-1,1)),['-1','1']);
  assert.deepEqual(vectorEntries(accelerationChoice(0,0)),['0','0']);
  assert.deepEqual(vectorEntries(accelerationChoice(1,-1)),['1','-1']);
});

test('Master labelling describes the x component above the y component',()=>{
  assert.equal(accelerationChoiceDescription(-1,1),
    'Acceleration column vector: top x-component -1, bottom y-component 1');
  assert.throws(()=>accelerationChoice(2,0),RangeError);
  assert.throws(()=>accelerationChoice(.5,0),TypeError);
  assert.throws(()=>accelerationChoice(0,NaN),TypeError);
});

test('Master inherits all Expert restrictions, apart from displaying column controls',()=>{
  const expert=modePolicy('expert'),master=modePolicy('master');
  assert.deepEqual({...master,accelerationNotation:'arrows'},expert);
  assert.equal(master.allDestinations,false);
  assert.equal(master.selectedDestination,false);
  assert.equal(master.warnings,false);
  assert.equal(master.nextVelocity,false);
});

test('choosing a column vector is exactly the same racing move as clicking its arrow',()=>{
  const original=createRace();
  for(const choice of ACCELERATION_GRID){
    const selected=accelerationChoice(choice.x,choice.y);
    assert.deepEqual(previewMove(original,choice),previewMove(original,selected));
    assert.deepEqual(takeTurn(original,choice),takeTurn(original,selected));
  }
});
