// Rounded translucent card used behind menus and stats.
export function addPanel(scene, x, y, w, h, { color = 0x2b2140, alpha = 0.78, border = 0xf27fb5, radius = 28 } = {}) {
  const g = scene.add.graphics();
  g.fillStyle(color, alpha).fillRoundedRect(x, y, w, h, radius);
  if (border !== null) g.lineStyle(5, border, 0.9).strokeRoundedRect(x, y, w, h, radius);
  return g;
}
