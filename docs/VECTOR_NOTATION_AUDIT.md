# Snowshift — Vector-notation audit (Public Build 20)

## Mathematical convention
All positions and vectors use x = east, y = north. Positive y in mathematical coordinates is drawn upward on the canvas; screen-down corresponds to negative y. Points can be written as (x,y), but applied velocity changes must be treated as **vectors**, not as scalar speed bonuses.

Each turn uses the existing unchanged physics:

v(next) = v(current) + a(chosen) + w(wind, if applicable) + b(boost, if applicable)
p(next) = p(current) + v(next)

The displayed convention is a genuine **column vector**, horizontal x on top and vertical y below. Inline text in compact spaces names the vector and both components.

## Track inventory

| Tracks | Mechanic | Added vector | Effect |
| --- | --- | --- | --- |
| 01–07, 10 | No external force | none | Normal acceleration or glass-ice constraints |
| 08 Crosswind Ridge | Southward wind | w = (0, −1) | Subtract 1 from y velocity on turn START in wind |
| 09 Icebound Rapids | East and west boosts | b = (2, 0) or (−2, 0) | Add ±2 to horizontal velocity on start-of-turn copper strip |
| 11 Frozen Gauntlet | Coupled wind; west return boost | w = (0, −1); b = (−2, 0) | Glass still restricts chosen acceleration to one axis; wind applies independently |
| 12 Arctic Grand Prix | Same wind and boost, across both laps | w = (0, −1); b = (−2, 0) | Effects remain independent of moving rock phase |

**Legitimate scalar quantities:** A three-point crash penalty is a score change; a six-phase rock clock is a phase count; choosing acceleration's x component +1 is a scalar component when explicitly labelled as such. They should not be mistaken for complete force vectors.

## UI behaviour
- On-track markings show east/west or south direction and two vertically stacked x/y entries enclosed by curved brackets. Each comes directly from the actual zone vector.
- Circuit-selection cards for tracks with wind or boosts show those exact column vectors, with no invented force on unaffected tracks.
- When a player's turn starts inside a wind or boost area, an **External Vectors** overlay shows the active force as a named column vector. The overlay follows each player's own state in Pass & Play.
- Tutorials, status messages, toasts, acceleration hints and screen-reader labels describe the correct vector components. Inline (x, y) references in cramped messages are explicitly labelled as vectors, and the full column form is displayed on board.
- No change to the engine's maths, hitbox, checkpoint rules, course geometry, scores or player customisation.

## Tests
Unit tests validate sign and component order; the real vector applied on all courses; painted track columns and arrows; and public UI references. Browser QA uses the established safe courses to pass through Crosswind Ridge, both Icebound Rapids boosts, Frozen Gauntlet and Arctic Grand Prix, checking exact live column values after moving the racer.

Earlier numbered race pages are historical QA references. The live entry is race.html.
