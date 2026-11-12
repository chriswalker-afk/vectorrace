# Vectorrace

An original browser-based vector racing game in early development.

This repository is being used to explore the visual identity and core gameplay before committing to a full game build. Our working creative direction is **SNOWSHIFT**: a stylized, top-down ice-skimmer racing game that makes mathematical vectors feel like racing telemetry.

A first playable single-player race is under review in **PR #2**. This is a prototype, not a finished game. Design and gameplay experiments will continue in pull requests.

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

The browser prototype uses native JavaScript ES modules. Serve the project through HTTP(S), not by double-clicking an HTML file:

```sh
npm test
npm run check
python3 -m http.server 8000
```

Open `http://localhost:8000/race-v2.html`.

Production vehicle and track graphics are deliberately deferred until the gameplay has been validated.
