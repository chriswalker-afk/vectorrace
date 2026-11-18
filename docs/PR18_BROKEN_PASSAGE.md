# PR #18 — Broken Passage, Advanced 2 (Ember Rift)

## Focus: deliberate timing, not random movement

The tenth playable Snowshift circuit introduces predictable moving obstacles.
Students continue to control the skimmer by choosing one of the nine acceleration
vectors with each component in {-1,0,+1}. There are no low-grip zones, boosts,
wind, bonus rules, random timings or sudden teleportation. Other courses retain
their exact original vector rules.

This is a first **timing** challenge after Advanced 1's forced acceleration
challenge, not an attempt to combine several unfamiliar mechanics.

## Track and movement contract

Circuit ID: `broken-passage`; level **ADVANCED 2**, Region **Ember Rift**;
start (9,21) with velocity (0,0); 1 lap; three ordered East, South and West
checkpoints, then Finish; classic +3 collision score penalty. Distinct
asymmetrical jagged shorelines surround two wide crossing regions.

Two small solid basalt slabs (painted radius **0.55 world units**) move on fixed
copper rails, synchronised to a single six-turn oscillator:

| Public phase | 1 | 2 | 3 | 4 | 5 | 6 | then |
|---|---:|---:|---:|---:|---:|---:|---|
| North slab, x=20.5, y | 19.7 | 20.7 | 21.8 | 22.8 | 21.8 | 20.7 | repeat 1 |
| Return slab, x=18, y | 9.7 | 10.8 | 12.0 | 12.8 | 12.0 | 10.8 | repeat 1 |

Both pieces shift at most 1.2 world units in a single GLIDE and move linearly
between their published centres. They never move at real-world clock time:
**only a GLIDE consumes a phase**. Crashes consume an attempted turn and
therefore advance the cycle; tapping an acceleration option without committing
a GLIDE does not.

At game move counter m=0, both slabs occupy phase 1. A GLIDE moves them from
phase 1 to 2. After 5 attempts, the next move is 6→1. At 6 attempts, the next
move is 1→2 again. The player sees exactly this current→next sequence in the HUD,
at every assistance difficulty. A filled numbered basalt slab means NOW; its
empty dashed circle means NEXT. A subtle dashed copper rail illustrates the
entire oscillation range. No solid wall is drawn where the physics permits
driving.

## Continuous collision mathematics

For one turn, let the skimmer start at P, choose acceleration a, acquire
velocity v' = v+a and land at Q=P+v'. Let the hazard travel from H to H'.
At any fraction t of that move (0≤t≤1), the vehicle centre and slab centre
are respectively

  P(t) = P + t(Q−P),     H(t) = H + t(H'−H).

A collision occurs if their closest separation along **the same turn**
is strictly less than radius_slab + half_width_skimmer = **0.55+0.8=1.35**
world units. The engine minimises this relative-motion squared distance over
t∈[0,1]; no sampling, endpoint-only collision or random result is used.
A player may crash although both the start and the destination were safe.
Stationary vehicles are also at risk if a slab moves across their position.

Crashes retain the classic +3 score penalty and reset velocity to (0,0).
If the collision leaves the player in the next obstacle sweep, the skimmer
returns to the most recent safe gridpoint from its traversed trail (or the
initial starting pad when no earlier safe point exists). This safeguard
prevents unavoidable repeated collisions. Ordinary static crashes on the
first nine tracks are unchanged.

## Proven route and fairness

The QA-only `scripts/broken-passage-qa-route.mjs` fixture has 24 legal
acceleration choices from the real start. It traverses the upper crossing,
passes the East Gate, returns through the moving lower crossing, clears
South and West, then Finish, with no collisions.

Whole-path (not just endpoints) minimum bank margin **>=1.19 world units**,
above the visual skimmer half-width 0.8 plus safety buffer 0.2. Minimum
moving-rock clearance after subtracting both slab radius and skimmer
half-width is **>=0.5 world units** with the offset upper guide rail.
Both crossings are genuinely affected by turn timing: the same upper
trajectory is unsafe when started at phase 5 but safe at phase 6, while a
southern return segment similarly changes from unsafe to safe.

A separate engine BFS, whose visited key includes the six-phase index,
must independently find a completed, non-crashing lap; this fixture is
not imported into the playable browser. The 24 moves are a forgiving
reference, not an asserted optimal minimum.

## Difficulty checklist, versus Track 09

| Factor (0–3) | Track 09 | Track 10 | Intent |
|---|---:|---:|---|
| Turn budget | 1 | 1 | Comparable length; not endurance |
| Narrow sections | 1 | 1 | Wide crossings with car-width space |
| Sharp corners | 2 | 2 | Known hairpin planning |
| Boost forces | 2 | 0 | Removed to focus on exactly one new mechanic |
| Moving obstacles | 0 | 2 | Two timed six-step crossings |
| Route planning | 1 | 2 | Coordinate braking with moving slabs |
| Wind / grip | 0 | 0 | Not combined until later |
| Gate precision | 1 | 1 | Standard ordered checkpoints |

## UX and release gates

- [x] New distinct track geometry, genuine Ember Rift palette and reusable
      stylised basalt/slab artwork matching active physics locations.
- [x] Exactly two deterministic, six-step, linearly moving obstacles.
- [x] 24-turn reference lap that crosses both hazards with whole-path width QA.
- [x] Actual simultaneous collision, correct clock advance on success/crash,
      safe crash recovery and independent phase-aware BFS.
- [x] Existing nine courses unchanged and saved best keys isolated by circuit.
- [x] Master/Expert do not reveal predicted velocity; all modes see the public
      hazard sequence and use identical physics.
- [x] Ten-track responsive menu, with an explicitly labelled Advanced 2 option.
- [ ] Node regression, V15 browser-driven complete Master lap and nine exact
      CSS viewport checks pass in GitHub Actions.
- [ ] Review downloaded mobile, desktop and active-rock screenshots.
- [ ] Student testing: note completion rate, median score, unintended repeated
      crashes and how often students notice the six-phase cue.

Do not merge PR #18 before automated browser tests and visual review.
