import * as Phaser from 'phaser';
import { CONFIG } from '../config.js';

// Every scene fades in on create; leaving fades out, then starts the next scene.
export function fadeIn(scene, ms = CONFIG.fadeMs, rgb = [0, 0, 0]) {
  scene.leaving = false;
  scene.cameras.main.fadeIn(ms, ...rgb);
}

export function fadeTo(scene, key, data, { ms = CONFIG.fadeMs, rgb = [0, 0, 0], before } = {}) {
  if (scene.leaving) return false;
  scene.leaving = true;
  const cam = scene.cameras.main;
  cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    before?.();
    scene.scene.start(key, data);
  });
  cam.fadeOut(ms, ...rgb);
  return true;
}
