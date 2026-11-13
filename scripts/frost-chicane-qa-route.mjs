/**
 * QA-only 26-move completed lap driven with the normal acceleration pad.
 * Exact moving segments through BOTH chicane bends maintain at least 1.2
 * world units of clearance, enough for the full displayed skimmer and the
 * main snowbank edge artwork. This is intentionally more forgiving than a
 * mathematically shortest route, which can graze the boundary.
 * NEVER import this fixture into the playable game.
 */
export const FROST_CHICANE_CLEAR_LAP = Object.freeze([
  [1,-1],[0,1],[1,0],[0,-1],[-1,1],[0,1],[0,1],[-1,-1],
  [1,-1],[0,-1],[1,-1],[-1,-1],[-1,-1],[-1,1],[-1,1],
  [-1,1],[-1,1],[0,0],[1,1],[1,1],[1,1],[1,0],[1,-1],
  [1,-1],[1,-1],[1,0]
].map(([x,y])=>Object.freeze({x,y})));
