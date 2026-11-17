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
| 04 | Narrow Passage | Beginner 4 | Short 3.2-unit-wide bottleneck; maintain a precise centreline | Base physics — implemented |
| 05 | Hairpin Hollow | Intermediate 1 | Long straight, then a genuine 180° east hairpin requiring horizontal velocity reversal | Base physics — implemented |
| 06 | Twin Routes | Intermediate 2 | Choose between a tight inner shortcut and a wider outer detour | Base physics — **this PR** |
| 07 | Glass Ice | Intermediate 3 | Marked ice permits changing at most one velocity component per turn | **New deterministic zone rule — this PR** |
| 08 | Crosswind Ridge | Intermediate 4 | Counter a known southward wind vector (0,−1) in one marked field | **Deterministic external force — this PR** |
| 09 | Icebound Rapids | Advanced 1 | Predictable boost strips and braking choices | **New boost rule** — planned |
| 10 | Broken Passage | Advanced 2 | Moving obstacles on deterministic turn cycles | **Turn-indexed hazard rule** — planned |
| 11 | Frozen Gauntlet | Advanced 3 | Combination of previously taught mechanics | Existing extended rules — planned |
| 12 | Arctic Grand Prix | Expert Track | Longer multistage final challenge | Existing extended rules — planned |

For upcoming Track 04 onward, build from this checklist and commit a concise track-design note alongside the new geometry.

## Visual regions by difficulty (from Snowshift V10)

Each difficulty tier takes the player into a new cosmetic environment. Visual themes are separate from gameplay mechanics, with decorative scenery clipped to the non-drivable terrain. A track's existing `level` property automatically selects its region.

| Difficulty | Region | Identity | Availability |
|---|---|---|---|
| Beginner | **Snowbound Valley** | Blue ice, fresh snow, pines and cabins | Four playable circuits |
| Intermediate | **Aurora Vale** | Violet sky, cyan ice, glowing crystals and northern lights | Hairpin Hollow, Twin Routes, Glass Ice and Crosswind Ridge playable; Advanced tracks planned |
| Advanced | **Ember Rift** | Basalt cliffs, charcoal ice, amber banks and land fissures | Visual style ready; no playable Advanced track yet |
| Expert | **Eclipse Summit** | Black glass ice, gold markers, dark monoliths and eclipse halo | Visual style ready; no playable Expert track yet |

Every future track must match the region's look, retain the exact physics-to-art shoreline, and preserve readable skimmer, gates and vectors. The region name and difficulty tier must appear in text, not colour alone. The V9 build remains an unmodified visual baseline; `theme-gallery.html` shows all four regions using identical sample geometry. See [Difficulty Region Art Standards](PR13_DIFFICULTY_REGIONS.md).

## Physics and classroom clarity
- Base mechanics remain `v_next = v_current + a`, then `position_next = position + v_next`, with `a_x, a_y` each in `{-1,0,+1}`.
- From speed `n` in one component, maximum componentwise braking yields displacement `n(n-1)/2` before reaching rest. Design corners around this stopping distance; students should be able to reason about it.
- **Never call a normal frictionless region "slippery" without a real rule difference.** Glass Ice implements a marked start-of-turn one-axis acceleration rule, fully supported by tutorial, UI, exact braking forecast and solver.
- **Wind** now adds a known constant vector on a marked road: `v_next = v_current + a + w`. Crosswind Ridge uses exactly `w=(0,−1)`, active when the skimmer starts a turn inside the painted polygon, including its boundary. Guided projections use the same calculation; Expert/Master show the known field but do not reveal hidden destinations.
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

## Track 08 design note — Crosswind Ridge

One large, precisely marked **southward wind field** on the eastbound Aurora Vale ridge (x=17–26; y=18.65–24.2) introduces our first external acceleration. The same **nine** choice vectors remain available: while inside the marked patch at the **start of a turn**, apply \(\mathbf v'=\mathbf v+\mathbf a+(0,-1)\), then \(\mathbf p'=\mathbf p+\mathbf v'\). Outside the patch, wind is zero.

A student coasting east with velocity (3,0) is pushed to next velocity (3,−1); selecting \(a_y=+1\) counteracts the wind and preserves (3,0). **No random gusts** and no extra acceleration limits are introduced. A tested **24-turn, crash-free lap** uses three consecutive counterwind decisions and maintains **≥1.1 world units** of full-motion centre-to-bank clearance. Wind artwork includes downward arrows, a boundary derived from the exact physics zone, and a labelled wind vector. Guided braking forecasts account for the force, and all earlier seven circuits remain wind-free. See [Track 08 mathematical design and QA](PR16_CROSSWIND_RIDGE.md).

## Track 07 design note — Glass Ice

A single clearly marked **turquoise Glass Ice** patch on the northern approach to the hairpin (x=17–26; y=18.6–22.2) introduces the first new physics rule: **when the skimmer starts a turn in the painted patch (including its boundary), only an acceleration with at most one nonzero component is available**. Players retain five vectors: horizontal braking/acceleration, vertical braking/acceleration, or zero. The four diagonal choices are visibly disabled, and attempts do not consume turns or cause crashes.

The vector formulas `v_next=v+a` and `p_next=p+v_next` remain unchanged. Only the *allowed* accelerations change, so simultaneous x/y braking that worked on normal ice now requires at least two turns. Guided forecasts calculate an actual legal stopping path and all modes show the rule. The glass patch is fully legal roadway, painted with a translucent crystalline surface exactly matching the zone polygon. A representative **24-move crash-free lap** begins with 3 restricted turns and maintains at least **1.0 world unit of entire-movement-segment clearance** for the visible vehicle. See [Track 07 design and release checks](PR15_GLASS_ICE.md).

## Track 06 design note — Twin Routes

A long **solid glacier divider** (roughly x=13.6–22.6) in the eastbound upper straight introduces one intentional route-choice problem. The INNER shortcut runs near y=17 in a ~2.9-unit corridor, while the OUTER detour runs near y=23–24 through a ~4.4-unit corridor. Both fully reconnect before the East gate. They are not two equally wide lanes around a tiny rock as in Beginner 2.

- A tested **23-turn inner lap** drives approximately **70.0 world units** with at least **1.0 unit** of full-segment centre-to-boundary clearance for the 1.6-unit illustrated skimmer.
- A tested **24-turn outer lap** drives approximately **76.3 world units** with at least **1.4 units** of clearance. These are representative real acceleration-only routes, *not claims about an absolute theoretical best*.
- The interior is **truly non-playable polygon land** with a clipped Aurora crystal spine, never a broad graphic obscuring otherwise legal road. Full-segment collision prevents jumping across it.
- The game still uses exactly the same 3×3 accelerations, ordered gates and score formula. Track 06 automatically inherits **Aurora Vale** from its `INTERMEDIATE 2` label.
- Students should be able to see two genuinely different choices and understand the space/speed tradeoff without requiring pixel-perfect manoeuvres. The exact visual safety rules and the two tested laps are documented in [Track 06 acceptance](PR14_TWIN_ROUTES.md).

## Track 05 design note — Hairpin Hollow

This is the first Intermediate circuit. A long upper straight leads into an eastern **180° U-turn** and a separate westbound lower return lane. The primary learning goal is to brake a positive horizontal velocity to zero and accelerate in the opposite direction while keeping to a roughly 4-unit-wide turn corridor. At the nose the central island ends around x=26, and the outer shoreline is near x=30. East (downward), South/Return (westward), and West (northward) gates ensure the player actually enters and exits the hairpin rather than bypassing it. A 25-turn QA lap maintains **more than 1.2 world units** of full-segment clearance with no special mechanics. See [Track 05 design and verification](PR12_HAIRPIN_HOLLOW.md).

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
