import * as Phaser from 'phaser';
import { audio } from '../audio/index.js';
import { CONFIG } from '../config.js';
import { photosFor } from '../photos.js';
import { addText } from '../ui/text.js';
import { fadeIn, fadeTo } from '../ui/transitions.js';

const { width: W, height: H } = CONFIG;
const PHOTO_BOX = { w: 1040, h: 640 }; // largest photo area inside a polaroid
const PLANE_MS = 3400;
const HOLD_MS = 3000;

// Between levels: a plane crosses the sky, then photos from the country she
// flew to, one polaroid at a time. Space / tap skips ahead, Esc skips all.
export class FlightScene extends Phaser.Scene {
  constructor() {
    super('Flight');
  }

  // data: { country: index into CONFIG.countries, next: 'resume' | 'Victory', payload }
  create(data) {
    this.flight = data;
    this.country = CONFIG.countries[data.country];
    this.finished = false;
    this.index = -1; // -1 while the plane flies
    this.card = null;
    fadeIn(this);

    this.add.image(0, 0, 'flight-sky').setOrigin(0, 0).setDisplaySize(W, H);
    this.clouds = Array.from({ length: 8 }, () => {
      const scale = 0.5 + Math.random() * 1.1;
      return this.add
        .image(Math.random() * W, 140 + Math.random() * (H - 320), 'cloud')
        .setScale(scale)
        .setAlpha(0.6 + scale * 0.25)
        .setDepth(scale > 1.1 ? 4 : 1)
        .setData('speed', 40 + scale * 140);
    });

    const title = `Рейс ${this.country.to}`;
    const flag = this.add.image(0, 120, `flag-${this.country.key}`).setScale(0.6).setDepth(6);
    const titleText = addText(this, 0, 120, title, { size: 80, weight: 800, origin: [0, 0.5] }).setDepth(6);
    const rowW = flag.displayWidth + 30 + titleText.width;
    flag.setX(W / 2 - rowW / 2 + flag.displayWidth / 2);
    titleText.setX(flag.x + flag.displayWidth / 2 + 30);
    this.subtitle = addText(this, W / 2, 200, `Следующая остановка — ${this.country.name}`, {
      size: 40,
      weight: 600,
      color: '#ffffff',
      origin: [0.5, 0],
    }).setDepth(6);

    this.plane = this.add.image(-420, H * 0.46, 'plane').setDepth(3);
    this.trail = this.add
      .particles(0, 0, 'fx-dot', {
        lifespan: 1100,
        speedX: { min: -60, max: -20 },
        speedY: { min: -8, max: 8 },
        scale: { start: 1.6, end: 4.5 },
        alpha: { start: 0.65, end: 0 },
        frequency: 22,
      })
      .setDepth(2);
    this.trail.startFollow(this.plane, -this.plane.width * 0.46, this.plane.height * 0.06);
    this.tweens.add({ targets: this.plane, x: W + 420, duration: PLANE_MS, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: this.plane, y: H * 0.42, angle: -3, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    audio.playMusic('menu');
    audio.sfx('plane');
    this.planeTimer = this.time.delayedCall(PLANE_MS - 500, () => this.next());

    // The user's photos, or a drawn postcard until there are some.
    const photos = photosFor(this.textures, this.country.key);
    this.photos = photos.length
      ? photos.map((p) => ({ key: p.key, caption: p.caption ?? this.country.name }))
      : [{ key: `postcard-${this.country.key}`, caption: `${this.country.city}, ${this.country.name}` }];
    // Draw each photo once, hidden behind the sky, so its texture uploads now
    // instead of stalling when the polaroid slides in.
    for (const p of this.photos) this.add.image(W / 2, H / 2, p.key).setScale(0.05).setDepth(-1);

    this.input.keyboard.on('keydown', (e) => {
      if (e.code === 'Escape') this.finish();
      else if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight') this.next();
    });
    this.input.on('pointerdown', () => this.next());
  }

  update(_time, delta) {
    const dt = delta / 1000;
    for (const c of this.clouds) {
      c.x -= c.getData('speed') * dt;
      if (c.x < -c.displayWidth / 2) c.x = W + c.displayWidth / 2;
    }
  }

  // Next polaroid; the first call ends the plane fly-by early.
  next() {
    if (this.finished) return;
    this.planeTimer?.remove();
    this.holdTimer?.remove();
    if (this.card) this.throwAway(this.card);
    // Tall photos reach up to the subtitle; it was only for the fly-by anyway.
    if (this.index === -1) this.tweens.add({ targets: this.subtitle, alpha: 0, duration: 300 });
    this.index += 1;
    if (this.index >= this.photos.length) {
      this.finish();
      return;
    }
    const card = (this.card = this.makeCard(this.photos[this.index], this.index));
    this.tweens.add({ targets: card, y: H / 2 + 60, duration: 650, ease: 'Back.easeOut' });
    this.holdTimer = this.time.delayedCall(650 + HOLD_MS, () => this.next());
  }

  makeCard({ key, caption }, i) {
    const src = this.textures.get(key).getSourceImage();
    const k = Math.min(PHOTO_BOX.w / src.width, PHOTO_BOX.h / src.height);
    const pw = Math.round(src.width * k);
    const ph = Math.round(src.height * k);
    const pad = 26;
    const bottom = 112;
    const fw = Math.max(pw + pad * 2, 520);
    const fh = ph + pad + bottom;
    const frame = this.add.graphics();
    frame.fillStyle(0x1a1423, 0.22).fillRoundedRect(-fw / 2 + 12, -fh / 2 + 16, fw, fh, 16);
    frame.fillStyle(0xffffff, 1).fillRoundedRect(-fw / 2, -fh / 2, fw, fh, 16);
    const photo = this.add.image(0, -fh / 2 + pad + ph / 2, key).setDisplaySize(pw, ph);
    const label = addText(this, 0, fh / 2 - bottom / 2, caption, {
      size: 52,
      weight: 800,
      color: '#2b2140',
      stroke: null,
      shadow: false,
      origin: [0.5, 0.5],
    });
    const parts = [frame, photo, label];
    if (this.photos.length > 1) {
      parts.push(
        addText(this, fw / 2 - 24, fh / 2 - 22, `${i + 1}/${this.photos.length}`, {
          size: 30,
          color: '#8a8fa8',
          stroke: null,
          shadow: false,
          origin: [1, 1],
        }),
      );
    }
    return this.add
      .container(W / 2, H + fh / 2 + 40, parts)
      .setDepth(10)
      .setAngle(Phaser.Math.FloatBetween(-4, 4));
  }

  throwAway(card) {
    this.tweens.add({
      targets: card,
      x: card.x - W * 0.7,
      y: card.y - 160,
      angle: card.angle - 14,
      alpha: 0,
      duration: 480,
      ease: 'Quad.easeIn',
      onComplete: () => card.destroy(),
    });
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    this.planeTimer?.remove();
    this.holdTimer?.remove();
    if (this.flight.next === 'Victory') {
      fadeTo(this, 'Victory', this.flight.payload, { ms: 600, rgb: [255, 255, 255] });
      return;
    }
    const cam = this.cameras.main;
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      const game = this.scene.get('Game');
      this.scene.stop();
      game.endFlight();
    });
    cam.fadeOut(CONFIG.fadeMs);
  }
}
