# Snowshift — Track Difficulty Roadmap & Release Standard
**Status:** living design contract · Updated November 2026 · First version committed with Track 03 (PR #10)

## Principle: One new problem at a time
The game teaches vector acceleration, velocity and planning. Its four **assistance modes** (Guided, Standard, Expert, Master) change information and input presentation, **not the track physics**. Track difficulty is separate. Track layouts should introduce one main skill and reuse previously learned ones, rather than growing randomly longer or more punishing.

## Difficulty-factor checklist (0–3 per dimension)
Record scores in the track design brief; scores are **not** a single definitive difficulty number. 0 = absent/forgiving, 1 = mild, 2 = significant, 3 = demanding. Compare to the immediately preceding track and justify each increase.

| Dimension | 0: none/forgiving | 1: introduced | 2: substantial | 3: demanding |
|---|---|---|---|---|
| Length / turn budget | Short lap | Slightly longer | Longer sustained run | Endurance / multiple laps |
| Corridor width | Broad and forgiving | Local pinch | Regular tight sections | Sustained narrow passage |
| Number of direction changes | Wide sweeping loop | One local deviation | Several bends | Many continuous bends |
| Sharpness | Sweeping | Moderate corner | Tight 90° | Hairpin/reversal |
| Bend spacing | Time to recover speed | Two moderately close | Paired chicane | Linked multi-corner chain |
| Straight-to-corner braking | Naturally slow | Mild acceleration approach | Fast straight into bend | Very late demanding braking |
| Diagonal geometry | Axis-aligned | Single diagonal | Mixed axes | Repeated off-axis channels |
| Obstacles (count, placement, size) | None | Small off-centre object | Several central hazards | Narrow slalom under pressure |
| Route choice / risk-reward | One clear route | Two safe lanes | Shortcut vs longer line | Repeated strategic splits |
| Gate precision | Wide obvious gates | Unusual approach | Gates near bends | Tight multi-gate alignment |
| Starting velocity | Rest in clear space | Directional initial speed | Challenging momentum | High initial speed near bend |
| Low-grip / limited braking | Not present | Short marked patch | Multiple interacting patches | Sustained reduced control |
| Wind / current | None | One constant vector | Multiple marked zones | Changing known vectors |
| Boost / forced acceleration | None | One visible strip | Several boosts | Boosts near precise corners |
| Coasting / restricted acceleration | None | One short segment | Several sections | Long skill-test section |
| Moving obstacles | Static only | Slow, predictable position cycle | Two moving hazards | Multiple timed interactions |
| Extra objectives | Ordered checkpoints | Bonus/alternate checkpoint | Target score challenge | Complex optional goals |

A long course is **not necessarily harder**. The primary experience should measure decisions, braking and safe lines, not merely lap duration.

## Proposed track sequence
The table is a roadmap, not a claim that future tracks exist.

| # | Track | Difficulty | New core skill | Physics |
|---|---|---|---|---|
| 01 | Northern Loop | Beginner 1 | Basic vector acceleration and braking | Base physics — implemented |
| 02 | Aurora Split | Beginner 2 | Visible, small central rock and route choice | Base physics — implemented |
| 03 | Frost Chicane | Beginner 3 | **Two closely spaced bends; reverse lateral velocity before the second** | Base physics — **this PR** |
| 04 | Narrow Passage | Beginner 4 | Short 3.2-unit-wide bottleneck; maintain a precise centreline | Base physics — **this PR** |
| 05 | Hairpin Hollow | Intermediate 1 | Sharp turn after a long straight | Base physics — planned |
| 06 | Twin Routes | Intermediate 2 | Risky shortcut vs longer safe racing line | Base physics — planned |
| 07 | Glass Ice | Intermediate 3 | One low-grip zone with an explicit braking rule | **New deterministic zone rule** — planned |
| 08 | Crosswind Ridge | Intermediate 4 | One marked constant wind vector | **New wind-vector rule** — planned |
| 09 | Icebound Rapids | Advanced 1 | Predictable boost strips and braking choices | **New boost rule** — planned |
| 10 | Broken Passage | Advanced 2 | Moving obstacles on deterministic turn cycles | **Turn-indexed hazard rule** — planned |
| 11 | Frozen Gauntlet | Advanced 3 | Combination of previously taught mechanics | Existing extended rules — planned |
| 12 | Arctic Grand Prix | Expert Track | Longer multistage final challenge | Existing extended rules — planned |

For upcoming Track 04 onward, build from this checklist and commit a concise track-design note alongside the new geometry.

## Physics and classroom clarity
- Base mechanics remain `v_next = v_current + a`, then `position_next = position + v_next`, with `a_x, a_y` each in `{-1,0,+1}`.
- From speed `n` in one component, maximum componentwise braking yields displacement `n(n-1)/2` before reaching rest. Design corners around this stopping distance; students should be able to reason about it.
- **Never call a normal frictionless region "slippery" without a real rule difference.** Proposed Glass Ice rule: marked ice limits changing at most one velocity component in a turn. Requires explicit tutorial, exact solver and collision implementation.
- **Wind** is a clearly labelled vector added to acceleration in marked zones: `v_next = v_current + a + w`. Define trigger consistently (recommend zone under skimmer at start of a turn) and show it in Guided/Standard without leaking Expert/Master hidden information.
- **Boost strips** and **coasting zones** also need explicit turn timing, clearly marked boundaries and preview/solver support before release.
- For moving hazards, publish the cycle and turn index; never make success depend on unpredictable randomness.
- New mechanics **must not silently change earlier maps**. Track-specific data and versioned physics flags should be explicit.

## Visual, clearance & usability acceptance
- An obstacle is not fair simply because a point can squeeze past it. The skimmer is visually 40 px wide on the 25-px/unit world: **0.8-unit half-width**. Require at least **0.2-unit additional buffer per side** (centre-to-bank minimum >= **1.0 world unit**), preferably more on Beginner tracks.
- Audit whole passable stretches, not one point. Prove turns can be made with **real acceleration sequences from the actual start**.
- Draw artwork from **the same polygons** that are used for the full-line-segment collision check. Decorative glows, thick strokes and sprites must not falsely block the road. Avoid confusing words printed on the track.
- The complete race, all controls, all mode choices and any track picker must remain **visible on one screen** (no scrolling), including 320×568 portrait and 667×375 landscape. New maps cannot be signed off without the nine-viewport browser suite.
- Confirm that both the direction and **width of the visually available corridor** match the playable corridor, especially at chicanes.
- Save personal best and ghost **per map**, preserving previous local records when adding maps.
- All four modes must obey the same geometry and physics. Master shows proper **column vectors**, Expert hides next moves, and Guided gives truthful advice.

## Minimum release gates for every map
- [ ] Track design brief lists primary skill, previous skill and deliberate 0–3 factor changes.
- [ ] Obstacles (if any) pass visual vehicle-width clearance checks (>=1.0-unit centre margin).
- [ ] At least one complete **crash-free full lap** exists under actual continuous collision and checkpoint rules.
- [ ] A representative real legal sequence uses the **intended new challenge** (not a bypass).
- [ ] The solver's route is checked for corner/obstacle clearance where appropriate, not just point collision.
- [ ] New hazards are visibly distinct, deterministic, and have appropriate explanations.
- [ ] No changes to old courses' collisions, starts, scores or record keys.
- [ ] Browser drives a full lap through the rendered buttons; works with all four assistance modes.
- [ ] Nine exact device viewport checks pass; course and controls remain on one screen.
- [ ] Student playtesting records median attempts/score, completion rate, common collision locations and perceived fairness; adjust after feedback.

## Empirical difficulty evidence
Track each map's minimum crash-free moves; average or median player score (turns + crash penalties); completion rate; number of crashes and where; and whether the key challenge is actually encountered. A one-move theoretical difference is **not** proof of good progression. Prefer multiple forgiving solutions before exact shortest route optimization.

## Track 04 design note — Narrow Passage

This course reuses Frost Chicane's consecutive bends, but adds **one short 3.2-unit-wide constriction** in the southern straight. The island reaches toward the outside bank for roughly 3.4 world units, with sloped approaches. At the centreline y=5 the skimmer retains >=1.2 units to the island and >=2 units to the outside bank, exceeding the existing 1.0-unit production minimum. The route should remain a manageable increase from Beginner 3. The racing challenge is precision through a **single clearly visible bottleneck**, not a new physics effect or a gratuitously long narrow road.

The previous full-lap route is intentionally reused as a *quality control trajectory*: a line that was forgiving on Track 03 becomes more constrained on Track 04. Tests verify both full-segment clearance and that a higher, previously legal line is now blocked. Student playtesting is still required to establish perceived difficulty. See [Track 04 acceptance](PR11_NARROW_PASSAGE.md).

## When designing Track 03 specifically
- Teach **successive changes of lateral velocity**, ideally one bend followed soon by a bend in the opposite direction.
- Use **geometry only**: no rocks, wind, grip changes, boosts or moving hazards.
- Keep the corridor sufficiently wide for the skimmer visual and forgiving intermediate grid destinations.
- Preserve the start, East → South → West → Finish order and the nine standard accelerations.
- Test an end-to-end solution and at least one chicane-crossing manoeuvre that intentionally adjusts velocity in both directions.
- Keep the layout and track selection within the existing single-screen V6/V7 cockpit.

Related: [Vehicle clearance](PR9_ROCK_CLEARANCE.md), [two-circuit prototype](PR8_TWO_CIRCUITS.md), [Master-mode constraints](PR7_MASTER_MODE.md).
