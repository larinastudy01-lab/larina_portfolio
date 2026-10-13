(() => {
  'use strict';
  const normalize = value => value.replace(/\s+/g, ' ').trim();
  const storageKey = 'larina-language';
  const toggle = document.querySelector('#language-toggle');
  if (!toggle) return;
  let language = 'zh-Hant';
  try { if (localStorage.getItem(storageKey) === 'en') language = 'en'; } catch (_) { /* Storage is optional. */ }
  let dictionary;
  const sourceText = new WeakMap();
  const sourceAttributes = new WeakMap();
  const attributes = ['aria-label', 'placeholder', 'alt', 'title'];
  const ignored = 'script, style, textarea, input, code, pre, [data-no-translate]';

  function translate(value) {
    const key = normalize(value);
    const entry = dictionary.get(key);
    if (entry) return value.replace(value.trim(), entry[language]);
    // Text composed by the existing templates, without translating identifiers.
    const count = key.match(/^(\d+) projects?(?: · (.*))?$/);
    if (count) return language === 'en' ? key : `${count[1]} 個作品${count[2] ? ' · ' + translate(count[2]) : ''}`;
    const title = key.match(/^(.*) — Larina \/ Yen-Yu Chen$/);
    if (title) return `${translate(title[1])} — Larina / Yen-Yu Chen`;
    const arrow = key.match(/^(← )?(.+?)( [↗→])$/);
    if (arrow) return `${arrow[1] || ''}${translate(arrow[2])}${arrow[3]}`;
    const back = key.match(/^← (.+)$/);
    if (back) return `← ${translate(back[1])}`;
    if (key.includes(' · ')) return key.split(' · ').map(part => translate(part)).join(' · ');
    if (key.includes(' → ')) return key.split(' → ').map(part => translate(part)).join(' → ');
    const version = key.match(/^(.*) \/ (V1|2026)$/);
    if (version) return `${translate(version[1])} / ${version[2]}`;
    return value;
  }

  function updateText(node) {
    if (!node.parentElement || node.parentElement.closest(ignored)) return;
    const current = node.nodeValue;
    let record = sourceText.get(node);
    // Preserve original copy for reversible switching; accept new dynamic content.
    if (!record || current !== record.rendered) record = { source: current };
    record.rendered = translate(record.source);
    sourceText.set(node, record);
    if (current !== record.rendered) node.nodeValue = record.rendered;
  }

  function updateElement(element) {
    if (element.closest(ignored)) return;
    let records = sourceAttributes.get(element);
    if (!records) { records = {}; sourceAttributes.set(element, records); }
    for (const name of attributes) {
      if (!element.hasAttribute(name)) continue;
      const current = element.getAttribute(name);
      let record = records[name];
      if (!record || current !== record.rendered) record = { source: current };
      record.rendered = translate(record.source);
      records[name] = record;
      if (current !== record.rendered) element.setAttribute(name, record.rendered);
    }
  }

  function apply(root) {
    if (root.nodeType === Node.TEXT_NODE) { updateText(root); return; }
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    updateElement(root);
    // Input placeholders are translated separately; user-entered values are untouched.
    root.querySelectorAll('[placeholder]').forEach(element => {
      const current = element.getAttribute('placeholder');
      const records = sourceAttributes.get(element) || {};
      const record = records.placeholder && records.placeholder.rendered === current ? records.placeholder : { source: current };
      record.rendered = translate(record.source);
      records.placeholder = record;
      sourceAttributes.set(element, records);
      if (current !== record.rendered) element.setAttribute('placeholder', record.rendered);
    });
    root.querySelectorAll('[aria-label], [alt], [title]').forEach(updateElement);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) updateText(walker.currentNode);
  }

  function updateDynamicStatus() {
    const form = document.querySelector('#contact-form');
    const status = document.querySelector('#form-status');
    if (form && status && form.dataset.previewed === 'true') {
      const name = form.elements.namedItem('name').value.trim() || (language === 'en' ? 'friend' : '朋友');
      status.textContent = language === 'en'
        ? `Thank you, ${name}! Your message preview is ready. This V1 demo has not sent or saved anything; your text remains in the form.`
        : `謝謝你，${name}！訊息預覽完成。這是 V1 示範，尚未寄出或儲存；你的內容保留在表單中。`;
    }
  }

  function setLanguage(next) {
    language = next;
    document.documentElement.lang = language;
    apply(document.documentElement);
    document.querySelector('meta[property="og:locale"]').content = language === 'en' ? 'en_US' : 'zh_TW';
    document.querySelector('meta[property="og:title"]').content = document.title;
    document.querySelector('meta[name="description"]').content = language === 'en'
      ? 'Larina / Yen-Yu Chen: a research portfolio exploring human-centered AI, HCI, learning analytics and digital health.'
      : 'Larina 陳彥妤的研究作品集：以使用者問題為起點，探索以人為中心的 AI、人機互動、學習分析與數位健康。';
    document.querySelector('meta[property="og:description"]').content = language === 'en' ? 'Understanding people. Building meaningful systems.' : '理解人的需求，建立有意義的系統。';
    toggle.textContent = language === 'en' ? '中文' : 'EN';
    toggle.setAttribute('aria-label', language === 'en' ? '切換為繁體中文' : 'Switch to English');
    toggle.lang = language === 'en' ? 'zh-Hant' : 'en';
    updateDynamicStatus();
    try { localStorage.setItem(storageKey, language); } catch (_) { /* Still works for this page. */ }
    window.dispatchEvent(new CustomEvent('portfolio:language', { detail: { language } }));
  }

  fetch(toggle.dataset.dictionary)
    .then(response => { if (!response.ok) throw new Error('Dictionary unavailable'); return response.json(); })
    .then(pairs => {
      dictionary = new Map();
      pairs.forEach(([en, zh, ...aliases]) => {
        const entry = { en, 'zh-Hant': zh };
        dictionary.set(normalize(en), entry);
        dictionary.set(normalize(zh), entry);
        aliases.forEach(alias => dictionary.set(normalize(alias), entry));
      });
      window.portfolioI18n = { translate, get language() { return language; }, updateDynamicStatus };
      setLanguage(language);
      toggle.disabled = false;
      toggle.addEventListener('click', () => setLanguage(language === 'en' ? 'zh-Hant' : 'en'));
      const observer = new MutationObserver(changes => {
        observer.disconnect();
        for (const change of changes) {
          if (change.type === 'characterData') updateText(change.target);
          else if (change.type === 'attributes') updateElement(change.target);
          else change.addedNodes.forEach(apply);
        }
        observe();
      });
      const observe = () => observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: attributes });
      observe();
    })
    .catch(() => {
      toggle.textContent = '重試 / Retry';
      toggle.disabled = false;
      toggle.setAttribute('aria-label', '語言資料載入失敗，重新整理以重試 / Reload to retry language loading');
      toggle.addEventListener('click', () => location.reload());
    });
})();
