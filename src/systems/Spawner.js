import { CONFIG, SCALE } from '../config.js';
import { clearTiming, metrics } from './metrics.js';

const S = CONFIG.spawn;
const PK = CONFIG.pickups;
const PPM = CONFIG.pxPerMeter;

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const randRange = ([lo, hi]) => lo + Math.random() * (hi - lo);

export function zoneAt(meters) {
  let zone = 0;
  CONFIG.zones.forEach((z, i) => {
    if (meters >= z.from) zone = i;
  });
  return zone;
}

// Plans obstacles by *arrival time* at the player's x, then spawns each one
// early enough (given its own speed and the scroll) to arrive on schedule.
// Gaps are lead/tail of each clear plus reaction slack, so every pattern is
// clearable at any speed and fast objects never overtake slow ones.
export class Spawner {
  constructor(scene) {
    this.scene = scene;
    this.queue = []; // { kind: 'obstacle' | 'coffee' | 'offer', type?, arrival, height?, intro? }
    this.last = null; // last planned obstacle { type, arrival }
    this.introduced = new Set();
    this.recent = [];
    this.nextOfferAt = PK.offerFirstAt;
    this.done = false; // no more obstacles: the exit runway has been reached
    // Spawn line: off screen even for the widest sprite.
    const widest = Math.max(
      ...Object.values(metrics.obstacles).map((m) => m.frameW),
      ...Object.values(metrics.pickups).map((m) => m.frameW),
    );
    this.spawnX = Math.max(S.x, CONFIG.width + widest / 2 + 8 * SCALE);
  }

  // now: run time (s), speed: scroll (px/s), traveled: px.
  update(now, speed, traveled) {
    while (!this.done && (this.last ? this.last.arrival : now) < now + S.horizon) {
      this.planNext(now, speed, traveled);
    }
    const playerX = CONFIG.player.x;
    for (let i = this.queue.length - 1; i >= 0; i--) {
      const item = this.queue[i];
      const own = item.kind === 'obstacle' ? CONFIG.obstacles[item.type].speed : 0;
      const approach = speed + own;
      if (now < item.arrival - (this.spawnX - playerX) / approach) continue;
      this.queue.splice(i, 1);
      // Never pop in on screen, even after a hitch.
      const x = Math.max(playerX + (item.arrival - now) * approach, this.spawnX);
      if (item.kind === 'obstacle') this.scene.spawnObstacle(item.type, x, item.intro);
      else this.scene.spawnPickup(item.kind, x, item.height);
    }
  }

  planNext(now, speed, traveled) {
    const prev = this.last;
    const base = prev ? prev.arrival + clearTiming(prev.type).tail : now + S.firstDelay;
    const meters = (traveled + Math.max(0, base - now) * speed) / PPM;
    const runwayStart = CONFIG.finishMeters - S.finishRunway;
    if (meters > runwayStart) {
      this.done = true;
      return;
    }

    const { type, intro } = this.pickType(zoneAt(meters), meters);
    const difficulty = clamp(meters / CONFIG.finishMeters, 0, 1);
    const slack = (prev ? S.reaction : 0) + Math.random() * lerp(S.extraStart, S.extraEnd, difficulty) + (intro ? S.introBonus : 0);
    const arrival = base + clearTiming(type).lead + slack;
    if ((traveled + (arrival - now) * speed) / PPM > runwayStart) {
      this.done = true;
      return;
    }

    this.queue.push({ kind: 'obstacle', type, arrival, intro });
    this.planPickups(prev, { type, arrival }, meters);
    this.last = { type, arrival };
  }

  pickType(zone, meters) {
    const weights = CONFIG.zones[zone].weights;
    const unlocked = Object.keys(weights).filter((t) => metrics.obstacles[t] && meters >= CONFIG.obstacles[t].unlockAt);
    const fresh = unlocked.find((t) => !this.introduced.has(t));
    if (fresh) {
      this.introduced.add(fresh);
      return this.remember(fresh, true);
    }
    // No three of a kind in a row.
    const [a, b] = this.recent;
    let pool = a && a === b ? unlocked.filter((t) => t !== a) : unlocked;
    if (!pool.length) pool = unlocked;
    const total = pool.reduce((sum, t) => sum + weights[t], 0);
    let roll = Math.random() * total;
    for (const t of pool) {
      roll -= weights[t];
      if (roll <= 0) return this.remember(t, false);
    }
    return this.remember(pool[pool.length - 1], false);
  }

  remember(type, intro) {
    this.recent = [type, this.recent[0]];
    return { type, intro };
  }

  // Coffee rows in free gaps, coffee over/under obstacles, and job offers.
  planPickups(prev, next, meters) {
    const hero = metrics.hero;
    const jump = metrics.jump;
    const coffee = metrics.pickups.coffee;
    const offer = metrics.pickups.offer;
    const nextTiming = clearTiming(next.type);
    const freeStart = prev ? prev.arrival + clearTiming(prev.type).tail : next.arrival - nextTiming.lead - 1;
    const freeEnd = next.arrival - nextTiming.lead;
    const free = freeEnd - freeStart;
    const mid = (freeStart + freeEnd) / 2;
    const groundH = hero.slideH / 2; // collectible standing or sliding

    if (offer && meters >= this.nextOfferAt && free >= 0.6) {
      // Just above the standing head: needs a hop.
      this.queue.push({ kind: 'offer', arrival: mid, height: hero.standH + PK.offerLift + offer.h / 2 });
      this.nextOfferAt = meters + randRange(PK.offerEvery);
    } else if (coffee && free >= 0.75 && Math.random() < PK.lineChance) {
      const n = clamp(Math.floor((free - 0.25) / PK.spacing) + 1, 3, 6);
      const start = mid - ((n - 1) * PK.spacing) / 2;
      const arc = Math.random() < 0.5;
      for (let i = 0; i < n; i++) {
        const lift = arc ? Math.sin((Math.PI * i) / (n - 1)) * jump.apex * 1.3 : 0;
        this.queue.push({ kind: 'coffee', arrival: start + i * PK.spacing, height: groundH + lift });
      }
    }

    if (!coffee) return;
    const kind = CONFIG.obstacles[next.type].kind;
    const top = metrics.obstacles[next.type].top;
    if (kind === 'slide' && Math.random() < PK.underChance) {
      this.queue.push({ kind: 'coffee', arrival: next.arrival, height: groundH });
    } else if (kind !== 'slide' && Math.random() < PK.overChance) {
      // Reward for clearing it; kept within reach of the jump that clears it.
      const reach = hero.standH + jump.apex + (kind === 'double' ? jump.extra : 0);
      const height = Math.min(top + 4 * SCALE + coffee.h / 2, reach - coffee.h / 2 - 2 * SCALE);
      this.queue.push({ kind: 'coffee', arrival: next.arrival, height });
    }
  }
}
