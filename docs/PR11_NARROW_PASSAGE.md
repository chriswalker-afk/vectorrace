# PR #11 — Track 04: Narrow Passage (Beginner 4)

## Learning goal
**New challenge: maintain a careful racing line through one short narrow corridor.** The skimmer must manage its sideways displacement as well as its velocity; a line that was safe on Frost Chicane can now hit the enlarged island bank. The previous paired-chicane bends remain, so students consolidate earlier acceleration/braking skills.

The course does **not** introduce new rules. It retains the existing 3×3 `−1,0,1` acceleration pad, column-vector notation, exact continuous motion and collision checker, and the three ordered checkpoint gates. No rocks, wind, friction, boosts or moving objects have been added.

## Geometry and fairness
Frost Chicane's upper double bend is reused. On the **southern straight** the central island shoreline briefly projects toward the outer edge, between world x ≈ 14.8 and 18.2. Tapers on both sides make the restriction easy to see.

| Geometry measurement | Value |
|---|---:|
| Outside southern bank | y = 3 |
| Inside island edge at the pinch | y = 6.2 |
| Shortest corridor width | **3.2 world units** (80 px in design coordinates) |
| Width of illustrated skimmer | **1.6 world units** (40 px) |
| Allowance beyond half the skimmer width | **0.2 world units per side minimum** |
| Test centreline | y = 5 |
| Centreline clearance to the inside bank | **at least 1.2 world units** |
| Centreline clearance to the outside bank | **2 world units** |
| Length of the narrowest section | about **3.4 world units** |

The previous vehicle-clearance approval criterion from PR #9 remains **1.0 world unit** from the skimmer's centre to each boundary (0.8-unit half width + 0.2 unit buffer). The QA route is designed to exceed that, rather than to touch either snowbank.

The South checkpoint's visible gate is shortened to match the true 3.2-unit corridor at x=16; the checkered mark never projects across the island. The snowbank shape and collision geometry come from the **same polygon**.

## Difficulty placement
Compared with Track 03, a higher passing line at (16,7) was legal but is now blocked by the island. Controlled lines near y=5 remain playable; there is no wall across the track or single-pixel gap. Players must reach the narrow straight with manageable velocity and avoid drifting outward.

The test suite verifies:
1. All four tracks remain in order and the original three are unchanged.
2. The entire 3.4-unit throat meets visual skimmer-width safety checks; a real **movement segment**, not just endpoints, stays clear.
3. A legal racing trajectory completes a full lap through the actual engine and checkpoints without crashes.
4. A separate exact shortest-route solver confirms that a complete lap is possible with a gradual increase in challenge.
5. V8 browser integration plays the full lap with **Master column-vector controls**, saves a map-specific personal best and checks all four map choices and 9 device sizes.
6. The Narrow Passage tutorial provides a succinct braking/line-positioning hint, without exposing previews in Expert or Master.

Tests: `tests/narrow-passage.test.mjs`, `scripts/narrow-passage-qa-route.mjs`, `scripts/track-clearance.mjs`, `src/ux-smoke-v8.mjs`, `scripts/viewport-smoke-v8.mjs`.

## Review
- PR branch: `race-v8.html?track=narrow-passage`
- After merge and GitHub Pages deployment: `https://chriswalker-afk.github.io/vectorrace/race-v8.html?track=narrow-passage`
- Previous V7 game remains available as a baseline.

Look closely at the southern straight. It should look narrow **but clearly wider than the car**, and it should be obvious that this is one short deliberate challenge—not an unfair obstruction.

## Next track in the roadmap
Track 05 — **Hairpin Hollow, Intermediate 1**: a single tight corner after a long straight. That is a future planned design, not included in this PR.
