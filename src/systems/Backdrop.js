import { CONFIG } from '../config.js';

const { width: W, height: H, groundY: G } = CONFIG;

// Three parallax tile layers per zone (far, mid, floor). Layers of the same
// kind stack by zone, so a cross-fade blends far with far, mid with mid.
export class Backdrop {
  constructor(scene, zone = 0) {
    this.scene = scene;
    this.zone = zone;
    this.sets = CONFIG.zones.map(({ key }, i) => {
      const midH = scene.textures.get(`bg-${key}-mid`).getSourceImage().height;
      const set = {
        far: scene.add.tileSprite(0, 0, W, G, `bg-${key}-far`).setOrigin(0, 0).setDepth(0 + i * 0.01),
        mid: scene.add.tileSprite(0, G - midH, W, midH, `bg-${key}-mid`).setOrigin(0, 0).setDepth(1 + i * 0.01),
        floor: scene.add.tileSprite(0, G, W, H - G, `bg-${key}-floor`).setOrigin(0, 0).setDepth(2 + i * 0.01),
      };
      this.layers(set).forEach((l) => l.setVisible(i === zone).setAlpha(i === zone ? 1 : 0));
      return set;
    });
  }

  layers(set) {
    return [set.far, set.mid, set.floor];
  }

  setZone(zone, fadeMs = CONFIG.bg.fadeMs) {
    if (zone === this.zone) return;
    const prev = this.sets[this.zone];
    this.zone = zone;
    const next = this.layers(this.sets[zone]);
    this.scene.tweens.killTweensOf(next);
    next.forEach((l) => l.setVisible(true).setAlpha(0));
    this.scene.tweens.add({
      targets: next,
      alpha: 1,
      duration: fadeMs,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        if (this.sets[this.zone] !== prev) this.layers(prev).forEach((l) => l.setVisible(false));
      },
    });
  }

  // scroll: world distance in px. Whole-pixel offsets keep the tiles crisp.
  // farOnly: ambient drift for static screens (the floor stays put).
  update(scroll, farOnly = false) {
    const { far, mid, floor } = CONFIG.bg;
    for (const set of this.sets) {
      if (!set.far.visible) continue;
      set.far.tilePositionX = Math.round(scroll * far);
      if (farOnly) continue;
      set.mid.tilePositionX = Math.round(scroll * mid);
      set.floor.tilePositionX = Math.round(scroll * floor);
    }
  }
}
