// app.js
// The orchestrator: it knows the list of tabs, loads each tab's HTML fragment,
// runs the hash router, handles the theme + mobile chrome, and boots every
// feature module once the content is in the DOM.

import { ready, LS, routeUrl, parseHash } from './util.js';
import { initContent, refreshTOC, initScrollSpy, setupBenchmarkPinning } from './content.js';
import { buildSectionNames, assignAnchors, performSearch, resetSearchUI } from './search.js';
import { initMedia } from './media.js';

// ---- Tab registry ---------------------------------------------------------
// Single source of truth. To add / remove / reorder a tab, edit this list and
// the matching file in /tabs. Nothing else needs to change.
export const TAB_ORDER = [
  'home', 'how-to-use', 'methodology', 'blueprint',
  'technique-1', 'technique-2',
  'pre-staff', 'level-0', 'level-1', 'level-2', 'level-3', 'level-4', 'level-5', 'level-6', 'level-7',
  'lead-sheets-l1', 'comp-patterns', 'jazz-resources', 'ear-training', 'reading-music',
  'rhythm-clefs', 'scales-chords', 'extra-resources',
  'references', 'about-guide', 'youtube'
];
const DEFAULT_TAB = 'home';
const isTab = id => TAB_ORDER.includes(id);
const ACTIVE_KEY = 'cp-active-section';

// Create a unique session timestamp on boot. Appending this to the template URLs 
// forces the browser to fetch fresh, complete copies of edited fragments instead 
// of serving truncated, broken cached copies from Firefox's disk cache.
const BOOT_TIME = Date.now();

// Resolve a fragment URL relative to the document root.
function fragmentUrl(id) {
  return `tabs/${id}.html?cb=${BOOT_TIME}`;
}

// Fetch every fragment sequentially and inject ONLY its <section>. Sequential loading
// prevents the browser from hitting HTTP/1.1 concurrent connection limits (maximum of 6)
// which causes queued fetches to time out and get aborted (DOMException) in Firefox.
async function loadAllTabs(mount) {
  const parser = new DOMParser();
  const parts = [];
  
  for (const id of TAB_ORDER) {
    try {
      const res = await fetch(fragmentUrl(id));
      if (!res.ok) throw new Error(res.status + '');
      const doc = parser.parseFromString(await res.text(), 'text/html');
      
      // Strict check: find the specific section matching this tab's id.
      // This prevents capturing generic or incorrect layout sections (like search-results)
      // if a server configuration rewrites or redirects a missing asset to index.html.
      const sec = doc.getElementById(id) || 
                  doc.querySelector(`section#${id}`) || 
                  doc.querySelector(`section.content-section[id="${id}"]`);
                  
      if (sec) {
        parts.push(sec.outerHTML);
      } else {
        throw new Error('no matching section found');
      }
    } catch (e) {
      console.error(`Tab "${id}" failed to load:`, e);
      parts.push(`<section id="${id}" class="content-section"><h1>${id}</h1>` +
                 `<p>This tab could not be loaded. Make sure the site is opened ` +
                 `through your local server.</p></section>`);
    }
  }
  
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

  // Unified synchronization point: updates the levels pinning state, progress values,
  // and checkbox caches dynamically after routing is established.
  if (typeof window.initializeTabState === 'function') {
    window.initializeTabState();
  }

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
  // Expose globals immediately so that any early clicks (e.g. while templates are loading)
  // do not throw "ReferenceError: switchSection is not defined".
  exposeGlobals();
  initShortcuts();

  // Load tabs sequentially to completely avoid hitting the browser's HTTP/1.1 limit
  // of 6 concurrent connections per domain. This prevents network congestion and 
  // eliminates "DOMException: The operation was aborted" errors in Firefox.
  await loadAllTabs(document.getElementById('tab-mount'));

  buildSectionNames();
  assignAnchors();
  initContent();   // progress, collapsibles/resources, library filter, TOC
  initMedia();     // audio keyboard, intro chord, tooltips
  initTheme();

  initRoute();
  initScrollSpy();
});

// Global Piano Guide Controller & Dynamic Interaction Engine
(function() {
    // 1. Event Delegation for Checkbox Changes (main checklist & benchmark list checkboxes)
    document.addEventListener('change', function(e) {
        if (e.target && e.target.type === 'checkbox') {
            const cb = e.target;
            localStorage.setItem(cb.id, cb.checked);
            
            // Highlight row if completed
            const row = cb.closest('.obj-row, .uv-checkbox-row, .uv-bench-item');
            if (row) {
                if (cb.checked) {
                    row.classList.add('completed');
                } else {
                    row.classList.remove('completed');
                }
            }

            // Update level progress automatically
            const levelId = cb.getAttribute('data-level');
            if (levelId) {
                updateProgress(levelId);
            }
        }
    });

    // 2. Event Delegation for Done Toggles on Resources
    document.addEventListener('click', function(e) {
        const toggle = e.target.closest('.res-done-toggle');
        if (toggle) {
            e.stopPropagation();
            e.preventDefault();
            const res = toggle.closest('.res');
            if (res) {
                const resId = res.getAttribute('data-res-id');
                const isDone = !res.classList.contains('res-done');
                res.classList.toggle('res-done', isDone);
                localStorage.setItem(`cp-res-done-${resId}`, isDone);
            }
        }
    });

    // 3. Setup Observers & Listeners to Capture Tab Injections
    const mount = document.getElementById('tab-mount');
    if (mount) {
        const observer = new MutationObserver(() => initializeTabState());
        observer.observe(mount, { childList: true });
    }

    window.addEventListener('DOMContentLoaded', initializeTabState);
    window.addEventListener('hashchange', initializeTabState);

    // Make initializeTabState globally accessible so it can be safely called during route triggers
    window.initializeTabState = initializeTabState;

    function initializeTabState() {
        const activeTabSection = document.querySelector('.content-section.active');
        if (!activeTabSection) return;
        const tabId = activeTabSection.id;

        // Restore Checkbox States
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        const levelsToUpdate = new Set();
        checkboxes.forEach(cb => {
            const saved = localStorage.getItem(cb.id);
            if (saved !== null) {
                cb.checked = saved === 'true';
                const row = cb.closest('.obj-row, .uv-checkbox-row, .uv-bench-item');
                if (row) {
                    if (cb.checked) row.classList.add('completed');
                    else row.classList.remove('completed');
                }
            }
            const levelId = cb.getAttribute('data-level');
            if (levelId) levelsToUpdate.add(levelId);
        });

        // Restore Resource Done States
        document.querySelectorAll('.res').forEach(res => {
            const resId = res.getAttribute('data-res-id');
            if (resId) {
                const isDone = localStorage.getItem(`cp-res-done-${resId}`) === 'true';
                res.classList.toggle('res-done', isDone);
            }
        });

        // Update active progress percentages
        levelsToUpdate.forEach(levelId => updateProgress(levelId));

        // Render and Align Pinning Mechanics
        initializePinning(tabId, activeTabSection);
        setupBenchmarkPinning(activeTabSection);
    }

    function updateProgress(levelId) {
        const checkboxes = document.querySelectorAll(`input[data-level="${levelId}"]`);
        if (checkboxes.length === 0) return;
        
        let checkedCount = 0;
        checkboxes.forEach(cb => {
            if (cb.checked) checkedCount++;
        });

        const pct = Math.round((checkedCount / checkboxes.length) * 100);

        // Update elements in active viewport
        const pctText = document.getElementById(`percent-${levelId}`);
        const progressFill = document.getElementById(`progress-${levelId}`);
        
        if (pctText) pctText.textContent = `${pct}%`;
        if (progressFill) progressFill.style.width = `${pct}%`;

        localStorage.setItem(`progress-pct-${levelId}`, pct);
        
        // Live updates for home/intro navigation dashboards
        renderCurriculumOverview();
    }

    // Pinning and Swapping Engine
    function initializePinning(tabId, activeTabSection) {
        // Strictly target only resources belonging to the reading pillar (which holds the alternatives drawer)
        const readingPillar = activeTabSection.querySelector('.pillar.reading');
        if (!readingPillar) return;

        const mainResList = readingPillar.querySelector('.res-list');
        const altDrawer = activeTabSection.querySelector('.alternatives-drawer');
        if (!mainResList || !altDrawer) return;

        const altResList = altDrawer.querySelector('.res-list');
        if (!altResList) return;

        const savedKey = `cp-pinned-res-${tabId}`;
        let pinnedIds = JSON.parse(localStorage.getItem(savedKey));
        const allRes = Array.from(readingPillar.querySelectorAll('.res'));

        // Cache original parent list containers to prevent different pillar items
        // from crossing over or getting emptied [1.4].
        allRes.forEach(res => {
            if (!res._originalParent) {
                const parent = res.parentElement;
                if (parent && !parent.closest('.alternatives-drawer')) {
                    res._originalParent = parent;
                } else {
                    // Fallback to main reading list container if it was initially inside alternatives drawer [1.4]
                    res._originalParent = mainResList;
                }
            }
        });

        // Establish default pinning parameters if none exist in localStorage
        if (!pinnedIds) {
            pinnedIds = allRes
                .filter(el => el.getAttribute('data-pinned') === 'true')
                .map(el => el.getAttribute('data-res-id'));
            localStorage.setItem(savedKey, JSON.stringify(pinnedIds));
        }

        allRes.forEach(res => {
            const resId = res.getAttribute('data-res-id');
            const isPinned = pinnedIds.includes(resId);
            res.setAttribute('data-pinned', isPinned ? 'true' : 'false');

            const summary = res.querySelector('summary');
            if (summary) {
                let controls = summary.querySelector('.res-controls');
                if (!controls) {
                    controls = document.createElement('div');
                    controls.className = 'res-controls';
                    summary.appendChild(controls);
                }

                if (!controls.querySelector('.res-pin-btn')) {
                    const pinBtn = document.createElement('button');
                    pinBtn.type = 'button';
                    pinBtn.className = 'res-pin-btn';
                    pinBtn.title = 'Pin or unpin this resource';
                    pinBtn.style.margin = '0'; // Clear margins
                    
                    pinBtn.innerHTML = `
                        <svg class="pin-icon-on" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.1" aria-hidden="true" style="pointer-events: none;">
                            <line x1="12" y1="17" x2="12" y2="22"></line>
                            <path d="M5 17h14v-1.76a2 2 0 0 0-.44-1.24l-2.33-2.71A1 1 0 0 1 15.5 10.5V5a1 1 0 0 0-1-1h-5a1 1 0 0 0-1 1v5.5a1 1 0 0 1-.73.74l-2.33 2.71a2 2 0 0 0-.44 1.24V17z"></path>
                        </svg>
                        <svg class="pin-icon-off" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.1" aria-hidden="true" style="pointer-events: none; display: none;">
                            <line x1="12" y1="17" x2="12" y2="22"></line>
                            <path d="M5 17h14v-1.76a2 2 0 0 0-.44-1.24l-2.33-2.71A1 1 0 0 1 15.5 10.5V5a1 1 0 0 0-1-1h-5a1 1 0 0 0-1 1v5.5a1 1 0 0 1-.73.74l-2.33 2.71a2 2 0 0 0-.44 1.24V17z"></path>
                            <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" stroke-width="2.5"></line>
                        </svg>
                    `;

                    const doneToggle = controls.querySelector('.res-done-toggle');
                    if (doneToggle) {
                        controls.insertBefore(pinBtn, doneToggle);
                    } else {
                        controls.appendChild(pinBtn);
                    }

                    pinBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        e.preventDefault();
                        togglePin(tabId, resId, activeTabSection);
                    });
                }
            }

            const pinBtn = res.querySelector('.res-pin-btn');
            if (pinBtn) {
                pinBtn.title = isPinned ? 'Unpin from main list' : 'Pin to main list';
            }

            // Physically move elements into the correct list container
            if (isPinned) {
                if (res._originalParent && res.parentElement !== res._originalParent) {
                    res._originalParent.appendChild(res);
                }
            } else {
                if (res.parentElement !== altResList) {
                    altResList.insertBefore(res, altResList.firstChild);
                }
            }
        });

        // Hide alternatives drawer if there are no unpinned items
        altDrawer.style.display = altResList.children.length === 0 ? 'none' : 'block';
    }

    function togglePin(tabId, resId, activeTabSection) {
        const savedKey = `cp-pinned-res-${tabId}`;
        let pinnedIds = JSON.parse(localStorage.getItem(savedKey)) || [];
        const index = pinnedIds.indexOf(resId);
        
        if (index > -1) {
            pinnedIds.splice(index, 1); // Unpin and move to alternatives
        } else {
            pinnedIds.push(resId); // Pin and restore to main list
        }
        
        localStorage.setItem(savedKey, JSON.stringify(pinnedIds));
        initializePinning(tabId, activeTabSection);
    }

    // Dynamic Curriculum Progress Grid Renderer
    function renderCurriculumOverview() {
        const overviewContainer = document.getElementById('curriculumOverview');
        if (!overviewContainer) return;

        const levels = [
            { id: 'tech1', name: 'Technique 1: Posture & Arm Weight' },
            { id: 'tech2', name: 'Technique 2: Hand Shapes' },
            { id: 'prestaff', name: 'Pre-Staff: Arm Weight & Ear' },
            { id: 'lvl0', name: 'Level 0: Linear Reading' },
            { id: 'lvl1', name: 'Level 1: Intervals & Chords' },
            { id: 'lvl2', name: 'Level 2: Voices & Geometry' },
            { id: 'lvl3', name: 'Level 3: Positional Shifting' },
            { id: 'lvl4', name: 'Level 4: Inversions & Speed' },
            { id: 'lvl5', name: 'Level 5: Early Polyphony' },
            { id: 'lvl6', name: 'Level 6: Phrasing & Counterpoint' },
            { id: 'lvl7', name: 'Level 7: Polytonal Independence' }
        ];

        let html = '';
        levels.forEach(lvl => {
            const pct = localStorage.getItem(`progress-pct-${lvl.id}`) || 0;
            html += `
                <div class="po-row" onclick="switchSection('${lvl.id}')">
                    <div class="po-top">
                        <span class="po-name">${lvl.name}</span>
                        <span class="po-pct">${pct}%</span>
                    </div>
                    <div class="po-bar-bg">
                        <div class="po-bar-fg" style="width: ${pct}%"></div>
                    </div>
                </div>
            `;
        });
        overviewContainer.innerHTML = html;
    }
})();
