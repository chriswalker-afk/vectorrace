/**
 * QA-ONLY routes through the actual Twin Routes acceleration engine.
 * These deliberately favor visual skimmer clearance rather than scraping
 * snowbanks to get a mathematically shortest point-mass lap.
 *
 * INNER shortcut: 23 moves, ~70.01 world units driven, 1.0 minimum
 * full-motion skimmer-centre clearance.
 * OUTER scenic: 24 moves, ~76.33 world units driven, >=sqrt(2) clearance
 * throughout the full lap (>=1.4 by the track-approval rule).
 *
 * Never import either fixture into the playable game.
 */
const toColumns=steps=>Object.freeze(steps.map(([x,y])=>Object.freeze({x,y})));

export const TWIN_ROUTES_SHORTCUT_LAP=toColumns([
  [1,-1],[1,1],[1,0],[0,0],[1,0],[-1,0],[-1,-1],[-1,-1],
  [-1,-1],[-1,0],[-1,1],[-1,1],[-1,0],[0,1],[0,0],
  [1,1],[1,1],[1,0],[1,0],[1,1],[1,0],[1,-1],[0,1]
]);

export const TWIN_ROUTES_WIDE_LAP=toColumns([
  [0,1],[1,1],[1,0],[1,-1],[0,-1],[1,-1],[-1,0],[-1,-1],
  [-1,-1],[-1,-1],[-1,1],[-1,1],[-1,0],[-1,1],[0,1],
  [0,0],[1,1],[1,0],[1,1],[1,1],[1,0],[1,-1],[1,1],[0,0]
]);
