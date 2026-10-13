(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const buttons = [...document.querySelectorAll('[data-magnetic]')];
  const frames = new Map();

  function reset(button) {
    window.cancelAnimationFrame(frames.get(button));
    frames.delete(button);
    button.style.removeProperty('--magnet-x');
    button.style.removeProperty('--magnet-y');
  }
  const resetAll = () => buttons.forEach(reset);
  buttons.forEach(button => {
    button.addEventListener('pointermove', event => {
      if (reducedMotion.matches || !finePointer.matches || event.pointerType === 'touch') return;
      const bounds = button.getBoundingClientRect();
      const x = Math.max(-5, Math.min(5, (event.clientX - bounds.left - bounds.width / 2) * .08));
      const y = Math.max(-4, Math.min(4, (event.clientY - bounds.top - bounds.height / 2) * .12));
      window.cancelAnimationFrame(frames.get(button));
      frames.set(button, window.requestAnimationFrame(() => {
        frames.delete(button);
        button.style.setProperty('--magnet-x', `${x}px`);
        button.style.setProperty('--magnet-y', `${y}px`);
      }));
    }, { passive: true });
    button.addEventListener('pointerleave', () => reset(button));
    button.addEventListener('blur', () => reset(button));
    button.addEventListener('focus', () => reset(button));
  });
  finePointer.addEventListener('change', resetAll);
  reducedMotion.addEventListener('change', resetAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) resetAll(); });
})();
