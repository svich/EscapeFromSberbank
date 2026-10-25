import { CONFIG } from '../config.js';

// Placement, hitboxes and jump heights derived from the art metadata at boot,
// so the art can change size without retuning the game.
export const metrics = {
  hero: null,
  obstacles: {},
  pickups: {},
  jump: null,
  anims: {}, // sprite key -> its first (looping) animation key
  variants: {}, // sprite key -> animation keys to pick from at random
};

const G = CONFIG.groundY;

// Hitbox bottom pinned to `feet`, so the drawn soles sit on the physics floor.
const toFeet = (b, feet) => ({ x: b.x, y: b.y, w: b.w, h: feet - b.y });

function heroMetrics(def) {
  const feet = def.feetY ?? def.body.y + def.body.h;
  const body = toFeet(def.body, feet);
  const slideBody = toFeet(def.slideBody ?? def.body, feet);
  return {
    frameW: def.w,
    frameH: def.h,
    body,
    slideBody,
    feet,
    standH: body.h,
    slideH: slideBody.h,
    originY: feet / def.h, // origin that puts the soles on a given y
  };
}

// `y` with `originX/originY` places the object; `top` is the hitbox top's
// height above the ground. Ground objects rest with the frame bottom on the floor.
function obstacleMetrics(type, def, hero) {
  const cfg = CONFIG.obstacles[type];
  const { w, h, body } = def;
  const base = { frameW: w, frameH: h, hitbox: body };

  if (def.circle) {
    // Rolls: origin at the ball's center so rotation doesn't wobble.
    const { x: cx, y: cy, r } = def.circle;
    return {
      ...base,
      circle: { r, x: cx - r, y: cy - r },
      rollRadius: r,
      originX: cx / w,
      originY: cy / h,
      y: G - (h - cy),
      top: h - cy + r,
    };
  }

  if (cfg.kind === 'slide') {
    // Hitbox bottom halfway between the sliding and the standing head, so a
    // slide always passes under it and standing always hits it.
    const gap = (hero.standH - hero.slideH) / 2;
    const clearance = hero.slideH + gap;
    return {
      ...base,
      originX: 0.5,
      originY: 0.5,
      y: G - clearance + h / 2 - (body.y + body.h),
      wobble: Math.max(0, gap * 0.5),
      top: clearance + body.h,
    };
  }

  return { ...base, originX: 0.5, originY: 1, y: G, top: h - body.y };
}

function pickupMetrics(def) {
  return { frameW: def.w, frameH: def.h, hitbox: def.body, h: def.body.h, centerOffset: def.body.y + def.body.h / 2 - def.h / 2 };
}

// y for a pickup whose hitbox center sits `height` px above the ground.
export function pickupY(kind, height) {
  return G - height - metrics.pickups[kind].centerOffset;
}

function deriveJump() {
  const P = CONFIG.player;
  const M = CONFIG.jumpMargins;
  const o = metrics.obstacles;
  const lows = ['elder', 'chair', 'logo'].filter((t) => o[t]).map((t) => o[t].top);
  const low = lows.length ? Math.max(...lows) : M.minAir;
  const tall = o.manager ? o.manager.top : low + 2 * M.overLow;

  let apex = P.jumpApex ?? Math.min(low + M.overLow, tall - M.underTall);
  if (apex < low + M.minClear) {
    console.warn(`[tuning] jump apex ${apex}px barely clears ${low}px obstacles; the manager (${tall}px) is too short to need a double jump.`);
    if (P.jumpApex == null) apex = low + M.minClear;
  }
  const extra = P.doubleJumpHeight ?? Math.max(M.minAir, tall + M.overTall - apex * 0.5);

  const g = P.gravity;
  const gFall = g * P.fallGravityMul;
  const v1 = Math.sqrt(2 * g * apex);
  const v2 = Math.sqrt(2 * g * extra);
  const single = v1 / g + Math.sqrt((2 * apex) / gFall);
  const double = v1 / g + v2 / g + Math.sqrt((2 * (apex + extra)) / gFall);
  return { apex, extra, v1, v2, single, double, low, tall };
}

export function computeMetrics(sprites) {
  metrics.hero = heroMetrics(sprites.hero);
  for (const type of Object.keys(CONFIG.obstacles)) {
    if (sprites[type]) metrics.obstacles[type] = obstacleMetrics(type, sprites[type], metrics.hero);
  }
  for (const kind of ['coffee', 'offer']) {
    if (sprites[kind]) metrics.pickups[kind] = pickupMetrics(sprites[kind]);
  }
  for (const [key, def] of Object.entries(sprites)) {
    const first = Object.keys(def.anims ?? {})[0];
    if (first && key !== 'hero') metrics.anims[key] = `${key}-${first}`;
    if (def.variants) metrics.variants[key] = Object.keys(def.anims).map((name) => `${key}-${name}`);
  }
  metrics.jump = deriveJump();
  if (import.meta.env?.DEV) {
    const j = metrics.jump;
    console.info(
      `[tuning] jump apex ${j.apex.toFixed(0)}px (+${j.extra.toFixed(0)}px air jump), ` +
        `tallest low obstacle ${j.low}px, manager ${j.tall}px, airtime ${j.single.toFixed(2)}s / ${j.double.toFixed(2)}s`,
    );
  }
  return metrics;
}

// Seconds a clear takes before (lead) and after (tail) the obstacle reaches the player.
export function clearTiming(type) {
  const T = CONFIG.spawn.timing;
  const kind = CONFIG.obstacles[type].kind;
  const j = metrics.jump;
  if (kind === 'slide') return { lead: T.slide.lead, tail: CONFIG.player.slideTime * T.slide.tailOfSlide };
  if (kind === 'double') return { lead: j.double * T.double.lead, tail: j.double * T.double.tail };
  return { lead: j.single * T.jump.lead, tail: j.single * T.jump.tail };
}
