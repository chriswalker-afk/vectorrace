# PR #2 — playable race engine

## Test page

Open `race-v2.html` on a static web server. The previous `snowshift-lab.html` remains available and unchanged.

After this PR merges and GitHub Pages serves the `main` branch, the intended URL is:
`https://chriswalker-afk.github.io/vectorrace/race-v2.html`

Browser ES modules require HTTP(S): opening this HTML directly as a local `file://` page may fail. Run `python3 -m http.server 8000` at the repository root for local preview, then open `http://localhost:8000/race-v2.html`.

## Physics (pure engine: `src/engine.mjs`)

- From rest, a player selects exactly one of nine acceleration vectors; each component is -1, 0 or +1.
- `v_next = v_current + acceleration`.
- `p_next = p_current + v_next`.
- Each move is a mathematically straight segment. A crash happens if **any interior part** leaves the road (including jumping over the central island), even when the endpoint is legal.
- Touching road boundaries is legal, following the underlying CIMT convention.
- A crash leaves the player at the last legal grid point, resets velocity to zero, consumes one attempted turn, and adds another three points to the race score.
- Finishing requires crossing East Gate southwards, South Gate westwards, West Gate northwards, then the finish line eastwards. The gate detection accepts starting exactly on the line and departing in the correct direction; arriving exactly on the line counts when departing.
- First to finish is not yet a multiplayer mechanic; single-player score = attempted moves + 3 × crashes. Lower is better.
- State transitions are functional and independent of canvas, DOM, timers and animation. Game rendering cannot change physics.

## Circuit geometry (`src/circuit.mjs`)

- Original 2D grid layout consisting of **outer and inner closed polygons**.
- Collision validation splits the moving segment at every intersection with each polygon edge, then classifies the midpoint of each interval. This avoids sampled-pixel false negatives and tunneling across narrow snow.
- Gate geometry and paint use the exact same world coordinates, with x increasing east and y north.

## Controls (`race-v2.html`)

- On-screen accessible 3 × 3 acceleration pad; choose one vector then commit.
- Keyboard number keys / numpad 1–9 select the corresponding acceleration; arrow keys move selection; Enter or Space commits; R resets.
- Track preview markers can be clicked/tapped; optional nine-option overlay and grid; visible valid/invalid warnings.
- State-driven progress tracker, move count, crash count, and score.
- Reduced-motion users skip movement animation. Renderer uses straight-line interpolation only.
- Responsive desktop/tablet/mobile shell.

## Tests

```sh
npm test
npm run check
```

The Node built-in test runner verifies physics, negative components, the nine choices, illegal acceleration values, zero motion, boundary touch, whole-segment collisions, directional gate crossings, checkpoint order, collision recovery, score, and completion lockout. GitHub Actions runs these checks on PRs.

## Deliberately not in PR #2

Production artwork, polished sprite animations, soundtrack, opponent AI, online multiplayer, editor, local storage of best score, advanced surface physics, and campaign are future work. `race-v2.html` has procedural visual placeholders so the race mechanics can be judged before commissioning production graphics.

## Review checklist

- Can a new player see valid next positions and understand how to choose one?
- Can the player complete Northern Loop without game-breaking false crashes?
- Are gates reached in the correct order, and does finishing stop further moves?
- Is a crash both mathematically justifiable and easy to recover from?
- Is the course legible at projector size and on a phone?
- Are track collisions visually aligned with the painted geometry?
