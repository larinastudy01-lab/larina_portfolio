(() => {
  'use strict';

  // Native animations also work offline. Content stays visible before observers run.
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const root = document.documentElement;
  const activeAnimations = new Set();
  let cleanup = () => {};

  function animate(element, frames, options = {}) {
    if (!element?.animate || reducedMotion.matches || document.hidden) return;
    const animation = element.animate(frames, {
      duration: 650, easing: 'cubic-bezier(.22, 1, .36, 1)', ...options
    });
    activeAnimations.add(animation);
    const release = () => activeAnimations.delete(animation);
    animation.addEventListener('finish', release, { once: true });
    animation.addEventListener('cancel', release, { once: true });
    return animation;
  }

  function enter(element, delay = 0, distance = 22) {
    if (element?.hasAttribute('data-depth-reveal') && finePointer.matches) {
      // Individual transforms leave pointer-driven tilt free to run independently.
      return animate(element, [
        { opacity: 0, translate: `0 ${distance + 10}px -45px`, rotate: 'x 12deg' },
        { opacity: 1, translate: '0 0 0', rotate: 'x 0deg' }
      ], { delay, duration: 850, fill: 'backwards' });
    }
    return animate(element, [
      { opacity: 0, transform: `translateY(${distance}px)` },
      { opacity: 1, transform: 'translateY(0)' }
    ], { delay, fill: 'backwards' });
  }

  function enableMotion() {
    root.classList.add('motion-ready');
    const disposers = [];
    const offset = window.innerWidth < 600 ? 14 : 24;
    const hero = document.querySelector('.hero');
    const scene = document.querySelector('.hero-diagram');
    document.querySelectorAll('.hero-enter').forEach((element, index) => enter(element, index * 85, offset));
    document.querySelectorAll('.diagram-node').forEach((element, index) => {
      element.style.setProperty('--node-delay', `${index * 2.5}s`);
      enter(element, 200 + index * 130, 16);
    });
    animate(document.querySelector('.hello-star'), [
      { opacity: 0, transform: 'rotate(-70deg) scale(.7)' },
      { opacity: 1, transform: 'rotate(0) scale(1)' }
    ], { delay: 250, duration: 1100, fill: 'backwards' });

    const targets = new Set(document.querySelectorAll([
      '.reveal', '.section-heading', '.page-hero > :not(.data-flow)',
      '.section > .eyebrow', '.section > h2', '.section > .lead',
      '.process-section h2', '.contact-cta .eyebrow', '.contact-cta .cta-row',
      '.conference-photo', '.score-dimensions .tag'
    ].join(', ')));
    const delays = new WeakMap();
    document.querySelectorAll('.research-grid, .project-grid, .question-list, .score-dimensions, .conference-gallery').forEach(group => {
      [...group.children].forEach((element, index) => delays.set(element, (index % 4) * 75));
    });
    const flows = [...document.querySelectorAll('.data-flow')];
    flows.forEach(flow => {
      flow.classList.add('motion-flow');
      [...flow.children].forEach((item, index) => item.style.setProperty('--flow-delay', `${index * 100}ms`));
    });
    const revealFlow = flow => {
      flow.classList.add('is-flow-visible');
      [...flow.children].forEach((item, index) => enter(item, index * 100, 10));
    };
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          if (entry.target.matches('.data-flow')) revealFlow(entry.target);
          else enter(entry.target, delays.get(entry.target) || 0, offset);
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -24px 0px', threshold: 0 });
      targets.forEach(element => observer.observe(element));
      flows.forEach(element => observer.observe(element));
      disposers.push(() => observer.disconnect());
      if (scene) {
        const sceneObserver = new IntersectionObserver(entries => {
          const visible = entries[0].isIntersecting;
          scene.classList.toggle('is-motion-visible', visible);
          hero?.classList.toggle('is-motion-visible', visible);
        });
        sceneObserver.observe(scene);
        disposers.push(() => sceneObserver.disconnect());
      }
    } else {
      flows.forEach(flow => flow.classList.add('is-flow-visible'));
      scene?.classList.add('is-motion-visible');
      hero?.classList.add('is-motion-visible');
    }

    // Read geometry together, then draw scroll progress in a single animation frame.
    const paths = [...document.querySelectorAll('.draw-path')].map(element => ({
      element, trigger: element.closest('.trend-figure') || element.closest('section'),
      length: element.getTotalLength()
    }));
    const tracks = [...document.querySelectorAll('.timeline-track')].map(element => ({
      element, trigger: element.parentElement
    }));
    const scrollItems = [...paths, ...tracks];
    paths.forEach(({ element, length }) => { element.style.strokeDasharray = String(length); });
    let scrollFrame = 0;
    function updateScroll() {
      scrollFrame = 0;
      if (document.hidden) return;
      const height = window.innerHeight;
      const positions = scrollItems.map(item => {
        const bounds = item.trigger.getBoundingClientRect();
        const distance = Math.max(bounds.height - height * .3, height * .25);
        return Math.min(1, Math.max(0, (height * .8 - bounds.top) / distance));
      });
      scrollItems.forEach((item, index) => {
        if (item.length !== undefined) item.element.style.strokeDashoffset = String(item.length * (1 - positions[index]));
        else item.element.style.transform = `scaleY(${positions[index]})`;
      });
    }
    function queueScroll() {
      if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScroll);
    }
    if (scrollItems.length) {
      window.addEventListener('scroll', queueScroll, { passive: true });
      window.addEventListener('resize', queueScroll);
      window.addEventListener('portfolio:language', queueScroll);
      document.addEventListener('toggle', queueScroll, true);
      document.addEventListener('visibilitychange', queueScroll);
      const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(queueScroll) : null;
      resizeObserver?.observe(document.querySelector('main'));
      queueScroll();
      disposers.push(() => {
        window.cancelAnimationFrame(scrollFrame);
        window.removeEventListener('scroll', queueScroll);
        window.removeEventListener('resize', queueScroll);
        window.removeEventListener('portfolio:language', queueScroll);
        document.removeEventListener('toggle', queueScroll, true);
        document.removeEventListener('visibilitychange', queueScroll);
        resizeObserver?.disconnect();
        paths.forEach(({ element }) => {
          element.style.removeProperty('stroke-dasharray');
          element.style.removeProperty('stroke-dashoffset');
        });
        tracks.forEach(({ element }) => element.style.removeProperty('transform'));
      });
    }

    // Pointer drift is small, contained in the diagram, and disabled for touch input.
    if (scene) {
      let pointerFrame = 0;
      let pointerX = 0;
      let pointerY = 0;
      const move = event => {
        if (!finePointer.matches || event.pointerType === 'touch' || document.hidden) return;
        const bounds = scene.getBoundingClientRect();
        pointerX = Math.max(-5, Math.min(5, ((event.clientX - bounds.left) / bounds.width - .5) * 10));
        pointerY = Math.max(-5, Math.min(5, ((event.clientY - bounds.top) / bounds.height - .5) * 10));
        if (!pointerFrame) pointerFrame = window.requestAnimationFrame(() => {
          pointerFrame = 0;
          scene.style.setProperty('--diagram-x', `${pointerX}px`);
          scene.style.setProperty('--diagram-y', `${pointerY}px`);
          scene.style.setProperty('--diagram-rx', `${-pointerY * .65}deg`);
          scene.style.setProperty('--diagram-ry', `${pointerX * .8}deg`);
        });
      };
      const reset = () => {
        window.cancelAnimationFrame(pointerFrame);
        pointerFrame = 0;
        scene.style.removeProperty('--diagram-x');
        scene.style.removeProperty('--diagram-y');
        scene.style.removeProperty('--diagram-rx');
        scene.style.removeProperty('--diagram-ry');
      };
      scene.addEventListener('pointermove', move, { passive: true });
      scene.addEventListener('pointerleave', reset);
      finePointer.addEventListener('change', reset);
      disposers.push(() => {
        scene.removeEventListener('pointermove', move);
        scene.removeEventListener('pointerleave', reset);
        finePointer.removeEventListener('change', reset);
        reset();
        scene.classList.remove('is-motion-visible');
        hero?.classList.remove('is-motion-visible');
      });
    }
    document.querySelectorAll('.research-detail, .paper-preview').forEach(panel => {
      let animation;
      const toggle = () => {
        animation?.cancel();
        if (panel.open) animation = enter(panel.querySelector('.research-body, iframe'), 0, 8);
      };
      panel.addEventListener('toggle', toggle);
      disposers.push(() => panel.removeEventListener('toggle', toggle));
    });
    document.querySelectorAll('[data-reflection]').forEach(button => {
      const reflect = () => {
        const result = document.querySelector('.reflection-result');
        (result?.getAnimations?.() || []).forEach(animation => animation.cancel());
        enter(result, 0, 8);
      };
      button.addEventListener('click', reflect);
      disposers.push(() => button.removeEventListener('click', reflect));
    });
    cleanup = () => {
      disposers.forEach(dispose => dispose());
      activeAnimations.forEach(animation => animation.cancel());
      activeAnimations.clear();
      root.classList.remove('motion-ready');
      flows.forEach(flow => flow.classList.remove('motion-flow', 'is-flow-visible'));
    };
  }
  function syncMotion() {
    cleanup();
    cleanup = () => {};
    if (!reducedMotion.matches) enableMotion();
  }
  function syncVisibility() {
    root.classList.toggle('motion-paused', document.hidden);
    if (document.hidden) activeAnimations.forEach(animation => animation.finish());
  }
  reducedMotion.addEventListener('change', syncMotion);
  document.addEventListener('visibilitychange', syncVisibility);
  syncVisibility();
  syncMotion();
})();
