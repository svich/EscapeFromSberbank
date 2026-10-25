import { CONFIG } from '../config.js';

const JUMP_CODES = new Set(['Space', 'ArrowUp', 'KeyW']);
const DOWN_CODES = new Set(['ArrowDown', 'KeyS']);

// Keyboard + touch for the run. Presses are edge-triggered flags read once per
// frame; "held" reads live key / pointer state (needed for variable jump
// height and holding a slide). Right half of the screen jumps, left slides.
export class Controls {
  constructor(scene, { onPause, onMute } = {}) {
    this.enabled = true;
    this.jumpPressed = false;
    this.downPressed = false;
    this.touchJump = new Set();
    this.touchDown = new Set();

    const kb = scene.input.keyboard;
    this.keys = kb.addKeys('SPACE,UP,W,DOWN,S');
    kb.addCapture('SPACE,UP,DOWN');
    kb.on('keydown', (e) => {
      if (e.repeat) return;
      if (JUMP_CODES.has(e.code)) {
        if (this.enabled) this.jumpPressed = true;
      } else if (DOWN_CODES.has(e.code)) {
        if (this.enabled) this.downPressed = true;
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        onPause?.();
      } else if (e.code === 'KeyM') {
        onMute?.();
      }
    });

    scene.input.on('pointerdown', (pointer) => {
      if (!this.enabled) return;
      if (pointer.x >= CONFIG.width / 2) {
        this.jumpPressed = true;
        this.touchJump.add(pointer.id);
      } else {
        this.downPressed = true;
        this.touchDown.add(pointer.id);
      }
    });
    const release = (pointer) => {
      this.touchJump.delete(pointer.id);
      this.touchDown.delete(pointer.id);
    };
    scene.input.on('pointerup', release);
    scene.input.on('pointerupoutside', release);
  }

  get jumpHeld() {
    const k = this.keys;
    return k.SPACE.isDown || k.UP.isDown || k.W.isDown || this.touchJump.size > 0;
  }

  get downHeld() {
    const k = this.keys;
    return k.DOWN.isDown || k.S.isDown || this.touchDown.size > 0;
  }

  // Input for this frame, then clear the edge flags.
  read() {
    const input = {
      jumpPressed: this.jumpPressed,
      downPressed: this.downPressed,
      jumpHeld: this.jumpHeld,
      downHeld: this.downHeld,
    };
    this.jumpPressed = false;
    this.downPressed = false;
    return input;
  }

  reset() {
    this.jumpPressed = false;
    this.downPressed = false;
    this.touchJump.clear();
    this.touchDown.clear();
  }
}
