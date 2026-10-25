import * as Phaser from 'phaser';
import { audio } from '../audio/index.js';
import { CONFIG } from '../config.js';
import { Backdrop } from '../systems/Backdrop.js';
import { metrics } from '../systems/metrics.js';
import { addMuteButton, toggleMute } from '../ui/mute.js';
import { addPanel } from '../ui/panel.js';
import { addText } from '../ui/text.js';
import { fadeIn, fadeTo } from '../ui/transitions.js';

const { width: W, groundY: G } = CONFIG;

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    fadeIn(this);
    this.backdrop = new Backdrop(this, 0);
    this.scroll = 6000; // starts with the logo wall off to the side of the title

    addText(this, W / 2, 40, 'Побег из', { size: 64, origin: [0.5, 0] }).setDepth(6);
    const title = addText(this, W / 2, 104, 'СБЕРБАНКА', { size: 140, weight: 700, color: '#21a038', origin: [0.5, 0] }).setDepth(6);
    this.tweens.add({ targets: title, scale: 1.03, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    addText(this, W / 2, 270, 'История одного увольнения', { size: 40, color: '#f27fb5', origin: [0.5, 0] }).setDepth(6);

    this.add
      .sprite(330, G, 'hero', 0)
      .setOrigin(0.5, metrics.hero.originY)
      .setDepth(10)
      .play('hero-run');

    const panel = { x: 760, y: 380, w: 980, h: 300 };
    addPanel(this, panel.x, panel.y, panel.w, panel.h).setDepth(5);
    const lines = [
      ['ПРОБЕЛ', 'прыжок'],
      ['ПРОБЕЛ в воздухе', 'двойной прыжок'],
    ];
    lines.forEach(([key, action], i) => {
      const y = panel.y + 44 + i * 64;
      addText(this, panel.x + 70, y, key, { size: 40, color: '#ffd23f' }).setDepth(6);
      addText(this, panel.x + 470, y, `—  ${action}`, { size: 40, weight: 400 }).setDepth(6);
    });
    this.prompt = addText(this, panel.x + panel.w / 2, panel.y + panel.h - 92, 'Жми ПРОБЕЛ, чтобы начать', {
      size: 48,
      weight: 700,
      color: '#7ee08f',
      origin: [0.5, 0],
    }).setDepth(6);
    this.tweens.add({ targets: this.prompt, alpha: 0.35, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const best = this.registry.get('best') ?? 0;
    const bestScore = this.registry.get('bestScore') ?? 0;
    const bestLine = best > 0 ? `Рекорд: ${best} м    Лучший KPI: ${bestScore}` : 'Рекордов пока нет. Твой KPI — ноль.';
    addText(this, W / 2, G + 50, bestLine, { size: 40, origin: [0.5, 0] }).setDepth(6);

    addMuteButton(this, W - 60, 60).img.setDepth(6);

    this.input.keyboard.on('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'Enter') this.startGame();
      else if (e.code === 'KeyM') toggleMute(this);
    });
    this.input.on('pointerdown', (_pointer, over) => {
      if (over.length === 0) this.startGame();
    });

    audio.playMusic('menu');
  }

  startGame() {
    if (this.leaving) return;
    audio.sfx('select');
    // A new run: {} replaces a retried level's checkpoint. ?level=N in the
    // page URL starts it on level N (1-based), handy for testing.
    const level = Number(new URLSearchParams(window.location.search).get('level'));
    const zone = Phaser.Math.Clamp(Math.floor(level) - 1, 0, CONFIG.zones.length - 1);
    fadeTo(this, 'Game', level >= 1 ? { zone } : {});
  }

  update(_time, delta) {
    // She's already running: the whole office scrolls past behind the title.
    this.scroll += (delta / 1000) * 360;
    this.backdrop.update(this.scroll);
  }
}
