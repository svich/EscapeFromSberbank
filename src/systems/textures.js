// Small procedural textures owned by the game code, drawn as smooth canvas
// shapes for the 1920x1080 canvas: particles, HUD icons, the progress marker
// and the shield bubble (sized from the hero's hitbox).

const TAU = Math.PI * 2;

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(w);
  c.height = Math.ceil(h);
  return { c, ctx: c.getContext('2d') };
}

function register(scene, key, canvas) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  scene.textures.addCanvas(key, canvas);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Soft round particle: white core fading to transparent (tinted at runtime).
function softDot(scene, key, size) {
  const { c, ctx } = makeCanvas(size, size);
  const r = size / 2;
  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.85)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  register(scene, key, c);
}

// Four-point twinkle star with a glow.
function spark(scene, key, size) {
  const { c, ctx } = makeCanvas(size, size);
  const r = size / 2;
  const glow = ctx.createRadialGradient(r, r, 0, r, r, r);
  glow.addColorStop(0, 'rgba(255,255,255,0.7)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU - Math.PI / 2;
    const d = i % 2 === 0 ? r * 0.95 : r * 0.22;
    ctx.lineTo(r + Math.cos(a) * d, r + Math.sin(a) * d);
  }
  ctx.closePath();
  ctx.fill();
  register(scene, key, c);
}

function confetti(scene, key) {
  const { c, ctx } = makeCanvas(16, 10);
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, 1, 1, 14, 8, 3);
  ctx.fill();
  register(scene, key, c);
}

// Round HUD button: translucent dark disc with a white glyph.
function iconButton(scene, key, drawGlyph) {
  const size = 72;
  const { c, ctx } = makeCanvas(size, size);
  const r = size / 2;
  ctx.fillStyle = 'rgba(43, 33, 64, 0.6)';
  ctx.beginPath();
  ctx.arc(r, r, r - 2, 0, TAU);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  drawGlyph(ctx, r);
  register(scene, key, c);
}

function speaker(ctx, r) {
  ctx.beginPath();
  ctx.moveTo(r - 20, r - 8);
  ctx.lineTo(r - 11, r - 8);
  ctx.lineTo(r + 1, r - 18);
  ctx.lineTo(r + 1, r + 18);
  ctx.lineTo(r - 11, r + 8);
  ctx.lineTo(r - 20, r + 8);
  ctx.closePath();
  ctx.fill();
}

function iconSound(ctx, r) {
  speaker(ctx, r);
  ctx.lineWidth = 4;
  for (const rad of [9, 17]) {
    ctx.beginPath();
    ctx.arc(r + 3, r, rad, -Math.PI / 3.2, Math.PI / 3.2);
    ctx.stroke();
  }
}

function iconMute(ctx, r) {
  speaker(ctx, r);
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#ff8fa3';
  ctx.beginPath();
  ctx.moveTo(r + 8, r - 9);
  ctx.lineTo(r + 22, r + 9);
  ctx.moveTo(r + 22, r - 9);
  ctx.lineTo(r + 8, r + 9);
  ctx.stroke();
}

function iconPause(ctx, r) {
  roundRect(ctx, r - 15, r - 17, 11, 34, 4);
  ctx.fill();
  roundRect(ctx, r + 4, r - 17, 11, 34, 4);
  ctx.fill();
}

// Map-pin style marker for the progress bar (points down).
function marker(scene, key) {
  const w = 36;
  const h = 44;
  const { c, ctx } = makeCanvas(w, h);
  const r = 15;
  const cx = w / 2;
  const cy = r + 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI * 0.8, Math.PI * 0.2);
  ctx.lineTo(cx, h - 3);
  ctx.closePath();
  ctx.fillStyle = '#f27fb5';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, TAU);
  ctx.fill();
  register(scene, key, c);
}

// Elliptical soap-bubble shield around the hero's standing hitbox.
function shieldBubble(scene, key, hero) {
  const pad = 28;
  const w = hero.body.w + pad * 2;
  const h = hero.body.h + pad * 1.6;
  const { c, ctx } = makeCanvas(w + 16, h + 16);
  const cx = c.width / 2;
  const cy = c.height / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(w / 2, h / 2);
  const fillGrad = ctx.createRadialGradient(0, 0, 0.2, 0, 0, 1);
  fillGrad.addColorStop(0, 'rgba(127, 227, 255, 0.04)');
  fillGrad.addColorStop(0.75, 'rgba(127, 227, 255, 0.16)');
  fillGrad.addColorStop(1, 'rgba(127, 227, 255, 0.55)');
  ctx.fillStyle = fillGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(190, 245, 255, 0.95)';
  ctx.shadowColor = 'rgba(127, 227, 255, 0.9)';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w / 2 - 3, h / 2 - 3, 0, 0, TAU);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Glint
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.ellipse(cx, cy, w / 2 - 14, h / 2 - 14, 0, Math.PI * 1.12, Math.PI * 1.38);
  ctx.stroke();
  register(scene, key, c);
}

export function makeFxTextures(scene, metrics) {
  softDot(scene, 'fx-dot', 24);
  spark(scene, 'fx-spark', 32);
  confetti(scene, 'fx-confetti');
  iconButton(scene, 'icon-sound', iconSound);
  iconButton(scene, 'icon-mute', iconMute);
  iconButton(scene, 'icon-pause', iconPause);
  marker(scene, 'hud-marker');
  shieldBubble(scene, 'shield-bubble', metrics.hero);
}
