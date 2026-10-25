// All game sprites as frame sheets. Art is authored in units and rendered at
// UNIT px per unit for a 1920x1080 game. Ground objects rest with the frame
// bottom on the floor.

import { C, OW, capsule, ellipse, outline, renderSheet, roundRect, shape, strokePts, text, toPx } from './draw.js';
import { buildHero, buildHeroDown } from './hero.js';

export const UNIT = 2.75;
// Elders stand a touch shorter than the hero.
const ELDER_SCALE = 1.65;
// Workers stand nearly her height and twice as broad.
const WORKER_SCALE = 1.5;
// Fairy wings drawn larger than the hero's art scale so they stand out.
const WING_SCALE = 1.4;
// Backroom props (money pile, safe) drawn chunkier so their outlines match
// the people's.
const VAULT_SCALE = 1.4;
// The big man shares the workers' outline weight; he is just drawn taller.
const BIGMAN_SCALE = 1.5;
// Snowball drawn at the props' outline weight.
const SNOWBALL_SCALE = 1.4;


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

// Big working men on a Chelyabinsk street in winter, stomping toward the
// player (facing left). Built like the elders, but broad, bellied and nearly
// her height. Six trades, two heavy steps each. Legs stay planted; everything
// above them bobs with the step.
// Art shifted right and down in the frame: room for tools carried in front
// and for hats on the up-step.
const WORKER_X = 4;
const WORKER_Y = 2;
const WORKER_STEPS = [
  { front: [12.5, 44.3], back: [24, 44.3], bob: 0.3 },
  { front: [15.5, 43.1], back: [22, 44.3], bob: -0.8 },
];
const WORKER_HEAD = [17.6, 14.4];
const WORKER_WOOD = '#c8955a';
const WORKER_GLOVE = '#e7ddc4';

function workerTorsoPath(c) {
  c.moveTo(10.5, 23);
  c.quadraticCurveTo(19.5, 19, 28.5, 23);
  c.quadraticCurveTo(32.5, 27, 31.5, 39);
  c.quadraticCurveTo(19, 42, 8, 39);
  c.quadraticCurveTo(4, 31, 10.5, 23);
}

// Barrel torso with a belly out front; `details` paints inside its outline.
function workerTorso(ctx, coat, details) {
  shape(ctx, workerTorsoPath, coat);
  if (!details) return;
  ctx.save();
  ctx.beginPath();
  workerTorsoPath(ctx);
  ctx.closePath();
  ctx.clip();
  details(ctx);
  ctx.restore();
  ctx.beginPath();
  workerTorsoPath(ctx);
  ctx.closePath();
  outline(ctx);
}

function workerArm(ctx, shoulder, hand, sleeve, glove, bands) {
  capsule(ctx, [shoulder, hand], 4.6, sleeve);
  if (bands) {
    const [dx, dy] = [hand[0] - shoulder[0], hand[1] - shoulder[1]];
    const len = Math.hypot(dx, dy);
    const [nx, ny] = [(-dy / len) * 2.3, (dx / len) * 2.3];
    for (const t of bands.at) {
      const [x, y] = [shoulder[0] + dx * t, shoulder[1] + dy * t];
      strokePts(ctx, [[x - nx, y - ny], [x + nx, y + ny]], bands.width, bands.color);
    }
  }
  ellipse(ctx, hand[0], hand[1], 2.3, 2.3, glove);
}

function workerLegs(ctx, { front, back, bob }, [pants, pantsShade]) {
  for (const [hip, foot, color] of [[[23, 37 + bob], back, pantsShade], [[14.5, 37 + bob], front, pants]]) {
    capsule(ctx, [hip, foot], 5.4, color);
    ellipse(ctx, foot[0] - 1.4, foot[1] + 1, 3.9, 2.1, '#2e2622');
  }
}

function workerFrame(step, pants, draw) {
  return (ctx) => {
    ctx.translate(WORKER_X, WORKER_Y);
    workerLegs(ctx, step, pants);
    ctx.translate(0, step.bob);
    draw(ctx);
  };
}

// Stern chibi face: dot eyes under frowning brows, frosty cheeks, a frown,
// then stubble, beard and moustache as asked.
function workerFace(ctx, { brow = '#4a3226', nose = '#f2a48e', stubble, beard, mustache, smudge } = {}) {
  const [x, y] = WORKER_HEAD;
  const head = (c) => c.ellipse(x, y, 9, 8.8, 0, 0, Math.PI * 2);
  shape(ctx, head, C.skin);
  if (stubble || smudge) {
    ctx.save();
    ctx.beginPath();
    head(ctx);
    ctx.clip();
    if (stubble) {
      ellipse(ctx, x - 1, y + 7.4, 8.6, 4.6, stubble, false);
      for (const [dx, dy] of [[-5, 5.2], [-2.6, 6.6], [0.4, 6], [3.2, 6.8], [5.6, 5.4], [-4, 7.6], [1.8, 7.8]]) {
        ellipse(ctx, x + dx, y + dy, 0.28, 0.28, 'rgba(60,58,72,0.45)', false);
      }
    }
    if (smudge) ellipse(ctx, x + 4.8, y + 4.4, 2, 1, smudge, false);
    ctx.restore();
    ctx.beginPath();
    head(ctx);
    outline(ctx);
  }
  for (const [ex, dir] of [[x - 3.8, 1], [x + 1.8, -1]]) {
    ellipse(ctx, ex, y + 0.9, 0.85, 1.1, C.lash, false);
    ellipse(ctx, ex - 0.3, y + 0.5, 0.3, 0.3, C.white, false);
    strokePts(ctx, [[ex - 1.6 * dir, y - 2.5], [ex + 1.2 * dir, y - 1.3]], 1.1, brow);
  }
  for (const bx of [x - 6, x + 4.2]) ellipse(ctx, bx, y + 3.4, 1.7, 1, 'rgba(255,120,130,0.45)', false);
  if (beard) {
    shape(ctx, (c) => {
      c.moveTo(x - 8.8, y + 1.4);
      c.quadraticCurveTo(x - 8.6, y + 12, x - 0.6, y + 12.2);
      c.quadraticCurveTo(x + 8, y + 11.6, x + 8.8, y + 1.6);
      c.quadraticCurveTo(x + 4.6, y + 6.6, x - 1, y + 6.4);
      c.quadraticCurveTo(x - 6, y + 6.2, x - 8.8, y + 1.4);
    }, beard);
  } else {
    ctx.beginPath();
    ctx.moveTo(x - 3, y + 6.4);
    ctx.quadraticCurveTo(x - 1.2, y + 5.3, x + 0.6, y + 6.4);
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = C.lash;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  if (mustache) {
    const [mx, my] = [x - 1.3, y + 4.4];
    shape(ctx, (c) => {
      c.moveTo(mx, my - 0.9);
      c.quadraticCurveTo(mx - 3, my - 1.7, mx - 4.6, my + 1.8);
      c.quadraticCurveTo(mx - 2, my + 0.7, mx, my + 0.7);
      c.quadraticCurveTo(mx + 2, my + 0.7, mx + 4.6, my + 1.8);
      c.quadraticCurveTo(mx + 3, my - 1.7, mx, my - 0.9);
    }, mustache);
  }
  ellipse(ctx, x - 1.4, y + 3, 1.4, 1.1, nose, false);
}

// Dome for the hard hats and the knit beanie: a half disc over the brow.
function workerDome(ctx, r, fill) {
  const [x, y] = WORKER_HEAD;
  ctx.beginPath();
  ctx.arc(x + 0.3, y - 3.6, r, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  outline(ctx);
}

// Yard keeper (dvornik): quilted vatnik under an orange vest, ushanka, and a
// big plywood snow shovel with snow still on it.
function workerJanitor(step) {
  return workerFrame(step, ['#3a4050', '#2c313e'], (ctx) => {
    const coat = '#3d4657';
    workerTorso(ctx, coat, (c) => {
      c.beginPath();
      c.moveTo(0, 24.5);
      c.lineTo(14.6, 22);
      c.lineTo(18.6, 29.5);
      c.lineTo(22.6, 22);
      c.lineTo(40, 24.5);
      c.lineTo(40, 45);
      c.lineTo(0, 45);
      c.closePath();
      c.fillStyle = '#ff7a1a';
      c.fill();
      c.fillStyle = '#e3e9f0';
      c.fillRect(0, 32, 40, 1.7);
      c.fillRect(0, 36.2, 40, 1.7);
      strokePts(c, [[14.6, 22], [18.6, 29.5], [22.6, 22]], 0.8, C.outline);
      strokePts(c, [[16.2, 25], [21, 25]], 0.5, '#56627a');
    });
    const [x, y] = WORKER_HEAD;
    workerFace(ctx, { mustache: '#8a7a6a', nose: '#ff7a7a', brow: '#6a5a4a' });
    for (const fx of [x - 10, x + 6.2]) roundRect(ctx, fx, y - 4.6, 3.8, 10, 1.8, '#5d5148');
    ellipse(ctx, x + 0.2, y - 7.2, 9.8, 5.2, '#5d5148');
    roundRect(ctx, x - 9.2, y - 7.4, 18.6, 4.2, 2.1, '#7b6d60');
    // Wide plywood shovel carried in both hands, blade forward and low.
    capsule(ctx, [[25, 25.6], [4.8, 35.6]], 1.5, WORKER_WOOD);
    ctx.save();
    ctx.translate(3.6, 40.8);
    shape(ctx, (c) => {
      c.moveTo(-5.6, -5);
      c.lineTo(5.6, -5);
      c.lineTo(6.8, 4);
      c.lineTo(-6.8, 4);
    }, '#e2b97a');
    for (const gx of [-2.4, 2.4]) strokePts(ctx, [[gx * 0.9, -4.4], [gx * 1.1, 3.2]], 0.4, '#c49a5c');
    strokePts(ctx, [[-6.4, 3.8], [6.4, 3.8]], 1.4, '#9aa3b5');
    shape(ctx, (c) => {
      c.moveTo(-6.2, 3);
      c.quadraticCurveTo(-5.6, -2.6, -2, -1.4);
      c.quadraticCurveTo(0.6, -4.6, 3.8, -1.8);
      c.quadraticCurveTo(6.6, -0.8, 6.2, 3);
    }, '#f6f9ff');
    shape(ctx, (c) => {
      c.moveTo(-0.2, -5);
      c.lineTo(3.2, -5);
      c.lineTo(1.8, -6.6);
    }, '#9aa3b5');
    ctx.restore();
    const quilt = { at: [0.35, 0.7], width: 0.5, color: '#56627a' };
    workerArm(ctx, [26.5, 25.5], [21.6, 27.3], coat, WORKER_GLOVE, quilt);
    workerArm(ctx, [12, 25.5], [10, 33], coat, WORKER_GLOVE, quilt);
  });
}

// Builder: hi-vis padded jacket, orange hard hat, sledgehammer resting on the
// back shoulder.
function workerBuilder(step) {
  return workerFrame(step, ['#3c4a68', '#2e3a54'], (ctx) => {
    const coat = '#c8de34';
    workerTorso(ctx, coat, (c) => {
      c.fillStyle = '#e3e9f0';
      c.fillRect(0, 31.4, 40, 1.8);
      c.fillRect(0, 35.8, 40, 1.8);
      strokePts(c, [[19.4, 22], [19, 42]], 0.8, '#9fb32a');
    });
    // Sledgehammer handle across the chest, head over the back shoulder.
    capsule(ctx, [[10.5, 30.5], [34, 20.6]], 1.6, WORKER_WOOD);
    ctx.save();
    ctx.translate(34.6, 20.4);
    ctx.rotate(-0.4);
    roundRect(ctx, -2.6, -4.4, 5.2, 8.8, 1, '#5a6072');
    strokePts(ctx, [[-1.4, -3.4], [-1.4, 3.4]], 0.7, '#8a90a2');
    ctx.restore();
    const [x, y] = WORKER_HEAD;
    workerFace(ctx, { stubble: 'rgba(70,74,96,0.22)', mustache: '#4a3226' });
    workerDome(ctx, 9.4, '#ff8a2a');
    ctx.beginPath();
    ctx.arc(x + 0.3, y - 3.6, 6.4, Math.PI * 1.08, Math.PI * 1.92);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#e06a14';
    ctx.stroke();
    roundRect(ctx, x - 12.4, y - 4.6, 22.6, 2.4, 1.2, '#ff8a2a');
    ellipse(ctx, x - 4, y - 9.2, 2, 1, 'rgba(255,255,255,0.5)', false);
    workerArm(ctx, [12, 25.5], [11.2, 30.2], coat, '#5a6072', { at: [0.55], width: 1.4, color: '#e3e9f0' });
  });
}

// Steelworker (stalevar): grey heat-proof jacket, felt hat with blue goggles
// pushed up, long tongs holding a red-hot billet.
function workerSteel(step) {
  return workerFrame(step, ['#7d786f', '#64605a'], (ctx) => {
    const coat = '#8f8a80';
    workerTorso(ctx, coat, (c) => {
      strokePts(c, [[19.4, 22], [19, 42]], 0.7, '#6e6a62');
      for (const px of [10.6, 22]) {
        roundRect(c, px, 32.6, 6, 5, 0.8, '#7d786f');
        strokePts(c, [[px + 0.3, 34], [px + 5.7, 34]], 0.6, C.outline);
      }
    });
    shape(ctx, (c) => {
      c.moveTo(13.2, 21.6);
      c.lineTo(17, 27);
      c.lineTo(19.2, 22);
    }, '#a8a397');
    shape(ctx, (c) => {
      c.moveTo(25.4, 21.6);
      c.lineTo(21.2, 26.4);
      c.lineTo(19.6, 22);
    }, '#a8a397');
    const [x, y] = WORKER_HEAD;
    workerFace(ctx, { mustache: '#2f2622', brow: '#2f2622', smudge: 'rgba(60,50,50,0.35)' });
    shape(ctx, (c) => {
      c.moveTo(x - 13, y - 3.2);
      c.quadraticCurveTo(x - 0.4, y - 7.6, x + 12.2, y - 3.4);
      c.quadraticCurveTo(x - 0.4, y - 4.6, x - 13, y - 3.2);
    }, '#bfb8a8');
    roundRect(ctx, x - 7, y - 13.8, 14.4, 9.6, [6, 6, 1, 1], '#d9d4c8');
    strokePts(ctx, [[x - 1.6, y - 13.4], [x + 0.4, y - 11.4]], 0.6, '#a8a090');
    strokePts(ctx, [[x - 6.6, y - 8.2], [x + 7, y - 8.2]], 1.2, '#3b3f4c');
    for (const gx of [x - 5.4, x - 1.4]) {
      ellipse(ctx, gx, y - 8.4, 2.1, 1.9, '#3d7bd9');
      ellipse(ctx, gx - 0.6, y - 9, 0.7, 0.5, 'rgba(255,255,255,0.75)', false);
    }
    // Red-hot billet held low in long smith's tongs.
    const [bx, by] = [3, 41.6];
    const glow = ctx.createRadialGradient(bx, by, 1, bx, by, 7);
    glow.addColorStop(0, 'rgba(255,170,60,0.6)');
    glow.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(bx - 7, by - 7, 14, 14);
    const hot = ctx.createLinearGradient(bx - 4, by, bx + 4, by);
    hot.addColorStop(0, '#ff5a1a');
    hot.addColorStop(0.45, '#ffe27a');
    hot.addColorStop(1, '#ff7a2a');
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(-0.12);
    roundRect(ctx, -4.2, -1.9, 8.4, 3.8, 0.9, hot);
    ctx.restore();
    for (const [sx, sy, r] of [[-1, 37.2, 0.5], [2, 35.8, 0.4], [-2, 39.4, 0.35]]) ellipse(ctx, sx, sy, r, r, '#ffd23f', false);
    capsule(ctx, [[11.4, 29.6], [8.4, 37], [6.4, 39.6]], 0.8, '#4b4f5c');
    capsule(ctx, [[12.4, 30.6], [8.4, 37], [6.8, 43.4]], 0.8, '#4b4f5c');
    ellipse(ctx, 8.4, 37, 0.8, 0.8, '#8a8fa8');
    workerArm(ctx, [12, 25.5], [10.6, 30.6], coat, '#b07a4a');
  });
}

// Tractor-plant mechanic: blue overalls over a burgundy sweater, peaked cap,
// big spanner raised, oil on his cheek and bib.
function workerMechanic(step) {
  return workerFrame(step, ['#3a63b0', '#2d4f90'], (ctx) => {
    const sweater = '#8e3a4a';
    const blue = '#3a63b0';
    workerTorso(ctx, sweater, (c) => {
      c.beginPath();
      c.moveTo(10.6, 28);
      c.lineTo(26.4, 28);
      c.lineTo(27, 33.4);
      c.lineTo(40, 33.4);
      c.lineTo(40, 45);
      c.lineTo(0, 45);
      c.lineTo(0, 33.4);
      c.lineTo(10, 33.4);
      c.closePath();
      c.fillStyle = blue;
      c.fill();
      c.lineWidth = 0.8;
      c.strokeStyle = C.outline;
      c.stroke();
      roundRect(c, 15.4, 29.2, 6, 3.6, 0.6, '#2d4f90');
      ellipse(c, 23, 37.2, 2.4, 1.2, 'rgba(40,36,44,0.5)', false);
    });
    for (const [a, b] of [[[11.6, 28.4], [13, 22.8]], [[25.4, 28.4], [24.4, 22.8]]]) {
      capsule(ctx, [a, b], 1.4, blue);
      ellipse(ctx, a[0], a[1], 0.9, 0.9, C.gold);
    }
    const [x, y] = WORKER_HEAD;
    workerFace(ctx, { stubble: 'rgba(70,74,96,0.22)', mustache: '#6a4a36', smudge: 'rgba(40,36,44,0.45)' });
    ellipse(ctx, x + 0.6, y - 7, 9.4, 4.6, '#2c4a88');
    roundRect(ctx, x - 8.8, y - 6.4, 18, 2.8, 1.2, '#22396a');
    shape(ctx, (c) => {
      c.moveTo(x - 7.6, y - 4.6);
      c.quadraticCurveTo(x - 12.6, y - 4.8, x - 14, y - 2.6);
      c.quadraticCurveTo(x - 10, y - 2.2, x - 6.4, y - 3.4);
    }, '#22396a');
    ellipse(ctx, x + 1, y - 11.4, 1, 0.7, '#22396a');
    // Spanner raised in the front hand.
    capsule(ctx, [[8.6, 33.2], [4.4, 22]], 1.8, '#c9ced9');
    ctx.save();
    ctx.translate(4.1, 21.2);
    ctx.rotate(-0.36);
    shape(ctx, (c) => {
      c.moveTo(-1, 1);
      c.lineTo(-3, -1.5);
      c.lineTo(-2.6, -4.6);
      c.lineTo(-0.9, -4.6);
      c.lineTo(-0.9, -2.2);
      c.lineTo(0.9, -2.2);
      c.lineTo(0.9, -4.6);
      c.lineTo(2.6, -4.6);
      c.lineTo(3, -1.5);
      c.lineTo(1, 1);
    }, '#c9ced9');
    ctx.restore();
    workerArm(ctx, [12, 25.5], [7.8, 31], sweater, C.skin);
  });
}

// Lineman: white helmet with a lightning sticker, coil of cable over the
// shoulder, tool belt with pliers and a screwdriver.
function workerLineman(step) {
  return workerFrame(step, ['#2a3550', '#1f2840'], (ctx) => {
    const coat = '#2f5687';
    workerTorso(ctx, coat, (c) => {
      strokePts(c, [[19.4, 22], [19, 42]], 0.7, '#24446c');
      c.fillStyle = '#5a3e2a';
      c.fillRect(0, 34.4, 40, 2.6);
    });
    roundRect(ctx, 14, 34.1, 2.8, 3.2, 0.6, '#c9ced9');
    roundRect(ctx, 21, 34.8, 5.2, 5.8, 1, '#7a5236');
    capsule(ctx, [[22.2, 35], [21.4, 32.2]], 0.9, C.red);
    capsule(ctx, [[23.8, 35], [24.6, 32.4]], 0.9, C.red);
    capsule(ctx, [[26.6, 35.4], [27.4, 32.6]], 1, C.gold);
    const [x, y] = WORKER_HEAD;
    workerFace(ctx, { beard: '#c06a2a', mustache: '#a8561e', brow: '#a8561e' });
    workerDome(ctx, 9.4, '#f2f2f6');
    ellipse(ctx, x - 0.4, y - 3.8, 10.8, 1.5, '#f2f2f6');
    shape(ctx, (c) => {
      c.moveTo(x + 3.6, y - 10.6);
      c.lineTo(x + 1.6, y - 7.4);
      c.lineTo(x + 3.2, y - 7.4);
      c.lineTo(x + 2.2, y - 4.8);
      c.lineTo(x + 5.2, y - 8.4);
      c.lineTo(x + 3.6, y - 8.4);
      c.lineTo(x + 4.8, y - 10.6);
    }, C.gold, false);
    workerArm(ctx, [12, 25.5], [10.4, 35], coat, '#e04848');
    // Cable coil hanging over the front shoulder.
    for (const [dx, color] of [[0.9, '#d99a1e'], [0, '#f2b632']]) {
      ctx.save();
      ctx.translate(12.6 + dx, 29.6);
      ctx.rotate(-0.18);
      ctx.beginPath();
      ctx.ellipse(0, 0, 4.4, 7.4, 0, 0, Math.PI * 2);
      ctx.lineWidth = 1.8 + OW * 2;
      ctx.strokeStyle = C.outline;
      ctx.stroke();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = color;
      ctx.stroke();
      ctx.restore();
    }
    ellipse(ctx, 10.4, 35.6, 2.3, 2.3, '#e04848');
  });
}

// Trucker: red flannel shirt under a green puffer vest, mustard knit beanie,
// full beard, a red toolbox in the back hand.
function workerTrucker(step) {
  return workerFrame(step, ['#45577a', '#36466a'], (ctx) => {
    const flannel = '#c23b3b';
    const check = { at: [0.3, 0.65], width: 0.6, color: '#7a1f2a' };
    workerArm(ctx, [27.5, 25.5], [33.4, 32.6], flannel, '#4b3a2a');
    roundRect(ctx, 29.2, 34.2, 10.6, 7.2, 1.2, '#d23c3c');
    strokePts(ctx, [[29.8, 36.4], [39.2, 36.4]], 0.7, '#8a2430');
    roundRect(ctx, 33.4, 35.6, 2, 1.6, 0.3, C.gold, false);
    capsule(ctx, [[31.4, 34.2], [31.4, 32.4], [35.4, 32.4], [35.4, 34.2]], 0.8, '#8a8fa8');
    ellipse(ctx, 33.4, 32.6, 2.3, 2.3, '#4b3a2a');
    workerTorso(ctx, flannel, (c) => {
      for (let gx = 6; gx < 34; gx += 2.6) strokePts(c, [[gx, 18], [gx, 44]], 0.6, 'rgba(90,20,30,0.55)');
      for (let gy = 22; gy < 44; gy += 2.6) strokePts(c, [[0, gy], [40, gy]], 0.6, 'rgba(90,20,30,0.55)');
      c.fillStyle = '#2e5e4e';
      c.fillRect(0, 18, 11.4, 30);
      c.fillRect(15.6, 18, 30, 30);
      for (const y of [27, 31, 35, 38.6]) {
        strokePts(c, [[0, y], [11.4, y]], 0.6, '#1f4438');
        strokePts(c, [[15.6, y], [40, y]], 0.6, '#1f4438');
      }
      strokePts(c, [[11.4, 18], [11.4, 44]], 0.8, C.outline);
      strokePts(c, [[15.6, 18], [15.6, 44]], 0.8, C.outline);
    });
    const [x, y] = WORKER_HEAD;
    workerFace(ctx, { beard: '#4a3226', mustache: '#3a271e' });
    workerDome(ctx, 9.4, '#d9a33a');
    roundRect(ctx, x - 9.8, y - 6.2, 19.8, 4.4, 2.2, '#c48e2a');
    for (let rx = x - 8.4; rx < x + 9; rx += 1.6) strokePts(ctx, [[rx, y - 5.6], [rx, y - 2.4]], 0.5, '#a8761e');
    workerArm(ctx, [12, 25.5], [9, 33.6], flannel, '#4b3a2a', check);
  });
}

const WORKERS = [workerJanitor, workerBuilder, workerSteel, workerMechanic, workerLineman, workerTrucker];

// Huge man in a red puffer parka, stomping toward the player: front
// three-quarter view like the workers, face turned a little to the left, arms
// at his sides. Two walk frames, then "blinded" by her phone flash: hands
// over his eyes, leaning back. Legs stay planted; the body bobs with the step.
const BIGMAN_HEAD = [24, 17];
const BIGMAN_RED = '#e23b3b';
const BIGMAN_QUILT = '#b42a30';
const BIGMAN_GLOVE = '#5d6374';
const BIGMAN_STEPS = [
  { front: [17, 71.4], back: [32, 71.4], bob: 0.4, hands: [[9.6, 50.5], [40.6, 49.6]] },
  { front: [20, 70], back: [30, 71.4], bob: -1, hands: [[11.2, 50], [39.2, 50.4]] },
];

function bigmanLegs(ctx, front, back, bob) {
  const boot = '#3a2a22';
  for (const [hip, [fx, fy], color] of [[[31, 55 + bob], back, '#242836'], [[19, 55 + bob], front, '#2f3442']]) {
    capsule(ctx, [hip, [fx, fy - 2]], 7.6, color);
    roundRect(ctx, fx - 4.2, fy - 4.4, 7.6, 6, 2.2, boot);
    ellipse(ctx, fx - 2.4, fy + 1.2, 5, 2.8, boot);
    strokePts(ctx, [[fx - 6.4, fy + 3.2], [fx + 1.6, fy + 3.2]], 0.9, '#1f1814');
  }
}

function bigmanTorsoPath(c) {
  c.moveTo(13.5, 28);
  c.quadraticCurveTo(25, 23.5, 36.5, 28);
  c.quadraticCurveTo(42.6, 36, 41.8, 56.5);
  c.quadraticCurveTo(25, 60, 8.2, 56.5);
  c.quadraticCurveTo(7.4, 36, 13.5, 28);
}

// Quilted puffer parka: curved channels, a zip and a welt pocket.
function bigmanParka(ctx) {
  shape(ctx, bigmanTorsoPath, BIGMAN_RED);
  ctx.save();
  ctx.beginPath();
  bigmanTorsoPath(ctx);
  ctx.closePath();
  ctx.clip();
  for (const y of [34, 40, 46, 52]) {
    ctx.beginPath();
    ctx.moveTo(0, y - 1.6);
    ctx.quadraticCurveTo(25, y + 0.8, 50, y - 1.6);
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.quadraticCurveTo(25, y + 2.4, 50, y);
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = BIGMAN_QUILT;
    ctx.stroke();
  }
  strokePts(ctx, [[24.4, 26], [24.4, 60]], 0.9, '#7e1c22');
  ctx.restore();
  ctx.beginPath();
  bigmanTorsoPath(ctx);
  ctx.closePath();
  outline(ctx);
  strokePts(ctx, [[14.4, 47.6], [19.2, 46.8]], 1.1, C.outline);
  strokePts(ctx, [[29.8, 46.8], [34.6, 47.6]], 1.1, C.outline);
}

// The hood's fur rim, lying around his neck as a collar.
function bigmanCollar(ctx) {
  const pts = [];
  for (let a = Math.PI; a <= Math.PI * 2.001; a += Math.PI / 8) pts.push([25 + Math.cos(a) * 12, 29 + Math.sin(a) * 3.6]);
  for (const [x, y] of pts) ellipse(ctx, x, y, 2.2, 2.2, '#d8cbb3');
  for (const [x, y] of pts) ellipse(ctx, x, y, 1.7, 1.7, '#d8cbb3', false);
  for (const [x, y] of pts.filter((_, i) => i % 2)) ellipse(ctx, x + 0.3, y + 0.5, 0.7, 0.5, '#b8aa90', false);
}

function bigmanScarf(ctx) {
  const scarf = '#4b5068';
  roundRect(ctx, 16.6, 27.4, 4.6, 12.6, [0, 0, 1.2, 1.2], scarf);
  for (const fx of [17.8, 19, 20.2]) strokePts(ctx, [[fx, 39], [fx, 41.2]], 0.5, scarf);
  strokePts(ctx, [[16.8, 36.4], [21, 36.4]], 0.8, '#ffd23f');
  roundRect(ctx, 14.8, 24.6, 18.6, 6, 3, scarf);
  for (let rx = 16.6; rx < 32; rx += 1.8) strokePts(ctx, [[rx, 26], [rx, 29.6]], 0.45, '#3a3e52');
}

function bigmanFace(ctx, blind) {
  const [x, y] = BIGMAN_HEAD;
  const head = (c) => c.ellipse(x, y, 10.6, 10.2, 0, 0, Math.PI * 2);
  shape(ctx, head, C.skin);
  ctx.save();
  ctx.beginPath();
  head(ctx);
  ctx.clip();
  ellipse(ctx, x - 1, y + 8.6, 10, 5.2, 'rgba(70,74,96,0.24)', false);
  for (const [dx, dy] of [[-6, 6], [-3.2, 7.6], [0, 7], [3.4, 7.8], [6.4, 6.2], [-4.8, 9], [1.8, 9.2], [-1.4, 10]]) {
    ellipse(ctx, x + dx, y + dy, 0.32, 0.32, 'rgba(60,58,72,0.45)', false);
  }
  ctx.restore();
  ctx.beginPath();
  head(ctx);
  outline(ctx);
  ctx.lineCap = 'round';
  if (blind) {
    // Eyes squeezed shut, brows scrunched, teeth gritted.
    strokePts(ctx, [[x - 4.4, y - 0.4], [x - 2, y + 0.9], [x - 4.4, y + 2.2]], 1.1, C.lash);
    strokePts(ctx, [[x + 2.4, y - 0.4], [x, y + 0.9], [x + 2.4, y + 2.2]], 1.1, C.lash);
    strokePts(ctx, [[x - 5.4, y - 2.6], [x - 3.4, y - 3.8], [x - 1.4, y - 2.4]], 1.5, '#3a2a22');
    strokePts(ctx, [[x - 0.6, y - 2.4], [x + 1.4, y - 3.8], [x + 3.4, y - 2.6]], 1.5, '#3a2a22');
    strokePts(ctx, [[x - 2, y - 5.8], [x - 0.2, y - 5.4]], 0.5, C.skinShade);
    ellipse(ctx, x - 1, y + 3.6, 1.8, 1.4, '#f2a48e', false);
    roundRect(ctx, x - 4, y + 5.8, 7.4, 3, 1.3, C.white);
    strokePts(ctx, [[x - 3.6, y + 7.3], [x + 3, y + 7.3]], 0.5, C.lash);
    for (const tx of [x - 1.6, x + 0.4, x + 2.2]) strokePts(ctx, [[tx, y + 6.2], [tx, y + 8.4]], 0.4, C.lash);
    return;
  }
  for (const [ex, dir] of [[x - 4.4, 1], [x + 2, -1]]) {
    ellipse(ctx, ex, y + 1.2, 0.95, 1.2, C.lash, false);
    ellipse(ctx, ex - 0.35, y + 0.75, 0.32, 0.32, C.white, false);
    strokePts(ctx, [[ex - 2 * dir, y - 2.6], [ex + 1.6 * dir, y - 1.2]], 1.7, '#3a2a22');
  }
  for (const bx of [x - 6.8, x + 4.8]) ellipse(ctx, bx, y + 3.8, 1.9, 1.1, 'rgba(255,120,130,0.45)', false);
  ellipse(ctx, x - 1.6, y + 3.4, 1.8, 1.4, '#f2a48e', false);
  ctx.beginPath();
  ctx.moveTo(x - 3.8, y + 7.2);
  ctx.quadraticCurveTo(x - 1.4, y + 6, x + 1, y + 7.2);
  ctx.lineWidth = 0.9;
  ctx.strokeStyle = C.lash;
  ctx.stroke();
}

// Dark knit beanie with a ribbed cuff.
function bigmanHat(ctx) {
  const [x, y] = BIGMAN_HEAD;
  ctx.beginPath();
  ctx.arc(x + 0.3, y - 3.8, 10.8, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = '#30364a';
  ctx.fill();
  outline(ctx);
  roundRect(ctx, x - 11.2, y - 6.8, 22.8, 4.8, 2.4, '#262b3c');
  for (let rx = x - 9.6; rx < x + 10.6; rx += 1.7) strokePts(ctx, [[rx, y - 6], [rx, y - 2.8]], 0.5, '#1c2030');
}

function bigmanSleeve(ctx, shoulder, hand) {
  capsule(ctx, [shoulder, hand], 7.4, BIGMAN_RED);
  const [dx, dy] = [hand[0] - shoulder[0], hand[1] - shoulder[1]];
  const len = Math.hypot(dx, dy);
  const [nx, ny] = [(-dy / len) * 3.7, (dx / len) * 3.7];
  for (const t of [0.35, 0.68]) {
    const [px, py] = [shoulder[0] + dx * t, shoulder[1] + dy * t];
    strokePts(ctx, [[px - nx, py - ny], [px + nx, py + ny]], 0.8, BIGMAN_QUILT);
  }
}

// Big knit mitten, fingers up; rot tilts it, flip puts the thumb on the right.
function bigmanGlove(ctx, x, y, rot = 0, flip = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  if (flip) ctx.scale(-1, 1);
  ellipse(ctx, -2.6, 1.2, 1.3, 2, BIGMAN_GLOVE);
  ellipse(ctx, 0, 0, 3.1, 4.3, BIGMAN_GLOVE);
  strokePts(ctx, [[-2.2, 2.8], [2.2, 2.8]], 0.8, '#3a3e4c');
  ellipse(ctx, -0.9, -2, 0.9, 0.7, 'rgba(255,255,255,0.3)', false);
  ctx.restore();
}

function bigmanWalk({ front, back, bob, hands: [frontHand, backHand] }) {
  return (ctx) => {
    bigmanLegs(ctx, front, back, bob);
    ctx.translate(0, bob);
    bigmanParka(ctx);
    bigmanCollar(ctx);
    bigmanScarf(ctx);
    bigmanSleeve(ctx, [36.4, 31.5], backHand);
    bigmanGlove(ctx, backHand[0], backHand[1] + 1.6, Math.PI);
    bigmanFace(ctx, false);
    bigmanHat(ctx);
    bigmanSleeve(ctx, [13.6, 31.5], frontHand);
    bigmanGlove(ctx, frontHand[0], frontHand[1] + 1.6, Math.PI);
  };
}

function flashStar(ctx, x, y, r, fill = '#fffbe0', edge = '#e0a020') {
  shape(ctx, (c) => {
    c.moveTo(x, y - r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.quadraticCurveTo(x, y, x, y + r);
    c.quadraticCurveTo(x, y, x - r, y);
    c.quadraticCurveTo(x, y, x, y - r);
  }, fill, false);
  ctx.lineWidth = 0.5;
  ctx.strokeStyle = edge;
  ctx.stroke();
}

// Blinded by the flash: feet as in step 0, upper body leaning back, both
// mittens pressed to his face.
function bigmanBlind(ctx) {
  const { front, back } = BIGMAN_STEPS[0];
  const [x, y] = BIGMAN_HEAD;
  bigmanLegs(ctx, front, back, 0);
  ctx.save();
  ctx.translate(25, 56);
  ctx.rotate(0.05);
  ctx.translate(-25, -56);
  bigmanParka(ctx);
  bigmanCollar(ctx);
  bigmanScarf(ctx);
  bigmanSleeve(ctx, [36, 31.6], [x + 8.4, y + 4.4]);
  bigmanFace(ctx, true);
  bigmanHat(ctx);
  bigmanGlove(ctx, x + 7, y + 2.2, -0.35);
  bigmanSleeve(ctx, [14, 32], [x - 9, y + 5]);
  bigmanGlove(ctx, x - 7.8, y + 2.4, 0.35, true);
  ctx.restore();
  for (const [sx, sy, r] of [[7, 9, 2.4], [4.6, 19, 1.7], [8.6, 27, 1.3], [41, 6, 1.4]]) flashStar(ctx, sx, sy, r);
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

// Ruble sign from strokes, so it does not depend on the font: stem, bowl and
// two bars. (x, y) is the centre, s the height.
function rubleSign(ctx, x, y, s, color, width) {
  const l = x - s * 0.22;
  ctx.beginPath();
  ctx.moveTo(l, y + s * 0.5);
  ctx.lineTo(l, y - s * 0.5);
  ctx.lineTo(x + s * 0.06, y - s * 0.5);
  ctx.arc(x + s * 0.06, y - s * 0.25, s * 0.25, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(l - s * 0.16, y);
  ctx.moveTo(l - s * 0.16, y + s * 0.22);
  ctx.lineTo(x + s * 0.12, y + s * 0.22);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

// --- Backrooms (level 2) -----------------------------------------------------

// Bundle of banknotes seen from the long side: bill face, stacked edges, a
// paper band with the ruble sign and the denomination.
const BILLS = {
  green: { face: '#6cc08e', edge: '#3f8a62', label: '1000' },
  blue: { face: '#73a3dc', edge: '#3f6aa8', label: '2000' },
};

function cashBundle(ctx, x, y, bill, tilt = 0) {
  const { face, edge, label } = BILLS[bill];
  const [w, h] = [13.4, 6.6];
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(tilt);
  roundRect(ctx, -w / 2, -h / 2, w, h, 1.2, face);
  for (const ly of [-1.4, 1.4]) strokePts(ctx, [[-w / 2 + 0.9, ly], [w / 2 - 0.9, ly]], 0.35, edge);
  ellipse(ctx, w * 0.3, 0, 1.6, 2, 'rgba(255,255,255,0.4)', false);
  text(ctx, label, -w * 0.29, 0.2, 2.6, C.white, 800);
  ctx.fillStyle = '#f6efd9';
  ctx.fillRect(-0.2, -h / 2, 3.6, h);
  for (const bx of [-0.2, 3.4]) strokePts(ctx, [[bx, -h / 2 + 0.2], [bx, h / 2 - 0.2]], 0.45, C.outline);
  rubleSign(ctx, 1.7, 0, 2.8, edge, 0.5);
  ctx.restore();
}

// Canvas cash sack with a tied neck and a big ruble sign.
function cashBag(ctx) {
  const canvas = '#dcc48e';
  const fold = '#b89c64';
  shape(ctx, (c) => {
    c.moveTo(17, 11);
    c.quadraticCurveTo(6.5, 19, 7.6, 30);
    c.quadraticCurveTo(8.6, 37, 22, 37);
    c.quadraticCurveTo(35.4, 37, 36.4, 30);
    c.quadraticCurveTo(37.5, 19, 27, 11);
  }, canvas);
  shape(ctx, (c) => {
    c.moveTo(18.4, 10.6);
    c.lineTo(14.6, 3.6);
    c.quadraticCurveTo(17.6, 5.2, 19.6, 2.6);
    c.quadraticCurveTo(21.8, 5, 24, 2.2);
    c.quadraticCurveTo(26.2, 5, 29.4, 3.6);
    c.lineTo(25.6, 10.6);
  }, canvas);
  for (const fx of [18.8, 22, 25.2]) strokePts(ctx, [[fx, 6], [fx + (fx - 22) * 0.12, 9.6]], 0.5, fold);
  strokePts(ctx, [[17.6, 13.6], [14.4, 20]], 0.6, fold);
  strokePts(ctx, [[26.6, 13.6], [29.6, 19]], 0.6, fold);
  capsule(ctx, [[17.4, 10.8], [26.6, 10.8]], 1.8, '#a8763e');
  for (const [ex, rot] of [[19.6, 0.5], [24.4, -0.5]]) {
    ctx.save();
    ctx.translate(ex, 12.4);
    ctx.rotate(rot);
    ellipse(ctx, 0, 0, 1.2, 2.2, '#a8763e');
    ctx.restore();
  }
  rubleSign(ctx, 22.6, 21, 8, '#3f8a62', 1.8);
}

// Pile of cash on the floor: a tied sack behind a stack of bundles, a few
// loose bills. Wide and mid-height: a normal jump clears it.
function money(ctx) {
  ellipse(ctx, 22, 39.4, 21, 1.4, 'rgba(0,0,0,0.16)', false);
  cashBag(ctx);
  // A bundle leaning on the sack's shoulder.
  cashBundle(ctx, 27.6, 18.6, 'green', 0.42);
  // Two loose bills slipped off the pile.
  for (const [lx, ly, rot, bill] of [[5, 30.4, -0.45, 'blue'], [38.2, 30.2, 0.55, 'green']]) {
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(rot);
    roundRect(ctx, -4.2, -2, 8.4, 4, 0.6, BILLS[bill].face);
    ellipse(ctx, 1.8, 0, 1, 1.3, 'rgba(255,255,255,0.4)', false);
    text(ctx, BILLS[bill].label, -1.4, 0.15, 1.7, C.white, 800);
    ctx.restore();
  }
  cashBundle(ctx, 9, 26.4, 'blue', -0.05);
  cashBundle(ctx, 21.6, 26.6, 'green', 0.04);
  cashBundle(ctx, 1.6, 32.8, 'green');
  cashBundle(ctx, 15.2, 32.8, 'blue');
  cashBundle(ctx, 28.8, 32.8, 'green');
}

// Heavy steel safe on stubby feet: combination dial, wheel handle, brass
// keyhole plate, hinges and rivets.
function safe(ctx) {
  const steel = '#4f6159';
  const steelLight = '#62786d';
  const steelDark = '#33403a';
  const chrome = '#c9ced9';
  for (const fx of [4.6, 30.8]) roundRect(ctx, fx, 41, 4.6, 4.4, [0, 0, 1.8, 1.8], steelDark);
  roundRect(ctx, 2, 3, 36, 39.4, 3, steel);
  strokePts(ctx, [[5.4, 5.2], [34.6, 5.2]], 1, steelLight);
  for (const [rx, ry] of [[4.2, 5.2], [35.8, 5.2], [4.2, 40.2], [35.8, 40.2], [4.2, 22.7], [35.8, 22.7], [20, 40.2]]) {
    ellipse(ctx, rx, ry, 0.75, 0.75, '#8fa298', false);
    ellipse(ctx, rx + 0.2, ry + 0.25, 0.4, 0.4, steelDark, false);
  }
  roundRect(ctx, 6, 7.4, 28, 30.6, 2, steelLight);
  roundRect(ctx, 8, 9.4, 24, 26.6, 1.4, steel, false);
  for (const hy of [11.4, 30.4]) roundRect(ctx, 33.2, hy, 2.4, 4.6, 1, '#8fa298');
  // Shine across the door.
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(6, 7.4, 28, 30.6, 2);
  ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.moveTo(10, 7);
  ctx.lineTo(17, 7);
  ctx.lineTo(9, 38);
  ctx.lineTo(2, 38);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // Combination dial.
  const [dx, dy] = [20, 17.4];
  ellipse(ctx, dx, dy, 6.2, 6.2, steelDark);
  ellipse(ctx, dx, dy, 4.8, 4.8, chrome, false);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const r0 = i % 3 ? 3.9 : 3.3;
    strokePts(ctx, [[dx + Math.cos(a) * r0, dy + Math.sin(a) * r0], [dx + Math.cos(a) * 4.5, dy + Math.sin(a) * 4.5]], 0.4, steelDark);
  }
  ellipse(ctx, dx, dy, 2, 2, '#8a949c');
  strokePts(ctx, [[dx, dy - 1.6], [dx, dy - 0.4]], 0.6, C.white);
  shape(ctx, (c) => {
    c.moveTo(dx - 1, dy - 7.4);
    c.lineTo(dx + 1, dy - 7.4);
    c.lineTo(dx, dy - 5.8);
  }, C.red, false);
  // Wheel handle: four long chrome spokes with ball knobs, thin outlines.
  const [wx, wy] = [14.4, 29.4];
  const ends = [0, 1, 2, 3].map((i) => {
    const a = 0.25 + (i * Math.PI) / 2;
    return [wx + Math.cos(a) * 5.4, wy + Math.sin(a) * 5.4];
  });
  for (const end of ends) strokePts(ctx, [[wx, wy], end], 2.2, C.outline);
  for (const end of ends) strokePts(ctx, [[wx, wy], end], 1.1, chrome);
  for (const [ex, ey] of ends) {
    ellipse(ctx, ex, ey, 1.4, 1.4, chrome, false);
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = C.outline;
    ctx.stroke();
    ellipse(ctx, ex - 0.4, ey - 0.4, 0.45, 0.45, C.white, false);
  }
  ellipse(ctx, wx, wy, 2.2, 2.2, chrome);
  ellipse(ctx, wx - 0.6, wy - 0.6, 0.6, 0.6, C.white, false);
  // Brass keyhole plate.
  roundRect(ctx, 24, 25.8, 6, 7.8, 1.4, '#d9a83a');
  ellipse(ctx, 25, 27, 0.8, 0.8, 'rgba(255,255,255,0.5)', false);
  ellipse(ctx, 27, 28.8, 0.9, 0.9, steelDark, false);
  shape(ctx, (c) => {
    c.moveTo(26.6, 29.2);
    c.lineTo(27.4, 29.2);
    c.lineTo(27.9, 31.6);
    c.lineTo(26.1, 31.6);
  }, steelDark, false);
}

// Big clean snowball rolling at the player: lumpy rim, cool shading, and
// faint packed-snow seams so the spin reads.
const SNOW_C = 22; // centre of the 44-unit frame; the game spins it about this
const SNOW_R = 20.2;

function snowballPath(c) {
  const n = 60;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = SNOW_R + 0.3 * Math.sin(4 * a + 0.3) + 0.22 * Math.sin(7 * a + 1.1) + 0.16 * Math.sin(11 * a + 2);
    pts.push([SNOW_C + Math.cos(a) * r, SNOW_C + Math.sin(a) * r]);
  }
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const start = mid(pts[n - 1], pts[0]);
  c.moveTo(start[0], start[1]);
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    c.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
  }
}

function snowball(ctx) {
  const k = SNOW_C;
  const g = ctx.createRadialGradient(k - 7, k - 8, 1, k - 2, k - 2, SNOW_R + 3);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.5, '#f0f5fb');
  g.addColorStop(0.82, '#cfdbea');
  g.addColorStop(1, '#a9bbd2');
  shape(ctx, snowballPath, g);
  ctx.save();
  ctx.beginPath();
  snowballPath(ctx);
  ctx.closePath();
  ctx.clip();
  // Packed-snow seams and dimples.
  ctx.lineCap = 'round';
  for (const [x0, y0, cx, cy, x1, y1] of [
    [k - 14, k + 2, k - 6, k + 6, k + 2, k + 2],
    [k + 4, k + 12, k + 10, k + 8, k + 16, k + 10],
    [k - 4, k - 14, k + 2, k - 10, k + 10, k - 13],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(cx, cy, x1, y1);
    ctx.lineWidth = 0.7;
    ctx.strokeStyle = 'rgba(120,145,180,0.55)';
    ctx.stroke();
  }
  for (const [x, y, r] of [[k + 9, k - 3, 1.4], [k - 9, k + 11, 1.2], [k + 2, k + 16, 1], [k + 14, k + 3, 0.9]]) {
    ellipse(ctx, x, y, r, r * 0.7, 'rgba(120,145,180,0.35)', false);
    ellipse(ctx, x - 0.3, y - 0.4, r * 0.7, r * 0.45, 'rgba(255,255,255,0.8)', false);
  }
  ctx.restore();
  ctx.beginPath();
  snowballPath(ctx);
  ctx.closePath();
  outline(ctx);
  // Highlight.
  ctx.save();
  ctx.translate(k - 8, k - 10);
  ctx.rotate(-0.7);
  ellipse(ctx, 0, 0, 4.6, 2.2, 'rgba(255,255,255,0.95)', false);
  ctx.restore();
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

// Taxi waiting at the end of the last level, facing right. TAXI_DOOR: the
// rear door's x as a share of the frame width (where she gets in).
export const TAXI_DOOR = 62 / 160;
const TAXI_YELLOW = '#ffc928';

function wheel(ctx, x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 12.5, Math.PI, 0);
  ctx.fillStyle = C.outline;
  ctx.fill();
  ellipse(ctx, x, y, 10, 10, '#2b2b33');
  ellipse(ctx, x, y, 5, 5, '#c9ccd6');
  ellipse(ctx, x, y, 1.8, 1.8, '#8a8fa8', false);
}

function taxi(ctx) {
  ellipse(ctx, 80, 69.5, 72, 2.5, 'rgba(0,0,0,0.18)', false);
  // Roof sign and cabin.
  roundRect(ctx, 66, 0.8, 30, 9, 2.5, '#fff6cf');
  text(ctx, 'ТАКСИ', 81, 5.5, 5.6, C.outline, 800);
  shape(ctx, (c) => {
    c.moveTo(36, 32);
    c.lineTo(46, 12);
    c.quadraticCurveTo(48, 9.5, 52, 9.5);
    c.lineTo(100, 9.5);
    c.quadraticCurveTo(104, 9.5, 107, 12);
    c.lineTo(124, 32);
  }, TAXI_YELLOW);
  const glass = ctx.createLinearGradient(0, 14, 0, 30);
  glass.addColorStop(0, '#e4f4ff');
  glass.addColorStop(1, '#9fd0f2');
  shape(ctx, (c) => {
    c.moveTo(43, 30);
    c.lineTo(51, 14);
    c.lineTo(77, 14);
    c.lineTo(77, 30);
  }, glass);
  shape(ctx, (c) => {
    c.moveTo(82, 30);
    c.lineTo(82, 14);
    c.lineTo(101, 14);
    c.lineTo(117, 30);
  }, glass);
  strokePts(ctx, [[56, 17], [52, 26]], 1.4, 'rgba(255,255,255,0.8)');
  strokePts(ctx, [[90, 17], [87, 26]], 1.4, 'rgba(255,255,255,0.8)');

  // Body with the checker stripe, doors and lights.
  shape(ctx, (c) => {
    c.moveTo(8, 34);
    c.quadraticCurveTo(10, 30, 20, 30);
    c.lineTo(140, 30);
    c.quadraticCurveTo(152, 31, 154, 40);
    c.lineTo(155, 52);
    c.quadraticCurveTo(155, 58, 149, 58);
    c.lineTo(11, 58);
    c.quadraticCurveTo(5, 58, 5, 52);
    c.lineTo(5, 40);
    c.quadraticCurveTo(5, 34, 8, 34);
  }, TAXI_YELLOW);
  strokePts(ctx, [[20, 33], [138, 33]], 1.2, 'rgba(255,255,255,0.6)');
  for (let i = 0; i < 28; i++) {
    for (let row = 0; row < 2; row++) {
      ctx.fillStyle = (i + row) % 2 ? '#ffffff' : C.outline;
      ctx.fillRect(10 + i * 5, 38 + row * 2.6, 5, 2.6);
    }
  }
  for (const x of [44, 80, 116]) strokePts(ctx, [[x, 31.5], [x, 56.5]], 0.9, C.outline);
  capsule(ctx, [[68, 47.5], [73, 47.5]], 1.6, C.gray);
  capsule(ctx, [[104, 47.5], [109, 47.5]], 1.6, C.gray);
  ellipse(ctx, 118.5, 31, 2.6, 1.8, TAXI_YELLOW);
  ellipse(ctx, 152, 40, 2.2, 3, '#fff7c2');
  roundRect(ctx, 4.5, 37.5, 3, 6, 1, '#e04848');
  capsule(ctx, [[148, 54.5], [156, 54.5]], 2.2, C.gray);
  capsule(ctx, [[4, 54.5], [11, 54.5]], 2.2, C.gray);
  wheel(ctx, 36, 59);
  wheel(ctx, 124, 59);
}

export function buildSprites() {
  const px = toPx(UNIT);
  const sheet = (frames, fw, fh, k = 1) => renderSheet(frames, fw, fh, UNIT * k);
  return {
    hero: buildHero(UNIT),
    heroDown: buildHeroDown(UNIT),
    heroWinter: buildHero(UNIT, { winter: true }),
    heroWinterDown: buildHeroDown(UNIT, { winter: true }),
    elder: {
      // Drawn 4 units down in a taller frame: headroom for tall hats.
      ...sheet(
        ELDERS.flatMap((draw) => ELDER_STEPS.map(draw)).map((frame) => (ctx) => {
          ctx.translate(0, 4);
          frame(ctx);
        }),
        36,
        44,
        ELDER_SCALE,
      ),
      anims: Object.fromEntries(ELDERS.map((_, i) => [`walk${i}`, { frames: [i * 2, i * 2 + 1], fps: 4 }])),
      variants: true,
      body: toPx(UNIT * ELDER_SCALE)({ x: 5, y: 8, w: 24, h: 35 }),
    },
    worker: {
      ...sheet(WORKERS.flatMap((draw) => WORKER_STEPS.map(draw)), 47, 50, WORKER_SCALE),
      anims: Object.fromEntries(WORKERS.map((_, i) => [`walk${i}`, { frames: [i * 2, i * 2 + 1], fps: 4 }])),
      variants: true,
      body: toPx(UNIT * WORKER_SCALE)({ x: 11, y: 7.4, w: 25, h: 42 }),
    },
    bigman: {
      ...sheet([...BIGMAN_STEPS.map(bigmanWalk), bigmanBlind], 50, 76, BIGMAN_SCALE),
      anims: { walk: { frames: [0, 1], fps: 4 }, blind: { frames: [2], fps: 1 } },
      body: toPx(UNIT * BIGMAN_SCALE)({ x: 9.5, y: 6.6, w: 32, h: 69 }),
    },
    chair: { ...sheet([chair], 28, 42), body: px({ x: 3, y: 2, w: 22, h: 39 }) },
    shelf: { ...sheet([shelf], 48, 114), body: px({ x: 3, y: 1, w: 42, h: 112 }) },
    money: { ...sheet([money], 44, 40, VAULT_SCALE), body: toPx(UNIT * VAULT_SCALE)({ x: 3, y: 6.4, w: 38, h: 33 }) },
    safe: { ...sheet([safe], 40, 46, VAULT_SCALE), body: toPx(UNIT * VAULT_SCALE)({ x: 2.6, y: 3.6, w: 34.8, h: 41.8 }) },
    snowball: {
      ...sheet([snowball], 44, 44, SNOWBALL_SCALE),
      body: toPx(UNIT * SNOWBALL_SCALE)({ x: 2, y: 2, w: 40, h: 40 }),
      circle: toPx(UNIT * SNOWBALL_SCALE)({ x: SNOW_C, y: SNOW_C, r: 20 }),
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
    taxi: sheet([taxi], 160, 72),
  };
}
