// Home: the finished K comes apart into its four layers as the visitor scrolls, one layer per
// department, then closes back into one piece.
//   hero  → the whole K, lit, swaying gently
//   Print → the layers pull apart along Z; the pink frame (with its extrusion) is in focus
//   Tech  → the gold fill comes forward
//   Brand → the bulb + brush detail comes forward and is traced in gold
//   Event → the light swells and the K glows
//   Done  → the layers close back together
// It sweeps from a left three-quarter view to a right one, so it never shows its back.

(() => {
  const stage = document.querySelector('.stage');
  const kbox = stage.querySelector('.kbox');
  const k3d = stage.querySelector('.k3d');
  const depth = k3d.querySelector('.kdepth');
  const layers = ['frame', 'fill', 'light', 'det'].map(n => k3d.querySelector('.k--' + n)); // back to front
  const detLine = k3d.querySelector('.k-detline');
  const hudPct = document.getElementById('hud-pct');
  const hudPhase = document.getElementById('hud-phase');
  const chapters = [...document.querySelectorAll('.chapter')];
  const layered = chapters.filter(c => c.dataset.layer !== undefined);
  const steps = [...document.querySelectorAll('.steps a')];
  const stepsNav = document.querySelector('.steps');
  const build = document.getElementById('build');
  const inners = [...document.querySelectorAll('.chapter__inner')];

  // department (Print, Tech, Brand, Event) → the layer it brings forward
  const LAYER_OF = [0, 1, 3, 2];

  const detLen = detLine.getTotalLength();
  detLine.style.strokeDasharray = detLen;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const lerp = (a, b, x) => a + (b - a) * x;

  function progress(el, i) {
    const r = el.getBoundingClientRect();
    const v = innerHeight;
    if (i === 4) return clamp((v * 0.9 - r.top) / (v * 0.45));
    // starts when the chapter top reaches 65% of the screen, ends when its bottom passes 55%
    return clamp((v * 0.65 - r.top) / (r.height + v * 0.1));
  }

  // Scroll sets targets; the frame loop eases towards them so wheel steps don't jolt the layers.
  // J runs from -0.5 (hero) through 0..3 (the middle of each department) to 3.5; D is the closing.
  let tJ = -0.5, tD = 0, J = -0.5, D = 0, gap = 60, lastPhase = '';

  function tick() {
    const p = layered.map(progress);
    tJ = p[0] + p[1] + p[2] + p[3] - 0.5;
    tD = p[4];
    steps.forEach((s, i) => s.style.setProperty('--p', p[i]));
    stage.classList.toggle('is-done', p[4] > 0.35);

    // current chapter = last one whose top passed the middle of the screen
    const mid = innerHeight * 0.5;
    let cur = chapters[0];
    for (const c of chapters) if (c.getBoundingClientRect().top < mid) cur = c;
    const layer = cur.dataset.layer === undefined ? -1 : +cur.dataset.layer;
    if (cur.dataset.phase !== lastPhase) {
      lastPhase = cur.dataset.phase;
      hudPhase.textContent = lastPhase;
      hudPct.textContent = layer >= 0 && layer <= 3 ? '0' + (layer + 1) : '04';
    }
    // dim the K whenever any chapter's text or buttons sit on top of it — on phones they scroll
    // over it, including the stretch where one chapter's buttons are still up while the next begins
    const k = kbox.getBoundingClientRect();
    stage.classList.toggle('is-dim', inners.some(el => {
      const r = el.getBoundingClientRect();
      return r.bottom > k.top + 12 && r.top < k.bottom - 12 && r.right > k.left + 12 && r.left < k.right - 12;
    }));
    steps.forEach((s, i) => s.classList.toggle('is-active', i === layer));

    const b = build.getBoundingClientRect();
    stepsNav.classList.toggle('is-visible', scrollY > innerHeight * 0.45 && b.bottom > innerHeight * 0.9 && layer !== 4);
  }

  // lay the layers out for a given J and D
  let drawnJ = NaN, drawnD = NaN, ex = 0, glowCss = '';
  function place() {
    if (Math.abs(J - drawnJ) < 1e-4 && Math.abs(D - drawnD) < 1e-4) return;
    drawnJ = J; drawnD = D;
    const closing = 1 - smooth(0.05, 0.6, D);
    ex = smooth(-0.45, -0.05, J) * closing;                               // how far apart the layers are
    const dept = [0, 1, 2, 3].map(i => clamp(1.5 - 2 * Math.abs(J - i)) * closing); // focus, crossfading
    const act = [0, 0, 0, 0];
    dept.forEach((a, i) => { act[LAYER_OF[i]] = a; });
    const light = dept[3];
    // a layer in front of the one in focus is in the way, so it nearly vanishes (half, for the
    // thin bulb outline while the lights are on); one behind it is the backdrop, so it stays
    const inFront = 0.86 - 0.36 * light, behind = 0.25;
    const z0 = -1.5 * gap * ex;               // keeps the stack centred on the axis it turns around

    const zFrame = z0 + 0.6 * gap * act[0] * ex;   // the frame moves with its extrusion
    depth.style.transform = `translateZ(${zFrame.toFixed(1)}px)`;
    layers.forEach((el, i) => {
      const z = i ? z0 + gap * ex * (i + 0.6 * act[i]) : zFrame;
      const s = i === 2 ? 1 + 0.35 * light : 1 + 0.03 * act[i] * ex;
      el.style.transform = `translateZ(${z.toFixed(1)}px) scale(${s.toFixed(4)})`;
      if (i) {
        let focusBehind = 0, focusAhead = 0;
        act.forEach((a, j) => { if (j < i) focusBehind += a; else if (j > i) focusAhead += a; });
        el.style.opacity = clamp(1 - ex * (focusBehind * inFront + focusAhead * behind), 0.1).toFixed(3);
      }
    });

    detLine.style.strokeDashoffset = detLen * (1 - dept[2]);
    detLine.style.opacity = dept[2];

    const glow = light * ex;
    const css = glow > 0.02 ? `drop-shadow(0 0 ${Math.round(glow * 70)}px rgba(252, 176, 60, ${(glow * 0.5).toFixed(2)}))` : '';
    if (css !== glowCss) { kbox.style.filter = css; glowCss = css; }
  }

  const turnCss = (rx, ry) => `perspective(1800px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    place();
    k3d.style.transform = turnCss(6, -14);
    addEventListener('scroll', tick, { passive: true });
    tick();
    return;
  }

  const measure = () => { gap = kbox.clientWidth * 0.15; drawnJ = NaN; };
  let queued = false;
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; tick(); }); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { measure(); onScroll(); });
  measure(); tick();

  // turn — also leans towards the pointer
  let mx = 0, my = 0, sx = 0, sy = 0, ry = -18, rx = 8;
  addEventListener('pointermove', e => {
    mx = e.clientX / innerWidth - .5;
    my = e.clientY / innerHeight - .5;
  }, { passive: true });
  function frame(t) {
    J += (tJ - J) * .12; if (Math.abs(tJ - J) < 1e-4) J = tJ;
    D += (tD - D) * .12; if (Math.abs(tD - D) < 1e-4) D = tD;
    sx += (mx - sx) * .05;
    sy += (my - sy) * .05;
    place();

    const d = smooth(0.05, 0.7, D);
    const idle = 1 - ex;                                          // sways only while assembled
    const turn = -18 - 22 * smooth(-0.5, 0, J) + 74 * smooth(0, 3.4, J); // left ¾ view → right ¾ view
    const tRy = lerp(turn, -10, d) + Math.sin(t / 1400) * 7 * idle + sx * 14;
    const tRx = 8 + 6 * ex - 2 * d - sy * 8;
    ry += (tRy - ry) * .08;
    rx += (tRx - rx) * .08;
    k3d.style.transform = turnCss(rx, ry);

    // sleep once still (the sway keeps it awake while assembled); scroll/pointer wakes it
    const still = J === tJ && D === tD && Math.abs(tRy - ry) < .05 && Math.abs(tRx - rx) < .05
      && Math.abs(mx - sx) < .002 && Math.abs(my - sy) < .002 && idle < .01;
    if (still || !stageOnScreen) { running = false; return; }
    requestAnimationFrame(frame);
  }
  let running = false, stageOnScreen = true;
  function wake() { if (!running) { running = true; requestAnimationFrame(frame); } }
  new IntersectionObserver(([e]) => { stageOnScreen = e.isIntersecting; if (stageOnScreen) wake(); }).observe(build);
  addEventListener('scroll', wake, { passive: true });
  addEventListener('pointermove', wake, { passive: true });
  wake();
})();
