import * as Phaser from 'phaser';
import { audio } from '../audio/index.js';
import { CONFIG, SCALE } from '../config.js';
import { Player } from '../objects/Player.js';
import { storage } from '../storage.js';
import { Backdrop } from '../systems/Backdrop.js';
import { Controls } from '../systems/Controls.js';
import { Fx } from '../systems/Fx.js';
import { metrics, pickupY } from '../systems/metrics.js';
import { Spawner, zoneAt } from '../systems/Spawner.js';
import { toggleMute } from '../ui/mute.js';
import { addText } from '../ui/text.js';
import { fadeIn, fadeTo } from '../ui/transitions.js';

const { width: W, height: H, groundY: G, pxPerMeter: PPM } = CONFIG;
const { FILL, MULTIPLY } = Phaser.TintModes;
const px = (v) => v * SCALE;

const songForZone = (zone) => `game-${CONFIG.zones[zone].key}`;

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
    this.mode = 'run'; // run | dying | exit
    this.runTime = 0;
    this.traveled = 0; // px
    this.speed = CONFIG.speed.start;
    this.motion = 1; // eases to 0 on death so the world skids to a stop
    this.finishPx = CONFIG.finishMeters * PPM;
    this.coffees = 0;
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
    this.spawner = new Spawner(this);
    this.controls = new Controls(this, {
      onPause: () => this.pauseGame(),
      onMute: () => toggleMute(this),
    });

    this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, undefined, this);
    this.physics.add.overlap(this.player, this.pickups, this.collect, undefined, this);

    this.player.on('player-jump', (air) => {
      audio.sfx(air ? 'doubleJump' : 'jump');
      this.fx.puffAt(this.player.x, this.player.body.bottom, air ? 10 : 6);
    });
    this.player.on('player-land', () => {
      audio.sfx('land');
      this.fx.puffAt(this.player.x, G, 4);
    });
    this.player.on('player-slide', () => {
      audio.sfx('slide');
      this.fx.puffAt(this.player.x + px(8), G, 5);
    });
    this.player.on('player-dive', () => audio.sfx('slide'));

    this.publish('run.distance', 0);
    this.publish('run.coffees', 0);
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
      const t = Phaser.Math.Clamp(this.traveled / this.finishPx, 0, 1);
      this.speed = Phaser.Math.Linear(CONFIG.speed.start, CONFIG.speed.end, t);
      this.player.anims.timeScale = Phaser.Math.Clamp(this.speed / CONFIG.speed.start, 1, 1.6);
    }
    const scroll = this.speed * this.motion;
    this.traveled = Math.min(this.traveled + scroll * dt, this.finishPx);
    this.backdrop.update(this.traveled);

    if (this.mode === 'run') {
      this.updateZone();
      this.spawner.update(this.runTime, this.speed, this.traveled);
    }
    this.moveObjects(dt, scroll);
    this.updateDoor();

    this.player.tick(dt, this.controls.read());
    this.updatePlayerFx(dt);
    this.publishState();

    if (this.mode === 'run' && this.traveled >= this.finishPx) this.reachExit();
  }

  // --- world ---------------------------------------------------------------

  updateZone() {
    const zone = zoneAt(this.traveled / PPM);
    if (zone === this.zone) return;
    this.zone = zone;
    this.backdrop.setZone(zone);
    audio.playMusic(songForZone(zone), { atBar: true });
    audio.sfx('zone');
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

  spawnPickup(kind, x, height) {
    const type = kind === 'offer' && this.shield ? 'coffee' : kind;
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
    if (type === 'offer') {
      // Soft pulsing halo so the job offer reads as special.
      p.glow = this.add
        .image(x, y, 'fx-dot')
        .setTint(0x7fe3ff)
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
    if (this.mode !== 'run' || o.knocked || this.invuln > 0) return;
    if (this.shield) this.absorbHit(o);
    else this.die();
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
    this.fx.popText(this.player.x, this.player.body.top - px(4), 'Щит сработал!', '#7fe3ff');
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
    if (p.kind === 'coffee') {
      this.coffees += 1;
      audio.sfx('coffee');
      this.fx.sparkle(x, y, false, 8);
      this.fx.popText(x, y - px(8), '+1');
    } else if (this.shield) {
      this.coffees += CONFIG.pickups.offerBonusCoffees;
      audio.sfx('shieldGet');
      this.fx.sparkle(x, y, true, 12);
      this.fx.popText(x, y - px(8), `+${CONFIG.pickups.offerBonusCoffees} кофе`);
    } else {
      this.shield = true;
      audio.sfx('shieldGet');
      this.fx.sparkle(x, y, true, 14);
      this.fx.popText(x, y - px(8), 'Оффер!', '#7fe3ff');
    }
  }

  // --- player feedback -------------------------------------------------------

  updatePlayerFx(dt) {
    const p = this.player;
    const onFloor = p.onGround && (this.mode === 'run' || this.mode === 'exit');
    this.fx.setDust(onFloor, p.x - px(6), G - px(1));

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
    const meters = this.mode === 'dying' ? this.deathMeters : Math.floor(this.traveled / PPM);
    this.publish('run.distance', meters);
    this.publish('run.coffees', this.coffees);
    this.publish('run.shield', this.shield);
    this.publish('run.progress', Math.round((this.traveled / this.finishPx) * 1000) / 1000);
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

  die() {
    this.mode = 'dying';
    this.deathMeters = Math.floor(this.traveled / PPM);
    this.controls.enabled = false;
    this.player.die();
    this.player.setAlpha(1).setTint(0xffffff).setTintMode(FILL);
    this.time.delayedCall(90, () => this.player.clearTint().setTintMode(MULTIPLY));
    audio.stopMusic(0.05);
    audio.sfx('hit');
    this.cameras.main.flash(160, 255, 255, 255);
    this.cameras.main.shake(320, 0.014);
    this.tweens.add({ targets: this, motion: 0, duration: 380, ease: 'Quad.easeOut' });
    this.time.delayedCall(CONFIG.deathDelay, () => this.finishRun(false));
  }

  reachExit() {
    this.mode = 'exit';
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
    const distance = victory ? CONFIG.finishMeters : this.deathMeters;
    const score = distance + this.coffees * CONFIG.pickups.coffeeScore;
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
      coffees: this.coffees,
      score,
      time: this.runTime,
      zone: this.zone,
      shieldsUsed: this.shieldsUsed,
      best: Math.max(prevBest, distance),
      bestScore: Math.max(prevBestScore, score),
      newBest,
      newBestScore,
    };
    fadeTo(this, victory ? 'Victory' : 'GameOver', data, {
      ms: victory ? 600 : CONFIG.fadeMs,
      rgb: victory ? [255, 255, 255] : [0, 0, 0],
      before: () => this.scene.stop('HUD'),
    });
  }
}
