(() => {
  document.documentElement.classList.add('js-enabled');
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#primary-nav');
  if (!header || !toggle || !nav) return;
  const closeMenu = () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', '開啟選單');
  };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '關閉選單' : '開啟選單');
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      closeMenu(); toggle.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!header.contains(event.target)) closeMenu();
  });
  nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  const desktop = window.matchMedia('(min-width: 801px)');
  desktop.addEventListener('change', closeMenu);
  let previousY = window.scrollY;
  window.addEventListener('scroll', () => {
    const currentY = window.scrollY;
    // Ignore the header's own 14px resize so scroll anchoring cannot flip it back.
    if (Math.abs(currentY - previousY) > 24) {
      header.classList.toggle('is-compact', currentY > 90 && currentY > previousY);
      previousY = currentY;
    }
  }, { passive: true });
})();
