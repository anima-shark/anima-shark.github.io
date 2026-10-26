const root = document.documentElement;

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
i18n.apply();
