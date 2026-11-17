/**
 * QA-ONLY 24-turn Crosswind Ridge lap. Three successive turn starts lie in
 * the southward (0,-1) wind field. Each deliberately chooses a_y=+1,
 * cancelling the wind to hold a straight eastbound line:
 *
 *     v'_y = v_y + (+1) + (-1) = v_y.
 *
 * Whole-segment centre-to-bank clearance was audited at >=1.1 world units,
 * more than the 0.8-unit rendered car half-width + 0.2 safety buffer.
 * This is a safe representative line, NOT an asserted shortest lap.
 *
 * Never import this fixture into the playable game.
 */
export const CROSSWIND_RIDGE_CLEAR_LAP=Object.freeze([
  [1,0],[1,0],[0,0],[1,0],
  [1,1],[-1,1],[-1,1],
  [-1,-1],[-1,-1],[-1,0],[-1,0],
  [-1,1],[-1,1],[0,-1],[0,-1],
  [1,1],[1,1],[1,1],[1,1],[0,0],
  [1,1],[1,0],[1,-1],[1,-1]
].map(([x,y])=>Object.freeze({x,y})));
