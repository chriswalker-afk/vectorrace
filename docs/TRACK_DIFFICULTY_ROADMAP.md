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
| 09 | Icebound Rapids | Advanced 1 | Twin fixed boost strips and advance braking | **New +2 boost rule** — merged PR #17 |
| 10 | Broken Passage | Advanced 2 | Two moving slabs on a published six-step cycle | **Turn-indexed swept-hazard rule** — merged PR #18 |
| 11 | Frozen Gauntlet | Advanced 3 | Glass + crosswind, then timed boost + moving slab, return Glass Ice | **Four existing mechanics combined** — merged PR #19 |
| 12 | Arctic Grand Prix | Expert 1 | **Two continuous laps**, three timed sentinels, compound fields and forced boost | **Expert finale** — implemented in PR #20 (pending merge) |

For upcoming Track 04 onward, build from this checklist and commit a concise track-design note alongside the new geometry.

## Visual regions by difficulty (from Snowshift V10)

Each difficulty tier takes the player into a new cosmetic environment. Visual themes are separate from gameplay mechanics, with decorative scenery clipped to the non-drivable terrain. A track's existing `level` property automatically selects its region.

| Difficulty | Region | Identity | Availability |
|---|---|---|---|
| Beginner | **Snowbound Valley** | Blue ice, fresh snow, pines and cabins | Four playable circuits |
| Intermediate | **Aurora Vale** | Violet sky, cyan ice, glowing crystals and northern lights | Hairpin Hollow, Twin Routes, Glass Ice and Crosswind Ridge playable; Advanced tracks planned |
| Advanced | **Ember Rift** | Basalt cliffs, charcoal ice, amber banks and land fissures | Icebound Rapids and Broken Passage playable; Frozen Gauntlet (Advanced 3) implemented in PR #19 |
| Expert | **Eclipse Summit** | Black glass ice, gold markers, dark monoliths and eclipse halo | First Expert circuit Arctic Grand Prix, two-lap finale in PR #20 |

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

## Track 12 design note — Arctic Grand Prix

**Eclipse Summit / EXPERT 1** concludes the original twelve-track progression with a real two-lap championship. Unlike Track 11, the challenge now tests **sustained precision and adaptation** rather than one combination of familiar effects. There is no teleportation, no random weather and no newly invented movement rule: the northern coupled Glass+Wind field, west (-2,0) boost and return Glass Ice all use their established start-of-turn definitions; three moving sentinels share a published deterministic six-phase clock. The extra, smaller **eastern sentinel** uses full simultaneous swept collision, including the whole segment between safe-looking endpoints. Each lap must clear East, Return and West in order before crossing Finish. Finishing the first lap does **not** stop the skimmer or reset momentum, position, hazards, phase, score or crash count; the checkpoint sequence alone restarts.

The grand prix has a new serrated mountain outer bank, inward-set faceted island, and a westward-shifted finish line giving safe braking room before lap two. The custom Eclipse Summit region includes black-glass ice, gold lights, a gilded island emblem, gold-trimmed numbered moving sentinels and a dedicated Expert selection card. A **50-turn collision-free complete race** (28-turn first lap + 22-turn second lap) is verified from the actual start, covers all three genuinely moving hazard lanes, passes **six ordered checkpoint gates**, and engages Glass+Wind, boost and return glass on **both laps**. Exact whole-path bank margin **>=1.42** world units and moving obstacle hitbox clearance **>=0.45** world units. The exact solver independently completes another final lap **from the real lap-one state**, preserving velocity, phase and lap count. In-app Guided/Standard/Expert/Master help all disclose rock timing and known force vectors; Expert/Master still conceal future velocity predictions. The final one-screen menu contains **4 Beginner + 4 Intermediate + 3 Advanced + 1 Expert** entries. See [Track 12 maths and QA](PR20_ARCTIC_GRAND_PRIX.md). Classroom challenge playtesting remains recommended before release.

## Track 11 design note — Frozen Gauntlet

The first true **combined-rule track** uses only previously taught operations, with no new physics. A broad translucent upper **paired field** shares one exact polygon for both Glass Ice (one-axis selected acceleration) and Crosswind Ridge's southward wind (0,−1); the wind still acts when Glass Ice disables diagonals. A first moving basalt slab crosses the exit of that zone on its public six-turn rhythm. On the lower return a painted (−2,0) westward boost fires when a turn starts on the strip while a second moving basalt slab crosses the same path. A separate lower Glass Ice zone reinforces one-axis braking following the return boost. In every help mode, both rocks' present and next positions, their phase clock and all known surface forces remain visible. Expert and Master still hide next velocity/destination predictions.

The route has its own silhouette (widened Ember Rift basalt shelf and deep island notch). A 24-turn crash-free proof crosses the upper combined zone on turns 5–6, deliberately counteracts (0,−1) with allowed single-axis vectors, times the upper rock, activates the west boost on turn 14 while crossing lower moving basalt, and obeys return Glass Ice on turns 15–16. Whole-segment margin is **>=1.19 world units** to banks and **>=0.51 world units clear of the slab+skimmer combined hitbox**. Independent BFS finds a different completed 22-turn lap that also activates coupled rules, boost and return Glass Ice. See [Track 11 maths and QA](PR19_FROZEN_GAUNTLET.md). The last planned circuit is Arctic Grand Prix (Expert / Eclipse Summit).

## Track 10 design note — Broken Passage

Advanced 2 introduces exactly one new mechanic: **two deterministically oscillating basalt slabs**. They move along clearly marked copper rails and follow the same public **six-turn cycle**. A hazard changes its location only when the player attempts a GLIDE, whether successful or a crash; it moves linearly and simultaneously with the skimmer during that turn. The engine tests the closest distance over the **entire relative movement segment**, not merely from-position and landing-point collisions. The visible slab radius is 0.55 world units, and the skimmer clearance radius is 0.8; both the current solid slab and a dashed outline of its next position appear on the board. The HUD explicitly labels current → next phase in Guided, Standard, Expert and Master; Expert/Master still conceal next-velocity projections. On a moving obstacle crash, the player is returned to the nearest previously visited safe grid point only if remaining in place would cause an unavoidable following-turn strike. The existing static crash behaviour is unchanged.

A **24-turn, crash-free complete lap** navigates both actively moving passages and maintains at least **1.19 world units** of complete-segment clearance from banks and at least **0.5 world units of spare clearance** beyond the combined skimmer/slab hitbox. An independent BFS must find a real lap using the six-phase state key. Track 10 deliberately has **no boosts, wind or Glass Ice**: combined mechanics are reserved for Frozen Gauntlet. See [Track 10 mathematical design and release QA](PR18_BROKEN_PASSAGE.md). Student playtesting remains necessary.

## Track 09 design note — Icebound Rapids

Two copper boost strips add fixed signed horizontal vectors: (+2,0) northbound/eastbound and (-2,0) on the southern westbound return. The effect triggers when the skimmer STARTS a turn in the painted strip or on its boundary, never on mid-turn pass-through. Next velocity = previous velocity + chosen acceleration + boost vector; next position = previous position + next velocity. Because player acceleration magnitude is at most 1 per component, a +/-2 boost cannot be completely cancelled on its active turn. Students must brake *before* the marked strips. The two strips sit entirely on drivable ice and use exactly the same polygons for paint and physics. A 23-move full lap engages both boosts on turns 5 and 15 and has at least 1.2 world units of full-line clearance to either bank. The first eight tracks retain their existing physics and records. The new Advanced course inherits the Ember Rift palette and has its own asymmetric silhouette. See [Track 09 maths, geometry and release checks](PR17_ICEBOUND_RAPIDS.md). Classroom playtesting is still needed.

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
