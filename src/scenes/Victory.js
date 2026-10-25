import * as Phaser from 'phaser';
import { audio } from '../audio/index.js';
import { CONFIG } from '../config.js';
import { Backdrop } from '../systems/Backdrop.js';
import { metrics } from '../systems/metrics.js';
import { addPanel } from '../ui/panel.js';
import { addText } from '../ui/text.js';
import { fadeIn } from '../ui/transitions.js';
import { addStats, bindEndInputs } from './GameOver.js';

const { width: W, height: H, groundY: G } = CONFIG;
const CONFETTI = [0xf27fb5, 0xffd23f, 0x7ee08f, 0x7fe3ff, 0xff9a3c, 0xffffff];

function formatTime(seconds) {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super('Victory');
  }

  create(data) {
    fadeIn(this, 600, [255, 255, 255]);
    this.backdrop = new Backdrop(this, CONFIG.zones.length - 1);
    this.scroll = 0;
    this.add.rectangle(0, 0, W, H, 0x1a1423, 0.35).setOrigin(0, 0).setDepth(5);

    const hero = this.add
      .sprite(330, G, 'hero', 0)
      .setOrigin(0.5, metrics.hero.originY)
      .setDepth(6)
      .play('hero-idle');
    this.tweens.add({ targets: hero, y: G - 40, duration: 220, yoyo: true, repeat: -1, repeatDelay: 700, ease: 'Quad.easeOut' });

    const title = addText(this, W / 2, 40, 'ТЫ СВОБОДНА!', { size: 128, weight: 700, color: '#7ee08f', origin: [0.5, 0] }).setDepth(6);
    this.tweens.add({ targets: title, y: 28, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    addText(this, W / 2, 200, 'Заявление подписано. Больше никаких стендапов. Никогда.', {
      size: 40,
      weight: 400,
      color: '#ffe0ef',
      origin: [0.5, 0],
    }).setDepth(6);

    addPanel(this, 640, 290, 900, 330).setDepth(5);
    addStats(this, 700, 320, [
      ['Время', formatTime(data.time ?? 0)],
      ['Кофе', `x${data.coffees}`, '#ffd23f'],
      ['Щитов потрачено', data.shieldsUsed],
      ['Счёт KPI', data.score],
      ['Лучший KPI', `${data.bestScore}${data.newBestScore ? '  НОВЫЙ!' : ''}`, data.newBestScore ? '#7ee08f' : undefined],
    ]);

    const prompt = addText(this, W / 2, 680, 'R / Пробел / тап  —  ещё забег', { size: 48, weight: 700, color: '#7ee08f', origin: [0.5, 0] }).setDepth(6);
    addText(this, W / 2, 750, 'M / Esc  —  меню', { size: 36, origin: [0.5, 0] }).setDepth(6);
    this.tweens.add({ targets: prompt, alpha: 0.35, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const confetti = { lifespan: 4200, rotate: { min: 0, max: 360 }, scale: { min: 1.5, max: 2.5 }, tint: CONFETTI };
    this.add
      .particles(0, -20, 'fx-confetti', {
        ...confetti,
        x: { min: 0, max: W },
        speedY: { min: 120, max: 340 },
        speedX: { min: -120, max: 120 },
        gravityY: 50,
        frequency: 30,
        quantity: 2,
      })
      .setDepth(8);
    this.add
      .particles(W / 2, 160, 'fx-confetti', {
        ...confetti,
        speed: { min: 240, max: 680 },
        angle: { min: 200, max: 340 },
        gravityY: 480,
        emitting: false,
      })
      .setDepth(8)
      .explode(80);

    bindEndInputs(this);
    audio.playMusic('victory');
  }

  update(_time, delta) {
    this.scroll += (delta / 1000) * 120;
    this.backdrop.update(this.scroll, true);
  }
}
