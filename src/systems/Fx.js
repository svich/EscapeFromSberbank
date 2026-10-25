import { SCALE } from '../config.js';
import { addText } from '../ui/text.js';

const px = (v) => v * SCALE;

// Particle juice for the run: running dust, jump puffs, pickup sparkles, the
// coffee dash trail and floating score text.
export class Fx {
  constructor(scene) {
    this.scene = scene;
    this.dust = scene.add
      .particles(0, 0, 'fx-dot', {
        lifespan: 420,
        speedX: { min: -px(90), max: -px(35) },
        speedY: { min: -px(28), max: -px(6) },
        alpha: { start: 0.6, end: 0 },
        scale: { start: 0.8, end: 1.6 },
        tint: 0xe9e4f2,
        frequency: 60,
        emitting: false,
      })
      .setDepth(19);
    this.puff = scene.add
      .particles(0, 0, 'fx-dot', {
        lifespan: 380,
        speed: { min: px(25), max: px(85) },
        angle: { min: 190, max: 350 },
        alpha: { start: 0.8, end: 0 },
        scale: { start: 1.2, end: 2.4 },
        tint: 0xffffff,
        emitting: false,
      })
      .setDepth(22);
    const sparkle = (color) =>
      scene.add
        .particles(0, 0, 'fx-spark', {
          lifespan: 480,
          speed: { min: px(40), max: px(120) },
          alpha: { start: 1, end: 0 },
          scale: { start: 1.3, end: 0.3 },
          rotate: { min: 0, max: 90 },
          color,
          emitting: false,
        })
        .setDepth(23);
    this.gold = sparkle([0xffffff, 0xffd23f, 0xff9a3c]);
    this.cyan = sparkle([0xffffff, 0x7fe3ff, 0x3d7bd9]);
    // Sparkles get the world's scroll speed when emitted, so they hang where she ran.
    this.dashTrail = scene.add
      .particles(0, 0, 'fx-spark', {
        x: { min: -px(6), max: px(6) },
        y: { min: -px(16), max: px(16) },
        speedX: { onEmit: () => -(scene.speed * scene.motion) * (0.85 + Math.random() * 0.15) },
        speedY: { min: -px(25), max: px(25) },
        lifespan: 750,
        scale: { start: 2.2, end: 0 },
        alpha: { start: 1, end: 0 },
        rotate: { min: 0, max: 360 },
        tint: [0xffd23f, 0xff9a3c, 0xffffff, 0xf27fb5, 0x7fe3ff],
        frequency: 14,
        quantity: 2,
        emitting: false,
      })
      .setDepth(19);
  }

  setDashTrail(on, x, y) {
    this.dashTrail.setPosition(x, y);
    if (on && !this.dashTrail.emitting) this.dashTrail.start();
    else if (!on && this.dashTrail.emitting) this.dashTrail.stop();
  }

  setDust(on, x, y) {
    this.dust.setPosition(x, y);
    if (on && !this.dust.emitting) this.dust.start();
    else if (!on && this.dust.emitting) this.dust.stop();
  }

  puffAt(x, y, count = 8) {
    this.puff.explode(count, x, y);
  }

  sparkle(x, y, cyan = false, count = 10) {
    (cyan ? this.cyan : this.gold).explode(count, x, y);
  }

  popText(x, y, text, color = '#ffd23f') {
    const t = addText(this.scene, x, y, text, { size: 36, weight: 700, color, origin: [0.5, 1] }).setDepth(30);
    this.scene.tweens.add({
      targets: t,
      y: y - px(18),
      alpha: 0,
      duration: 700,
      ease: 'Quad.easeOut',
      onComplete: () => t.destroy(),
    });
  }
}
