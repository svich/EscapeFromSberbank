import { CONFIG } from '../config.js';

// One button: Space (or a tap anywhere) jumps, again in the air for the
// double jump. Presses are edge-triggered flags read once per frame; "held"
// reads live key / pointer state (for variable jump height).
export class Controls {
  constructor(scene, { onPause, onMute } = {}) {
    this.enabled = true;
    this.jumpPressed = false;
    this.touchJump = new Set();

    const kb = scene.input.keyboard;
    this.space = kb.addKey('SPACE');
    kb.addCapture('SPACE');
    kb.on('keydown', (e) => {
      if (e.repeat) return;
      if (e.code === 'Space') {
        if (this.enabled) this.jumpPressed = true;
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        onPause?.();
      } else if (e.code === 'KeyM') {
        onMute?.();
      }
    });

    scene.input.on('pointerdown', (pointer) => {
      if (!this.enabled) return;
      this.jumpPressed = true;
      this.touchJump.add(pointer.id);
    });
    const release = (pointer) => this.touchJump.delete(pointer.id);
    scene.input.on('pointerup', release);
    scene.input.on('pointerupoutside', release);
  }

  get jumpHeld() {
    return this.space.isDown || this.touchJump.size > 0;
  }

  // Input for this frame, then clear the edge flags.
  read() {
    const input = {
      jumpPressed: this.jumpPressed,
      jumpHeld: this.jumpHeld,
    };
    this.jumpPressed = false;
    return input;
  }

  reset() {
    this.jumpPressed = false;
    this.touchJump.clear();
  }
}
