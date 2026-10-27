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
  earliest.setDate(earliest.getDate() + LEAD_DAYS);
  date.min = iso(earliest);
  const hint = document.createElement('small');
  hint.className = 'date-hint';
  date.parentNode.appendChild(hint);
  function checkDate() {
    const ok = !date.value || (date.value >= date.min && [0, 6].includes(new Date(date.value + 'T12:00').getDay()));
    if (!ok) date.value = '';
    hint.textContent = i18n.t(ok ? 'calc.date.hint' : 'calc.date.bad');
    hint.classList.toggle('bad', !ok);
  }
  date.addEventListener('input', checkDate);
  date.addEventListener('change', () => { checkDate(); render(); });
  document.addEventListener('langchange', checkDate);
  checkDate();

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
