import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('every playable build and early lab shows vertical x then y entries', () => {
  const files = ['race-v2.html','race-v3.html','race-v4.html','race-v5.html','snowshift-lab.html'];
  for (const file of files) {
    const source = readFileSync(file,'utf8');
    assert.match(source,/column-vectors\.css/,file+' missing common stylesheet');
    for (const id of file === 'snowshift-lab.html'
      ? ['vcurrent','accel','vnext']
      : ['currentVelocity','selectedAcceleration','nextVelocity']) {
      const start=source.indexOf('id="'+id+'"');
      assert.notEqual(start,-1,file+' missing '+id);
      const block=source.slice(start,start+350);
      const x=block.indexOf('data-component="x"');
      const y=block.indexOf('data-component="y"');
      assert.ok(x!==-1&&y>x,file+' incorrectly ordered '+id);
      assert.match(block,/column-vector/,file+' not rendered as matrix '+id);
      assert.doesNotMatch(block,/\(\s*[+-]?\d+\s*,\s*[+-]?\d+\s*\)/,file+' uses ordered pair '+id);
    }
  }
});

test('every gameplay controller renders matrices, not vector coordinate strings',()=>{
  for(const file of [
    'src/race-ui.mjs','src/race-v3.mjs','src/race-v4.mjs','src/race-v5.mjs'
  ]) {
    const source=readFileSync(file,'utf8');
    assert.match(source,/renderColumnVector/,file);
    assert.doesNotMatch(source,/\.textContent = vectorText\(/,file);
  }
});
