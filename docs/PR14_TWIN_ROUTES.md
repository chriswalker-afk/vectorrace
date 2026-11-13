# PR #14 — Track 06: Twin Routes (Intermediate 2)

## Learning objective — choose a racing line

**Main new skill:** Compare a tighter, shorter passage with a wider but longer alternative. Students plan their *velocity as a two-component vector* before entering a split. The mathematics of acceleration is unchanged: each turn selects \(a_x,a_y\) from \(\{-1,0,1\}\), then \(v_{new}=v+a\), followed by \(p_{new}=p+v_{new}\).

This is more than a repeat of Aurora Split (Beginner 2). The central glacier is a **long divider**; each channel has a markedly different width and cost, so the decision is a genuine risk/reward choice rather than merely steering above or below a small rock.

## Track geometry

The new Twin Routes circuit is the **sixth registered map**, at **INTERMEDIATE 2**, in the existing **Aurora Vale** visual region. The divider occupies approximately world x=13.6–22.6 and y=18.45–21.5. It is a real solid polygon, and the game uses the same exact continuous collision test on it as on shorelines.

| Measure (at x≈18) | Inner shortcut | Outer wide route |
|---|---:|---:|
| Approximate usable channel width | **2.9 world units** | **4.4 world units** |
| Typical centreline | y≈17 | y≈23–24 |
| Illustrated skimmer width | 1.6 | 1.6 |
| Minimum QA whole-lap movement-segment clearance | **1.0** | **1.4** |
| Tested full-lap moves | **23** | **24** |
| Tested full-lap path length | ≈70.0 units | ≈76.3 units |
| Ordered checkpoints / penalty | East → South → West → Finish / +3 | Same |

These are **deliberately chosen, crash-free representative racing lines**, not an absolute optimality claim. The shorter line saves one turn in our reference comparison and about six world units, but students can experiment and potentially find a different best score.

### Skimmer-width safety standard

The vehicle's illustrated width is 40px = **1.6 world units** at the design scale, so it has half-width 0.8. The original production safety criterion requires **at least 1.0 world unit** from the car centre to any visible boundary, allowing an additional 0.2 buffer on each side. The shortcut is tight **but demonstrably passable** under that rule. The scenic outer route maintains at least **1.4 units of margin along its complete reference lap**.

The QA checks inspect the full continuous movement segment, never only the landing cell. A straight jump through the glacier divider is a crash even when both endpoints are otherwise on the road.

## Visual implementation and clarity

- `src/race-art-v11.mjs` paints an original elongated Aurora **glacier spine** to the *exact physics polygon*. The crystals, snow facets and internal highlight strokes are fully clipped to the impassable land. **No enormous stretched rock sprite, no floating label such as “FLOE”, no oversized false snowbank edge.**
- The physical divider is obvious from the different ice materials: a narrow inner channel and a wider outer channel visibly reconverge before the East checkpoint.
- The former finish-area decorative beacon would fall into the new wide lane. It is relocated **inside the central island**, off the playable road.
- The new circuit's slightly taller northern boundary gets a 20px downward **camera offset only for this track**. All earlier circuits keep their previous V10 camera and scenery framing.
- Menu caption and tutorial explain **“INNER shortcut — narrower/faster; OUTER detour — wider/longer”**. They remain English-language guidance, not a physics mechanic.
- No new sprites or external image files are required. Existing Aurora palette and scenery remain coherent.

## Browser experience

- `race-v11.html` adds a sixth circuit with the difficulty label **INTERMEDIATE 2** and the **AURORA** region indicator.
- `styles/map-selector-v11.css` keeps six choices within the existing board overlay, using a compact 3×2 grid on small portrait and landscape screens.
- `src/race-v11.mjs` inherits all modes and exact engine rules. Master still uses **vertical column vectors**; Guided still has correct braking advice.
- Local personal-best/ghost records are tracked independently per circuit, preserving all five earlier records.
- The V10 build remains unchanged for comparison, and the four-world gallery is still available.

## Required release evidence

1. `tests/twin-routes.test.mjs` verifies both channels are physically open, both wider than the real skimmer, and that the outer corridor is meaningfully wider.
2. The **23-turn shortcut** and **24-turn outer detour** each complete a full lap via **legal acceleration sequences and the actual engine**, including all three ordered checkpoint gates. Tests measure their entire trajectories, length, clearance and turn counts.
3. A separate exact graph solver must find a completed lap without using either test fixture.
4. `src/ux-smoke-v11.mjs` asserts correct six-track selection and Aurora Valley tier identity after switching.
5. `scripts/viewport-smoke-v11.mjs` drives **both** route fixtures through real Master-mode buttons, verifies best-score persistence (a longer scenic lap must not overwrite the shorter best), tests actual collider crash, and checks all **nine viewport sizes**.
6. Previous circuit unit suites and browser regression workflows still pass. The shortcut is **not allowed to become artificially impassable** due to decoration.

## Post-merge preview

- All six maps: `https://chriswalker-afk.github.io/vectorrace/race-v11.html`
- Twin Routes: `https://chriswalker-afk.github.io/vectorrace/race-v11.html?track=twin-routes`
- Original five-map V10: `https://chriswalker-afk.github.io/vectorrace/race-v10.html`

## Next on the roadmap

Track 07 — **Glass Ice (Intermediate 3)**, proposed to teach an explicitly marked low-grip zone with predictable braking restrictions. That would require a **separate, carefully specified physics change** with transparent mathematical explanation and full solver coverage; it is **not included here**.
