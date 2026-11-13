# PR #12 — Track 05: Hairpin Hollow (Intermediate 1)

## Learning goal: brake BEFORE a true 180° turnaround
The first Intermediate track introduces **a sharp hairpin after a long, tempting straight**. Players build eastbound speed on the upper lane, reach the far-eastern turn, **slow the horizontal component of velocity to zero**, and then accelerate west along a separate return lane.

There is **no automatic friction**: players have to plan their horizontal braking and control their vertical component at the same time. This is a genuine change in direction, rather than merely another sharp 90° corner. The western end is deliberately broad and forgiving so that the eastern hairpin remains the single new challenge.

A representative, tested manoeuvre on the approach uses velocities with horizontal component:

`+1, +2, +2, +3, +4, +3, +2, +1, 0, -1, -2, -3, -4`.

The maths is the same familiar `v_next = v + a` and `p_next = p + v_next`, with each acceleration component in `{-1,0,+1}`.

## Visual geometry & safety
- Long straight: x approximately 10 through 24 on the upper track, y≈20.
- Eastern hairpin: outermost shore x≈30, inner island tip x≈26 around y≈17. This creates a **4-world-unit** passage around the nose, with visible room for the full car.
- Return straight: head west along a separate lane around y≈12, without crossing the island.
- Western end: wider, more forgiving sweep around x≈4–7.
- Start grid: (10,20), at rest, with a complete upper straight ahead.
- Three ordered gates remain: **East** (downward as the car rounds the tip) → **South/Return** (westbound along the lower lane) → **West** (northbound around the broad sweep) → Finish (eastbound).
- The island polygons and outside banks are the *same* geometry used for the line-segment collision tests and textured track rendering. No separate rock, wind, boost or new friction rules.

## Verified representative route
The QA-only `scripts/hairpin-hollow-qa-route.mjs` contains a **25-turn, zero-crash completed lap**. Its position and full moving line segments keep **at least 1.2 world units** away from both track boundaries (more than the 0.8-unit visual half-width of the skimmer plus the 0.2-unit minimum buffer). The route reaches horizontal speed +4, brakes across the U-turn to zero, reaches -4 heading west, and passes all three gates.

The exact shortest-lap solver independently confirms basic mathematical solvability. **Shortest lap length alone is not a difficulty measure**; this course is judged by how much early braking, velocity reversal and line selection it requires. Student feedback should determine if the Intermediate transition is appropriate.

## What ships
- `src/circuit.mjs` registers `HAIRPIN_HOLLOW` in fifth place; older tracks are unchanged.
- `race-v9.html` is the five-track race build. It retains all four help modes and the game on a single screen.
- `styles/map-selector-v9.css` fits the fifth card, including a **3×2 layout for the smallest portrait and landscape devices**.
- `src/race-v9.mjs` adds contextual help for the long straight and hairpin, but does not change physics.
- `tests/hairpin-hollow.test.mjs` verifies the upper and lower paths are distinct, the mandatory East gate crossing, the exact 180° vx reversal, full segment clearance and a completed legal lap.
- `src/ux-smoke-v9.mjs` / `scripts/viewport-smoke-v9.mjs` check all five map selections, all nine viewports and a full Master-mode lap with independent records.

## Acceptance
- [ ] Hairpin causes a real +vx → 0 → −vx reversal.
- [ ] No visible car clipping at the outer or inner snowbank on the full QA lap.
- [ ] No illegal jumps from the upper to lower lane through the island.
- [ ] New East/Return/West gates each lie on actual road, and follow direction of travel.
- [ ] Previous four maps, personal-best keys, and four modes retain their behaviour.
- [ ] Five track options are readable without scrolling, including 320×568 and 667×375.
- [ ] Full lap passes in browser in Master mode; all nine screen QA checks pass.

## Preview after merging
`https://chriswalker-afk.github.io/vectorrace/race-v9.html?track=hairpin-hollow`

The next planned track is **Track 06 — Twin Routes (Intermediate 2)**: an optional risky shortcut versus a safer longer line. No new physics is required.
