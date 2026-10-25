// All game sprites as frame sheets. Art is authored in units and rendered at
// UNIT px per unit for a 1920x1080 game. Ground objects rest with the frame
// bottom on the floor.

import { C, OW, capsule, ellipse, renderSheet, roundRect, shape, strokePts, text, toPx } from './draw.js';
import { buildHero, buildHeroDown } from './hero.js';

export const UNIT = 2.75;
// Elders stand a touch shorter than the hero.
const ELDER_SCALE = 1.65;
// Fairy wings drawn larger than the hero's art scale so they stand out.
const WING_SCALE = 1.4;


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

// Veteran in a fedora with a white beard and medals on his jacket.
function grandpaMedals(step) {
  return (ctx) => {
    const b = step.bob;
    elderBody(ctx, step, '#5f6e4c');
    for (const [x, y, c] of [[12.4, 25.4, C.gold], [15.6, 25.4, C.gold], [14, 28.6, '#d9d9e0']]) {
      roundRect(ctx, x - 1, y - 3 + b, 2, 1.8, 0.3, '#ff8a2a', false);
      strokePts(ctx, [[x - 0.4, y - 2.9 + b], [x - 0.4, y - 1.3 + b]], 0.4, C.lash);
      strokePts(ctx, [[x + 0.4, y - 2.9 + b], [x + 0.4, y - 1.3 + b]], 0.4, C.lash);
      ellipse(ctx, x, y + b, 1.2, 1.2, c);
    }
    elderFace(ctx, 13.6, 13.4 + b, false);
    shape(ctx, (c) => {
      c.moveTo(7.6, 15.6 + b);
      c.quadraticCurveTo(12.6, 26 + b, 19.4, 16 + b);
      c.quadraticCurveTo(13.6, 19.6 + b, 7.6, 15.6 + b);
    }, '#ececf2');
    ellipse(ctx, 13.6, 7.8 + b, 11, 2.2, '#6b4e3a');
    roundRect(ctx, 7.4, 1.6 + b, 12.6, 6.6, [4, 4, 1, 1], '#6b4e3a');
    strokePts(ctx, [[7.8, 6.6 + b], [19.6, 6.6 + b]], 1.3, '#3b2a1e');
  };
}

// Granny with a walking frame, grey bun and a pink cardigan.
function grannyWalker(step) {
  return (ctx) => {
    const b = step.bob;
    elderBody(ctx, step, '#c77d9a');
    const metal = '#b8bdd0';
    capsule(ctx, [[2.6, 25 + b], [1.4, 37.6]], 1.1, metal);
    capsule(ctx, [[7.2, 25 + b], [8.2, 37.6]], 1.1, metal);
    capsule(ctx, [[2, 31.5], [7.8, 31.5]], 0.9, metal);
    capsule(ctx, [[1.8, 25 + b], [8, 25 + b]], 1.3, metal);
    ellipse(ctx, 1.4, 38.4, 1.4, 1.4, C.lash);
    ellipse(ctx, 8.2, 38.6, 1.2, 1, '#6d6f7a');
    capsule(ctx, [[11, 23 + b], [5.6, 25 + b]], 3, '#c77d9a');
    ellipse(ctx, 5, 25 + b, 1.6, 1.6, C.skin);
    ellipse(ctx, 20.6, 6.4 + b, 3.6, 3.6, '#dcdce4');
    elderFace(ctx, 14, 13.4 + b, true);
    shape(ctx, (c) => {
      c.moveTo(5.8, 11.6 + b);
      c.quadraticCurveTo(14, -0.6 + b, 22.2, 11.6 + b);
      c.quadraticCurveTo(14, 6.4 + b, 5.8, 11.6 + b);
    }, '#dcdce4');
  };
}

// Granny in a fur coat and a tall fur hat, clutching utility receipts.
function grannyFur(step) {
  return (ctx) => {
    const b = step.bob;
    elderBody(ctx, step, '#7a5236');
    for (let x = 9; x <= 21; x += 2.4) ellipse(ctx, x, 21 + b, 1.8, 1.8, '#a67c55');
    for (const [x, y] of [[9, 27], [18, 29], [13, 31]]) ellipse(ctx, x, y + b, 0.9, 0.6, '#9a7050', false);
    elderFace(ctx, 13.8, 13.6 + b, false);
    ellipse(ctx, 14.2, 5.6 + b, 9.4, 5.2, '#8a6040');
    for (const [x, y] of [[8, 4], [12, 2.4], [16.6, 2.6], [20.4, 4.6], [10.4, 7], [18, 7.2]]) ellipse(ctx, x, y + b, 1.6, 1.3, '#a67c55', false);
    capsule(ctx, [[11, 23 + b], [7, 25.5 + b]], 3, '#7a5236');
    for (const [dx, dy, rot] of [[0, 0, -0.15], [1.4, 1, 0.1]]) {
      ctx.save();
      ctx.translate(4.6 + dx, 24.6 + b + dy);
      ctx.rotate(rot);
      roundRect(ctx, -3, -4, 6, 7.6, 0.6, C.paper);
      for (const ly of [-2, -0.4, 1.2]) strokePts(ctx, [[-1.8, ly], [1.8, ly]], 0.4, C.line);
      ctx.restore();
    }
    ellipse(ctx, 7, 25.6 + b, 1.6, 1.6, C.skin);
  };
}

// Sporty grandpa doing Nordic walking: bobble hat, shades, two poles.
function grandpaNordic(step) {
  return (ctx) => {
    const b = step.bob;
    const pole = '#4b5068';
    capsule(ctx, [[19.4, 25 + b], [25.6, 38.6]], 0.9, pole);
    elderBody(ctx, step, '#3d7bd9');
    strokePts(ctx, [[8, 26.5 + b], [22, 26.5 + b]], 1.6, '#ff9a3c');
    capsule(ctx, [[7.4, 25 + b], [2.6, 38.6]], 0.9, pole);
    capsule(ctx, [[11, 22.5 + b], [7.6, 25.2 + b]], 3, '#3d7bd9');
    ellipse(ctx, 7.4, 25.2 + b, 1.6, 1.6, C.skin);
    elderFace(ctx, 13.6, 13.4 + b, true);
    for (const ex of [10, 15.2]) ellipse(ctx, ex, 14 + b, 2.3, 2, 'rgba(40,30,50,0.85)', false);
    ctx.beginPath();
    ctx.arc(13.6, 11.2 + b, 8.8, Math.PI * 1.02, Math.PI * 1.98);
    ctx.closePath();
    ctx.fillStyle = '#e07a3c';
    ctx.fill();
    ctx.lineWidth = OW;
    ctx.strokeStyle = C.outline;
    ctx.stroke();
    strokePts(ctx, [[5.4, 9.8 + b], [21.8, 9.8 + b]], 1.6, '#f2f2f6');
    ellipse(ctx, 13.6, 1.8 + b, 2.2, 2.2, '#f2f2f6');
  };
}

// Grandpa in an ushanka with a string bag: a baton and a bottle of kefir.
function grandpaUshanka(step) {
  return (ctx) => {
    const b = step.bob;
    elderBody(ctx, step, '#55606f');
    elderFace(ctx, 13.6, 13.4 + b, false);
    ellipse(ctx, 11.4, 16.8 + b, 1.3, 1, '#ff7a7a', false);
    for (const x of [5.2, 19.4]) roundRect(ctx, x, 9 + b, 3.6, 8.4, 1.6, '#5a4a3a');
    ellipse(ctx, 13.8, 6.4 + b, 9.4, 4.8, '#5a4a3a');
    roundRect(ctx, 5.4, 6.6 + b, 16.8, 3.6, 1.8, '#7a6450');
    // String bag hanging from the front hand.
    capsule(ctx, [[11, 23 + b], [7, 26 + b]], 3, '#55606f');
    ellipse(ctx, 2.6, 26.6 + b, 1.6, 4.6, '#d9a35a');
    roundRect(ctx, 4.2, 26.4 + b, 3, 6.2, 0.8, C.white);
    roundRect(ctx, 4.6, 25.4 + b, 2.2, 1.4, 0.4, C.green, false);
    ctx.beginPath();
    ctx.moveTo(6.6, 25.6 + b);
    ctx.lineTo(0.8, 29 + b);
    ctx.lineTo(2.4, 34.6 + b);
    ctx.lineTo(7.6, 34.6 + b);
    ctx.lineTo(8.4, 29 + b);
    ctx.closePath();
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = '#3b2f2a';
    ctx.stroke();
    for (let i = 0; i < 4; i++) strokePts(ctx, [[1.2 + i * 1.8, 29 + b], [3 + i * 1.6, 34.4 + b]], 0.4, '#3b2f2a');
    strokePts(ctx, [[1.4, 31.6 + b], [8, 31.6 + b]], 0.4, '#3b2f2a');
    ellipse(ctx, 7, 26 + b, 1.6, 1.6, C.skin);
  };
}

const ELDERS = [grannyTrolley, grandpaCane, grannyPassbook, grandpaMedals, grannyWalker, grannyFur, grandpaNordic, grandpaUshanka];

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

// Tall office bookcase full of binders and archive boxes: needs a double jump.
function shelf(ctx) {
  const wood = '#9a6a44';
  const back = '#6b4a30';
  for (const x of [5, 39]) roundRect(ctx, x, 108, 4, 5, 1, back);
  roundRect(ctx, 2, 2, 44, 107, 2.5, wood);
  ctx.fillStyle = back;
  ctx.fillRect(5, 5, 38, 101);
  const shelfY = [5, 27, 49, 71, 93];
  for (const y of shelfY.slice(1)) roundRect(ctx, 3.5, y - 1.6, 41, 3.2, 1, wood, false);

  // Shelf 1: binders, one with the KPI label.
  const binder = (x, y, w, h, color, tilt = 0) => {
    ctx.save();
    ctx.translate(x + w / 2, y + h);
    ctx.rotate(tilt);
    roundRect(ctx, -w / 2, -h, w, h, 0.8, color);
    roundRect(ctx, -w / 2 + 0.9, -h * 0.7, w - 1.8, h * 0.22, 0.4, C.paper, false);
    ellipse(ctx, 0, -h * 0.25, 0.8, 0.8, C.paper, false);
    ctx.restore();
  };
  ['#e04848', '#3d7bd9', '#21a038', '#ffd23f', '#8e3a6e', '#3d7bd9'].forEach((color, i) => binder(6.5 + i * 5.6, 8, 4.6, 17, color));
  text(ctx, 'KPI', 9.3, 17.6, 2.2, C.lash);

  // Shelf 2: archive boxes.
  const box = (x, y, w, h, label) => {
    roundRect(ctx, x, y, w, h, 0.8, '#d8b07a');
    roundRect(ctx, x + w / 2 - 3, y + 2, 6, 3, 0.6, '#b98f5a', false);
    text(ctx, label, x + w / 2, y + h * 0.66, 2.6, '#5a3820', 800);
  };
  box(6, 34, 17, 13, 'АРХИВ');
  box(24.5, 34, 17, 13, 'АРХИВ');

  // Shelf 3: leaning binders and an employee-of-the-month cup.
  binder(7, 33 + 22, 4.6, 15, '#e04848', -0.25);
  binder(13, 32 + 22, 4.6, 16, '#21a038', -0.25);
  ellipse(ctx, 32, 65.5, 4.6, 1.2, C.goldDark);
  roundRect(ctx, 30.6, 61, 2.8, 4.4, 0.4, C.goldDark, false);
  shape(ctx, (c) => {
    c.moveTo(27, 53);
    c.lineTo(37, 53);
    c.quadraticCurveTo(36.5, 61, 32, 61.5);
    c.quadraticCurveTo(27.5, 61, 27, 53);
  }, C.gold);
  star(ctx, 32, 56.6, 2, C.white);

  // Shelf 4: stacked paper and a box.
  for (let i = 0; i < 4; i++) roundRect(ctx, 7, 86 - i * 3.2, 15, 3, 0.6, i % 2 ? C.paperShade : C.paper);
  box(25, 77, 16, 13, 'ДЕЛА');

  // Shelf 5: a plant and more binders.
  roundRect(ctx, 9, 100, 8, 6, [0, 0, 2, 2], '#c45c3a');
  for (const [x, y, r] of [[13, 96, 4], [10, 98.5, 3], [16, 98.5, 3]]) ellipse(ctx, x, y, r, r, '#3f9a52');
  ['#ffd23f', '#3d7bd9', '#e04848', '#21a038'].forEach((color, i) => binder(22 + i * 5.2, 92, 4.4, 14, color));
}

function star(ctx, cx, cy, r, color) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
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

// Gold coin turned by angle a (0 = face on): the face narrows as it spins and
// the rim shows beside it as a darker band.
function coin(a) {
  return (ctx) => {
    const cx = 12;
    const cy = 12;
    const r = 9.5;
    const k = Math.max(Math.abs(Math.cos(a)), 0.14);
    const w = k * r;
    const rim = Math.sin(a) * Math.sign(Math.cos(a)) * 2.6; // flips side past edge-on
    ellipse(ctx, cx + rim, cy, w, r, '#c98a12');
    ctx.fillStyle = '#c98a12';
    ctx.fillRect(Math.min(cx, cx + rim), cy - r, Math.abs(rim), r * 2);
    const g = ctx.createLinearGradient(cx - w, cy - r, cx + w, cy + r);
    g.addColorStop(0, '#fff3a6');
    g.addColorStop(0.45, '#ffd23f');
    g.addColorStop(1, '#f0a81e');
    ellipse(ctx, cx, cy, w, r, g);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(k, 1);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.72, r * 0.72, 0, 0, Math.PI * 2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#d99a1e';
    ctx.stroke();
    star(ctx, 0, 0.3, 4.6, '#f0a81e');
    star(ctx, -0.4, -0.2, 3.8, '#fff1a8');
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.86, Math.PI * 1.1, Math.PI * 1.45);
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
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

// Fairy wings shown on the double jump. The pivot sits at her back (right
// side of the frame) and every wing sweeps backward from it, so they read as
// growing from her back rather than from behind her big head.
export const WING_PIVOT = { x: 52, y: 30 };

function fairyWingPath(ctx, [px, py], [tx, ty], width) {
  const dx = tx - px;
  const dy = ty - py;
  const len = Math.hypot(dx, dy);
  const nx = (-dy / len) * width;
  const ny = (dx / len) * width;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.bezierCurveTo(px + dx * 0.3 + nx, py + dy * 0.3 + ny, tx + nx * 0.9 - dx * 0.08, ty + ny * 0.9 - dy * 0.08, tx, ty);
  ctx.bezierCurveTo(tx - nx * 0.6 - dx * 0.12, ty - ny * 0.6 - dy * 0.12, px + dx * 0.35 - nx * 0.7, py + dy * 0.35 - ny * 0.7, px, py);
  ctx.closePath();
}

function fairyWing(ctx, tip, width, alpha) {
  const p = [WING_PIVOT.x, WING_PIVOT.y];
  fairyWingPath(ctx, p, tip, width);
  const g = ctx.createLinearGradient(p[0], p[1], tip[0], tip[1]);
  g.addColorStop(0, `rgba(255,170,215,${alpha})`);
  g.addColorStop(0.5, `rgba(200,170,255,${alpha * 0.9})`);
  g.addColorStop(1, `rgba(150,230,255,${alpha * 0.8})`);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(140,80,205,0.95)';
  ctx.stroke();
  // Veins and a few glints.
  for (const k of [0.55, 0.8]) {
    strokePts(ctx, [p, [p[0] + (tip[0] - p[0]) * k + (tip[1] - p[1]) * 0.12, p[1] + (tip[1] - p[1]) * k - (tip[0] - p[0]) * 0.12]], 0.5, 'rgba(255,255,255,0.7)');
  }
  ellipse(ctx, p[0] + (tip[0] - p[0]) * 0.6, p[1] + (tip[1] - p[1]) * 0.6, 1.1, 1.1, 'rgba(255,255,255,0.9)', false);
}

// Tip offsets from the pivot, all pointing back: near/far upper, near/far lower.
// Kept fairly flat so the upper wings stay below her head until well behind it.
const FAIRY_TIPS = [
  { tip: [-30, -13], width: 7, alpha: 0.6, flap: 1 },
  { tip: [-22, 14], width: 5.5, alpha: 0.55, flap: 0.6 },
  { tip: [-34, -7], width: 10, alpha: 0.92, flap: 1 },
  { tip: [-25, 11], width: 7.5, alpha: 0.88, flap: 0.6 },
];

// up: -1..1, how far the wings are raised in this flap frame (a rotation
// about the pivot; clockwise lifts a backward-pointing wing).
function fairyWings(up) {
  return (ctx) => {
    const glow = ctx.createRadialGradient(WING_PIVOT.x - 16, WING_PIVOT.y, 0, WING_PIVOT.x - 16, WING_PIVOT.y, 28);
    glow.addColorStop(0, 'rgba(255,225,250,0.5)');
    glow.addColorStop(1, 'rgba(255,225,250,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 60, 60);
    for (const { tip: [dx, dy], width, alpha, flap } of FAIRY_TIPS) {
      const a = up * 0.25 * flap;
      const tx = WING_PIVOT.x + dx * Math.cos(a) - dy * Math.sin(a);
      const ty = WING_PIVOT.y + dx * Math.sin(a) + dy * Math.cos(a);
      fairyWing(ctx, [tx, ty], width, alpha);
    }
  };
}

// Chocolate bar, half unwrapped: an extra life.
function chocolate(ctx) {
  const glow = ctx.createRadialGradient(15, 18, 0, 15, 18, 16);
  glow.addColorStop(0, 'rgba(255,220,140,0.6)');
  glow.addColorStop(1, 'rgba(255,220,140,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 30, 36);
  ctx.save();
  ctx.translate(15, 18.5);
  ctx.rotate(-0.22);
  // Exposed squares on top, gold foil, then the purple wrapper.
  roundRect(ctx, -8, -15, 16, 12, 1.4, '#6b3e26');
  for (const x of [-2.7, 2.7]) strokePts(ctx, [[x, -14.4], [x, -3.4]], 0.6, '#4a2a18');
  strokePts(ctx, [[-7.4, -9], [7.4, -9]], 0.6, '#4a2a18');
  for (const [x, y] of [[-5.3, -12], [0, -12], [5.3, -12], [-5.3, -6], [0, -6], [5.3, -6]]) ellipse(ctx, x - 0.8, y - 0.8, 0.9, 0.5, 'rgba(255,255,255,0.25)', false);
  shape(ctx, (c) => {
    c.moveTo(-9, -5);
    c.lineTo(-6, -7.5);
    c.lineTo(-3, -5.2);
    c.lineTo(0, -7.8);
    c.lineTo(3, -5.2);
    c.lineTo(6, -7.5);
    c.lineTo(9, -5);
    c.lineTo(9, -2);
    c.lineTo(-9, -2);
  }, '#e8c34a');
  roundRect(ctx, -9, -3, 18, 18, 1.8, '#6a3fa0');
  strokePts(ctx, [[-9, 0.5], [9, 0.5]], 1, '#8e63c4');
  text(ctx, 'ШОКО', 0, 6.4, 4, C.white, 800);
  shape(ctx, (c) => {
    c.moveTo(0, 12.4);
    c.bezierCurveTo(-3, 10.4, -2.2, 8.4, 0, 9.8);
    c.bezierCurveTo(2.2, 8.4, 3, 10.4, 0, 12.4);
  }, '#f27fb5', false);
  ctx.restore();
  sparkle(ctx, 26, 4, 2.4);
  sparkle(ctx, 4, 30, 1.6);
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
    heroDown: buildHeroDown(UNIT),
    elder: {
      ...sheet(ELDERS.flatMap((draw) => ELDER_STEPS.map(draw)), 36, 40, ELDER_SCALE),
      anims: Object.fromEntries(ELDERS.map((_, i) => [`walk${i}`, { frames: [i * 2, i * 2 + 1], fps: 4 }])),
      variants: true,
      body: toPx(UNIT * ELDER_SCALE)({ x: 5, y: 4, w: 24, h: 35 }),
    },
    chair: { ...sheet([chair], 28, 42), body: px({ x: 3, y: 2, w: 22, h: 39 }) },
    shelf: { ...sheet([shelf], 48, 114), body: px({ x: 3, y: 1, w: 42, h: 112 }) },
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
    coin: {
      ...sheet(Array.from({ length: 8 }, (_, i) => coin((i * Math.PI) / 8)), 24, 24),
      anims: { spin: { frames: [0, 1, 2, 3, 4, 5, 6, 7], fps: 12 } },
      body: px({ x: 3, y: 3, w: 18, h: 18 }),
    },
    chocolate: { ...sheet([chocolate], 30, 36), body: px({ x: 4, y: 3, w: 22, h: 30 }) },
    wings: {
      ...sheet([fairyWings(1), fairyWings(0), fairyWings(-1), fairyWings(0)], 60, 60, WING_SCALE),
      anims: { flap: { frames: [0, 1, 2, 3], fps: 14 } },
      pivot: toPx(UNIT * WING_SCALE)(WING_PIVOT),
    },
    door: { ...sheet([door], 70, 124), body: px({ x: 10, y: 26, w: 50, h: 96 }) },
  };
}
