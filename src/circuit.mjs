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
  level: 'BEGINNER 1',
  tagline: 'Wide bends · Learn momentum',
  menuHint: 'The original, forgiving circuit',
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


/**
 * Beginner 2 — Aurora Split.
 * A compact snow-covered rock sits within a deliberately wider northern straight.
 * The southern edge has a gentle dogleg, so straight-line speed must be
 * managed through a second kind of corner. Same acceleration and lap rules.
 *
 * An obstacle is a genuinely impassable polygon IN the road corridor, not an
 * image overlaid on a legal part of the track. Players can choose either
 * the upper or lower channel with skimmer-width clearance; crossing the rock is a crash even when both
 * endpoints are on ice.
 */
export const AURORA_SPLIT = {
  id: 'aurora-split',
  name: 'Aurora Split',
  subtitle: 'Arctic Series / Circuit 02',
  level: 'BEGINNER 2',
  tagline: 'Small rock · Tighter southern bend',
  menuHint: 'Steer above or below a small snow-covered rock',
  outer: [
    { x: 2, y: 8 }, { x: 7, y: 3 }, { x: 14, y: 3 },
    { x: 16, y: 4 }, { x: 23, y: 3 }, { x: 30, y: 8 },
    { x: 30, y: 17 }, { x: 26, y: 22 }, { x: 18, y: 23 },
    { x: 12, y: 22 }, { x: 7, y: 22 }, { x: 2, y: 17 }
  ],
  inner: [
    { x: 7, y: 11 }, { x: 10, y: 8 }, { x: 13, y: 8 },
    { x: 15, y: 9 }, { x: 19, y: 9 }, { x: 22, y: 8 },
    { x: 25, y: 11 }, { x: 25, y: 15 }, { x: 21, y: 15.7 },
    { x: 12, y: 15.7 }, { x: 9, y: 16 }, { x: 7, y: 15 }
  ],
  obstacles: [
    {
      id: 'snow-boulder',
      label: 'Snow-covered Rock',
      polygon: [
        { x: 19.5, y: 19.15 }, { x: 19.9, y: 18.72 },
        { x: 20.68, y: 18.68 }, { x: 21.05, y: 19.17 },
        { x: 20.57, y: 19.72 }, { x: 19.75, y: 19.67 }
      ]
    }
  ],
  start: { x: 13, y: 19 },
  targetLaps: 1,
  crashPenalty: 3,
  finish: {
    id: 'finish', label: 'Start / finish',
    a: { x: 16, y: 17 }, b: { x: 16, y: 22 },
    direction: { x: 1, y: 0 }
  },
  checkpoints: [
    {
      id: 'east', label: 'East Gate',
      a: { x: 25, y: 12.5 }, b: { x: 30, y: 12.5 },
      direction: { x: 0, y: -1 }
    },
    {
      id: 'south', label: 'South Gate',
      a: { x: 16, y: 4 }, b: { x: 16, y: 9 },
      direction: { x: -1, y: 0 }
    },
    {
      id: 'west', label: 'West Gate',
      a: { x: 2, y: 12.5 }, b: { x: 7, y: 12.5 },
      direction: { x: 0, y: 1 }
    }
  ]
};

export const CIRCUITS = Object.freeze([NORTHERN_LOOP, AURORA_SPLIT]);

export function getCircuit(id) {
  return CIRCUITS.find(circuit => circuit.id === id) ?? NORTHERN_LOOP;
}
