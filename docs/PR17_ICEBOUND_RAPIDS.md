# PR #17 — Track 09: Icebound Rapids (Advanced 1)

## Learning goal and environment
The first playable Advanced track opens **Ember Rift**, using charcoal ice, basalt shores, amber fissures and copper light. Its new problem is **forced acceleration that cannot be cancelled immediately**. The earlier braking, momentum, turning and ordered-checkpoint skills all remain relevant.

## Exact deterministic physics
Two copper strips add a fixed known horizontal boost to a move **starting inside their polygons, including the boundary**. Passing over a strip without beginning a turn there does not trigger it. A move leaving the pad still receives the boost if it began there.

| Strip | Extra velocity | Polygon footprint | Why it matters |
| --- | --- | --- | --- |
| East Rapids | (+2,0) | x=15.5..19.5, y=18.8..24.1 | Regulate speed before the eastern hairpin |
| West Rapids | (-2,0) | x=13.5..17.5, y=8.8..11.3 | Anticipate westward surge before the western sweep |

On each turn, next velocity is old velocity + chosen acceleration + boost, and the next position is old position + next velocity. Off a strip, boost=(0,0). Acceleration choices retain x and y components in {-1,0,+1}. A signed boost of magnitude 2 cannot be completely cancelled in one turn: choosing the opposing acceleration leaves at least +1 or -1 net force in that component. Every new pad is legal road; the SAME exact polygons supply rendering and trigger logic.

Example east: v=(3,0), a=(-1,0), boost=(+2,0) gives new velocity (4,0), not (2,0). Example west: v=(-3,0), a=(+1,-1), boost=(-2,0) gives new velocity (-4,-1), still accelerating west.

## Geometry and fairness
- Course ID: icebound-rapids; displayed as ARCTIC SERIES / CIRCUIT 09, ADVANCED 1.
- Start (9,21), rest, ordered East / South / West / Finish, crash penalty +3.
- Its asymmetrical north shelf, jagged basalt boundary and extended return are different from the Intermediate layouts.
- The northern boost and southern return boost use separate polygons, both wholly on the legal ice corridor. Soft dashed outlines and gold chevrons show where and in which direction the effect applies.
- The QA-only acceleration fixture has **23 moves**, without crashes. It uses East Rapids on turn 5 and West Rapids on turn 15, then crosses all ordered checkpoints.
- Exact entire-movement centreline clearance is at least **1.2 world units** from the outer bank and island; the illustrated skimmer half-width is 0.8 with a 0.2 recommended buffer.
- A second independent BFS solver must find a full lap without using the route fixture; 23 moves is not claimed to be the absolute shortest.

## Student-facing behaviour
- The nine-option acceleration pad stays enabled in every help mode; Glass Ice is the only circuit with a five-vector restriction.
- The known fixed +2 or -2 pad is shown in the cockpit and on the racing surface. Expert and Master hide next-velocity prediction, not the rules of the course.
- Guided braking uses the exact engine with wind and boost. The forecast must not claim a stationary result if a forced +2 pad still moves the player.
- The tutorial explicitly explains why pre-emptive braking is needed.
- The map selector shows nine tracks in a 3x3 responsive grid, with Icebound Rapids clearly marked **ADVANCED 1** in Ember Rift.
- Previous eight tracks, preview URLs, records and core physics are unchanged except for the additive opt-in boost branch.

## Release QA
- [x] Track data, deterministic boost rule and original Ember Rift visuals added.
- [x] Full-lap reference sequence constructed with two pad activations and >=1.2 path clearance in an independent geometry model.
- [x] New engine tests for start-of-turn timing, both vector signs, old-track isolation, real safety margin, BFS solvability and Guided braking.
- [x] New nine-track browser QA script for all original nine CSS viewports, open-menu screenshots, actual Master-mode full lap, both boost directions and older Crosswind behaviour.
- [ ] GitHub Actions Node tests and all viewport checks must pass.
- [ ] Review captured screenshots for pad readability and any overlapping controls.
- [ ] Student classroom playtest: note crashes, successful completion rate and perceived fairness.

Do not merge this PR until automated release checks pass. The original V13 eight-track page stays available for comparison.
