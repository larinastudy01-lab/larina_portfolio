(() => {
  'use strict';
  const avatar = document.querySelector('#intro-enter');
  if (!avatar) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pointer = null;
  let dragged = false;
  let suppressClick = false;
  let entering = false;
  let frame = 0;

  function resetPose() {
    window.cancelAnimationFrame(frame);
    frame = 0;
    avatar.classList.remove('is-dragging');
    ['--avatar-x', '--avatar-y', '--avatar-turn'].forEach(name => avatar.style.removeProperty(name));
  }
  function releasePointer() {
    if (pointer && avatar.hasPointerCapture(pointer.id)) avatar.releasePointerCapture(pointer.id);
    pointer = null;
    resetPose();
  }
  avatar.addEventListener('dragstart', event => event.preventDefault());
  avatar.addEventListener('pointerdown', event => {
    if (entering || reducedMotion.matches || event.button !== 0 || !event.isPrimary) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    dragged = false;
    suppressClick = false;
  });
  avatar.addEventListener('pointermove', event => {
    if (reducedMotion.matches || entering) return;
    let x = 0;
    let y = 0;
    let turn = -3;
    if (pointer?.id === event.pointerId) {
      const dx = event.clientX - pointer.x;
      const dy = event.clientY - pointer.y;
      if (!dragged && Math.hypot(dx, dy) < 9) return;
      dragged = true;
      avatar.setPointerCapture(event.pointerId);
      avatar.classList.add('is-dragging');
      x = Math.max(-90, Math.min(90, dx * .6));
      y = Math.max(-70, Math.min(70, dy * .6));
      turn = Math.max(-15, Math.min(12, dx * .08 - 3));
    } else {
      if (event.pointerType !== 'mouse') return;
      const bounds = avatar.getBoundingClientRect();
      turn = (event.clientX - bounds.left) / bounds.width * 8 - 7;
    }
    window.cancelAnimationFrame(frame);
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      avatar.style.setProperty('--avatar-x', `${x}px`);
      avatar.style.setProperty('--avatar-y', `${y}px`);
      avatar.style.setProperty('--avatar-turn', `${turn}deg`);
    });
  }, { passive: true });
  avatar.addEventListener('pointerup', event => {
    if (pointer?.id !== event.pointerId) return;
    suppressClick = dragged;
    releasePointer();
  });
  avatar.addEventListener('pointercancel', () => { suppressClick = false; releasePointer(); });
  avatar.addEventListener('lostpointercapture', () => { if (pointer) releasePointer(); });
  avatar.addEventListener('pointerleave', () => { if (!pointer) resetPose(); });
  avatar.addEventListener('blur', () => { if (!entering) releasePointer(); });

  avatar.addEventListener('click', event => {
    // Preserve native new-tab clicks and keyboard navigation.
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    if (suppressClick && event.detail !== 0) {
      event.preventDefault();
      suppressClick = false;
      return;
    }
    if (entering) { event.preventDefault(); return; }
  });
  window.addEventListener('portfolio:navigation', () => {
    releasePointer();
    entering = true;
    document.body.classList.add('is-entering');
    avatar.setAttribute('aria-busy', 'true');
  });
  reducedMotion.addEventListener('change', () => {
    releasePointer();
  });
  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('is-paused', document.hidden);
    if (document.hidden) releasePointer();
  });
  window.addEventListener('pageshow', () => {
    // Restore the entrance after browser Back, including back-forward cache restores.
    entering = false;
    suppressClick = false;
    releasePointer();
    document.body.classList.remove('is-entering');
    document.body.classList.toggle('is-paused', document.hidden);
    avatar.removeAttribute('aria-busy');
  });
})();
