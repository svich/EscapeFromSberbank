// Shared canvas helpers for the vector art: sticker-style outlines, rounded
// limbs, and frame-sheet rendering.

export const OW = 1.3; // outline width, in art units

export const C = {
  outline: '#3b2a2f',
  hair: '#4a2c22',
  hairShade: '#2f1c16',
  hairShine: '#8a5a44',
  skin: '#ffe2cf',
  skinShade: '#f0b9a0',
  lash: '#2b2133',
  irisTop: '#34442c',
  irisBottom: '#a9bb7e',
  lips: '#d26a6a',
  cami: '#2f2a36',
  camiLight: '#4d4559',
  jeans: '#8296b6',
  jeansShade: '#64779c',
  jeansLight: '#b0c0dd',
  shoe: '#ffffff',
  shoeShade: '#d5d9e4',
  pearl: '#f6ead0',
  phone: '#f4f4f6',
  phoneDark: '#3a3a44',
  white: '#ffffff',
  paper: '#fbfbfd',
  paperShade: '#dfe3ee',
  line: '#a9b4cc',
  gray: '#8a8fa8',
  suit: '#4b5068',
  suitShade: '#363a50',
  suitLight: '#646a86',
  green: '#21a038',
  greenDark: '#0f7a2e',
  greenLight: '#7ee08f',
  red: '#e04848',
  redDark: '#a02c3c',
  gold: '#ffd23f',
  goldDark: '#e0a020',
  coffee: '#8a5a3a',
  coffeeDark: '#5a3820',
  glass: '#cfeaff',
};

export const FONT = 'Nunito, system-ui, sans-serif';

export function strokePts(ctx, pts, width, color) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (const [x, y] of pts.slice(1)) ctx.lineTo(x, y);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

// Rounded limb with a sticker outline.
export function capsule(ctx, pts, width, color) {
  strokePts(ctx, pts, width + OW * 2, C.outline);
  strokePts(ctx, pts, width, color);
}

export function outline(ctx, width = OW) {
  ctx.lineWidth = width;
  ctx.strokeStyle = C.outline;
  ctx.lineJoin = 'round';
  ctx.stroke();
}

export function ellipse(ctx, x, y, rx, ry, fill, stroke = true) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) outline(ctx);
}

export function shape(ctx, path, fill, stroke = true) {
  ctx.beginPath();
  path(ctx);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) outline(ctx);
}

export function roundRect(ctx, x, y, w, h, r, fill, stroke = true) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) outline(ctx);
}

export function text(ctx, str, x, y, size, color, weight = 700) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

export const add = ([x, y], [dx, dy]) => [x + dx, y + dy];

// Renders frames (draw functions in art units) side by side at `scale` px per
// unit. Boxes given in units come back in frame pixels.
export function renderSheet(frames, fw, fh, scale) {
  const w = Math.round(fw * scale);
  const h = Math.round(fh * scale);
  const sheet = document.createElement('canvas');
  sheet.width = w * frames.length;
  sheet.height = h;
  const ctx = sheet.getContext('2d');
  frames.forEach((draw, i) => {
    ctx.save();
    ctx.translate(i * w, 0);
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.clip();
    ctx.scale(scale, scale);
    draw(ctx);
    ctx.restore();
  });
  return { sheet, w, h, count: frames.length };
}

export const toPx = (scale) => (box) => {
  const out = {};
  for (const [k, v] of Object.entries(box)) out[k] = Math.round(v * scale);
  return out;
};
