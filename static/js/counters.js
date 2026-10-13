(() => {
  'use strict';
  const elements = [...document.querySelectorAll('[data-count]')];
  if (!elements.length) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const completed = new WeakSet();
  const running = new Map();
  let observer;
  function finish(element) {
    window.cancelAnimationFrame(running.get(element));
    running.delete(element);
    element.textContent = element.dataset.count;
    completed.add(element);
  }
  function count(element) {
    if (completed.has(element)) return;
    const target = Number(element.dataset.count);
    if (!Number.isFinite(target)) return;
    if (document.hidden || reducedMotion.matches) { finish(element); return; }
    const start = performance.now();
    function frame(now) {
      const progress = Math.min(1, (now - start) / 1400);
      element.textContent = String(Math.round(target * (1 - (1 - progress) ** 3)));
      if (progress < 1) running.set(element, window.requestAnimationFrame(frame));
      else finish(element);
    }
    running.set(element, window.requestAnimationFrame(frame));
  }
  function syncMotion() {
    observer?.disconnect();
    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      elements.forEach(finish);
      return;
    }
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        count(entry.target);
      });
    }, { threshold: .2 });
    elements.filter(element => !completed.has(element)).forEach(element => observer.observe(element));
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) [...running.keys()].forEach(finish);
  });
  reducedMotion.addEventListener('change', syncMotion);
  syncMotion();
})();
