// media.js
// Interactive extras: the WebAudio synth + on-screen keyboard on the home tab,
// the intro chord button, and the hover glossary tooltips. One initMedia()
// wires them all.

/* ============================== audio ============================= */

let ctx;
function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

const SOUNDFONT_BASE = 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/acoustic_grand_piano-mp3/';
const sampleBuffers = {};
let loadingStarted = false;

// Preload core notes to prevent network latency on initial click
function prefetchNotes() {
  if (loadingStarted) return;
  loadingStarted = true;
  const initialNotes = ['C4', 'E4', 'G4', 'C5', 'E5', 'G5'];
  initialNotes.forEach(note => loadNoteBuffer(note));
}

async function loadNoteBuffer(noteName) {
  if (sampleBuffers[noteName]) return sampleBuffers[noteName];
  if (sampleBuffers[noteName] === 'loading') return null;

  sampleBuffers[noteName] = 'loading';
  try {
    const url = `${SOUNDFONT_BASE}${noteName}.mp3`;
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    const arrayBuffer = await res.arrayBuffer();
    const ac = getCtx();
    const audioBuffer = await ac.decodeAudioData(arrayBuffer);
    sampleBuffers[noteName] = audioBuffer;
    return audioBuffer;
  } catch (e) {
    sampleBuffers[noteName] = null; // Reset to allow retry
    return null;
  }
}

function freqToNoteName(freq) {
  const freqMap = {
    261.63: 'C4',  277.18: 'Db4', 293.66: 'D4',  311.13: 'Eb4',
    329.63: 'E4',  349.23: 'F4',  369.99: 'Gb4', 392.00: 'G4',
    415.30: 'Ab4', 440.00: 'A4',  466.16: 'Bb4', 493.88: 'B4',
    523.26: 'C5',  554.36: 'Db5', 587.32: 'D5',  622.26: 'Eb5',
    659.26: 'E5',  698.46: 'F5',  739.98: 'Gb5', 784.00: 'G5',
    830.60: 'Ab5', 880.00: 'A5',  932.32: 'Bb5', 987.76: 'B5'
  };

  let closestNote = 'C4';
  let minDiff = Infinity;
  for (const [fStr, name] of Object.entries(freqMap)) {
    const f = parseFloat(fStr);
    const diff = Math.abs(f - freq);
    if (diff < minDiff) {
      minDiff = diff;
      closestNote = name;
    }
  }
  return closestNote;
}

// Stretched Inharmonic overtones + Slight Unison Detuning (Synthesizer Fallback)
function playSynthesizedNote(ac, freq, duration, vol, now) {
  // Voice Master Gain Node
  const noteGain = ac.createGain();
  noteGain.gain.setValueAtTime(0, now);
  noteGain.gain.linearRampToValueAtTime(vol, now + 0.005);
  noteGain.gain.exponentialRampToValueAtTime(vol * 0.22, now + 0.35);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  // Sweeping Low-Pass Filter
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 0.8;
  filter.frequency.setValueAtTime(freq * 10, now);
  filter.frequency.exponentialRampToValueAtTime(freq * 1.6, now + duration);

  const stretch = (n) => Math.sqrt(1 + 0.00015 * n * n);

  const harmonics = [
    { ratio: 1.0 * stretch(1), detune: -1.4, vol: 0.65, decay: 1.0 },   // Fundamental String A
    { ratio: 1.0 * stretch(1), detune: 1.4,  vol: 0.55, decay: 0.96 },  // Fundamental String B
    { ratio: 2.0 * stretch(2), detune: 0.8,  vol: 0.35, decay: 0.7 },   // 2nd Harmonic
    { ratio: 3.0 * stretch(3), detune: -0.8, vol: 0.25, decay: 0.5 },   // 3rd Harmonic
    { ratio: 4.0 * stretch(4), detune: 1.2,  vol: 0.15, decay: 0.35 },  // 4th Harmonic
    { ratio: 5.0 * stretch(5), detune: -1.2, vol: 0.08, decay: 0.22 }   // 5th Harmonic
  ];

  harmonics.forEach(h => {
    const osc = ac.createOscillator();
    const g = ac.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq * h.ratio;
    osc.detune.value = h.detune;

    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(h.vol, now + 0.005);
    g.gain.exponentialRampToValueAtTime(h.vol * 0.25, now + 0.3 * h.decay);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration * h.decay);

    osc.connect(g);
    g.connect(filter);
    
    osc.start(now);
    osc.stop(now + duration);
  });

  // Hammer Strike Noise
  const strikeOsc = ac.createOscillator();
  const strikeGain = ac.createGain();
  strikeOsc.type = 'triangle';
  strikeOsc.frequency.value = freq * 6.2;
  strikeGain.gain.setValueAtTime(0, now);
  strikeGain.gain.linearRampToValueAtTime(0.3, now + 0.001);
  strikeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.038);
  
  strikeOsc.connect(strikeGain);
  strikeGain.connect(filter);
  strikeOsc.start(now);
  strikeOsc.stop(now + 0.05);

  // Soundboard Resonance Feedback Room Loop
  const delayNode = ac.createDelay();
  const feedbackNode = ac.createGain();
  delayNode.delayTime.value = 0.055;
  feedbackNode.gain.value = 0.18;

  filter.connect(noteGain);
  noteGain.connect(delayNode);
  delayNode.connect(feedbackNode);
  feedbackNode.connect(delayNode);

  noteGain.connect(ac.destination);
  delayNode.connect(ac.destination);
}

async function playNote(freq, duration = 1.2, vol = 0.26) {
  const ac = getCtx();
  const now = ac.currentTime;
  const noteName = freqToNoteName(freq);

  // Attempt to fetch and play real pre-recorded acoustic piano samples
  const buffer = await loadNoteBuffer(noteName);

  if (buffer && buffer !== 'loading') {
    const source = ac.createBufferSource();
    const gainNode = ac.createGain();
    
    source.buffer = buffer;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(vol * 1.5, now + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    const delayNode = ac.createDelay();
    const feedbackNode = ac.createGain();
    delayNode.delayTime.value = 0.055;
    feedbackNode.gain.value = 0.18;
    
    source.connect(gainNode);
    gainNode.connect(delayNode);
    delayNode.connect(feedbackNode);
    feedbackNode.connect(delayNode);
    
    gainNode.connect(ac.destination);
    delayNode.connect(ac.destination);
    
    source.start(now);
  } else {
    // Graceful realtime fallback synthesizer if buffers are still decoding
    playSynthesizedNote(ac, freq, duration, vol, now);
  }
}

/* ============================ keyboard =========================== */

const octaveDef = [
  { note: 'C', freq: 261.63, type: 'white' }, { note: 'C#', freq: 277.18, type: 'black' },
  { note: 'D', freq: 293.66, type: 'white' }, { note: 'D#', freq: 311.13, type: 'black' },
  { note: 'E', freq: 329.63, type: 'white' }, { note: 'F', freq: 349.23, type: 'white' },
  { note: 'F#', freq: 369.99, type: 'black' }, { note: 'G', freq: 392.00, type: 'white' },
  { note: 'G#', freq: 415.30, type: 'black' }, { note: 'A', freq: 440.00, type: 'white' },
  { note: 'A#', freq: 466.16, type: 'black' }, { note: 'B', freq: 493.88, type: 'white' }
];

function initKeyboard() {
  const allKeys = [...octaveDef, ...octaveDef.map(k => ({ ...k, freq: k.freq * 2, note: k.note + '\u2082' }))];
  const kbd = document.getElementById('keyboard');
  if (!kbd) return;
  const kw = 52, kg = 3, kwt = kw + kg;
  const whites = allKeys.filter(k => k.type === 'white');
  kbd.style.width = (whites.length * kwt - kg) + 'px';

  allKeys.forEach((k, i) => {
    const el = document.createElement('div');
    el.className = k.type === 'white' ? 'key-white' : 'key-black';
    el.dataset.freq = k.freq;
    if (k.type === 'white') {
      if (k.note.startsWith('C')) {
        const l = document.createElement('span');
        l.className = 'note-label'; l.textContent = 'C'; el.appendChild(l);
      }
    } else {
      const pw = allKeys.slice(0, i).filter(x => x.type === 'white').length;
      el.style.cssText = `left:${pw * kwt - 16}px;top:0;`;
    }
    const press = () => { el.classList.add('pressed'); playNote(k.freq); setTimeout(() => el.classList.remove('pressed'), 260); };
    el.addEventListener('mousedown', press);
    el.addEventListener('touchstart', e => { e.preventDefault(); press(); }, { passive: false });
    kbd.appendChild(el);
  });

  const keyMap = { a: 261.63, s: 293.66, d: 329.63, f: 349.23, g: 392.00, h: 440.00, j: 493.88 };
  document.addEventListener('keydown', e => {
    const freq = keyMap[e.key.toLowerCase()];
    if (!freq || e.repeat) return;
    const home = document.getElementById('home');
    if (!home || !home.classList.contains('active')) return;
    if (document.activeElement && document.activeElement.tagName === 'INPUT') return; // don't steal typing
    const el = [...kbd.querySelectorAll('.key-white')].find(k => parseFloat(k.dataset.freq) === freq);
    if (el) { el.classList.add('pressed'); playNote(freq); setTimeout(() => el.classList.remove('pressed'), 260); }
  });
}

/* ============================ tooltips =========================== */

let tooltipEl = null;
function showTip(target, text) {
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'global-tooltip';
    document.body.appendChild(tooltipEl);
  }
  tooltipEl.textContent = text;
  tooltipEl.style.display = 'block';
  const t = target.getBoundingClientRect();
  const tip = tooltipEl.getBoundingClientRect();
  let top = t.top - tip.height - 8 + window.scrollY;
  let left = t.left + (t.width / 2) - (tip.width / 2) + window.scrollX;
  if (left < 8) left = 8;
  if (left + tip.width > window.innerWidth - 8) left = window.innerWidth - tip.width - 8;
  if (top < window.scrollY) top = t.bottom + 8 + window.scrollY;
  tooltipEl.style.top = top + 'px';
  tooltipEl.style.left = left + 'px';
  tooltipEl.style.opacity = '1';
}
function hideTip() {
  if (tooltipEl) { tooltipEl.style.opacity = '0'; tooltipEl.style.display = 'none'; }
}

/* ============================== init ============================== */

export function initMedia() {
  initKeyboard();
  prefetchNotes(); // Silently prefetch primary chords on layout boot
  const introBtn = document.getElementById('introChordBtn');
  if (introBtn) introBtn.addEventListener('click', () => playChord([261.63, 329.63, 392.00], 2.0));

  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('[data-tip]');
    if (target) showTip(target, target.getAttribute('data-tip'));
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('[data-tip]')) hideTip();
  });
}
