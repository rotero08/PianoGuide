// app.js
// The orchestrator: it knows the list of tabs, loads each tab's HTML fragment,
// runs the hash router, handles the theme + mobile chrome, and boots every
// feature module once the content is in the DOM.

import { ready, LS, routeUrl, parseHash } from './util.js';
import { initContent, refreshTOC, initScrollSpy } from './content.js';
import { buildSectionNames, assignAnchors, performSearch, resetSearchUI } from './search.js';
import { initMedia } from './media.js';

// ---- Tab registry ---------------------------------------------------------
// Single source of truth. To add / remove / reorder a tab, edit this list and
// the matching file in /tabs. Nothing else needs to change.
export const TAB_ORDER = [
  'home', 'how-to-use', 'methodology', 'blueprint', 'pre-staff',
  'level-0', 'level-1', 'level-2', 'level-3', 'level-4', 'level-5', 'level-6', 'level-7',
  'lead-sheets-l1', 'comp-patterns', 'jazz-resources', 'ear-training', 'reading-music',
  'decoding', 'rhythm-clefs', 'scales-chords', 'piano-technique', 'extra-resources',
  'references', 'about-guide', 'youtube'
];
const DEFAULT_TAB = 'home';
const isTab = id => TAB_ORDER.includes(id);
const ACTIVE_KEY = 'cp-active-section';

// Resolve a fragment URL relative to THIS module, so it works regardless of
// the current hash (the hash never changes the document path).
function fragmentUrl(id) {
  return new URL(`../tabs/${id}.html`, import.meta.url).href;
}

// Fetch every fragment up front and inject ONLY its <section>. Parsing through
// DOMParser and taking the section element discards anything a dev server may
// have appended to the file (e.g. Live Server's live-reload <script>), so that
// injected code can never pollute search results or corrupt the page.
async function loadAllTabs(mount) {
  const parser = new DOMParser();
  const parts = await Promise.all(TAB_ORDER.map(async (id) => {
    try {
      const res = await fetch(fragmentUrl(id));
      if (!res.ok) throw new Error(res.status + '');
      const doc = parser.parseFromString(await res.text(), 'text/html');
      const sec = doc.querySelector('section.content-section') || doc.getElementById(id);
      if (sec) return sec.outerHTML;
      throw new Error('no section');
    } catch (e) {
      console.error(`Tab "${id}" failed to load:`, e);
      return `<section id="${id}" class="content-section"><h1>${id}</h1>` +
             `<p>This tab could not be loaded. Make sure the site is opened ` +
             `through your local server.</p></section>`;
    }
  }));
  mount.innerHTML = parts.join('\n');
}

// ---- Theme ----------------------------------------------------------------
const ICON_MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 1 1 9.6 4 6.3 6.3 0 0 0 20 14.5Z"/></svg>';
const ICON_SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/></svg>';
const ICON_SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>';

function setIcons(isDark) {
  const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
  set('toggleIcon', isDark ? ICON_MOON : ICON_SUN);
  set('toggleIconMobile', isDark ? ICON_SUN : ICON_MOON);
  set('searchIconMobile', ICON_SEARCH);
  set('searchIconDesktop', ICON_SEARCH);
}
function initTheme() {
  setIcons(document.documentElement.getAttribute('data-theme') !== 'light');
}
function toggleTheme() {
  const html = document.documentElement;
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  setIcons(next === 'dark');
  LS.set('cp-theme', next);
}

// ---- Mobile chrome --------------------------------------------------------
function toggleSidebar() {
  const sb = document.getElementById('sidebar'), ov = document.getElementById('overlay');
  const open = sb.classList.toggle('open');
  if (ov) ov.classList.toggle('visible', open);
}
function closeSidebar() {
  const sb = document.getElementById('sidebar'), ov = document.getElementById('overlay');
  if (sb) sb.classList.remove('open');
  if (ov) ov.classList.remove('visible');
}
function toggleMobileSearch() {
  const t = document.getElementById('topbar');
  if (!t) return;
  t.classList.toggle('open');
  if (t.classList.contains('open')) setTimeout(() => { const i = document.getElementById('global-search'); if (i) i.focus(); }, 50);
}
function closeMobileSearch() {
  const t = document.getElementById('topbar');
  if (t) t.classList.remove('open');
}

// ---- Router ---------------------------------------------------------------
function setActiveNav(sectionId) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const btn = Array.from(document.querySelectorAll('.nav-item'))
    .find(b => (b.getAttribute('onclick') || '').includes("'" + sectionId + "'"));
  if (btn) btn.classList.add('active');
}

// Show a tab. Does NOT touch the URL itself — the hash is the trigger, this is
// the effect. Used by applyRoute.
function showTab(sectionId, { scroll = true, save = true } = {}) {
  if (!isTab(sectionId)) return;
  if (save) LS.set(ACTIVE_KEY, sectionId);
  setActiveNav(sectionId);
  document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(sectionId);
  if (target) target.classList.add('active');
  resetSearchUI();
  closeSidebar();
  closeMobileSearch();
  refreshTOC();
  if (scroll) window.scrollTo({ top: 0, behavior: 'instant' });
}

// Scroll an element into view (opening any collapsed container it lives in)
// and optionally flash it. Shared by deep links and search jumps.
export function revealTarget(id, { flash = false } = {}) {
  const el = id && document.getElementById(id);
  if (!el) return;
  const det = el.closest && el.closest('details.res, .dashboard-widget');
  if (det) { if (det.tagName === 'DETAILS') det.open = true; else det.classList.remove('collapsed'); }
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  if (flash) { el.classList.add('search-flash'); setTimeout(() => el.classList.remove('search-flash'), 2300); }
}

function pickInitialTab() {
  const saved = LS.get(ACTIVE_KEY);
  return (saved && isTab(saved)) ? saved : DEFAULT_TAB;
}

// Read the current hash and make the page match it.
function applyRoute({ scroll = true } = {}) {
  const r = parseHash();
  if (r.kind === 'search') {
    const input = document.getElementById('global-search');
    if (input) input.value = r.q;
    performSearch(r.q);
    return;
  }
  const tab = (r.tab && isTab(r.tab)) ? r.tab : pickInitialTab();
  showTab(tab, { scroll: scroll && !r.target });
  if (r.target) setTimeout(() => revealTarget(r.target, { flash: true }), 80);
}

// Public navigation entry: inline onclick="switchSection('x')" and the logo
// call this. It just sets the hash; the hashchange listener does the work.
function switchSection(sectionId) {
  const h = routeUrl(sectionId);
  if (location.hash === h) applyRoute();      // same hash won't fire hashchange
  else location.hash = h;
}

function initRoute() {
  applyRoute({ scroll: false });
  // Normalise an empty hash to the resolved tab, so the bar is shareable.
  if (!location.hash) {
    try { history.replaceState(null, '', routeUrl(pickInitialTab())); } catch (e) {}
  }
  window.addEventListener('hashchange', () => applyRoute({ scroll: true }));
}

// ---- Globals for inline HTML handlers -------------------------------------
function exposeGlobals() {
  window.switchSection = switchSection;
  window.toggleTheme = toggleTheme;
  window.toggleSidebar = toggleSidebar;
  window.closeSidebar = closeSidebar;
  window.toggleMobileSearch = toggleMobileSearch;
  window.performSearch = (v) => performSearch(v);
  window.clearSearch = clearSearch;
  // toggleCollapse + filterLibrary are exposed by content.js (it owns them).
}

function clearSearch() {
  const input = document.getElementById('global-search');
  if (input) input.value = '';
  // Drop back to the last real tab.
  switchSection(pickInitialTab());
}

function initShortcuts() {
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const tb = document.getElementById('topbar');
      if (tb && getComputedStyle(tb).display === 'none') tb.classList.add('open');
      const input = document.getElementById('global-search');
      if (input) { input.focus(); input.select(); }
    }
    if (e.key === 'Escape') {
      const input = document.getElementById('global-search');
      if (input && document.activeElement === input && input.value) clearSearch();
    }
  });
}

// ---- Boot -----------------------------------------------------------------
ready(async () => {
  await loadAllTabs(document.getElementById('tab-mount'));

  buildSectionNames();
  assignAnchors();
  initContent();   // progress, collapsibles/resources, library filter, TOC
  initMedia();     // audio keyboard, intro chord, tooltips
  initTheme();

  exposeGlobals();
  initShortcuts();
  initRoute();
  initScrollSpy();
});
