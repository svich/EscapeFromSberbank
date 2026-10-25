import { CONFIG, SCALE } from '../config.js';
import { clearTiming, metrics } from './metrics.js';

const S = CONFIG.spawn;
const PK = CONFIG.pickups;
const PPM = CONFIG.pxPerMeter;

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const randRange = ([lo, hi]) => lo + Math.random() * (hi - lo);

// Plans obstacles by *arrival time* at the player's x, then spawns each one
// early enough (given its own speed and the scroll) to arrive on schedule.
// Gaps are lead/tail of each clear plus reaction slack, so every pattern is
// clearable at any speed and fast objects never overtake slow ones.
// Reads the level and run progress from the scene (zone, progress), and where
// the run starts (runTime, traveled: a retried level starts mid-run).
export class Spawner {
  constructor(scene) {
    this.scene = scene;
    this.queue = []; // { kind: 'obstacle' | 'coin' | 'coffee' | 'chocolate', type?, arrival, height?, intro? }
    this.last = null; // last planned obstacle { type, arrival }
    // Types met on earlier levels get no hint again.
    this.introduced = new Set(CONFIG.zones.slice(0, scene.zone).flatMap((z) => Object.keys(z.weights)));
    this.recent = [];
    this.nextChocolateAt = scene.traveled / PPM + PK.chocolateFirstAt;
    this.coffeeLeft = PK.coffeePerZone;
    this.nextCoffeeAt = scene.runTime + randRange(PK.coffeeEvery);
    this.done = false; // no more obstacles or pickups: the exit is open
    // Spawn line: off screen even for the widest sprite.
    const widest = Math.max(
      ...Object.values(metrics.obstacles).map((m) => m.frameW),
      ...Object.values(metrics.pickups).map((m) => m.frameW),
    );
    this.spawnX = Math.max(S.x, CONFIG.width + widest / 2 + 8 * SCALE);
  }

  // Drops everything planned (after a flight between zones): planning starts
  // over with the usual first-obstacle delay. now: run time (s).
  restart(now) {
    this.queue = [];
    this.last = null;
    this.recent = [];
    this.coffeeLeft = PK.coffeePerZone;
    this.nextCoffeeAt = now + randRange(PK.coffeeEvery);
    this.done = false;
  }

  stop() {
    this.queue = [];
    this.done = true;
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
    const { type, intro } = this.pickType(this.scene.zone, base);
    const difficulty = clamp(this.scene.progress, 0, 1);
    const slack = (prev ? S.reaction : 0) + Math.random() * lerp(S.extraStart, S.extraEnd, difficulty) + (intro ? S.introBonus : 0);
    const arrival = base + clearTiming(type).lead + slack;

    this.queue.push({ kind: 'obstacle', type, arrival, intro });
    this.planPickups(prev, { type, arrival }, meters);
    this.last = { type, arrival };
  }

  // time: run time (s) the obstacle is planned for.
  pickType(zone, time) {
    const weights = CONFIG.zones[zone].weights;
    const unlocked = Object.keys(weights).filter((t) => metrics.obstacles[t] && time >= CONFIG.obstacles[t].unlockAfter);
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

  // Coin rows in free gaps, coins over obstacles, chocolates and the
  // level's few coffees.
  planPickups(prev, next, meters) {
    const hero = metrics.hero;
    const jump = metrics.jump;
    const coin = metrics.pickups.coin;
    const coffee = metrics.pickups.coffee;
    const chocolate = metrics.pickups.chocolate;
    const nextTiming = clearTiming(next.type);
    const freeStart = prev ? prev.arrival + clearTiming(prev.type).tail : next.arrival - nextTiming.lead - 1;
    const freeEnd = next.arrival - nextTiming.lead;
    const free = freeEnd - freeStart;
    const mid = (freeStart + freeEnd) / 2;
    const groundH = hero.standH / 3; // picked up just by running

    // Chocolate and coffee float just above the standing head: they need a hop.
    if (chocolate && meters >= this.nextChocolateAt && free >= 0.6) {
      this.queue.push({ kind: 'chocolate', arrival: mid, height: hero.standH + PK.chocolateLift + chocolate.h / 2 });
      this.nextChocolateAt = meters + randRange(PK.chocolateEvery);
    } else if (coffee && this.coffeeLeft > 0 && mid >= this.nextCoffeeAt && free >= 0.6) {
      this.queue.push({ kind: 'coffee', arrival: mid, height: hero.standH + PK.chocolateLift + coffee.h / 2 });
      this.coffeeLeft -= 1;
      this.nextCoffeeAt = mid + randRange(PK.coffeeEvery);
    } else if (coin && free >= 0.75 && Math.random() < PK.lineChance) {
      const n = clamp(Math.floor((free - 0.25) / PK.spacing) + 1, 3, PK.rowMax);
      const start = mid - ((n - 1) * PK.spacing) / 2;
      const arc = Math.random() < 0.5;
      for (let i = 0; i < n; i++) {
        const lift = arc ? Math.sin((Math.PI * i) / (n - 1)) * jump.apex * 1.3 : 0;
        this.queue.push({ kind: 'coin', arrival: start + i * PK.spacing, height: groundH + lift });
      }
    }

    if (!coin) return;
    const kind = CONFIG.obstacles[next.type].kind;
    const top = metrics.obstacles[next.type].top;
    if (kind === 'flash') {
      // Right through him once he's blinded.
      if (Math.random() < PK.overChance) this.queue.push({ kind: 'coin', arrival: next.arrival, height: groundH });
    } else if (Math.random() < PK.overChance) {
      // Reward for clearing it; kept within reach of the jump that clears it.
      const reach = hero.standH + jump.apex + (kind === 'double' ? jump.extra : 0);
      const height = Math.min(top + 4 * SCALE + coin.h / 2, reach - coin.h / 2 - 2 * SCALE);
      this.queue.push({ kind: 'coin', arrival: next.arrival, height });
    }
  }
}
