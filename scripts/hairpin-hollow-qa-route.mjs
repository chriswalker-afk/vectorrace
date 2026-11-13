/**
 * Test-only 25-turn hairpin lap. Every segment has >= 1.2 world units
 * centreline clearance from the outer snowbank and central island, not just
 * legal mathematical endpoints. Actual acceleration choices (-1..1) are
 * used in the browser test. DO NOT import into playable code.
 *
 * Eastbound velocity reaches +4 on the long straight, is braked to zero in
 * the U-turn, and then becomes -4 along the westbound return lane.
 */
export const HAIRPIN_HOLLOW_CLEAR_LAP = Object.freeze([
  [1,0],[1,0],[0,0],[1,0],[1,0],
  [-1,0],[-1,-1],[-1,-1],[-1,0],[-1,0],
  [-1,1],[-1,1],[-1,0],[0,-1],[0,-1],
  [1,1],[1,1],[1,1],[1,1],[0,1],
  [0,0],[1,-1],[1,-1],[1,-1],[1,0]
].map(([x,y])=>Object.freeze({x,y})));
