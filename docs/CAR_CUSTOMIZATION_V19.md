# Snowshift V19 — car customisation design and QA

## Placement and purpose
The core player journey stays **Home → Single Player / Pass & Play → Choose Circuit → Race**. There is no extra required screen. The circuit selector includes a visible **Garage** area before the twelve map cards. A player can choose a silhouette and two paint colours, then click a track to race.

In Pass & Play, show 2–4 clearly labelled racer tabs and a live preview for the selected player. Each racer has its own design. Shape and colours can be changed independently; one player cannot unintentionally overwrite another.

## Designs
- Silhouettes: **Skimmer**, **Arrow**, **Rally**, **Glider** (different actual car body geometries).
- Paint: body and trim each have preset swatches plus native custom hex-colour picker.
- Shared drawing code powers the garage previews, racing skimmers and multiplayer handoff preview. Opponents are drawn as smaller customised cars with numbered badges.
- Cosmetics remain visually centred on the original physics point. Vehicle art does not modify the collision hitbox, velocity, force/boost calculations, checkpoints or scores.

## Persistence and navigation
- Single player: store their car only in browser localStorage, with a safe fallback if storage is inaccessible.
- Pass & Play: pass the independent designs as strictly validated compact tokens in the track/race URL, including when returning to **Track / Garage**. No accounts or server.
- Race Again / Reset keep all participants' chosen looks. Going Home then choosing Single Player recalls their solo design.
- The current race accepts missing and invalid tokens safely and never treats a car token as program code.
- Legacy build V17 remains untouched for physics/regression comparisons.

## Coverage
Unit tests verify style variants, hex validation, URL round-trip and malformed handling, solo local storage, separate multiplayer designs, and unchanged race-engine output. Browser QA on desktop and portrait/landscape mobiles covers garage previews, custom body and trim, solo recall, Pass & Play per-racer colour changes, handoff preview, reset and track-change retention. The V18 menu QA workflow is extended rather than introducing another redundant workflow.
