(() => {
  const form = document.querySelector('#contact-form');
  if (form) {
    form.querySelector('[type="submit"]').disabled = false;
    // The demo never sends or stores personal data, even without a mail backend.
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const status = document.querySelector('#form-status');
      form.dataset.previewed = 'true';
      status.textContent = `謝謝你，${form.elements.namedItem('name').value.trim() || '朋友'}！訊息預覽完成。這是 V1 示範，尚未寄出或儲存；你的內容保留在表單中。`;
      status.focus();
      if (window.portfolioI18n) window.portfolioI18n.updateDynamicStatus();
    });
  }
  document.querySelectorAll('[data-reflection]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-reflection]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      document.querySelector('.reflection-result').textContent = button.dataset.reflection;
    });
  });
  const openResearch = () => {
    const target = document.getElementById(location.hash.slice(1));
    if (target && target.matches('details.research-detail')) target.open = true;
  };
  openResearch();
  window.addEventListener('hashchange', openResearch);
})();
