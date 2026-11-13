# PR #7 — Master mode: vector notation replaces arrows

## Player-facing behaviour

The Snowshift V5 mode selector has a fourth choice, **MASTER**, after Guided → Standard → Expert.

- **Guided** keeps nine arrows and all landing/braking previews.
- **Standard** keeps arrows and a selected-move preview.
- **Expert** keeps arrows, without landing previews, crash warnings or a ghost.
- **Master** uses **exactly the same no-hints challenge rules as Expert**, but its nine acceleration arrows are replaced by actual two-row column vectors.

The top entry is the horizontal **x-component** and the bottom is the vertical **y-component**, each from `{-1, 0, +1}`. The column vectors use the same curved-bracket type treatment introduced in PR #6. The centre button is the zero vector.

In Master, the keypad still has these exact positions:

```text
(-1 over 1)  (0 over 1)   (1 over 1)
(-1 over 0)  (0 over 0)   (1 over 0)
(-1 over -1) (0 over -1)  (1 over -1)
```

Here 'over' denotes a proper vertical column in the **actual interface**, not horizontal ordered-pair notation.

## Preserved

- Physics `v' = v+a`, `p' = p+v'` and nine allowable accelerations.
- All nine hit targets, button order, selection styling, keyboard number keys/numpad/arrow keys, tapping and click behaviour.
- No selected-move preview, next velocity reveal, braking hints, grid by default, or personal-best ghost in Master.
- Grid can still be manually toggled, as in Expert.
- Local best saving still works after a Master lap, and appears as a ghost when changing to a less restrictive mode.
- V5 keeps the same 100dvh one-screen cockpit; no extra panel or scrolling.
- Earlier V2/V3/V4 builds are preserved as historical versions.

## Engineering

- `src/assistance.mjs`: adds a fourth policy, with same prediction permissions as Expert and only `accelerationNotation: 'columns'` different.
- `src/acceleration-pad.mjs`: maps the same nine physics-validated acceleration objects to either arrow symbols or accessible x-over-y matrices. Button event listeners and focus are not recreated on mode switch.
- `styles/master-mode.css`: compact matrix keys and four equal-size mode choices, including narrow phone layouts.
- `src/race-v5.mjs`: mode changes re-render only pad contents, keep acceleration selection and adjust the tutorial for Master.
- `tests/master-pad.test.mjs` and updated `tests/assistance.test.mjs`: verify all nine vectors and policy equivalence.
- `src/ux-smoke-v5.mjs`: tests column order, accessibility, no clipped keys, no hints and clean return to arrows at nine exact viewports.
- `scripts/viewport-smoke-v5.mjs`: tests a 20-turn full lap with Master selected; validates scoring, checkpoints, local best, ghost restrictions and desktop/mobile screenshots.

## Review

On the PR branch, open `race-v5.html` through an HTTP(S) server and select **MASTER**. The live GitHub Pages URL remains `https://chriswalker-afk.github.io/vectorrace/race-v5.html` after the PR merges; it won't reflect the branch until then.

Before merging, visually confirm that `-1` stays inside each bracket on 320px portrait and short landscape viewports, and that all nine cells remain selectable.
