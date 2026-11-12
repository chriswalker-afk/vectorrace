# PR #3 — Snowshift original artwork pass

**Status:** original game-integrated artwork candidate. This is a substantive upgrade to the procedural art in PR #2, but not a claim that every illustrated asset is final.

## Open the two reviews

- **Playable art build:** \`race-v3.html\`
- **Asset review sheet:** \`artwork-lab.html\`
- Stable comparison from PR #2: \`race-v2.html\`

When merged and GitHub Pages is configured for \`main\`, the corresponding paths are served under \`https://chriswalker-afk.github.io/vectorrace/\`.

## What was created

| Asset | File | Gameplay purpose |
|---|---|---|
| Flare skimmer | \`assets/art/ice-skimmer-flare.svg\` | Original right-facing orange racing sled with runners, canopy, rear engines, panels |
| Frostpine | \`assets/art/pine-canopy.svg\` | Snow-laden overhead evergreen, rescalable |
| Granite | \`assets/art/granite-outcrop.svg\` | Overhead snow-capped rock, reusable on landscape |
| Cabin | \`assets/art/alpine-cabin.svg\` | Warm architectural point of interest inside the island |
| Flag | \`assets/art/race-flag.svg\` | Original orange off-road race markers |
| Lantern | \`assets/art/lantern.svg\` | Warm pools of ambient illumination |
| Ice | \`assets/art/ice-surface.svg\` | Reusable muted blue crystalline surface texture |
| Snow | \`assets/art/snowfield.svg\` | Reusable snowfield grain / drift texture |

All eight assets are self-contained SVG and contain no copied third-party sprites, remote fonts or external image dependencies.

## World treatment

\`src/race-art.mjs\` is the scene's sole art compositor. It:

1. Paints subtle snow gradients, light drift shapes and repeating powder texture.
2. Clips trees and rocks outside the playable outer polygon (trees can never camouflage a legal corridor).
3. Draws the dark ice road, clipping *exactly* between the outer and inner physical polygons.
4. Reuses both exact polygon boundaries for the channel shadow and bright snowbanks.
5. Clips the central forest, rock and cabin to the unplayable island.
6. Places orange flags and amber lanterns off the track.
7. Renders the skimmer on the mathematically exact current position, rotated to match its velocity.
8. Keeps a 2x-resolution offscreen static-scene cache to make movement animation smooth, invalidating it when SVG files load.

The driving and scoring remain pure functions in \`src/engine.mjs\`. No changes are made to track geometry or physics. Skimmer animation still follows straight vector segments. Snow affects *appearance*, not velocity.

## Review priorities

1. **Legibility:** The track is readable from the classroom projector and at phone width. Start/finish and CP1/2/3 are discoverable.
2. **Quality consistency:** Vehicles, snowy pines, rocks, cabin, safety flags and lighting feel like one world.
3. **Collision alignment:** Bright bank core traces the exact same geometry used by \`segmentOnTrack()\`.
4. **Motion:** Rotating the vehicle does not shift its true position or alter its current velocity.
5. **Performance:** At 2x cache resolution, the scene is drawn once (and redrawn only as assets arrive), not repainted in every animation frame.
6. **Resilience:** If an asset fails to load, core play still works (the skimmer has a simple fallback illustration).

## Commands

\`\`\`sh
npm test
npm run check
python3 -m http.server 8000
\`\`\`

Open \`http://localhost:8000/race-v3.html\` and \`http://localhost:8000/artwork-lab.html\`. Do not open the module-based game with the \`file://\` protocol.

GitHub CI now validates the SVG library as XML and captures a headless browser screenshot where Chromium is available.

## Explicitly not part of this PR

- A new track or second skimmer livery.
- A new input architecture, tutorial or mathematics assistance modes (planned UX pass).
- Audio, AI opponents, multiplayer, powerups and progression.
- Custom animated particle sheets or non-deterministic terrain physics.
- An assertion that a single art pass is final: this build should be reviewed and improved from visual screenshots before locking the entire asset family.

## Art references and provenance

The style draws on broad winter-sports atmosphere and the SNOWSHIFT creative brief. The design sketch produced during conversation guided the mood, but is **not used as a runtime bitmap**, because a prepainted circuit cannot reliably share exact geometry with the collision engine. All repository artwork is new SVG art authored for Snowshift.
