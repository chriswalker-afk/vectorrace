# SNOWSHIFT — creative direction v0.1

**Status:** proposed design direction, not a locked product name or final production art.
**Project:** Vectorrace (top-down, turn-based vector racing)
**Creative statement:** *Think ahead. Slide faster.*

## The bold choice

Rather than draw ordinary cars on graph paper, build a miniature Arctic racing world where teams race **ice-skimmers** across groomed tracks on frozen lakes. The picture is playful, atmospheric and immediately legible. Underneath, the mathematics remains rigorous and deterministic.

SNOWSHIFT is a working title. Do not treat it as trademark-cleared or final.

## Five non-negotiables

1. **Overhead gameplay.** No perspective distortion of the coordinate plane. Terrain can be 2.5D through paint, snowbanks, shadows and animated effects, but movement is truly top-down.
2. **The grid appears when needed.** It fades into the landscape while a racer glides; during vector selection it becomes a fine topographic/telemetry overlay. A persistent-grid accessibility setting remains available.
3. **The mathematics is the driving.** Each turn choose acceleration a=(ax,ay), where ax and ay are individually -1, 0 or +1. Set v' = v + a and p' = p + v'. Nine options; no hidden velocity damping.
4. **The journey matters as much as the endpoint.** Check the *entire movement segment* against the track, not only its destination. Visible skimmer tracks reveal the segment actually travelled.
5. **Stylish but usable.** Important strokes, car silhouettes, indicators and vector previews must stay readable on a projector and a touch display. No decoration may obscure the racing line.

## Visual world

- **Setting:** Alpine night, frozen lake circuits, snow drifts, pines, cliffs, survey flags, timber safety fencing, occasional distant cabins and warm lamps.
- **Art form:** top-down miniature winter diorama + crisp wayfinding/technical racing interface. Graphic shapes with soft-edged snow shadows and a little grain; not generic photorealism, pixel art, glossy cyberpunk, or toy-plastic low-poly.
- **Vehicle:** bespoke single-seat *ice-skimmer*, an arrow-shaped chassis with twin runners, short canopy and signature bright-livery nose. The skimmer naturally faces its current velocity; acceleration does not magically rotate it.
- **Animation:** movement occurs along the actual selected segment in a short glide. Powder spray, paired runner lines, ice scuffs and a subtle warm exhaust mark communicate velocity. They must not imply a curved path when physics is straight.
- **Track language:** dark groomed ice corridor with pale bank edges, thin signal markers, checkerboard start, invisible accurate collision mask. Decorative snow formations must never obscure collision limits.
- **Atmosphere:** aurora haze in distant landscape, cabin lamps, breathlike frost and drifting flakes kept deliberately low-contrast over the play area.

## Palette

| Role | Hex | Usage |
|---|---|---|
| Polar night | `#0A192B` | Main shell, shadows, high-contrast surfaces |
| Deep ice | `#164B65` | Track, secondary panels |
| Frost | `#B9EAF0` | Route outlines, light snow, positive preview |
| Snow white | `#EFF8FB` | Topographic landforms, primary text on dark UI |
| Flare orange | `#FF7557` | Player skimmer, focus, danger |
| Aurora lime | `#D4FC77` | Valid selected target, speed telemetry |

**Colour is not the only cue:** all preview states also use size, shape, line pattern or labelling.

## Typography / interaction

- **Display:** heavy uppercase, wide tracking, confidently oversized *SNOWSHIFT* logotype.
- **Numbers:** tabular, monospaced; vector components should feel like pit-lane telemetry.
- **UI:** dark semi-matte panels, hard-edged pills, clipped corners, restrained border highlights.
- **Input:** a spatial 3x3 acceleration control with arrow labels; preview before commit; click/tap and keyboard support.
- **Readability:** always distinguish current velocity, acceleration choice, next velocity and next position.
- **Animation/accessibility:** honour reduced-motion preference; every game action is operable without colour perception.

## Mathematical model for initial prototype

Let world x increase right and y increase *up*, although canvas y pixels increase down.
```text
ax, ay ∈ {-1, 0, 1}
v_next = (vx + ax, vy + ay)
p_next = (px + v_next.x, py + v_next.y)
```
The entire straight segment from p to p_next must remain inside the permitted road.

**Do not add friction because it is snow-themed.** If we later introduce different surfaces, their effects must be explicit, predictable and teachable; never silently change the core model.

## First validation scene: Northern Loop

This is a **design lab**, not a finished race. It should demonstrate:
- original overhead Arctic environment with a legible loop;
- player ice-skimmer in orange;
- nine possible endpoints and a highlighted selected acceleration;
- a velocity readout, current/next vector and animated straight move;
- accurate whole-segment collision validation in the exploration;
- optional coordinate grid and replayable reset;
- responsive tablet/desktop/mobile layout.

The scene intentionally does **not** yet include racing laps, opponent AI, start/finish progression, track editor, sounds, online play, or progression unlocks.

## Quality gates for any future artwork

- Can a student understand the track edges and identify their vehicle from a classroom projector?
- Do vectors and preview dots stay visible on both pale snow and dark ice?
- Is the exact endpoint aligned to the mathematical grid?
- Does visual motion accurately follow the *same* physics used by collision tests?
- Can every environmental object be reused in multiple tracks without style drift?
- Does the scene feel like a winter sport, not a generic graph-paper game with snow stickers?

## Reference policy

NRICH Vector Racer, Transum's vector game, and CIMT Vectorace inform the **mathematical mechanic**, not the art assets. Winter racing games can be researched for general visual literacy; all finished assets should be original or explicitly licensed. Avoid copying named games' characters, layout, screenshots, logos or track designs.

## Suggested next PR after design approval

Extract a separate deterministic vector-engine module with automated tests (nine choices, stationary moves, component signs, segment/track collisions, finish-line direction, non-self-overlap). Build a real lap-based first circuit on top of that engine; treat this first page as a visual exploration rather than production logic.
