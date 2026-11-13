import test from 'node:test';
import assert from 'node:assert/strict';
import { vectorEntries, vectorDescription } from '../src/vector-notation.mjs';

test('column notation has x above y, never an ordered pair', () => {
  assert.deepEqual(vectorEntries({ x: 3, y: -2 }), ['3', '-2']);
  assert.deepEqual(vectorEntries({ x: 0, y: 1 }), ['0', '1']);
  assert.deepEqual(vectorEntries({ x: -1, y: 0 }), ['-1', '0']);
});

test('assistive label makes the component order explicit', () => {
  assert.equal(vectorDescription({x:3,y:-2},'Velocity'),
    'Velocity column vector: top x-component 3, bottom y-component -2');
  assert.doesNotMatch(vectorDescription({x:3,y:-2}),/\\(.*,. *\\)/);
});

test('expert mode conceals both entries without exposing values', () => {
  assert.deepEqual(vectorEntries({x:8,y:-7},true), ['?', '?']);
  const label=vectorDescription({x:8,y:-7},'Next velocity',true);
  assert.match(label,/components hidden/);
  assert.doesNotMatch(label,/8|-7/);
});

test('bad numerical components cannot slip into the renderer',()=>{
  assert.throws(()=>vectorEntries({x:1.2,y:0}),TypeError);
  assert.throws(()=>vectorEntries({x:NaN,y:0}),TypeError);
  assert.throws(()=>vectorEntries(null),TypeError);
});
