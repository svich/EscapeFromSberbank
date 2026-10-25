// All gameplay tuning in one place. Units: px, px/s, seconds (s) or meters (m) as noted.
// Values were tuned on a 480x270 grid; SCALE maps them to the 1920x1080 canvas
// the vector art is drawn for. Hitboxes and placement come from the art
// metadata (see systems/metrics.js).
export const SCALE = 4;
const px = (v) => v * SCALE;

export const CONFIG = {
  width: px(480), // 1920
  height: px(270), // 1080
  groundY: px(230), // 920, floor top in game coordinates
  pxPerMeter: px(10),
  finishMeters: 3000,

  // World scroll speed (px/s), ramps linearly from start to end over the run.
  speed: { start: px(190), end: px(370) },

  zones: [
    {
      key: 'office',
      from: 0,
      title: 'Опенспейс',
      label: 'Офис',
      subtitle: 'Этаж 7. Сдаём квартальные KPI.',
      weights: { elder: 5, chair: 3, meeting: 3 },
    },
    {
      key: 'lobby',
      from: 1000,
      title: 'Холл',
      label: 'Холл',
      subtitle: 'Не смотри начальству в глаза.',
      weights: { elder: 2, chair: 3, meeting: 3, shelf: 4 },
    },
    {
      key: 'street',
      from: 2000,
      title: 'Улица',
      label: 'Улица',
      subtitle: 'До свободы 1000 м. Никаких стендапов.',
      weights: { elder: 2, chair: 2, meeting: 3, logo: 4 },
    },
  ],

  // Where she flies after finishing each zone (same order), see scenes/Flight.js.
  // Photos for each come from src/photos/<key>/.
  countries: [
    { key: 'serbia', name: 'Сербия', to: 'в Сербию', city: 'Белград' },
    { key: 'georgia', name: 'Грузия', to: 'в Грузию', city: 'Казбеги' },
    { key: 'turkey', name: 'Турция', to: 'в Турцию', city: 'Каппадокия' },
  ],

  // Parallax factors and the cross-fade between zone backgrounds.
  bg: { far: 0.2, mid: 0.5, floor: 1, fadeMs: 1600 },

  player: {
    x: px(90),
    gravity: px(1300),
    fallGravityMul: 1.35, // heavier on the way down, snappier arcs
    maxFall: px(800),
    // Jump heights in px. null = derived from obstacle hitboxes at boot:
    // the ground jump clears elder/chair/logo but not the shelf, the air
    // jump adds enough to get over the shelf.
    jumpApex: null,
    doubleJumpHeight: null,
    airJumps: 1,
    jumpCut: 0.45, // velocity multiplier when the jump button is released early
    minJumpTime: 0.08, // s of guaranteed rise before a release can cut the jump
    fastFall: px(560), // px/s, Down in the air
    coyoteTime: 0.09,
    jumpBuffer: 0.12,
    slideTime: 0.6, // keeps going while Down is held
    invulnTime: 1.0, // after the shield absorbs a hit
  },

  // speed: own speed toward the player on top of the scroll (px/s).
  // kind: what clears it (drives spawn gaps and pickup placement).
  obstacles: {
    elder: { unlockAt: 0, speed: px(18), kind: 'jump', hint: 'Прыгай!' },
    chair: { unlockAt: 250, speed: px(85), kind: 'jump', hint: 'Прыгай!' },
    meeting: { unlockAt: 550, speed: px(45), kind: 'slide', wobbleHz: 1.4, hint: 'Подкат!' },
    shelf: { unlockAt: 1000, speed: 0, kind: 'double', hint: 'Двойной прыжок!' },
    logo: { unlockAt: 2000, speed: px(115), kind: 'jump', hint: 'Прыгай!' },
  },

  // Margins used when deriving jump heights from hitboxes (px).
  jumpMargins: {
    overLow: px(30), // ground jump apex above the tallest low obstacle
    underTall: px(4), // ...but this far below the shelf's top
    minClear: px(6), // never less than this over low obstacles
    overTall: px(12), // air jump clears the shelf by this, from half apex
    minAir: px(30), // smallest air jump
  },

  spawn: {
    x: px(520), // spawn line, just off the right edge
    firstDelay: 2.2, // s until the first obstacle reaches the player
    horizon: 4, // s of obstacles planned ahead
    reaction: 0.25, // s of slack always left between two obstacles
    extraStart: 1.0, // max random extra slack at the start (s) ...
    extraEnd: 0.3, // ... easing down to this at the exit
    introBonus: 0.8, // extra slack before an obstacle type's first appearance
    finishRunway: 40, // m before the exit kept obstacle-free
    // How long a clear takes, as a share of the airtime: lead = before the
    // obstacle reaches the player, tail = after.
    timing: {
      jump: { lead: 0.45, tail: 0.6 },
      double: { lead: 0.5, tail: 0.55 },
      slide: { lead: 0.22, tailOfSlide: 0.75 },
    },
  },

  pickups: {
    coffeeScore: 10,
    lineChance: 0.6, // coffee row/arc in a free gap
    overChance: 0.45, // coffee above a jumpable obstacle
    underChance: 0.6, // coffee under a meeting
    spacing: 0.13, // s between coffees in a row
    chocolateFirstAt: 300, // m
    chocolateEvery: [500, 750], // m, random range between chocolates (extra lives)
    chocolateBonusCoffees: 5, // when grabbed while already holding one
    chocolateLift: px(5), // chocolate floats this far above the standing head
  },

  exit: { offset: px(110) }, // door stops this far past the player at the finish
  deathDelay: 1100, // ms from the hit to the game over screen
  fadeMs: 350,

  storage: {
    best: 'efs.bestDistance',
    bestScore: 'efs.bestScore',
    muted: 'efs.muted',
  },
};
