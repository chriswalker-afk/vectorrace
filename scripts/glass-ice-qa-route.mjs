/**
 * Test-only, 24-turn Glass Ice lap found with the real acceleration and
 * checkpoint constraints, then audited for full vehicle-width clearance.
 * Every entire movement segment stays at least 1.0 world unit from both
 * snowbanks. The skimmer starts turns 05, 06 and 07 ON the glass, steering
 * only in the x axis until it can safely turn toward the hairpin.
 *
 * This fixture is NOT imported by the playable UI.
 */
export const GLASS_ICE_CLEAR_LAP = Object.freeze([
  [1,0],[1,0],[0,0],[1,0],[1,0],
  [-1,0],[-1,0],[-1,-1],[-1,-1],[-1,0],
  [-1,0],[-1,1],[-1,1],[0,-1],[0,-1],
  [1,1],[1,1],[1,1],[1,1],[0,0],
  [1,1],[1,0],[1,-1],[1,-1]
].map(([x,y])=>Object.freeze({x,y})));
