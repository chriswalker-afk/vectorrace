# PR #19 — Frozen Gauntlet (Advanced 3 / Ember Rift)

## Learning intention
Frozen Gauntlet is a **combined-skills circuit** and adds no new laws of motion.
It follows Track 10, Broken Passage, and leads towards the twelve-track final
**Arctic Grand Prix / Eclipse Summit**. Students must select sensible braking
and acceleration vectors when two known effects operate simultaneously.

The physical model is unchanged: on every legal move choose a=(a_x,a_y),
a_x,a_y in {-1,0,+1}. On Glass Ice, only one component of a may be nonzero.
Wind w and boost b are added from the skimmer's position **at the start of
the turn**, including painted boundaries:

  v_next = v_current + a + w + b;    p_next = p_current + v_next.

A hazard slab moves once on **every attempted GLIDE**, even if the player
crashes; illegal Glass Ice diagonal input consumes no turn. Slabs move
linearly with the skimmer, and collision is based on closest simultaneous
approach, not just endpoints. Neither wind nor boost change rock speed.
The current phase, next centre and signed rules are always public even in
Master; only predicted movement is suppressed there.

## Distinct mechanical stages

| Stage | Where | Already learned | The new decision |
|---|---|---|---|
| Upper coupled field | x=12.6..21.6, y=18.9..23.8 | Glass Ice + (0,-1) Crosswind | One-axis acceleration must ALSO counter the wind |
| Upper rock crossing | x=20.5, y=19.7..22.8 | Six-step moving basalt | Stay clear across the full interpolated sweep after leaving Glass+Wind |
| Lower return boost | x=20.9..24.2, y=8.8..12.4 | Fixed (-2,0) boost + moving basalt | Brake before boost and time the approaching rock at x=18 |
| Homeward Glass Ice | x=12.8..18.6, y=7.95..12 | Glass Ice | Limit turning while still carrying boosted westward momentum |

Both northern Glass Ice and Crosswind use **identical source-of-truth
polygons**. Their combined artwork shows faceted ice and unmistakable
southward force arrows in one translucent shape labelled "GLASS + WIND".
Two individual overprinted boundaries or competing labels would be
misleading; the renderer draws only one combined footprint.

The West Boost is shown by a clear (−2,0) signed arrow and copper strip.
Filled numbered rocks mean NOW; dashed circles mean NEXT; dotted rails
show the entire six-turn movement cycle. They are NOT walls or extra rocks.

## Worked examples of simultaneous rules

At (15,21), velocity (3,1), glass+wind are active. The student chooses
a=(0,+1) (allowed on one-axis Glass Ice). The known wind is (0,−1).
The new velocity is (3,1), and the landing point is (18,22).

At (18,22), again in both zones and still travelling with velocity (3,1),
a=(+1,0) plus w=(0,−1) gives v'=(4,0), landing (22,22).
Choosing (+1,-1) would be illegal because Glass Ice permits one axis.

At (22,10) on the return boost, velocity is (-3,-1) and the moving
slab is on its six-step clock. Choosing a=(+1,+1) plus b=(-2,0)
gives v'=(-4,0), landing (18,10) with the rock's simultaneous swept
hitbox clear. Without compensating for boost, a=(-1,+1) would yield
(-6,0), overshooting the return and possibly crossing the bank.

## Geometry and measurable fairness

- ID frozen-gauntlet; Arctic Series Circuit 11, **Advanced 3 / Ember Rift**.
- Start (9,21), rest, standard 3 ordered gates, 1 lap, crash penalty 3.
- New asymmetrical northern shelf and notched island, within the same
  960x700 camera bounds, while retaining a wide legal skimmer corridor.
- Two 0.55-world-unit circular rocks, six-step synchronized paths; dynamic
  car clearance radius remains 0.8 world units.
- The QA-only `scripts/frozen-gauntlet-qa-route.mjs` has **24 real legal turns**
  and no crashes. It uses upper Glass+Wind turns 5–6, timed rock crossing,
  return boost turn 14, and lower Glass Ice turns 15–16.
- Minimum WHOLE-MOVE centreline clearance to banks **>=1.19** world units,
  exceeding skimmer half-width 0.8 plus standard safety margin 0.2.
- Minimum extra moving-rock clearance, after subtracting the full car
  and stone radii, **>=0.51** world units.
- An INDEPENDENT exact-engine, six-phase-aware BFS discovers a distinct
  **22-turn** no-crash lap that still encounters Glass+Wind, boost and glass.
  The 24-turn route is not advertised as a theoretical fastest time.
- All ten older circuits keep original geometry, per-map record keys and
  collision/start/score rules; the V15 browser page remains intact.

## Difficulty checklist compared with Track 10

| Factor (0–3) | Broken Passage | Frozen Gauntlet | Rationale |
|---|---:|---:|---|
| Endurance | 1 | 1 | 24-move representative path; final endurance reserved for Track 12 |
| Corridor width | 1 | 1 | No inaccessible skimmer-width bottleneck |
| Sharpness | 2 | 2 | Reuse previously learned hairpin braking |
| Diagonal geometry | 1 | 1 | Similar turn geometry but harder vector choice |
| Crosswind | 0 | 1 | (0,-1) overlaps the glass restriction |
| Glass Ice | 0 | 2 | Two marked sections, one with crosswind |
| Boost force | 0 | 1 | Single westward -2 at the timed return |
| Moving obstacles | 2 | 2 | Same public six-step rhythm, now combined with force |
| Strategy mixing | 0 | 3 | Multiple familiar effects must be evaluated together |

## Release gates

- [x] No new physical rule introduced; all interactions use existing
      start-of-turn, line-segment and turn-index semantics.
- [x] Explicit compound art and HUD show all simultaneously relevant rules.
- [x] Master/Expert hide forecasts while disclosing force and timing.
- [x] Reference and independent crash-free full laps touch intended stages.
- [x] Whole-path bank and moving-obstacle margins verified by engine tests.
- [x] Old ten map objects and saved records remain isolated.
- [ ] Node suite and 11-map syntax validation green in GitHub Actions.
- [ ] Nine exact browser viewport tests, open menus at 320x568 and 667x375,
      complete real-button Master lap and all older mechanics regression pass.
- [ ] Review screens: Glass+Wind, timed Boost+Rock, desktop and mobile.
- [ ] Classroom pilot to measure successful completions and perceived fairness.

Do not merge before code checks and visual review. PR #19 targets main
while the existing ten-track live website stays unchanged.
