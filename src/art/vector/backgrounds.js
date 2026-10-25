// Parallax layers per zone for a 1920x1080 game. far: 1920x920 (tiles),
// mid: 1920x440 (bottom sits on the floor top at y = 920), floor: 256x160 tile.
// Layouts are authored in quarter-scale units (480 wide) and drawn smooth.

import { FONT } from './draw.js';

const K = 4;
const FAR = [480, 230];
const MID = [480, 110];
const FLOOR = [64, 40];

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

function officeFar(ctx) {
  const rand = rng(7);
  ctx.fillStyle = vgrad(ctx, 0, 230, ['#f2f6f8', '#e1e9ee']);
  ctx.fillRect(0, 0, 480, 230);
  ctx.fillStyle = '#cdd6dd';
  ctx.fillRect(0, 0, 480, 14);
  for (let x = 10; x < 480; x += 60) {
    const glow = ctx.createLinearGradient(0, 10, 0, 40);
    glow.addColorStop(0, 'rgba(255,255,255,0.7)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.moveTo(x, 10);
    ctx.lineTo(x + 40, 10);
    ctx.lineTo(x + 52, 40);
    ctx.lineTo(x - 12, 40);
    ctx.fill();
    rr(ctx, x, 4, 40, 6, 2, '#ffffff');
  }
  for (const wx of [24, 184, 344]) {
    shadowed(ctx, () => rr(ctx, wx - 3, 34, 106, 116, 4, '#a3afbb'));
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(wx, 37, 100, 110, 2);
    ctx.clip();
    ctx.fillStyle = vgrad(ctx, 37, 147, ['#7fc0f0', '#bfe3fb', '#e3f4fd']);
    ctx.fillRect(wx, 37, 100, 110);
    for (const [cx, cy, s] of [[wx + 20, 55, 1], [wx + 70, 48, 0.8]]) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 9 * s, 3.5 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 6 * s, cy - 2.5 * s, 6 * s, 4 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (wx === 184) tower(ctx, wx + 58, 147, '#a9c3d9');
    skyline(ctx, rand, wx, wx + 100, 147, ['#a9c3d9', '#98b4cd'], '#eef5fb');
    skyline(ctx, rand, wx, wx + 100, 147, ['#7f9cb8'], '#f6e9a8', 10, 34);
    ctx.restore();
    rr(ctx, wx + 49, 37, 2, 110, 1, '#a3afbb');
    rr(ctx, wx - 5, 148, 110, 4, 2, '#c4ccd4');
  }
  const poster = (x, color, draw) => {
    shadowed(ctx, () => rr(ctx, x, 58, 28, 38, 2.5, color));
    draw(x);
  };
  poster(140, '#21a038', (x) => {
    checkLogo(ctx, x + 14, 72, 7, '#ffffff', '#21a038');
    label(ctx, 'МЫ —', x + 14, 85.5, 4.2, '#ffffff');
    label(ctx, 'КОМАНДА', x + 14, 90.5, 4.2, '#ffffff');
  });
  poster(300, '#ffffff', (x) => {
    rr(ctx, x, 58, 28, 7, [2.5, 2.5, 0, 0], '#e04848');
    label(ctx, 'KPI 146%', x + 14, 61.8, 3.8, '#ffffff');
    [8, 14, 11, 20].forEach((h, i) => rr(ctx, x + 4.5 + i * 5.2, 92 - h, 3.6, h, 1, '#21a038'));
  });
  poster(440, '#3d7bd9', (x) => {
    label(ctx, 'СИНЕРГИЯ', x + 14, 66, 3.6, '#ffffff');
    circle(ctx, x + 14, 80, 7, '#ffd23f');
    label(ctx, '★', x + 14, 80.5, 8, '#ffffff');
  });
  ctx.fillStyle = '#21a038';
  ctx.fillRect(0, 166, 480, 5);
  ctx.fillStyle = vgrad(ctx, 171, 230, ['#ccd5dd', '#bcc6d0']);
  ctx.fillRect(0, 171, 480, 59);
  for (let x = 4; x < 480; x += 40) rr(ctx, x, 177, 32, 46, 2, 'rgba(255,255,255,0.18)');
}

function officeMid(ctx) {
  const desk = (x) => {
    rr(ctx, x, 46, 5, 64, 2, '#8a94a2');
    rr(ctx, x, 46, 5, 4, 2, '#21a038');
    rr(ctx, x + 22, 56, 28, 20, 2.5, '#2b3040');
    ctx.fillStyle = vgrad(ctx, 58, 74, ['#4d8ae0', '#2f62b5']);
    ctx.beginPath();
    ctx.roundRect(x + 24, 58, 24, 15, 1.5);
    ctx.fill();
    for (let y = 61; y < 71; y += 3) rr(ctx, x + 26.5, y, 9 + ((y * 7) % 9), 1.2, 0.6, 'rgba(220,240,255,0.8)');
    rr(ctx, x + 34, 76, 4, 4, 1, '#2b3040');
    rr(ctx, x + 6, 80, 64, 5, 2, '#b3bbc5');
    rr(ctx, x + 6, 84, 64, 2, 1, '#8a94a2');
    rr(ctx, x + 9, 86, 3, 24, 1, '#7a8492');
    rr(ctx, x + 64, 86, 3, 24, 1, '#7a8492');
    rr(ctx, x + 53, 73, 7, 7, 1.5, '#ffffff');
    ctx.beginPath();
    ctx.arc(x + 60.5, 76.5, 2, -Math.PI / 2, Math.PI / 2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
  };
  const plant = (x) => {
    for (const [dx, dy, r] of [[7, 74, 7], [3, 80, 5.5], [11.5, 80, 5.5], [7, 68, 5]]) circle(ctx, x + dx, dy, r, '#3f9a52');
    circle(ctx, x + 5, 70, 2, '#6cc27e');
    circle(ctx, x + 10, 77, 1.8, '#6cc27e');
    rr(ctx, x + 1, 87, 12, 3, 1, '#a8482c');
    ctx.fillStyle = '#c45c3a';
    ctx.beginPath();
    ctx.moveTo(x + 2, 90);
    ctx.lineTo(x + 12, 90);
    ctx.lineTo(x + 10.5, 110);
    ctx.lineTo(x + 3.5, 110);
    ctx.fill();
  };
  const cooler = (x) => {
    rr(ctx, x, 76, 16, 34, 2.5, '#e9eef3');
    ctx.fillStyle = 'rgba(140,200,255,0.75)';
    ctx.beginPath();
    ctx.roundRect(x + 2, 56, 12, 21, [5, 5, 2, 2]);
    ctx.fill();
    rr(ctx, x + 4, 54, 8, 3, 1, '#3d7bd9');
    rr(ctx, x + 6, 84, 4, 3, 1, '#3d7bd9');
  };
  desk(10);
  plant(98);
  desk(130);
  cooler(222);
  desk(262);
  desk(352);
  plant(446);
}

function officeFloor(ctx) {
  ctx.fillStyle = vgrad(ctx, 0, 40, ['#6a788c', '#56637a']);
  ctx.fillRect(0, 0, 64, 40);
  ctx.fillStyle = '#9aa6b6';
  ctx.fillRect(0, 0, 64, 2);
  ctx.fillStyle = 'rgba(30,40,60,0.25)';
  ctx.fillRect(0, 2, 64, 1.5);
  ctx.fillStyle = 'rgba(30,40,60,0.18)';
  ctx.fillRect(0, 21, 64, 0.8);
  ctx.fillRect(0, 3, 0.8, 37);
  ctx.fillRect(32, 3, 0.8, 37);
}

// --- Lobby -----------------------------------------------------------------

function lobbyFar(ctx) {
  const rand = rng(11);
  ctx.fillStyle = vgrad(ctx, 0, 230, ['#f3eee4', '#e3dac8']);
  ctx.fillRect(0, 0, 480, 230);
  ctx.strokeStyle = 'rgba(190,175,150,0.35)';
  ctx.lineWidth = 0.6;
  for (let i = 0; i < 26; i++) {
    const x = rand() * 480;
    const y = 25 + rand() * 150;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + 8, y + 4, x + 12, y - 3, x + 22, y + 5);
    ctx.stroke();
  }
  ctx.fillStyle = '#3b3f4f';
  ctx.fillRect(0, 0, 480, 18);
  for (let x = 20; x < 480; x += 80) {
    const glow = ctx.createRadialGradient(x + 12, 20, 0, x + 12, 20, 30);
    glow.addColorStop(0, 'rgba(255,240,200,0.55)');
    glow.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 20, 18, 64, 34);
    rr(ctx, x, 17, 24, 3, 1.5, '#fff6d8');
  }
  for (const gx of [40, 350]) {
    shadowed(ctx, () => rr(ctx, gx, 60, 100, 112, 3, '#5c6b7c'));
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(gx + 3, 63, 94, 109, 2);
    ctx.clip();
    ctx.fillStyle = vgrad(ctx, 63, 172, ['#ffb27a', '#ffd08f', '#ffe6b0']);
    ctx.fillRect(gx + 3, 63, 94, 109);
    skyline(ctx, rand, gx + 3, gx + 97, 172, ['#c97a7a', '#b06a7a'], '#ffe8b0', 18, 60);
    ctx.restore();
    rr(ctx, gx + 49, 63, 2, 109, 1, '#5c6b7c');
  }
  for (const cx of [0, 160, 320]) {
    const g = ctx.createLinearGradient(cx, 0, cx + 18, 0);
    g.addColorStop(0, '#e2d8c4');
    g.addColorStop(0.35, '#f4eee2');
    g.addColorStop(1, '#c4b89f');
    ctx.fillStyle = g;
    ctx.fillRect(cx, 18, 18, 160);
    rr(ctx, cx - 2, 18, 22, 5, 1, '#d6ccb8');
  }
  shadowed(ctx, () => rr(ctx, 192, 44, 96, 64, 6, '#21a038'), 5, 0.25);
  checkLogo(ctx, 218, 76, 17, '#ffffff', '#21a038');
  label(ctx, 'БАНК', 259, 77, 15, '#ffffff');
  ctx.fillStyle = vgrad(ctx, 176, 230, ['#cfc4b0', '#bfb39c']);
  ctx.fillRect(0, 176, 480, 54);
}

function lobbyMid(ctx) {
  const turnstile = (x) => {
    rr(ctx, x, 72, 11, 38, 2.5, '#a6aebb');
    rr(ctx, x + 1, 72, 9, 4, 2, '#d3d9e2');
    circle(ctx, x + 5.5, 81, 1.8, '#21a038');
    rr(ctx, x + 11, 86, 18, 2.6, 1.3, '#d3d9e2');
    rr(ctx, x + 29, 72, 11, 38, 2.5, '#a6aebb');
    rr(ctx, x + 30, 72, 9, 4, 2, '#d3d9e2');
    circle(ctx, x + 34.5, 81, 1.8, '#e04848');
  };
  const palm = (x) => {
    ctx.fillStyle = '#8a6a3a';
    ctx.beginPath();
    ctx.moveTo(x + 8, 92);
    ctx.quadraticCurveTo(x + 6, 74, x + 10, 60);
    ctx.lineTo(x + 12, 60);
    ctx.quadraticCurveTo(x + 9, 76, x + 12, 92);
    ctx.fill();
    for (const [ang, len] of [[-2.6, 16], [-2.1, 14], [-1.0, 14], [-0.5, 16], [-1.57, 10]]) {
      ctx.save();
      ctx.translate(x + 11, 60);
      ctx.rotate(ang);
      ctx.fillStyle = '#3f9a52';
      ctx.beginPath();
      ctx.ellipse(len / 2, 0, len / 2, 2.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    rr(ctx, x + 3, 92, 16, 18, [2, 2, 4, 4], '#b07a4a');
  };
  const desk = (x) => {
    rr(ctx, x + 10, 64, 16, 11, 2, '#2b3040');
    rr(ctx, x + 12, 66, 12, 7, 1, '#4d8ae0');
    rr(ctx, x, 76, 82, 34, 4, '#4b5068');
    rr(ctx, x, 75, 82, 5, 2.5, '#6b7088');
    checkLogo(ctx, x + 41, 93, 6, '#21a038', '#ffffff');
  };
  palm(16);
  turnstile(70);
  turnstile(120);
  desk(200);
  palm(310);
  turnstile(370);
}

function lobbyFloor(ctx) {
  ctx.fillStyle = vgrad(ctx, 0, 40, ['#e6dfd1', '#d2c9b7']);
  ctx.fillRect(0, 0, 64, 40);
  ctx.fillStyle = '#f7f3ea';
  ctx.fillRect(0, 0, 64, 2);
  ctx.fillStyle = 'rgba(120,100,70,0.25)';
  ctx.fillRect(0, 2, 64, 1.2);
  ctx.fillStyle = 'rgba(120,100,70,0.15)';
  ctx.fillRect(0, 20, 64, 0.8);
  ctx.fillRect(0, 3, 0.8, 17);
  ctx.fillRect(32, 20.8, 0.8, 19.2);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(5, 7, 12, 0.8);
  ctx.fillRect(38, 27, 12, 0.8);
}

// --- Street ----------------------------------------------------------------

function streetFar(ctx) {
  const rand = rng(23);
  ctx.fillStyle = vgrad(ctx, 0, 230, ['#ff8a70', '#ffab78', '#ffcf8f', '#ffe7b4']);
  ctx.fillRect(0, 0, 480, 230);
  const sun = ctx.createRadialGradient(330, 128, 4, 330, 128, 50);
  sun.addColorStop(0, 'rgba(255,248,220,1)');
  sun.addColorStop(0.3, 'rgba(255,240,190,0.8)');
  sun.addColorStop(1, 'rgba(255,240,190,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(270, 70, 120, 120);
  circle(ctx, 330, 128, 14, '#fff3cf');
  ctx.fillStyle = 'rgba(255,225,205,0.9)';
  for (const [x, y, s] of [[70, 34, 1], [250, 52, 1.3], [430, 26, 0.8]]) {
    ctx.beginPath();
    ctx.ellipse(x, y, 16 * s, 3.5 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x - 6 * s, y - 2.5 * s, 8 * s, 3.5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  tower(ctx, 120, 200, '#c0687a');
  ctx.fillStyle = '#a65672';
  ctx.fillRect(419, 70, 4, 130);
  rr(ctx, 414, 112, 14, 6, 3, '#a65672');
  rr(ctx, 412, 150, 18, 5, 2.5, '#a65672');
  ctx.fillRect(420.5, 46, 1, 24);
  skyline(ctx, rand, 0, 480, 200, ['#c97a7a', '#bb6c7c'], '#ffe8b0', 14, 50);
  skyline(ctx, rand, 0, 480, 214, ['#8f4f6e', '#7f4566'], '#ffd27a', 8, 30);
  ctx.fillStyle = '#6a3a58';
  ctx.fillRect(0, 214, 480, 16);
}

function streetMid(ctx) {
  const tree = (x) => {
    ctx.fillStyle = '#7a4e3a';
    ctx.beginPath();
    ctx.moveTo(x + 11, 110);
    ctx.lineTo(x + 12, 64);
    ctx.lineTo(x + 15, 64);
    ctx.lineTo(x + 16, 110);
    ctx.fill();
    for (const [dx, dy, r] of [[13.5, 44, 14], [5, 52, 9], [22, 52, 9], [13.5, 30, 9]]) circle(ctx, x + dx, dy, r, '#3f9a52');
    for (const [dx, dy, r] of [[9, 36, 3], [19, 46, 2.5], [6, 50, 2]]) circle(ctx, x + dx, dy, r, '#6cc27e');
  };
  const lamp = (x) => {
    rr(ctx, x, 30, 3, 80, 1.5, '#4b5068');
    ctx.beginPath();
    ctx.moveTo(x + 1.5, 32);
    ctx.quadraticCurveTo(x + 2, 26, x + 10, 27);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#4b5068';
    ctx.stroke();
    rr(ctx, x + 7, 27, 8, 3.5, 1.5, '#4b5068');
    const glow = ctx.createRadialGradient(x + 11, 32, 0, x + 11, 32, 12);
    glow.addColorStop(0, 'rgba(255,240,190,0.9)');
    glow.addColorStop(1, 'rgba(255,240,190,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 1, 20, 24, 24);
  };
  const bench = (x) => {
    rr(ctx, x, 82, 36, 3.5, 1.5, '#9a6a44');
    rr(ctx, x, 90, 36, 4, 1.5, '#9a6a44');
    rr(ctx, x + 3, 94, 3, 16, 1, '#4b5068');
    rr(ctx, x + 30, 94, 3, 16, 1, '#4b5068');
  };
  const busStop = (x) => {
    rr(ctx, x, 48, 72, 6, 3, '#21a038');
    rr(ctx, x + 3, 54, 3, 56, 1.5, '#a6aebb');
    rr(ctx, x + 66, 54, 3, 56, 1.5, '#a6aebb');
    rr(ctx, x + 9, 57, 54, 40, 2, 'rgba(210,235,255,0.45)');
    rr(ctx, x + 11, 91, 50, 4, 2, '#9a6a44');
    rr(ctx, x + 50, 60, 10, 14, 1.5, '#ffffff');
    label(ctx, 'А', x + 55, 67, 7, '#21a038');
  };
  tree(10);
  lamp(70);
  bench(100);
  tree(170);
  busStop(230);
  lamp(330);
  tree(370);
  bench(420);
}

function streetFloor(ctx) {
  ctx.fillStyle = vgrad(ctx, 0, 40, ['#b9b9c2', '#a0a0aa']);
  ctx.fillRect(0, 0, 64, 40);
  ctx.fillStyle = '#dcdce4';
  ctx.fillRect(0, 0, 64, 3);
  ctx.fillStyle = 'rgba(60,60,80,0.3)';
  ctx.fillRect(0, 3, 64, 1.2);
  ctx.fillStyle = 'rgba(60,60,80,0.18)';
  for (let y = 15; y < 40; y += 12) ctx.fillRect(0, y, 64, 0.8);
  for (const [x, y] of [[0, 4], [32, 4], [16, 16], [48, 16], [0, 28], [32, 28]]) ctx.fillRect(x, y, 0.8, 11);
}

export function buildBackgrounds() {
  return {
    office: { far: layer(FAR, officeFar), mid: layer(MID, officeMid), floor: layer(FLOOR, officeFloor) },
    lobby: { far: layer(FAR, lobbyFar), mid: layer(MID, lobbyMid), floor: layer(FLOOR, lobbyFloor) },
    street: { far: layer(FAR, streetFar), mid: layer(MID, streetMid), floor: layer(FLOOR, streetFloor) },
  };
}
