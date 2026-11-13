# PR #13 — Four distinct difficulty regions (visual progression)

**Purpose:** Let students **feel a geographic and aesthetic transition** when they graduate from Beginner → Intermediate → Advanced → Expert. The progression is visually meaningful, while the mathematical game remains consistent and fair.

## Region identities

| Difficulty | Region | Racing surface | Land / atmosphere | Decorative language | Accent |
|---|---|---|---|---|---|
| **Beginner** | **Snowbound Valley** | Familiar deep blue ice | Bright snow, fir trees, alpine cabin | Alpine evergreens, cabins, race flags | Spring lime |
| **Intermediate** | **Aurora Vale** | Saturated cyan / cobalt ice | Violet twilight, drifting aurora ribbons | Tall crystalline ice shards, illuminated rings and beacons | Violet |
| **Advanced** | **Ember Rift** | Copper-edged dark slate ice | Charcoal basalt and warm ember glow | Volcanic prisms, fractured stone and glowing fissures | Amber-orange |
| **Expert** | **Eclipse Summit** | Dark glass ice with ivory/gold boundaries | Near-black blue, eclipsed sun, stars | Gold-trimmed obelisks, concentric geometry and rare beacons | Pale gold |

**Important availability distinction:** The *first five race tracks* are the only playable tracks today: four Beginner courses in Snowbound Valley, and Hairpin Hollow (Intermediate 1) in Aurora Vale. Advanced and Expert world themes are implemented **for future levels** and available as **visual concepts** in the gallery. No Advanced/Expert gameplay tracks are being claimed or quietly unlocked.

## What changes when the player selects a new difficulty?

- The **full track ice** receives a substantially different gradient and fine texture treatment.
- The **outside landscape and interior island** display region-specific coloured lighting and scenery. Procedural details are always clipped to **actual non-playable land**, so they cannot look like random floating hazards on the route.
- The **exact snowbank polygon** remains the same, but its edge material takes on the region’s coloured rim and inner glow. No collision boundary, visual passing width, or road layout changes.
- The checkpoint beacons and UI panel/acceleration-pad accents adopt the region palette.
- The compact **in-board track selector** prominently displays the current region name (“SNOWBOUND”, “AURORA”, etc.) next to the track number, and option cards have **textual level labels** plus distinct coloured borders.
- Gameplay tutorial and braking advice are unchanged. All four assistance modes work in all regions.

## Implementation architecture

- \`src/biomes.mjs\` is the **single visual theme registry**. A track’s existing \`level\` property determines its \`beginner\`, \`intermediate\`, \`advanced\` or \`expert\` biome. This is pure presentation data; there are **no physics settings** in the registry.
- \`src/biome-scenery.mjs\` contains original vector/canvas-painted aurora ribbons, crystals, basalt, lava fissures, eclipse disc, gold monoliths and region beacons. **No new image assets or external downloads** are needed; original reusable textures remain available.
- \`src/race-art-v10.mjs\` is an isolated fork of the V9 art renderer that fills *the exact same collision polygons* with tier-specific materials, carefully clipping all decorative props to exterior land or the central island. The static art cache invalidates on track **or biome** changes.
- \`race-v10.html\` + \`src/race-v10.mjs\` + \`styles/biome-ui.css\` contain the latest game. One existing selector and race cockpit are restyled; no new rows, floating hints, full-screen menus or physics rules.
- \`theme-gallery.html\` + \`src/biome-gallery.mjs\` + \`styles/biome-gallery.css\` are a **four-way visual comparison**. It draws the **same training circuit geometry** under four theme presets. This is a design gallery, not a playable track collection.
- Prior \`race-v9.html\` / \`src/race-v9.mjs\` / \`src/race-art.mjs\` are retained without modification to preserve a real visual A/B reference.

## Future-track recipe

1. Make a circuit geometry under \`src/circuit.mjs\`, ensuring exact legal line segments, car-width clearance and a complete QA-only lap.
2. Give its \`level\` an explicit value such as \`'ADVANCED 1'\` or \`'EXPERT 1'\`. Its world region is selected automatically by \`biomeForCircuit\`.
3. Add the track to the registry/menu and ensure local personal bests remain independent.
4. If introducing new physics (wind, low grip, etc.), do so **separately** with explicit rules in engine/coaching/QA; never allow it to leak in via the artwork.
5. Re-run nine exact viewport sizes and full Master-mode browser lap. Review the game’s actual screenshot for car/road readability, overlays, and absence of decorative objects inside the ice road.
6. Compare the region in the gallery against its neighbouring tiers. It should be obviously different without relying on red–green distinctions alone.

## Required quality checks

- [ ] Four biome palettes have **unique road and land colours**, not just different UI labels.
- [ ] Intermediate visibly changes on selecting Hairpin Hollow from a Beginner course, even without reloading.
- [ ] The text **“INTERMEDIATE 1”** and region **“AURORA”** remain visible; distinction is not colour-only.
- [ ] The exact physics polygons, car size, crash penalties, gates and movement vectors are **unchanged**.
- [ ] Decorative crystals/basalt/obelisk artwork and atmospheric lighting are always in off-road locations.
- [ ] On actual devices at 320×568 and 667×375, the map selector and controls still fit without scrolling.
- [ ] The full Hairpin Hollow lap completes in Master with all three gates and its own saved personal best.
- [ ] Gallery renders all four worlds using identical geometry, with distinct sampled road/exterior pixels.
- [ ] Original V9 and all prior game versions keep their appearance and behaviour.

## Links after the PR merges

- Latest game: \`https://chriswalker-afk.github.io/vectorrace/race-v10.html\`
- Play Aurora Vale (Intermediate 1): \`https://chriswalker-afk.github.io/vectorrace/race-v10.html?track=hairpin-hollow\`
- Compare all four environments: \`https://chriswalker-afk.github.io/vectorrace/theme-gallery.html\`

The **next track remains Twin Routes (Intermediate 2)**. It will naturally inherit Aurora Vale, while the first Advanced course (Glass Ice in the original roadmap) will automatically begin in Ember Rift. We should still review the new worlds’ palettes against future actual circuit geometries, not solely the representative gallery layout.
