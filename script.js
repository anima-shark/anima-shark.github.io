const root = document.documentElement;
const toggle = document.getElementById('themeToggle');

function getSavedTheme() {
  try { return localStorage.getItem('theme'); } catch { return null; }
}

function applyTheme(theme) {
  root.dataset.theme = theme;
  try { localStorage.setItem('theme', theme); } catch {}
}

root.dataset.theme = getSavedTheme() || 'dark';

toggle.addEventListener('click', () => {
  applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
});

document.getElementById('year').textContent = new Date().getFullYear();

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const layer = document.createElement('div');
  layer.className = 'bubbles';
  layer.setAttribute('aria-hidden', 'true');

  for (let i = 0; i < 160; i++) {
    const bubble = document.createElement('span');
    const size = 8 + Math.random() * Math.random() * 70;
    bubble.className = 'bubble';
    bubble.style.cssText =
      `left:${Math.random() * 100}%;width:${size}px;height:${size}px;` +
      `--dur:${3.5 + Math.random() * 4}s;--delay:${Math.random() * 5}s;` +
      `--sway:${(Math.random() - 0.5) * 100}px`;
    layer.appendChild(bubble);
  }

  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 13500);
}

const musicBtn = document.getElementById('musicToggle');
const SONG_URL = 'music/song.mp3';
let songAudio = null;
let synth = null;

function createSynth() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const master = ctx.createGain();
  master.gain.value = 0.12;
  master.connect(ctx.destination);

  const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const lead = [
    64, 67, 72, 67, 64, 67, 72, null,
    62, 65, 71, 65, 62, 65, 71, null,
    60, 64, 69, 64, 60, 64, 69, null,
    55, 59, 62, 67, 62, 59, 67, null,
  ];
  const bass = { 0: 48, 8: 43, 16: 45, 24: 43 };
  const step = 0.2;
  let i = 0;
  let next = ctx.currentTime + 0.05;
  let timer = null;

  function tone(note, when, len, type, vol) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.value = hz(note);
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(vol, when + 0.02);
    env.gain.exponentialRampToValueAtTime(0.001, when + len);
    osc.connect(env).connect(master);
    osc.start(when);
    osc.stop(when + len + 0.05);
  }

  function schedule() {
    while (next < ctx.currentTime + 0.4) {
      const n = lead[i % lead.length];
      if (n) tone(n, next, step * 1.6, 'triangle', 0.6);
      if (bass[i % lead.length]) tone(bass[i % lead.length], next, step * 6, 'sine', 0.7);
      next += step;
      i++;
    }
  }

  return {
    start() { ctx.resume(); schedule(); timer = setInterval(schedule, 100); },
    stop() { clearInterval(timer); ctx.suspend(); },
  };
}

async function startMusic() {
  if (!songAudio && !synth) {
    try {
      const probe = await fetch(SONG_URL, { method: 'HEAD' });
      if (probe.ok) {
        songAudio = new Audio(SONG_URL);
        songAudio.loop = true;
        songAudio.volume = 0.5;
      }
    } catch {}
    if (!songAudio) synth = createSynth();
  }
  if (songAudio) await songAudio.play(); else synth.start();
}

function stopMusic() {
  if (songAudio) songAudio.pause();
  if (synth) synth.stop();
}

musicBtn.addEventListener('click', async () => {
  const on = musicBtn.getAttribute('aria-pressed') !== 'true';
  try {
    if (on) await startMusic(); else stopMusic();
  } catch { return; }
  musicBtn.setAttribute('aria-pressed', String(on));
  musicBtn.setAttribute('aria-label', on ? 'Вимкнути музику' : 'Увімкнути музику');
});

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.addEventListener('pointerdown', (e) => {
    for (let i = 0; i < 7; i++) {
      const b = document.createElement('span');
      b.className = 'pop-bubble';
      b.style.cssText =
        `left:${e.clientX + (Math.random() - 0.5) * 16}px;top:${e.clientY + (Math.random() - 0.5) * 10}px;` +
        `--size:${5 + Math.random() * 10}px;--dur:${1.4 + Math.random() * 1.1}s;` +
        `--dx:${(Math.random() - 0.5) * 60}px;--dy:${-(60 + Math.random() * 90)}px`;
      b.addEventListener('animationend', () => b.remove());
      document.body.appendChild(b);
    }
  });
}
