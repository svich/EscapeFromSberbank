import * as Phaser from 'phaser';
import { audio } from '../audio/index.js';
import { CONFIG } from '../config.js';
import { toggleMute } from '../ui/mute.js';
import { addPanel } from '../ui/panel.js';
import { addText } from '../ui/text.js';

const { width: W, height: H } = CONFIG;

// Overlay on top of the paused Game and HUD.
export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create() {
    this.openedAt = performance.now();
    this.closing = false;

    this.add.rectangle(0, 0, W, H, 0x1a1423, 0.55).setOrigin(0, 0);
    addPanel(this, W / 2 - 480, 200, 960, 680);
    addText(this, W / 2, 240, 'Пауза', { size: 112, weight: 700, color: '#f27fb5', origin: [0.5, 0] });
    addText(this, W / 2, 380, 'Кофе-брейк. HR всё видит.', { size: 40, weight: 400, color: '#e9e4f2', origin: [0.5, 0] });
    addText(this, W / 2, 470, 'Esc / P / тап  —  продолжить', { size: 40, origin: [0.5, 0] });
    this.muteText = addText(this, W / 2, 530, '', { size: 40, origin: [0.5, 0] });
    addText(this, W / 2, 590, 'Q  —  выйти в меню', { size: 40, origin: [0.5, 0] });
    this.refreshMute();

    // Touch: buttons for mute and quit; tapping anywhere else resumes.
    const button = (x, label, onTap) => {
      const t = addText(this, x, 700, label, { size: 44, weight: 700, color: '#ffd23f', origin: [0.5, 0] });
      this.add
        .zone(t.x, t.y + t.height / 2, t.width + 40, t.height + 30)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', onTap);
    };
    button(W / 2 - 200, 'Звук', () => this.toggleMute());
    button(W / 2 + 200, 'Выйти', () => this.quit());

    this.input.keyboard.on('keydown', (e) => {
      if (e.code === 'Escape' || e.code === 'KeyP' || e.code === 'Enter' || e.code === 'Space') this.resumeGame();
      else if (e.code === 'KeyM') this.toggleMute();
      else if (e.code === 'KeyQ') this.quit();
    });
    this.input.on('pointerdown', (_pointer, over) => {
      if (over.length === 0) this.resumeGame();
    });
  }

  refreshMute() {
    this.muteText.setText(`M  —  звук ${audio.isMuted() ? 'выкл' : 'вкл'}`);
  }

  toggleMute() {
    toggleMute(this);
    this.refreshMute();
  }

  resumeGame() {
    // Ignore the key/tap that opened the overlay.
    if (this.closing || performance.now() - this.openedAt < 150) return;
    this.closing = true;
    this.scene.resume('Game');
    this.scene.resume('HUD');
    this.scene.stop();
  }

  quit() {
    if (this.closing) return;
    this.closing = true;
    audio.stopMusic();
    audio.resume();
    this.scene.stop('HUD');
    this.scene.stop('Game');
    this.scene.start('Menu');
  }
}
