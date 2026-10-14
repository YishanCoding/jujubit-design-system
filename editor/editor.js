(() => {
  'use strict';
  if (!['http:', 'https:'].includes(location.protocol) || !location.pathname.startsWith('/design')) return;
  const side = document.querySelector('.pg-side');
  if (!side) return;
  const names = { yishan: 'Yishan', yingrui: '莹睿', agent: 'agent' };
  const sources = new Map(), baseline = new Map(), dirty = new Map(), titles = new Map();
  const elements = new Map([...document.querySelectorAll('[data-edit]')].map(el => [el.dataset.edit, el]));
  const modules = new Map([...document.querySelectorAll('[data-mod]')].map(el => [el.dataset.mod, el]));
  let who = null, comments = [], bar, panel, saveButton, pendingButton, loginDialog, toastBox;
  let hoverBox, hovered, badges = [], saving = false, entering = false, selected = null;

  function node(tag, text, className) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  }
  function button(text, action) {
    const el = node('button', text, 'jjb-btn jjb-btn--outline jjb-btn--s');
    el.type = 'button';
    el.addEventListener('click', async () => {
      el.disabled = true;
      try { await action(); } catch (error) { if (error.status !== 401) toast(error.message || '操作失败，请重试'); }
      finally { el.disabled = false; if (saveButton) updateBar(); }
    });
    return el;
  }
  function commitLink(url) {
    if (typeof url !== 'string' || !url.startsWith('https://github.com/YishanCoding/jujubit-design-system/commit/')) return null;
    const link = node('a', '查看提交');
    link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
    return link;
  }
  function toast(message, url) {
    if (!toastBox) { toastBox = node('div', undefined, 'jjb-toast jjb-editor-toast'); toastBox.setAttribute('role', 'status'); document.body.append(toastBox); }
    toastBox.replaceChildren(node('span', message));
    const link = commitLink(url); if (link) toastBox.append(link);
    toastBox.hidden = false;
    clearTimeout(toast.timer); toast.timer = setTimeout(() => { toastBox.hidden = true; }, 8000);
  }
  async function api(path, method = 'GET', data, promptOn401 = true) {
    const response = await fetch('/design/api/' + path, {
      method, credentials: 'same-origin', cache: 'no-store',
      ...(method === 'GET' ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data || {}) }),
    });
    if (response.status === 401) {
      leave();
      if (promptOn401) showLogin();
      const error = new Error('口令错误或登录已过期'); error.status = 401; throw error;
    }
    if (!response.ok) throw new Error(response.status === 429 ? '尝试过多，请 10 分钟后重试' : '操作失败，请重试');
    return response.json();
  }
  function showLogin() {
    if (loginDialog?.open) return;
    loginDialog?.remove();
    loginDialog = node('dialog', undefined, 'jjb-dialog jjb-editor-login');
    const title = node('h2', '进入编辑模式', 'jjb-h3'); title.id = 'jjb-editor-login-title';
    loginDialog.setAttribute('aria-labelledby', title.id);
    const form = node('form'), label = node('label', '编辑口令');
    const pass = node('input', undefined, 'jjb-input'); pass.type = 'password'; pass.autocomplete = 'current-password'; pass.required = true;
    const error = node('p'); error.setAttribute('role', 'alert');
    label.append(pass);
    const submit = node('button', '登录', 'jjb-btn jjb-btn--primary jjb-btn--s'); submit.type = 'submit';
    form.append(label, error, submit, button('取消', () => loginDialog.close()));
    form.addEventListener('submit', async event => {
      event.preventDefault(); submit.disabled = true; error.textContent = '';
      try {
        const data = await api('login', 'POST', { pass: pass.value }, false);
        pass.value = ''; loginDialog.close(); await enter(data.who);
      } catch (failure) { pass.value = ''; error.textContent = failure.message; }
      finally { submit.disabled = false; }
    });
    loginDialog.append(title, form); document.body.append(loginDialog); loginDialog.showModal(); pass.focus();
  }
  // Serialize only approved elements. API strings are never inserted as HTML.
  function inline(el) {
    return [...el.childNodes].map(child => {
      if (child.nodeType === 3) return child.nodeValue.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
      if (child.nodeType !== 1) return '';
      const tag = child.tagName.toLowerCase();
      if (tag === 'br') return '<br>';
      const text = inline(child);
      return tag === 'b' || tag === 'code' ? `<${tag}>${text}</${tag}>` : text;
    }).join('');
  }
  function mark(el) {
    const key = el.dataset.edit, html = inline(el);
    if (html === baseline.get(key)) dirty.delete(key); else dirty.set(key, html);
    el.classList.toggle('is-dirty', dirty.has(key)); updateBar();
  }
  async function loadComments() {
    const data = await api('comments?status=all'); comments = data.comments;
    if (data.purge_skipped) toast('评论清理已跳过，现有评论已保留');
    updateBar(); refreshBadges();
  }
  async function enter(identity) {
    if (entering || who) return;
    entering = true;
    try {
      const response = await fetch('/design/modules.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('模块清单暂不可用，请稍后重试');
      const manifest = await response.json();
      if (!Array.isArray(manifest.modules) || !manifest.modules.length) throw new Error('模块清单暂不可用，请稍后重试');
      for (const mod of manifest.modules) {
        titles.set(mod.id, mod.title);
        for (const edit of mod.edits || []) {
          if (!sources.has(edit.key)) sources.set(edit.key, edit.source);
          const el = elements.get(edit.key);
          if (el && !baseline.has(edit.key)) baseline.set(edit.key, inline(el));
        }
      }
      await loadComments();
      who = identity; document.body.classList.add('jjb-editing'); entry.hidden = true;
      bar = node('div', undefined, 'jjb-editor-bar'); bar.setAttribute('aria-label', '编辑工具栏');
      pendingButton = button('', showPending); saveButton = button('', save);
      bar.append(node('span', names[who] || who), pendingButton, saveButton, button('退出编辑', async () => {
        if (dirty.size && !window.confirm('尚有未保存修改，确定退出编辑？修改仍保留在本页。')) return;
        await api('logout', 'POST'); leave();
      }));
      document.body.prepend(bar);
      for (const [key, el] of elements) if (sources.has(key)) { el.setAttribute('contenteditable', 'true'); el.setAttribute('spellcheck', 'false'); }
      hoverBox = node('div', undefined, 'jjb-editor-hover'); hoverBox.hidden = true; document.body.append(hoverBox);
      updateBar(); refreshBadges();
    } finally { entering = false; }
  }
  function leave() {
    who = null; document.body.classList.remove('jjb-editing', 'jjb-editor-panel-open'); entry.hidden = false;
    for (const el of elements.values()) { el.removeAttribute('contenteditable'); el.removeAttribute('spellcheck'); }
    bar?.remove(); panel?.remove(); hoverBox?.remove(); badges.forEach(b => b.button.remove());
    bar = panel = saveButton = pendingButton = hoverBox = null; badges = []; hovered = selected = null;
    comments = [];
  }
  function updateBar() {
    if (saveButton) { saveButton.textContent = `保存（${dirty.size} 处修改）`; saveButton.disabled = saving || !dirty.size; }
    if (pendingButton) pendingButton.textContent = `待处理 ${comments.filter(c => c.status === 'open').length} 条`;
  }
  function openPanel(title) {
    panel?.remove(); panel = node('aside', undefined, 'jjb-editor-panel'); panel.setAttribute('aria-label', title);
    panel.append(button('关闭面板', () => { panel.remove(); panel = null; selected = null; document.body.classList.remove('jjb-editor-panel-open'); positionOverlays(); }), node('h2', title, 'jjb-h3'));
    document.body.classList.add('jjb-editor-panel-open'); document.body.prepend(panel);
    positionOverlays();
    // At narrow widths the panel is in normal flow; bring its controls into view.
    if (window.innerWidth <= 960) panel.scrollIntoView({ block: 'start' });
    return panel;
  }
  function showPending() {
    selected = null;
    const box = openPanel('待处理评论'), groups = new Map();
    for (const c of comments.filter(c => c.status === 'open')) {
      if (!groups.has(c.mod)) groups.set(c.mod, []); groups.get(c.mod).push(c);
    }
    for (const [mod, items] of groups) {
      box.append(button(`${titles.get(mod) || mod} · ${items.length}`, () => {
        showModule(mod); modules.get(mod)?.scrollIntoView({ block: 'center' });
      }));
      for (const c of items) box.append(node('p', c.body, 'jjb-editor-comment-body'));
    }
    if (!groups.size) box.append(node('p', '暂无待处理评论'));
  }
  function showModule(mod) {
    if (!who) return;
    selected = mod;
    const box = openPanel(titles.get(mod) || mod);
    box.append(node('code', mod));
    const list = comments.filter(c => c.mod === mod);
    if (!list.length) box.append(node('p', '暂无评论'));
    for (const c of list) {
      const item = node('article', undefined, 'jjb-editor-comment');
      item.append(node('p', `${names[c.author] || c.author} · ${new Date(c.created_at * 1000).toLocaleString()}`), node('p', c.body, 'jjb-editor-comment-body'));
      if (c.status === 'resolved') item.append(node('p', `已处理 · ${names[c.resolved_by] || c.resolved_by || ''}`));
      const link = commitLink(c.commit_url); if (link) item.append(link);
      item.append(button(c.status === 'open' ? '标记已处理' : '重新打开', async () => {
        await api(`comments/${c.id}`, 'PATCH', { status: c.status === 'open' ? 'resolved' : 'open' });
        await loadComments(); showModule(mod);
      }));
      if (c.author === who) item.append(button('删除', async () => {
        await api(`comments/${c.id}`, 'DELETE'); await loadComments(); showModule(mod);
      }));
      box.append(item);
    }
    const label = node('label', '新增评论'), input = node('textarea', undefined, 'jjb-input');
    input.rows = 4; input.maxLength = 2000; label.append(input);
    box.append(label, button('新增评论', async () => {
      const body = input.value.trim(); if (!body) { toast('请输入评论'); return; }
      await api('comments', 'POST', { mod, body }); await loadComments(); showModule(mod);
    }));
  }
  async function save() {
    if (saving || !dirty.size) return;
    if (dirty.size > 50) { toast('一次最多保存 50 处修改，请减少修改后重试'); return; }
    saving = true; updateBar();
    const sent = new Map(dirty);
    try {
      const edits = [...sent].map(([key, html]) => ({ key, source: sources.get(key), html }));
      const titleMap = Object.fromEntries(edits.map(e => [e.key, titles.get(e.key.split('#')[0]) || e.key.split('#')[0]]));
      const result = await api('edits', 'POST', { edits, titles: titleMap });
      let conflict = false, empty = false;
      for (const r of result.results) {
        if (r.ok || r.error === 'unchanged') {
          if (r.ok) sources.set(r.key, r.new_source);
          baseline.set(r.key, sent.get(r.key));
          // A user may type while the request is in flight. Do not clear those changes.
          if (elements.has(r.key)) mark(elements.get(r.key));
        } else if (['ambiguous', 'not_found'].includes(r.error)) conflict = true;
        else if (r.error === 'empty') empty = true;
      }
      if (result.commit_url) toast('已提交，约 5 分钟后线上可见', result.commit_url);
      if (conflict) toast('这段已被改动，刷新后再改', result.commit_url);
      else if (empty) toast('文字不能为空，请补充后保存', result.commit_url);
    } finally { saving = false; updateBar(); }
  }
  function rect(el) {
    const own = el.getBoundingClientRect();
    if (own.width || own.height) return own;
    // display:contents wrappers have no box: outline the union of their contents.
    const range = document.createRange(); range.selectNodeContents(el); return range.getBoundingClientRect();
  }
  function positionOverlays() {
    if (!who) return;
    if (hoverBox && hovered) {
      const r = rect(hovered); hoverBox.hidden = !r.width || !r.height;
      Object.assign(hoverBox.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    }
    for (const badge of badges) {
      const r = rect(badge.el); badge.button.hidden = !r.width || r.bottom < 0 || r.top > window.innerHeight;
      const width = badge.button.getBoundingClientRect().width;
      Object.assign(badge.button.style, { left: `${Math.max(0, Math.min(window.innerWidth - width, r.right - width))}px`, top: `${r.top}px` });
    }
  }
  function refreshBadges() {
    badges.forEach(b => b.button.remove()); badges = [];
    if (!who) return;
    const counts = new Map();
    for (const c of comments) if (c.status === 'open') counts.set(c.mod, (counts.get(c.mod) || 0) + 1);
    for (const [mod, count] of counts) {
      const el = modules.get(mod); if (!el) continue;
      const badge = button(String(count), () => showModule(mod)); badge.classList.add('jjb-editor-badge'); badge.setAttribute('aria-label', `${mod}：${count} 条待处理评论`);
      document.body.append(badge); badges.push({ el, button: badge });
    }
    positionOverlays();
  }
  const entry = button('编辑', async () => {
    try { const data = await api('me'); await enter(data.who); }
    catch (error) { if (error.status !== 401) throw error; }
  });
  entry.classList.add('jjb-editor-entry');
  side.append(entry);
  document.addEventListener('click', event => {
    if (!who || event.target.closest('a, button, input, textarea, select, summary, [data-edit]')) return;
    const mod = event.target.closest('[data-mod]'); if (mod) showModule(mod.dataset.mod);
  });
  document.addEventListener('input', event => {
    if (!who) return;
    const el = event.target.closest('[data-edit]'); if (el && sources.has(el.dataset.edit)) mark(el);
  });
  document.addEventListener('mouseover', event => {
    if (!who || !hoverBox) return;
    hovered = event.target.closest('[data-mod]'); hoverBox.hidden = !hovered;
    if (hovered) { hoverBox.textContent = hovered.dataset.mod; positionOverlays(); }
  });
  function insertPlain(el, text) {
    const selection = window.getSelection(); if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0); if (!el.contains(range.commonAncestorContainer)) return;
    range.deleteContents();
    const fragment = document.createDocumentFragment();
    const lines = text.split(/\r?\n/);
    lines.forEach((line, i) => { if (i) fragment.append(document.createElement('br')); fragment.append(document.createTextNode(line)); });
    const last = fragment.lastChild; range.insertNode(fragment);
    if (last) { range.setStartAfter(last); range.collapse(true); selection.removeAllRanges(); selection.addRange(range); }
    mark(el);
  }
  document.addEventListener('paste', event => {
    const el = event.target.closest('[data-edit]'); if (!who || !el) return;
    event.preventDefault(); insertPlain(el, event.clipboardData.getData('text/plain'));
  });
  document.addEventListener('drop', event => { if (who && event.target.closest('[data-edit]')) event.preventDefault(); });
  document.addEventListener('beforeinput', event => {
    const el = event.target.closest('[data-edit]'); if (!who || !el) return;
    if (['insertParagraph', 'insertLineBreak'].includes(event.inputType)) { event.preventDefault(); insertPlain(el, '\n'); }
  });
  window.addEventListener('scroll', positionOverlays, { passive: true, capture: true });
  window.addEventListener('resize', positionOverlays);
  window.addEventListener('beforeunload', event => { if (dirty.size) { event.preventDefault(); event.returnValue = ''; } });
})();
