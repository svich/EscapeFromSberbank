// All game sprites as frame sheets. Art is authored in units and rendered at
// UNIT px per unit for a 1920x1080 game. Ground objects rest with the frame
// bottom on the floor.

import { C, OW, capsule, ellipse, renderSheet, roundRect, shape, strokePts, text, toPx } from './draw.js';
import { buildHero } from './hero.js';

export const UNIT = 2.75;
// Elders stand a touch shorter than the hero; the manager towers over both.
const ELDER_SCALE = 1.65;
const MANAGER_SCALE = 1.35;

// --- Obstacles ---------------------------------------------------------------

// Elderly people from the bank queue, shuffling toward the player (facing
// left). Three variants, two waddle steps each. Short enough to jump over.
const ELDER_STEPS = [
  { front: [11, 36.6], back: [18, 36.6], bob: 0 },
  { front: [13.5, 36.6], back: [16, 36.6], bob: -0.6 },
];

function elderBody(ctx, { front, back, bob }, coat) {
  for (const [hip, foot, shade] of [[[17, 31 + bob], back, true], [[13, 31 + bob], front, false]]) {
    capsule(ctx, [hip, foot], 3.2, shade ? '#a8876f' : '#c9a68c');
    ellipse(ctx, foot[0] - 1, foot[1] + 1.3, 2.7, 1.5, '#3b2f2a');
  }
  shape(ctx, (c) => {
    c.moveTo(9.5, 21 + bob);
    c.quadraticCurveTo(15, 18.5 + bob, 20.5, 21 + bob);
    c.lineTo(23, 32 + bob);
    c.quadraticCurveTo(15, 35 + bob, 7, 32 + bob);
  }, coat);
  for (const y of [25, 28.5]) ellipse(ctx, 10.5, y + bob, 0.6, 0.6, C.lash, false);
}

function elderFace(ctx, x, y, glasses) {
  ellipse(ctx, x, y, 8.6, 8.6, C.skin);
  for (const ex of [x - 3.6, x + 1.6]) {
    if (glasses) {
      ellipse(ctx, ex, y + 0.6, 2.5, 2.3, 'rgba(207,234,255,0.6)', false);
      ctx.beginPath();
      ctx.ellipse(ex, y + 0.6, 2.5, 2.3, 0, 0, Math.PI * 2);
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = C.lash;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.ellipse(ex, y + 1.2, 1.3, 0.9, 0, Math.PI * 1.1, Math.PI * 1.9);
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = C.lash;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  if (glasses) strokePts(ctx, [[x - 1.1, y + 0.4], [x - 0.9, y + 0.4]], 0.8, C.lash);
  for (const bx of [x - 5.6, x + 3.6]) ellipse(ctx, bx, y + 3.4, 1.6, 1, 'rgba(255,120,130,0.45)', false);
  ctx.beginPath();
  ctx.moveTo(x - 2.8, y + 4.6);
  ctx.quadraticCurveTo(x - 1.2, y + 5.8, x + 0.4, y + 4.6);
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = C.lips;
  ctx.stroke();
  strokePts(ctx, [[x - 6.4, y - 0.6], [x - 5.6, y + 0.4]], 0.5, C.skinShade);
}

// Granny in a polka-dot headscarf pulling a checked shopping trolley.
function grannyTrolley(step) {
  return (ctx) => {
    const b = step.bob;
    roundRect(ctx, 24, 21 + b, 10, 13.5, 2, '#c94b4b');
    ctx.fillStyle = 'rgba(47,78,143,0.55)';
    for (const x of [26.5, 30.5]) ctx.fillRect(x, 21.4 + b, 1.6, 12.7);
    for (const y of [24.5, 29]) ctx.fillRect(24.4, y + b, 9.2, 1.6);
    capsule(ctx, [[29, 21 + b], [26.5, 16 + b]], 1, C.gray);
    for (const x of [26, 32]) ellipse(ctx, x, 36.8, 2.2, 2.2, C.lash);
    elderBody(ctx, step, '#7a5c8a');
    capsule(ctx, [[19, 23 + b], [25, 17.5 + b]], 3, '#7a5c8a');
    ellipse(ctx, 25.6, 17 + b, 1.6, 1.6, C.skin);
    ellipse(ctx, 15, 12 + b, 9.8, 9.8, '#d84a5a');
    for (const [dx, dy] of [[-5, -5], [1, -7], [6, -3], [7, 3], [-7, 1]]) ellipse(ctx, 15 + dx, 12 + b + dy, 0.9, 0.9, C.white, false);
    shape(ctx, (c) => {
      c.moveTo(18, 20 + b);
      c.lineTo(23, 22.5 + b);
      c.lineTo(20.5, 18.5 + b);
    }, '#d84a5a');
    elderFace(ctx, 13.6, 13.4 + b, false);
    shape(ctx, (c) => {
      c.moveTo(6.5, 9.5 + b);
      c.quadraticCurveTo(13.6, 4 + b, 20.6, 9.5 + b);
      c.quadraticCurveTo(13.6, 7.2 + b, 6.5, 9.5 + b);
    }, '#dcdce4', false);
  };
}

// Grandpa in a flat cap with a walking cane and a grey moustache.
function grandpaCane(step) {
  return (ctx) => {
    const b = step.bob;
    elderBody(ctx, step, '#6b5a46');
    capsule(ctx, [[5.6, 25 + b], [4.6, 38.6]], 1.3, '#8a5a3a');
    capsule(ctx, [[5.6, 25 + b], [7.6, 24 + b]], 1.3, '#8a5a3a');
    capsule(ctx, [[11, 22.5 + b], [7, 25.5 + b]], 3, '#6b5a46');
    ellipse(ctx, 6.6, 25.4 + b, 1.6, 1.6, C.skin);
    for (const [x, y] of [[21, 12], [21.6, 15.5]]) ellipse(ctx, x, y + b, 2, 2, '#dcdce4');
    elderFace(ctx, 13.6, 13.4 + b, true);
    shape(ctx, (c) => {
      c.moveTo(9.4, 17 + b);
      c.quadraticCurveTo(12.4, 15.4 + b, 14.6, 17 + b);
      c.quadraticCurveTo(12, 19.2 + b, 9.4, 17 + b);
    }, '#e8e8ee');
    ellipse(ctx, 14.6, 6.6 + b, 8.6, 3.6, '#6d6f7a');
    ellipse(ctx, 6.6, 8.4 + b, 4.4, 1.5, '#5a5c66');
    ellipse(ctx, 15, 3.4 + b, 1, 0.8, '#5a5c66', false);
  };
}

// Granny in a beret holding up her savings passbook, handbag on the arm.
function grannyPassbook(step) {
  return (ctx) => {
    const b = step.bob;
    elderBody(ctx, step, '#3f8f8a');
    roundRect(ctx, 19.5, 26.5 + b, 7.4, 6, 1.6, '#4b3a2a');
    ctx.beginPath();
    ctx.arc(23.2, 26.8 + b, 2.4, Math.PI, 0);
    ctx.lineWidth = 0.9;
    ctx.strokeStyle = C.lash;
    ctx.stroke();
    for (const [x, y] of [[6.2, 11], [6, 15], [22.4, 11], [22.6, 15], [8.6, 7.6], [20, 7.6]]) ellipse(ctx, x, y + b, 2.3, 2.3, '#dcdce4');
    elderFace(ctx, 14, 13.4 + b, true);
    ellipse(ctx, 15, 5.6 + b, 8, 3, '#8e3a6e');
    ellipse(ctx, 15.6, 2.6 + b, 0.9, 0.9, '#8e3a6e');
    capsule(ctx, [[11, 22.5 + b], [7.6, 21.5 + b]], 3, '#3f8f8a');
    roundRect(ctx, 1.2, 15.5 + b, 7.2, 9.4, 1, C.green);
    strokePts(ctx, [[2.6, 18.2 + b], [7, 18.2 + b]], 0.7, C.gold);
    roundRect(ctx, 2.8, 20 + b, 4, 2.4, 0.5, C.white, false);
    ellipse(ctx, 7.6, 21.6 + b, 1.6, 1.6, C.skin);
  };
}

const ELDERS = [grannyTrolley, grandpaCane, grannyPassbook];

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
  const sheet = (frames, fw, fh, k = 1) => renderSheet(frames, fw, fh, UNIT * k);
  return {
    hero: buildHero(UNIT),
    elder: {
      ...sheet(ELDERS.flatMap((draw) => ELDER_STEPS.map(draw)), 36, 40, ELDER_SCALE),
      anims: { walk0: { frames: [0, 1], fps: 4 }, walk1: { frames: [2, 3], fps: 4 }, walk2: { frames: [4, 5], fps: 4 } },
      variants: true,
      body: toPx(UNIT * ELDER_SCALE)({ x: 5, y: 4, w: 24, h: 35 }),
    },
    chair: { ...sheet([chair], 28, 42), body: px({ x: 3, y: 2, w: 22, h: 39 }) },
    manager: {
      ...sheet(MANAGER_WALK.map(manager), 56, 89, MANAGER_SCALE),
      anims: { walk: { frames: [0, 1, 2, 3], fps: 6 } },
      body: toPx(UNIT * MANAGER_SCALE)({ x: 11, y: 5, w: 33, h: 83 }),
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
