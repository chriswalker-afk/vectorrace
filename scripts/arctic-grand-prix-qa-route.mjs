/**
 * Student-facing finale has NO secret control vectors, lap reset or luck.
 * This is QA-only: a 50-turn, two-lap race with six ordered gate crossings,
 * the exact existing wind/Glass/boost rules and three real swept obstacles.
 * Lap 1: 28 turns; slow carefully before crossing the finish at x=11.
 * Lap 2: 22 turns; retain the velocity, new rock phase and changing position.
 * Both laps activate all four force/surface mechanics, and follow the full
 * vehicle-width bank and moving-hitbox clearance checks in the test suite.
 * This fixture is NEVER imported by the game controller.
 */
export const GRAND_PRIX_LAP_ONE = Object.freeze([[0,-1],
  [1,1],
  [1,0],
  [1,1],
  [0,1],
  [1,0],
  [-1,-1],
  [-1,-1],
  [-1,-1],
  [-1,1],
  [-1,0],
  [-1,1],
  [-1,0],
  [1,1],
  [0,0],
  [0,-1],
  [1,1],
  [1,1],
  [1,0],
  [1,1],
  [1,1],
  [1,0],
  [-1,-1],
  [-1,-1],
  [1,-1],
  [0,0],
  [0,0],
  [0,0]] .map(([x,y])=>Object.freeze({x,y})));
export const GRAND_PRIX_LAP_TWO = Object.freeze([[1,1],
  [1,0],
  [0,1],
  [1,0],
  [-1,-1],
  [-1,0],
  [-1,1],
  [-1,0],
  [-1,-1],
  [-1,0],
  [-1,0],
  [1,1],
  [0,1],
  [0,-1],
  [1,1],
  [1,1],
  [1,1],
  [1,1],
  [0,0],
  [1,0],
  [1,-1],
  [1,-1]] .map(([x,y])=>Object.freeze({x,y})));
export const ARCTIC_GRAND_PRIX_CLEAR_RACE = Object.freeze([...GRAND_PRIX_LAP_ONE,...GRAND_PRIX_LAP_TWO]);
