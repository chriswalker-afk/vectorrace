# PR #16 — Track 08: Crosswind Ridge (Intermediate 4)

## Learning goal: calculate with an external wind vector

Crosswind Ridge is the fourth Intermediate track, and it introduces **one new physical effect** while preserving the familiar acceleration decisions. A clearly marked wind field on the eastbound upper straight blows **south**:

```text
                  x →
         ↑ y
         |
         |    WIND (0, −1) ↓

  velocity next = velocity now + chosen acceleration + wind
  position next = position now + velocity next
```

In column-vector form, while inside the marked patch,

\[
\mathbf v_{n+1}=\mathbf v_n+\mathbf a_n+
\begin{pmatrix}0\\-1\end{pmatrix},
\qquad
\mathbf p_{n+1}=\mathbf p_n+\mathbf v_{n+1}.
\]

**There is no friction, random gust or secret physics modifier.** The wind is a constant known vector, and the same nine acceleration choices remain available in every assistance mode.

### Exactly when does wind apply?

- The wind vector is selected by the car's **position at the start of the turn**, including the painted wind-zone boundary.
- A move **entering** the wind area from outside is calculated without wind, unless its starting position was already inside. On the **next** turn, the force applies if the car landed inside/on the patch.
- A move **leaving** the zone still receives the wind if its **starting** position is inside. Subsequent turns outside use \(\mathbf w=(0,0)\).
- The wind affects **both the displayed next-velocity preview and the actual committed move**. There is no mismatch between the tutorial, legal path or scoring.
- All nine accelerations remain valid inputs in the wind. Snowbank collisions retain the standard +3 score penalty, even if a gust carries a badly planned line into the island.
- Earlier seven tracks have **no windZones property** and remain exactly wind-free.

**Student example:** On the eastbound straight, assume velocity \(\mathbf v=(3,0)\) and wind \(\mathbf w=(0,-1)\). Choosing \(\mathbf a=(0,0)\) gives \(\mathbf v'=(3,-1)\) and the skimmer drifts south. Choosing \(\mathbf a=(0,+1)\) gives \(\mathbf v'=(3,0)\), cancelling the wind and maintaining a straight line.

## Course geometry and visual identity

- Level: **INTERMEDIATE 4**, inheriting the **Aurora Vale** region.
- Name: **Crosswind Ridge**. The northern shoreline forms a more pronounced, broad/wavy windward ridge than the previous Glass Ice course. The western sweep and return lane are forgiving; the wind zone is the single new challenge.
- A single wide wind field, **ridge-crosswind**, is painted from x=17 to 26 and y=18.65 to 24.2. Its polygon almost fills the eastbound upper straight to discourage bypassing the intended challenge through a visually narrow strip.
- The field's exact polygon is used for **both rendering and physics activation**. This is legal track surface with a translucent blue-purple wind material, streaming strokes, repeated **downward arrows**, a dashed boundary and the label `WIND ↓ (0,−1)`.
- There are no new solid obstacles. The glow and arrows are clipped to the legal ice road, never painted as snowbanks or impassable boulders.
- An existing decorative beacon has been relocated **inside the central island** so the higher northern bank does not accidentally place a visual object in the new racing lane.
- Three ordered gate crossings remain **East → Return Straight → West → Finish**.
- The start is (10,20), at rest, with ample preparation time before entering the patch.

## Braking and assistance modes

The existing Guided forecast uses the *real engine* at every future move. With wind, a naive choice of \(a_y=0\) would not brake a vertical velocity correctly; instead, the coach selects from the available accelerations the one that minimizes the **next velocity after wind is added**.

For example, under \(w_y=-1\), if \(v_y=0\), the coach chooses \(a_y=+1\) simply to **maintain zero vertical velocity**; when the car leaves the wind zone, it returns to the original pure componentwise braking. If the wind makes a full stop impossible before leaving the safe corridor, the forecast must mark the projected path unsafe instead of drawing a fictitious stop.

- **Guided / Standard:** The next-velocity preview reflects \(v+a+w\), and the surface message announces the wind and counterforce. Guided braking lines use actual wind-aware acceleration vectors.
- **Expert / Master:** The **known fixed field** remains visible as public course information. Hidden future destinations/next velocity stay hidden; Master continues to use proper two-row column vectors. No difficulty mode is given different physics.
- The existing line above the acceleration pad displays **WIND ↓ (0,−1)** while the field is active, and the existing board-bottom line displays **WIND ↓ (0,−1) · COUNTER ↑ (+1 y)**. Before the patch, the board warns **CROSSWIND AHEAD ↓ (0,−1)**.
- No extra HUD rows, mode buttons, scrolling panel or modal are introduced.
- A dedicated tutorial example explains \(v'=v+a+w\) and the benefit of cancelling the wind.

## Proven full-lap route and clearance

A QA-only reference in `scripts/crosswind-ridge-qa-route.mjs` has **24 legal acceleration turns**, zero crashes, correct gate order and at least **1.1 world units of closest entire-segment centreline clearance** from both snowbanks. The visible skimmer's half-width is 0.8, and the production guideline requires a minimum centreline distance of 1.0. This means the whole displayed vehicle remains visibly clear of the banks.

The route **starts three consecutive turns under wind (turns 05–07)**, deliberately selecting \(a_y=+1\) all three times to cancel \(w_y=-1\). Without that correction, a two-turn uncorrected glide from the same point drifts south toward the central island and crashes. An **independent graph solver**, which does not use the fixture, must also find a crash-free complete lap.

These are tested representative turns, not claims that 24 is the optimum score.

## Acceptance checklist

- [ ] One southward \(\mathbf w=(0,-1)\) wind zone only, with a visually exact and legible boundary
- [ ] Start-of-turn semantics, including border, for both entering and leaving the zone
- [ ] From \(v=(3,0)\), coasting gives next \(v=(3,-1)\); \(a_y=+1\) gives next \(v=(3,0)\)
- [ ] No wind on any of the earlier seven circuits and no change to Glass Ice's five-vector rule
- [ ] Still **nine acceleration controls** in Crosswind; Guided forecast and Master physics agree
- [ ] 24-turn no-crash real lap via actual browser Master column-vector buttons
- [ ] At least 1.0-unit **whole-motion-segment skimmer clearance**; currently 1.1+ on the representative lap
- [ ] Existing scoring, ghost, records and all three ordered checkpoint gates work
- [ ] Eight-map picker and full race fit without scrolling at all nine screen sizes, particularly **320×568** and **667×375**
- [ ] Screenshot of the full wind patch and another showing **active wind in Master** with future next velocity still hidden
- [ ] Tests and documentation present on GitHub for the next planned Advanced track

## Files and versions

- `src/circuit.mjs`: `CROSSWIND_RIDGE` as eighth track
- `src/engine.mjs`: authoritative `windZoneAt`, `windVectorAt`, and `v_next=v+a+w` preview/turn calculation
- `src/race-coach.mjs`: wind-aware braking choices and fail-safe full-stop forecast
- `src/race-art-v13.mjs`: painted wind band, downward vectors and off-road-safe beacons
- `race-v13.html`, `src/race-v13.mjs`, `styles/map-selector-v13.css`, `styles/wind-ui.css`: eight-circuit single-screen build
- `tests/crosswind-ridge.test.mjs`, `scripts/crosswind-ridge-qa-route.mjs`, `src/ux-smoke-v13.mjs`, `scripts/viewport-smoke-v13.mjs`, and CI `eight-circuits.yml`: complete mathematical/browser QA
- All earlier V12 and previous build versions remain accessible for comparison.

## URLs once PR #16 is merged

- Eight-track game: `https://chriswalker-afk.github.io/vectorrace/race-v13.html`
- Direct Crosswind Ridge: `https://chriswalker-afk.github.io/vectorrace/race-v13.html?track=crosswind-ridge`
- Previous seven-track baseline: `https://chriswalker-afk.github.io/vectorrace/race-v12.html`

**Next planned circuit:** **Track 09 — Icebound Rapids (Advanced 1)**, which should be the first actual playable track in the distinct charcoal/copper **Ember Rift** environment. Its proposed mechanic is one clearly marked deterministic **boost strip**; no boost physics is added in this PR.
