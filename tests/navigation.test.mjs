import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { CIRCUITS } from '../src/circuit.mjs';
const read = path => readFileSync(path, 'utf8');

test('homepage starts with distinct Solo and Pass & Play choices',()=>{
  const html=read('index.html');
  assert.match(html,/href="\.\/select-track\.html\?mode=single"/);
  assert.match(html,/href="\.\/select-track\.html\?mode=pass-play"/);
  assert.doesNotMatch(html,/href="race-v\d+\.html"/);
  assert.doesNotMatch(html,/artwork-lab\.html/);
  assert.equal(existsSync('race.html'),true);
});

test('all twelve tracks share one selection screen with no duplicated in-game list',()=>{
  const html=read('race.html');
  const old=read('race-v17.html');
  const oldButtons=[...old.matchAll(/data-circuit="([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(oldButtons,CIRCUITS.map(c=>c.id));
  assert.doesNotMatch(html,/id="mapMenu"|data-circuit=/);
  const selection=read('src/track-select.mjs');
  assert.match(selection,/CIRCUITS\.forEach/);
  assert.match(selection,/raceUrl\(circuit\.id/);
  assert.match(read('select-track.html'),/id="trackList"/);
});

test('Home, change-track, reset and replay each have a distinct purpose',()=>{
  const current=read('race.html');
  assert.match(current,/id="homeLink"[^>]*href="\.\/index\.html"/);
  assert.match(current,/id="mapPicker"[^>]*href="\.\/select-track\.html/);
  assert.match(current,/id="finishChooseTrack"[^>]*href="\.\/select-track\.html/);
  assert.match(current,/id="raceAgain"/);
  assert.match(current,/id="reset"/);
  const legacy=read('race-v17.html');
  assert.match(legacy,/id="homeLink"/);
  assert.match(legacy,/id="mapMenu"/);
});

test('public game retains deep-linked track and redirects a missing track to selector',()=>{
  const current=read('src/race-v18.mjs');
  assert.match(current,/location\.replace\(selectUrl\(/);
  assert.match(current,/CIRCUITS\.some\(c => c\.id === requestedTrack\)/);
  assert.match(current,/playHotseatMove/);
  assert.match(read('race.html'),/src\/race-v18\.mjs/);
});

test('world gallery leads to Home and current selector, never an obsolete build',()=>{
  const gallery=read('theme-gallery.html');
  assert.match(gallery,/href="\.\/index\.html"/);
  assert.match(gallery,/href="\.\/select-track\.html\?mode=single"/);
  assert.doesNotMatch(gallery,/href="[^"]*race-v\d+\.html"/);
  assert.doesNotMatch(gallery,/Advanced and Expert courses are not yet implemented/);
});
