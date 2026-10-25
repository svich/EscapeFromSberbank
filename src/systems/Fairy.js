import { WING_PIVOT } from '../art/vector/sprites.js';
import { SCALE } from '../config.js';
import { metrics } from './metrics.js';

const px = (v) => v * SCALE;
const WING_FRAME = 60; // wing art frame, in art units (see sprites.js)
const SPARKLE_TINTS = [0xffd23f, 0xf27fb5, 0x7fe3ff, 0xffffff, 0xc8aaff];

// Fairy wings and a sparkle trail while the hero is up on her double jump.
export class Fairy {
  constructor(scene, player) {
    this.player = player;
    this.scene = scene;
    this.open = false;
    // Middle of her back (hero art: 64x80 units, body 25-43 x, 45-58 y),
    // below the ponytail so the wing roots stay visible. Offsets are from the
    // player's centre: the Player sprite keeps the default 0.5 origin.
    const unit = metrics.hero.frameW / 64;
    this.offsetX = -unit * 7;
    this.offsetY = unit * 50 - metrics.hero.frameH / 2;
    this.wings = scene.add
      .sprite(player.x, player.y, 'wings', 0)
      .setOrigin(WING_PIVOT.x / WING_FRAME, WING_PIVOT.y / WING_FRAME)
      .setDepth(player.depth - 0.5)
      .setVisible(false);
    // A big sparkle trail left hanging in the air: particles get the world's
    // scroll speed when emitted, so they stay where she flew. Two layers:
    // large slow-fading stars and a fine glitter.
    const leftBehind = () => -(scene.speed * scene.motion) * (0.85 + Math.random() * 0.15);
    const sparkles = (config) =>
      scene.add
        .particles(0, 0, 'fx-spark', {
          speedX: { onEmit: leftBehind },
          speedY: { min: -px(20), max: px(20) },
          gravityY: px(25),
          alpha: { start: 1, end: 0 },
          rotate: { min: 0, max: 360 },
          tint: SPARKLE_TINTS,
          emitting: false,
          ...config,
        })
        .setDepth(player.depth - 1);
    this.trails = [
      sparkles({ lifespan: 1300, scale: { start: 2.6, end: 0.3 }, frequency: 45, quantity: 1 }),
      sparkles({ lifespan: 900, scale: { start: 1.2, end: 0 }, frequency: 14, quantity: 2 }),
    ];
    for (const t of this.trails) t.startFollow(player, this.offsetX - px(10), this.offsetY);
  }

  spread() {
    if (this.open) return;
    this.open = true;
    this.scene.tweens.killTweensOf(this.wings);
    this.wings.setVisible(true).setAlpha(1).setScale(0.2).play('wings-flap');
    this.scene.tweens.add({ targets: this.wings, scale: 1, duration: 220, ease: 'Back.easeOut' });
    this.trailStop?.remove();
    for (const t of this.trails) t.start();
  }

  fold() {
    if (!this.open) return;
    this.open = false;
    // The trail lingers a moment after landing.
    this.trailStop = this.scene.time.delayedCall(400, () => this.trails.forEach((t) => t.stop()));
    this.scene.tweens.killTweensOf(this.wings);
    this.scene.tweens.add({
      targets: this.wings,
      scale: 0.2,
      alpha: 0,
      duration: 180,
      ease: 'Quad.easeIn',
      onComplete: () => this.wings.setVisible(false).stop(),
    });
  }

  // Keeps the wings on her back; call after the player has moved this frame.
  update() {
    if (!this.wings.visible) return;
    this.wings.setPosition(this.player.x + this.offsetX, this.player.y + this.offsetY);
    if (this.open) this.wings.setAlpha(this.player.alpha);
  }
}
