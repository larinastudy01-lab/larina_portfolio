(() => {
  const diagrams = document.querySelectorAll('[data-svg-zh][data-svg-en]');
  const updateDiagrams = language => diagrams.forEach(element => {
    const source = language === 'en' ? element.dataset.svgEn : element.dataset.svgZh;
    const attribute = element.tagName === 'IMG' ? 'src' : 'href';
    if (element.getAttribute(attribute) !== source) element.setAttribute(attribute, source);
  });
  if (diagrams.length) {
    window.addEventListener('portfolio:language', event => updateDiagrams(event.detail.language));
    if (window.portfolioI18n) updateDiagrams(window.portfolioI18n.language);
  }
  const buttons = document.querySelectorAll('[data-filter]');
  const cards = document.querySelectorAll('[data-categories]');
  const transitions = new Map();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!buttons.length) return;
  const cancelTransitions = () => {
    transitions.forEach(animation => animation.cancel());
    transitions.clear();
  };
  reducedMotion.addEventListener('change', cancelTransitions);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelTransitions(); });
  buttons.forEach(button => button.addEventListener('click', () => {
    cancelTransitions();
    const filter = button.dataset.filter;
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    let count = 0;
    cards.forEach(card => {
      const visible = filter === 'All' || card.dataset.categories.split(' ').includes(filter);
      card.hidden = !visible;
      if (visible) {
        count += 1;
        if (!reducedMotion.matches && card.animate) {
          const animation = card.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }], {
            duration: 420, delay: Math.min(count - 1, 4) * 45,
            easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'backwards'
          });
          transitions.set(card, animation);
          animation.addEventListener('finish', () => { if (transitions.get(card) === animation) transitions.delete(card); }, { once: true });
        }
      }
    });
    document.querySelector('.filter-count').textContent = `${count} project${count === 1 ? '' : 's'} · ${filter}`;
    document.querySelector('#empty-projects').hidden = count !== 0;
  }));
})();
