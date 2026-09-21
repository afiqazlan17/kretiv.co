// KretivPrint hero: products drift with the pointer and scroll (depth = how much each moves).
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const items = [...document.querySelectorAll('.fl')];
  let mx = 0, my = 0, x = 0, y = 0;
  addEventListener('pointermove', e => {
    mx = e.clientX / innerWidth - .5;
    my = e.clientY / innerHeight - .5;
  }, { passive: true });
  (function loop() {
    x += (mx - x) * .06;
    y += (my - y) * .06;
    const s = Math.min(scrollY, innerHeight);
    items.forEach(el => {
      const d = +el.dataset.depth;
      el.style.transform = `translate3d(${x * d * 50}px, ${y * d * 34 - s * d * .18}px, 0)`;
    });
    requestAnimationFrame(loop);
  })();
})();
