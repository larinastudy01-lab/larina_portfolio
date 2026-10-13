(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const surfaces = [...document.querySelectorAll('[data-depth]')];
  const states = new Map();
  const properties = ['--depth-rx', '--depth-ry', '--depth-light-x', '--depth-light-y'];
  const enabled = () => !reducedMotion.matches && finePointer.matches && !document.hidden;
  const clamp = value => Math.min(1, Math.max(0, value));

  function reset(surface) {
    const state = states.get(surface);
    window.cancelAnimationFrame(state.frame);
    state.frame = 0;
    state.bounds = null;
    surface.classList.remove('is-depth-hover');
    properties.forEach(property => surface.style.removeProperty(property));
  }

  surfaces.forEach(surface => {
    const state = { frame: 0, bounds: null, x: 0, y: 0 };
    states.set(surface, state);
    surface.addEventListener('pointermove', event => {
      if (!enabled() || event.pointerType === 'touch') return;
      state.x = event.clientX;
      state.y = event.clientY;
      if (state.frame) return;
      state.frame = window.requestAnimationFrame(() => {
        state.frame = 0;
        if (!enabled() || !surface.isConnected) return;
        state.bounds ||= surface.getBoundingClientRect();
        const bounds = state.bounds;
        if (!bounds.width || !bounds.height) return;
        const x = clamp((state.x - bounds.left) / bounds.width);
        const y = clamp((state.y - bounds.top) / bounds.height);
        const record = surface.dataset.depth === 'record';
        surface.style.setProperty('--depth-rx', `${((.5 - y) * (record ? 24 : 10)).toFixed(2)}deg`);
        surface.style.setProperty('--depth-ry', `${((x - .5) * (record ? 30 : 12)).toFixed(2)}deg`);
        surface.style.setProperty('--depth-light-x', `${(x * 100).toFixed(1)}%`);
        surface.style.setProperty('--depth-light-y', `${(y * 100).toFixed(1)}%`);
        surface.classList.add('is-depth-hover');
      });
    }, { passive: true });
    surface.addEventListener('pointerleave', () => reset(surface));
    surface.addEventListener('pointercancel', () => reset(surface));
    const focusTarget = surface.closest('.project-link') || surface;
    focusTarget.addEventListener('focus', () => reset(surface));
    focusTarget.addEventListener('blur', () => reset(surface));
  });

  const resetAll = () => surfaces.forEach(reset);
  function sync() {
    resetAll();
    surfaces.forEach(surface => surface.classList.toggle('depth-active', enabled()));
  }
  reducedMotion.addEventListener('change', sync);
  finePointer.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', resetAll);
  window.addEventListener('pageshow', sync);
  window.addEventListener('resize', resetAll, { passive: true });
  window.addEventListener('scroll', () => {
    // Scrolling invalidates geometry without bouncing the lifted surface back.
    states.forEach(state => { state.bounds = null; });
  }, { passive: true });
  window.addEventListener('portfolio:language', resetAll);
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', resetAll));
  sync();
})();
