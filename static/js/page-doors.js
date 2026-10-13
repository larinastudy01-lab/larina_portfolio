(() => {
  'use strict';
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const supported = typeof Element.prototype.animate === 'function';
  const siteRoot = document.querySelector('meta[name="site-root"]')?.content || '/';
  const pageRoute = /^\/(?:home|about|research|projects(?:\/[^/]+)?|publications|journey|contact)?\/?$/;
  let animations = [];
  let timer = 0;
  let sequence = 0;
  let destination = null;
  let assigned = false;

  function cancelAnimations() {
    animations.forEach(animation => animation.cancel());
    animations = [];
  }
  function reset() {
    sequence += 1;
    window.clearTimeout(timer);
    cancelAnimations();
    root.classList.remove('doors-covered', 'doors-moving', 'doors-leaving');
    destination = null;
    assigned = false;
  }
  function finishNavigation() {
    if (!destination || assigned) return;
    assigned = true;
    window.clearTimeout(timer);
    window.location.assign(destination);
  }
  async function openDoors() {
    if (!root.classList.contains('doors-covered')) return;
    const token = ++sequence;
    const panels = [...document.querySelectorAll('.page-door')];
    if (panels.length !== 2 || reducedMotion.matches || document.hidden) { reset(); return; }
    // Give the supplied flower handles time to decode before revealing the page.
    const images = [...document.querySelectorAll('.page-door-handle img')];
    await Promise.race([
      Promise.allSettled(images.map(img => img.decode?.())),
      new Promise(resolve => window.setTimeout(resolve, 250))
    ]);
    if (token !== sequence || destination) return;
    window.clearTimeout(timer);
    root.classList.add('doors-moving');
    animations = panels.map((panel, index) => panel.animate([
      { transform: 'translateX(0)' },
      { transform: `translateX(${index === 0 ? '-102%' : '102%'})` }
    ], { duration: 760, delay: 100, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'forwards' }));
    Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
      if (token === sequence) reset();
    });
    timer = window.setTimeout(() => { if (token === sequence) reset(); }, 1200);
  }
  function closeDoors(url) {
    const panels = [...document.querySelectorAll('.page-door')];
    if (panels.length !== 2) { window.location.assign(url); return; }
    sequence += 1;
    window.clearTimeout(timer);
    const starts = panels.map(panel => getComputedStyle(panel).transform);
    cancelAnimations();
    destination = url;
    root.classList.remove('doors-covered');
    root.classList.add('doors-moving', 'doors-leaving');
    window.dispatchEvent(new CustomEvent('portfolio:navigation'));
    animations = panels.map((panel, index) => panel.animate([
      { transform: starts[index] }, { transform: 'translateX(0)' }
    ], { duration: 300, easing: 'cubic-bezier(.65, 0, .35, 1)', fill: 'forwards' }));
    Promise.allSettled(animations.map(animation => animation.finished)).then(finishNavigation);
    timer = window.setTimeout(finishNavigation, 420);
  }

  // This script runs in the head, so the new page never flashes before the doors open.
  if (supported && !reducedMotion.matches) {
    root.classList.add('doors-covered');
    timer = window.setTimeout(reset, 2500);
  }
  document.addEventListener('DOMContentLoaded', openDoors, { once: true });
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || !url.pathname.startsWith(siteRoot)) return;
    const route = '/' + url.pathname.slice(siteRoot.length);
    if (!pageRoute.test(route)) return;
    if (url.pathname === window.location.pathname && url.search === window.location.search) return;
    if (!supported || reducedMotion.matches) return;
    event.preventDefault();
    if (!destination) closeDoors(url.href);
  });
  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return;
    if (destination) finishNavigation();
    else reset();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    if (destination) finishNavigation();
    else reset();
  });
  window.addEventListener('pagehide', reset);
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    reset();
    if (supported && !reducedMotion.matches) {
      root.classList.add('doors-covered');
      openDoors();
    }
  });
})();
