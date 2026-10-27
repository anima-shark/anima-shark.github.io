(() => {
  const form = document.getElementById('calcForm');
  if (!form) return;

  const RATE_MIN = 50;
  const RATE_MAX = 60;
  const EXTRA = 40;
  const $ = (id) => document.getElementById(id);
  const date = $('cDate'), kids = $('cKids'), age = $('cAge'), theme = $('cTheme');
  const animators = $('cAnimators'), hours = $('cHours'), deco = $('cDeco'), clean = $('cClean');
  const result = $('cResult'), waBtn = $('cWa'), mailBtn = $('cMail');
  const waNumber = document.querySelector('[data-wa]').dataset.wa;
  const MAIL = 'sophiaprytula@gmail.com';

  const LEAD_DAYS = 14;
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const earliest = new Date();
  earliest.setHours(12, 0, 0, 0);
  earliest.setDate(earliest.getDate() + LEAD_DAYS);
  const hint = document.createElement('small');
  hint.className = 'date-hint';
  date.parentNode.appendChild(hint);
  const pop = document.createElement('div');
  pop.className = 'cal-pop';
  pop.hidden = true;
  date.parentNode.classList.add('cal-wrap');
  date.parentNode.appendChild(pop);
  const locale = () => ({ uk: 'uk-UA', de: 'de-CH', en: 'en-GB' }[document.documentElement.lang] || 'de-CH');
  let view = new Date(earliest.getFullYear(), earliest.getMonth(), 1);

  function allowed(d) {
    return d >= earliest && [0, 6].includes(d.getDay());
  }
  function setHint(bad) {
    hint.textContent = i18n.t(bad ? 'calc.date.bad' : 'calc.date.hint');
    hint.classList.toggle('bad', !!bad);
  }
  function draw() {
    const loc = locale();
    const month = view.toLocaleDateString(loc, { month: 'long', year: 'numeric' });
    const first = (view.getDay() + 6) % 7;
    const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    const canPrev = view > new Date(earliest.getFullYear(), earliest.getMonth(), 1);
    let html = `<div class="cal-head"><button type="button" class="cal-nav" data-nav="-1" ${canPrev ? '' : 'disabled'} aria-label="‹">‹</button><b>${month}</b><button type="button" class="cal-nav" data-nav="1" aria-label="›">›</button></div><div class="cal-grid">`;
    for (let i = 0; i < 7; i++) html += `<i>${new Date(2024, 0, 1 + i).toLocaleDateString(loc, { weekday: 'short' })}</i>`;
    for (let i = 0; i < first; i++) html += '<span></span>';
    for (let n = 1; n <= days; n++) {
      const d = new Date(view.getFullYear(), view.getMonth(), n, 12);
      const ok = allowed(d);
      html += `<button type="button" class="cal-day ${ok ? 'ok' : 'no'}" data-d="${iso(d)}" data-n="${n}">${n}</button>`;
    }
    pop.innerHTML = html + '</div>';
  }
  function open() { draw(); pop.hidden = false; }
  date.addEventListener('click', () => (pop.hidden ? open() : (pop.hidden = true)));
  pop.addEventListener('click', (e) => {
    const nav = e.target.closest('.cal-nav');
    if (nav) { view = new Date(view.getFullYear(), view.getMonth() + Number(nav.dataset.nav), 1); draw(); return; }
    const day = e.target.closest('.cal-day');
    if (!day) return;
    if (day.classList.contains('ok')) {
      date.value = day.dataset.d;
      pop.hidden = true;
      setHint(false);
      render();
    } else {
      day.textContent = '💀';
      day.classList.add('shake');
      setHint(true);
      setTimeout(() => { day.textContent = day.dataset.n; day.classList.remove('shake'); }, 900);
    }
  });
  document.addEventListener('click', (e) => { if (!pop.hidden && !e.target.closest('.cal-wrap')) pop.hidden = true; });
  document.addEventListener('langchange', () => { setHint(false); if (!pop.hidden) draw(); });
  setHint(false);

  const wanted = new URLSearchParams(location.search).get('theme');
  if (wanted && [...theme.options].some((o) => o.value === wanted)) theme.value = wanted;

  function price() {
    const a = Number(animators.value);
    const h = Number(hours.value);
    const extras = (deco.checked ? 1 : 0) + (clean.checked ? 1 : 0);
    const add = extras * EXTRA * h;
    return { min: a * h * RATE_MIN + add, max: a * h * RATE_MAX + add };
  }

  function message() {
    const p = price();
    const extras = [deco.checked && i18n.t('services.extra.1'), clean.checked && i18n.t('services.extra.2')].filter(Boolean);
    return i18n.t('calc.msg')
      .replace('{date}', date.value || i18n.t('calc.date.open'))
      .replace('{kids}', kids.value)
      .replace('{age}', age.value)
      .replace('{theme}', theme.selectedOptions[0].textContent)
      .replace('{animators}', animators.value)
      .replace('{hours}', hours.value)
      .replace('{extras}', extras.length ? extras.join(', ') : i18n.t('calc.none'))
      .replace('{price}', `${p.min}–${p.max} CHF`);
  }

  function render() {
    const p = price();
    result.textContent = `${p.min}–${p.max} CHF`;
    const text = message();
    waBtn.href = `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
    mailBtn.href = `mailto:${MAIL}?subject=${encodeURIComponent(i18n.t('calc.mail.subject'))}&body=${encodeURIComponent(text)}`;
  }

  form.addEventListener('input', render);
  form.addEventListener('submit', (e) => e.preventDefault());
  document.addEventListener('langchange', render);
  render();
})();
