/*
 * QA-only safe 24-turn lap through BOTH animated basalt passages.
 * Entire-segment margins: >=1.19 world units from shorelines,
 * >=0.39 world units of spare space beyond slab radius + car half-width.
 * The course has no wind, glass-ice or boost rules.
 * Do not import this sequence into the playable game.
 */
export const BROKEN_PASSAGE_CLEAR_LAP=Object.freeze([
  [0,-1],[1,1],[1,0],[1,1],[0,0],[1,-1],
  [-1,-1],[-1,-1],[-1,-1],[-1,1],[-1,0],[-1,1],
  [-1,0],[-1,1],[0,0],[0,-1],[1,1],[1,1],
  [1,0],[1,1],[1,1],[1,0],[1,-1],[1,-1]
].map(([x,y])=>Object.freeze({x,y})));
