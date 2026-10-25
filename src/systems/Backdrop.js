import { LAYERS } from '../art/vector/backgrounds.js';
import { CONFIG } from '../config.js';

const { width: W, height: H, groundY: G } = CONFIG;
const FRONT_DEPTH = 25; // over the hero (20), under pop-up text (30)
const SNOWY = new Set(['street']); // winter zones get a light snowfall

// Parallax tile layers per zone, back to front (see LAYERS). Front layers
// pass over the play field; static screens (menu, end screens) leave them out
// and only drift the farthest layers.
export class Backdrop {
  constructor(scene, zone = 0, { front = false } = {}) {
    this.scene = scene;
    this.zone = zone;
    this.sets = CONFIG.zones.map(({ key }, i) =>
      LAYERS[key]
        .filter((l) => front || !l.front)
        .map((l, j) => {
          const texture = `bg-${key}-${l.name}`;
          const h = scene.textures.get(texture).getSourceImage().height;
          const y = { top: 0, floor: G - h, ground: G, bottom: H - h }[l.anchor];
          const sprite = scene.add
            .tileSprite(0, y, W, h, texture)
            .setOrigin(0, 0)
            .setDepth((l.front ? FRONT_DEPTH : j) + i * 0.01)
            .setVisible(i === zone);
          return { sprite, factor: l.factor };
        }),
    );
    // Flakes drift with part of the world's scroll, behind the play field.
    this.snow = scene.add
      .particles(0, -20, 'fx-dot', {
        x: { min: 0, max: W * 2 },
        speedX: { onEmit: () => -40 - (scene.speed ?? 0) * (scene.motion ?? 0) * 0.45 },
        speedY: { min: 50, max: 110 },
        scale: { min: 0.25, max: 0.6 },
        alpha: { min: 0.5, max: 0.9 },
        lifespan: 14000,
        frequency: 60,
        emitting: false,
      })
      .setDepth(6);
    this.updateSnow();
  }

  updateSnow() {
    const snowy = SNOWY.has(CONFIG.zones[this.zone].key);
    this.snow.setVisible(snowy);
    if (snowy && !this.snow.emitting) {
      this.snow.start();
      this.snow.fastForward(9000);
    } else if (!snowy && this.snow.emitting) {
      this.snow.stop();
    }
  }

  setZone(zone) {
    if (zone === this.zone) return;
    for (const { sprite } of this.sets[this.zone]) sprite.setVisible(false);
    for (const { sprite } of this.sets[zone]) sprite.setVisible(true);
    this.zone = zone;
    this.updateSnow();
  }

  // scroll: world distance in px. Whole-pixel offsets keep the tiles crisp.
  // ambient: slow drift for static screens (only the far layers move).
  update(scroll, ambient = false) {
    for (const { sprite, factor } of this.sets[this.zone]) {
      if (ambient && factor > 0.2) continue;
      sprite.tilePositionX = Math.round(scroll * factor);
    }
  }
}
