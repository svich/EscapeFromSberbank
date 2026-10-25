// Tiny Web Audio chiptune engine: one shared AudioContext, pulse / triangle /
// noise voices, and a lookahead step sequencer. A timer wakes up every few ms
// and schedules notes slightly ahead on the audio clock, so timing stays tight
// even when the main thread is busy.

const LOOKAHEAD = 0.15; // s of audio scheduled ahead
const TICK_MS = 25;

const NOTE_INDEX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function noteToMidi(name) {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(name);
  if (!m) throw new Error(`Bad note name: ${name}`);
  const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return 12 * (Number(m[3]) + 1) + NOTE_INDEX[m[1]] + acc;
}

export const midiToFreq = (midi) => 440 * 2 ** ((midi - 69) / 12);

// NES-style pulse wave with the given duty cycle, as a Fourier series.
function pulseWave(ctx, duty) {
  const n = 64;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);
  for (let i = 1; i < n; i++) real[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty);
  return ctx.createPeriodicWave(real, imag);
}

function noiseBuffer(ctx) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

class SongPlayer {
  constructor(engine, song, { loop, onEnd }) {
    this.engine = engine;
    this.loop = loop;
    this.onEnd = onEnd;
    this.pending = null;
    this.done = false;
    const ctx = engine.ctx;
    this.bus = ctx.createGain();
    this.bus.gain.value = 1;
    this.bus.connect(engine.musicBus);
    this.setSong(song);
    this.step = 0;
    this.nextTime = ctx.currentTime + 0.06;
  }

  setSong(song) {
    this.song = song;
    this.stepDur = 60 / song.bpm / song.stepsPerBeat;
  }

  schedule(until) {
    const now = this.engine.ctx.currentTime;
    // After a stall (background tab, debugger) skip ahead instead of
    // firing a burst of late notes.
    if (this.nextTime < now - 0.05) this.nextTime = now + 0.02;
    while (!this.done && this.nextTime < until) {
      if (this.pending && this.step % this.song.barSteps === 0) {
        this.setSong(this.pending);
        this.pending = null;
        this.step = 0;
      }
      this.playStep(this.step, this.nextTime);
      this.nextTime += this.stepDur;
      this.step += 1;
      if (this.step >= this.song.length) {
        if (this.loop) {
          this.step = 0;
        } else {
          this.done = true;
          const delay = Math.max(0, this.nextTime - now + (this.song.tail ?? 0.3));
          if (this.onEnd) this.endTimer = window.setTimeout(this.onEnd, delay * 1000);
        }
      }
    }
  }

  playStep(step, t) {
    for (const track of this.song.tracks) {
      const ev = track.events[step % track.events.length];
      if (!ev) continue;
      const inst = track.inst;
      if (inst.drums) {
        for (const kind of ev.notes) this.engine.drum(t, kind, inst.vol ?? 1, this.bus);
      } else {
        const dur = ev.len * this.stepDur * (inst.gate ?? 0.9);
        for (const freq of ev.notes) this.engine.tone(t, freq, dur, inst, this.bus);
      }
    }
  }

  stop(fade = 0.08) {
    this.done = true;
    window.clearTimeout(this.endTimer);
    const ctx = this.engine.ctx;
    this.bus.gain.cancelScheduledValues(ctx.currentTime);
    this.bus.gain.setTargetAtTime(0, ctx.currentTime, Math.max(0.005, fade / 3));
    const bus = this.bus;
    window.setTimeout(() => bus.disconnect(), (fade + LOOKAHEAD + 0.5) * 1000);
  }
}

export class ChipEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.paused = false; // game paused: the whole context is suspended
    this.hidden = false; // tab hidden: same
    this.song = null;
  }

  // Creates the context lazily. Browsers keep it suspended until a user
  // gesture calls unlock().
  init() {
    if (this.ctx) return this.ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      this.ctx = new AC();
    } catch {
      return null;
    }
    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.knee.value = 6;
    comp.ratio.value = 4;
    this.master.connect(comp);
    comp.connect(ctx.destination);
    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = 0.6;
    this.musicBus.connect(this.master);
    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = 0.9;
    this.sfxBus.connect(this.master);
    this.waves = {
      pulse12: pulseWave(ctx, 0.125),
      pulse25: pulseWave(ctx, 0.25),
      pulse50: pulseWave(ctx, 0.5),
    };
    this.noiseBuf = noiseBuffer(ctx);
    this.timer = window.setInterval(() => this.tick(), TICK_MS);
    return ctx;
  }

  get ready() {
    return Boolean(this.ctx) && this.ctx.state === 'running';
  }

  unlock() {
    if (this.init()) this.syncRunning();
  }

  syncRunning() {
    const ctx = this.ctx;
    if (!ctx) return;
    const shouldRun = !this.paused && !this.hidden;
    if (shouldRun && ctx.state === 'suspended') ctx.resume().catch(() => {});
    else if (!shouldRun && ctx.state === 'running') ctx.suspend().catch(() => {});
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.015);
  }

  setPaused(paused) {
    this.paused = paused;
    this.syncRunning();
  }

  setHidden(hidden) {
    this.hidden = hidden;
    this.syncRunning();
  }

  tick() {
    if (this.ready && this.song) this.song.schedule(this.ctx.currentTime + LOOKAHEAD);
  }

  playSong(song, { loop = true, onEnd } = {}) {
    if (!this.init()) return;
    this.stopSong(0.05);
    this.song = new SongPlayer(this, song, { loop, onEnd });
  }

  // Switches at the next bar line so variations change in time.
  queueSong(song) {
    if (this.song && this.song.loop && !this.song.done) this.song.pending = song;
    else this.playSong(song);
  }

  stopSong(fade = 0.08) {
    if (this.song) this.song.stop(fade);
    this.song = null;
  }

  // One enveloped oscillator note. `o`: wave, vol, attack, decay, sustain,
  // release, slide (target Hz), slideTime, vibrato { rate, cents, delay }, filter (lowpass Hz).
  tone(t, freq, dur, o = {}, dest = this.sfxBus) {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const wave = o.wave ?? 'pulse50';
    if (this.waves[wave]) osc.setPeriodicWave(this.waves[wave]);
    else osc.type = wave;
    osc.frequency.setValueAtTime(freq, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t + (o.slideTime ?? dur));

    const vol = o.vol ?? 0.2;
    const attack = o.attack ?? 0.005;
    const decay = o.decay ?? 0.05;
    const sustain = o.sustain ?? 0.7;
    const release = o.release ?? 0.04;
    const attackEnd = t + attack;
    const holdEnd = Math.max(attackEnd + 0.001, t + dur);
    const decayEnd = Math.min(attackEnd + decay, holdEnd);
    const end = holdEnd + release;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, attackEnd);
    if (decayEnd > attackEnd) gain.gain.linearRampToValueAtTime(vol * sustain, decayEnd);
    gain.gain.setValueAtTime(vol * sustain, holdEnd);
    gain.gain.linearRampToValueAtTime(0, end);

    let node = osc;
    if (o.filter) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = o.filter;
      osc.connect(filter);
      node = filter;
    }
    node.connect(gain);
    gain.connect(dest);

    if (o.vibrato) {
      const lfo = ctx.createOscillator();
      lfo.frequency.value = o.vibrato.rate ?? 6;
      const depth = ctx.createGain();
      const hz = freq * (2 ** ((o.vibrato.cents ?? 15) / 1200) - 1);
      depth.gain.setValueAtTime(0, t);
      depth.gain.linearRampToValueAtTime(hz, t + (o.vibrato.delay ?? 0.12) + 0.001);
      lfo.connect(depth);
      depth.connect(osc.frequency);
      lfo.start(t);
      lfo.stop(end + 0.05);
    }

    osc.onended = () => gain.disconnect();
    osc.start(t);
    osc.stop(end + 0.05);
  }

  // Filtered noise burst. `o`: type (biquad type), freq, sweep (target Hz), q, vol.
  noise(t, dur, o = {}, dest = this.sfxBus) {
    const ctx = this.ctx;
    if (!ctx) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = o.type ?? 'highpass';
    filter.frequency.setValueAtTime(o.freq ?? 4000, t);
    if (o.q) filter.Q.value = o.q;
    if (o.sweep) filter.frequency.exponentialRampToValueAtTime(o.sweep, t + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(o.vol ?? 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    src.onended = () => gain.disconnect();
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  // k kick, s snare, h closed hat, o open hat, r rim, c crash.
  drum(t, kind, vol, dest) {
    switch (kind) {
      case 'k':
        this.tone(t, 150, 0.1, { wave: 'sine', vol: 0.6 * vol, attack: 0.001, decay: 0.09, sustain: 0, release: 0.02, slide: 42, slideTime: 0.09 }, dest);
        break;
      case 's':
        this.noise(t, 0.14, { type: 'highpass', freq: 1200, vol: 0.2 * vol }, dest);
        this.tone(t, 220, 0.05, { wave: 'triangle', vol: 0.2 * vol, decay: 0.05, sustain: 0, slide: 130 }, dest);
        break;
      case 'h':
        this.noise(t, 0.035, { type: 'highpass', freq: 7000, vol: 0.08 * vol }, dest);
        break;
      case 'o':
        this.noise(t, 0.16, { type: 'highpass', freq: 6500, vol: 0.07 * vol }, dest);
        break;
      case 'r':
        this.noise(t, 0.03, { type: 'bandpass', freq: 2600, q: 3, vol: 0.25 * vol }, dest);
        break;
      case 'c':
        this.noise(t, 0.9, { type: 'highpass', freq: 4500, vol: 0.12 * vol }, dest);
        break;
      default:
        break;
    }
  }
}
