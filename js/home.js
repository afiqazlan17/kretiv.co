// Home: build the K as the visitor scrolls through the three divisions.
//   layer 0 — Print → pink frame rises from the foundation
//   layer 1 — Work  → gold fill pours in
//   layer 2 — Tech  → the bulb + brush detail is drawn, then lit
//   layer 3 — Done  → blueprint falls away, K glows

(() => {
  const stage = document.querySelector('.stage');
  const svg = stage.querySelector('.k');
  const [vx, vy, vw, vh] = svg.dataset.vb.split(' ').map(Number);
  const clipFrame = svg.querySelector('#clip-frame rect');
  const clipFill = svg.querySelector('#clip-fill rect');
  const detLine = svg.querySelector('.k-detline');
  const det = svg.querySelector('.k-det');
  const front = svg.querySelector('.k-front');
  const hudPct = document.getElementById('hud-pct');
  const hudPhase = document.getElementById('hud-phase');
  const chapters = [...document.querySelectorAll('.chapter')];
  const layered = chapters.filter(c => c.dataset.layer !== undefined);
  const steps = [...document.querySelectorAll('.steps a')];
  const stepsNav = document.querySelector('.steps');
  const build = document.getElementById('build');
  const kbox = stage.querySelector('.kbox');
  const k3d = stage.querySelector('.k3d');

  const BASE = 0.08; // the foundation is already poured when you arrive
  const detLen = detLine.getTotalLength();
  detLine.style.strokeDasharray = detLen;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };

  function rise(rect, f) {
    const h = vh * f;
    rect.setAttribute('y', vy + vh - h);
    rect.setAttribute('height', h);
    return vy + vh - h;
  }

  function progress(el, i) {
    const r = el.getBoundingClientRect();
    const v = innerHeight;
    if (i === 3) return clamp((v * 0.9 - r.top) / (v * 0.45));
    // starts when the chapter top reaches 65% of the screen, ends when its bottom passes 55%
    return clamp((v * 0.65 - r.top) / (r.height + v * 0.1));
  }

  let last = '';
  let total = 0, done = 0;
  function render(p) {
    const [fPrint, fWork, fTech, fDone] = p;

    const frame = BASE + (1 - BASE) * fPrint;
    const yFrame = rise(clipFrame, frame);
    kbox.style.setProperty('--frame', frame);
    const yFill = rise(clipFill, fWork);

    detLine.style.strokeDashoffset = detLen * (1 - smooth(0, 0.75, fTech));
    detLine.style.opacity = 1 - smooth(0.8, 1, fTech);
    det.style.opacity = smooth(0.5, 1, fTech);

    // gold "construction front" follows whichever layer is rising
    let y = null;
    if (frame < 1) y = yFrame;
    else if (fWork > 0 && fWork < 1) y = yFill;
    front.classList.toggle('is-on', y !== null);
    if (y !== null) { front.setAttribute('y1', y); front.setAttribute('y2', y); }

    total = (frame + fWork + fTech) / 3;
    done = fDone;
    const pct = Math.round(100 * (frame * 0.34 + fWork * 0.33 + fTech * 0.33));
    hudPct.textContent = pct;
    stage.classList.toggle('is-done', fDone > 0.35);

    steps.forEach((s, i) => s.style.setProperty('--p', p[i]));
  }

  // spin progress: from the very first scroll to the moment the frame is complete (end of Print)
  const printEl = document.getElementById('print');
  let spinP = 0;

  function tick() {
    const p = layered.map(progress);
    render(p);
    const endY = printEl.offsetTop + printEl.offsetHeight - innerHeight * 0.55;
    spinP = clamp(scrollY / endY);

    // current chapter = last one whose top passed the middle of the screen
    const mid = innerHeight * 0.5;
    let cur = chapters[0];
    for (const c of chapters) if (c.getBoundingClientRect().top < mid) cur = c;
    const phase = cur.dataset.phase;
    if (phase !== last) { hudPhase.textContent = phase; last = phase; }
    const layer = cur.dataset.layer === undefined ? -1 : +cur.dataset.layer;
    // dim the K only once the chapter's text has scrolled up over it (matters on phones)
    const textTop = cur.querySelector('.chapter__inner').getBoundingClientRect().top;
    stage.classList.toggle('is-dim', layer >= 0 && layer <= 2 && textTop < innerHeight * 0.5);
    steps.forEach((s, i) => s.classList.toggle('is-active', i === layer));

    const b = build.getBoundingClientRect();
    stepsNav.classList.toggle('is-visible', scrollY > innerHeight * 0.45 && b.bottom > innerHeight * 0.9 && layer !== 3);
  }

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    render([1, 1, 1, 1]);
    k3d.style.setProperty('--ry', '-14deg');
    k3d.style.setProperty('--rx', '6deg');
    hudPhase.textContent = 'Complete';
    addEventListener('scroll', () => {
      const b = build.getBoundingClientRect();
      stepsNav.classList.toggle('is-visible', scrollY > innerHeight * 0.45 && b.bottom > innerHeight);
    }, { passive: true });
    return;
  }

  let queued = false;
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; tick(); }); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  tick();

  // 3D turn — see comments inside; also leans towards the pointer.
  let mx = 0, my = 0, sx = 0, sy = 0, ry = -32, rx = 10;
  addEventListener('pointermove', e => {
    mx = e.clientX / innerWidth - .5;
    my = e.clientY / innerHeight - .5;
  }, { passive: true });
  function spin(t) {
    sx += (mx - sx) * .05;
    sy += (my - sy) * .05;
    const sway = Math.sin(t / 2600) * 4 * done;
    // Print (frame rising): one full 360° turn, landing face-on just as the gold fill starts.
    // Work + Tech: hold facing the visitor with a gentle swing, so the fill and detail are seen.
    const FRAME_END = 0.34;
    const ease = 0.65 * spinP + 0.35 * smooth(0, 1, spinP); // mostly even speed, soft start/finish
    const turn = -30 + 370 * ease;
    const hold = total > FRAME_END ? 7 * Math.sin((total - FRAME_END) / (1 - FRAME_END) * Math.PI * 2) : 0;
    const tRy = turn + hold + sway + sx * 18;
    const tRx = 12 - 4 * total - sy * 10;
    ry += (tRy - ry) * .06;
    rx += (tRx - rx) * .08;
    k3d.style.setProperty('--ry', ry.toFixed(2) + 'deg');
    k3d.style.setProperty('--rx', rx.toFixed(2) + 'deg');
    // sleep once the K has settled; scroll/pointer wakes it (saves battery on phones)
    const settled = Math.abs(tRy - ry) < .05 && Math.abs(tRx - rx) < .05 && Math.abs(mx - sx) < .002 && Math.abs(my - sy) < .002 && done < .35;
    if (settled || !stageOnScreen) { spinning = false; return; }
    requestAnimationFrame(spin);
  }
  let spinning = false, stageOnScreen = true;
  new IntersectionObserver(([e]) => { stageOnScreen = e.isIntersecting; if (stageOnScreen) wake(); }).observe(build);
  function wake() { if (!spinning) { spinning = true; requestAnimationFrame(spin); } }
  addEventListener('scroll', wake, { passive: true });
  addEventListener('pointermove', wake, { passive: true });
  wake();
})();
