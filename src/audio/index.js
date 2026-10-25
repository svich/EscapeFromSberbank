import { CONFIG } from '../config.js';
import { storage } from '../storage.js';
import { ChipEngine } from './engine.js';
import { SFX } from './sfx.js';
import { SONGS } from './songs.js';

const engine = new ChipEngine();
engine.muted = storage.get(CONFIG.storage.muted) === '1';

let current = null; // name of the song playing or queued

// Game-facing audio API. Everything is a no-op until the browser allows sound.
export const audio = {
  // Call from a user gesture (keydown / pointerdown) to start the context.
  unlock() {
    engine.unlock();
  },

  // atBar: if a looping song is playing, switch at its next bar line.
  playMusic(name, { atBar = false, onEnd } = {}) {
    const song = SONGS[name];
    if (!song) return;
    if (current === name && engine.song && !engine.song.done) return;
    current = name;
    if (atBar) engine.queueSong(song);
    else engine.playSong(song, { loop: song.loop, onEnd });
  },

  stopMusic(fade = 0.08) {
    current = null;
    engine.stopSong(fade);
  },

  sfx(name) {
    const play = SFX[name];
    if (play && engine.ready) play(engine, engine.ctx.currentTime + 0.005);
  },

  isMuted() {
    return engine.muted;
  },

  setMuted(muted) {
    engine.setMuted(muted);
    storage.set(CONFIG.storage.muted, muted ? '1' : '0');
  },

  toggleMute() {
    audio.setMuted(!engine.muted);
    return engine.muted;
  },

  // Game pause: suspends the whole context, so music resumes mid-note.
  pause() {
    engine.setPaused(true);
  },

  resume() {
    engine.setPaused(false);
  },

  setHidden(hidden) {
    engine.setHidden(hidden);
  },
};
