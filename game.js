const root = document.documentElement;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const stage = canvas.parentElement;
const SCALE = 2;
let W = 800;
let H = 500;

/* на вузьких екранах поле вертикальне, щоб бульбашки були більшими */
function setupSize() {
  W = window.innerWidth < 640 ? 400 : 800;
  H = 500;
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  stage.style.aspectRatio = `${W} / ${H}`;
}
setupSize();
const ROUND_SECONDS = 45;
const DISCOUNT_SCORE = 50; // поріг знижки 10%: підлаштуйте після тесту з дітьми
const WHATSAPP = '41764929764';

const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const bestEl = document.getElementById('best');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');
const startBtn = document.getElementById('startBtn');
const discountBtn = document.getElementById('discountBtn');
const goalEl = document.getElementById('goalText');

const sharkImg = new Image();
sharkImg.src = 'logo.svg';

let state = 'ready';
let bubbles = [];
let particles = [];
let floaters = [];
let shark = null;
let score = 0;
let timeLeft = ROUND_SECONDS;
let spawnTimer = 0;
let sharkTimer = 5;
let last = 0;
let best = 0;
let newBest = false;
let lastResult = null;
let flash = 0;
const FAKE_PENALTY = 3;

try { best = Number(localStorage.getItem('sharkBest')) || 0; } catch {}
bestEl.textContent = best;

/* тема та мова */
function savedTheme() {
  try { return localStorage.getItem('theme'); } catch { return null; }
}
root.dataset.theme = savedTheme() || 'dark';
document.getElementById('themeToggle').addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch {}
});
document.getElementById('langSwitch').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-lang]');
  if (btn) i18n.set(btn.dataset.lang);
});
document.getElementById('year').textContent = new Date().getFullYear();
function renderGoal() {
  goalEl.textContent = i18n.t('game.goal').replace('{n}', DISCOUNT_SCORE);
}

document.addEventListener('langchange', () => {
  renderGoal();
  canvas.setAttribute('aria-label', i18n.t('game.canvas'));
  if (state === 'over') showResult();
});
i18n.apply();

/* допоміжні */
const rand = (a, b) => a + Math.random() * (b - a);
const isLight = () => root.dataset.theme === 'light';

function spawnBubble() {
  const r = rand(26, 52);
  const ramp = 1 + (ROUND_SECONDS - timeLeft) / ROUND_SECONDS * 0.6;
  const fake = state === 'play' && bubbles.filter((b) => b.fake).length < 2 && Math.random() < 0.15;
  bubbles.push({
    x: rand(r, W - r),
    y: H + r,
    r,
    vy: -rand(55, 120) * ramp,
    phase: rand(0, Math.PI * 2),
    sway: rand(10, 30),
    baseX: 0,
    fake,
  });
  bubbles[bubbles.length - 1].baseX = bubbles[bubbles.length - 1].x;
}

function spawnShark() {
  const toRight = Math.random() < 0.5;
  const w = W < 500 ? 130 : 170;
  shark = {
    w,
    h: w * 64 / 120,
    x: toRight ? -w : W + w,
    y: rand(70, H - 160),
    vx: (toRight ? 1 : -1) * rand(120, 170),
    wave: rand(0, 6),
  };
}

function burst(x, y, colors, count, speed) {
  for (let i = 0; i < count; i++) {
    const a = rand(0, Math.PI * 2);
    const s = rand(speed * 0.4, speed);
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.4, 0.8), max: 0.8, r: rand(2, 5), color: colors[Math.floor(Math.random() * colors.length)] });
  }
}

function addScore(n, x, y) {
  score += n;
  scoreEl.textContent = score;
  floaters.push({ x, y, text: `+${n}`, life: 0.8, big: n > 1 });
}

/* керування */
function toGame(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: (e.clientX - rect.left) / rect.width * W, y: (e.clientY - rect.top) / rect.height * H };
}

canvas.addEventListener('pointerdown', (e) => {
  if (state !== 'play') return;
  const p = toGame(e);

  if (shark) {
    const cx = shark.x + shark.w / 2;
    const cy = shark.y + shark.h / 2;
    const dx = (p.x - cx) / (shark.w / 2 + 10);
    const dy = (p.y - cy) / (shark.h / 2 + 14);
    if (dx * dx + dy * dy <= 1) {
      addScore(5, cx, cy - 20);
      burst(cx, cy, ['#ffd93d', '#ff6b9d', '#6bf0c8', '#b388ff', '#7cd4ff'], 26, 260);
      shark = null;
      return;
    }
  }

  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    const d = Math.hypot(p.x - b.x, p.y - b.y);
    if (d <= b.r + 10) {
      bubbles.splice(i, 1);
      if (b.fake) {
        score = Math.max(0, score - FAKE_PENALTY);
        scoreEl.textContent = score;
        floaters.push({ x: b.x, y: b.y - b.r, text: `-${FAKE_PENALTY}`, life: 0.9, big: true, color: '#ff4d6d' });
        burst(b.x, b.y, ['#ff4d6d', '#ff8fa3', '#ffd0d9'], 16, 220);
        flash = 0.35;
      } else {
        addScore(1, b.x, b.y - b.r);
        burst(b.x, b.y, isLight() ? ['#2496f0', '#9bd6ff'] : ['#ffffff', '#cfeaff'], 9, 150);
      }
      return;
    }
  }
});

function startGame() {
  setupSize();
  discountBtn.hidden = true;
  bubbles = [];
  particles = [];
  floaters = [];
  shark = null;
  score = 0;
  timeLeft = ROUND_SECONDS;
  spawnTimer = 0;
  sharkTimer = rand(4, 7);
  newBest = false;
  flash = 0;
  scoreEl.textContent = 0;
  timeEl.textContent = ROUND_SECONDS;
  overlay.hidden = true;
  state = 'play';
}

function showResult() {
  overlayTitle.textContent = i18n.t('game.over');
  const won = lastResult >= DISCOUNT_SCORE;
  overlayText.textContent = `${i18n.t('game.result')}: ${lastResult}`
    + (newBest ? `\n${i18n.t('game.newbest')}` : '')
    + `\n${won ? i18n.t('game.won') : i18n.t('game.goal').replace('{n}', DISCOUNT_SCORE)}`;
  discountBtn.hidden = !won;
  if (won) {
    const msg = i18n.t('game.discount.msg').replace('{n}', lastResult);
    discountBtn.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
  }
  startBtn.textContent = i18n.t('game.again');
  overlay.hidden = false;
}

function endGame() {
  state = 'over';
  lastResult = score;
  if (score > best) {
    best = score;
    newBest = score > 0;
    bestEl.textContent = best;
    try { localStorage.setItem('sharkBest', String(best)); } catch {}
  }
  showResult();
}

startBtn.addEventListener('click', startGame);

/* оновлення */
function update(dt) {
  if (state === 'play') {
    timeLeft -= dt;
    timeEl.textContent = Math.max(0, Math.ceil(timeLeft));
    if (timeLeft <= 0) { timeLeft = 0; endGame(); }

    spawnTimer -= dt;
    if (spawnTimer <= 0 && state === 'play') {
      spawnBubble();
      const ramp = 1 - (ROUND_SECONDS - timeLeft) / ROUND_SECONDS * 0.45;
      spawnTimer = rand(0.35, 0.8) * ramp;
    }

    sharkTimer -= dt;
    if (sharkTimer <= 0 && !shark) {
      spawnShark();
      sharkTimer = rand(7, 10);
    }
  } else if (state === 'ready') {
    spawnTimer -= dt;
    if (spawnTimer <= 0) { spawnBubble(); spawnTimer = 0.7; }
  }

  bubbles.forEach((b) => {
    b.y += b.vy * dt;
    b.phase += dt * 2;
    b.x = b.baseX + Math.sin(b.phase) * b.sway;
  });
  bubbles = bubbles.filter((b) => b.y + b.r > -20);

  if (shark) {
    shark.x += shark.vx * dt;
    shark.wave += dt * 3;
    if (shark.x < -shark.w - 40 || shark.x > W + shark.w + 40) shark = null;
  }

  particles.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; p.life -= dt; });
  particles = particles.filter((p) => p.life > 0);
  flash = Math.max(0, flash - dt * 1.2);
  floaters.forEach((f) => { f.y -= 45 * dt; f.life -= dt; });
  floaters = floaters.filter((f) => f.life > 0);
}

/* малювання */
function drawSea() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  if (isLight()) { g.addColorStop(0, '#bfeaff'); g.addColorStop(0.55, '#8fd3f7'); g.addColorStop(1, '#5fb4ea'); }
  else { g.addColorStop(0, '#1b6fd1'); g.addColorStop(0.55, '#1450a8'); g.addColorStop(1, '#0c2d6b'); }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = isLight() ? 'rgba(255,255,255,.3)' : 'rgba(255,255,255,.05)';
  [[120, 80], [380, 110], [620, 90]].forEach(([x0, w0]) => {
    const x = x0 * W / 800;
    const w = w0 * W / 800;
    ctx.beginPath();
    ctx.moveTo(x, 0); ctx.lineTo(x + w, 0); ctx.lineTo(x + w * 2.2, H); ctx.lineTo(x - w * 0.4, H);
    ctx.fill();
  });

  ctx.fillStyle = isLight() ? '#eacb87' : '#d9b46a';
  ctx.beginPath();
  ctx.moveTo(0, H - 30);
  ctx.bezierCurveTo(200, H - 50, 380, H - 15, 600, H - 38);
  ctx.bezierCurveTo(700, H - 48, 760, H - 32, W, H - 40);
  ctx.lineTo(W, H); ctx.lineTo(0, H);
  ctx.fill();
}

function drawFake(b) {
  const pulse = 1 + Math.sin(b.phase * 2) * 0.05;
  const r = b.r * pulse;
  const g = ctx.createRadialGradient(b.x - r * 0.3, b.y - r * 0.3, r * 0.1, b.x, b.y, r);
  g.addColorStop(0, 'rgba(255,200,210,.95)');
  g.addColorStop(0.55, 'rgba(255,77,109,.75)');
  g.addColorStop(1, 'rgba(190,20,60,.85)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  const k = r * 0.38;
  ctx.lineWidth = Math.max(4, r * 0.18);
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(b.x - k, b.y - k); ctx.lineTo(b.x + k, b.y + k);
  ctx.moveTo(b.x + k, b.y - k); ctx.lineTo(b.x - k, b.y + k);
  ctx.stroke();
  ctx.lineCap = 'butt';
}

function drawBubble(b) {
  if (b.fake) { drawFake(b); return; }
  const light = isLight();
  const g = ctx.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.1, b.x, b.y, b.r);
  g.addColorStop(0, light ? 'rgba(210,240,255,.95)' : 'rgba(255,255,255,.9)');
  g.addColorStop(0.5, light ? 'rgba(90,190,255,.35)' : 'rgba(255,255,255,.16)');
  g.addColorStop(1, light ? 'rgba(90,190,255,.15)' : 'rgba(255,255,255,.06)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = light ? 'rgba(36,150,240,.9)' : 'rgba(255,255,255,.8)';
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.beginPath(); ctx.ellipse(b.x - b.r * 0.4, b.y - b.r * 0.45, b.r * 0.2, b.r * 0.12, -0.6, 0, Math.PI * 2); ctx.fill();
}

function drawShark(s) {
  const toRight = s.vx > 0;
  const k = s.w / 120;
  const bob = Math.sin(s.wave) * 6;
  ctx.save();
  ctx.translate(s.x + s.w / 2, s.y + s.h / 2 + bob);
  if (toRight) ctx.scale(-1, 1);
  ctx.translate(-s.w / 2, -s.h / 2);
  ctx.scale(k, k);
  if (sharkImg.complete) ctx.drawImage(sharkImg, 0, 0, 120, 64);

  ctx.translate(30, 25);
  ctx.rotate(-14 * Math.PI / 180);
  ctx.translate(-30, -25);
  ctx.translate(22, 3);
  ctx.scale(0.55, 0.55);
  ctx.fillStyle = '#ffd93d';
  ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(29, 38); ctx.lineTo(1, 38); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ff6b9d';
  ctx.beginPath(); ctx.moveTo(9, 20); ctx.lineTo(21, 20); ctx.lineTo(24, 29); ctx.lineTo(6, 29); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(15, 2, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function draw() {
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  drawSea();
  bubbles.forEach(drawBubble);
  if (shark) drawShark(shark);

  particles.forEach((p) => {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;

  floaters.forEach((f) => {
    ctx.globalAlpha = Math.max(0, f.life / 0.8);
    ctx.font = `700 ${f.big ? 34 : 24}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0,0,0,.45)';
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color || (f.big ? '#ffd93d' : '#ffffff');
    ctx.fillText(f.text, f.x, f.y);
  });
  ctx.globalAlpha = 1;

  if (flash > 0) {
    ctx.fillStyle = `rgba(255, 40, 70, ${flash})`;
    ctx.fillRect(0, 0, W, H);
  }
}

function frame(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000 || 0);
  last = ts;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
