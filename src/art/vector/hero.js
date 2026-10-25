// Vector chibi hero, drawn with canvas paths. Poses are authored in a 64x80
// unit frame (soles touch y = 77.8) and rendered at any scale.

import { C, add, capsule, ellipse, outline, renderSheet, shape, strokePts, toPx } from './draw.js';

const FRAME_W = 64;
const FRAME_H = 80;
const FEET_Y = 77.8;

// --- Head --------------------------------------------------------------------

const HEAD_R = 18.5;

function eye(ctx, x, y, rx, ry, outer, expr) {
  if (expr === 'blink') {
    ctx.beginPath();
    ctx.ellipse(x, y - 0.5, rx, ry * 0.45, 0, Math.PI * 0.1, Math.PI * 0.9);
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = C.lash;
    ctx.lineCap = 'round';
    ctx.stroke();
    return;
  }
  if (expr === 'hurt') {
    const tip = x - outer * rx * 0.7;
    strokePts(ctx, [[x + outer * rx, y - 2.6], [tip, y], [x + outer * rx, y + 2.6]], 1.4, C.lash);
    return;
  }
  const grad = ctx.createLinearGradient(x, y - ry, x, y + ry);
  grad.addColorStop(0, C.irisTop);
  grad.addColorStop(1, C.irisBottom);
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ellipse(ctx, x, y - ry * 0.12, rx * 0.5, ry * 0.55, C.lash, false);
  ellipse(ctx, x - rx * 0.32, y - ry * 0.38, rx * 0.42, rx * 0.42, '#ffffff', false);
  ellipse(ctx, x + rx * 0.4, y + ry * 0.45, rx * 0.17, rx * 0.17, '#ffffff', false);
  // Upper lash with a little wing on the outer corner.
  ctx.beginPath();
  ctx.ellipse(x, y + 0.3, rx + 0.4, ry + 0.3, 0, Math.PI * 1.08, Math.PI * 1.92);
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = C.lash;
  ctx.lineCap = 'round';
  ctx.stroke();
  const wx = x + outer * (rx + 0.1);
  strokePts(ctx, [[wx, y - ry * 0.5], [wx + outer * 1.5, y - ry * 0.85]], 1.1, C.lash);
}

function head(ctx, cx, cy, expr) {
  const fx = cx + 2.5;
  const fy = cy + 4.5;
  ellipse(ctx, cx, cy, HEAD_R, HEAD_R, C.hair);
  ellipse(ctx, fx, fy, 14, 14.5, C.skin);

  // Blush.
  for (const bx of [fx - 9, fx + 10]) {
    const g = ctx.createRadialGradient(bx, fy + 5.5, 0, bx, fy + 5.5, 3.8);
    g.addColorStop(0, 'rgba(255,120,130,0.55)');
    g.addColorStop(1, 'rgba(255,120,130,0)');
    ctx.fillStyle = g;
    ctx.fillRect(bx - 4, fy + 1.5, 8, 8);
  }

  eye(ctx, cx - 3, cy + 6, 3.3, 4.3, -1, expr);
  eye(ctx, cx + 8.5, cy + 6, 2.9, 4.1, 1, expr);
  strokePts(ctx, [[cx - 6, cy - 0.6], [cx - 3.2, cy - 1.6], [cx - 0.6, cy - 1.2]], 1.1, C.hairShade);
  strokePts(ctx, [[cx + 6.4, cy - 1.2], [cx + 8.8, cy - 1.7], [cx + 11, cy - 0.8]], 1.1, C.hairShade);
  strokePts(ctx, [[fx + 3.2, fy + 4.4], [fx + 3.8, fy + 5.4]], 1, C.skinShade);
  const mx = fx + 0.6;
  const my = fy + 8.6;
  if (expr === 'hurt') {
    ellipse(ctx, mx, my + 0.4, 1.6, 1.9, '#8a3a44');
  } else {
    ctx.beginPath();
    ctx.moveTo(mx - 2, my);
    ctx.quadraticCurveTo(mx, my + 1.9, mx + 2, my);
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = C.lips;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // Front hair: middle part, hairline framing the face, strand on the far side.
  const hairline = (c) => {
    c.moveTo(cx + 15.5, cy + 9);
    c.quadraticCurveTo(cx + 14, cy - 9, cx + 4.5, cy - 11.5);
    c.quadraticCurveTo(cx - 8, cy - 10, cx - 12, cy + 5);
  };
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, HEAD_R, HEAD_R, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.beginPath();
  ctx.moveTo(cx - 25, cy - 25);
  ctx.lineTo(cx + 25, cy - 25);
  ctx.lineTo(cx + 25, cy + 9);
  ctx.lineTo(cx + 15.5, cy + 9);
  ctx.quadraticCurveTo(cx + 14, cy - 9, cx + 4.5, cy - 11.5);
  ctx.quadraticCurveTo(cx - 8, cy - 10, cx - 12, cy + 5);
  ctx.lineTo(cx - 25, cy + 12);
  ctx.closePath();
  ctx.fillStyle = C.hair;
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  hairline(ctx);
  outline(ctx);
  ctx.beginPath();
  ctx.arc(cx, cy, HEAD_R, Math.PI * 0.8, Math.PI * 2.2);
  outline(ctx);

  // Shine and part.
  for (const [a0, a1] of [[1.08, 1.36], [1.64, 1.8]]) {
    ctx.beginPath();
    ctx.arc(cx, cy, 13.5, Math.PI * a0, Math.PI * a1);
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = C.hairShine;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  strokePts(ctx, [[cx + 4.5, cy - 11.5], [cx + 2.6, cy - 17]], 1, C.hairShade);

  // Ear with a white earbud.
  ellipse(ctx, cx - 11.6, cy + 7.5, 2.4, 3.2, C.skin);
  capsule(ctx, [[cx - 11.4, cy + 8.2], [cx - 10.9, cy + 11.6]], 1.2, '#ffffff');
  ellipse(ctx, cx - 11.4, cy + 7.8, 1.6, 1.6, '#ffffff');
}

// Low ponytail: a tapered, swaying strand from the back of the head.
function ponytail(ctx, [bx, by], [dx, dy], phase, amp = 1) {
  const n = 7;
  const step = 2.6;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const pts = [];
  for (let j = 0; j <= n; j++) {
    const sway = Math.sin(phase + j * 0.7) * j * 0.28 * amp;
    pts.push([bx + ux * step * j - uy * sway, by + uy * step * j + ux * sway]);
  }
  const left = [];
  const right = [];
  pts.forEach((p, j) => {
    const q = pts[Math.min(j + 1, n)];
    const o = pts[Math.max(j - 1, 0)];
    const tx = q[0] - o[0];
    const ty = q[1] - o[1];
    const tl = Math.hypot(tx, ty) || 1;
    const w = 4.4 * (1 - (j / n) * 0.8) * (j === 0 ? 0.8 : 1);
    left.push([p[0] - (ty / tl) * w * 0.5, p[1] + (tx / tl) * w * 0.5]);
    right.push([p[0] + (ty / tl) * w * 0.5, p[1] - (tx / tl) * w * 0.5]);
  });
  shape(ctx, (c) => {
    c.moveTo(...left[0]);
    for (let j = 1; j <= n; j++) c.lineTo(...left[j]);
    c.lineTo(...right[n]);
    for (let j = n - 1; j >= 0; j--) c.lineTo(...right[j]);
  }, C.hair);
  strokePts(ctx, pts.slice(1, 4).map((p, j) => [p[0] + (left[j + 1][0] - p[0]) * 0.4, p[1] + (left[j + 1][1] - p[1]) * 0.4]), 1, C.hairShine);
  ellipse(ctx, bx, by, 2.2, 2.2, C.hairShade);
}

// --- Body --------------------------------------------------------------------

function torso(ctx, y) {
  ctx.fillStyle = C.skinShade;
  ctx.fillRect(32, y + 39.5, 4.5, 5);
  ellipse(ctx, 34.2, y + 45, 8.2, 3.6, C.skin);
  shape(ctx, (c) => {
    c.moveTo(26.6, y + 45.7);
    c.quadraticCurveTo(34.2, y + 44.1, 41.8, y + 45.7);
    c.quadraticCurveTo(43.6, y + 49.5, 43, y + 53);
    c.lineTo(25.4, y + 53);
    c.quadraticCurveTo(24.8, y + 49.5, 26.6, y + 45.7);
  }, C.cami);
  strokePts(ctx, [[28.4, y + 45.4], [29.4, y + 42.6]], 0.9, C.cami);
  strokePts(ctx, [[40, y + 45.4], [39, y + 42.6]], 0.9, C.cami);
  strokePts(ctx, [[27.8, y + 47.5], [27.6, y + 51.5]], 1.2, C.camiLight);
  shape(ctx, (c) => {
    c.moveTo(25, y + 51.7);
    c.lineTo(43.4, y + 51.7);
    c.quadraticCurveTo(44.8, y + 55.5, 43.6, y + 58.5);
    c.lineTo(24.8, y + 58.5);
    c.quadraticCurveTo(23.6, y + 55.5, 25, y + 51.7);
  }, C.jeans);
  strokePts(ctx, [[25.4, y + 53.6], [43.1, y + 53.6]], 0.8, C.jeansShade);
  strokePts(ctx, [[27, y + 55.5], [29.5, y + 57.5]], 0.8, C.jeansLight);
  ellipse(ctx, 35.5, y + 52.7, 0.8, 0.8, '#d9c27a', false);
}

function leg(ctx, hip, [knee, foot], color) {
  const k = add(hip, knee);
  const f = add(hip, foot);
  capsule(ctx, [hip, k, f], 7, color);
  ellipse(ctx, f[0] + 1.6, f[1] + 1.4, 4.3, 2.4, color === C.jeans ? C.shoe : C.shoeShade);
  strokePts(ctx, [[f[0] - 2.2, f[1] + 3], [f[0] + 5.4, f[1] + 3]], 0.9, C.shoeShade);
}

function arm(ctx, shoulder, [elbow, hand], color, bracelet) {
  const e = add(shoulder, elbow);
  const h = add(shoulder, hand);
  capsule(ctx, [shoulder, e, h], 4.2, color);
  ellipse(ctx, h[0], h[1], 2.3, 2.3, color);
  if (!bracelet) return;
  const bx = e[0] + (h[0] - e[0]) * 0.72;
  const by = e[1] + (h[1] - e[1]) * 0.72;
  const tx = h[0] - e[0];
  const ty = h[1] - e[1];
  const tl = Math.hypot(tx, ty) || 1;
  const nx = (-ty / tl) * 2.1;
  const ny = (tx / tl) * 2.1;
  strokePts(ctx, [[bx - nx, by - ny], [bx + nx, by + ny]], 1.3, C.pearl);
}

function phone(ctx, x, y, flash) {
  ctx.beginPath();
  ctx.roundRect(x, y, 6.2, 10.4, 1.4);
  ctx.fillStyle = C.phone;
  ctx.fill();
  outline(ctx);
  ellipse(ctx, x + 1.6, y + 1.7, 0.7, 0.7, C.phoneDark, false);
  ellipse(ctx, x + 1.6, y + 3.4, 0.7, 0.7, C.phoneDark, false);
  if (flash) ellipse(ctx, x + 3.6, y + 1.7, 1.3, 1.3, '#fff7a8', false);
}

// --- Poses -------------------------------------------------------------------

const HIP_Y = 56;

// Run keyposes relative to hip / shoulder: [knee, foot], [elbow, hand].
const RUN_LEG = [
  [[5, 7], [10, 15]],
  [[2, 9], [0, 18]],
  [[0, 9], [-7, 15]],
  [[-3, 7], [-10, 11]],
  [[3, 5], [-2, 11]],
  [[8, 3], [6, 12]],
];
const RUN_ARM = [
  [[-4, 4], [-7, 8]],
  [[-2, 5], [-2, 10]],
  [[3, 5], [8, 6]],
  [[5, 3], [10, 0]],
  [[3, 5], [8, 4]],
  [[-2, 5], [-5, 9]],
];

const lerp = (a, b, t) => a + (b - a) * t;
const lerpJoints = (a, b, t) => a.map((p, i) => [lerp(p[0], b[i][0], t), lerp(p[1], b[i][1], t)]);
function sample(keys, u) {
  const i = Math.floor(u) % keys.length;
  return lerpJoints(keys[i], keys[(i + 1) % keys.length], u - Math.floor(u));
}

function drawPose(ctx, p) {
  const y = p.bob ?? 0;
  const hipF = [37.5, HIP_Y + y];
  const hipB = [31, HIP_Y + y];
  const headY = 25 + y + (p.headBob ?? 0);
  ponytail(ctx, [21, headY + 8], p.tail ?? [-0.75, 0.66], p.tailPhase ?? 0, p.tailAmp ?? 1);
  arm(ctx, [39, 46 + y], p.armB, C.skinShade);
  leg(ctx, hipB, p.legB, C.jeansShade);
  leg(ctx, hipF, p.legF, C.jeans);
  torso(ctx, y);
  head(ctx, 34, headY, p.face ?? 'open');
  arm(ctx, [30, 46 + y], p.armF, C.skin, true);
  if (p.phone) phone(ctx, ...p.phone);
}

// Slide: the upper body leans back around the hips, legs kick forward.
function drawSlide(ctx, tailPhase) {
  const hip = [40, 68];
  leg(ctx, [hip[0] - 4, hip[1] + 1], [[7, 3], [13, 5]], C.jeansShade);
  ctx.save();
  ctx.translate(hip[0], hip[1]);
  ctx.rotate(-0.75);
  ctx.translate(-34, -HIP_Y);
  ponytail(ctx, [21, 33], [-0.2, 1], tailPhase, 1.4);
  arm(ctx, [39, 46], [[5, 3], [10, 1]], C.skinShade);
  torso(ctx, 0);
  head(ctx, 34, 25, 'open');
  arm(ctx, [30, 46], [[-3, 6], [-2, 12]], C.skin, true);
  ctx.restore();
  leg(ctx, [hip[0] + 1, hip[1]], [[7, 1], [13, 3]], C.jeans);
}

function poses() {
  const RUN_FRAMES = 8;
  const run = [];
  for (let i = 0; i < RUN_FRAMES; i++) {
    const u = (i * 6) / RUN_FRAMES;
    run.push({
      bob: -1.4 * (0.5 - 0.5 * Math.cos((2 * Math.PI * (u - 1)) / 3)),
      legF: sample(RUN_LEG, u),
      legB: sample(RUN_LEG, u + 3),
      armF: sample(RUN_ARM, u),
      armB: sample(RUN_ARM, u + 3),
      tailPhase: (u * Math.PI) / 3,
    });
  }
  const jump = {
    legF: [[8, 3], [6, 12]],
    legB: [[-3, 7], [-10, 11]],
    armF: [[-5, -2], [-10, -4]],
    armB: [[5, -2], [10, -4]],
    tail: [-0.6, 0.8],
    tailPhase: 1,
  };
  const fall = {
    legF: [[2, 9], [5, 17]],
    legB: [[-2, 9], [-5, 16]],
    armF: [[-5, -4], [-9, -9]],
    armB: [[5, -4], [9, -9]],
    tail: [-0.7, -0.4],
    tailPhase: 2.5,
  };
  const hurt = {
    face: 'hurt',
    legF: [[2, 9], [4, 17]],
    legB: [[-2, 9], [-4, 17]],
    armF: [[-6, -3], [-10, -8]],
    armB: [[6, -3], [10, -8]],
  };
  // Idle: checking job offers on her phone, blinking, with a notification flash.
  const stand = [[0, 9], [0, 18]];
  const idle = [0, 1, 2, 3].map((i) => ({
    headBob: i >= 2 ? 0.8 : 0,
    face: i === 3 ? 'blink' : 'open',
    legF: stand,
    legB: stand,
    armF: [[1, 6], [8, 5]],
    armB: [[3, 5], [5, 4]],
    tail: [-0.15, 1],
    tailPhase: (i * Math.PI) / 2,
    phone: [37, 43, i === 1],
  }));
  return {
    list: [...run, jump, fall, 'slide0', 'slide1', hurt, ...idle],
    anims: {
      run: { frames: [0, 1, 2, 3, 4, 5, 6, 7], fps: 14 },
      jump: { frames: [8], fps: 1 },
      fall: { frames: [9], fps: 1 },
      slide: { frames: [10, 11], fps: 8 },
      hurt: { frames: [12], fps: 1 },
      idle: { frames: [13, 14, 15, 16], fps: 4 },
    },
  };
}

export function buildHero(scale) {
  const { list, anims } = poses();
  const frames = list.map((p) => (ctx) => {
    if (p === 'slide0' || p === 'slide1') drawSlide(ctx, p === 'slide0' ? 0 : Math.PI);
    else drawPose(ctx, p);
  });
  const px = toPx(scale);
  return {
    ...renderSheet(frames, FRAME_W, FRAME_H, scale),
    anims,
    body: px({ x: 22, y: 10, w: 24, h: 68 }),
    slideBody: px({ x: 16, y: 32, w: 40, h: 46 }),
    feetY: Math.round(FEET_Y * scale),
  };
}
