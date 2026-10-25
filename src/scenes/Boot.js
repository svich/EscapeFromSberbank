import * as Phaser from 'phaser';
import { buildBackgrounds } from '../art/vector/backgrounds.js';
import { buildSprites } from '../art/vector/sprites.js';
import { audio } from '../audio/index.js';
import { CONFIG } from '../config.js';
import { storage } from '../storage.js';
import { computeMetrics, metrics } from '../systems/metrics.js';
import { makeFxTextures } from '../systems/textures.js';

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

    this.scene.start('Menu');
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
        repeat: LOOPING.has(name) ? -1 : 0,
      });
    }
  }
}
