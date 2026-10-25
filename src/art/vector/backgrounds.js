// Parallax layers per zone for a 1920x1080 game, drawn smooth from layouts
// authored in quarter-scale units (480 wide, floor top at y = 230).

import { FONT } from './draw.js';

const K = 4;
const FLOOR = [64, 40];


// Per zone, back to front: canvas name, parallax factor (share of the world
// scroll) and where it sits (top: at y = 0, floor: bottom on the floor line,
// ground: top on the floor line, bottom: at the screen bottom). front layers
// pass over the play field.
export const LAYERS = {
  office: [
    { name: 'sky', factor: 0.04, anchor: 'top' },
    { name: 'wall', factor: 0.12, anchor: 'top' },
    { name: 'back', factor: 0.3, anchor: 'floor' },
    { name: 'ceiling', factor: 0.42, anchor: 'top' },
    { name: 'mid', factor: 0.6, anchor: 'floor' },
    { name: 'floor', factor: 1, anchor: 'ground' },
  ],
  backrooms: [
    { name: 'wall', factor: 0.1, anchor: 'top' },
    { name: 'stairs', factor: 0.22, anchor: 'floor' },
    { name: 'back', factor: 0.35, anchor: 'floor' },
    { name: 'ceiling', factor: 0.45, anchor: 'top' },
    { name: 'mid', factor: 0.6, anchor: 'floor' },
    { name: 'floor', factor: 1, anchor: 'ground' },
  ],
  street: [
    { name: 'sky', factor: 0.03, anchor: 'top' },
    { name: 'far', factor: 0.1, anchor: 'top' },
    { name: 'back', factor: 0.3, anchor: 'floor' },
    { name: 'mid', factor: 0.6, anchor: 'floor' },
    { name: 'floor', factor: 1, anchor: 'ground' },
  ],
};

function layer([w, h], draw) {
  const c = document.createElement('canvas');
  c.width = w * K;
  c.height = h * K;
  const ctx = c.getContext('2d');
  ctx.scale(K, K);
  draw(ctx);
  return c;
}

// Deterministic so layers look the same every run.
function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rr(ctx, x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

function circle(ctx, x, y, r, fill) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function vgrad(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
  return g;
}

function label(ctx, str, x, y, size, color, weight = 700) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function checkLogo(ctx, x, y, r, ring, mark) {
  circle(ctx, x, y, r, ring);
  ctx.beginPath();
  ctx.moveTo(x - r * 0.45, y + r * 0.02);
  ctx.lineTo(x - r * 0.1, y + r * 0.35);
  ctx.lineTo(x + r * 0.5, y - r * 0.32);
  ctx.lineWidth = r * 0.22;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = mark;
  ctx.stroke();
}

function skyline(ctx, rand, x0, x1, base, colors, lit, minH = 14, maxH = 54) {
  let x = x0;
  while (x < x1) {
    const w = 9 + rand() * 14;
    const h = minH + rand() * (maxH - minH);
    const bw = Math.min(w, x1 - x);
    ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
    ctx.beginPath();
    ctx.roundRect(x, base - h, bw, h + 2, [1.5, 1.5, 0, 0]);
    ctx.fill();
    if (rand() < 0.3) ctx.fillRect(x + bw / 2 - 0.4, base - h - 4, 0.8, 4);
    ctx.fillStyle = lit;
    for (let wy = base - h + 3; wy < base - 3; wy += 4) {
      for (let wx = x + 2; wx < x + bw - 2; wx += 3) {
        if (rand() < 0.35) ctx.fillRect(wx, wy, 1.2, 1.8);
      }
    }
    x += w + rand() * 3;
  }
}

// Stalinist high-rise silhouette.
function tower(ctx, x, base, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - 6, base);
  ctx.lineTo(x - 6, base - 30);
  ctx.lineTo(x, base - 30);
  ctx.lineTo(x, base - 50);
  ctx.lineTo(x + 3, base - 50);
  ctx.lineTo(x + 3, base - 64);
  ctx.lineTo(x + 6, base - 64);
  ctx.lineTo(x + 6, base - 76);
  ctx.lineTo(x + 8, base - 76);
  ctx.lineTo(x + 10, base - 98);
  ctx.lineTo(x + 12, base - 76);
  ctx.lineTo(x + 14, base - 76);
  ctx.lineTo(x + 14, base - 64);
  ctx.lineTo(x + 17, base - 64);
  ctx.lineTo(x + 17, base - 50);
  ctx.lineTo(x + 20, base - 50);
  ctx.lineTo(x + 20, base - 30);
  ctx.lineTo(x + 26, base - 30);
  ctx.lineTo(x + 26, base);
  ctx.closePath();
  ctx.fill();
}

function shadowed(ctx, draw, blur = 3, alpha = 0.18) {
  ctx.save();
  ctx.shadowColor = `rgba(40,40,70,${alpha})`;
  ctx.shadowBlur = blur * K;
  ctx.shadowOffsetY = 1 * K;
  draw();
  ctx.restore();
}

// --- Office ----------------------------------------------------------------
// A modern Sber open space: floor-to-ceiling windows onto Moscow City, a
// dark open ceiling with linear lights, glass meeting rooms, a moss wall,
// agile boards, bench desks and lots of plants.

const SBER_GREEN = '#21a038';

// Lightens everything already drawn on a layer: far things look hazier.
function veil(ctx, w, h, color) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function sberLogo(ctx, x, y, r) {
  const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  g.addColorStop(0, '#f2e913');
  g.addColorStop(0.35, '#42d152');
  g.addColorStop(0.65, SBER_GREEN);
  g.addColorStop(1, '#1db6e6');
  circle(ctx, x, y, r, g);
  ctx.beginPath();
  ctx.moveTo(x - r * 0.42, y + r * 0.02);
  ctx.lineTo(x - r * 0.08, y + r * 0.34);
  ctx.lineTo(x + r * 0.52, y - r * 0.34);
  ctx.lineWidth = r * 0.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
}

// Glass skyscraper: horizontal gradient for the curved glass, floor lines.
function glassTower(ctx, x, w, top, base, [c1, c2], spire = 0) {
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, c1);
  g.addColorStop(0.55, c2);
  g.addColorStop(1, c1);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x, base);
  ctx.lineTo(x, top + 3);
  ctx.quadraticCurveTo(x + w / 2, top - 2, x + w, top + 3);
  ctx.lineTo(x + w, base);
  ctx.fill();
  if (spire) ctx.fillRect(x + w / 2 - 0.4, top - spire, 0.8, spire);
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  for (let y = top + 5; y < base; y += 2.4) ctx.fillRect(x, y, w, 0.45);
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(x + w * 0.2, top + 4, w * 0.12, base - top - 4);
}

function moscowCity(ctx, base) {
  const haze = ['#86a9c8', '#a9c6de'];
  ctx.save();
  ctx.translate(222, 0);
  glassTower(ctx, 118, 10, 92, base, haze);
  glassTower(ctx, 130, 13, 66, base, ['#6f93b8', '#9dbfdc']);
  glassTower(ctx, 146, 11, 84, base, haze);
  glassTower(ctx, 160, 16, 40, base, ['#6a92bb', '#a6c8e4'], 16);
  glassTower(ctx, 179, 13, 72, base, ['#a07d5c', '#d0ab84']);
  glassTower(ctx, 195, 12, 96, base, ['#7a9cbf', '#b4d0e6']);
  // Evolution: the twisted one.
  ctx.save();
  ctx.beginPath();
  ctx.rect(210, 88, 12, base - 88);
  ctx.clip();
  glassTower(ctx, 210, 12, 88, base, ['#7fa3c6', '#bcd6ea']);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 0.7;
  for (let y = 80; y < base; y += 7) {
    ctx.beginPath();
    ctx.moveTo(210, y);
    ctx.quadraticCurveTo(216, y + 6, 222, y + 2);
    ctx.stroke();
  }
  ctx.restore();
  glassTower(ctx, 226, 10, 104, base, haze);
  ctx.restore();
}

function officeSky(ctx) {
  const rand = rng(21);
  ctx.fillStyle = vgrad(ctx, 0, 230, ['#86bfea', '#b9dbf3', '#e4f1f9']);
  ctx.fillRect(0, 0, 480, 230);
  for (const [cx, cy, s] of [[60, 52, 1.3], [250, 40, 1], [400, 64, 1.5], [330, 30, 0.7]]) {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 16 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 9 * s, cy - 4 * s, 10 * s, 6 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(cx - 8 * s, cy - 2 * s, 8 * s, 4 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  skyline(ctx, rand, 0, 480, 196, ['#bed2e3', '#b3c9dc'], 'rgba(255,255,255,0.45)', 8, 26);
  moscowCity(ctx, 196);
  tower(ctx, 70, 196, '#a3bbd0');
  skyline(ctx, rand, 0, 480, 214, ['#8fa9c1', '#839fb9'], '#dce8f2', 12, 34);
  ctx.fillStyle = vgrad(ctx, 150, 230, ['rgba(230,240,248,0)', 'rgba(230,240,248,0.7)']);
  ctx.fillRect(0, 150, 480, 80);
}

// Back wall: dark open ceiling, glass curtain wall (see-through to the sky
// layer), a light-wood wall with the Sber logo.
function officeWall(ctx) {
  ctx.fillStyle = vgrad(ctx, 0, 28, ['#262a31', '#353a43']);
  ctx.fillRect(0, 0, 480, 28);
  for (let x = 6; x < 480; x += 40) {
    rr(ctx, x, 20, 26, 1.4, 0.7, '#fffbe8');
    const glow = ctx.createLinearGradient(0, 21, 0, 34);
    glow.addColorStop(0, 'rgba(255,250,225,0.35)');
    glow.addColorStop(1, 'rgba(255,250,225,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 3, 21, 32, 13);
  }
  ctx.fillStyle = '#e7ebee';
  ctx.fillRect(0, 28, 480, 3);

  // Glass: a faint tint, roller blinds part-way down, reflections.
  const panes = [];
  for (let x = 0; x < 176; x += 44) panes.push(x);
  for (let x = 304; x < 480; x += 44) panes.push(x);
  ctx.fillStyle = 'rgba(205,230,248,0.12)';
  for (const x of panes) ctx.fillRect(x, 31, 44, 199);
  for (const [x, drop] of [[0, 44], [88, 22], [348, 58], [436, 30]]) {
    ctx.fillStyle = 'rgba(248,247,242,0.9)';
    ctx.fillRect(x + 1, 31, 42, drop);
    rr(ctx, x + 1, 31 + drop - 1.5, 42, 2, 1, '#cfd3d6');
  }
  ctx.fillStyle = 'rgba(255,255,255,0.13)';
  for (const x of [20, 120, 330, 420]) {
    ctx.beginPath();
    ctx.moveTo(x, 31);
    ctx.lineTo(x + 16, 31);
    ctx.lineTo(x - 30, 230);
    ctx.lineTo(x - 46, 230);
    ctx.fill();
  }
  ctx.fillStyle = '#2f343b';
  for (const x of [0, 44, 88, 132, 176, 304, 348, 392, 436, 480]) ctx.fillRect(x - 1.2, 31, 2.4, 199);
  ctx.fillRect(0, 31, 176, 1.6);
  ctx.fillRect(304, 31, 176, 1.6);

  // Light-wood slat wall with the logo.
  ctx.fillStyle = vgrad(ctx, 31, 230, ['#d6a877', '#c2915f']);
  ctx.fillRect(177, 31, 126, 199);
  ctx.fillStyle = 'rgba(110,70,35,0.35)';
  for (let x = 180; x < 303; x += 4) ctx.fillRect(x, 31, 0.7, 199);
  ctx.fillStyle = vgrad(ctx, 31, 60, ['rgba(0,0,0,0.18)', 'rgba(0,0,0,0)']);
  ctx.fillRect(177, 31, 126, 29);
  shadowed(ctx, () => sberLogo(ctx, 216, 70, 12), 3, 0.25);
  ctx.save();
  ctx.shadowColor = 'rgba(40,30,20,0.3)';
  ctx.shadowBlur = 3 * K;
  ctx.font = `800 17px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('СБЕР', 232, 71.2);
  ctx.restore();
}

// Suspended linear lamps and an exposed duct, nearer than the back wall.
function officeCeiling(ctx) {
  ctx.fillStyle = vgrad(ctx, 2, 11, ['#9aa2ac', '#e2e6ea', '#a7afb8']);
  ctx.fillRect(0, 2, 480, 9);
  ctx.fillStyle = 'rgba(60,66,76,0.45)';
  for (let x = 30; x < 480; x += 80) ctx.fillRect(x, 1.5, 2, 10);
  for (const x of [24, 184, 344]) {
    ctx.fillStyle = '#20242b';
    ctx.fillRect(x + 6, 11, 0.5, 22);
    ctx.fillRect(x + 84, 11, 0.5, 22);
    const glow = ctx.createLinearGradient(0, 35, 0, 48);
    glow.addColorStop(0, 'rgba(255,250,225,0.45)');
    glow.addColorStop(1, 'rgba(255,250,225,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 4, 35, 98, 13);
    rr(ctx, x, 32, 90, 2.4, 1, '#20242b');
    rr(ctx, x + 0.5, 34, 89, 1.3, 0.6, '#fffdf0');
  }
}

function monitor(ctx, x, y) {
  rr(ctx, x + 9.5, y + 12, 2, 6, 0.6, '#5b616b');
  rr(ctx, x + 6, y + 17.5, 9, 1.4, 0.6, '#5b616b');
  rr(ctx, x, y, 21, 13, 1.2, '#3a3f48');
  rr(ctx, x + 1.2, y + 1.2, 18.6, 10.6, 0.6, '#5d6b80');
}

// Mesh office chair seen from behind, light so it doesn't read as the obstacle.
function deskChair(ctx, x, base) {
  rr(ctx, x - 7, base - 40, 14, 18, 4, '#c3c9d1');
  rr(ctx, x - 8, base - 21, 16, 3, 1.5, '#aab2bc');
  rr(ctx, x - 0.8, base - 18, 1.6, 13, 0.6, '#9aa2ad');
  rr(ctx, x - 9, base - 5, 18, 1.6, 0.8, '#9aa2ad');
  for (const dx of [-8, 0, 8]) circle(ctx, x + dx, base - 1.4, 1.4, '#8a929d');
}

// Colleague on a desk chair, seen from behind. seat: y of the chair seat.
function colleague(ctx, x, seat, { hair, top, bun = false, headphones = false }) {
  ctx.fillStyle = top;
  ctx.beginPath();
  ctx.moveTo(x - 10, seat);
  ctx.quadraticCurveTo(x - 10, seat - 19, x, seat - 19);
  ctx.quadraticCurveTo(x + 10, seat - 19, x + 10, seat);
  ctx.fill();
  circle(ctx, x, seat - 25, 7.5, hair);
  if (bun) circle(ctx, x + 1, seat - 32.5, 3.4, hair);
  if (!headphones) return;
  ctx.beginPath();
  ctx.arc(x, seat - 25, 8.5, Math.PI * 1.05, Math.PI * 1.95);
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = '#2b2f38';
  ctx.stroke();
  rr(ctx, x - 9.5, seat - 27, 3, 5, 1.2, '#2b2f38');
  rr(ctx, x + 6.5, seat - 27, 3, 5, 1.2, '#2b2f38');
}

function monstera(ctx, x, base, s, colors) {
  const [dark, light] = colors;
  for (const [a, len, flip] of [[-2.2, 22, 1], [-1.6, 26, -1], [-1.15, 24, 1], [-0.6, 20, -1], [-2.7, 16, -1]]) {
    const tx = x + Math.cos(a) * len * s;
    const ty = base + Math.sin(a) * len * s;
    ctx.strokeStyle = dark;
    ctx.lineWidth = 0.9 * s;
    ctx.beginPath();
    ctx.moveTo(x, base);
    ctx.quadraticCurveTo(x + Math.cos(a) * len * 0.3 * s, ty + 4 * s, tx, ty);
    ctx.stroke();
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(a + Math.PI / 2);
    ctx.scale(flip, 1);
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-9 * s, -2 * s, -9 * s, -14 * s, 0, -16 * s);
    ctx.bezierCurveTo(9 * s, -14 * s, 9 * s, -2 * s, 0, 0);
    ctx.fill();
    ctx.strokeStyle = dark;
    ctx.lineWidth = 0.7 * s;
    ctx.beginPath();
    ctx.moveTo(0, -1 * s);
    ctx.lineTo(0, -14 * s);
    for (let i = 1; i < 4; i++) {
      ctx.moveTo(0, -i * 3.6 * s);
      ctx.lineTo(-7 * s, -i * 3.6 * s - 2.2 * s);
    }
    ctx.stroke();
    ctx.restore();
  }
}

function planter(ctx, x, base, w, h) {
  ctx.fillStyle = vgrad(ctx, base - h, base, ['#ffffff', '#dfe4e9']);
  ctx.beginPath();
  ctx.moveTo(x - w / 2, base - h);
  ctx.lineTo(x + w / 2, base - h);
  ctx.lineTo(x + w / 2 - 1.5, base);
  ctx.lineTo(x - w / 2 + 1.5, base);
  ctx.fill();
}

// Glass meeting room with a frosted band and its name.
function meetingRoom(ctx, x0, x1, name) {
  const top = 6;
  const base = 140;
  rr(ctx, x0, top, x1 - x0, base - top, 1, '#f1f4f6');
  rr(ctx, x0 + 14, base - 32, x1 - x0 - 40, 3.5, 1, '#d9c3a5');
  ctx.fillStyle = 'rgba(225,240,250,0.3)';
  ctx.fillRect(x0, top, x1 - x0, base - top);
  ctx.fillStyle = 'rgba(250,252,253,0.9)';
  ctx.fillRect(x0, 56, x1 - x0, 20);
  label(ctx, name, x0 + 37, 66.3, 6, '#8a929d', 800);
  ctx.fillStyle = '#6b717b';
  for (let x = x0; x <= x1; x += (x1 - x0) / 4) ctx.fillRect(x - 0.6, top, 1.2, base - top);
  ctx.fillRect(x0, top, x1 - x0, 1.4);
}

function mossWall(ctx, x0, x1) {
  const rand = rng(31);
  rr(ctx, x0 - 2.5, 12, x1 - x0 + 5, 128, 2, '#a97c52');
  ctx.fillStyle = '#356f33';
  ctx.fillRect(x0, 15, x1 - x0, 112);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, 15, x1 - x0, 112);
  ctx.clip();
  const greens = ['#3a7a37', '#428640', '#4a9147'];
  for (let i = 0; i < 70; i++) {
    circle(ctx, x0 + rand() * (x1 - x0), 15 + rand() * 112, 3 + rand() * 4, greens[Math.floor(rand() * greens.length)]);
  }
  ctx.restore();
  rr(ctx, x0 - 2.5, 126, x1 - x0 + 5, 14, 1.5, '#c39466');
}

function phoneBooth(ctx, x) {
  rr(ctx, x, 22, 44, 118, 3, '#2f8f4e');
  rr(ctx, x, 22, 44, 6, [3, 3, 0, 0], '#26763f');
  const light = ctx.createLinearGradient(0, 30, 0, 136);
  light.addColorStop(0, '#fff8de');
  light.addColorStop(1, '#efe4c2');
  rr(ctx, x + 5, 31, 34, 104, 1.5, light);
  ctx.fillStyle = 'rgba(220,238,250,0.35)';
  ctx.fillRect(x + 5, 31, 34, 104);
  rr(ctx, x + 33, 74, 1.4, 14, 0.6, '#c9ccd6');
}

function lounge(ctx, x) {
  rr(ctx, x + 10, 104, 58, 22, 6, '#2e8b57');
  rr(ctx, x + 8, 116, 62, 16, 5, '#3aa165');
  rr(ctx, x + 12, 131, 3, 8, 1, '#2b2f38');
  rr(ctx, x + 63, 131, 3, 8, 1, '#2b2f38');
}

function officeBack(ctx) {
  meetingRoom(ctx, 8, 178, '«Дедлайн»');
  mossWall(ctx, 206, 270);
  phoneBooth(ctx, 312);
  lounge(ctx, 396);
  veil(ctx, 480, 140, 'rgba(238,244,248,0.5)');
}

// people: { [chair index]: colleague look } for the occupied chairs.
function benchDesk(ctx, x, people = {}) {
  rr(ctx, x, 20, 150, 18, 2, '#6fb07b');
  [6, 44, 82, 118].forEach((dx) => monitor(ctx, x + dx, 16));
  rr(ctx, x, 38, 150, 3.5, 1, '#f4f6f8');
  rr(ctx, x, 41, 150, 1.5, 0.6, '#d0a674');
  for (const dx of [3, 72, 144.5]) rr(ctx, x + dx, 42.5, 2.4, 39.5, 0.8, '#e1e5e9');
  [24, 62, 104].forEach((dx, i) => {
    deskChair(ctx, x + dx, 82);
    if (people[i]) colleague(ctx, x + dx, 61, people[i]);
  });
}

function officeMid(ctx) {
  benchDesk(ctx, 6, {
    0: { hair: '#3a2a20', top: SBER_GREEN, bun: true, headphones: true },
    2: { hair: '#8d8d96', top: '#ffffff' },
  });
  planter(ctx, 184, 82, 16, 18);
  monstera(ctx, 184, 64, 1, ['#3c7f4a', '#55a465']);
  benchDesk(ctx, 214, {
    1: { hair: '#6a4a32', top: '#3d7bd9', headphones: true },
    2: { hair: '#2b2133', top: '#c9ced6', bun: true },
  });
  planter(ctx, 410, 82, 14, 14);
  monstera(ctx, 410, 68, 0.9, ['#3c7f4a', '#55a465']);
  veil(ctx, 480, 82, 'rgba(240,246,250,0.35)');
}

// Light oak planks.
function officeFloor(ctx) {
  ctx.fillStyle = vgrad(ctx, 0, 40, ['#dcbb90', '#c9a174']);
  ctx.fillRect(0, 0, 64, 40);
  ctx.fillStyle = vgrad(ctx, 0, 6, ['rgba(70,45,20,0.35)', 'rgba(70,45,20,0)']);
  ctx.fillRect(0, 0, 64, 6);
  for (let row = 0, y = 1.5; y < 40; row++, y += 6.5) {
    ctx.fillStyle = 'rgba(95,62,30,0.18)';
    ctx.fillRect(0, y, 64, 0.5);
    for (const off of [(row * 19) % 64, (row * 19 + 37) % 64]) ctx.fillRect(off, y, 0.5, 6.5);
  }
  ctx.fillStyle = vgrad(ctx, 0, 40, ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0)']);
  ctx.fillRect(0, 0, 64, 40);
}

// --- Backrooms: Sber's service floor ---------------------------------------
// Two-tone painted walls with pipes and the vault door, a stairwell and the
// freight lift, archive racks, boxes and pallets. No people. Kept pale and
// calm so the money piles, safes and shelves read clearly.

const PAINT = '#b3c5bb';
const CARDBOARD = '#cfa874';

function pipe(ctx, y, h, x0, x1, [c1, c2, c3]) {
  ctx.fillStyle = vgrad(ctx, y, y + h, [c1, c2, c3]);
  ctx.fillRect(x0, y, x1 - x0, h);
}

function backroomsWall(ctx) {
  ctx.fillStyle = vgrad(ctx, 0, 24, ['#474c55', '#575d67']);
  ctx.fillRect(0, 0, 480, 24);
  ctx.fillStyle = '#e8eae6';
  ctx.fillRect(0, 24, 480, 98);
  ctx.fillStyle = PAINT;
  ctx.fillRect(0, 122, 480, 108);
  ctx.fillStyle = '#93aa9d';
  ctx.fillRect(0, 120, 480, 2.4);
  pipe(ctx, 31, 7, 0, 480, ['#c9ced4', '#eef0f2', '#a9b0b8']);
  pipe(ctx, 42, 3.2, 0, 480, ['#c75a50', '#e07a6e', '#a8473f']);
  ctx.fillStyle = '#8a929d';
  for (let x = 20; x < 480; x += 60) ctx.fillRect(x, 29, 2.4, 17);
  // Vault door.
  circle(ctx, 340, 156, 44, '#8f98a3');
  circle(ctx, 340, 156, 39, '#b5bdc6');
  circle(ctx, 340, 156, 31, '#a3acb6');
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    circle(ctx, 340 + Math.cos(a) * 35, 156 + Math.sin(a) * 35, 1.6, '#7d8691');
  }
  ctx.strokeStyle = '#6f7883';
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI) / 3 + 0.3;
    ctx.beginPath();
    ctx.moveTo(340 - Math.cos(a) * 14, 156 - Math.sin(a) * 14);
    ctx.lineTo(340 + Math.cos(a) * 14, 156 + Math.sin(a) * 14);
    ctx.stroke();
  }
  circle(ctx, 340, 156, 5, '#6f7883');
  rr(ctx, 312, 98, 56, 9, 1.5, '#4f5864');
  label(ctx, 'ХРАНИЛИЩЕ', 340, 102.8, 5.6, '#e8eae6', 800);
  // Exit sign, vent grille, service sign.
  rr(ctx, 64, 56, 34, 13, 1.5, SBER_GREEN);
  label(ctx, 'ВЫХОД →', 81, 62.8, 5.2, '#ffffff', 800);
  rr(ctx, 160, 62, 30, 16, 1, '#d2d6d9');
  ctx.fillStyle = '#a9b0b8';
  for (let y = 65; y < 76; y += 2.6) ctx.fillRect(163, y, 24, 1);
  rr(ctx, 196, 92, 62, 14, 1, '#ffffff');
  label(ctx, 'СЛУЖЕБНОЕ', 227, 96.4, 4.6, '#4f5864', 800);
  label(ctx, 'ПОМЕЩЕНИЕ', 227, 102.2, 4.6, '#4f5864', 800);
}

// Concrete stair flight up to a landing, with a railing; the freight lift.
function backroomsStairs(ctx) {
  const base = 180;
  ctx.fillStyle = '#c4c8cc';
  ctx.beginPath();
  ctx.moveTo(20, base);
  for (let i = 0; i < 12; i++) {
    const x = 20 + i * 10;
    const y = base - i * 8;
    ctx.lineTo(x, y - 8);
    ctx.lineTo(x + 10, y - 8);
  }
  ctx.lineTo(200, base - 96);
  ctx.lineTo(200, base - 90);
  ctx.lineTo(140, base - 90);
  ctx.lineTo(40, base);
  ctx.fill();
  ctx.fillStyle = '#d8dbde';
  ctx.fillRect(140, base - 96, 60, 6);
  ctx.fillStyle = '#e2c13c';
  ctx.fillRect(20, base - 8, 10, 1.6);
  ctx.strokeStyle = '#5b636e';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(24, base - 34);
  ctx.lineTo(140, base - 126);
  ctx.lineTo(200, base - 126);
  ctx.stroke();
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 12; i++) {
    const x = 26 + i * 10;
    ctx.beginPath();
    ctx.moveTo(x, base - 10 - i * 8);
    ctx.lineTo(x, base - 34 - i * 7.9);
    ctx.stroke();
  }
  for (let x = 146; x < 200; x += 10) {
    ctx.beginPath();
    ctx.moveTo(x, base - 96);
    ctx.lineTo(x, base - 126);
    ctx.stroke();
  }
  // Freight lift.
  rr(ctx, 270, 70, 84, 110, 1, '#e2c13c');
  ctx.fillStyle = '#4f5864';
  for (let i = 0; i < 12; i++) ctx.fillRect(270 + i * 7, 70, 3.5, 6);
  rr(ctx, 276, 78, 72, 102, 1, '#a9b0b8');
  rr(ctx, 278, 80, 33, 100, 0.5, '#bfc5cc');
  rr(ctx, 313, 80, 33, 100, 0.5, '#bfc5cc');
  rr(ctx, 290, 60, 44, 8, 1, '#4f5864');
  label(ctx, 'ГРУЗОВОЙ', 312, 64.3, 4.6, '#e8eae6', 800);
  veil(ctx, 480, 180, 'rgba(236,240,240,0.35)');
}

function archiveBox(ctx, x, y, w, h, tag) {
  rr(ctx, x, y, w, h, 0.8, CARDBOARD);
  ctx.fillStyle = 'rgba(120,80,40,0.25)';
  ctx.fillRect(x, y + h * 0.18, w, 0.7);
  if (tag) {
    rr(ctx, x + w * 0.2, y + h * 0.4, w * 0.6, h * 0.3, 0.5, '#f7f3ea');
    label(ctx, tag, x + w / 2, y + h * 0.56, Math.min(4, h * 0.22), '#6b5a48', 800);
  }
}

// Warehouse racking with archive boxes, and a wire storage cage.
function backroomsBack(ctx) {
  const tags = ['АРХИВ', '', '', 'ДЕЛА', '', '', '2019', ''];
  let n = 0;
  for (const x0 of [10, 170]) {
    for (const x of [x0, x0 + 140]) rr(ctx, x, 6, 4, 124, 1, '#5a6b8a');
    for (const y of [34, 74, 114]) {
      rr(ctx, x0, y, 144, 3.5, 0.8, '#e8822e');
      for (let bx = x0 + 6; bx < x0 + 136; bx += 26) archiveBox(ctx, bx, y - 22, 22, 22, tags[n++ % tags.length]);
    }
  }
  // Wire cage.
  rr(ctx, 334, 20, 136, 110, 1, 'rgba(120,130,145,0.18)');
  ctx.strokeStyle = 'rgba(95,105,120,0.55)';
  ctx.lineWidth = 0.4;
  for (let x = 334; x <= 470; x += 4) {
    ctx.beginPath();
    ctx.moveTo(x, 20);
    ctx.lineTo(x, 130);
    ctx.stroke();
  }
  for (let y = 20; y <= 130; y += 4) {
    ctx.beginPath();
    ctx.moveTo(334, y);
    ctx.lineTo(470, y);
    ctx.stroke();
  }
  ctx.fillStyle = '#5a6b8a';
  for (const x of [334, 402, 470]) ctx.fillRect(x - 1, 18, 2, 112);
  ctx.fillRect(334, 18, 136, 2);
  rr(ctx, 396, 70, 6, 8, 1.5, '#d9a93a');
  veil(ctx, 480, 130, 'rgba(238,241,240,0.45)');
}

function backroomsCeiling(ctx) {
  pipe(ctx, 3, 8, 0, 480, ['#9aa2ac', '#d9dde1', '#a7afb8']);
  rr(ctx, 0, 14, 480, 3, 0, '#6f7883');
  for (const x of [40, 200, 360]) {
    ctx.fillStyle = '#4f5864';
    ctx.fillRect(x + 10, 11, 0.6, 18);
    ctx.fillRect(x + 70, 11, 0.6, 18);
    const glow = ctx.createLinearGradient(0, 32, 0, 46);
    glow.addColorStop(0, 'rgba(240,250,255,0.5)');
    glow.addColorStop(1, 'rgba(240,250,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 4, 32, 88, 14);
    rr(ctx, x, 28, 80, 3, 1, '#d9dde1');
    rr(ctx, x + 2, 31, 76, 1.6, 0.8, '#f4fbff');
  }
}

function boxStack(ctx, x, base, rows) {
  rows.forEach((count, row) => {
    for (let i = 0; i < count; i++) {
      const w = 20;
      archiveBox(ctx, x + i * (w + 1) + row * 10, base - (row + 1) * 16, w, 16, '');
      ctx.fillStyle = 'rgba(200,170,120,0.8)';
      ctx.fillRect(x + i * (w + 1) + row * 10 + w / 2 - 1.5, base - (row + 1) * 16, 3, 16);
    }
  });
}

function pallet(ctx, x, base, w) {
  rr(ctx, x, base - 2, w, 2, 0.4, '#b88b5a');
  rr(ctx, x, base - 6, w, 2, 0.4, '#b88b5a');
  for (const dx of [2, w / 2 - 2, w - 6]) rr(ctx, x + dx, base - 4, 4, 2, 0.3, '#9c7247');
}

function column(ctx, x, base) {
  rr(ctx, x, 0, 16, base, 0, '#d4d7d9');
  ctx.fillStyle = '#c4c8cc';
  ctx.fillRect(x + 12, 0, 4, base);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i % 2 ? '#2f343b' : '#e2c13c';
    ctx.fillRect(x, base - 12 + i * 3, 16, 3);
  }
}

function backroomsMid(ctx) {
  const base = 80;
  pallet(ctx, 14, base, 66);
  boxStack(ctx, 16, base - 6, [3, 2, 1]);
  column(ctx, 120, base);
  // Stretch-wrapped pallet.
  pallet(ctx, 168, base, 58);
  rr(ctx, 168, base - 50, 58, 44, 2, '#d8c29c');
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(168, base - 50, 58, 44);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (let y = base - 46; y < base - 8; y += 7) ctx.fillRect(168, y, 58, 1);
  // Pallet jack.
  ctx.strokeStyle = '#e8822e';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(240, base - 3);
  ctx.lineTo(276, base - 3);
  ctx.lineTo(276, base - 30);
  ctx.stroke();
  circle(ctx, 274, base - 2, 2, '#2f343b');
  boxStack(ctx, 318, base, [2, 1]);
  column(ctx, 380, base);
  boxStack(ctx, 412, base, [3, 2]);
  veil(ctx, 480, 80, 'rgba(238,241,240,0.3)');
}

// Smooth grey concrete with a painted safety line.
function backroomsFloor(ctx) {
  ctx.fillStyle = vgrad(ctx, 0, 40, ['#a7adb4', '#949aa2']);
  ctx.fillRect(0, 0, 64, 40);
  ctx.fillStyle = 'rgba(60,66,76,0.25)';
  ctx.fillRect(0, 0, 64, 1);
  ctx.fillStyle = '#e2c13c';
  ctx.fillRect(0, 4, 64, 1.8);
  ctx.fillStyle = 'rgba(70,76,86,0.14)';
  ctx.fillRect(31.6, 6, 0.8, 34);
  ctx.fillRect(0, 22, 64, 0.6);
  ctx.fillStyle = vgrad(ctx, 0, 40, ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0)']);
  ctx.fillRect(0, 0, 64, 40);
}

// --- Street: winter Chelyabinsk --------------------------------------------
// Frosty sky with the 2013 meteor's trail, factory chimneys and the
// Chelyabinsk-City tower in the haze, the opera theatre, Kirovka's merchant
// houses and the New Year ice town under snow, birches and street lamps.
// Kept pale and calm so obstacles read clearly.

const SNOW = '#f7f9fc';

// Snow lying on a ledge or roof: a flat cap with a soft rounded edge.
function snowCap(ctx, x, y, w, h = 2.4) {
  rr(ctx, x - 0.8, y - h, w + 1.6, h + 0.6, h / 2, SNOW);
}

function streetSky(ctx) {
  ctx.fillStyle = vgrad(ctx, 0, 230, ['#9db3d8', '#c6cde6', '#eedde6', '#fbe8df']);
  ctx.fillRect(0, 0, 480, 230);
  const sun = ctx.createRadialGradient(370, 150, 0, 370, 150, 70);
  sun.addColorStop(0, 'rgba(255,244,228,1)');
  sun.addColorStop(0.12, 'rgba(255,238,220,0.75)');
  sun.addColorStop(1, 'rgba(255,238,220,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(300, 80, 140, 140);
  const trail = ctx.createLinearGradient(70, 26, 150, 74);
  trail.addColorStop(0, 'rgba(255,255,255,0)');
  trail.addColorStop(1, 'rgba(255,250,236,0.85)');
  ctx.strokeStyle = trail;
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(70, 26);
  ctx.lineTo(150, 74);
  ctx.stroke();
  circle(ctx, 150, 74, 1.6, '#fffaf0');
}

function panelBlock(ctx, x, w, h, base, color) {
  rr(ctx, x, base - h, w, h, 0.6, color);
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  for (let y = base - h + 3; y < base - 2; y += 4) {
    for (let wx = x + 2; wx < x + w - 2; wx += 4) ctx.fillRect(wx, y, 2, 1.8);
  }
  snowCap(ctx, x, base - h, w, 1.6);
}

function chimney(ctx, x, base, h, rand) {
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 ? '#e6eaf1' : '#d9a3a3';
    ctx.fillRect(x, base - h + (i * h) / 6, 5, h / 6 + 0.2);
  }
  // Smoke rising straight up in the frost.
  for (let i = 0; i < 7; i++) {
    circle(ctx, x + 2.5 + i * 1.6 + rand() * 2, base - h - 5 - i * 7, 4 + i * 1.6, `rgba(250,250,252,${0.8 - i * 0.09})`);
  }
}

function streetFar(ctx) {
  const rand = rng(41);
  const base = 206;
  for (const [x, w, h] of [[0, 46, 44], [52, 38, 58], [96, 50, 40], [270, 44, 52], [318, 36, 38], [440, 40, 48]]) panelBlock(ctx, x, w, h, base, '#b4bfd4');
  // Chelyabinsk-City: glass tower with a lit crown.
  glassTower(ctx, 196, 22, 84, base, ['#93aed0', '#c4d6ec']);
  rr(ctx, 199, 70, 16, 15, 1, '#a7bfdd');
  rr(ctx, 203, 62, 8, 9, 1, '#b7cbe5');
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (let y = 72; y < 84; y += 3) ctx.fillRect(200, y, 14, 0.8);
  rr(ctx, 206.5, 52, 1, 10, 0.5, '#93aed0');
  // Steel works.
  rr(ctx, 356, base - 26, 80, 26, 1, '#aab5ca');
  for (let x = 358; x < 434; x += 10) {
    ctx.fillStyle = '#aab5ca';
    ctx.beginPath();
    ctx.moveTo(x, base - 26);
    ctx.lineTo(x + 5, base - 32);
    ctx.lineTo(x + 10, base - 26);
    ctx.fill();
  }
  snowCap(ctx, 356, base - 26, 80, 1.4);
  chimney(ctx, 366, base - 20, 70, rand);
  chimney(ctx, 392, base - 20, 84, rand);
  chimney(ctx, 418, base - 20, 62, rand);
  ctx.fillStyle = vgrad(ctx, 150, 230, ['rgba(250,240,242,0)', 'rgba(250,244,246,0.75)']);
  ctx.fillRect(0, 150, 480, 80);
  ctx.fillStyle = SNOW;
  ctx.fillRect(0, base, 480, 24);
}

// Glinka opera theatre: cream facade, a portico of eight columns, statues on top.
function operaTheatre(ctx, x) {
  const base = 120;
  rr(ctx, x, 52, 150, 68, 1, '#efd9a8');
  ctx.fillStyle = '#ffffff';
  for (const wx of [8, 22, 118, 132]) {
    rr(ctx, x + wx, 66, 8, 16, [4, 4, 0, 0], '#c9b58c');
    rr(ctx, x + wx, 92, 8, 14, [4, 4, 0, 0], '#c9b58c');
  }
  rr(ctx, x + 38, 44, 74, 8, 0.5, '#f4e4bd');
  ctx.fillStyle = '#e7cf9a';
  ctx.fillRect(x + 38, 52, 74, 8);
  for (let i = 0; i < 8; i++) rr(ctx, x + 41 + i * 9.4, 60, 4.2, 52, 1, '#fbf6ea');
  rr(ctx, x + 36, 112, 78, 3, 0.5, '#e0e4ea');
  rr(ctx, x + 32, 115, 86, 5, 0.5, '#d4d9e1');
  for (const sx of [44, 62, 88, 106]) {
    rr(ctx, x + sx, 35, 3, 9, 1.2, '#b9a98a');
    circle(ctx, x + sx + 1.5, 34, 1.6, '#b9a98a');
  }
  snowCap(ctx, x, 52, 150);
  snowCap(ctx, x + 38, 44, 74);
  snowCap(ctx, x + 36, 112, 78, 1.4);
}

// Kirovka merchant house: pastel walls, white trims, arched windows.
function merchantHouse(ctx, x, w, h, wall) {
  const top = 120 - h;
  rr(ctx, x, top, w, h, 0.8, wall);
  ctx.fillStyle = '#7b8396';
  ctx.beginPath();
  ctx.moveTo(x - 2, top);
  ctx.lineTo(x + w / 2, top - 12);
  ctx.lineTo(x + w + 2, top);
  ctx.fill();
  ctx.fillStyle = SNOW;
  ctx.beginPath();
  ctx.moveTo(x - 3, top + 0.5);
  ctx.lineTo(x + w / 2, top - 13);
  ctx.lineTo(x + w + 3, top + 0.5);
  ctx.lineTo(x + w / 2, top - 9);
  ctx.fill();
  for (let wy = top + 8; wy < 104; wy += 20) {
    for (let wx = x + 6; wx < x + w - 8; wx += 13) {
      rr(ctx, wx - 1, wy - 1, 9, 13, [5, 5, 0, 0], '#ffffff');
      rr(ctx, wx, wy, 7, 11, [4, 4, 0, 0], '#c5d3e6');
      snowCap(ctx, wx - 1, wy + 12, 9, 1);
    }
  }
  rr(ctx, x + w / 2 - 6, 104, 12, 16, [6, 6, 0, 0], '#8b6b52');
}

function newYearTree(ctx, x) {
  for (const [y, w] of [[118, 30], [100, 24], [84, 18], [70, 12]]) {
    ctx.fillStyle = '#4f8f6a';
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.lineTo(x, y - 22);
    ctx.lineTo(x + w, y);
    ctx.fill();
    snowCap(ctx, x - w + 2, y, w * 2 - 4, 1.2);
  }
  label(ctx, '★', x, 46, 10, '#ffd23f');
  const lights = ['#ffd23f', '#f27fb5', '#7fe3ff'];
  for (let i = 0; i < 14; i++) circle(ctx, x - 20 + ((i * 37) % 40), 70 + ((i * 23) % 46), 1.2, lights[i % 3]);
}

// Ice town on the square: translucent slide and blocks.
function iceTown(ctx, x) {
  ctx.fillStyle = 'rgba(190,232,248,0.85)';
  ctx.beginPath();
  ctx.moveTo(x, 120);
  ctx.lineTo(x, 84);
  ctx.lineTo(x + 14, 84);
  ctx.quadraticCurveTo(x + 30, 86, x + 52, 120);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillRect(x + 3, 88, 1.4, 30);
  for (let i = 0; i < 5; i++) rr(ctx, x + 1, 92 + i * 6, 12, 1, 0.5, 'rgba(255,255,255,0.7)');
  rr(ctx, x - 2, 82, 18, 3, 1, 'rgba(160,215,240,0.95)');
}

function streetBack(ctx) {
  operaTheatre(ctx, 14);
  merchantHouse(ctx, 186, 54, 58, '#e9bdb5');
  merchantHouse(ctx, 246, 46, 50, '#b5d9cb');
  newYearTree(ctx, 334);
  iceTown(ctx, 380);
  merchantHouse(ctx, 440, 44, 54, '#efd9a8');
  ctx.fillStyle = SNOW;
  ctx.fillRect(0, 117, 480, 3);
  veil(ctx, 480, 120, 'rgba(244,246,251,0.4)');
}

function birch(ctx, x, base) {
  rr(ctx, x - 2, base - 66, 4, 66, 2, '#f2f2ee');
  ctx.fillStyle = '#4b4f5c';
  for (const [dy, w] of [[8, 2.2], [20, 1.6], [31, 2.4], [45, 1.4], [56, 2]]) ctx.fillRect(x - 2 + (dy % 3) * 0.6, base - dy, w, 0.9);
  ctx.strokeStyle = '#6d6a6a';
  ctx.lineWidth = 0.8;
  ctx.lineCap = 'round';
  for (const [y, dx, dy] of [[-58, -14, -12], [-50, 13, -10], [-40, -11, -8], [-64, 6, -14], [-30, 10, -7]]) {
    ctx.beginPath();
    ctx.moveTo(x, base + y);
    ctx.quadraticCurveTo(x + dx * 0.5, base + y + dy * 0.2, x + dx, base + y + dy);
    ctx.stroke();
    circle(ctx, x + dx * 0.7, base + y + dy * 0.6 - 0.6, 1.6, SNOW);
  }
}

// Kirovka street lamp: black post, lantern with a warm glow.
function streetLamp(ctx, x, base) {
  const glow = ctx.createRadialGradient(x, base - 58, 0, x, base - 58, 14);
  glow.addColorStop(0, 'rgba(255,226,160,0.5)');
  glow.addColorStop(1, 'rgba(255,226,160,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - 14, base - 72, 28, 28);
  rr(ctx, x - 1, base - 52, 2, 52, 1, '#3a3f4f');
  rr(ctx, x - 3, base - 6, 6, 6, 1, '#3a3f4f');
  rr(ctx, x - 3.5, base - 62, 7, 9, 1.5, '#ffe9b0');
  rr(ctx, x - 4.5, base - 64, 9, 2.4, 1, '#3a3f4f');
  snowCap(ctx, x - 4.5, base - 64, 9, 1.4);
}

function snowBench(ctx, x, base) {
  rr(ctx, x, base - 14, 30, 2.4, 1, '#8a6a52');
  rr(ctx, x, base - 9, 30, 2.4, 1, '#8a6a52');
  rr(ctx, x + 3, base - 7, 2, 7, 0.8, '#3a3f4f');
  rr(ctx, x + 25, base - 7, 2, 7, 0.8, '#3a3f4f');
  snowCap(ctx, x, base - 9, 30, 2.2);
}

function drift(ctx, x, w, h, base) {
  ctx.fillStyle = SNOW;
  ctx.beginPath();
  ctx.moveTo(x, base);
  ctx.quadraticCurveTo(x + w * 0.3, base - h, x + w * 0.55, base - h * 0.8);
  ctx.quadraticCurveTo(x + w * 0.8, base - h * 0.6, x + w, base);
  ctx.fill();
}

function streetMid(ctx) {
  const base = 80;
  birch(ctx, 30, base);
  streetLamp(ctx, 96, base);
  snowBench(ctx, 140, base);
  birch(ctx, 214, base);
  streetLamp(ctx, 286, base);
  birch(ctx, 360, base);
  streetLamp(ctx, 440, base);
  for (const [x, w, h] of [[0, 60, 7], [110, 80, 5], [200, 50, 8], [300, 90, 6], [410, 70, 7]]) drift(ctx, x, w, h, base);
  veil(ctx, 480, 80, 'rgba(244,246,251,0.2)');
}

// Packed snow on the pavement.
function streetFloor(ctx) {
  ctx.fillStyle = vgrad(ctx, 0, 40, ['#eef2f8', '#d9e0ea']);
  ctx.fillRect(0, 0, 64, 40);
  ctx.fillStyle = 'rgba(150,165,190,0.25)';
  ctx.fillRect(0, 0, 64, 1);
  ctx.fillStyle = 'rgba(160,172,195,0.18)';
  for (const [x, y, w] of [[4, 9, 14], [30, 15, 20], [12, 24, 16], [44, 31, 12], [52, 6, 8]]) rr(ctx, x, y, w, 1.6, 0.8, 'rgba(160,172,195,0.22)');
}

export function buildBackgrounds() {
  return {
    office: {
      sky: layer([480, 230], officeSky),
      wall: layer([480, 230], officeWall),
      back: layer([480, 140], officeBack),
      ceiling: layer([480, 48], officeCeiling),
      mid: layer([480, 82], officeMid),
      floor: layer(FLOOR, officeFloor),
    },
    backrooms: {
      wall: layer([480, 230], backroomsWall),
      stairs: layer([480, 180], backroomsStairs),
      back: layer([480, 130], backroomsBack),
      ceiling: layer([480, 46], backroomsCeiling),
      mid: layer([480, 80], backroomsMid),
      floor: layer(FLOOR, backroomsFloor),
    },
    street: {
      sky: layer([480, 230], streetSky),
      far: layer([480, 230], streetFar),
      back: layer([480, 120], streetBack),
      mid: layer([480, 80], streetMid),
      floor: layer(FLOOR, streetFloor),
    },
  };
}
