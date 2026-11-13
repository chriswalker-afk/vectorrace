# PR #8 — Two beginner tracks: Northern Loop and Aurora Split

## Track progression

**01 · Northern Loop — Beginner 1.** The original, forgiving loop. Unchanged geometry, gates and physics. Best scores from V5 continue to load from the original localStorage key.

**02 · Aurora Split — Beginner 2.** A recognisably different ice circuit with two extra challenges:
1. A **small snow-covered rock in the middle of the widened northern racing straight**. It creates two genuinely skimmer-width navigable lanes. Choose to pass *above or below* and reduce momentum before threading the gap.
2. A **subtle southern dogleg** that forces a more deliberate braking/turning sequence after the east gate.

The ice rock is not a painted decoration. Its polygon is part of the exact full-segment collision code, so a straight-line glide from one legal side to the other **crashes** if it tunnels through the rock. Both endpoints being on the ice does not make that movement legal. Touching a snowbank or rock boundary remains legal under the original rules.

### Map change

Use the small **GLACIER CUP ▾** control at the top-left of the race board to choose either track. The menu lives inside the course display; it doesn't add an extra screen, extra row or scrolling. It shows the level and the challenge at a glance.

Changing circuits starts a new run on the selected map and closes any tutorial or active animation. Guided, Standard, Expert and Master mode choices remain available; a player's current assistance mode is retained across circuits.

Tracks have separate local personal bests and ghosts. The existing Northern Loop personal best is **not** renamed, cleared or mixed with the second circuit's records.

### Shortcuts / deep links

- \`race-v6.html\` — Beginner 1 by default
- \`race-v6.html?track=aurora-split\` — Beginner 2 immediately
- \`race-v5.html\` — unchanged previous single-track build for comparison

The homepage points to the V6 two-map experience once this PR is merged.

## Geometry/rendering

- \`src/circuit.mjs\` now exports \`AURORA_SPLIT\`, \`CIRCUITS\`, and \`getCircuit(id)\`.
- \`src/engine.mjs\` optionally accepts \`circuit.obstacles\`. Collision testing splits each gliding segment at each obstacle polygon edge **in addition** to the outer boundary and main island.
- \`src/race-art.mjs\` uses those same polygons to clip the blue ice surface, paint exact snowbanks, and draw a small snow-covered rock within the forbidden polygon. The background cache is invalidated when changing circuits, rather than continuing to show the old course.
- \`src/race-records.mjs\` has circuit-specific storage keys while retaining the exact classic Northern Loop key.
- \`race-v6.html\` / \`src/race-v6.mjs\` / \`styles/map-selector.css\` contain the map picker and map-aware UI, preserving V5's 100dvh responsive controls.

## Verification gates

1. The second map has an actual complete crash-free solution through *all three* ordered checkpoints and the finish; the shortest-route reconstruction runs against the unmodified vector rules.
2. No ghost shortcut: a glide crossing the rock crashes even if both endpoints lie on legal ice; valid upper and lower lanes remain available.
3. Changing maps resets the current run, displays the correct course and keeps personal bests separate.
4. The map picker and both options stay inside the viewport, checked in Chrome on nine sizes from desktop to 320×568 portrait and 667×375 landscape.
5. Guided, Standard, Expert and Master still work, including Master column-vector controls and no-hints rules.
6. Complete browser integration also checks a real second-course lap, real rock collision, records, restart and normal outer snowbank crash.

Run with:

\`\`\`sh
npm test
npm run check
python3 -m http.server 8000
\`\`\`

This is a **first expanded course pack**, not an advanced-track system or an editor. Future routes could introduce one new skill each (narrow bridge, diagonal chicane, double apex, etc.) without changing the underlying deterministic vector rules.
