# PR #15 — Track 07: Glass Ice (Intermediate 3)

## Learning objective — when you cannot change both velocity components

This is the first track to introduce **a change in the game's physics rules**. It lives in the existing **Aurora Vale** Intermediate environment, but a distinct turquoise, paneled **GLASS ICE** patch appears on the eastbound approach to the sharp turn.

The rule is deliberately explicit, deterministic, reversible and easy to calculate:

> **On Glass Ice, your acceleration may change at most ONE velocity component in a turn.**  
> The usual acceleration vectors with two nonzero entries (the four diagonals) are unavailable. You can still use horizontal acceleration, vertical acceleration or the zero vector. Once outside the patch, all nine vectors return.

- The rule is checked at the **start-of-turn position** (including the boundary).
- A move that *enters* Glass Ice from normal ice is made with the normal nine-vector choice. The restriction begins on the **following turn if the skimmer landed inside/on the patch**.
- While on the patch, **five** legal choices are `(-1,0)`, `(0,-1)`, `(0,0)`, `(1,0)` and `(0,1)`. With a column-vector interface, these appear as vertically stacked `x` and `y` components.
- The original equations **do not change**: `v_next = v + a`; `p_next = p + v_next`. No random sliding, reduced integer fractions, speed caps, invisible wind or passive friction.
- Pressing an unavailable diagonal is blocked by the UI and **does not cause a crash, consume a turn or add points**. The engine independently enforces this as a no-op.
- The choice makes **braking while turning harder**, because on normal ice one turn can reduce both x and y speeds; on Glass Ice the student must prioritise one component per turn. For example, braking `v=(1,1)` takes one turn on ordinary ice but two on Glass Ice (if the skimmer remains there).

This design implements the pre-existing direction in `docs/TRACK_DIFFICULTY_ROADMAP.md`: "marked ice limits changing at most one velocity component in a turn".

## Course design

- **Difficulty:** INTERMEDIATE 3 (seventh course).
- **Art region:** Aurora Vale, with a flared upper snowfield and a distinct pale-cyan glass patch.
- **One active zone:** `northern-glass`, a 9-unit-long painted polygon on the upper straight, from x≈17 to x≈26 and y≈18.6 to 22.2.
- The visible surface and exact rule use the same `circuit.glassZones[0].polygon`; the patch is **fully driveable** and never treated as an obstacle.
- No change to the shape or behaviour of existing six circuits; Glass Ice has its own polygon geometry with a slightly broader northern shelf and a familiar hairpin/return lane to focus attention on the single new mechanic.
- Three ordered checkpoints remain East → South/Return → West → Finish; score is still **moves + 3 × crashes**.
- The glass patch's dashed edge tells the player precisely when the rule activates; translucent facets and specular highlights make it unmistakably different from land or the ordinary cyan ice.

## Cornering coach and all assistance modes

The optional Guided braking forecast respects the new one-axis constraint:
- On ordinary ice, maximal braking may reduce **both** velocity components by one.
- On glass, when both components are nonzero, the coach brakes the component of **greater absolute magnitude** first (x on a tie), then recomputes each subsequent turn using the *exact engine*.
- Its estimated full stop and warning are therefore **real legal movement segments**, not impossible diagonal projections through the patch.
- Standard, Expert and Master obey the **same deterministic restriction**; nobody receives a gameplay advantage through a different mode.
- While on Glass Ice, **four diagonal buttons are visibly disabled**, and the **five legal choices remain**. The full 3×3 layout is preserved so students can immediately see what has changed.
- The existing readout and board-bottom message show **“GLASS ICE · ONE AXIS”** and **“GLASS ICE · NO DIAGONALS”** in all modes, including Master. Before entering the zone the message warns **“GLASS ICE AHEAD · BRAKE EARLY”**.
- Switching modes on the patch restores the proper disabled controls, including true mathematical **column vectors in Master**.
- A previously chosen diagonal resets visibly to zero when the skimmer enters Glass Ice; it is never silently applied.
- A short tutorial specifically explains the restriction.

## Evidence and release gates

A **24-turn representative QA lap** is committed in `scripts/glass-ice-qa-route.mjs`. It starts at rest, enters Glass Ice for three turns, brakes its x-velocity while unable to turn in both axes, negotiates the eastern hairpin, clears all three checkpoints and crosses the finish. Every full motion segment retains **at least 1.0 world unit** from all snowbank edges (the illustrated 1.6-unit-wide skimmer has half-width 0.8 plus 0.2 safety buffer).

- [ ] Engine unit tests confirm **five available / four unavailable** acceleration choices in Glass Ice; all nine on other tracks.
- [ ] The restriction triggers exactly on the marked zone, including its border and only at the **start of the turn**.
- [ ] Invalid diagonal commands do not create crashes, moves or scores.
- [ ] Guided predictions and stop diagrams use **valid zone-aware braking**, not the old diagonal simulation.
- [ ] The exact shortest-lap solver, without using the QA route, independently finds a completed Glass Ice race.
- [ ] The 24-turn reference lap completes without crashes, has three restricted turns, traverses all three gates and maintains ≥1.0 whole-segment clearance.
- [ ] Every student-facing mode shows the correct rule and five enabled controls once inside.
- [ ] Six existing tracks, physics, personal-best keys, ghosts and difficulty colours remain unchanged.
- [ ] The **seven-card menu** fits entirely on screen at all nine test dimensions, including **320×568 and 667×375**.
- [ ] Actual Chrome shows the active state in Master, with **four disabled diagonals** and no accidental score penalty; a complete Master race saves its PB.
- [ ] The photographed turquoise patch looks like **legal slick roadway**, not a snowbank obstacle.

## Technical changes

`src/engine.mjs` provides **one authoritative rule** via `glassIceZoneAt` and `accelerationAllowed`, enforced by both `previewMove` and `takeTurn`. The existing segment collision code remains unmodified. `src/race-coach.mjs` uses the exact rule during braking forecasts.

`src/race-art-v12.mjs` paints the new legal surface inside the existing road clipping, matching the exact `glassZones` polygon. `race-v12.html`, `src/race-v12.mjs`, `styles/map-selector-v12.css` and `styles/glass-ice-ui.css` are isolated latest-build changes: all earlier V11 game art/controller files remain available.

`tests/glass-ice.test.mjs` asserts the mechanics and full lap. `src/ux-smoke-v12.mjs` and `scripts/viewport-smoke-v12.mjs` check the seven-choice selector, disabled vectors, full Master lap, and previous records across mobile/desktop sizes.

## URLs after merging PR #15

- Seven-track Snowshift: `https://chriswalker-afk.github.io/vectorrace/race-v12.html`
- Glass Ice directly: `https://chriswalker-afk.github.io/vectorrace/race-v12.html?track=glass-ice`
- Earlier six-track baseline: `https://chriswalker-afk.github.io/vectorrace/race-v11.html`

**Next track on the permanent roadmap:** Track 08 — **Crosswind Ridge (Intermediate 4)**, introducing one clearly marked, predictable constant-wind vector. That new mechanic is **not part of Track 07**.
