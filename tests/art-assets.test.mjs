import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const assets = [
  'ice-skimmer-flare.svg',
  'pine-canopy.svg',
  'granite-outcrop.svg',
  'alpine-cabin.svg',
  'snowfield.svg',
  'ice-surface.svg',
  'race-flag.svg',
  'lantern.svg'
];

test('the art library contains the eight declared original SVG assets', () => {
  for (const name of assets) {
    const path = 'assets/art/' + name;
    assert.equal(existsSync(path), true, 'Missing ' + path);
    const text = readFileSync(path, 'utf8');
    assert.match(text, /^<svg[\s\S]*<\/svg>\s*$/, name);
    assert.match(text, /viewBox="0 0 \d+ \d+"/, 'Missing viewBox in ' + name);
    assert.doesNotMatch(text, /<script|<foreignObject|https?:\/\/(?!www\.w3\.org\/2000\/svg)/i,
      'Unexpected executable/external reference in ' + name);
  }
});

test('PR3 scene is separate from and compatible with PR2 physics', () => {
  const art = readFileSync('src/race-art.mjs', 'utf8');
  const controller = readFileSync('src/race-v3.mjs', 'utf8');
  assert.match(art, /drawTrackSurface/);
  assert.match(art, /trace\(ctx, circuit\.outer, world\)/);
  assert.match(art, /trace\(ctx, circuit\.inner, world\)/);
  assert.match(controller, /takeTurn\(state, selection, circuit\)/);
  assert.match(controller, /createSnowshiftArtwork/);
  assert.match(controller, /artwork\.paintScene/);
  for (const file of ['race-v3.html', 'styles/race-v3.css', 'artwork-lab.html']) {
    assert.equal(existsSync(file), true, 'Missing ' + file);
  }
});
