import * as Phaser from 'phaser';
import { audio } from '../audio/index.js';
import { CONFIG, SCALE } from '../config.js';
import { Player } from '../objects/Player.js';
import { storage } from '../storage.js';
import { Backdrop } from '../systems/Backdrop.js';
import { Controls } from '../systems/Controls.js';
import { Fairy } from '../systems/Fairy.js';
import { Fx } from '../systems/Fx.js';
import { metrics, pickupY } from '../systems/metrics.js';
import { Spawner } from '../systems/Spawner.js';
import { toggleMute } from '../ui/mute.js';
import { addText } from '../ui/text.js';
import { fadeIn, fadeTo } from '../ui/transitions.js';

const { width: W, height: H, groundY: G, pxPerMeter: PPM } = CONFIG;
const { FILL, MULTIPLY } = Phaser.TintModes;
const px = (v) => v * SCALE;

const songForZone = (zone) => `game-${CONFIG.zones[zone].key}`;
// Soft pulsing halo so the power-ups read as special.
const PICKUP_GLOW = { chocolate: 0xffc96b, coffee: 0xff9a3c };

// The run. The hero stays at a fixed x while the world scrolls past;
// obstacles and pickups are moved by hand (their Arcade bodies only detect
// overlaps). State is published to the registry for the HUD scene.
export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    // Creating the run (text textures, first draws) stalls for a few frames,
    // so stay black until that has passed, then fade in and start the clock.
    this.cameras.main.fadeOut(0);
    this.introFrames = 3;
    this.registry.set('run.live', false);
    this.mode = 'run'; // run | flight | dying | exit
    this.runTime = 0;
    this.traveled = 0; // px
    this.speed = CONFIG.speed.start;
    this.motion = 1; // eases to 0 on death so the world skids to a stop
    this.finishPx = Infinity; // set when the last level's coin goal opens the exit
    this.coins = 0;
    this.levelCoins = 0;
    this.progress = 0; // levels done plus this level's share of its coin goal, over all levels
    this.exitOpen = false;
    this.dash = 0; // s of coffee dash left
    this.dashTime = 0; // s since the coffee kicked in
    this.shield = false;
    this.shieldsUsed = 0;
    this.invuln = 0;
    this.zone = 0;
    this.deathMeters = 0;
    this.door = null;
    this.pausing = false;
    this.resumeGuard = 0;
    this.published = {};

    // Only the floor collides: world bounds bottom = ground.
    this.physics.world.setBounds(0, -H, W, G + H, false, false, false, true);

    this.backdrop = new Backdrop(this, 0);
    this.obstacles = this.physics.add.group({ allowGravity: false, immovable: true });
    this.pickups = this.physics.add.group({ allowGravity: false, immovable: true });
    this.player = new Player(this, CONFIG.player.x).setDepth(20);
    this.shieldFx = this.add.image(0, 0, 'shield-bubble').setDepth(21).setVisible(false);
    this.fx = new Fx(this);
    this.fairy = new Fairy(this, this.player);
    this.spawner = new Spawner(this);
    this.controls = new Controls(this, {
      onPause: () => this.pauseGame(),
      onMute: () => toggleMute(this),
    });

    this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, undefined, this);
    this.physics.add.overlap(this.player, this.pickups, this.collect, undefined, this);

    this.player.on('player-jump', (air) => {
      if (air) {
        this.fairy.spread();
        audio.sfx('fairy');
      }
      audio.sfx(air ? 'doubleJump' : 'jump');
      this.fx.puffAt(this.player.x, this.player.body.bottom, air ? 10 : 6);
    });
    this.player.on('player-land', () => {
      this.fairy.fold();
      audio.sfx('land');
      this.fx.puffAt(this.player.x, G, 4);
    });
    this.player.on('player-slide', () => {
      audio.sfx('slide');
      this.fx.puffAt(this.player.x + px(8), G, 5);
    });
    this.player.on('player-dive', () => audio.sfx('slide'));
    this.player.on('player-down', (fall) => this.onPlayerDown(fall));

    this.publish('run.coins', 0);
    this.publish('run.goal', CONFIG.zones[0].coins);
    this.publish('run.dash', 0);
    this.publish('run.shield', false);
    this.publish('run.progress', 0);
    this.publish('run.zone', 0);
    this.scene.launch('HUD');

    // Pause on Esc/P, on HUD button, and when the tab or window loses focus.
    const onResume = () => this.onResume();
    const onFocusLost = () => this.pauseGame();
    this.events.on(Phaser.Scenes.Events.RESUME, onResume);
    this.game.events.on(Phaser.Core.Events.HIDDEN, onFocusLost);
    this.game.events.on(Phaser.Core.Events.BLUR, onFocusLost);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.RESUME, onResume);
      this.game.events.off(Phaser.Core.Events.HIDDEN, onFocusLost);
      this.game.events.off(Phaser.Core.Events.BLUR, onFocusLost);
    });

    audio.playMusic(songForZone(0));
  }

  update(_time, delta) {
    if (this.introFrames > 0) {
      this.introFrames -= 1;
      if (this.introFrames === 0) {
        fadeIn(this);
        this.registry.set('run.live', true);
      }
      return;
    }
    const dt = Math.min(delta, 50) / 1000;

    if (this.mode === 'run') {
      this.runTime += dt;
      this.updateDash(dt);
      const goal = CONFIG.zones[this.zone].coins;
      this.progress = (this.zone + Math.min(1, this.levelCoins / goal)) / CONFIG.zones.length;
      this.speed = Phaser.Math.Linear(CONFIG.speed.start, CONFIG.speed.end, this.progress) * this.dashBoost();
      this.player.anims.timeScale = Phaser.Math.Clamp(this.speed / CONFIG.speed.start, 1, 1.8);
    }
    const scroll = this.speed * this.motion;
    this.traveled = Math.min(this.traveled + scroll * dt, this.finishPx);
    this.backdrop.update(this.traveled);

    if (this.mode === 'run') {
      this.spawner.update(this.runTime, this.speed, this.traveled);
    }
    this.moveObjects(dt, scroll);
    this.updateDoor();

    this.player.tick(dt, this.controls.read());
    this.updatePlayerFx(dt);
    this.fairy.update();
    this.publishState();

    if (this.mode === 'run' && this.traveled >= this.finishPx) this.reachExit();
  }

  // --- world ---------------------------------------------------------------

  // Coin goal reached. Finishing a level flies her to the next country
  // (Flight scene), then the run picks up in the next zone with a clear
  // course; the last level opens the exit instead.
  completeLevel() {
    const last = this.zone === CONFIG.zones.length - 1;
    this.fx.popText(this.player.x, this.player.body.top - px(16), last ? 'Выход открыт!' : 'Цель выполнена!', '#7ee08f');
    if (last) this.openExit();
    else this.startFlight(this.zone, this.zone + 1);
  }

  // Clears the way and brings the exit door in from the right edge.
  openExit() {
    this.exitOpen = true;
    this.spawner.stop();
    for (const o of this.obstacles.getChildren().slice()) {
      if (!o.knocked && o.x > this.player.x - px(10)) this.knockAway(o);
    }
    const doorW = this.textures.getFrame('door', 0).width;
    this.finishPx = this.traveled + W + doorW / 2 - CONFIG.player.x - CONFIG.exit.offset;
    audio.sfx('zone');
  }

  startFlight(country, nextZone) {
    this.mode = 'flight';
    this.fairy.fold();
    this.endDash();
    this.nextZone = nextZone;
    this.controls.enabled = false;
    this.controls.reset();
    audio.sfx('zone');
    const cam = this.cameras.main;
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.clearCourse();
      this.scene.pause();
      this.scene.pause('HUD');
      this.scene.launch('Flight', { country, next: 'resume' });
    });
    cam.fadeOut(CONFIG.fadeMs);
  }

  // Called by the Flight scene when its photos are done.
  endFlight() {
    this.zone = this.nextZone;
    this.levelCoins = 0;
    this.backdrop.setZone(this.zone, 0);
    this.spawner.restart(this.runTime);
    this.mode = 'run';
    this.controls.enabled = true;
    this.controls.reset();
    this.scene.resume();
    this.scene.resume('HUD');
    fadeIn(this);
    audio.playMusic(songForZone(this.zone));
  }

  clearCourse() {
    for (const o of this.obstacles.getChildren().slice()) this.removeObstacle(o);
    for (const p of this.pickups.getChildren().slice()) p.destroy();
  }

  spawnObstacle(type, x, intro) {
    const m = metrics.obstacles[type];
    const cfg = CONFIG.obstacles[type];
    const o = this.obstacles.create(x, m.y, type, 0);
    o.setOrigin(m.originX, m.originY).setDepth(12);
    o.kind = type;
    o.ownSpeed = cfg.speed;
    o.age = 0;
    o.knocked = false;
    o.baseY = m.y;
    o.wobble = m.wobble ?? 0;
    o.phase = Math.random() * Math.PI * 2;
    o.rollRadius = m.rollRadius ?? 0;
    o.body.moves = false;
    if (m.circle) {
      o.body.setCircle(m.circle.r, m.circle.x, m.circle.y);
    } else {
      o.body.setSize(m.hitbox.w, m.hitbox.h, false);
      o.body.setOffset(m.hitbox.x, m.hitbox.y);
    }
    const variants = metrics.variants[type];
    if (variants) o.play(Phaser.Utils.Array.GetRandom(variants));
    else if (metrics.anims[type]) o.play(metrics.anims[type]);

    // First appearance of a type: tell the player what to do.
    if (intro && cfg.hint) {
      o.hintLift = m.y - (G - m.top) + px(10);
      o.hint = addText(this, x, m.y - o.hintLift, cfg.hint, { size: 40, weight: 700, color: '#ffd23f', origin: [0.5, 1] }).setDepth(30);
      this.tweens.add({ targets: o.hint, alpha: 0.35, duration: 260, yoyo: true, repeat: -1 });
    }
    return o;
  }

  spawnPickup(type, x, height) {
    const m = metrics.pickups[type];
    if (!m) return null;
    const y = pickupY(type, height);
    const p = this.pickups.create(x, y, type, 0).setDepth(11);
    p.kind = type;
    p.age = 0;
    p.baseY = y;
    p.body.moves = false;
    p.body.setSize(m.hitbox.w, m.hitbox.h, false);
    p.body.setOffset(m.hitbox.x, m.hitbox.y);
    if (metrics.anims[type]) p.play(metrics.anims[type]);
    if (PICKUP_GLOW[type]) {
      p.glow = this.add
        .image(x, y, 'fx-dot')
        .setTint(PICKUP_GLOW[type])
        .setScale((Math.max(m.frameW, m.frameH) * 2) / 24)
        .setDepth(10);
      p.once('destroy', () => p.glow.destroy());
    }
    return p;
  }

  moveObjects(dt, scroll) {
    const wobbleW = CONFIG.obstacles.meeting.wobbleHz * Math.PI * 2;
    for (const o of this.obstacles.getChildren().slice()) {
      if (o.knocked) continue;
      const dx = (scroll + o.ownSpeed * this.motion) * dt;
      o.x -= dx;
      o.age += dt;
      if (o.wobble) o.y = o.baseY + Math.sin(o.age * wobbleW + o.phase) * o.wobble;
      if (o.rollRadius) o.angle -= Phaser.Math.RadToDeg(dx / o.rollRadius);
      if (o.hint) o.hint.setPosition(o.x, o.y - o.hintLift);
      if (o.x < -o.displayWidth) this.removeObstacle(o);
    }
    for (const p of this.pickups.getChildren().slice()) {
      if (!p.active || p.x < -p.displayWidth) {
        p.destroy();
        continue;
      }
      p.x -= scroll * dt;
      p.age += dt;
      if (p.glow) {
        p.y = p.baseY + Math.sin(p.age * 4) * px(2);
        p.glow.setPosition(p.x, p.y).setAlpha(0.45 + Math.sin(p.age * 6) * 0.25);
      }
    }
  }

  removeObstacle(o) {
    if (o.hint) o.hint.destroy();
    o.hint = null;
    o.destroy();
  }

  updateDoor() {
    const x = CONFIG.player.x + CONFIG.exit.offset + (this.finishPx - this.traveled);
    if (!this.door) {
      if (x > W + this.textures.getFrame('door', 0).width) return;
      this.door = this.add.image(x, G, 'door', 0).setOrigin(0.5, 1).setDepth(8);
    }
    this.door.x = x;
  }

  // --- collisions ------------------------------------------------------------

  hitObstacle(_player, o) {
    if (this.mode !== 'run' || o.knocked) return;
    if (this.dash > 0) {
      this.smash(o);
      return;
    }
    if (this.invuln > 0) return;
    if (this.shield) this.absorbHit(o);
    else this.die(o);
  }

  // Coffee dash: obstacles go flying instead of her.
  smash(o) {
    this.fx.sparkle(o.x, o.body.center.y, false, 12);
    this.knockAway(o);
    audio.sfx('smash');
    this.cameras.main.shake(90, 0.004);
  }

  absorbHit(o) {
    this.shield = false;
    this.shieldsUsed += 1;
    this.invuln = CONFIG.player.invulnTime;
    this.knockAway(o);
    audio.sfx('shieldBreak');
    this.cameras.main.flash(120, 127, 227, 255);
    this.cameras.main.shake(140, 0.006);
    const c = this.player.body.center;
    this.fx.sparkle(c.x, c.y, true, 16);
    this.fx.popText(this.player.x, this.player.body.top - px(4), 'Шоколадка спасла!', '#7fe3ff');
  }

  knockAway(o) {
    o.knocked = true;
    o.body.enable = false;
    if (o.hint) o.hint.destroy();
    o.hint = null;
    this.tweens.add({
      targets: o,
      x: o.x + px(150),
      y: o.y - px(110),
      angle: o.angle + 540,
      alpha: 0,
      duration: 650,
      ease: 'Quad.easeOut',
      onComplete: () => this.removeObstacle(o),
    });
  }

  collect(_player, p) {
    if (this.mode !== 'run' || !p.active) return;
    const { x, y } = p;
    p.disableBody(true, true); // destroyed in moveObjects, outside the physics step
    if (p.kind === 'coin') {
      audio.sfx('coin');
      this.fx.sparkle(x, y, false, 8);
      this.fx.popText(x, y - px(8), '+1');
      this.addCoins(1);
    } else if (p.kind === 'coffee') {
      this.startDash();
      audio.sfx('dash');
      this.fx.sparkle(x, y, false, 18);
      this.fx.popText(x, y - px(8), 'Кофе! Полный вперёд!', '#ff9a3c');
    } else if (this.shield) {
      audio.sfx('shieldGet');
      this.fx.sparkle(x, y, true, 12);
      this.fx.popText(x, y - px(8), `+${CONFIG.pickups.chocolateBonusCoins} монет`);
      this.addCoins(CONFIG.pickups.chocolateBonusCoins);
    } else {
      this.shield = true;
      audio.sfx('shieldGet');
      this.fx.sparkle(x, y, true, 14);
      this.fx.popText(x, y - px(8), 'Шоколадка!', '#7fe3ff');
    }
  }

  addCoins(n) {
    this.coins += n;
    this.levelCoins += n;
    if (!this.exitOpen && this.levelCoins >= CONFIG.zones[this.zone].coins) this.completeLevel();
  }

  // --- coffee dash -------------------------------------------------------------

  startDash() {
    this.dash = CONFIG.dash.time;
    this.dashTime = 0;
  }

  updateDash(dt) {
    if (this.dash <= 0) return;
    this.dashTime += dt;
    this.dash -= dt;
    if (this.dash <= 0) this.endDash();
  }

  endDash() {
    this.dash = 0;
    this.player.setAlpha(1);
  }

  // Speed multiplier: eases in as the coffee kicks in, out as it wears off.
  dashBoost() {
    if (this.dash <= 0) return 1;
    const { speedMul, rampIn, rampOut } = CONFIG.dash;
    return 1 + (speedMul - 1) * Math.min(1, this.dashTime / rampIn, this.dash / rampOut);
  }

  // --- player feedback -------------------------------------------------------

  updatePlayerFx(dt) {
    const p = this.player;
    const onFloor = p.onGround && (this.mode === 'run' || this.mode === 'exit');
    const skidding = p.downed && p.fall === 'trip' && this.motion > 0.2;
    this.fx.setDust(onFloor || skidding, skidding ? p.body.center.x + px(6) : p.x - px(6), G - px(1));
    const dashing = this.dash > 0 && this.mode === 'run';
    this.fx.setDashTrail(dashing, p.body.center.x - px(4), p.body.center.y);
    // Blinks for the last second so the end of the dash doesn't surprise.
    if (dashing) p.setAlpha(this.dash < 1 && Math.floor(this.dash * 8) % 2 ? 0.55 : 1);

    this.shieldFx.setVisible(this.shield && this.mode === 'run');
    if (this.shieldFx.visible) {
      const c = p.body.center;
      const y = Math.min(c.y, G - this.shieldFx.height / 2 + px(6));
      this.shieldFx.setPosition(c.x, y);
      this.shieldFx.setAlpha(0.65 + Math.sin(this.runTime * 6) * 0.25);
    }

    if (this.invuln > 0 && this.mode === 'run') {
      this.invuln = Math.max(0, this.invuln - dt);
      p.setAlpha(this.invuln > 0 && Math.floor(this.invuln * 12) % 2 === 1 ? 0.3 : 1);
    }
  }

  // --- registry for the HUD ---------------------------------------------------

  publish(key, value) {
    if (this.published[key] === value) return;
    this.published[key] = value;
    this.registry.set(key, value);
  }

  publishState() {
    this.publish('run.coins', this.levelCoins);
    this.publish('run.goal', CONFIG.zones[this.zone].coins);
    this.publish('run.shield', this.shield);
    this.publish('run.dash', Math.ceil((this.dash / CONFIG.dash.time) * 50) / 50);
    this.publish('run.progress', Math.round(this.progress * 1000) / 1000);
    this.publish('run.zone', this.zone);
  }

  // --- pause -----------------------------------------------------------------

  pauseGame() {
    if (this.mode !== 'run' || this.leaving || this.pausing) return;
    if (performance.now() < this.resumeGuard) return;
    this.pausing = true;
    audio.pause();
    this.controls.reset();
    this.scene.pause();
    this.scene.pause('HUD');
    this.scene.launch('Pause');
  }

  onResume() {
    this.pausing = false;
    this.controls.reset();
    this.resumeGuard = performance.now() + 250;
    audio.resume();
  }

  // --- endings -----------------------------------------------------------------

  die(o) {
    const fall = CONFIG.obstacles[o.kind]?.fall ?? 'hurt';
    const p = this.player;
    this.mode = 'dying';
    this.fairy.fold();
    this.deathMeters = Math.floor(this.traveled / PPM);
    this.controls.enabled = false;
    p.die(fall);
    this.player.setAlpha(1).setTint(0xffffff).setTintMode(FILL);
    this.time.delayedCall(90, () => this.player.clearTint().setTintMode(MULTIPLY));
    audio.stopMusic(0.05);
    audio.sfx('hit');
    this.cameras.main.flash(160, 255, 255, 255);
    this.cameras.main.shake(320, 0.014);
    if (fall === 'trip') {
      // Carried forward over the obstacle; the floor keeps running until she lands.
      this.tweens.add({ targets: p, x: p.x + px(12), duration: 260, ease: 'Sine.easeOut' });
      return;
    }
    if (fall === 'knock') {
      // Stopped dead by the bookcase and thrown back off it.
      this.tweens.add({ targets: this, motion: 0, duration: 90 });
      this.tweens.add({ targets: p, x: p.x - px(45), duration: 300, ease: 'Quad.easeOut' });
      return;
    }
    this.tweens.add({ targets: this, motion: 0, duration: 380, ease: 'Quad.easeOut' });
    this.time.delayedCall(CONFIG.deathDelay, () => this.finishRun(false));
  }

  // She hit the floor after a trip or knock-back.
  onPlayerDown(fall) {
    const p = this.player;
    this.tweens.killTweensOf(p);
    audio.sfx('thud');
    this.cameras.main.shake(160, 0.008);
    this.fx.puffAt(p.body.center.x, G, 10);
    if (fall === 'trip') {
      // Belly slide: the floor runs on under her and slows to a stop.
      audio.sfx('skid');
      this.tweens.add({ targets: this, motion: 0, duration: 750, ease: 'Quad.easeOut' });
      this.tweens.add({ targets: p, x: p.x + px(14), duration: 750, ease: 'Quad.easeOut' });
    } else {
      this.tweens.add({ targets: p, x: p.x - px(6), duration: 200, ease: 'Quad.easeOut' });
    }
    this.time.delayedCall(CONFIG.downDelay, () => this.finishRun(false));
  }

  reachExit() {
    this.mode = 'exit';
    this.fairy.fold();
    this.endDash();
    this.motion = 0;
    this.controls.enabled = false;
    this.player.exit();
    this.player.setAlpha(1);
    this.invuln = 0;
    audio.stopMusic(0.4);
    const doorX = this.door ? this.door.x : this.player.x + CONFIG.exit.offset;
    this.tweens.add({
      targets: this.player,
      x: doorX,
      duration: 700,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        audio.sfx('door');
        this.tweens.add({ targets: this.player, alpha: 0, duration: 300, onComplete: () => this.finishRun(true) });
      },
    });
  }

  finishRun(victory) {
    const distance = victory ? Math.floor(this.traveled / PPM) : this.deathMeters;
    const score = distance + this.coins * CONFIG.pickups.coinScore;
    const prevBest = this.registry.get('best') ?? 0;
    const prevBestScore = this.registry.get('bestScore') ?? 0;
    const newBest = distance > prevBest;
    const newBestScore = score > prevBestScore;
    if (newBest) {
      storage.set(CONFIG.storage.best, distance);
      this.registry.set('best', distance);
    }
    if (newBestScore) {
      storage.set(CONFIG.storage.bestScore, score);
      this.registry.set('bestScore', score);
    }
    const data = {
      distance,
      coins: this.coins,
      levelCoins: this.levelCoins,
      score,
      time: this.runTime,
      zone: this.zone,
      shieldsUsed: this.shieldsUsed,
      best: Math.max(prevBest, distance),
      bestScore: Math.max(prevBestScore, score),
      newBest,
      newBestScore,
    };
    // The last level ends with a flight to the last country, then the
    // congratulations screen.
    const target = victory ? 'Flight' : 'GameOver';
    const payload = victory ? { country: CONFIG.countries.length - 1, next: 'Victory', payload: data } : data;
    fadeTo(this, target, payload, { before: () => this.scene.stop('HUD') });
  }
}
