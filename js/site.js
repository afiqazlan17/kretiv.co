// Shared: nav, reveal-on-scroll, contact links.

// ---- Contact details: change these once, every page updates. ----
const CONTACT = {
  whatsapp: '60193663805', // Amirul Hafiz — digits only, with country code
  email: 'hello@kretiv.co'
};

document.querySelectorAll('[data-wa]').forEach(a => {
  const msg = a.dataset.wa || "Hi Kretivco, I'd like to talk about a project.";
  a.href = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(msg)}`;
  a.target = '_blank';
  a.rel = 'noopener';
});
document.querySelectorAll('[data-email]').forEach(a => {
  a.href = `mailto:${CONTACT.email}`;
  if (!a.children.length) a.textContent = CONTACT.email;
});

// ---- Theme (dark by default, white on request; remembered per visitor) ----
const themeBtn = document.querySelector('[data-theme-toggle]');
function applyTheme(light) {
  document.documentElement.dataset.theme = light ? 'light' : 'dark';
  document.querySelector('meta[name=theme-color]').content = light ? '#ffffff' : '#100904';
  themeBtn.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to white theme');
  try { localStorage.setItem('kretivco-theme', light ? 'light' : 'dark'); } catch (e) {}
}
themeBtn.setAttribute('aria-label', document.documentElement.dataset.theme === 'light' ? 'Switch to dark theme' : 'Switch to white theme');
themeBtn.addEventListener('click', () => applyTheme(document.documentElement.dataset.theme !== 'light'));

// ---- Nav ----
const nav = document.querySelector('.nav');
const toggle = document.querySelector('.nav__toggle');
const setSolid = () => nav.classList.toggle('is-solid', scrollY > 24);
setSolid();
addEventListener('scroll', setSolid, { passive: true });

function closeMenu() {
  nav.classList.remove('is-open');
  document.body.classList.remove('menu-open');
  toggle.setAttribute('aria-expanded', 'false');
}
toggle.addEventListener('click', () => {
  const open = !nav.classList.contains('is-open');
  nav.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
  toggle.setAttribute('aria-expanded', String(open));
});
nav.querySelectorAll('.nav__links a').forEach(a => a.addEventListener('click', closeMenu));
addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

// ---- Reveal ----
const io = new IntersectionObserver(entries => entries.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
}), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// ---- Dialogs (certificate viewer) ----
document.querySelectorAll('[data-dialog]').forEach(btn => btn.addEventListener('click', () => {
  const d = document.getElementById(btn.dataset.dialog);
  if (d && d.showModal) d.showModal();
}));
document.querySelectorAll('dialog').forEach(d => {
  d.addEventListener('click', e => { if (e.target === d || e.target.closest('[data-close]')) d.close(); });
});

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
