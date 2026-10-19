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

  for (let i = 0; i < 36; i++) {
    const bubble = document.createElement('span');
    const size = 10 + Math.random() * 40;
    bubble.className = 'bubble';
    bubble.style.cssText =
      `left:${Math.random() * 100}%;width:${size}px;height:${size}px;` +
      `--dur:${4 + Math.random() * 4}s;--delay:${Math.random() * 2.5}s;` +
      `--sway:${(Math.random() - 0.5) * 80}px`;
    layer.appendChild(bubble);
  }

  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 11000);
}
