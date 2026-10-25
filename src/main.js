import '@fontsource/nunito/400.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import * as Phaser from 'phaser';
import { audio } from './audio/index.js';
import { CONFIG } from './config.js';
import { BootScene } from './scenes/Boot.js';
import { GameScene } from './scenes/Game.js';
import { GameOverScene } from './scenes/GameOver.js';
import { HUDScene } from './scenes/HUD.js';
import { MenuScene } from './scenes/Menu.js';
import { PauseScene } from './scenes/Pause.js';
import { VictoryScene } from './scenes/Victory.js';

// Browsers only allow audio after a user gesture: resume on the first one
// (and keep listening, iOS sometimes needs a second nudge).
function installAudioHooks() {
  const unlock = () => audio.unlock();
  for (const type of ['pointerdown', 'touchend', 'keydown']) {
    window.addEventListener(type, unlock, { capture: true, passive: true });
  }
  document.addEventListener('visibilitychange', () => audio.setHidden(document.hidden));
}

async function start() {
  try {
    await Promise.all(['400', '600', '700', '800'].map((weight) => document.fonts.load(`${weight} 32px Nunito`, 'Побег Escape')));
  } catch {
    // Fall back to the sans-serif stack; text still renders.
  }
  installAudioHooks();

  // Scene order is draw order: HUD over Game, Pause over both.
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: CONFIG.width,
    height: CONFIG.height,
    backgroundColor: '#2b2140',
    pixelArt: false,
    antialias: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 0 }, fixedStep: false, debug: false },
    },
    input: { activePointers: 3 },
    audio: { noAudio: true },
    scene: [BootScene, MenuScene, GameScene, HUDScene, PauseScene, GameOverScene, VictoryScene],
  });
  // Handle for playtest scripts in dev builds.
  if (import.meta.env.DEV) window.__game = game;
}

start();
