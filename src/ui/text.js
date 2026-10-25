export const FONT = 'Nunito, "Trebuchet MS", sans-serif';
export const INK = '#2b2140';

// Rounded display text with a dark outline and a soft drop shadow.
// weight: 400 | 600 | 700 (the loaded Nunito weights; 800 also available).
export function addText(scene, x, y, text, opts = {}) {
  const {
    size = 32,
    weight = 600,
    color = '#ffffff',
    align = 'left',
    origin = [0, 0],
    stroke = INK,
    shadow = true,
    lineSpacing = 6,
  } = opts;
  const thickness = stroke ? Math.max(4, Math.round(size / 6)) : 0;
  const style = {
    fontFamily: FONT,
    fontStyle: String(weight),
    fontSize: `${size}px`,
    color,
    align,
    lineSpacing,
    padding: { x: 4, y: 4 },
  };
  if (stroke) {
    style.stroke = stroke;
    style.strokeThickness = thickness;
  }
  if (shadow) {
    style.shadow = { offsetX: 0, offsetY: Math.max(3, Math.round(size / 12)), color: 'rgba(20, 12, 32, 0.45)', blur: 6, stroke: true, fill: true };
  }
  // Phaser re-renders a Text for each of padding and line spacing in its
  // constructor; styling an empty string first means the real text renders once.
  return scene.add.text(x, y, '', style).setText(text).setOrigin(origin[0], origin[1]);
}
