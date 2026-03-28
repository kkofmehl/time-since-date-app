(function () {
  const API = '/api/timers';

  const listView = document.getElementById('list-view');
  const detailView = document.getElementById('detail-view');
  const timerList = document.getElementById('timer-list');
  const listEmpty = document.getElementById('list-empty');
  const createForm = document.getElementById('create-form');
  const detailContent = document.getElementById('detail-content');
  const detailBack = document.getElementById('detail-back');

  let tickHandle = null;
  let timers = [];
  /** @type {string | null} id of timer whose drawer is open */
  let expandedId = null;
  /** @type {string | null} id of timer showing the edit form inside the drawer */
  let editingId = null;

  function isoToDatetimeLocal(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function formatLocal(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  }

  function getDurationState(targetIso, now) {
    const targetTime = new Date(targetIso).getTime();
    const nowMs = now.getTime();
    const delta = targetTime - nowMs;
    const totalMs = Math.abs(delta);
    const kind = delta > 0 ? 'until' : 'since';
    const totalSeconds = Math.floor(totalMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    let rem = totalSeconds % 86400;
    const hours = Math.floor(rem / 3600);
    rem %= 3600;
    const minutes = Math.floor(rem / 60);
    const seconds = rem % 60;
    return { kind, totalMs, parts: { days, hours, minutes, seconds } };
  }

  function formatParts(parts) {
    const { days, hours, minutes, seconds } = parts;
    const bits = [];
    if (days > 0) bits.push(`${days}d`);
    if (hours > 0 || days > 0) bits.push(`${hours}h`);
    bits.push(`${minutes}m`);
    bits.push(`${seconds}s`);
    return bits.join(' ');
  }

  function durationLine(targetIso) {
    const s = getDurationState(targetIso, new Date());
    const label = s.kind === 'until' ? 'Time until' : 'Time since';
    return `${label}: ${formatParts(s.parts)}`;
  }

  function kindLabel(kind) {
    return kind === 'until' ? 'Until' : 'Since';
  }

  function updateDurationElements() {
    document.querySelectorAll('[data-duration-for]').forEach((el) => {
      const id = el.getAttribute('data-duration-for');
      const t = timers.find((x) => x.id === id);
      if (!t) return;
      const s = getDurationState(t.target, new Date());
      el.textContent = formatParts(s.parts);
      const kindEl = document.querySelector(`[data-kind-for="${id}"]`);
      if (kindEl) kindEl.textContent = kindLabel(s.kind);
    });
  }

  function parseRoute() {
    const h = (location.hash || '').replace(/^#/, '') || '/';
    const m = h.match(/^\/timers\/([^/]+)$/);
    if (m) return { view: 'detail', id: decodeURIComponent(m[1]) };
    return { view: 'list' };
  }

  function setView(route) {
    if (route.view === 'detail') {
      listView.hidden = true;
      detailView.hidden = false;
      loadDetail(route.id);
    } else {
      detailView.hidden = true;
      listView.hidden = false;
      loadList();
    }
  }

  async function loadList() {
    const res = await fetch(API);
    if (!res.ok) throw new Error('Failed to load timers');
    timers = await res.json();
    renderList();
    startTick();
  }

  function startTick() {
    if (tickHandle) clearInterval(tickHandle);
    tickHandle = setInterval(() => {
      if (parseRoute().view !== 'list') return;
      updateDurationElements();
    }, 1000);
  }

  function renderList() {
    const ids = new Set(timers.map((x) => x.id));
    if (expandedId && !ids.has(expandedId)) expandedId = null;
    if (editingId && !ids.has(editingId)) editingId = null;

    timerList.innerHTML = '';
    listEmpty.hidden = timers.length > 0;
    timers.forEach((t) => {
      const s = getDurationState(t.target, new Date());
      const isOpen = expandedId === t.id;
      const isEditing = editingId === t.id;
      const li = document.createElement('li');
      li.className = 'timer-card' + (isOpen ? ' is-open' : '');
      const drawerId = `timer-drawer-${t.id}`;
      li.innerHTML = `
        <button type="button" class="timer-row" data-timer-id="${t.id}" aria-expanded="${isOpen}" aria-controls="${drawerId}" id="timer-trigger-${t.id}">
          <span class="timer-row-text">
            <span class="timer-name-min">${escapeHtml(t.name)}</span>
            <span class="timer-hero" aria-live="polite">
              <span class="timer-kind" data-kind-for="${t.id}">${escapeHtml(kindLabel(s.kind))}</span>
              <span class="timer-digits" data-duration-for="${t.id}">${escapeHtml(formatParts(s.parts))}</span>
            </span>
          </span>
          <span class="timer-chevron" aria-hidden="true"></span>
        </button>
        <div class="timer-drawer" id="${drawerId}" role="region" aria-labelledby="timer-trigger-${t.id}" ${isOpen ? '' : 'hidden'}>
          <p class="timer-drawer-meta">Target <strong>${escapeHtml(formatLocal(t.target))}</strong></p>
          <div class="timer-actions">
            <a class="btn small ghost" href="#/timers/${encodeURIComponent(t.id)}">Details</a>
            <button type="button" class="btn small" data-action="edit" data-id="${t.id}">Edit</button>
            <button type="button" class="btn small danger" data-action="reset" data-id="${t.id}">Reset</button>
            <button type="button" class="btn small danger" data-action="delete" data-id="${t.id}">Delete</button>
          </div>
          <form class="edit-form" ${isEditing ? '' : 'hidden'} data-edit-for="${t.id}">
            <label class="field inline"><span class="label">Name</span>
              <input type="text" name="name" required value="${escapeAttr(t.name)}" /></label>
            <label class="field inline"><span class="label">Target</span>
              <input type="datetime-local" name="target" required value="${escapeAttr(isoToDatetimeLocal(t.target))}" /></label>
            <div class="edit-actions">
              <button type="submit" class="btn small primary">Save</button>
              <button type="button" class="btn small ghost" data-cancel-edit="${t.id}">Cancel</button>
            </div>
          </form>
        </div>
      `;
      timerList.appendChild(li);
    });

    timerList.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', () => onDelete(btn.getAttribute('data-id')));
    });
    timerList.querySelectorAll('[data-action="reset"]').forEach((btn) => {
      btn.addEventListener('click', () => onReset(btn.getAttribute('data-id')));
    });
    timerList.querySelectorAll('[data-action="edit"]').forEach((btn) => {
      btn.addEventListener('click', () => toggleEdit(btn.getAttribute('data-id'), true));
    });
    timerList.querySelectorAll('[data-cancel-edit]').forEach((btn) => {
      btn.addEventListener('click', () => toggleEdit(btn.getAttribute('data-cancel-edit'), false));
    });
    timerList.querySelectorAll('form.edit-form').forEach((form) => {
      form.addEventListener('submit', onEditSubmit);
    });
  }

  timerList.addEventListener('click', (e) => {
    const row = e.target.closest('button.timer-row');
    if (!row || !timerList.contains(row)) return;
    const id = row.getAttribute('data-timer-id');
    if (!id) return;
    if (expandedId === id) {
      expandedId = null;
      editingId = null;
    } else {
      if (expandedId !== null) editingId = null;
      expandedId = id;
    }
    renderList();
    startTick();
  });

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, '&#39;');
  }

  function toggleEdit(id, open) {
    editingId = open ? id : null;
    const form = timerList.querySelector(`form[data-edit-for="${id}"]`);
    if (!form) return;
    form.hidden = !open;
  }

  async function onEditSubmit(ev) {
    ev.preventDefault();
    const form = ev.target;
    const id = form.getAttribute('data-edit-for');
    const fd = new FormData(form);
    const name = String(fd.get('name') || '').trim();
    const local = String(fd.get('target') || '');
    const target = new Date(local).toISOString();
    const res = await fetch(`${API}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, target }),
    });
    if (!res.ok) {
      alert('Could not save changes');
      return;
    }
    editingId = null;
    await loadList();
  }

  async function onDelete(id) {
    if (!confirm('Delete this timer?')) return;
    const res = await fetch(`${API}/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) {
      alert('Could not delete');
      return;
    }
    await loadList();
  }

  async function onReset(id) {
    if (!confirm('Reset this timer to now?')) return;
    const res = await fetch(`${API}/${encodeURIComponent(id)}/reset`, { method: 'POST' });
    if (!res.ok) {
      alert('Could not reset');
      return;
    }
    await loadList();
  }

  createForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const fd = new FormData(createForm);
    const name = String(fd.get('name') || '').trim();
    const local = String(fd.get('target') || '');
    const target = new Date(local).toISOString();
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, target }),
    });
    if (!res.ok) {
      alert('Could not create timer');
      return;
    }
    createForm.reset();
    await loadList();
  });

  detailBack.addEventListener('click', () => {
    location.hash = '';
  });

  async function loadDetail(id) {
    detailContent.innerHTML = '<p class="muted">Loading…</p>';
    const res = await fetch(`${API}/${encodeURIComponent(id)}`);
    if (!res.ok) {
      detailContent.innerHTML = '<p class="error">Timer not found.</p>';
      return;
    }
    const t = await res.json();
    const resets = Array.isArray(t.resets) ? t.resets : [];
    const resetItems = resets
      .map(
        (iso, i) =>
          `<li><span class="muted">#${i + 1}</span> ${escapeHtml(formatLocal(iso))} <code class="iso">${escapeHtml(iso)}</code></li>`
      )
      .join('');
    detailContent.innerHTML = `
      <dl class="detail-dl">
        <dt>Name</dt><dd>${escapeHtml(t.name)}</dd>
        <dt>Current target</dt><dd>${escapeHtml(formatLocal(t.target))} <code class="iso">${escapeHtml(t.target)}</code></dd>
        <dt>Created</dt><dd>${escapeHtml(formatLocal(t.createdAt))} <code class="iso">${escapeHtml(t.createdAt)}</code></dd>
        <dt>Live</dt><dd class="detail-live">${escapeHtml(durationLine(t.target))}</dd>
        <dt>Resets (${resets.length})</dt>
        <dd><ol class="reset-list">${resetItems || '<li class="muted">No resets yet.</li>'}</ol></dd>
      </dl>
    `;
    if (tickHandle) clearInterval(tickHandle);
    tickHandle = setInterval(() => {
      if (parseRoute().view !== 'detail' || parseRoute().id !== id) return;
      const live = detailContent.querySelector('.detail-live');
      if (live) live.textContent = durationLine(t.target);
    }, 1000);
  }

  window.addEventListener('hashchange', () => setView(parseRoute()));

  setView(parseRoute());
})();
