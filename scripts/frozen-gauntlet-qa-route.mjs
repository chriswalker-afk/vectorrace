/**
 * QA-only 24-turn zero-crash Frozen Gauntlet full lap — NOT shipped into UI.
 * Turns 05,06 counter the coupled crosswind under one-axis Glass Ice;
 * turn 14 counters (-2,0) boost while crossing timed basalt; turns 15,16
 * brake using only one component on return Glass Ice.
 */
export const FROZEN_GAUNTLET_CLEAR_LAP=Object.freeze([
  [0,-1],[1,1],[1,0],[1,1],[0,1],[1,0],
  [-1,-1],[-1,-1],[-1,-1],[-1,1],[-1,0],[-1,1],
  [-1,0],[1,1],[0,0],[0,-1],[1,1],[1,1],
  [1,0],[1,1],[1,1],[1,0],[1,-1],[1,-1]
].map(([x,y])=>Object.freeze({x,y})));
