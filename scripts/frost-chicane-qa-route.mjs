/**
 * QA-only 25-move lap, using actual nine-option accelerations.
 * Full line segments through both chicane bends maintain at least 1 world unit
 * of centreline clearance from each snowbank for the visible-width skimmer.
 * Distinct from the engine's minimum-move route, which may graze boundaries.
 * NEVER import this fixture into the playable game.
 */
export const FROST_CHICANE_CLEAR_LAP = Object.freeze([
  [1,-1],[0,1],[1,0],[-1,-1],[0,1],[1,1],[-1,0],[0,0],
  [0,-1],[1,-1],[-1,-1],[-1,-1],[-1,-1],[-1,1],[-1,1],
  [-1,1],[0,1],[1,1],[1,1],[1,1],[1,1],[1,-1],[1,-1],
  [1,-1],[1,-1]
].map(([x,y])=>Object.freeze({x,y})));
