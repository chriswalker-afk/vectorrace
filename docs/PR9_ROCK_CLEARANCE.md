# PR #9 — Aurora Split: a rock with room to race

## What went wrong

The first obstacle took up much of the 5–6-unit-wide racing corridor. Although the **physics centre point** could pass in a narrow lane, the **72×40 pixel skimmer artwork** occupied more room than the legal corridor appeared to allow. The giant snowbank strokes further exaggerated the hazard, and the word *FLOE* was unnecessary and confusing.

This update corrects the **geometry and its visible presentation**, not just the collision tests.

## What changed

- The obstacle is now a **small snow-covered rock** (approximately 1.55 × 1.04 world units). The old roughly 2.90 × 2.75 unit polygon is retired.
- The island's northern top is moved from y=17 to y=15.7 around the rock, widening the passing corridor while retaining Aurora Split's dogleg and checkpoints.
- Two deliberate, safe centreline lanes exist at **y=17 (below)** and **y=21 (above)**, for x=18 through 24. They have at least **one world unit of clearance on every side** near the rock.
- The actual skimmer width is 40px at 25px/unit = **1.6 units**. We require a **0.2-unit buffer on each side** beyond half-width, giving a 1.0-unit minimum centreline clearance to every bank and the obstacle.
- Both lanes can be reached via **five real acceleration moves** from the normal start, not just via a hand-placed car or a straight-line geometric simulation.
- Collision detection still uses the exact polygon of the small rock. A straight glide through it crashes.
- The graphic is scaled to the physical polygon with thin local edging. The previous oversized 90×65px rock stamp and 19–32px snowbank strokes are removed from the obstacle.
- There is **no label printed on the rock**. The course picker uses ordinary language: “SMALL ROCK · TWO ROUTES”.
- Northern Loop and the four difficulty modes are unchanged.

## Track-design rule for future obstacles

1. **Never approve an obstacle solely because a point can move past it.** Account for the vehicle's displayed width and provide a visible margin.
2. **Audit both sides** of any central obstacle using edge-to-centre distances across the whole passing section, not one attractive screenshot or point.
3. **Play a real manoeuvre through each side** using the allowed acceleration vectors. Passing a static line test is not enough.
4. **Match artwork exactly to the collision geometry.** Do not use decorative glows, labels or broad edging that make a hazard look larger than its physical polygon.
5. **Keep early tracks forgiving.** Beginner 2 should not require boundary grazing or precise one-pixel positioning.
6. **Retain a full-lap solution** through the actual engine, with no crashes.
7. **Check all screen sizes**: the obstacle must remain clear and distinguishable when scaled down to a phone-sized board.

The reusable QA helper is `scripts/track-clearance.mjs`. New tests are in `tests/obstacle-clearance.test.mjs`. Full-map tests and actual-device-browser checks also continue to run.

## Review

When PR #9 merges, open:

`https://chriswalker-afk.github.io/vectorrace/race-v6.html?track=aurora-split`

Choose either route around the small rock. Both should feel comfortably driveable, and neither should require scraping the illustrated skimmer against a snowbank.

The existing race engine still uses a mathematical point for collision. The clearance audit is a production-art acceptance rule; upgrading the simulation to a complete car-shaped hitbox would be a separate design decision for a more advanced physics pass.
