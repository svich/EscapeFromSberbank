import '@fontsource/nunito/400.css';
import '@fontsource/nunito/700.css';

await document.fonts.load('700 16px Nunito', 'Побег Escape');
const { buildBackgrounds } = await import('./vector/backgrounds.js');
const { buildSprites } = await import('./vector/sprites.js');

const sprites = buildSprites();
const backgrounds = buildBackgrounds();
const animators = [];

function frameAt(key, anim, t) {
  const a = sprites[key].anims[anim];
  return a.frames[Math.floor((t / 1000) * a.fps) % a.frames.length];
}

function drawFrame(ctx, key, frame, x, y, scale = 1) {
  const s = sprites[key];
  ctx.drawImage(s.sheet, frame * s.w, 0, s.w, s.h, x, y, s.w * scale, s.h * scale);
}

function drawRotated(ctx, key, x, y, angle, scale = 1) {
  const s = sprites[key];
  ctx.save();
  ctx.translate(x + (s.w * scale) / 2, y + (s.h * scale) / 2);
  ctx.rotate(angle);
  ctx.drawImage(s.sheet, 0, 0, s.w, s.h, (-s.w * scale) / 2, (-s.h * scale) / 2, s.w * scale, s.h * scale);
  ctx.restore();
}

function cell(parent, label, w, h, draw) {
  const fig = document.createElement('figure');
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  cv.style.width = `${w / 2}px`;
  const ctx = cv.getContext('2d');
  const caption = document.createElement('figcaption');
  caption.textContent = label;
  fig.append(cv, caption);
  parent.append(fig);
  animators.push((t) => {
    ctx.clearRect(0, 0, w, h);
    draw(ctx, t);
  });
}

const heroRow = document.getElementById('hero');
for (const anim of Object.keys(sprites.hero.anims)) {
  const { w, h } = sprites.hero;
  cell(heroRow, anim, w, h, (ctx, t) => drawFrame(ctx, 'hero', frameAt('hero', anim, t), 0, 0));
}

const obstacleRow = document.getElementById('obstacles');
const pickupRow = document.getElementById('pickups');
const objects = [
  [obstacleRow, 'elder', 'grannies & grandpa', 'walk0'],
  [obstacleRow, 'chair', 'office chair'],
  [obstacleRow, 'shelf', 'bookcase'],
  [obstacleRow, 'logo', 'logo ball'],
  [obstacleRow, 'meeting', 'meeting invite', 'flap'],
  [obstacleRow, 'door', 'exit door'],
  [pickupRow, 'coffee', 'coffee: points', 'steam'],
  [pickupRow, 'chocolate', 'chocolate: extra life'],
];
for (const [row, key, label, anim] of objects) {
  const s = sprites[key];
  cell(row, label, s.w, s.h, (ctx, t) => {
    if (key === 'logo') drawRotated(ctx, key, 0, 0, -t / 300);
    else drawFrame(ctx, key, anim ? frameAt(key, anim, t) : 0, 0, 0);
  });
}

// Zone mock-ups at game resolution: parallax layers, the hero running and
// hopping, sample props.
const W = 1920;
const H = 1080;
const GROUND_Y = 920;
const SPEED = 480;
const HERO_X = 300;

function tile(ctx, img, offset, y) {
  let x = (((offset % img.width) + img.width) % img.width) - img.width;
  for (; x < W; x += img.width) ctx.drawImage(img, Math.round(x), y);
}

const ZONES = [
  ['office', 'Zone 1: open space', [['elder', 1200, 'walk0'], ['coffee', 1650, 'steam', 700], ['chair', 2200]]],
  ['lobby', 'Zone 2: lobby', [['shelf', 1250], ['chocolate', 1750, null, 700], ['logo', 2300]]],
  ['street', 'Zone 3: street', [['meeting', 1300, 'flap', 640], ['coffee', 1800, 'steam', 760], ['door', 2350]]],
];

const zoneRoot = document.getElementById('zones');
for (const [zone, label, props] of ZONES) {
  const fig = document.createElement('figure');
  fig.style.marginBottom = '16px';
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  cv.className = 'scene';
  const ctx = cv.getContext('2d');
  const caption = document.createElement('figcaption');
  caption.textContent = label;
  fig.append(cv, caption);
  zoneRoot.append(fig);

  const bg = backgrounds[zone];
  const hero = sprites.hero;
  animators.push((t) => {
    const dist = (t / 1000) * SPEED;
    tile(ctx, bg.far, -dist * 0.2, 0);
    tile(ctx, bg.mid, -dist * 0.5, GROUND_Y - bg.mid.height);
    tile(ctx, bg.floor, -dist, GROUND_Y);

    for (const [key, base, anim, y] of props) {
      const s = sprites[key];
      const x = ((((base - dist) % 2600) + 2600) % 2600) - 320;
      const py = y ?? GROUND_Y - s.h;
      if (key === 'logo') drawRotated(ctx, key, x, py, -dist / 55);
      else drawFrame(ctx, key, anim ? frameAt(key, anim, t) : 0, x, py);
    }

    // Hop every 2 s.
    const cycle = (t / 1000) % 2;
    const air = cycle > 1.3 ? (cycle - 1.3) / 0.7 : -1;
    const top = GROUND_Y - hero.feetY;
    if (air >= 0) {
      const height = Math.sin(air * Math.PI) * 260;
      drawFrame(ctx, 'hero', air < 0.5 ? 8 : 9, HERO_X, top - height);
    } else {
      drawFrame(ctx, 'hero', frameAt('hero', 'run', t), HERO_X, top);
    }
  });
}

function loop(t) {
  for (const draw of animators) draw(t);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
