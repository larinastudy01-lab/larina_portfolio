// Runtime checks with a minimal DOM fixture; these are not visual browser tests.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const pairs = JSON.parse(fs.readFileSync('static/i18n/translations.json', 'utf8'));
const script = fs.readFileSync('static/js/i18n.js', 'utf8');

async function fixture(saved, blockedStorage = false) {
  const elements = [];
  class Element {
    constructor(tag = 'div', attrs = {}) { this.nodeType = 1; this.tag = tag; this.attrs = attrs; this.dataset = {}; this.events = {}; this.nodes = []; elements.push(this); }
    closest() { return this.attrs['data-no-translate'] !== undefined || ['input','textarea'].includes(this.tag) ? this : null; }
    hasAttribute(name) { return name in this.attrs; }
    getAttribute(name) { return this.attrs[name] ?? null; }
    setAttribute(name, value) { this.attrs[name] = value; }
    addEventListener(name, callback) { this.events[name] = callback; }
    querySelectorAll(selector) { return elements.filter(el => selector.split(', ').some(part => el.hasAttribute(part.slice(1, -1)))); }
    text(value) { const node = { nodeType: 3, nodeValue: value, parentElement: this }; this.nodes.push(node); return node; }
  }
  const html = new Element('html');
  const body = new Element('body');
  const button = new Element('button', { 'data-no-translate': '' });
  button.dataset.dictionary = '/static/i18n/translations.json';
  const heading = new Element().text('Explore My Research ↗');
  const paragraph = new Element().text('從語言出發，關心人如何理解、表達與學習。');
  const count = new Element().text('4 projects');
  const menu = new Element('button', { 'aria-label': '開啟選單' });
  const input = new Element('input', { placeholder: '你的名字' });
  input.value = '我的未送出內容';
  const form = new Element('form');
  form.elements = { namedItem: () => ({ value: '測試者' }) };
  const status = new Element();
  const metas = new Map();
  let observer;
  let stored = saved;
  const document = {
    documentElement: html, body, title: 'Research — Larina / Yen-Yu Chen',
    querySelector(selector) {
      const selected = { '#language-toggle': button, '#contact-form': form, '#form-status': status }[selector];
      if (selected) return selected;
      if (!metas.has(selector)) metas.set(selector, {});
      return metas.get(selector);
    },
    createTreeWalker() {
      const nodes = elements.flatMap(element => element.nodes);
      let index = -1;
      return { currentNode: null, nextNode() { this.currentNode = nodes[++index]; return !!this.currentNode; } };
    }
  };
  const window = { dispatchEvent() {} };
  const context = { document, window, Node: { TEXT_NODE: 3, ELEMENT_NODE: 1 }, NodeFilter: { SHOW_TEXT: 4 },
    localStorage: { getItem() { if (blockedStorage) throw Error('blocked'); return stored; }, setItem(key, value) { if (blockedStorage) throw Error('blocked'); stored = value; } },
    fetch: async () => ({ ok: true, json: async () => pairs }),
    MutationObserver: class { constructor(callback) { observer = callback; } observe() {} disconnect() {} },
    CustomEvent: class {}, location: { reload() {} }
  };
  vm.runInNewContext(script, context);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(button.disabled, false);
  return { html, button, heading, paragraph, count, menu, input, form, status, window,
    stored: () => stored, mutate: changes => observer(changes) };
}

(async () => {
  const page = await fixture(null);
  assert.equal(page.html.lang, 'zh-Hant');
  assert.equal(page.heading.nodeValue, '探索我的研究 ↗');
  assert.equal(page.count.nodeValue, '4 個作品');
  page.button.events.click();
  assert.equal(page.html.lang, 'en');
  assert.equal(page.heading.nodeValue, 'Explore My Research ↗');
  assert.match(page.paragraph.nodeValue, /^Starting with language/);
  assert.equal(page.menu.getAttribute('aria-label'), 'Open menu');
  assert.equal(page.input.getAttribute('placeholder'), 'Your name');
  assert.equal(page.input.value, '我的未送出內容');
  assert.equal(page.stored(), 'en');
  page.count.nodeValue = '1 project · Health';
  page.mutate([{ type: 'characterData', target: page.count }]);
  assert.equal(page.count.nodeValue, '1 project · Health');
  page.menu.setAttribute('aria-label', '關閉選單');
  page.mutate([{ type: 'attributes', target: page.menu }]);
  assert.equal(page.menu.getAttribute('aria-label'), 'Close menu');
  page.form.dataset.previewed = 'true';
  page.window.portfolioI18n.updateDynamicStatus();
  assert.match(page.status.textContent, /^Thank you, 測試者!/);
  page.button.events.click();
  assert.equal(page.count.nodeValue, '1 個作品 · 健康');
  assert.equal(page.input.value, '我的未送出內容');
  assert.match(page.status.textContent, /^謝謝你，測試者/);
  for (let i = 0; i < 10; i++) page.button.events.click();
  assert.equal(page.heading.nodeValue, '探索我的研究 ↗');
  const nextPage = await fixture('en');
  assert.equal(nextPage.html.lang, 'en');
  const blocked = await fixture(null, true);
  blocked.button.events.click();
  assert.equal(blocked.html.lang, 'en');
  console.log('PASS: bilingual switching, persistence, storage fallback, dynamic filters/labels/status, repeated switching, and input preservation.');
})().catch(error => { console.error(error); process.exitCode = 1; });
