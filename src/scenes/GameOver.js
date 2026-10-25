import * as Phaser from 'phaser';
import { audio } from '../audio/index.js';
import { CONFIG } from '../config.js';
import { Backdrop } from '../systems/Backdrop.js';
import { metrics } from '../systems/metrics.js';
import { addPanel } from '../ui/panel.js';
import { addText } from '../ui/text.js';
import { fadeIn, fadeTo } from '../ui/transitions.js';

const { width: W, height: H, groundY: G } = CONFIG;

const QUIPS = [
  'Стендап в 9:00 уже начинается.',
  'Дашборд с KPI по тебе скучал.',
  'Синергия восстановлена. Свобода отложена.',
  'Заполните форму 7-Б в трёх экземплярах.',
  'Руководитель просит на минутку созвониться.',
  'Заявление на увольнение сохранено в черновиках.',
];

// Two-column stat rows: [label, value, color?].
export function addStats(scene, x, y, rows) {
  rows.forEach(([label, value, color], i) => {
    const rowY = y + i * 58;
    addText(scene, x, rowY, label, { size: 40, weight: 400, color: '#e9e4f2' }).setDepth(6);
    addText(scene, x + 380, rowY, String(value), { size: 40, weight: 700, color: color ?? '#ffffff' }).setDepth(6);
  });
}

// Shared by GameOver and Victory: R/Space/Enter or tap retries, M/Esc menu.
export function bindEndInputs(scene) {
  const readyAt = performance.now() + 450; // swallow mashing from the run
  const go = (key) => {
    if (performance.now() < readyAt) return;
    audio.sfx('select');
    fadeTo(scene, key);
  };
  scene.input.keyboard.on('keydown', (e) => {
    if (e.code === 'KeyR' || e.code === 'Space' || e.code === 'Enter') go('Game');
    else if (e.code === 'KeyM' || e.code === 'Escape') go('Menu');
  });
  const menuText = addText(scene, W - 50, H - 90, 'Меню', { size: 44, weight: 700, color: '#ffd23f', origin: [1, 0] }).setDepth(7);
  scene.add
    .zone(menuText.x - menuText.width / 2, menuText.y + menuText.height / 2, menuText.width + 50, menuText.height + 40)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => go('Menu'));
  scene.input.on('pointerdown', (_pointer, over) => {
    if (over.length === 0) go('Game');
  });
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  create(data) {
    fadeIn(this);
    const zone = data.zone ?? 0;
    new Backdrop(this, zone);
    this.add.rectangle(0, 0, W, H, 0x1a1423, 0.5).setOrigin(0, 0).setDepth(5);

    this.add
      .sprite(330, G, 'hero', 0)
      .setOrigin(0.5, metrics.hero.originY)
      .setDepth(6)
      .play('hero-hurt');

    addText(this, W / 2, 50, 'Обратно на работу...', { size: 120, weight: 700, color: '#ff8fa3', origin: [0.5, 0] }).setDepth(6);
    addText(this, W / 2, 210, Phaser.Utils.Array.GetRandom(QUIPS), { size: 44, weight: 400, color: '#e9e4f2', origin: [0.5, 0] }).setDepth(6);

    addPanel(this, 640, 300, 900, 420).setDepth(5);
    const newMark = (isNew) => (isNew ? '  НОВЫЙ!' : '');
    addStats(this, 700, 330, [
      ['Монеты', `x${data.coins}`, '#ffd23f'],
      ['Уровень', `${CONFIG.zones[zone].title}  ${data.levelCoins}/${CONFIG.zones[zone].coins}`],
      ['Дистанция', `${data.distance} м`],
      ['Счёт KPI', data.score],
      ['Рекорд', `${data.best} м${newMark(data.newBest)}`, data.newBest ? '#7ee08f' : undefined],
      ['Лучший KPI', `${data.bestScore}${newMark(data.newBestScore)}`, data.newBestScore ? '#7ee08f' : undefined],
    ]);

    const prompt = addText(this, W / 2, 760, 'R / Пробел / тап  —  ещё раз', { size: 48, weight: 700, color: '#7ee08f', origin: [0.5, 0] }).setDepth(6);
    addText(this, W / 2, 830, 'M / Esc  —  меню', { size: 36, origin: [0.5, 0] }).setDepth(6);
    this.tweens.add({ targets: prompt, alpha: 0.35, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    bindEndInputs(this);
    audio.playMusic('gameover');
  }
}
