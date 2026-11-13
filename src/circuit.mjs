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


/**
 * Beginner 3 — Frost Chicane.
 * Two closely spaced, alternating bends in the eastbound northern straight.
 * The corridor first ducks south around the outer snowbank's inward nose and
 * then climbs north past the inner island's outward shoulder.
 *
 * This is pure geometry: NO rocks, wind, boosts, grip changes or special input.
 * At the two pinches there is a clear, contiguous lane wide enough for the
 * displayed skimmer + a safety margin. Unlike an obstacle, the landform is
 * physically continuous with the corresponding bank.
 */
export const FROST_CHICANE = {
  id: 'frost-chicane',
  name: 'Frost Chicane',
  subtitle: 'Arctic Series / Circuit 03',
  level: 'BEGINNER 3',
  tagline: 'Two quick bends · Reverse lateral momentum',
  menuHint: 'Brake, change direction and accelerate through an S-bend',
  outer: [
    { x: 2, y: 8 }, { x: 7, y: 3 }, { x: 24, y: 3 },
    { x: 30, y: 8 }, { x: 30, y: 17 }, { x: 27, y: 22 },
    { x: 25, y: 23.4 }, { x: 23.6, y: 23.8 },
    { x: 22, y: 23.4 }, { x: 21, y: 22.2 },
    { x: 20, y: 18.9 }, { x: 18.5, y: 18.9 },
    { x: 17, y: 22 }, { x: 7, y: 22 }, { x: 2, y: 17 }
  ],
  inner: [
    { x: 7, y: 11 }, { x: 10, y: 8 }, { x: 21, y: 8 },
    { x: 25, y: 11 }, { x: 25, y: 14 },
    { x: 24.8, y: 17.5 }, { x: 23.6, y: 18.5 },
    { x: 22.3, y: 17.8 }, { x: 21, y: 14.5 },
    { x: 20, y: 13.1 }, { x: 18.5, y: 13.1 },
    { x: 17, y: 16.4 }, { x: 10, y: 17 }, { x: 7, y: 14 }
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
      a: { x: 16, y: 3 }, b: { x: 16, y: 8 },
      direction: { x: -1, y: 0 }
    },
    {
      id: 'west', label: 'West Gate',
      a: { x: 2, y: 12.5 }, b: { x: 7, y: 12.5 },
      direction: { x: 0, y: 1 }
    }
  ]
};


/**
 * Beginner 4 — Narrow Passage.
 * Builds on Frost Chicane's two successive bends, then introduces a SINGLE
 * short pinched section on the south straight. The lower edge of the central
 * snow island projects toward the outer shore near x=15–18.5.
 *
 * At the tightest part the road is 3.2 world units wide (south bank y=3,
 * island edge y=6.2). A centreline at y=5 has at least 1.2 world units to
 * the island and 2.0 to the outer shoreline — enough for the full painted
 * skimmer (half-width 0.8) plus a visible 0.2 margin. The narrowing tapers
 * gently on each side and does NOT introduce any new physics, obstacles or
 * false painted closures.
 */
export const NARROW_PASSAGE = {
  id: 'narrow-passage',
  name: 'Narrow Passage',
  subtitle: 'Arctic Series / Circuit 04',
  level: 'BEGINNER 4',
  tagline: 'Short bottleneck · Hold a precise line',
  menuHint: 'Control your speed through a brief narrow section',
  outer: [
    { x: 2, y: 8 }, { x: 7, y: 3 }, { x: 24, y: 3 },
    { x: 30, y: 8 }, { x: 30, y: 17 }, { x: 27, y: 22 },
    { x: 25, y: 23.4 }, { x: 23.6, y: 23.8 },
    { x: 22, y: 23.4 }, { x: 21, y: 22.2 },
    { x: 20, y: 18.9 }, { x: 18.5, y: 18.9 },
    { x: 17, y: 22 }, { x: 7, y: 22 }, { x: 2, y: 17 }
  ],
  inner: [
    { x: 7, y: 11 }, { x: 10, y: 8 },
    { x: 13.8, y: 8 }, { x: 14.8, y: 6.2 },
    { x: 18.2, y: 6.2 }, { x: 19.2, y: 8 },
    { x: 21, y: 8 }, { x: 25, y: 11 },
    { x: 25, y: 14 }, { x: 24.8, y: 17.5 },
    { x: 23.6, y: 18.5 }, { x: 22.3, y: 17.8 },
    { x: 21, y: 14.5 }, { x: 20, y: 13.1 },
    { x: 18.5, y: 13.1 }, { x: 17, y: 16.4 },
    { x: 10, y: 17 }, { x: 7, y: 14 }
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
      a: { x: 16, y: 3 }, b: { x: 16, y: 6.2 },
      direction: { x: -1, y: 0 }
    },
    {
      id: 'west', label: 'West Gate',
      a: { x: 2, y: 12.5 }, b: { x: 7, y: 12.5 },
      direction: { x: 0, y: 1 }
    }
  ],
  // Authoring metadata: this is for validation and documentation only.
  // The renderer and collision engine use the actual inner/outer polygons.
  featuredPassage: {
    xMin: 14.8, xMax: 18.2, yMin: 3, yMax: 6.2,
    passingLineY: 5, minVisibleClearance: 1.0
  }
};


/**
 * Intermediate 1 — Hairpin Hollow.
 *
 * An extended eastbound top straight rewards building speed, but a tight
 * 180-degree turn at the far eastern tip requires early braking and a genuine
 * reversal of horizontal velocity. Racers return WEST along a separate lane.
 * The western end is deliberately a broad, forgiving sweep, so the eastern
 * hairpin is the single principal difficulty increase.
 *
 * The centreline of the hairpin has about 1.2+ world units of clearance to
 * both snowbanks across a 25-move test-only route, making it driveable by the
 * *visible* skimmer, not merely a mathematical point.
 *
 * No new movement/physics mechanics and no separate obstacles.
 */
export const HAIRPIN_HOLLOW = {
  id: 'hairpin-hollow',
  name: 'Hairpin Hollow',
  subtitle: 'Arctic Series / Circuit 05',
  level: 'INTERMEDIATE 1',
  tagline: 'Long straight · Sharp 180° reversal',
  menuHint: 'Brake early, reverse direction and return along the lower lane',
  outer: [
    { x: 3, y: 8 }, { x: 7, y: 4 }, { x: 12, y: 6 },
    { x: 15, y: 10 }, { x: 24, y: 10 },
    { x: 27.5, y: 11.5 }, { x: 29.8, y: 14 },
    { x: 30, y: 17 }, { x: 29, y: 20 }, { x: 26, y: 22 },
    { x: 7, y: 22 }, { x: 3, y: 20 },
    { x: 1.5, y: 17 }, { x: 2, y: 12 }
  ],
  inner: [
    { x: 7, y: 12 }, { x: 9, y: 10 }, { x: 13, y: 12 },
    { x: 15, y: 15 }, { x: 24, y: 15 },
    { x: 25.5, y: 15.5 }, { x: 26, y: 17 },
    { x: 25.5, y: 18 }, { x: 24, y: 18.5 },
    { x: 9, y: 18.5 }, { x: 7, y: 17 }
  ],
  start: { x: 10, y: 20 },
  targetLaps: 1,
  crashPenalty: 3,
  finish: {
    id: 'finish', label: 'Start / finish',
    a: { x: 13, y: 18.5 }, b: { x: 13, y: 22 },
    direction: { x: 1, y: 0 }
  },
  checkpoints: [
    {
      id: 'east', label: 'East Hairpin Gate',
      a: { x: 26, y: 15.7 }, b: { x: 29.9, y: 15.7 },
      direction: { x: 0, y: -1 }
    },
    {
      id: 'south', label: 'Return Straight Gate',
      a: { x: 19, y: 10 }, b: { x: 19, y: 15 },
      direction: { x: -1, y: 0 }
    },
    {
      id: 'west', label: 'West Sweep Gate',
      a: { x: 2, y: 16 }, b: { x: 7, y: 16 },
      direction: { x: 0, y: 1 }
    }
  ],
  featuredHairpin: {
    approach: { xMin: 10, xMax: 24, y: 20 },
    nose: { x: 28, y: 17 },
    returnLine: { xMin: 19, xMax: 25, y: 12 },
    minVisibleClearance: 1.0
  }
};


/**
 * Intermediate 2 — Twin Routes.
 *
 * A long, low glacier DIVIDER makes a meaningful decision on the upper
 * eastbound straight. The INNER (southern) shortcut is shorter, but only about
 * 3 world units wide; the OUTER (northern) detour is about 4.7 units wide and
 * asks the player to spend extra turns/distance bending around the divider.
 * Both lanes reconnect before the east checkpoint.
 *
 * This develops route choice and momentum management. It is intentionally
 * different from Beginner 2's single small rock: the divider runs for about
 * 9 units, the racing lines have visibly different widths, and QA provides two
 * completed routes with distinct turn counts and safe width requirements.
 *
 * Polygon obstacles are the same exact collision geometry used to paint the
 * glacier; no new physics, friction, wind or boost rules.
 */
export const TWIN_ROUTES = {
  id: 'twin-routes',
  name: 'Twin Routes',
  subtitle: 'Arctic Series / Circuit 06',
  level: 'INTERMEDIATE 2',
  tagline: 'Short inner line · Wide outer detour',
  menuHint: 'Choose the tighter shortcut or the wider scenic line',
  outer: [
    { x: 2, y: 8 }, { x: 7, y: 3 }, { x: 24, y: 3 },
    { x: 30, y: 8 }, { x: 31, y: 17 }, { x: 30, y: 22 },
    { x: 26, y: 25 }, { x: 14, y: 26.3 },
    { x: 8, y: 25.5 }, { x: 3, y: 22 },
    { x: 2, y: 17 }
  ],
  inner: [
    { x: 7, y: 11 }, { x: 10, y: 8 }, { x: 21, y: 8 },
    { x: 25, y: 11 }, { x: 25, y: 14 },
    { x: 24, y: 16 }, { x: 23, y: 16 },
    { x: 12, y: 15 }, { x: 9, y: 16 }, { x: 7, y: 15 }
  ],
  obstacles: [
    {
      id: 'glacier-divider',
      label: 'Glacier Divider',
      artStyle: 'glacial-divider',
      polygon: [
        { x: 13.6, y: 19.15 }, { x: 14.4, y: 18.45 },
        { x: 21.8, y: 18.45 }, { x: 22.6, y: 19.15 },
        { x: 22.6, y: 20.8 }, { x: 21.8, y: 21.5 },
        { x: 14.4, y: 21.5 }, { x: 13.6, y: 20.8 }
      ]
    }
  ],
  start: { x: 9, y: 18 },
  targetLaps: 1,
  crashPenalty: 3,
  finish: {
    id: 'finish', label: 'Start / finish',
    a: { x: 12, y: 15 }, b: { x: 12, y: 25.7 },
    direction: { x: 1, y: 0 }
  },
  checkpoints: [
    {
      id: 'east', label: 'East Gate',
      a: { x: 26, y: 12.5 }, b: { x: 31, y: 12.5 },
      direction: { x: 0, y: -1 }
    },
    {
      id: 'south', label: 'South Gate',
      a: { x: 16, y: 3 }, b: { x: 16, y: 8 },
      direction: { x: -1, y: 0 }
    },
    {
      id: 'west', label: 'West Gate',
      a: { x: 2, y: 12.5 }, b: { x: 7, y: 12.5 },
      direction: { x: 0, y: 1 }
    }
  ],
  featuredFork: {
    dividerId: 'glacier-divider',
    xMin: 13.6, xMax: 22.6, middleX: 18,
    innerLineY: 17, outerLineY: 23.5,
    minShortClearance: 1.0, minWideClearance: 1.4
  }
};

export const CIRCUITS = Object.freeze([NORTHERN_LOOP, AURORA_SPLIT, FROST_CHICANE, NARROW_PASSAGE, HAIRPIN_HOLLOW, TWIN_ROUTES]);

export function getCircuit(id) {
  return CIRCUITS.find(circuit => circuit.id === id) ?? NORTHERN_LOOP;
}
