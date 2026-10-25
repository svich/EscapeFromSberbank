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

  // World scroll speed (px/s) at the very start; each level ramps its own
  // speed range (zones[].speed) as its coin goal fills up.
  speed: { start: px(171) },

  // Levels, in order. coins: how many to collect to finish the level;
  // speed: scroll speed (px/s) from the level's start to its goal;
  // skin: the heroine's outfit (sprite prefix, default 'hero').

  zones: [
    {
      key: 'office',
      title: 'Опенспейс',
      label: 'Офис',
      subtitle: 'Этаж 7. Сдаём квартальные KPI.',
      coins: 50,
      speed: [px(171), px(225)],
      weights: { elder: 5, chair: 3 },
    },
    {
      key: 'backrooms',
      title: 'Хранилище',
      label: 'Хранилище',
      subtitle: 'Служебный этаж. Посторонним вход воспрещён.',
      coins: 75,
      speed: [px(185), px(220)],
      weights: { money: 4, safe: 3, shelf: 4 },
    },
    {
      key: 'street',
      title: 'Улица',
      label: 'Улица',
      subtitle: 'Собери на билет. Никаких стендапов.',
      coins: 100,
      speed: [px(180), px(212)],
      skin: 'heroWinter',
      weights: { worker: 4, snowball: 3, bigman: 3 },
    },
  ],

  // Where she flies after finishing each zone (same order), see scenes/Flight.js.
  // Photos for each come from src/photos/<key>/.
  countries: [
    { key: 'serbia', name: 'Сербия', to: 'в Сербию', city: 'Белград' },
    { key: 'georgia', name: 'Грузия', to: 'в Грузию', city: 'Казбеги' },
    { key: 'turkey', name: 'Турция', to: 'в Турцию', city: 'Каппадокия' },
  ],

  player: {
    x: px(90),
    gravity: px(1300),
    fallGravityMul: 1.35, // heavier on the way down, snappier arcs
    maxFall: px(800),
    // Jump heights in px. null = derived from obstacle hitboxes at boot:
    // the ground jump clears every 'jump' obstacle but not the shelf, the air
    // jump adds enough to get over the shelf.
    jumpApex: null,
    doubleJumpHeight: null,
    airJumps: 1,
    jumpCut: 0.45, // velocity multiplier when the jump button is released early
    minJumpTime: 0.08, // s of guaranteed rise before a release can cut the jump
    coyoteTime: 0.09,
    jumpBuffer: 0.12,
    invulnTime: 1.0, // after the shield absorbs a hit
  },

  // unlockAfter: s of run time before it can show up (zone weights pick where).
  // speed: own speed toward the player on top of the scroll (px/s).
  // kind: what clears it (drives spawn gaps and pickup placement).
  // ('flash': blind him with the phone flash and run through, or double jump).
  // fall: how she goes down on a hit: 'trip' onto her stomach, 'knock' back onto
  // her bottom (default: a hurt hop).
  obstacles: {
    elder: { unlockAfter: 0, speed: px(18), kind: 'jump', fall: 'trip', hint: 'Прыгай!' },
    chair: { unlockAfter: 13, speed: px(85), kind: 'jump', fall: 'trip', hint: 'Прыгай!' },
    worker: { unlockAfter: 0, speed: px(28), kind: 'jump', fall: 'trip', hint: 'Прыгай!' },
    money: { unlockAfter: 0, speed: 0, kind: 'jump', fall: 'trip', hint: 'Прыгай!' },
    safe: { unlockAfter: 0, speed: 0, kind: 'jump', fall: 'trip', hint: 'Прыгай!' },
    bigman: { unlockAfter: 0, speed: px(30), kind: 'flash', fall: 'knock', hint: 'Ослепи вспышкой!' },
    shelf: { unlockAfter: 0, speed: 0, kind: 'double', fall: 'knock', hint: 'Двойной прыжок!' },
    snowball: { unlockAfter: 0, speed: px(105), kind: 'jump', hint: 'Прыгай!' },
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
    extra: 0.9, // max random extra slack (s); constant, so coin rows don't thin out
    introBonus: 0.8, // extra slack before an obstacle type's first appearance
    // How long a clear takes, as a share of the airtime: lead = before the
    // obstacle reaches the player, tail = after.
    timing: {
      jump: { lead: 0.45, tail: 0.6 },
      double: { lead: 0.5, tail: 0.55 },
    },
  },

  pickups: {
    coinScore: 10,
    lineChance: 1, // coin row/arc in a free gap
    rowMax: 8, // coins in a row, at most
    overChance: 0.9, // coins over a prop (safe, money, shelf), never over enemies
    spacing: 0.13, // s between coins in a row
    chocolateFirstAt: 300, // m
    chocolateEvery: [500, 750], // m, random range between chocolates (extra lives)
    chocolateBonusCoins: 5, // when grabbed while already holding one
    chocolateLift: px(5), // chocolate and coffee float this far above the standing head
    coffeePerZone: 2, // dash power-ups per level, at most
    coffeeEvery: [9, 16], // s, random wait before each one (from the level start)
  },

  flash: { cooldown: 0.4 }, // s between phone flashes

  // Coffee dash: a sparkle trail and smashing through obstacles.
  dash: { time: 5 }, // s

  exit: { offset: px(110) }, // door stops this far past the player at the finish
  deathDelay: 1100, // ms from the hit to the game over screen
  downDelay: 1300, // ms from hitting the floor (trip / knock-back) to the game over screen
  fadeMs: 350,

  storage: {
    best: 'efs.bestDistance',
    bestScore: 'efs.bestScore',
    muted: 'efs.muted',
  },
};

// The heroine's outfit (sprite prefix) on a level.
export const skinForZone = (zone) => CONFIG.zones[zone].skin ?? 'hero';
