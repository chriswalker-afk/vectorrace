import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  TIERS, BIOMES, tierFromLevel, biomeForCircuit, biomeForLevel
} from '../src/biomes.mjs';
import {
  CIRCUITS, NORTHERN_LOOP, AURORA_SPLIT, FROST_CHICANE,
  NARROW_PASSAGE, HAIRPIN_HOLLOW
} from '../src/circuit.mjs';
import { createRace, previewMove, takeTurn, score } from '../src/engine.mjs';

test('difficulty regions follow student progression, not assistance modes',()=>{
  assert.deepEqual(TIERS,['beginner','intermediate','advanced','expert']);
  assert.deepEqual(CIRCUITS.map(c=>biomeForCircuit(c).id),[
    'beginner','beginner','beginner','beginner','intermediate','intermediate','intermediate'
  ]);
  assert.equal(tierFromLevel('BEGINNER 4'),'beginner');
  assert.equal(tierFromLevel('INTERMEDIATE 1'),'intermediate');
  assert.equal(tierFromLevel('ADVANCED 2'),'advanced');
  assert.equal(tierFromLevel('EXPERT'),'expert');
  assert.equal(tierFromLevel('EXPERT 1'),'expert');
  assert.equal(tierFromLevel('unknown'), 'beginner');
  assert.equal(biomeForLevel('ADVANCED 1'),BIOMES.advanced);
  assert.equal(biomeForLevel('EXPERT 1'),BIOMES.expert);
});

test('all four biomes have unmistakably distinct land AND road palettes',()=>{
  const themes=TIERS.map(t=>BIOMES[t]);
  for(const [index,theme] of themes.entries()){
    assert.ok(Object.isFrozen(theme));
    assert.equal(theme.id,TIERS[index]);
    assert.equal(theme.ground.length,4);
    assert.equal(theme.road.length,4);
    for(const color of [...theme.ground,...theme.road,theme.accent,theme.pale]){
      assert.match(color,/^#[\da-f]{6}$/i,'Invalid CSS colour: '+color);
    }
    assert.ok(theme.name.length>=6);
    assert.ok(theme.shortName.length<=11);
    assert.ok(theme.scenery.length>=5);
    assert.ok(theme.groundTextureAlpha>=0&&theme.groundTextureAlpha<=1);
    assert.ok(theme.iceTextureAlpha>=0&&theme.iceTextureAlpha<=1);
  }
  for(const field of ['name','accent','uiBg','scenery','roadBase']){
    assert.equal(new Set(themes.map(t=>t[field])).size,4,
      field+' must distinguish every tier');
  }
  assert.equal(new Set(themes.map(t=>t.ground.join(','))).size,4);
  assert.equal(new Set(themes.map(t=>t.road.join(','))).size,4);
});

test('cosmetic regions contain no physics, obstacle or checkpoint overrides',()=>{
  const forbidden=['wind','friction','boost','acceleration','obstacles',
    'gravity','velocity','checkpoints','finish','collision','penalty'];
  for(const theme of Object.values(BIOMES)){
    for(const key of forbidden)assert.equal(key in theme,false,
      'Visual design must not change gameplay: '+key);
  }
  const selected={x:1,y:0};
  for(const circuit of CIRCUITS){
    const before=createRace(circuit);
    const preview=previewMove(before,selected,circuit);
    assert.deepEqual(preview.velocity,{x:1,y:0});
    const after=takeTurn(before,selected,circuit);
    assert.deepEqual(after.velocity,{x:1,y:0});
    assert.equal(after.moves,1);
    assert.equal(score(after,circuit),1);
  }
});

test('earlier circuits are untouched; visual renderer is isolated in V10',()=>{
  assert.deepEqual(CIRCUITS.slice(0,5),[
    NORTHERN_LOOP,AURORA_SPLIT,FROST_CHICANE,NARROW_PASSAGE,HAIRPIN_HOLLOW
  ]);
  const v9=readFileSync(new URL('../src/race-v9.mjs',import.meta.url),'utf8');
  const v10=readFileSync(new URL('../src/race-v10.mjs',import.meta.url),'utf8');
  assert.match(v9,/from '\.\/race-art\.mjs'/);
  assert.match(v10,/from '\.\/race-art-v10\.mjs'/);
  assert.match(v10,/document\.documentElement\.dataset\.biome/);
});

test('region preview shows all four tiers without inventing playable tracks',()=>{
  const html=readFileSync(new URL('../theme-gallery.html',import.meta.url),'utf8');
  const gallery=readFileSync(new URL('../src/biome-gallery.mjs',import.meta.url),'utf8');
  const art=readFileSync(new URL('../src/race-art-v10.mjs',import.meta.url),'utf8');
  for(const tier of TIERS)assert.match(html,new RegExp('preview-'+tier));
  assert.match(html,/Visual concepts/);
  assert.match(gallery,/NORTHERN_LOOP/);
  assert.match(art,/ctx\.clip\('evenodd'\)/);
  assert.match(art,/biomeForCircuit\(circuit\)/);
  assert.doesNotMatch(art,/createRace\(|takeTurn\(|previewMove\(/);
});
