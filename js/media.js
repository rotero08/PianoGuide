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

function playNote(freq, duration = 1.2, vol = 0.26) {
  const ac = getCtx();
  const osc = ac.createOscillator(), osc2 = ac.createOscillator();
  const g = ac.createGain(), g2 = ac.createGain();
  osc.type = 'triangle'; osc.frequency.value = freq;
  osc2.type = 'sine'; osc2.frequency.value = freq * 2.001;
  g.gain.setValueAtTime(0.001, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(vol, ac.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  g2.gain.setValueAtTime(0.001, ac.currentTime);
  g2.gain.exponentialRampToValueAtTime(vol * 0.25, ac.currentTime + 0.01);
  g2.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration * 0.7);
  osc.connect(g); g.connect(ac.destination);
  osc2.connect(g2); g2.connect(ac.destination);
  osc.start(); osc2.start();
  osc.stop(ac.currentTime + duration); osc2.stop(ac.currentTime + duration);
}

function playChord(freqs, duration = 1.6) {
  freqs.forEach((f, i) => setTimeout(() => playNote(f, duration, 0.2), i * 12));
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
  const kw = 44, kg = 3, kwt = kw + kg;
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
      el.style.cssText = `left:${pw * kwt - 14}px;top:0;`;
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
