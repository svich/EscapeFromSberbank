import * as Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { addMuteButton } from '../ui/mute.js';
import { addText } from '../ui/text.js';

const W = CONFIG.width;
const ZONE_COLORS = [0x9aa0c0, 0x3d7bd9, 0x21a038];
const BAR = { x: 640, y: 40, w: 640, h: 20 };

// Fits an image into a box of the given height (keeps aspect).
const fitHeight = (img, h) => img.setScale(h / img.height);

// Runs on top of Game and reads the run state from the registry.
export class HUDScene extends Phaser.Scene {
  constructor() {
    super('HUD');
  }

  create() {
    // Hidden until the Game scene starts fading in (see Game introFrames).
    // Toggling visibility, not alpha: a translucent camera renders through an
    // extra framebuffer, which itself costs a stall the first time.
    this.cameras.main.setVisible(false);
    this.shown = {};
    this.bannerZone = -1;

    this.distText = addText(this, 40, 20, '0 m', { size: 72, weight: 700 });
    fitHeight(this.add.image(70, 150, 'coffee', 0), 60);
    this.coffeeText = addText(this, 112, 124, 'x0', { size: 48, weight: 700, color: '#ffd23f' });

    this.drawProgressBar();
    this.marker = this.add.image(BAR.x, BAR.y + 8, 'hud-marker').setOrigin(0.5, 1);

    this.shieldIcon = fitHeight(this.add.image(W - 250, 60, 'chocolate', 0), 64).setVisible(false);
    this.shieldScale = this.shieldIcon.scale;
    addMuteButton(this, W - 150, 60);
    const pause = this.add.image(W - 60, 60, 'icon-pause');
    this.add
      .zone(pause.x, pause.y, pause.width + 16, pause.height + 16)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.get('Game').pauseGame());

    // Built up front (while the run is still black) so showing one costs nothing.
    this.banners = CONFIG.zones.map((_, i) => this.makeBanner(i));
  }

  drawProgressBar() {
    const g = this.add.graphics();
    const zones = CONFIG.zones;
    const total = CONFIG.finishMeters;
    const r = BAR.h / 2;
    g.fillStyle(0x2b2140, 0.8).fillRoundedRect(BAR.x - 6, BAR.y - 6, BAR.w + 12, BAR.h + 12, r + 6);
    this.zoneLabels = zones.map((z, i) => {
      const from = BAR.x + (z.from / total) * BAR.w;
      const to = BAR.x + ((zones[i + 1]?.from ?? total) / total) * BAR.w;
      const radius = { tl: i === 0 ? r : 0, bl: i === 0 ? r : 0, tr: i === zones.length - 1 ? r : 0, br: i === zones.length - 1 ? r : 0 };
      g.fillStyle(ZONE_COLORS[i % ZONE_COLORS.length], 1).fillRoundedRect(from, BAR.y, to - from, BAR.h, radius);
      if (i > 0) g.fillStyle(0xffffff, 1).fillRect(from - 2, BAR.y - 6, 4, BAR.h + 12);
      return addText(this, (from + to) / 2, BAR.y + BAR.h + 12, z.label, { size: 30, origin: [0.5, 0] }).setAlpha(0.5);
    });
    // The exit door at the end of the bar.
    fitHeight(this.add.image(BAR.x + BAR.w + 40, BAR.y + BAR.h + 14, 'door', 0).setOrigin(0.5, 1), 64);
  }

  changed(key) {
    const value = this.registry.get(key);
    if (this.shown[key] === value) return undefined;
    this.shown[key] = value;
    return value;
  }

  update(time) {
    if (!this.registry.get('run.live')) return;
    this.cameras.main.setVisible(true);
    const distance = this.changed('run.distance');
    if (distance !== undefined) this.distText.setText(`${distance} м`);

    const coffees = this.changed('run.coffees');
    if (coffees !== undefined) {
      this.coffeeText.setText(`x${coffees}`);
      if (coffees > 0) this.tweens.add({ targets: this.coffeeText, scale: { from: 1.25, to: 1 }, duration: 180 });
    }

    const progress = this.registry.get('run.progress') ?? 0;
    this.marker.x = BAR.x + progress * BAR.w;

    const shield = Boolean(this.registry.get('run.shield'));
    this.shieldIcon.setVisible(shield);
    if (shield) this.shieldIcon.setScale(this.shieldScale * (1 + Math.sin(time / 160) * 0.06));

    const zone = this.registry.get('run.zone') ?? 0;
    if (zone !== this.bannerZone) {
      this.bannerZone = zone;
      this.zoneLabels.forEach((label, i) => label.setAlpha(i === zone ? 1 : 0.5));
      this.showBanner(zone);
    }
  }

  makeBanner(zoneIndex) {
    const zone = CONFIG.zones[zoneIndex];
    const y = 270;
    const band = this.add.graphics();
    band.fillStyle(0x2b2140, 0.7).fillRoundedRect(W * 0.2, y, W * 0.6, 210, 36);
    band.lineStyle(5, 0xf27fb5, 0.9).strokeRoundedRect(W * 0.2, y, W * 0.6, 210, 36);
    return this.add
      .container(0, 0, [
        band,
        addText(this, W / 2, y + 18, `Зона ${zoneIndex + 1}/${CONFIG.zones.length}`, { size: 36, color: '#f27fb5', origin: [0.5, 0] }),
        addText(this, W / 2, y + 60, zone.title, { size: 84, weight: 700, origin: [0.5, 0] }),
        addText(this, W / 2, y + 152, zone.subtitle, { size: 36, weight: 400, color: '#e9e4f2', origin: [0.5, 0] }),
      ])
      .setVisible(false);
  }

  showBanner(zoneIndex) {
    for (const b of this.banners) {
      this.tweens.killTweensOf(b);
      b.setVisible(false);
    }
    const banner = this.banners[zoneIndex].setVisible(true).setPosition(W, 0);
    this.tweens.chain({
      targets: banner,
      tweens: [
        { x: 0, duration: 420, ease: 'Back.easeOut' },
        { x: -W, duration: 340, ease: 'Quad.easeIn', delay: 1900 },
      ],
      onComplete: () => banner.setVisible(false),
    });
  }
}
