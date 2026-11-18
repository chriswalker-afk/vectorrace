import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { CIRCUITS } from '../src/circuit.mjs';
const read = path => readFileSync(path, 'utf8');

test('the public homepage uses the current race entry, not a legacy version', () => {
  const home = read('index.html');
  assert.match(home, /href="race\.html"/);
  assert.doesNotMatch(home, /href="race-v\d+\.html"/);
  assert.doesNotMatch(home, /artwork-lab\.html/);
  assert.equal(existsSync('race.html'), true);
});

test('both current race entries offer every circuit exactly once', () => {
  for (const page of ['race.html', 'race-v17.html']) {
    const buttons = [...read(page).matchAll(/data-circuit="([^"]+)"/g)].map(m => m[1]);
    assert.equal(buttons.length, CIRCUITS.length, 'Incomplete selector: ' + page);
    assert.deepEqual(buttons, CIRCUITS.map(c => c.id), 'Missing, duplicate or out-of-order circuits: ' + page);
  }
});

test('Home is explicit and separate from resetting and choosing another track', () => {
  for (const page of ['race.html', 'race-v17.html']) {
    const html = read(page);
    assert.match(html, /id="homeLink"[^>]*href="\.\/index\.html"/);
    assert.match(html, /id="finishChooseTrack"/);
    assert.match(html, /class="top-button finish-home" href="\.\/index\.html"/);
    assert.match(html, /id="raceAgain"/);
    assert.match(html, /id="reset"/);
  }
});

test('world gallery navigates to Home or current race, not obsolete track one', () => {
  const gallery = read('theme-gallery.html');
  assert.match(gallery, /href="\.\/index\.html"/);
  assert.match(gallery, /href="\.\/race\.html"/);
  assert.doesNotMatch(gallery, /href="[^"]*race-v\d+\.html"/);
  assert.doesNotMatch(gallery, /Advanced and Expert courses are not yet implemented/);
});

test('new race visits show the chooser; deep links retain their track', () => {
  const js = read('src/race-v17.mjs');
  assert.match(js, /const requestedTrack = new URLSearchParams\(location\.search\)\.get\('track'\)/);
  assert.match(js, /showTrackPickerOnEntry = !requestedTrack/);
  assert.match(js, /if \(showTrackPickerOnEntry\)/);
  assert.match(js, /history\.replaceState\(null,'',url\)/);
});
