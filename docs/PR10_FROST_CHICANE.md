# PR #10 — Track 03: Frost Chicane (Beginner 3)

## What students learn
**New skill:** Two closely spaced bends require changing the *lateral component of velocity twice* rather than accelerating through a long straight. The most useful question is not "which arrow points forward?" but "how much sideways velocity will remain at the second bend?"

**Reused skills:** Acceleration, stopping distance, continuous on-track line segments and ordered gates.

**Unchanged rules:** All four assistance modes use the same base physics, no rocks, wind, grip changes, boosts or timed hazards. Guided uses its existing true braking forecast; Expert and Master retain hidden predictions.

## Track construction
The entire double bend is part of the upper (northbound-on-canvas) racing straight immediately after the start/finish crossing. The outer snowbank noses **inward** near x=18.5–20, then the inner island's shoreline reaches **outward** near x=22–24. Players steer down toward y≈17, then promptly reverse lateral velocity to reach y≈20–21 before turning through the east gate. Both restrictions are joined to existing shoreline, rather than independent obstacles.

The track keeps the original starting grid coordinate (13,19) and gates in the order **East → South → West → Finish**. It shares the same 960×700 world view, 25px per world unit, exact collision checker and track artwork renderer. Artwork therefore exactly follows the same physics polygons.

### Gradual progression evidence
- Northern Loop and Aurora Split are previously proven introductory maps.
- Frost Chicane's minimum crash-free lap is **21 moves** in the deterministic point-collision solver, slightly above the earlier tracks' ~20 moves. This is not used to claim a player will be able to race it in 21 moves.
- A more forgiving **26-move** route has been prepared and validated using **real per-turn acceleration choices**, not teleportation. It makes meaningful direction changes through **both** chicane bends.
- Across the new x≈18–25 chicane region, the entire line segment of every move in that planned route stays **at least 1.2 world units from both snowbanks**. The extra 0.2 buffer beyond the 1.0-unit track design standard allows for the painted bank edging around the visible skimmer.
- The existing island and snowbanks on other portions of the course retain their previous forgiveness. Future student testing should determine whether students experience this as a small, manageable increase.

## Implementation
- `src/circuit.mjs`: exports `FROST_CHICANE` and registers it third, without altering the previous two courses.
- `race-v7.html`: adds a third map choice to the original on-track selector, preserving V6.
- `styles/map-selector-v7.css`: three stacked choices on portrait screens and three compact side-by-side choices on short landscape screens. All options remain clickable with no scroll.
- `src/race-v7.mjs`: existing game controller with a contextual chicane tip in the tutorial and updated version label. Track changes remain instant and independent personal bests are stored under `snowshift:frost-chicane:personal-best:v1`.
- `scripts/frost-chicane-qa-route.mjs`: 26-turn representative safe route used **only by automated tests**, never exposed to players.
- `scripts/track-clearance.mjs`: reusable exact segment-to-bank distance check (not just checking discrete points).
- `tests/frost-chicane.test.mjs`: regression tests for the two opposite bends, complete course, 1.2-unit artwork margin, old maps and unchanged physics.
- `src/ux-smoke-v7.mjs` / `scripts/viewport-smoke-v7.mjs`: verify all three map choices, all four modes, full browser-driven Master race and record isolation across nine screen sizes.
- `docs/TRACK_DIFFICULTY_ROADMAP.md`: permanent living track sequence and acceptance checklist for future tracks.

## Acceptance checklist
- [ ] No corridor requires a centreline to be too close to a snowbank for the visible skimmer.
- [ ] Full game and selector visible without scrolling at all nine agreed sizes.
- [ ] Full actual engine lap completes with the correct three gates.
- [ ] The 26-turn safer route deliberately steers between both bends with at least 1.2 world units of segment clearance.
- [ ] There is no bypass which makes the bends irrelevant.
- [ ] Guided, Standard, Expert and Master remain mathematically equivalent.
- [ ] Personal bests for Northern Loop, Aurora Split and Frost Chicane are separate.
- [ ] No previous track physics or visible map altered.

## Preview after merge
- All maps: `https://chriswalker-afk.github.io/vectorrace/race-v7.html`
- Track 03 direct: `https://chriswalker-afk.github.io/vectorrace/race-v7.html?track=frost-chicane`
- Track 02 previous: `https://chriswalker-afk.github.io/vectorrace/race-v6.html?track=aurora-split`

Next from the roadmap: **Track 04 — Narrow Passage** (one short, genuinely skimmer-wide bottleneck). No new environmental physics should be introduced yet.
