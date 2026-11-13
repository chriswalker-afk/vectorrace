# Vectorrace

An original browser-based vector racing game in early development.

This repository is being used to explore the visual identity and core gameplay before committing to a full game build. Our working creative direction is **SNOWSHIFT**: a stylized, top-down ice-skimmer racing game that makes mathematical vectors feel like racing telemetry.

A deterministic single-player race is implemented in **PR #2**. An integrated original artwork upgrade is being developed in **PR #3**. This remains a prototype, not a finished game.

## Design principles

- Vector arithmetic drives the game: choose an acceleration, carry velocity forward, and plan the racing line.
- Preserve the familiar nine accelerations (each component -1, 0 or +1).
- Entire movement segments must stay on the track; an endpoint on the track does not excuse crossing the boundary.
- Distinctive original winter artwork, high contrast and responsive controls.
- Keep the mathematics visible without making the experience look like a worksheet.

Inspired by the educational vector-racing tradition in NRICH, CIMT Vectorace and Transum. No third-party artwork or code is copied.

## Prototype pages

- `snowshift-lab.html` — original PR #1 art / control experiment (no actual racing collisions).
- `race-v2.html` — PR #2 single-lap Northern Loop with vector physics, continuous track checks, checkpoints and scoring.
- `docs/PR2_ENGINE.md` — game rules, architecture and test instructions.
- `race-v3.html` — original Arctic environment/vehicle artwork integrated into the same racing engine.
- `race-v4.html` — one-screen race experience with Guided / Standard / Expert modes, tutorial and responsive cockpit.
- `race-v5.html` — single-screen cornering/braking guide, checkpoint/crash celebration and local personal-best ghost.
- `race-v6.html` — two playable beginner circuits: Northern Loop and Aurora Split (two clear routes around a small rock), with a compact in-board map selector.
- `race-v7.html` — three playable beginner circuits, including Frost Chicane's two quick bends with no new physics.
- `race-v8.html` — four beginner circuits, including a short skimmer-width bottleneck in Narrow Passage.
- `race-v9.html` — fifth circuit, Hairpin Hollow (Intermediate 1): long straight into a real 180° velocity reversal.
- `race-v10.html` — same five tracks, now with difficulty-based worlds: Snowbound Valley for Beginner and Aurora Vale for Intermediate. Advanced/Expert visual themes are prepared for future tracks.
- `race-v11.html` — six tracks including Twin Routes (Intermediate 2): a visually narrower inner shortcut and a wider, longer scenic route around a fully collidable Aurora glacier.
- `race-v12.html` — seven tracks including Glass Ice (Intermediate 3): a marked turquoise surface where only one velocity component can change per turn.
- `theme-gallery.html` — all four region palettes shown using the same reference course (Advanced/Expert are visual concepts only).
  - PR #7 adds **Master** after Expert: nine column-vector acceleration keys instead of arrows, with no predictions or racing hints.
- `artwork-lab.html` — inspect individual SVG vehicle, terrain and track materials.
- `docs/PR3_ARTWORK.md` — visual QA and artwork provenance.
- `docs/PR4_UX.md` — strict one-screen design goals, interaction rules and automated viewport checks.
- `docs/PR5_GAMEPLAY.md` — exact braking lookahead, local records, racing feedback and QA.
- `docs/PR7_MASTER_MODE.md` — challenge rules, matrix-key mapping and single-screen QA.
- `docs/PR8_TWO_CIRCUITS.md` — second circuit design, collision geometry and test requirements.
- `docs/PR9_ROCK_CLEARANCE.md` — small obstacle art, minimum skimmer-width margins and two-route manoeuvre tests.
- `docs/TRACK_DIFFICULTY_ROADMAP.md` — permanent 12-track plan, 0–3 difficulty checklist, new-mechanic rules and release gates.
- `docs/PR10_FROST_CHICANE.md` — Track 03 geometry, safe 26-turn race and layout acceptance.
- `docs/PR11_NARROW_PASSAGE.md` — Track 04 design, full-segment clearance and classroom challenge.
- `docs/PR12_HAIRPIN_HOLLOW.md` — first Intermediate track: long straight, U-turn, braking distance and safe-line tests.
- `docs/PR13_DIFFICULTY_REGIONS.md` — four-tier visual identity and safe track artwork standards.
- `docs/PR14_TWIN_ROUTES.md` — Track 06 route-choice geometry, both tested full laps, skimmer-width clearance and six-track release checks.
- `docs/PR15_GLASS_ICE.md` — Track 07 low-grip physics, true braking predictions, fair full-lap route and seven-track QA.

The browser prototype uses native JavaScript ES modules. Serve the project through HTTP(S), not by double-clicking an HTML file:

```sh
npm test
npm run check
python3 -m http.server 8000
```

Open `http://localhost:8000/race-v12.html` for all seven tracks. Add `?track=glass-ice` to explore the new Intermediate 3 rule; V11 remains available as the previous build.

PR #3 introduces original reusable SVG vehicles, scenery and surface materials. The assets still require visual review before they are final production artwork.
