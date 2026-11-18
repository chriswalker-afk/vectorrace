import test from 'node:test';
import assert from 'node:assert/strict';
import { NORTHERN_LOOP, FROZEN_GAUNTLET } from '../src/circuit.mjs';
import { createRace, takeTurn } from '../src/engine.mjs';
import { createHotseat, playHotseatMove, raceUrl, selectUrl } from '../src/pass-play.mjs';
import {
  CAR_STYLES,BODY_COLORS,DEFAULT_CARS,SOLO_CAR_KEY,
  normalizeCar,defaultCars,encodeCars,decodeCars,loadSoloCar,saveSoloCar,
  drawCar
} from '../src/car-customization.mjs';

test('four named car shapes, preset colours and separate trim colours',()=>{
  assert.deepEqual(CAR_STYLES.map(c=>c.id),['skimmer','arrow','rally','glider']);
  assert.equal(new Set(BODY_COLORS).size,BODY_COLORS.length);
  assert.equal(DEFAULT_CARS.length,4);
  assert.equal(new Set(DEFAULT_CARS.map(c=>c.body)).size,4);
  for(const preset of DEFAULT_CARS){
    assert.match(preset.body,/^#[0-9a-f]{6}$/);
    assert.match(preset.trim,/^#[0-9a-f]{6}$/);
  }
});

test('URL designs round-trip with unique appearances in single and 2–4 players',()=>{
  const custom=[
    {style:'glider',body:'#112233',trim:'#aabbcc'},
    {style:'rally',body:'#e45a11',trim:'#ffbbee'},
    {style:'arrow',body:'#00aaff',trim:'#ffffaa'},
    {style:'skimmer',body:'#224466',trim:'#d4fc77'}
  ];
  for(let count=1;count<=4;count++){
    const encoded=encodeCars(custom,count);
    assert.equal(encoded.split('~').length,count);
    assert.deepEqual(decodeCars(encoded,count),custom.slice(0,count));
    assert.ok(encoded.length<=160);
  }
  assert.deepEqual(decodeCars(null,4),defaultCars(4));
});

test('malformed, oversized or hostile car URL tokens are ignored',()=>{
  const fall=defaultCars(3);
  assert.deepEqual(decodeCars('<script>alert(1)</script>',3),fall);
  assert.deepEqual(decodeCars('garbage'.repeat(100),3),fall);
  const bad='glider-ff0000-00ff00~rally-ff0000-zzzzzz';
  const decoded=decodeCars(bad,3);
  assert.deepEqual(decoded[0],{style:'glider',body:'#ff0000',trim:'#00ff00'});
  assert.deepEqual(decoded[1],fall[1]);
  assert.deepEqual(decoded[2],fall[2]);
  assert.deepEqual(normalizeCar({style:'hack',body:'red;url(test)',trim:'#bad'}),DEFAULT_CARS[0]);
  assert.deepEqual(normalizeCar({style:'arrow',body:'#A1B2C3',trim:'#010203'}),
    {style:'arrow',body:'#a1b2c3',trim:'#010203'});
});

test('solo garage saves safely and does not require an account',()=>{
  const values=new Map();
  const storage={
    getItem:key=>values.get(key)??null,
    setItem:(key,value)=>values.set(key,value)
  };
  const car={style:'arrow',body:'#12ab34',trim:'#fedcba'};
  assert.equal(saveSoloCar(storage,car),true);
  assert.equal(values.has(SOLO_CAR_KEY),true);
  assert.deepEqual(loadSoloCar(storage),car);
  assert.deepEqual(loadSoloCar({getItem(){throw Error('denied')}}),DEFAULT_CARS[0]);
  assert.equal(saveSoloCar({setItem(){throw Error('denied')}},car),false);
  assert.deepEqual(loadSoloCar({getItem(){return '{';}}),DEFAULT_CARS[0]);
});

test('custom cars travel from chooser to race and back without changing track',()=>{
  const cars=defaultCars(4);
  cars[0]={style:'glider',body:'#123456',trim:'#eeaacc'};
  const solo=raceUrl('frozen-gauntlet','single',2,cars);
  const s=new URLSearchParams(solo.split('?')[1]);
  assert.equal(s.get('track'),'frozen-gauntlet');
  assert.equal(s.get('mode'),'single');
  assert.deepEqual(decodeCars(s.get('cars'),1),cars.slice(0,1));
  const multi=raceUrl('northern-loop','pass-play',4,cars);
  const m=new URLSearchParams(multi.split('?')[1]);
  assert.equal(m.get('players'),'4');
  assert.deepEqual(decodeCars(m.get('cars'),4),cars);
  const chooser=selectUrl('pass-play',4,cars);
  const back=new URLSearchParams(chooser.split('?')[1]);
  assert.equal(back.get('mode'),'pass-play');
  assert.equal(back.get('players'),'4');
  assert.deepEqual(decodeCars(back.get('cars'),4),cars);
  // Existing plain links remain compatible with older saved bookmarks.
  assert.equal(raceUrl('northern-loop'),'./race.html?track=northern-loop&mode=single');
  assert.equal(selectUrl('single'),'./select-track.html?mode=single');
});

test('pass-and-play stores individual car skins throughout independent physics turns',()=>{
  const cars=[
    {style:'rally',body:'#ff3388',trim:'#edf8fa'},
    {style:'glider',body:'#aabbcc',trim:'#12ff34'}
  ];
  for(const circuit of [NORTHERN_LOOP,FROZEN_GAUNTLET]){
    const match=createHotseat(circuit,2,cars);
    assert.deepEqual(match.players.map(p=>p.car),cars);
    assert.deepEqual(match.players.map(p=>p.color),cars.map(c=>c.body));
    const next=playHotseatMove(match,{x:1,y:0},circuit);
    assert.deepEqual(next.players.map(p=>p.car),cars);
    assert.deepEqual(next.players[0].state,takeTurn(createRace(circuit),{x:1,y:0},circuit));
    assert.deepEqual(next.players[1].state,createRace(circuit));
    assert.notEqual(next.players[0].state,next.players[1].state);
  }
});

function fakeCanvas(){
  const operations=[];
  const ctx={ops:operations};
  for(const key of ['save','restore','translate','rotate','scale','beginPath','moveTo','lineTo',
    'closePath','fill','stroke','ellipse','fillRect']){
    ctx[key]=(...args)=>operations.push([key,...args]);
  }
  return ctx;
}
test('all four body styles paint distinct silhouettes without mutating physics state',()=>{
  const race=createRace(NORTHERN_LOOP);
  const silhouettes=[];
  for(const style of CAR_STYLES){
    const ctx=fakeCanvas();
    drawCar(ctx,{x:200,y:150},0,1,{style:style.id,body:'#ff7557',trim:'#f5fbff'});
    assert.equal(ctx.ops[0][0],'save');
    assert.deepEqual(ctx.ops[1],['translate',200,150]);
    assert.equal(ctx.ops.at(-1)[0],'restore');
    silhouettes.push(JSON.stringify(ctx.ops.filter(op=>['moveTo','lineTo','fillRect'].includes(op[0]))));
  }
  assert.equal(new Set(silhouettes).size,4,'body shapes must differ visibly');
  assert.deepEqual(race,createRace(NORTHERN_LOOP),'drawing must not change the race engine');
});
