/**
 * QA-only 23-turn crash-free Icebound Rapids lap through BOTH boost strips.
 * First strip (turn 05): v_x=3, a_x=-1, boost_x=+2 => v'_x=4.
 * Second strip (turn 15): v_x=-3, a_x=+1, boost_x=-2 => v'_x=-4.
 * Whole-movement margin against every bank >=1.2 world units.
 * This is a reference safety route, not a claim of the shortest possible lap.
 * Never load this fixture into the playable browser code.
 */
export const ICEBOUND_RAPIDS_CLEAR_LAP=Object.freeze([
  [1,-1],[1,1],[1,0],[0,0],[-1,0],[-1,0],
  [-1,-1],[-1,-1],[-1,-1],[-1,1],[-1,1],[-1,0],
  [-1,1],[1,0],[1,-1],[1,1],[1,1],[1,1],
  [1,1],[1,0],[1,-1],[1,-1],[0,-1]
].map(([x,y])=>Object.freeze({x,y})));
