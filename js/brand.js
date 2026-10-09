// KretivBrand page: the "find your fit" question, card tilt, and the dots under the phone carousel.
(() => {
  const picks = [...document.querySelectorAll('.pick')];
  const row = document.querySelector('.picks');
  const out = document.querySelector('.fit__out');
  const opts = [...document.querySelectorAll('.fit__opt')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // answer → light up the matching card and offer its WhatsApp link right there
  opts.forEach(btn => btn.addEventListener('click', () => {
    const card = picks.find(p => p.dataset.key === btn.dataset.fit);
    opts.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    picks.forEach(p => p.classList.toggle('is-pick', p === card));
    const title = card.querySelector('h3').textContent;
    const line = document.createElement('span');
    line.append("We'd start with ", Object.assign(document.createElement('strong'), { textContent: title }), '.');
    const ask = card.querySelector('.link').cloneNode(true);   // site.js has already made it a WhatsApp link
    ask.firstChild.textContent = `Ask about ${title} `;
    out.replaceChildren(line, ask);
    if (row.scrollWidth > row.clientWidth + 4) {                // phones: slide the carousel to it
      row.scrollTo({ left: card.offsetLeft - (row.clientWidth - card.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
    }
  }));

  // mouse: cards lean towards the pointer and a soft light follows it
  if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    picks.forEach(p => {
      p.addEventListener('pointermove', e => {
        const r = p.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        p.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
        p.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
        p.style.transform = `perspective(900px) rotateX(${((.5 - y) * 6).toFixed(2)}deg) rotateY(${((x - .5) * 6).toFixed(2)}deg) translateY(-4px)`;
      });
      p.addEventListener('pointerleave', () => { p.style.transform = ''; });
    });
  }

  // phones: dots show which card is in view
  const dots = [...document.querySelectorAll('.picks__dots i')];
  let queued = false;
  const sync = () => {
    queued = false;
    const mid = row.scrollLeft + row.clientWidth / 2;
    let best = 0, dist = Infinity;
    picks.forEach((p, i) => { const d = Math.abs(p.offsetLeft + p.offsetWidth / 2 - mid); if (d < dist) { dist = d; best = i; } });
    dots.forEach((d, i) => d.classList.toggle('on', i === best));
  };
  row.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(sync); } }, { passive: true });
})();
