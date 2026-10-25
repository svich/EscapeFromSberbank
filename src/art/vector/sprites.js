// All game sprites as frame sheets. Art is authored in units and rendered at
// UNIT px per unit for a 1920x1080 game. Ground objects rest with the frame
// bottom on the floor.

import { C, OW, capsule, ellipse, renderSheet, roundRect, shape, strokePts, text, toPx } from './draw.js';
import { buildHero } from './hero.js';

export const UNIT = 2.75;

// --- Obstacles ---------------------------------------------------------------

function papers(ctx) {
  roundRect(ctx, 2, 18, 27, 8.5, 1.6, C.paper);
  for (const y of [20.6, 22.6, 24.4]) strokePts(ctx, [[3.5, y], [27.5, y]], 0.5, C.paperShade);
  roundRect(ctx, 4.5, 10.5, 25, 8.5, 1.6, C.paper);
  for (const y of [13, 15, 16.8]) strokePts(ctx, [[6, y], [28, y]], 0.5, C.paperShade);
  ctx.save();
  ctx.translate(16, 7);
  ctx.rotate(-0.07);
  roundRect(ctx, -13.5, -4.5, 25, 8.5, 1.6, C.paper);
  for (const y of [-2.2, -0.2, 1.8]) strokePts(ctx, [[-11, y], [2, y]], 0.6, C.line);
  roundRect(ctx, 3.5, -3.2, 7.4, 6, 1.2, C.red, false);
  text(ctx, 'KPI', 7.2, -0.1, 3.6, C.white);
  ctx.restore();
}

function chair(ctx) {
  for (const x of [4, 24]) capsule(ctx, [[14, 33], [x, 37]], 2, C.suitShade);
  capsule(ctx, [[14, 33], [14, 37.5]], 2, C.suitShade);
  for (const [x, y] of [[4, 39], [24, 39], [14, 39.4]]) ellipse(ctx, x, y, 2, 2, C.lash);
  roundRect(ctx, 12.8, 25, 2.4, 9, 1, C.gray);
  roundRect(ctx, 12.5, 18, 3, 7, 1, C.suitShade);
  roundRect(ctx, 6, 2, 16, 18, 5, C.suit);
  roundRect(ctx, 8.5, 4.5, 11, 13, 3.5, C.suitLight, false);
  roundRect(ctx, 3, 21.5, 22, 5.5, 2.75, C.suit);
  strokePts(ctx, [[5.5, 23.2], [22.5, 23.2]], 1, C.suitLight);
  capsule(ctx, [[21.5, 21], [21.5, 16.5], [17, 16.5]], 1.6, C.suitShade);
}

// Chibi effective manager walking toward the player (facing left) with a red
// KPI folder. Leg joints are [knee, foot] relative to the hip; forward is -x.
const MANAGER_WALK = [
  { front: [[-4, 9], [-7, 18]], back: [[3, 9], [6, 18]], bob: 0 },
  { front: [[-1, 9], [0, 18]], back: [[1, 8], [3, 15]], bob: -1 },
  { front: [[3, 9], [6, 18]], back: [[-4, 9], [-7, 18]], bob: 0 },
  { front: [[1, 8], [3, 15]], back: [[-1, 9], [0, 18]], bob: -1 },
];

function managerLeg(ctx, hip, [knee, foot], color) {
  const k = [hip[0] + knee[0], hip[1] + knee[1]];
  const f = [hip[0] + foot[0], hip[1] + foot[1]];
  capsule(ctx, [hip, k, f], 8.5, color);
  ellipse(ctx, f[0] - 2, f[1] + 1.6, 4.4, 2.3, C.lash);
}

function manager({ front, back, bob }) {
  return (ctx) => {
    const y = bob;
    managerLeg(ctx, [32, 66 + y], back, C.suitShade);
    managerLeg(ctx, [24, 66 + y], front, C.suit);

    // Jacket, shirt, tie, belt.
    shape(ctx, (c) => {
      c.moveTo(14, 45 + y);
      c.quadraticCurveTo(28, 37 + y, 42, 45 + y);
      c.lineTo(43, 67 + y);
      c.quadraticCurveTo(28, 70 + y, 13, 67 + y);
    }, C.suit);
    shape(ctx, (c) => {
      c.moveTo(22.5, 41 + y);
      c.lineTo(33.5, 41 + y);
      c.lineTo(28, 54 + y);
    }, C.white);
    shape(ctx, (c) => {
      c.moveTo(28, 43 + y);
      c.lineTo(30, 46 + y);
      c.lineTo(29.2, 57 + y);
      c.lineTo(28, 59 + y);
      c.lineTo(26.8, 57 + y);
      c.lineTo(26, 46 + y);
    }, C.green);
    strokePts(ctx, [[22, 43 + y], [26, 53 + y]], 0.9, C.suitShade);
    strokePts(ctx, [[34, 43 + y], [30, 53 + y]], 0.9, C.suitShade);
    strokePts(ctx, [[14.2, 63.5 + y], [42.6, 63.5 + y]], 1.5, C.lash);
    roundRect(ctx, 26.5, 62.3 + y, 3, 2.4, 0.6, C.gold, false);

    // Big bald head with grey sides, glasses and a frown.
    const hx = 28;
    const hy = 22 + y;
    const r = 17.5;
    ellipse(ctx, hx, hy, r, r, C.skin);
    ctx.save();
    ctx.beginPath();
    ctx.arc(hx, hy, r, 0, Math.PI * 2);
    ctx.clip();
    ellipse(ctx, hx + 13, hy + 3, 7, 10, C.gray, false);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(hx, hy, r, 0, Math.PI * 2);
    ctx.lineWidth = OW;
    ctx.strokeStyle = C.outline;
    ctx.stroke();
    ellipse(ctx, hx + 15.5, hy + 4, 2.6, 3.6, C.skin);
    ctx.save();
    ctx.translate(hx - 7, hy - 11);
    ctx.rotate(-0.45);
    ellipse(ctx, 0, 0, 5, 2.4, 'rgba(255,255,255,0.75)', false);
    ctx.restore();
    ellipse(ctx, hx - 16.5, hy + 7.5, 2.4, 2.2, C.skin);
    strokePts(ctx, [[hx - 15, hy - 3.5], [hx - 8, hy - 1.5]], 1.6, C.suitShade);
    strokePts(ctx, [[hx - 3, hy - 1.5], [hx + 4, hy - 3.5]], 1.6, C.suitShade);
    strokePts(ctx, [[hx + 4.5, hy + 2.6], [hx + 13, hy + 2.2]], 1.2, C.lash);
    for (const gx of [hx - 11, hx]) {
      ellipse(ctx, gx, hy + 3, 4.6, 4.2, 'rgba(207,234,255,0.9)', false);
      ctx.beginPath();
      ctx.ellipse(gx, hy + 3, 4.6, 4.2, 0, 0, Math.PI * 2);
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = C.lash;
      ctx.stroke();
      ellipse(ctx, gx + 0.4, hy + 3.4, 1.1, 1.1, C.lash, false);
    }
    strokePts(ctx, [[hx - 6.4, hy + 2.6], [hx - 4.6, hy + 2.6]], 1.2, C.lash);
    ctx.beginPath();
    ctx.moveTo(hx - 11, hy + 12.5);
    ctx.quadraticCurveTo(hx - 7, hy + 10.6, hx - 3, hy + 12.5);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = C.lash;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Arm holding the KPI folder in front.
    roundRect(ctx, 1.5, 50 + y, 14, 17, 1.6, C.red);
    roundRect(ctx, 3, 48.5 + y, 10, 3, 0.6, C.paper);
    text(ctx, 'KPI', 8.5, 58.5 + y, 4.2, C.white);
    capsule(ctx, [[18, 46 + y], [13, 52 + y], [12.5, 57.5 + y]], 5.5, C.suit);
    ellipse(ctx, 12.5, 58.5 + y, 2.6, 2.6, C.skin);
  };
}

function logo(ctx) {
  const g = ctx.createRadialGradient(15, 13, 2, 20, 20, 19);
  g.addColorStop(0, '#6bd884');
  g.addColorStop(0.55, C.green);
  g.addColorStop(1, C.greenDark);
  ellipse(ctx, 20, 20, 18.6, 18.6, g);
  strokePts(ctx, [[11, 21], [17.5, 27], [29, 13]], 4.4 + OW * 2, C.outline);
  strokePts(ctx, [[11, 21], [17.5, 27], [29, 13]], 4.4, C.white);
  ctx.save();
  ctx.translate(12.5, 10);
  ctx.rotate(-0.6);
  ellipse(ctx, 0, 0, 4.2, 2, 'rgba(255,255,255,0.45)', false);
  ctx.restore();
}

// Flying meeting invite: calendar with flapping wings. Slide under it.
function wing(ctx, side, angle) {
  ctx.save();
  ctx.translate(side < 0 ? 15 : 41, 15);
  ctx.scale(side, 1);
  ctx.rotate(-angle);
  for (const [ox, oy, rx, ry, rot] of [[6.5, 4.6, 5.4, 2.4, 0.3], [7.8, 1.4, 6.6, 2.8, 0], [6.4, -2, 7, 3.2, -0.35]]) {
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(rot);
    ellipse(ctx, 0, 0, rx, ry, C.white);
    ctx.restore();
  }
  ctx.restore();
}

function meeting(angle, dy) {
  return (ctx) => {
    ctx.translate(0, dy);
    wing(ctx, -1, angle);
    wing(ctx, 1, angle);
    roundRect(ctx, 14, 4, 28, 27, 3.5, C.white);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(14, 4, 28, 27, 3.5);
    ctx.clip();
    ctx.fillStyle = C.red;
    ctx.fillRect(14, 4, 28, 8.5);
    ctx.restore();
    ctx.beginPath();
    ctx.roundRect(14, 4, 28, 27, 3.5);
    ctx.lineWidth = OW;
    ctx.strokeStyle = C.outline;
    ctx.stroke();
    text(ctx, 'СОЗВОН', 28, 8.4, 3.8, C.white);
    for (const x of [20, 36]) capsule(ctx, [[x, 2.4], [x, 5.6]], 1.4, C.gray);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        const hot = row === 1 && col === 2;
        roundRect(ctx, 17 + col * 6, 15 + row * 5, 4, 3.4, 0.8, hot ? C.red : C.paperShade, false);
      }
    }
  };
}

// --- Pickups -----------------------------------------------------------------

function coffee(phase) {
  return (ctx) => {
    for (const [x0, k] of [[9.5, 0], [14.5, 1]]) {
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) {
        const x = x0 + Math.sin(phase + i * 0.9 + k * 2) * 1.2;
        const y = 8.5 - i;
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.stroke();
    }
    shape(ctx, (c) => {
      c.moveTo(4.5, 13);
      c.lineTo(19.5, 13);
      c.lineTo(17.5, 30);
      c.quadraticCurveTo(12, 31, 6.5, 30);
    }, C.white);
    shape(ctx, (c) => {
      c.moveTo(5.1, 18);
      c.lineTo(18.9, 18);
      c.lineTo(18.2, 25);
      c.lineTo(5.8, 25);
    }, C.coffee);
    ellipse(ctx, 12, 21.5, 2.3, 2.3, C.green, false);
    strokePts(ctx, [[10.9, 21.6], [11.8, 22.5], [13.3, 20.7]], 0.7, C.white);
    roundRect(ctx, 3.2, 10.5, 17.6, 3.6, 1.6, C.paperShade);
    roundRect(ctx, 6.5, 8.6, 11, 2.4, 1.2, C.paperShade);
  };
}

function sparkle(ctx, x, y, r) {
  shape(ctx, (c) => {
    c.moveTo(x, y - r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.quadraticCurveTo(x, y, x, y + r);
    c.quadraticCurveTo(x, y, x - r, y);
    c.quadraticCurveTo(x, y, x, y - r);
  }, C.white, false);
}

function offer(ctx) {
  const glow = ctx.createRadialGradient(14, 17, 0, 14, 17, 15);
  glow.addColorStop(0, 'rgba(255,230,120,0.55)');
  glow.addColorStop(1, 'rgba(255,230,120,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 28, 34);
  shape(ctx, (c) => {
    c.moveTo(4, 3);
    c.lineTo(19, 3);
    c.lineTo(24, 8);
    c.lineTo(24, 31);
    c.lineTo(4, 31);
  }, C.paper);
  shape(ctx, (c) => {
    c.moveTo(19, 3);
    c.lineTo(19, 8);
    c.lineTo(24, 8);
  }, C.paperShade);
  text(ctx, 'ОФФЕР', 12, 8.2, 3.8, C.green);
  for (const [y, x1] of [[12.5, 21], [15.5, 19], [18.5, 20]]) strokePts(ctx, [[7, y], [x1, y]], 0.9, C.line);
  for (const dx of [-1.6, 1.6]) {
    shape(ctx, (c) => {
      c.moveTo(18 + dx - 1.4, 26);
      c.lineTo(18 + dx + 1.4, 26);
      c.lineTo(18 + dx * 1.8, 31);
    }, C.red);
  }
  ellipse(ctx, 18, 24.5, 3.8, 3.8, C.gold);
  ellipse(ctx, 18, 24.5, 2.3, 2.3, C.goldDark, false);
  sparkle(ctx, 25, 3.5, 2.4);
  sparkle(ctx, 3, 27, 1.6);
}

// Exit: green EXIT sign over an open door full of daylight.
function door(ctx) {
  const glow = ctx.createRadialGradient(35, 76, 4, 35, 76, 52);
  glow.addColorStop(0, 'rgba(255,248,200,0.7)');
  glow.addColorStop(1, 'rgba(255,248,200,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 18, 70, 106);
  const signGlow = ctx.createRadialGradient(35, 9.5, 2, 35, 9.5, 24);
  signGlow.addColorStop(0, 'rgba(126,224,143,0.6)');
  signGlow.addColorStop(1, 'rgba(126,224,143,0)');
  ctx.fillStyle = signGlow;
  ctx.fillRect(5, 0, 60, 22);
  roundRect(ctx, 17, 2, 36, 15, 3, C.green);
  text(ctx, 'ВЫХОД', 35, 9.8, 7.6, C.white);

  roundRect(ctx, 6, 22, 58, 100.5, 3, C.suit);
  const light = ctx.createLinearGradient(0, 26, 0, 122);
  light.addColorStop(0, '#fffbe6');
  light.addColorStop(1, '#ffe39a');
  roundRect(ctx, 10, 26, 50, 96, 2, light, false);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  for (const [x0, x1] of [[28, 34], [40, 45], [50, 53]]) {
    ctx.beginPath();
    ctx.moveTo(x0, 26);
    ctx.lineTo(x1, 26);
    ctx.lineTo(x1 - 14, 122);
    ctx.lineTo(x0 - 22, 122);
    ctx.closePath();
    ctx.fill();
  }
  shape(ctx, (c) => {
    c.moveTo(10, 26);
    c.lineTo(23, 31);
    c.lineTo(23, 117);
    c.lineTo(10, 122);
  }, 'rgba(207,234,255,0.85)');
  capsule(ctx, [[13, 72], [20.5, 73.5]], 1.6, C.gray);
}

export function buildSprites() {
  const px = toPx(UNIT);
  const sheet = (frames, fw, fh) => renderSheet(frames, fw, fh, UNIT);
  return {
    hero: buildHero(UNIT),
    papers: { ...sheet([papers], 32, 28), body: px({ x: 2, y: 3, w: 27, h: 24 }) },
    chair: { ...sheet([chair], 28, 42), body: px({ x: 3, y: 2, w: 22, h: 39 }) },
    manager: {
      ...sheet(MANAGER_WALK.map(manager), 56, 89),
      anims: { walk: { frames: [0, 1, 2, 3], fps: 6 } },
      body: px({ x: 11, y: 5, w: 33, h: 83 }),
    },
    logo: { ...sheet([logo], 40, 40), body: px({ x: 2, y: 2, w: 36, h: 36 }), circle: px({ x: 20, y: 20, r: 18 }) },
    meeting: {
      ...sheet([meeting(0.55, 0), meeting(0, 0.6), meeting(-0.55, 1.2)], 56, 36),
      anims: { flap: { frames: [0, 1, 2, 1], fps: 10 } },
      body: px({ x: 14, y: 4, w: 28, h: 28 }),
    },
    coffee: {
      ...sheet([coffee(0), coffee(Math.PI)], 24, 32),
      anims: { steam: { frames: [0, 1], fps: 3 } },
      body: px({ x: 3, y: 8, w: 18, h: 23 }),
    },
    offer: { ...sheet([offer], 28, 34), body: px({ x: 4, y: 3, w: 20, h: 28 }) },
    door: { ...sheet([door], 70, 124), body: px({ x: 10, y: 26, w: 50, h: 96 }) },
  };
}
