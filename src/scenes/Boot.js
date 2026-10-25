import * as Phaser from 'phaser';
import { buildBackgrounds } from '../art/vector/backgrounds.js';
import { buildSprites } from '../art/vector/sprites.js';
import { audio } from '../audio/index.js';
import { CONFIG } from '../config.js';
import { storage } from '../storage.js';
import { computeMetrics, metrics } from '../systems/metrics.js';
import { makeFxTextures } from '../systems/textures.js';
import { addText } from '../ui/text.js';

const LOOPING = new Set(['run', 'idle', 'slide', 'walk', 'flap', 'steam']);

// Turns the art canvases into textures and animations, derives sizes from
// their metadata, and starts the menu.
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    const sprites = buildSprites();
    for (const [key, def] of Object.entries(sprites)) this.registerSprite(key, def);
    computeMetrics(sprites);

    const backgrounds = buildBackgrounds();
    for (const zone of CONFIG.zones) {
      for (const layer of ['far', 'mid', 'floor']) this.registerCanvas(`bg-${zone.key}-${layer}`, backgrounds[zone.key][layer]);
    }

    makeFxTextures(this, metrics);

    this.registry.set('best', storage.getNumber(CONFIG.storage.best, 0));
    this.registry.set('bestScore', storage.getNumber(CONFIG.storage.bestScore, 0));
    this.registry.set('muted', audio.isMuted());

    // Let the warm-up render a few frames, then hand over to the menu.
    this.warmUp();
    this.time.delayedCall(120, () => this.scene.start('Menu'));
  }

  // WebGL compiles shaders and uploads textures the first time something is
  // drawn, which stalls for a few hundred ms on some GPUs. Draw one of
  // everything the game uses here, under a black cover, so the run starts smooth.
  warmUp() {
    const { width: W, height: H } = CONFIG;
    const keys = this.textures.getTextureKeys().filter((key) => !key.startsWith('__'));
    keys.forEach((key, i) => {
      this.add.image(80 + (i % 12) * 150, 80 + Math.floor(i / 12) * 150, key, 0).setScale(0.25);
    });
    this.add.image(W / 2, H / 2, 'hero', 0).setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.add.sprite(W / 2, H / 2, 'logo', 0).setAngle(30).setAlpha(0.5);
    this.add.tileSprite(0, 0, 256, 160, 'bg-office-floor').setOrigin(0, 0).setTilePosition(10, 0);
    for (const tex of ['fx-dot', 'fx-spark', 'fx-confetti']) {
      if (!this.textures.exists(tex)) continue;
      this.add.particles(W / 2, H / 2, tex, { lifespan: 500, speed: 20, alpha: { start: 1, end: 0 }, tint: 0xffd23f, emitting: false }).explode(4);
    }
    this.add.graphics().fillStyle(0xffffff, 0.6).fillRoundedRect(20, 20, 200, 40, 12).lineStyle(4, 0xffffff).strokeCircle(300, 300, 40);
    this.add.rectangle(0, 0, 100, 100, 0x1a1423, 0.5).setOrigin(0, 0);
    addText(this, 40, 40, 'Побег 0 м x0', { size: 72, weight: 700 });
    this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0, 0).setDepth(1000);
    this.cameras.main.flash(60, 0, 0, 0);
  }

  registerCanvas(key, canvas) {
    if (this.textures.exists(key)) this.textures.remove(key);
    return this.textures.addCanvas(key, canvas);
  }

  // Frame i sits at x = i * w in the sheet.
  registerSprite(key, { sheet, w, h, count, anims }) {
    const tex = this.registerCanvas(key, sheet);
    for (let i = 0; i < count; i++) tex.add(i, 0, i * w, 0, w, h);
    for (const [name, anim] of Object.entries(anims ?? {})) {
      const animKey = `${key}-${name}`;
      if (this.anims.exists(animKey)) this.anims.remove(animKey);
      this.anims.create({
        key: animKey,
        frames: anim.frames.map((frame) => ({ key, frame })),
        frameRate: anim.fps,
        repeat: LOOPING.has(name.replace(/\d+$/, '')) ? -1 : 0,
      });
    }
  }
}
