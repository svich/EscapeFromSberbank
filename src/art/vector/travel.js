// Art for the flights between levels: the plane, clouds, the sky, country
// flags, and postcard placeholders shown until real photos are added.

import { C, OW, ellipse, outline, renderSheet, roundRect, shape, strokePts, text } from './draw.js';

const PINK = '#f27fb5';
const WINDOW = '#3a5f9f';

function canvasOf(w, h, scale, draw) {
  return renderSheet([draw], w, h, scale).sheet;
}

// Passenger plane facing right; the hero waves from one window.
function plane(ctx) {
  shape(ctx, (c) => {
    c.moveTo(108, 40);
    c.lineTo(82, 20);
    c.lineTo(94, 20);
    c.lineTo(132, 40);
  }, '#d5d9e4');
  shape(ctx, (c) => {
    c.moveTo(24, 35);
    c.lineTo(10, 7);
    c.lineTo(27, 7);
    c.lineTo(50, 35);
  }, PINK);
  shape(ctx, (c) => {
    c.moveTo(18.5, 15);
    c.bezierCurveTo(16, 11.5, 21, 10.5, 21.5, 13.5);
    c.bezierCurveTo(22, 10.5, 27, 11.5, 24.5, 15);
    c.lineTo(21.5, 18.5);
  }, C.white, false);
  shape(ctx, (c) => {
    c.moveTo(24, 34);
    c.lineTo(170, 34);
    c.quadraticCurveTo(196, 36, 197, 47);
    c.quadraticCurveTo(195, 58, 168, 60);
    c.lineTo(30, 60);
    c.quadraticCurveTo(16, 58, 13, 48);
    c.quadraticCurveTo(13, 37, 24, 34);
  }, C.white);
  strokePts(ctx, [[20, 54], [184, 54]], 2.4, PINK);
  strokePts(ctx, [[30, 58], [165, 58]], 1, '#e3e7f0');
  shape(ctx, (c) => {
    c.moveTo(14, 45);
    c.lineTo(3, 51);
    c.lineTo(12, 53);
    c.lineTo(36, 49);
  }, PINK);
  shape(ctx, (c) => {
    c.moveTo(178, 38.5);
    c.quadraticCurveTo(189, 38.5, 193.5, 44);
    c.lineTo(180, 44);
  }, WINDOW);
  ctx.beginPath();
  ctx.roundRect(52, 38, 6.5, 13, 2);
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = '#a9b0c4';
  ctx.stroke();
  for (let x = 66; x <= 166; x += 9) {
    if (x === 84) continue;
    ellipse(ctx, x, 43.5, 2.4, 2.9, WINDOW, false);
  }
  // The hero in her window: hair, face, smile.
  ellipse(ctx, 84, 43.5, 5, 5.6, '#cfeaff');
  ellipse(ctx, 84, 42.4, 3.9, 3.9, C.hair, false);
  ellipse(ctx, 84.6, 43.8, 3, 3, C.skin, false);
  ellipse(ctx, 83.6, 43.4, 0.5, 0.65, C.lash, false);
  ellipse(ctx, 85.8, 43.4, 0.5, 0.65, C.lash, false);
  ellipse(ctx, 82.9, 44.8, 0.7, 0.45, 'rgba(255,120,130,0.6)', false);
  ellipse(ctx, 86.5, 44.8, 0.7, 0.45, 'rgba(255,120,130,0.6)', false);
  text(ctx, 'АВИАЛИНИИ  СВОБОДА', 128, 49.5, 4.2, '#5a5f78', 800);
  shape(ctx, (c) => {
    c.moveTo(96, 54);
    c.lineTo(68, 79);
    c.lineTo(85, 79);
    c.lineTo(128, 54);
  }, '#eef1f6');
  roundRect(ctx, 86, 60, 20, 8.5, 4.2, '#c9cfe3');
  ellipse(ctx, 104.5, 64.2, 1.6, 3.4, '#4b5068');
}

function cloud(ctx) {
  for (const [x, y, rx, ry] of [[30, 34, 22, 14], [56, 24, 22, 18], [82, 32, 22, 15], [56, 40, 40, 10]]) {
    ellipse(ctx, x, y, rx, ry, 'rgba(255,255,255,0.96)', false);
  }
  ctx.fillStyle = 'rgba(190,215,240,0.35)';
  ctx.beginPath();
  ctx.ellipse(56, 45, 38, 5, 0, 0, Math.PI * 2);
  ctx.fill();
}

function sky(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, 1080);
  g.addColorStop(0, '#5aa8f0');
  g.addColorStop(0.6, '#a9d8fb');
  g.addColorStop(1, '#e6f5ff');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 8, 1080);
}

// --- Flags (60x40 units) ---------------------------------------------------

function flagFrame(ctx, paint) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(1, 1, 58, 38, 4);
  ctx.clip();
  paint();
  ctx.restore();
  ctx.beginPath();
  ctx.roundRect(1, 1, 58, 38, 4);
  outline(ctx, OW * 0.8);
}

function star(ctx, cx, cy, r, color, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.4 : r;
    const a = rot + (i * Math.PI) / 5;
    ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

const FLAGS = {
  serbia(ctx) {
    flagFrame(ctx, () => {
      ['#c6363c', '#0c4076', '#ffffff'].forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.fillRect(0, i * 13.34, 60, 13.4);
      });
    });
  },
  georgia(ctx) {
    flagFrame(ctx, () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 60, 40);
      ctx.fillStyle = '#e8112d';
      ctx.fillRect(25.5, 0, 9, 40);
      ctx.fillRect(0, 15.5, 60, 9);
      for (const [x, y] of [[13, 8], [47, 8], [13, 32], [47, 32]]) {
        ctx.fillRect(x - 1.2, y - 4, 2.4, 8);
        ctx.fillRect(x - 4, y - 1.2, 8, 2.4);
      }
    });
  },
  turkey(ctx) {
    flagFrame(ctx, () => {
      ctx.fillStyle = '#e30a17';
      ctx.fillRect(0, 0, 60, 40);
      ellipse(ctx, 22, 20, 10, 10, '#ffffff', false);
      ellipse(ctx, 24.6, 20, 8, 8, '#e30a17', false);
      star(ctx, 33.5, 20, 4.6, '#ffffff', Math.PI);
    });
  },
};

// --- Postcards (100x70 units): placeholders until real photos arrive -------

function postcardSky(ctx, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, 70);
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 100, 70);
}

function dome(ctx, x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  strokePts(ctx, [[x, y - r], [x, y - r - 3]], 0.6, C.gold);
  strokePts(ctx, [[x - 1.2, y - r - 2], [x + 1.2, y - r - 2]], 0.6, C.gold);
}

// Belgrade: Temple of Saint Sava over the river at sunset.
function serbiaCard(ctx) {
  postcardSky(ctx, ['#ffb27a', '#ffd6a0', '#ffe9c8']);
  ellipse(ctx, 78, 22, 7, 7, 'rgba(255,248,220,0.9)', false);
  ctx.fillStyle = '#c99a8a';
  for (const [x, w, h] of [[2, 8, 10], [10, 6, 14], [17, 9, 8], [70, 8, 12], [80, 10, 9], [91, 8, 13]]) ctx.fillRect(x, 52 - h, w, h);
  ctx.fillStyle = '#f2ede4';
  ctx.fillRect(34, 30, 32, 22);
  ctx.fillRect(28, 38, 44, 14);
  dome(ctx, 50, 30, 11, '#7fa79a');
  dome(ctx, 36, 38, 5, '#7fa79a');
  dome(ctx, 64, 38, 5, '#7fa79a');
  ctx.fillStyle = '#b9c6d6';
  for (let x = 37; x < 64; x += 5) ctx.fillRect(x, 42, 2, 6);
  ctx.fillStyle = '#4f7fae';
  ctx.fillRect(0, 52, 100, 18);
  ctx.fillStyle = 'rgba(255,220,170,0.5)';
  for (let y = 55; y < 70; y += 4) ctx.fillRect(40 + (y % 8), y, 22 - (y % 6), 0.8);
}

// Kazbegi: Gergeti Trinity Church on a hill under snowy Mount Kazbek.
function georgiaCard(ctx) {
  postcardSky(ctx, ['#7fc0f0', '#bfe3fb', '#eaf6ff']);
  shape(ctx, (c) => {
    c.moveTo(20, 52);
    c.lineTo(58, 8);
    c.lineTo(96, 52);
  }, '#8f9bb0', false);
  shape(ctx, (c) => {
    c.moveTo(47, 21);
    c.lineTo(58, 8);
    c.lineTo(69, 21);
    c.lineTo(63, 18);
    c.lineTo(58, 23);
    c.lineTo(53, 18);
  }, '#ffffff', false);
  shape(ctx, (c) => {
    c.moveTo(0, 70);
    c.lineTo(0, 46);
    c.quadraticCurveTo(26, 30, 52, 48);
    c.quadraticCurveTo(76, 40, 100, 50);
    c.lineTo(100, 70);
  }, '#6fae5a', false);
  ctx.fillStyle = '#b59a76';
  ctx.fillRect(20, 34, 12, 8);
  ctx.fillRect(28, 30, 5, 12);
  shape(ctx, (c) => {
    c.moveTo(27.4, 30);
    c.lineTo(30.5, 24);
    c.lineTo(33.6, 30);
  }, '#8a7356', false);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.ellipse(16, 14, 10, 3, 0, 0, Math.PI * 2);
  ctx.ellipse(86, 20, 8, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Cappadocia: hot-air balloons over fairy chimneys at sunrise.
function turkeyCard(ctx) {
  postcardSky(ctx, ['#ff9fae', '#ffc9a8', '#ffe8c8']);
  const balloon = (x, y, r, colors) => {
    colors.forEach((color, i) => {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 1.15, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = color;
      ctx.fillRect(x - r + (i * 2 * r) / colors.length, y - r * 1.2, (2 * r) / colors.length + 0.2, r * 2.4);
      ctx.restore();
    });
    strokePts(ctx, [[x - r * 0.5, y + r * 1.05], [x - r * 0.25, y + r * 1.6]], 0.3, '#5a3820');
    strokePts(ctx, [[x + r * 0.5, y + r * 1.05], [x + r * 0.25, y + r * 1.6]], 0.3, '#5a3820');
    ctx.fillStyle = '#7a4e2a';
    ctx.fillRect(x - r * 0.28, y + r * 1.6, r * 0.56, r * 0.4);
  };
  balloon(22, 16, 6, ['#e04848', '#ffd23f', '#e04848', '#ffd23f']);
  balloon(70, 12, 8, ['#3d7bd9', '#ffffff', '#3d7bd9', '#ffffff']);
  balloon(48, 26, 4, ['#21a038', '#ff9a3c', '#21a038']);
  balloon(88, 30, 3, ['#8e3a6e', '#f27fb5', '#8e3a6e']);
  for (const [x, w, h] of [[6, 10, 26], [18, 8, 20], [34, 12, 30], [52, 9, 22], [66, 12, 28], [84, 10, 24]]) {
    shape(ctx, (c) => {
      c.moveTo(x, 70);
      c.quadraticCurveTo(x + w * 0.1, 70 - h, x + w / 2, 70 - h);
      c.quadraticCurveTo(x + w * 0.9, 70 - h, x + w, 70);
    }, '#d8a878', false);
    ellipse(ctx, x + w / 2, 70 - h, w * 0.3, 1.6, '#a87850', false);
  }
  ctx.fillStyle = '#c99868';
  ctx.fillRect(0, 64, 100, 6);
}

export const POSTCARD_SIZE = { w: 1100, h: 770 };

export function buildTravelArt() {
  const card = (draw) => canvasOf(100, 70, POSTCARD_SIZE.w / 100, draw);
  return {
    plane: canvasOf(200, 82, 3.2, plane),
    cloud: canvasOf(112, 56, 3.2, cloud),
    sky: canvasOf(8, 1080, 1, sky),
    flags: Object.fromEntries(Object.entries(FLAGS).map(([k, draw]) => [k, canvasOf(60, 40, 3, draw)])),
    postcards: { serbia: card(serbiaCard), georgia: card(georgiaCard), turkey: card(turkeyCard) },
  };
}
