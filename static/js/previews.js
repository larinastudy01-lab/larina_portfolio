(() => {
  const english = () => document.documentElement.lang.startsWith('en');
  const label = (zh, en) => english() ? en : zh;
  const siteRoot = document.querySelector('meta[name="site-root"]')?.content || '/';
  function resource(href) {
    const url = new URL(href, location.href);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    const host = url.hostname.toLowerCase();
    if (['youtu.be', 'www.youtu.be', 'youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com'].includes(host)) {
      const id = host.endsWith('youtu.be') ? url.pathname.split('/')[1] : url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1];
      if (!/^[\w-]{11}$/.test(id || '')) return null;
      const embed = new URL(`https://www.youtube-nocookie.com/embed/${id}`);
      const time = url.searchParams.get('t') || url.searchParams.get('start');
      if (time) {
        const match = time.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)$/);
        if (match) embed.searchParams.set('start', Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0));
      }
      return {type: 'video', src: embed.href};
    }
    if (host === 'drive.google.com') {
      const id = url.pathname.match(/^\/file\/d\/([\w-]+)/)?.[1] || url.searchParams.get('id');
      if (id && /^[\w-]+$/.test(id)) {
        const preview = new URL(`https://drive.google.com/file/d/${id}/preview`);
        if (url.searchParams.has('resourcekey')) preview.searchParams.set('resourcekey', url.searchParams.get('resourcekey'));
        return {type: 'document', src: preview.href};
      }
    }
    if (host === 'docs.google.com' && /^\/(document|spreadsheets|presentation)\/d\/[\w-]+/.test(url.pathname)) {
      return {type: 'document', src: url.origin + url.pathname.match(/^\/(?:document|spreadsheets|presentation)\/d\/[\w-]+/)[0] + '/preview'};
    }
    const extension = url.pathname.split('.').pop().toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg'].includes(extension)) return {type: 'image', src: url.href};
    if (['mp4', 'webm', 'ogv'].includes(extension)) return {type: 'media', src: url.href};
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension)) return {type: 'audio', src: url.href};
    if (extension === 'pdf') return {type: 'document', src: url.href};
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension) && url.origin !== location.origin) return {type: 'document', src: 'https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURIComponent(url.href)};
    if (url.origin === location.origin && url.pathname.startsWith(siteRoot + 'static/files/')) return {type: 'document', src: url.href};
    return null;
  }
  function viewer(item, title) {
    const element = document.createElement(item.type === 'image' ? 'img' : item.type === 'media' ? 'video' : item.type === 'audio' ? 'audio' : 'iframe');
    element.className = `resource-viewer resource-${item.type}`;
    element.src = item.src;
    if (item.type === 'image') element.alt = title;
    else if (['media', 'audio'].includes(item.type)) element.controls = true;
    else {
      element.title = title;
      element.loading = 'lazy';
      element.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
      element.allowFullscreen = true;
      element.referrerPolicy = 'strict-origin-when-cross-origin';
    }
    return element;
  }
  const dialog = document.createElement('dialog');
  dialog.className = 'resource-dialog';
  dialog.dataset.noTranslate = '';
  dialog.innerHTML = '<div class="resource-toolbar"><h2 id="resource-title"></h2><a target="_blank" rel="noopener noreferrer"></a><button type="button" aria-label="Close">&#215;</button></div><div class="resource-body"></div>';
  dialog.setAttribute('aria-labelledby', 'resource-title');
  document.body.append(dialog);
  const body = dialog.querySelector('.resource-body');
  const close = dialog.querySelector('button');
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { body.replaceChildren(); document.body.classList.remove('preview-open'); });
  document.querySelectorAll('a[href]:not([download])').forEach(link => {
    const item = resource(link.href);
    if (!item) return;
    const title = link.querySelector('img')?.alt || link.textContent.trim();
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      dialog.querySelector('h2').textContent = title;
      const original = dialog.querySelector('a');
      original.href = link.href;
      original.textContent = label('開啟原始檔案', 'Open original');
      close.setAttribute('aria-label', label('關閉預覽', 'Close preview'));
      body.replaceChildren(viewer(item, title));
      document.body.classList.add('preview-open');
      dialog.showModal();
    });
  });
  const resources = document.querySelector('.page-hero .project-resources');
  if (resources) {
    const section = document.createElement('section');
    section.className = 'container resource-previews';
    const seen = new Set();
    resources.querySelectorAll('a[href]').forEach(link => {
      const item = resource(link.href);
      if (!item || seen.has(item.src)) return;
      seen.add(item.src);
      const block = document.createElement('div');
      block.className = 'resource-preview';
      const heading = document.createElement('h2');
      heading.textContent = link.textContent.trim();
      block.append(heading, viewer(item, heading.textContent));
      const original = document.createElement('a');
      original.className = 'text-link';
      original.href = link.href;
      original.target = '_blank';
      original.rel = 'noopener noreferrer';
      original.dataset.noTranslate = '';
      original.textContent = label('開啟原始檔案', 'Open original');
      block.append(original);
      section.append(block);
    });
    if (section.children.length) document.querySelector('.page-hero').after(section);
  }
  document.querySelectorAll('.paper-preview').forEach(preview => { preview.open = true; });
})();
