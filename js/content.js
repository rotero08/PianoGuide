// content.js
// Behaviours attached to the page content:
//   - progress  : persisted checkboxes, per-level bars, curriculum overview
//   - resources : collapsible dashboard widgets + <details class="res"> lists
//   - library   : the Reference Library search/category filter
//   - toc       : the per-tab "On this page" rail + mobile drawer + scrollspy
// All of it is exported through a single initContent() that app.js calls once.

import { LS, slugify, escHtml, routeUrl } from './util.js';

/* ============================ progress ============================ */

const LEVELS = ['prestaff', 'lvl0', 'lvl1', 'lvl2', 'lvl3', 'lvl4', 'lvl5', 'lvl6', 'lvl7', 'leadsheets'];
const OVERVIEW_LEVELS = [
  ['prestaff', 'Pre-Staff', 'pre-staff'], ['lvl0', 'Level 0 \u00b7 Linear', 'level-0'],
  ['lvl1', 'Level 1 \u00b7 Intervals', 'level-1'], ['lvl2', 'Level 2 \u00b7 Voices', 'level-2'],
  ['lvl3', 'Level 3 \u00b7 Shifting', 'level-3'], ['lvl4', 'Level 4 \u00b7 Inversions', 'level-4'],
  ['lvl5', 'Level 5 \u00b7 Polyphony', 'level-5'], ['lvl6', 'Level 6 \u00b7 Counterpoint', 'level-6'],
  ['lvl7', 'Level 7 \u00b7 Polytonal', 'level-7'], ['leadsheets', 'Harmony \u00b7 Lead Sheets', 'lead-sheets-l1']
];

function toggleCompletedState(cb) {
  const row = cb.closest('.widget-row');
  if (row) row.classList.toggle('completed', cb.checked);
}

function updateLevelProgress(level) {
  const total = document.querySelectorAll(`input[data-level="${level}"]`).length;
  const checked = document.querySelectorAll(`input[data-level="${level}"]:checked`).length;
  const bar = document.getElementById(`progress-${level}`);
  const pctText = document.getElementById(`percent-${level}`);
  if (bar) {
    const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
    bar.style.width = pct + '%';
    if (pctText) pctText.textContent = pct + '%';
  }
}

function levelPct(level) {
  const boxes = document.querySelectorAll(`.widget-checkbox[data-level="${level}"]`);
  if (!boxes.length) return 0;
  return Math.round([...boxes].filter(b => b.checked).length / boxes.length * 100);
}

function renderOverview() {
  const wrap = document.getElementById('curriculumOverview');
  if (!wrap) return;
  let total = 0, count = 0, rows = '';
  OVERVIEW_LEVELS.forEach(([dl, name, sec]) => {
    const pct = levelPct(dl); total += pct; count++;
    rows += '<div class="po-row" onclick="switchSection(\'' + sec + '\')">'
      + '<div class="po-top"><span class="po-name">' + name + '</span><span class="po-pct">' + pct + '%</span></div>'
      + '<div class="po-bar-bg"><div class="po-bar-fg" style="width:' + pct + '%"></div></div></div>';
  });
  const overall = count ? Math.round(total / count) : 0;
  wrap.innerHTML = '<div class="po-overall"><div class="po-big">' + overall + '%</div>'
    + '<div class="po-cap">overall curriculum complete<br>across all ' + count + ' tracks. Tap any track to jump in</div></div>' + rows;
}

function initProgress() {
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    const saved = LS.get(cb.id);
    if (saved !== null) { cb.checked = saved === 'true'; toggleCompletedState(cb); }
    cb.addEventListener('change', () => {
      LS.set(cb.id, cb.checked);
      toggleCompletedState(cb);
      updateLevelProgress(cb.dataset.level);
    });
  });
  LEVELS.forEach(updateLevelProgress);
  document.addEventListener('change', (e) => {
    if (e.target.classList && e.target.classList.contains('widget-checkbox')) renderOverview();
  });
  renderOverview();
}

/* ============================ resources =========================== */

const CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4 4 10-10"/></svg>';

// Exposed to inline onclick="toggleCollapse(this)".
function toggleCollapse(header) {
  const widget = header.parentElement;
  widget.classList.toggle('collapsed');
  if (widget.dataset.cid) LS.set('cp-collapse-' + widget.dataset.cid, widget.classList.contains('collapsed'));
}

function initCollapsibles() {
  document.querySelectorAll('.dashboard-widget').forEach((w, i) => {
    const sec = w.closest('.content-section');
    const cid = (sec ? sec.id : 'x') + '-dw-' + i;
    w.dataset.cid = cid;
    const saved = LS.get('cp-collapse-' + cid);
    if (saved === 'true') w.classList.add('collapsed');
    else if (saved === 'false') w.classList.remove('collapsed');
  });
}

function updateMarkBtn(det) {
  const b = det._markBtn; if (!b) return;
  b.textContent = det.classList.contains('res-done') ? 'Done \u2713' : 'Mark as done';
}
function updateResProgress(list) {
  const head = list._progHead; if (!head) return;
  const items = list.querySelectorAll(':scope > details.res');
  const done = list.querySelectorAll(':scope > details.res.res-done').length;
  const pct = items.length ? Math.round(done / items.length * 100) : 0;
  head.querySelector('.rp-fill').style.width = pct + '%';
  head.querySelector('.rp-count').textContent = done + '/' + items.length;
}
function setResDone(det, done, skipSave) {
  det.classList.toggle('res-done', done);
  updateMarkBtn(det);
  if (!skipSave) LS.set('cp-done-' + det.dataset.rid, done);
  const list = det.closest('.res-list'); if (list) updateResProgress(list);
}

function initResourceLists() {
  document.querySelectorAll('.content-section .res-list').forEach((list) => {
    const sec = list.closest('.content-section');
    const secId = sec ? sec.id : 'x';
    const items = Array.from(list.querySelectorAll(':scope > details.res'));
    if (!items.length) return;

    items.forEach((det, idx) => {
      const rid = 'res::' + secId + '::' + idx;
      det.dataset.rid = rid;

      const openSaved = LS.get('cp-open-' + rid);
      if (openSaved === 'true') det.open = true;
      else if (openSaved === 'false') det.open = false;
      det.addEventListener('toggle', () => LS.set('cp-open-' + rid, det.open));

      const summary = det.querySelector(':scope > summary');
      if (summary && !summary.querySelector('.res-done-toggle')) {
        const tog = document.createElement('button');
        tog.type = 'button'; tog.className = 'res-done-toggle';
        tog.setAttribute('aria-label', 'Mark resource as done');
        tog.innerHTML = CHECK_SVG;
        tog.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); setResDone(det, !det.classList.contains('res-done')); });
        summary.appendChild(tog);
      }

      const more = det.querySelector(':scope > .res-more');
      if (more && !more.dataset.enhanced) {
        more.dataset.enhanced = '1';
        const dose = more.querySelector('.res-dose');
        if (dose) {
          const clone = dose.cloneNode(true);
          const lbl = clone.querySelector('.rd-label'); if (lbl) lbl.remove();
          const raw = clone.textContent.replace(/\s+/g, ' ').trim();
          let plan = raw, doneWhen = '';
          const m = raw.match(/^(.*?)(?:done when|done once)\s+(.*)$/i);
          if (m) {
            plan = m[1].replace(/[.\s]+$/, '').trim();
            doneWhen = m[2].trim();
            doneWhen = doneWhen.charAt(0).toUpperCase() + doneWhen.slice(1);
          }
          const grid = document.createElement('div');
          grid.className = 'res-meta-grid';
          grid.innerHTML =
            '<div class="res-cell"><span class="rc-label">Practice plan</span><span class="rc-text">' + escHtml(plan) + '</span></div>' +
            (doneWhen ? '<div class="res-cell"><span class="rc-label">Done when</span><span class="rc-text">' + escHtml(doneWhen) + '</span></div>' : '');
          dose.replaceWith(grid);
        }
        const openLink = more.querySelector('.res-open');
        const foot = document.createElement('div');
        foot.className = 'res-foot';
        const markBtn = document.createElement('button');
        markBtn.type = 'button'; markBtn.className = 'res-mark-btn';
        markBtn.addEventListener('click', () => setResDone(det, !det.classList.contains('res-done')));
        if (openLink) { openLink.parentNode.insertBefore(foot, openLink); foot.appendChild(openLink); }
        else more.appendChild(foot);
        foot.appendChild(markBtn);
        det._markBtn = markBtn;
      }

      if (LS.get('cp-done-' + rid) === 'true') setResDone(det, true, true);
      else updateMarkBtn(det);
    });

    const head = document.createElement('div');
    head.className = 'res-list-head';
    head.innerHTML = '<span class="res-progress"><span class="rp-track"><span class="rp-fill"></span></span><span class="rp-count">0/' + items.length + '</span> done</span>';
    list.parentNode.insertBefore(head, list);
    list._progHead = head;
    updateResProgress(list);
  });
}

/* ============================ library ============================= */

function filterLibrary() {
  const search = document.getElementById('libSearch');
  const filter = document.getElementById('libFilter');
  const container = document.getElementById('libraryContainer');
  if (!search || !filter || !container) return;
  const sv = search.value.toLowerCase();
  const fv = filter.value;
  for (const c of container.getElementsByClassName('blueprint-card')) {
    const t = c.querySelector('.blueprint-title').innerText.toLowerCase();
    const d = c.querySelector('.blueprint-desc').innerText.toLowerCase();
    const cat = c.getAttribute('data-category');
    const okS = t.includes(sv) || d.includes(sv);
    const okC = fv === 'all' || cat === fv;
    c.style.display = (okS && okC) ? 'flex' : 'none';
  }
}

/* ============================== toc =============================== */

const CT_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="4.5" cy="6" r="1.1"/><circle cx="4.5" cy="12" r="1.1"/><circle cx="4.5" cy="18" r="1.1"/><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/></svg>';
const TOC_LANDMARKS = [
  ['.pillars', 'Guide'], ['.obj-tracker', 'Objectives'],
  ['.checkpoint-advance', 'Checkpoint'], ['.unlock-banner', 'Branch unlocked']
];

function closeDrawer() {
  const sb = document.getElementById('sidebar'), ov = document.getElementById('overlay');
  if (sb) sb.classList.remove('open');
  if (ov) ov.classList.remove('visible');
}

// Record the current heading in the hash (route format) without adding a
// history entry and without re-triggering the router.
function setHeadingHash(id) {
  const sec = document.querySelector('.content-section.active');
  if (!sec || sec.id === 'search-results') return;
  try { history.replaceState(null, '', routeUrl(sec.id, id)); } catch (e) {}
}

function getHeadings(sec) {
  const out = [], seen = {};
  const ensureId = (el, txt) => {
    if (!el.id) {
      let base = 'h-' + (sec.id || 'x') + '-' + slugify(txt), id = base, n = 2;
      while (seen[id] || document.getElementById(id)) id = base + '-' + (n++);
      seen[id] = 1; el.id = id;
    }
    return el.id;
  };
  sec.querySelectorAll('h2.section-heading').forEach(h => {
    const txt = h.textContent.trim(); if (!txt) return;
    out.push({ el: h, id: ensureId(h, txt), text: txt, level: 2 });
  });
  TOC_LANDMARKS.forEach(([sel, label]) => {
    const el = sec.querySelector(sel);
    if (el) out.push({ el, id: ensureId(el, label), text: label, level: 2 });
  });
  out.sort((a, b) => (a.el.compareDocumentPosition(b.el) & 4) ? -1 : 1);
  return out;
}

function gotoHeading(id, drawer) {
  const el = document.getElementById(id);
  if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); setHeadingHash(id); }
  if (drawer) closeDrawer();
}

function buildRail(headings) {
  const rail = document.getElementById('tocRail'); if (!rail) return;
  if (headings.length < 2) { rail.classList.add('empty'); rail.innerHTML = ''; return; }
  rail.classList.remove('empty');
  let html = '<div class="toc-rail-title">On this page</div>';
  headings.forEach(h => {
    html += '<a class="toc-link lvl' + h.level + '" href="#" data-tid="' + h.id + '">'
      + h.text.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</a>';
  });
  rail.innerHTML = html;
  rail.querySelectorAll('.toc-link').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); gotoHeading(a.dataset.tid, false); });
  });
}

function decorateNav(headings) {
  document.querySelectorAll('.nav-ct, .nav-toc').forEach(n => n.remove());
  const active = document.querySelector('.nav-item.active');
  if (!active || headings.length < 1) return;
  const ct = document.createElement('span');
  ct.className = 'nav-ct'; ct.setAttribute('role', 'button');
  ct.setAttribute('aria-label', 'Contents of this tab'); ct.innerHTML = CT_ICON;
  active.appendChild(ct);
  const toc = document.createElement('div');
  toc.className = 'nav-toc';
  headings.forEach(h => {
    const a = document.createElement('a');
    a.className = 'lvl' + h.level; a.href = '#'; a.textContent = h.text;
    a.addEventListener('click', e => { e.preventDefault(); gotoHeading(h.id, true); });
    toc.appendChild(a);
  });
  active.insertAdjacentElement('afterend', toc);
  ct.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); toc.classList.toggle('open'); });
}

export function refreshTOC() {
  const sec = document.querySelector('.content-section.active');
  const rail = document.getElementById('tocRail');
  if (!sec || sec.id === 'search-results') {
    if (rail) { rail.classList.add('empty'); rail.innerHTML = ''; }
    document.querySelectorAll('.nav-ct, .nav-toc').forEach(n => n.remove());
    return;
  }
  const headings = getHeadings(sec);
  buildRail(headings);
  decorateNav(headings);
}

export function initScrollSpy() {
  let raf = null, lastHash = '';
  window.addEventListener('scroll', () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = null;
      const rail = document.getElementById('tocRail');
      if (!rail || rail.classList.contains('empty')) return;
      const links = [...rail.querySelectorAll('.toc-link')];
      let cur = null;
      links.forEach(a => {
        const el = document.getElementById(a.dataset.tid);
        if (el && el.getBoundingClientRect().top <= 120) cur = a;
      });
      if (!cur && links.length) cur = links[0];
      links.forEach(a => a.classList.toggle('active', a === cur));
      if (cur && cur.dataset.tid !== lastHash) { lastHash = cur.dataset.tid; setHeadingHash(cur.dataset.tid); }
    });
  }, { passive: true });
}

/* ============================== init ============================== */

export function initContent() {
  initProgress();
  initCollapsibles();
  initResourceLists();
  window.toggleCollapse = toggleCollapse;
  window.filterLibrary = filterLibrary;
}
