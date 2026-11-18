# PR #20 — Arctic Grand Prix (Expert 1 / Eclipse Summit)

## Goal: the twelve-track final championship

This is the **final course** in the original Snowshift progression. It is
not another new rule: the student must sustain correct vector decisions
across **two consecutive laps** while combining Glass Ice, south wind,
forced boost and now **three deterministic moving sentinels**. Compared
with Frozen Gauntlet, the long-run and mid-race momentum handoff are the
central new demands. Expert is the *circuit difficulty*, not an override
of Guided / Standard / Expert / Master **assistance mode**.

## Physics: published, deterministic, inherited

At every legal GLIDE, on normal ice select
a=(a_x,a_y), both components in {-1,0,1}. Glass Ice permits at most one
nonzero acceleration component on a turn STARTING in the painted zone.
The known wind w and boost b apply at turn START, boundary included:

    v_next = v_current + a + w + b
    p_next = p_current + v_next.

The northern paired field overlays **the same exact polygon** for
Glass Ice and wind w=(0,-1); a legal (0,+1) selection cancels only the
wind, not inertia. The lower return boost b=(-2,0) must be anticipated
before the bend, and a separate return Glass Ice stretch constrains
braking. All effects remain visible in every assistance mode. Master
still displays nine column vectors (only five enabled on Glass Ice)
and hides the next predicted velocity; Expert likewise hides it.

A stationary or moving sentinel with centre H(t), radius r, moves
linearly on an attempted GLIDE. The skimmer moves linearly on the same
fraction t; collision tests the minimum separation of simultaneous
centres along the ENTIRE turn, subtracting r + car half-width **0.8**,
not endpoint-only checks. Invalid Glass Ice diagonals do not advance a
turn; other crash attempts DO advance the public six-step cycle and
apply the existing +3 collision penalty.

## The three six-step sentinels

| Sentinel | Centre x | y positions by phase 1→6 | radius |
|---|---:|---|---:|
| Northern Eclipse | 20.5 | 19.7, 20.7, 21.8, 22.8, 21.8, 20.7 | 0.55 |
| Return Eclipse | 18 | 9.7, 10.8, 12, 12.8, 12, 10.8 | 0.55 |
| Eastern Eclipse | 29.7 | 11.2, 12, 12.8, 13.6, 12.8, 12 | 0.42 |

Every sentinel's solid filled numbered disc is its NOW position. A
dashed circle shows its NEXT position; a thin track-wide guide depicts
the full rail. All three move exactly one phase per GLIDE, including a
crash. There is no real-time clock or randomness. The third smaller
sentinel is **physically collidable** at phases where the same
bank-legal descent is safe at another phase, with visual radius derived
directly from the physics data.

## Two-lap event contract

The race begins at (9,21), velocity (0,0). Each lap must clear EAST
(southbound), RETURN (westbound), WEST (northbound) and then FINISH
(eastbound) in that order. The real finish line has moved to x=11
(y=18.7..24.8), allowing a controlled crossing before the paired
upper field on the subsequent lap. The actual race uses a new
asymmetrical serrated Eclipse Summit polygon and an inward faceted
central island; it is not a recoloured copy of Track 11.

On crossing the finish for **lap one**, only checkpoint progress resets
to EAST. The car retains its exact position and velocity, the global
move count and rock clock do not reset, and the score continues. The
HUD announces **LAP 2 / 2** and celebrates the final-lap transition.
After the second complete ordered circuit it says FINISHED, records
the score and saves a personal-best ghost isolated by track ID.

## 50-move, two-lap zero-crash reference

`scripts/arctic-grand-prix-qa-route.mjs` is design-test data only:
it is never imported by the browser game controller.

- Lap one: **28 moves**, three ordered gates, one legal first-lap
  finish, and deliberate braking near the west approach. The car
  crosses into lap two at **(12,22), velocity (1,0)**.
- Lap two: **22 additional moves**, retaining that initial momentum,
  all six-phase elapsed rock positions and the two-lap score. Three
  more ordered gates then the final finish.
- Both laps explicitly enter the northern Glass+Wind region (2/3
  start-of-turn activations), the westward boost (one each), and the
  homeward Glass Ice (two/one activations respectively).
- A **third moving sentinel** is safely crossed on the eastern descent;
  at another rock phase the same legal road movement produces a real
  engine collision. This phase dependency is regression tested.
- Minimum WHOLE-SEGMENT bank clearance across all 50 GLIDEs:
  **1.42 world units**; minimum additional moving-sentinel clearance
  after subtracting stone radius plus full skimmer half-width:
  **0.45 world units**.
- An independent phase-and-lap-aware breadth-first search finds a
  different complete second lap from the real 28-move first-lap
  finish state without resetting velocity, checkpoint progress,
  global moves or rock phase.

These are robust examples of how to complete the race, **not an
advertised shortest path** or claims about untested student strategies.

## Difficulty checklist relative to Frozen Gauntlet

| Dimension | Track 11 | Track 12 | Why |
|---|---:|---:|---|
| Endurance | 1 | 3 | Two full consecutive laps, cumulative score |
| Corridor width | 1 | 1 | >1.42 whole-path reference; avoid arbitrary tight gaps |
| Paired force / Glass | 2 | 2 | Both laps encounter the familiar combined section |
| Moving obstacles | 2 | 3 | Third smaller phase-sensitive eastern sentinel |
| Boost forces | 1 | 1 | One deliberately placed -2 on each lap |
| Steering / sharpness | 2 | 2 | Similar learned corners, but need consistency |
| Gate precision | 1 | 2 | Six ordered gate passes and true lap transition |
| Planning | 3 | 3 | Must preserve momentum and plan timing over two laps |

## Student-facing safety, visual and QA checklist

- [x] New Expert Eclipse Summit identity: gold and black terrain,
      a unique geometry silhouette, finish and central eclipse artwork.
- [x] Current and next positions visibly distinct for all three
      accurately sized and numbered timed sentinels.
- [x] All three sentinels on genuine racing ice, each complete moving
      segment entirely legal and collision math exact.
- [x] 50-turn two-lap zero-crash reference, >1.42 bank and >0.45
      extra moving-hitbox clearance; all stage mechanics twice.
- [x] One real independently solved second lap from the true first-lap
      finish with phase and momentum preserved.
- [x] No old track geometry, previous records or physics modified;
      only the QA solver gains support for a provided in-progress state.
- [x] Six checkpoint clearances and two finish crossings, with score,
      lap count, ghost and finish panel correct.
- [ ] GitHub Actions full Node tests, v17 syntax and browser QA green.
- [ ] Nine exact screen-size checks, including compact open menus
      at 320x568 and 667x375, no scroll/hidden controls.
- [ ] Actual-browser 50-button Master race, third sentinel impact,
      milestone toast, old wind / boost / moving-slab regressions.
- [ ] Review Expert desktop, mobile, coupled field, east sentinel,
      boosted return and transition screenshots.
- [ ] Classroom playtesting: score distribution, completion rate,
      whether three moving sentinels remain readable, and lap-two
      fatigue / student satisfaction.

Do NOT merge PR #20 before visual and browser QA. The live main branch
remains on the 11-track V16 release for review.
