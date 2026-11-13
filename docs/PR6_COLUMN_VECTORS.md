# PR #6 — Mathematical column-vector notation

**Scope:** all playable Snowshift versions (V2–V5) plus the original design lab.

## Classroom-standard notation

Velocity and acceleration are vectors, so the HUD now uses bracketed two-row column vectors, not horizontal ordered pairs.

For example, the velocity with horizontal component 3 and vertical component -2 is

```text
       (  3  )
  v =  (     )
       ( -2  )
```

The first (top) entry is always the **horizontal x-component**; the second (bottom) entry is always the **vertical y-component**. Selected acceleration and next velocity follow the same convention. Positive components are not prefixed with decorative plus signs.

A **point** is different: a landing position can correctly remain `(x, y)`. Do not mistake that position notation for a vector.

## Implementation

- `src/vector-notation.mjs`: reusable component renderer, validation and accessible descriptions (x above y). All HUD updates use this helper. No physics changes.
- `styles/column-vectors.css`: native, scale-independent two-row matrix with curved parentheses drawn via CSS. No third-party maths typesetter, network dependency or font download.
- Each race page displays real column notation in its initial HTML even before JavaScript runs.
- In Expert mode, both next-velocity entries become `?` in the same matrix (and the accessible description explicitly says the prediction is hidden).
- Acceleration pad tooltips and screen reader descriptions identify the **top x** and **bottom y** components instead of expressing them as coordinate pairs.
- The original artwork lab uses the same notation.

## QA

- Unit tests verify signs, ordering and Expert-mode secrecy.
- Static integration tests cover every displayed vector in V2–V5 and the early artwork lab.
- Existing automated desktop, tablet, portrait and landscape viewport suites check that **the two matrix entries stack vertically**, fit on-screen and preserve all controls on the same viewport.
- The complete 20-turn playable race, ghost, collision and score regression tests remain part of the V5 workflow.

## Acceptance

1. Velocity, acceleration and next velocity all visibly appear as vertical, bracketed columns.
2. Top entry is x; bottom entry is y; negative components render correctly.
3. Expert mode shows an **unknown column vector**, not a horizontal `(?, ?)`.
4. Velocity arithmetic, scoring and collision detection are unchanged.
5. No scroll or clipped controls on all previously checked screen sizes.
