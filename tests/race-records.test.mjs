import test from 'node:test';
import assert from 'node:assert/strict';
import { createRecordStore, validRecord, RECORD_KEY, recordKeyForCircuit } from '../src/race-records.mjs';

function fakeStorage() {
  const entries=new Map();
  return {
    getItem:k=>entries.get(k)??null,
    setItem:(k,v)=>entries.set(k,v),
    raw:entries
  };
}
const frames=[{x:13,y:19},{x:14,y:19},{x:15,y:19}];

test('finishing a run stores a valid local best with one frame per attempted turn',()=>{
  const store=fakeStorage();
  const recorder=createRecordStore(store);
  assert.equal(recorder.load(),null);
  const result=recorder.saveIfBetter(2,2,0,frames);
  assert.equal(result.improved,true);
  assert.equal(result.persisted,true);
  assert.equal(result.best.score,2);
  assert.equal(validRecord(result.best),true);
  assert.deepEqual(JSON.parse(store.raw.get(RECORD_KEY)).frames,frames);
  assert.equal(createRecordStore(store).load().score,2);
});

test('worse or equal scores do not replace a personal best',()=>{
  const storage=fakeStorage(),recorder=createRecordStore(storage);
  recorder.saveIfBetter(2,2,0,frames);
  const original=storage.raw.get(RECORD_KEY);
  assert.equal(recorder.saveIfBetter(2,2,0,frames).improved,false);
  assert.equal(recorder.saveIfBetter(4,4,0,[...frames,frames[2],frames[2]]).improved,false);
  assert.equal(storage.raw.get(RECORD_KEY),original);
});

test('a crash is recorded at the same position and costs 3 extra points',()=>{
  const withCrash=[{x:13,y:19},{x:13,y:19},{x:14,y:19}];
  const outcome=createRecordStore(fakeStorage()).saveIfBetter(5,2,1,withCrash);
  assert.equal(outcome.improved,true);
  assert.deepEqual(outcome.best.frames[1],withCrash[0]);
});

test('invalid or tampered stored records are ignored',()=>{
  const storage=fakeStorage(),store=createRecordStore(storage);
  storage.raw.set(RECORD_KEY,JSON.stringify({version:1,score:20,moves:1,crashes:0,frames}));
  assert.equal(store.load(),null);
  storage.raw.set(RECORD_KEY,'this is not json');
  assert.equal(store.load(),null);
  assert.equal(validRecord({}),false);
});

test('storage being blocked does not interrupt a finish',()=>{
  const storage={getItem(){throw new Error('blocked')},setItem(){throw new Error('blocked')}};
  const recorder=createRecordStore(storage);
  const result=recorder.saveIfBetter(2,2,0,frames);
  assert.equal(result.improved,true);
  assert.equal(result.persisted,false);
  assert.equal(recorder.load().score,2);
});

test('invalid frame counts are not accepted as a personal best',()=>{
  const recorder=createRecordStore(fakeStorage());
  const result=recorder.saveIfBetter(2,2,0,frames.slice(0,1));
  assert.equal(result.improved,false);
  assert.equal(result.best,null);
});


test('personal best records are isolated by circuit and the classic storage key is unchanged',()=>{
  const storage=fakeStorage();
  assert.equal(recordKeyForCircuit('northern-loop'),RECORD_KEY);
  const otherKey=recordKeyForCircuit('aurora-split');
  assert.notEqual(otherKey,RECORD_KEY);
  const original=createRecordStore(storage,'northern-loop');
  const second=createRecordStore(storage,'aurora-split');
  assert.equal(original.saveIfBetter(2,2,0,frames).improved,true);
  assert.equal(second.load(),null);
  const secondFrames=[{x:13,y:19},{x:14,y:19},{x:16,y:19},{x:17,y:19}];
  assert.equal(second.saveIfBetter(3,3,0,secondFrames).improved,true);
  assert.equal(original.load().score,2);
  assert.equal(second.load().score,3);
  assert.equal(storage.raw.size,2);
  assert.equal(createRecordStore(storage,'aurora-split').load().score,3);
  assert.equal(createRecordStore(storage,'northern-loop').load().score,2);
});

test('only known-safe identifier shapes can become storage keys',()=>{
  assert.throws(()=>recordKeyForCircuit('aurora split'),TypeError);
  assert.throws(()=>recordKeyForCircuit('../foo'),TypeError);
  assert.throws(()=>recordKeyForCircuit(''),TypeError);
});
