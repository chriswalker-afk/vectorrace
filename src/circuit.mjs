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


/**
 * Intermediate 3 — Glass Ice.
 *
 * A visually unique flared northern ice shelf invites the player to carry
 * speed towards an eastern hairpin. A SINGLE marked turquoise glass-ice patch
 * sits on that approach (x 17–26, y 18.6–22.2).
 *
 * Explicit deterministic rule: when the skimmer STARTS a turn in the patch
 * (boundary included), acceleration can change AT MOST ONE component. Four
 * diagonal inputs are unavailable; cardinal and coast inputs remain legal.
 * There is no random sliding, altered motion formula, or disguised friction.
 *
 * A carefully tested 24-move reference lap takes the eastward approach under
 * this restriction and maintains >=1.0 world units of whole-path clearance
 * from all snowbanks. Earlier courses contain no glassZones and use every
 * original acceleration unchanged.
 */
export const GLASS_ICE = {
  id: 'glass-ice',
  name: 'Glass Ice',
  subtitle: 'Arctic Series / Circuit 07',
  level: 'INTERMEDIATE 3',
  tagline: 'One marked low-grip zone · Plan braking early',
  menuHint: 'On glass ice, accelerate or brake in only one axis per turn',
  outer: [
    { x: 3, y: 8 }, { x: 7, y: 4 }, { x: 12, y: 6 },
    { x: 15, y: 10 }, { x: 24, y: 10 },
    { x: 27.5, y: 11.5 }, { x: 29.8, y: 14 },
    { x: 30, y: 17 }, { x: 29.4, y: 20.5 },
    { x: 26.5, y: 23 }, { x: 18, y: 23.4 },
    { x: 11, y: 22.8 }, { x: 7, y: 22.5 },
    { x: 3, y: 20 }, { x: 1.5, y: 17 }, { x: 2, y: 12 }
  ],
  inner: [
    { x: 7, y: 12 }, { x: 9, y: 10 }, { x: 13, y: 12 },
    { x: 15, y: 15 }, { x: 24, y: 15 },
    { x: 25.5, y: 15.5 }, { x: 26, y: 17 },
    { x: 25.5, y: 18 }, { x: 24, y: 18.5 },
    { x: 9, y: 18.5 }, { x: 7, y: 17 }
  ],
  glassZones: [
    {
      id: 'northern-glass',
      label: 'Glass Ice',
      rule: 'axis-only',
      polygon: [
        { x: 17, y: 18.6 }, { x: 26, y: 18.6 },
        { x: 26, y: 22.2 }, { x: 17, y: 22.2 }
      ]
    }
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
      id: 'east', label: 'East Glass Gate',
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
  featuredGlass: {
    zoneId: 'northern-glass',
    xMin: 17, xMax: 26, yMin: 18.6, yMax: 22.2,
    entryRule: 'State position at start of each turn, including boundary',
    minVisibleClearance: 1.0
  }
};


/**
 * Intermediate 4 — Crosswind Ridge.
 *
 * First deterministic EXTERNAL FORCE. A single marked crosswind band
 * straddles the upper eastbound straight and blows SOUTH with w=(0,-1).
 * A turn STARTING inside the band (painted edge included) applies
 *
 *    v_next = v + a + w,     p_next = p + v_next.
 *
 * There is no random gust, extra friction or hidden movement. Outside the
 * band, w=(0,0). All nine accelerations remain available. The broad windward
 * snow shelf provides >1.0 unit of full skimmer clearance in a tested 24-move
 * lap that deliberately counters the crosswind on three successive turns.
 *
 * The new terrain has a raised/wavy northern ridge and a broader returning
 * bend; no older geometry or local-best keys are changed.
 */
export const CROSSWIND_RIDGE = {
  id: 'crosswind-ridge',
  name: 'Crosswind Ridge',
  subtitle: 'Arctic Series / Circuit 08',
  level: 'INTERMEDIATE 4',
  tagline: 'Southward wind · Counter the drift',
  menuHint: 'The southward wind vector (0, −1) is added to velocity each turn',
  outer: [
    { x: 3, y: 8 }, { x: 6.8, y: 3.6 },
    { x: 12, y: 5.2 }, { x: 15.4, y: 9.8 },
    { x: 24.4, y: 9.5 }, { x: 27.6, y: 11.3 },
    { x: 30.4, y: 14 }, { x: 30.4, y: 17 },
    { x: 29.6, y: 21 }, { x: 26.8, y: 24.4 },
    { x: 20, y: 24.8 }, { x: 15.5, y: 24.5 },
    { x: 10.4, y: 23.7 }, { x: 6.9, y: 23.2 },
    { x: 3, y: 20.1 }, { x: 1.5, y: 16.8 }, { x: 2, y: 12 }
  ],
  inner: [
    { x: 7, y: 12 }, { x: 9, y: 10 }, { x: 13, y: 12 },
    { x: 15, y: 15 }, { x: 24, y: 15 },
    { x: 25.5, y: 15.5 }, { x: 26, y: 17 },
    { x: 25.5, y: 18 }, { x: 24, y: 18.5 },
    { x: 9, y: 18.5 }, { x: 7, y: 17 }
  ],
  windZones: [
    {
      id: 'ridge-crosswind',
      label: 'Southward Crosswind',
      vector: { x: 0, y: -1 },
      polygon: [
        { x: 17, y: 18.65 }, { x: 26, y: 18.65 },
        { x: 26, y: 24.2 }, { x: 17, y: 24.2 }
      ]
    }
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
      id: 'east', label: 'East Wind Gate',
      a: { x: 26, y: 15.7 }, b: { x: 29.9, y: 15.7 },
      direction: { x: 0, y: -1 }
    },
    {
      id: 'south', label: 'Return Straight Gate',
      a: { x: 19, y: 9.5 }, b: { x: 19, y: 15 },
      direction: { x: -1, y: 0 }
    },
    {
      id: 'west', label: 'West Ridge Gate',
      a: { x: 2, y: 16 }, b: { x: 7, y: 16 },
      direction: { x: 0, y: 1 }
    }
  ],
  featuredWind: {
    zoneId: 'ridge-crosswind',
    vector: { x: 0, y: -1 },
    xMin: 17, xMax: 26,
    yMin: 18.65, yMax: 24.2,
    entryRule: 'Start-of-turn position (border included)',
    minVisibleClearance: 1.0
  }
};

/**
 * Advanced 1 — Icebound Rapids, the first course in Ember Rift.
 *
 * Two copper acceleration strips add a known +2 vector ALONG THE TRACK:
 * east on the northern straight, west on the lower return. Unlike the
 * Crosswind Ridge field, even maximum counter-acceleration (-1/+1) cannot
 * completely cancel a +2 boost. Racers must regulate speed before a pad.
 *
 * A strip fires only when the skimmer STARTS its turn on its painted polygon,
 * including its boundary. Crossing a strip without landing is not a trigger.
 * Both strips remain legal roadway, using their exact physics polygons for art.
 * A tested 23-turn lap engages both strips and retains >=1.2 world units of
 * whole-path centreline clearance from the basalt banks.
 *
 * Earlier courses have no boostZones and retain unchanged physics and records.
 */
export const ICEBOUND_RAPIDS = {
  id: 'icebound-rapids',
  name: 'Icebound Rapids',
  subtitle: 'Arctic Series / Circuit 09',
  level: 'ADVANCED 1',
  tagline: 'Twin boost strips · Brake before the surge',
  menuHint: 'Copper strips add boost vectors (2, 0) east and (−2, 0) west',
  outer: [
    { x: 3, y: 8 }, { x: 6.5, y: 3.2 },
    { x: 11.5, y: 4.1 }, { x: 15.3, y: 8.2 },
    { x: 22.7, y: 8 }, { x: 26.4, y: 9.7 },
    { x: 29.4, y: 12 }, { x: 31.2, y: 15.4 },
    { x: 30.7, y: 18.4 }, { x: 28.4, y: 22.8 },
    { x: 25.6, y: 24.8 }, { x: 21.5, y: 25.1 },
    { x: 18, y: 24.3 }, { x: 15, y: 25.1 },
    { x: 10.2, y: 24.6 }, { x: 6.5, y: 22.8 },
    { x: 3.3, y: 20.5 }, { x: 1.5, y: 16.8 },
    { x: 1.9, y: 12 }
  ],
  inner: [
    { x: 7.1, y: 12 }, { x: 9.2, y: 10.2 },
    { x: 12.4, y: 11.8 }, { x: 15.5, y: 14.6 },
    { x: 24.3, y: 14.9 }, { x: 25.9, y: 15.9 },
    { x: 26.3, y: 17.2 }, { x: 25.5, y: 18.1 },
    { x: 23.5, y: 18.3 }, { x: 17, y: 18.1 },
    { x: 12.2, y: 18.7 }, { x: 9, y: 18.3 },
    { x: 7.1, y: 17 }
  ],
  boostZones: [
    {
      id: 'east-rapids',
      label: 'Eastbound boost vector (2, 0)',
      vector: { x: 2, y: 0 },
      polygon: [
        { x: 15.5, y: 18.8 }, { x: 19.5, y: 18.8 },
        { x: 19.5, y: 24.1 }, { x: 15.5, y: 24.1 }
      ]
    },
    {
      id: 'west-rapids',
      label: 'Westbound boost vector (−2, 0)',
      vector: { x: -2, y: 0 },
      polygon: [
        { x: 13.5, y: 8.8 }, { x: 17.5, y: 8.8 },
        { x: 17.5, y: 11.3 }, { x: 13.5, y: 11.3 }
      ]
    }
  ],
  start: { x: 9, y: 21 },
  targetLaps: 1,
  crashPenalty: 3,
  finish: {
    id: 'finish', label: 'Start / finish',
    a: { x: 13, y: 18.7 }, b: { x: 13, y: 24.8 },
    direction: { x: 1, y: 0 }
  },
  checkpoints: [
    {
      id: 'east', label: 'East Rapids Gate',
      a: { x: 26.3, y: 15.7 }, b: { x: 31, y: 15.7 },
      direction: { x: 0, y: -1 }
    },
    {
      id: 'south', label: 'South Return Gate',
      a: { x: 19, y: 8.1 }, b: { x: 19, y: 14.6 },
      direction: { x: -1, y: 0 }
    },
    {
      id: 'west', label: 'West Rift Gate',
      a: { x: 2, y: 16 }, b: { x: 7.1, y: 16 },
      direction: { x: 0, y: 1 }
    }
  ],
  featuredBoosts: {
    stripIds: ['east-rapids', 'west-rapids'],
    entryRule: 'Start-of-turn position (painted edge included)',
    magnitude: 2,
    minVisibleClearance: 1.0
  }
};

/**
 * Advanced 2 — Broken Passage (Ember Rift).
 *
 * Two visible basalt slabs shuttle vertically across the upper approach
 * and lower return on a COMMON, fully published six-turn oscillator.
 * Each player's GLIDE advances the hazards exactly one cycle position;
 * they glide linearly during the same move rather than teleporting between
 * cells. The skimmer must avoid the ENTIRE simultaneous motion of the
 * slabs, not merely their final centres. A crash still advances the clock.
 *
 * This introduces ONE mechanic (turn-indexed moving obstacles) and purposely
 * has NO glass ice, wind or boosts. Frozen Gauntlet will combine mechanics.
 * The 24-turn whole-segment-clear QA route navigates BOTH active crossings.
 */
export const BROKEN_PASSAGE = {
  id: 'broken-passage',
  name: 'Broken Passage',
  subtitle: 'Arctic Series / Circuit 10',
  level: 'ADVANCED 2',
  tagline: 'Two moving basalt slabs · Read the six-turn rhythm',
  menuHint: 'Both moving obstacles follow the same six-step cycle. Every glide moves them.',
  outer: [
    { x: 3, y: 8 }, { x: 6.3, y: 3.5 }, { x: 11, y: 4.5 },
    { x: 14.8, y: 8.4 }, { x: 23, y: 7.9 },
    { x: 26.2, y: 9.6 }, { x: 29.6, y: 12.2 },
    { x: 31, y: 15.4 }, { x: 30.4, y: 18.6 },
    { x: 27.8, y: 22.9 }, { x: 25.2, y: 24.7 },
    { x: 22.6, y: 25.2 }, { x: 20.3, y: 24.4 },
    { x: 17.7, y: 25 }, { x: 14.6, y: 24.6 },
    { x: 11, y: 24.4 }, { x: 6.2, y: 22.9 },
    { x: 3.1, y: 20.2 }, { x: 1.5, y: 16.8 },
    { x: 1.9, y: 12 }
  ],
  inner: [
    { x: 7.1, y: 12 }, { x: 9.2, y: 10.2 },
    { x: 12.4, y: 11.8 }, { x: 15.5, y: 14.6 },
    { x: 24.3, y: 14.9 }, { x: 25.9, y: 15.9 },
    { x: 26.3, y: 17.2 }, { x: 25.5, y: 18.1 },
    { x: 23.5, y: 18.3 }, { x: 21.1, y: 18.5 },
    { x: 18.6, y: 18.2 }, { x: 17, y: 18.8 },
    { x: 12.2, y: 18.7 }, { x: 9, y: 18.3 },
    { x: 7.1, y: 17 }
  ],
  movingObstacles: [
    {
      id: 'north-shuttle',
      label: 'North Basalt Slab',
      radius: 0.55,
      positions: [
        { x: 20.5, y: 19.7 }, { x: 20.5, y: 20.7 },
        { x: 20.5, y: 21.8 }, { x: 20.5, y: 22.8 },
        { x: 20.5, y: 21.8 }, { x: 20.5, y: 20.7 }
      ]
    },
    {
      id: 'south-shuttle',
      label: 'Return Basalt Slab',
      radius: 0.55,
      positions: [
        { x: 18, y: 9.7 }, { x: 18, y: 10.8 },
        { x: 18, y: 12.0 }, { x: 18, y: 12.8 },
        { x: 18, y: 12.0 }, { x: 18, y: 10.8 }
      ]
    }
  ],
  start: { x: 9, y: 21 },
  targetLaps: 1,
  crashPenalty: 3,
  finish: {
    id: 'finish', label: 'Start / finish',
    a: { x: 13, y: 18.7 }, b: { x: 13, y: 24.8 },
    direction: { x: 1, y: 0 }
  },
  checkpoints: [
    {
      id: 'east', label: 'East Break Gate',
      a: { x: 26.3, y: 15.7 }, b: { x: 31, y: 15.7 },
      direction: { x: 0, y: -1 }
    },
    {
      id: 'south', label: 'Return Break Gate',
      a: { x: 19, y: 8 }, b: { x: 19, y: 14.6 },
      direction: { x: -1, y: 0 }
    },
    {
      id: 'west', label: 'West Basalt Gate',
      a: { x: 2, y: 16 }, b: { x: 7.1, y: 16 },
      direction: { x: 0, y: 1 }
    }
  ],
  featuredMotion: {
    period: 6,
    rule: 'One cycle transition per attempted GLIDE, including crashes',
    collision: 'Simultaneous linear sweep, with 0.8 skimmer half-width',
    minBankClearance: 1.0
  }
};

/**
 * Advanced 3 / Ember Rift: combine existing wind, Glass Ice, boost and
 * moving basalt rules without adding new force or collision physics.
 * A northern field applies wind (0,-1) AND one-axis glass restriction from
 * the same polygon on turn start. A westward (-2,0) return boost intersects
 * the public six-phase moving slab corridor; separate glass ice follows.
 * Exact original geometry and records of circuits 01–10 are untouched.
 */
export const FROZEN_GAUNTLET = {
  "id": "frozen-gauntlet",
  "name": "Frozen Gauntlet",
  "subtitle": "Arctic Series / Circuit 11",
  "level": "ADVANCED 3",
  "tagline": "Coupled Glass + Wind · Boost + Moving Basalt",
  "menuHint": "Coupled glass and wind, then a timed westbound boost and moving basalt",
  "outer": [
    {
      "x": 3,
      "y": 8
    },
    {
      "x": 6.3,
      "y": 3.5
    },
    {
      "x": 11.6,
      "y": 4
    },
    {
      "x": 15,
      "y": 7.7
    },
    {
      "x": 23,
      "y": 7.9
    },
    {
      "x": 26.2,
      "y": 9.6
    },
    {
      "x": 29.6,
      "y": 12.2
    },
    {
      "x": 31,
      "y": 15.4
    },
    {
      "x": 31.3,
      "y": 19
    },
    {
      "x": 27.8,
      "y": 22.9
    },
    {
      "x": 25.4,
      "y": 25.1
    },
    {
      "x": 22.8,
      "y": 25.25
    },
    {
      "x": 20.3,
      "y": 24.4
    },
    {
      "x": 17.7,
      "y": 25.2
    },
    {
      "x": 14.6,
      "y": 24.6
    },
    {
      "x": 11,
      "y": 24.65
    },
    {
      "x": 6.2,
      "y": 22.9
    },
    {
      "x": 3.1,
      "y": 20.2
    },
    {
      "x": 1.5,
      "y": 16.8
    },
    {
      "x": 1.9,
      "y": 12
    }
  ],
  "inner": [
    {
      "x": 7.1,
      "y": 12
    },
    {
      "x": 9.2,
      "y": 10.2
    },
    {
      "x": 12.4,
      "y": 11.8
    },
    {
      "x": 15.5,
      "y": 14.6
    },
    {
      "x": 24.3,
      "y": 14.9
    },
    {
      "x": 25.9,
      "y": 15.9
    },
    {
      "x": 26.3,
      "y": 17.2
    },
    {
      "x": 25.5,
      "y": 18.1
    },
    {
      "x": 23.5,
      "y": 18.3
    },
    {
      "x": 21.1,
      "y": 17.8
    },
    {
      "x": 18.6,
      "y": 17.5
    },
    {
      "x": 17,
      "y": 18.2
    },
    {
      "x": 12.2,
      "y": 18.7
    },
    {
      "x": 9,
      "y": 18.3
    },
    {
      "x": 7.1,
      "y": 17
    }
  ],
  "movingObstacles": [
    {
      "id": "north-gauntlet-slab",
      "label": "Upper Gauntlet Slab",
      "radius": 0.55,
      "positions": [
        {
          "x": 20.5,
          "y": 19.7
        },
        {
          "x": 20.5,
          "y": 20.7
        },
        {
          "x": 20.5,
          "y": 21.8
        },
        {
          "x": 20.5,
          "y": 22.8
        },
        {
          "x": 20.5,
          "y": 21.8
        },
        {
          "x": 20.5,
          "y": 20.7
        }
      ]
    },
    {
      "id": "return-gauntlet-slab",
      "label": "Return Gauntlet Slab",
      "radius": 0.55,
      "positions": [
        {
          "x": 18,
          "y": 9.7
        },
        {
          "x": 18,
          "y": 10.8
        },
        {
          "x": 18,
          "y": 12
        },
        {
          "x": 18,
          "y": 12.8
        },
        {
          "x": 18,
          "y": 12
        },
        {
          "x": 18,
          "y": 10.8
        }
      ]
    }
  ],
  "start": {
    "x": 9,
    "y": 21
  },
  "targetLaps": 1,
  "crashPenalty": 3,
  "finish": {
    "id": "finish",
    "label": "Start / finish",
    "a": {
      "x": 13,
      "y": 18.7
    },
    "b": {
      "x": 13,
      "y": 24.8
    },
    "direction": {
      "x": 1,
      "y": 0
    }
  },
  "checkpoints": [
    {
      "id": "east",
      "label": "East Gauntlet Gate",
      "a": {
        "x": 26.3,
        "y": 15.7
      },
      "b": {
        "x": 31,
        "y": 15.7
      },
      "direction": {
        "x": 0,
        "y": -1
      }
    },
    {
      "id": "south",
      "label": "Return Gauntlet Gate",
      "a": {
        "x": 19,
        "y": 8
      },
      "b": {
        "x": 19,
        "y": 14.6
      },
      "direction": {
        "x": -1,
        "y": 0
      }
    },
    {
      "id": "west",
      "label": "West Gauntlet Gate",
      "a": {
        "x": 2,
        "y": 16
      },
      "b": {
        "x": 7.1,
        "y": 16
      },
      "direction": {
        "x": 0,
        "y": 1
      }
    }
  ],
  "featuredMotion": {
    "period": 6,
    "rule": "One step per attempted GLIDE, including crashes",
    "collision": "Simultaneous linear sweep, 0.8 car half-width",
    "minBankClearance": 1
  },
  "glassZones": [
    {
      "id": "gauntlet-glass-and-wind",
      "label": "Glass + Crosswind",
      "rule": "axis-only",
      "polygon": [
        {
          "x": 12.6,
          "y": 18.9
        },
        {
          "x": 21.6,
          "y": 18.9
        },
        {
          "x": 21.6,
          "y": 23.8
        },
        {
          "x": 12.6,
          "y": 23.8
        }
      ]
    },
    {
      "id": "return-glass",
      "label": "Return Glass Ice",
      "rule": "axis-only",
      "polygon": [
        {
          "x": 12.8,
          "y": 7.95
        },
        {
          "x": 18.6,
          "y": 7.95
        },
        {
          "x": 18.6,
          "y": 12
        },
        {
          "x": 12.8,
          "y": 12
        }
      ]
    }
  ],
  "windZones": [
    {
      "id": "gauntlet-southwind",
      "label": "Coupled Southwind",
      "vector": {
        "x": 0,
        "y": -1
      },
      "polygon": [
        {
          "x": 12.6,
          "y": 18.9
        },
        {
          "x": 21.6,
          "y": 18.9
        },
        {
          "x": 21.6,
          "y": 23.8
        },
        {
          "x": 12.6,
          "y": 23.8
        }
      ]
    }
  ],
  "boostZones": [
    {
      "id": "gauntlet-west-boost",
      "label": "West return boost vector (−2, 0)",
      "vector": {
        "x": -2,
        "y": 0
      },
      "polygon": [
        {
          "x": 20.9,
          "y": 8.8
        },
        {
          "x": 24.2,
          "y": 8.8
        },
        {
          "x": 24.2,
          "y": 12.4
        },
        {
          "x": 20.9,
          "y": 12.4
        }
      ]
    }
  ],
  "featuredGauntlet": {
    "pairedGlassId": "gauntlet-glass-and-wind",
    "pairedWindId": "gauntlet-southwind",
    "boostId": "gauntlet-west-boost",
    "returnGlassId": "return-glass",
    "hazardPeriod": 6,
    "stageOrder": [
      "Glass + Crosswind",
      "Upper moving slab",
      "Boost + Return moving slab",
      "Return Glass Ice"
    ],
    "minVisibleBankClearance": 1
  }
};

/**
 * Expert finale — Arctic Grand Prix / Eclipse Summit.
 *
 * A genuinely distinct two-lap, full-width jagged mountain circuit. It
 * combines only previously taught vector rules: shared single-axis glass +
 * south wind on the northern run, two basalt shuttles, a third smaller
 * deterministic eastern sentinel, a (-2,0) west return boost and Glass Ice
 * braking. All three rocks follow visible six-step cycles and move on GLIDE,
 * including crashes. Phase and momentum persist across lap 1 → lap 2.
 *
 * An explicitly reconstructed 50-turn zero-crash race passes six ordered
 * checkpoint gates, with whole-path bank margin >=1.42 world units and
 * extra moving-rock hitbox clearance >=0.45 world units; expert students
 * can find quicker lines. Nothing modifies the older eleven circuits.
 */
export const ARCTIC_GRAND_PRIX = {
  "id": "arctic-grand-prix",
  "name": "Arctic Grand Prix",
  "subtitle": "Eclipse Cup / Final Circuit 12",
  "level": "EXPERT 1",
  "tagline": "Two-lap championship · Three moving sentinels",
  "menuHint": "Two laps: glass and wind, forced boost, and three timed Eclipse sentinels",
  "outer": [
    {
      "x": 2.2,
      "y": 8.3
    },
    {
      "x": 5.8,
      "y": 3.2
    },
    {
      "x": 11.2,
      "y": 3.1
    },
    {
      "x": 14.8,
      "y": 6.9
    },
    {
      "x": 23.8,
      "y": 7.1
    },
    {
      "x": 28.7,
      "y": 9
    },
    {
      "x": 31.7,
      "y": 12
    },
    {
      "x": 32.5,
      "y": 15.1
    },
    {
      "x": 33,
      "y": 18.8
    },
    {
      "x": 28.6,
      "y": 23.6
    },
    {
      "x": 26.2,
      "y": 25.2
    },
    {
      "x": 23.1,
      "y": 25.3
    },
    {
      "x": 20.4,
      "y": 24.9
    },
    {
      "x": 17.6,
      "y": 25.2
    },
    {
      "x": 14.7,
      "y": 25
    },
    {
      "x": 10.1,
      "y": 25.1
    },
    {
      "x": 5.7,
      "y": 23.7
    },
    {
      "x": 2.9,
      "y": 20.9
    },
    {
      "x": 1.1,
      "y": 17.2
    },
    {
      "x": 1.2,
      "y": 11.8
    }
  ],
  "inner": [
    {
      "x": 7.8,
      "y": 12.3
    },
    {
      "x": 9.7,
      "y": 10.7
    },
    {
      "x": 12.7,
      "y": 12.2
    },
    {
      "x": 16.1,
      "y": 15.2
    },
    {
      "x": 24.6,
      "y": 15.5
    },
    {
      "x": 26,
      "y": 16.3
    },
    {
      "x": 26.1,
      "y": 17.2
    },
    {
      "x": 25.1,
      "y": 17.7
    },
    {
      "x": 23.1,
      "y": 17.9
    },
    {
      "x": 21.4,
      "y": 17.25
    },
    {
      "x": 18.5,
      "y": 16.7
    },
    {
      "x": 16.8,
      "y": 17.65
    },
    {
      "x": 12.5,
      "y": 18
    },
    {
      "x": 9.2,
      "y": 17.75
    },
    {
      "x": 7.8,
      "y": 16.5
    }
  ],
  "movingObstacles": [
    {
      "id": "eclipse-north-slab",
      "label": "Northern Eclipse Sentinel",
      "radius": 0.55,
      "positions": [
        {
          "x": 20.5,
          "y": 19.7
        },
        {
          "x": 20.5,
          "y": 20.7
        },
        {
          "x": 20.5,
          "y": 21.8
        },
        {
          "x": 20.5,
          "y": 22.8
        },
        {
          "x": 20.5,
          "y": 21.8
        },
        {
          "x": 20.5,
          "y": 20.7
        }
      ]
    },
    {
      "id": "eclipse-return-slab",
      "label": "Return Eclipse Sentinel",
      "radius": 0.55,
      "positions": [
        {
          "x": 18,
          "y": 9.7
        },
        {
          "x": 18,
          "y": 10.8
        },
        {
          "x": 18,
          "y": 12
        },
        {
          "x": 18,
          "y": 12.8
        },
        {
          "x": 18,
          "y": 12
        },
        {
          "x": 18,
          "y": 10.8
        }
      ]
    },
    {
      "id": "eclipse-east-sentinel",
      "label": "Eastern Eclipse Sentinel",
      "radius": 0.42,
      "positions": [
        {
          "x": 29.7,
          "y": 11.2
        },
        {
          "x": 29.7,
          "y": 12
        },
        {
          "x": 29.7,
          "y": 12.8
        },
        {
          "x": 29.7,
          "y": 13.6
        },
        {
          "x": 29.7,
          "y": 12.8
        },
        {
          "x": 29.7,
          "y": 12
        }
      ]
    }
  ],
  "start": {
    "x": 9,
    "y": 21
  },
  "targetLaps": 2,
  "crashPenalty": 3,
  "finish": {
    "id": "finish",
    "label": "Eclipse Cup Finish",
    "a": {
      "x": 11,
      "y": 18.7
    },
    "b": {
      "x": 11,
      "y": 24.8
    },
    "direction": {
      "x": 1,
      "y": 0
    }
  },
  "checkpoints": [
    {
      "id": "east",
      "label": "Eclipse East Gate",
      "a": {
        "x": 26.3,
        "y": 15.7
      },
      "b": {
        "x": 31,
        "y": 15.7
      },
      "direction": {
        "x": 0,
        "y": -1
      }
    },
    {
      "id": "south",
      "label": "Eclipse Return Gate",
      "a": {
        "x": 19,
        "y": 8
      },
      "b": {
        "x": 19,
        "y": 14.6
      },
      "direction": {
        "x": -1,
        "y": 0
      }
    },
    {
      "id": "west",
      "label": "Eclipse West Gate",
      "a": {
        "x": 2,
        "y": 16
      },
      "b": {
        "x": 7.1,
        "y": 16
      },
      "direction": {
        "x": 0,
        "y": 1
      }
    }
  ],
  "featuredMotion": {
    "period": 6,
    "rule": "One step per attempted GLIDE, including crashes",
    "collision": "Simultaneous linear sweep, 0.8 car half-width",
    "minBankClearance": 1
  },
  "glassZones": [
    {
      "id": "eclipse-glass-wind",
      "label": "Eclipse Glass + Crosswind",
      "rule": "axis-only",
      "polygon": [
        {
          "x": 12.6,
          "y": 18.9
        },
        {
          "x": 21.6,
          "y": 18.9
        },
        {
          "x": 21.6,
          "y": 23.8
        },
        {
          "x": 12.6,
          "y": 23.8
        }
      ]
    },
    {
      "id": "eclipse-return-glass",
      "label": "Eclipse Return Glass",
      "rule": "axis-only",
      "polygon": [
        {
          "x": 12.8,
          "y": 7.95
        },
        {
          "x": 18.6,
          "y": 7.95
        },
        {
          "x": 18.6,
          "y": 12
        },
        {
          "x": 12.8,
          "y": 12
        }
      ]
    }
  ],
  "windZones": [
    {
      "id": "eclipse-southwind",
      "label": "Eclipse Southwind",
      "vector": {
        "x": 0,
        "y": -1
      },
      "polygon": [
        {
          "x": 12.6,
          "y": 18.9
        },
        {
          "x": 21.6,
          "y": 18.9
        },
        {
          "x": 21.6,
          "y": 23.8
        },
        {
          "x": 12.6,
          "y": 23.8
        }
      ]
    }
  ],
  "boostZones": [
    {
      "id": "eclipse-west-boost",
      "label": "Eclipse west boost vector (−2, 0)",
      "vector": {
        "x": -2,
        "y": 0
      },
      "polygon": [
        {
          "x": 20.9,
          "y": 8.8
        },
        {
          "x": 24.2,
          "y": 8.8
        },
        {
          "x": 24.2,
          "y": 12.4
        },
        {
          "x": 20.9,
          "y": 12.4
        }
      ]
    }
  ],
  "featuredGauntlet": {
    "pairedGlassId": "eclipse-glass-wind",
    "pairedWindId": "eclipse-southwind",
    "boostId": "eclipse-west-boost",
    "returnGlassId": "eclipse-return-glass",
    "hazardPeriod": 6,
    "stageOrder": [
      "Glass + Crosswind",
      "Upper Sentinel",
      "Eastern Sentinel",
      "Boost + Return Sentinel",
      "Return Glass Ice",
      "Final lap under changing phase"
    ],
    "minVisibleBankClearance": 1
  },
  "featuredGrandPrix": {
    "laps": 2,
    "rockCount": 3,
    "period": 6,
    "referenceMoves": 50,
    "phaseContinuesBetweenLaps": true,
    "bankMargin": 1.42,
    "hazardExtraClearance": 0.45,
    "region": "Eclipse Summit",
    "award": "Eclipse Cup"
  }
};

export const CIRCUITS = Object.freeze([NORTHERN_LOOP, AURORA_SPLIT, FROST_CHICANE, NARROW_PASSAGE, HAIRPIN_HOLLOW, TWIN_ROUTES, GLASS_ICE, CROSSWIND_RIDGE, ICEBOUND_RAPIDS, BROKEN_PASSAGE, FROZEN_GAUNTLET, ARCTIC_GRAND_PRIX]);

export function getCircuit(id) {
  return CIRCUITS.find(circuit => circuit.id === id) ?? NORTHERN_LOOP;
}
