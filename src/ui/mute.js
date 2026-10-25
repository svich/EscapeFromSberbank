import { audio } from '../audio/index.js';

// Global mute toggle; the registry copy drives every on-screen indicator.
export function toggleMute(scene) {
  const muted = audio.toggleMute();
  scene.registry.set('muted', muted);
  if (!muted) audio.sfx('blip');
  return muted;
}

// Round speaker button that follows the registry and toggles on tap.
export function addMuteButton(scene, x, y) {
  const iconKey = () => (scene.registry.get('muted') ? 'icon-mute' : 'icon-sound');
  const img = scene.add.image(x, y, iconKey());
  const zone = scene.add.zone(x, y, img.width + 16, img.height + 16).setInteractive({ useHandCursor: true });
  zone.on('pointerdown', () => toggleMute(scene));
  const sync = () => img.setTexture(iconKey());
  scene.registry.events.on('changedata-muted', sync);
  scene.events.once('shutdown', () => scene.registry.events.off('changedata-muted', sync));
  return { img, zone };
}
