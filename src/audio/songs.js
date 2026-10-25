import { midiToFreq, noteToMidi } from './engine.js';

// Song notation: one token per step (16th notes unless stepsPerBeat says
// otherwise). `C5` starts a note, `-` holds the previous one, `.` is a rest,
// `|` is a bar line for readability, `E4+G4+B4` plays a chord. Drum tracks use
// k s h o r c (kick, snare, hat, open hat, rim, crash). Tracks shorter than
// the song loop on their own (a one-bar drum loop under an 8-bar melody).

export const INSTRUMENTS = {
  lead: { wave: 'pulse25', vol: 0.1, attack: 0.004, decay: 0.09, sustain: 0.55, release: 0.05, gate: 0.92, vibrato: { rate: 5.5, cents: 14, delay: 0.18 } },
  leadRound: { wave: 'pulse50', vol: 0.08, attack: 0.004, decay: 0.1, sustain: 0.5, release: 0.05, gate: 0.9, vibrato: { rate: 5.5, cents: 12, delay: 0.18 } },
  echo: { wave: 'pulse12', vol: 0.035, attack: 0.004, decay: 0.08, sustain: 0.5, release: 0.05, gate: 0.85 },
  bass: { wave: 'triangle', vol: 0.32, attack: 0.002, decay: 0.04, sustain: 0.85, release: 0.03, gate: 0.75 },
  arp: { wave: 'pulse12', vol: 0.035, attack: 0.002, decay: 0.05, sustain: 0.25, release: 0.02, gate: 0.6 },
  flute: { wave: 'triangle', vol: 0.2, attack: 0.03, decay: 0.12, sustain: 0.75, release: 0.12, gate: 0.95, vibrato: { rate: 5, cents: 18, delay: 0.2 } },
  keys: { wave: 'pulse50', vol: 0.028, attack: 0.006, decay: 0.22, sustain: 0.3, release: 0.12, gate: 0.9, filter: 1500 },
  softBass: { wave: 'triangle', vol: 0.3, attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.08, gate: 0.9 },
  fanfare: { wave: 'pulse25', vol: 0.12, attack: 0.003, decay: 0.06, sustain: 0.7, release: 0.08, gate: 0.95, vibrato: { rate: 6, cents: 20, delay: 0.25 } },
  harmony: { wave: 'pulse12', vol: 0.06, attack: 0.003, decay: 0.06, sustain: 0.6, release: 0.06, gate: 0.95 },
  sad: { wave: 'pulse50', vol: 0.1, attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.15, gate: 0.95, filter: 2200, vibrato: { rate: 4.5, cents: 35, delay: 0.25 } },
  drums: { drums: true, vol: 1 },
  brush: { drums: true, vol: 0.45 },
};

function parseTrack(src, drums, transpose) {
  const tokens = src.split(/\s+/).filter((t) => t && t !== '|');
  const events = new Array(tokens.length).fill(null);
  let last = null;
  tokens.forEach((tok, i) => {
    if (tok === '-') {
      if (last) last.len += 1;
      return;
    }
    if (tok === '.') {
      last = null;
      return;
    }
    const parts = tok.split('+');
    const notes = drums ? parts : parts.map((p) => midiToFreq(noteToMidi(p) + transpose));
    last = { notes, len: 1 };
    events[i] = last;
  });
  return events;
}

function shiftEvents(events, by) {
  if (!by) return events;
  const n = events.length;
  return events.map((_, i) => events[(i - by + n) % n]);
}

function compile({ bpm, stepsPerBeat = 4, barSteps = 16, transpose = 0, loop = true, tail, tracks }) {
  const compiled = tracks.map((tr) => {
    const inst = INSTRUMENTS[tr.inst];
    return { inst, events: shiftEvents(parseTrack(tr.notes, inst.drums, transpose), tr.shift ?? 0) };
  });
  return {
    bpm,
    stepsPerBeat,
    barSteps,
    loop,
    tail,
    length: Math.max(...compiled.map((t) => t.events.length)),
    tracks: compiled,
  };
}

// --- helpers to generate accompaniment from chord lists ---------------------

const octaveUp = (note) => note.replace(/(-?\d)$/, (d) => String(Number(d) + 1));
const rests = (n) => Array(n).fill('.').join(' ');

// Eighth-note octave pump: low root, high root.
function pumpBass(roots) {
  return roots
    .map((r) => {
      const hi = octaveUp(r);
      return `${r} . ${hi} . ${r} . ${hi} . ${r} . ${hi} . ${r} . ${hi} .`;
    })
    .join(' | ');
}

// 16th-note arpeggio; `order` indexes into each bar's chord tones.
function arpeggio(chords, order) {
  return chords.map((tones) => Array.from({ length: 16 }, (_, i) => tones[order[i % order.length]]).join(' ')).join(' | ');
}

// Half-bar chords with hits at the given [step, length] pairs (8 steps each).
function comp(halves, hits) {
  return halves
    .map((chord) => {
      const steps = Array(8).fill('.');
      for (const [at, len] of hits) {
        steps[at] = chord;
        for (let i = 1; i < len; i++) steps[at + i] = '-';
      }
      return steps.join(' ');
    })
    .join(' | ');
}

// --- menu: slow office muzak in C major -------------------------------------

const MENU_CHORDS = {
  Cmaj7: { voicing: 'E4+G4+B4', root: 'C3', fifth: 'G2' },
  Am7: { voicing: 'E4+G4+C5', root: 'A2', fifth: 'E2' },
  Dm7: { voicing: 'F4+A4+C5', root: 'D3', fifth: 'A2' },
  G7: { voicing: 'F4+B4+D5', root: 'G2', fifth: 'D3' },
  A7: { voicing: 'E4+G4+C#5', root: 'A2', fifth: 'E2' },
  C6: { voicing: 'E4+G4+A4', root: 'C3', fifth: 'G2' },
};
const MENU_HALVES = ['Cmaj7', 'Cmaj7', 'Am7', 'Am7', 'Dm7', 'Dm7', 'G7', 'G7', 'Cmaj7', 'Cmaj7', 'A7', 'A7', 'Dm7', 'G7', 'C6', 'C6'];

const menu = compile({
  bpm: 96,
  tracks: [
    {
      inst: 'flute',
      notes: `
        E5 - - - D5 - E5 - G5 - - - . . . . | A5 - - - G5 - E5 - C5 - - - . . . .
        F5 - - - E5 - D5 - A4 - - - C5 - D5 - | B4 - - - - - - - . . G4 - A4 - B4 -
        E5 - - - D5 - E5 - B5 - - - A5 - G5 - | A5 - - - G5 - E5 - C#5 - - - . . . .
        D5 - F5 - A5 - - - G5 - F5 - D5 - B4 - | C5 - - - - - - - . . . . . . . .`,
    },
    { inst: 'keys', notes: comp(MENU_HALVES.map((c) => MENU_CHORDS[c].voicing), [[0, 2], [3, 2], [6, 1]]) },
    {
      inst: 'softBass',
      notes: MENU_HALVES.map((c) => `${MENU_CHORDS[c].root} - - . ${MENU_CHORDS[c].fifth} - . .`).join(' | '),
    },
    { inst: 'brush', notes: 'k . h . r . h . k . h k r . h .' },
  ],
});

// --- game: upbeat A minor, one variation per zone ---------------------------

const GAME_LEAD = `
  E5 - . E5 D5 . C5 - D5 - E5 - A4 - . . | F5 - . F5 E5 . C5 - A4 - C5 - F5 - E5 -
  G5 - . G5 E5 . C5 - E5 - G5 - C6 - B5 - | A5 - G5 - D5 - . B4 D5 - G5 - - - . .
  E5 - . E5 D5 . C5 - D5 - E5 - A5 - . . | C6 - . A5 F5 . A5 - C6 - A5 - F5 - E5 -
  D5 - . D5 E5 . F5 - G5 - F5 - E5 - D5 - | E5 - - - G#5 - - - B5 - - - G#5 - . .
  A4 - C5 - F5 - - - E5 - C5 - A4 - - - | B4 - D5 - G5 - - - F5 - D5 - B4 - - -
  G5 - . G5 E5 . B4 - E5 - G5 - B5 - - - | A5 - - - E5 - - - C5 - - - A4 - . .
  D5 - F5 - A5 - - - G5 - F5 - D5 - - - | B4 - D5 - G5 - - - A5 - B5 - D6 - - -
  E6 - - - D6 - - - B5 - - - G#5 - - - | E5 - . E5 F5 . E5 - D5 - C5 - B4 - . .`;

const GAME_ROOTS = ['A2', 'F2', 'C3', 'G2', 'A2', 'F2', 'G2', 'E2', 'F2', 'G2', 'E2', 'A2', 'D3', 'G2', 'E2', 'E2'];
const TONES = {
  Am: ['A4', 'C5', 'E5'],
  F: ['A4', 'C5', 'F5'],
  C: ['G4', 'C5', 'E5'],
  G: ['G4', 'B4', 'D5'],
  E: ['G#4', 'B4', 'E5'],
  Em: ['G4', 'B4', 'E5'],
  Dm: ['A4', 'D5', 'F5'],
};
const GAME_CHORDS = ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'E', 'F', 'G', 'Em', 'Am', 'Dm', 'G', 'E', 'E'].map((c) => TONES[c]);

function gameDrums(groove, fill) {
  const bars = Array(15).fill(groove);
  bars[0] = groove.replace(/^k/, 'c+k');
  bars.push(fill);
  return bars.join(' | ');
}

function gameSong({ bpm, transpose, lead, echo, arpOrder, groove, fill }) {
  const tracks = [
    { inst: lead, notes: GAME_LEAD },
    { inst: 'bass', notes: pumpBass(GAME_ROOTS) },
    { inst: 'arp', notes: arpeggio(GAME_CHORDS, arpOrder) },
    { inst: 'drums', notes: gameDrums(groove, fill) },
  ];
  if (echo) tracks.push({ inst: 'echo', notes: GAME_LEAD, shift: 3 });
  return compile({ bpm, transpose, tracks });
}

const gameOffice = gameSong({
  bpm: 148,
  transpose: 0,
  lead: 'lead',
  arpOrder: [0, 1, 2, 1],
  groove: 'k . h . s . h . k k h . s . h h',
  fill: 'k . h . s . h . s . s s s s s s',
});

const gameBackrooms = gameSong({
  bpm: 154,
  transpose: 2,
  lead: 'leadRound',
  echo: true,
  arpOrder: [0, 2, 1, 2],
  groove: 'k . h h s . h h k . h k s . o .',
  fill: 'k . h h s . h h s s . s s s s s',
});

const gameStreet = gameSong({
  bpm: 162,
  transpose: 3,
  lead: 'lead',
  echo: true,
  arpOrder: [2, 1, 0, 1, 0, 1, 2, 0],
  groove: 'k h h k s h h k k h k h s h o h',
  fill: 'k h s h s s k s s s s s s s s s',
});

// --- jingles -------------------------------------------------------------

const gameOver = compile({
  bpm: 110,
  loop: false,
  tail: 0.8,
  tracks: [
    { inst: 'sad', notes: 'E5 - - - C5 - - - A4 - - - G#4 - - - - - - - A4 - - - - - - - - - - -' },
    { inst: 'softBass', notes: 'A2 - - - - - - - F2 - - - E2 - - - - - - - A1 - - - - - - - - - - -' },
  ],
});

const victory = compile({
  bpm: 132,
  loop: false,
  tail: 0.6,
  tracks: [
    {
      inst: 'fanfare',
      notes: `G4 . C5 . E5 . G5 - - . E5 . G5 - - - | A5 - - . F5 . A5 - B5 - - . G5 . B5 -
              C6 - - - - - - - - - - - - - - - | ${rests(16)}`,
    },
    {
      inst: 'harmony',
      notes: `E4 . G4 . C5 . E5 - - . C5 . E5 - - - | F5 - - . C5 . F5 - G5 - - . D5 . G5 -
              G5 - - - - - - - - - - - - - - - | ${rests(16)}`,
    },
    {
      inst: 'bass',
      notes: `C3 - - - - - - - C3 - - - - - - - | F2 - - - - - - - G2 - - - - - - -
              C3 - - - - - - - - - - - - - - - | ${rests(16)}`,
    },
    {
      inst: 'arp',
      notes: `${rests(16)} | ${rests(16)} | C5 E5 G5 C6 E5 G5 C6 E6 G5 C6 E6 G6 . . . . | ${rests(16)}`,
    },
    {
      inst: 'drums',
      notes: `k . . . s . . . k . . . s . . . | k . . . s . . . k . s s s s s s
              c+k . . . . . . . . . . . . . . . | ${rests(16)}`,
    },
  ],
});

export const SONGS = {
  menu,
  'game-office': gameOffice,
  'game-backrooms': gameBackrooms,
  'game-street': gameStreet,
  gameover: gameOver,
  victory,
};
