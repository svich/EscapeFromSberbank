// Sound effects, synthesized on the spot. Each takes the engine and a start time.
export const SFX = {
  jump(e, t) {
    e.tone(t, 330, 0.1, { wave: 'pulse25', vol: 0.13, attack: 0.002, decay: 0.08, sustain: 0.3, release: 0.03, slide: 660 });
  },

  doubleJump(e, t) {
    e.tone(t, 520, 0.07, { wave: 'pulse12', vol: 0.12, attack: 0.002, decay: 0.06, sustain: 0.3, release: 0.02, slide: 1040 });
    e.tone(t + 0.06, 780, 0.09, { wave: 'pulse12', vol: 0.1, attack: 0.002, decay: 0.08, sustain: 0.2, release: 0.03, slide: 1560 });
  },

  slide(e, t) {
    e.noise(t, 0.24, { type: 'bandpass', freq: 2400, sweep: 500, q: 1.2, vol: 0.25 });
  },

  land(e, t) {
    e.noise(t, 0.05, { type: 'lowpass', freq: 700, vol: 0.12 });
  },

  coffee(e, t) {
    e.tone(t, 988, 0.05, { wave: 'pulse25', vol: 0.1, decay: 0.04, sustain: 0.8 });
    e.tone(t + 0.055, 1319, 0.16, { wave: 'pulse25', vol: 0.1, decay: 0.14, sustain: 0.15, release: 0.05 });
  },

  shieldGet(e, t) {
    [523, 659, 784, 1047, 1319].forEach((f, i) => {
      e.tone(t + i * 0.045, f, 0.07, { wave: 'pulse25', vol: 0.1, decay: 0.05, sustain: 0.5, release: 0.04 });
    });
    e.tone(t + 0.23, 1568, 0.25, { wave: 'pulse12', vol: 0.07, decay: 0.2, sustain: 0.3, release: 0.1, vibrato: { rate: 9, cents: 30, delay: 0.02 } });
  },

  shieldBreak(e, t) {
    e.noise(t, 0.3, { type: 'highpass', freq: 3000, sweep: 700, vol: 0.22 });
    e.tone(t, 900, 0.25, { wave: 'pulse12', vol: 0.12, decay: 0.2, sustain: 0.3, slide: 180 });
  },

  hit(e, t) {
    e.tone(t, 260, 0.35, { wave: 'pulse50', vol: 0.18, decay: 0.3, sustain: 0.2, slide: 50 });
    e.noise(t, 0.32, { type: 'lowpass', freq: 1800, sweep: 200, vol: 0.32 });
  },

  zone(e, t) {
    e.tone(t, 784, 0.09, { wave: 'pulse25', vol: 0.08, decay: 0.08, sustain: 0.4 });
    e.tone(t + 0.1, 1175, 0.22, { wave: 'pulse25', vol: 0.08, decay: 0.2, sustain: 0.3, release: 0.08 });
  },

  select(e, t) {
    e.tone(t, 660, 0.05, { wave: 'pulse25', vol: 0.1, decay: 0.04, sustain: 0.6 });
    e.tone(t + 0.05, 990, 0.09, { wave: 'pulse25', vol: 0.1, decay: 0.08, sustain: 0.3 });
  },

  blip(e, t) {
    e.tone(t, 880, 0.04, { wave: 'pulse12', vol: 0.08, decay: 0.03, sustain: 0.4 });
  },

  // Magic chime for the fairy-wing double jump.
  fairy(e, t) {
    [1319, 1568, 1976, 2637].forEach((f, i) => {
      e.tone(t + i * 0.045, f, 0.12, { wave: 'pulse12', vol: 0.05, decay: 0.1, sustain: 0.2, release: 0.06 });
    });
  },

  plane(e, t) {
    e.noise(t, 2.2, { type: 'bandpass', freq: 260, sweep: 1400, q: 0.7, vol: 0.22 });
  },

  door(e, t) {
    [392, 523, 659, 784].forEach((f, i) => {
      e.tone(t + i * 0.07, f, 0.08, { wave: 'pulse12', vol: 0.09, decay: 0.06, sustain: 0.4 });
    });
  },
};
