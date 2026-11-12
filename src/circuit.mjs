/**
 * Geometry and competition rules for Northern Loop.
 * All geometry uses mathematical coordinates: x increases east, y increases north.
 * The race corridor is the closed outer polygon minus the *interior* of the inner
 * polygon; the boundaries themselves are legal to touch.
 */
export const NORTHERN_LOOP = {
  id: 'northern-loop',
  name: 'Northern Loop',
  subtitle: 'Arctic Series / Circuit 01',
  outer: [
    { x: 2, y: 8 }, { x: 7, y: 3 }, { x: 24, y: 3 },
    { x: 30, y: 8 }, { x: 30, y: 17 }, { x: 24, y: 22 },
    { x: 7, y: 22 }, { x: 2, y: 17 }
  ],
  inner: [
    { x: 7, y: 11 }, { x: 10, y: 8 }, { x: 21, y: 8 },
    { x: 25, y: 11 }, { x: 25, y: 14 }, { x: 21, y: 17 },
    { x: 10, y: 17 }, { x: 7, y: 14 }
  ],
  start: { x: 13, y: 19 },
  targetLaps: 1,
  crashPenalty: 3,
  finish: {
    id: 'finish',
    label: 'Start / finish',
    a: { x: 16, y: 17 }, b: { x: 16, y: 22 },
    direction: { x: 1, y: 0 }
  },
  checkpoints: [
    {
      id: 'east', label: 'East Gate', a: { x: 25, y: 12.5 },
      b: { x: 30, y: 12.5 }, direction: { x: 0, y: -1 }
    },
    {
      id: 'south', label: 'South Gate', a: { x: 16, y: 3 },
      b: { x: 16, y: 8 }, direction: { x: -1, y: 0 }
    },
    {
      id: 'west', label: 'West Gate', a: { x: 2, y: 12.5 },
      b: { x: 7, y: 12.5 }, direction: { x: 0, y: 1 }
    }
  ]
};
