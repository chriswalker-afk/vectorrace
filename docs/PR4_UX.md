# PR #4 — Single-screen usability and interactivity

## The non-negotiable requirement

**The complete playable interface fits inside one viewport, with no page scrolling.**

The track, 9-direction acceleration pad, glide button, velocity telemetry, three help modes, checkpoint progress, race score, grid toggle, reset and tutorial control remain visible simultaneously. Landscape and portrait layouts have different arrangements; both fit within `100dvh`. The board's camera uses **contain** scaling so the mathematically exact track is never distorted or cropped as aspect ratio changes.

The largest-screen layout is track on the left with a compact cockpit on the right. On portrait mobile/tablet screens (up to 920 px wide), the track sits above a tightly arranged cockpit. On short landscape screens, control cells, padding and labels shrink without scrolling.

## Play

- `race-v4.html`: the PR #4 playable experience (opens on GitHub Pages after merge)
- `race-v3.html`: unchanged artwork build (for visual comparison)
- `artwork-lab.html`: unchanged reusable art library

The homepage links to the newest build. Neither art, collision geometry nor mathematical acceleration rules have been changed.

## Three assistance modes

| Mode | All nine locations | Selected path/landing | Next velocity | Crash warning | Default grid |
|---|---|---|---|---|---|
| Guided | Yes | Yes | Yes | Yes | On |
| Standard | No | Yes | Yes | Yes | Off |
| Expert | No | No | Hidden | Hidden | Off |

These are **help layers only**: engine state, scoring, crashes, gate order and lap completion are identical in all three modes. The mode switch is always visible, and the coordinate grid can be toggled separately.

## Interactive tutorial

The **? How to Play** button opens a compact four-step coach **over the board**, not a second page:

1. Velocity carries over; choose acceleration rather than a destination.
2. Select a direction from the nine-arrow pad.
3. Press GLIDE. The coach moves on automatically after selecting and committing.
4. To navigate bends, brake early; pass East, South, West, finish.

It can be stepped, skipped or dismissed using Escape. It never blocks pad/commit controls. The race continues on the same screen.

## Core UX improvements

- Single-screen fixed viewport with panel-first sizing and intentionally no document scroll.
- Large spatial 3 × 3 acceleration control and prominent GLIDE action.
- Clear telemetry for current velocity, selected acceleration and next velocity (hidden in Expert).
- Colour **and** icon differences for safe/unsafe previews.
- Cornering feedback distinguishes an on-road glide from a crash route.
- Mode and grid controls with `aria-pressed`, keyboard access and labelled controls.
- Numerical 1–9 and numpad selection; arrow keys adjust selection; Enter/Space commits; R resets; G grid; H tutorial.
- Responsive camera with preserved 960×700 virtual world ratio and corrected touch hit mapping.
- Existing straight-line movement animation and reduced-motion preference retained.

## Browser verification

The new `.github/workflows/one-screen-ux.yml` runs Node tests, syntax checks and **actual headless Chrome layout tests** at nine screen sizes, including desktop, classroom-sized laptop, portrait tablet, several portrait phones and landscape phones.

The browser smoke test verifies: viewport width/height without scrolling, every critical control inside the viewport, all nine acceleration buttons, assistance mode switching, Expert's hidden preview, unchanged score across mode switching, and successful first move. CI captures desktop, portrait and landscape screenshots.

## Run locally

```sh
npm test
npm run check
python3 -m http.server 8000
```

Open `http://localhost:8000/race-v4.html`. For a development viewport snapshot, append `?qa=1` and inspect `document.documentElement.dataset.qa` (PASS/FAIL) and the hidden `#qa-report` element.

## Limits and next steps

This pass deliberately leaves the pure PR #2 engine and PR #3 art untouched. A single screen is guaranteed for targeted device viewport sizes checked in CI; extreme accessibility zoom, virtual keyboards and exceptionally tiny screens need separate manual testing. The tutorial is contextual rather than a larger multi-screen lesson. Future work may include replay/ghost racing, a track selection menu, progressive lessons and AI opponents.
