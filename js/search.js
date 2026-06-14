// search.js
// Full-text search across every tab. Results are plain deep-link anchors:
//   - in-page match    -> href="#/<tab>/<target>". Left-click changes the hash
//     and the router jumps + flashes the match in place; middle-click /
//     Ctrl-click / "Open in new tab" open that same hash in a new browser tab,
//     which loads already centered on the match.
//   - external resource -> the resource URL, opened in a new tab.
// Because the links are declarative, search needs no router import (and there
// is no module cycle): the hashchange handler in app.js does all the work.

import { escHtml, routeUrl, searchUrl, LS } from './util.js';

const SNIP_SELECTOR = 'p,li,h1,h2,h3,h4,h5,summary,.card-desc,.card-title,.blueprint-desc,.blueprint-title,.row-desc,.row-title,.obj-desc,.obj-title,.res-tagline,.res-name,.rc-text,.grade-pill,.board-card div,td';

// Friendly tab names, read from the sidebar nav.
const SECTION_NAMES = {};
export function buildSectionNames() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    const m = (btn.getAttribute('onclick') || '').match(/switchSection\('([^']+)'\)/);
    if (m) SECTION_NAMES[m[1]] = btn.textContent.trim();
  });
}

// Give every snippet-eligible element a stable, position-based id so deep
// links resolve even on a cold page load. Deterministic because the fragments
// are static and always injected in the same order.
export function assignAnchors() {
  document.querySelectorAll('.content-section:not(#search-results)').forEach(sec => {
    let n = 0;
    sec.querySelectorAll(SNIP_SELECTOR).forEach(el => {
      const id = 'm-' + sec.id + '-' + n; n++;
      if (!el.id) el.id = id;
    });
  });
}

function highlight(text, q) {
  const out = [], lc = text.toLowerCase(), lq = q.toLowerCase();
  let i = 0, idx;
  while ((idx = lc.indexOf(lq, i)) !== -1) {
    out.push(escHtml(text.slice(i, idx)));
    out.push('<mark>' + escHtml(text.slice(idx, idx + q.length)) + '</mark>');
    i = idx + q.length;
  }
  out.push(escHtml(text.slice(i)));
  return out.join('');
}

function snippetFor(text, q) {
  text = text.replace(/\s+/g, ' ').trim();
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return highlight(text.slice(0, 150), q);
  const start = Math.max(0, idx - 60);
  const end = Math.min(text.length, idx + q.length + 90);
  const snip = (start > 0 ? '\u2026 ' : '') + text.slice(start, end) + (end < text.length ? ' \u2026' : '');
  return highlight(snip, q);
}

function headingFor(el, section) {
  let cur = el;
  while (cur && cur !== section) {
    let sib = cur.previousElementSibling;
    while (sib) {
      if (/^H[1-4]$/.test(sib.tagName)) return sib.textContent.trim();
      const h = sib.querySelector && sib.querySelector('h1,h2,h3,h4');
      if (h) return h.textContent.trim();
      sib = sib.previousElementSibling;
    }
    cur = cur.parentElement;
  }
  return '';
}

function collectMatches(section, q) {
  const lq = q.toLowerCase();
  const seen = new Set();
  const matches = [];
  const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      // Skip any stray script/style text defensively (fragments are already
      // cleaned on load, so this should never match — belt and braces).
      const p = node.parentNode;
      if (p && (p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE')) return NodeFilter.FILTER_REJECT;
      return (node.nodeValue && node.nodeValue.trim()) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.nodeValue.toLowerCase().includes(lq)) {
      const container = node.parentElement.closest(SNIP_SELECTOR) || node.parentElement;
      if (seen.has(container)) continue;
      seen.add(container);
      matches.push(container);
    }
  }
  return matches;
}

export function performSearch(query) {
  const section = document.getElementById('search-results');
  const grid = document.getElementById('search-results-grid');
  const mainSections = document.querySelectorAll('.content-section:not(#search-results)');
  const clearBtn = document.getElementById('clear-search-btn');
  const countEl = document.getElementById('search-count');
  const introEl = section ? section.querySelector('p') : null;
  if (!section || !grid) return;

  // Empty query -> leave the search view, returning to the last real tab.
  if (!query.trim()) {
    resetSearchUI();
    const saved = LS.get('cp-active-section') || 'home';
    const back = routeUrl(saved);
    if (location.hash !== back) location.hash = back;   // routes via hashchange
    return;
  }

  const q = query.trim();
  if (clearBtn) clearBtn.style.display = 'block';
  mainSections.forEach(s => s.classList.remove('active'));
  section.classList.add('active');
  grid.innerHTML = '';
  if (introEl) introEl.style.display = 'none';
  // Reflect the query in the hash without spamming history or re-routing.
  try { history.replaceState(null, '', searchUrl(q)); } catch (e) {}

  let total = 0;
  mainSections.forEach(sec => {
    const matches = collectMatches(sec, q);
    if (!matches.length) return;
    const secId = sec.id;
    const name = SECTION_NAMES[secId] || (sec.querySelector('h1') ? sec.querySelector('h1').textContent.trim() : secId);

    const group = document.createElement('div');
    group.className = 'sr-group';
    const head = document.createElement('div');
    head.className = 'sr-group-head';
    head.innerHTML = '<span class="sr-group-name"><span class="sr-sec-badge">Tab</span>' + escHtml(name) +
      '</span><span class="sr-group-count">' + matches.length + ' match' + (matches.length > 1 ? 'es' : '') + '</span>';
    group.appendChild(head);

    matches.forEach(container => {
      total++;
      const where = headingFor(container, sec);

      // Prefer an external resource link if the match sits inside one.
      let resUrl = '';
      const resEl = container.closest && container.closest('details.res');
      if (resEl) {
        const a = resEl.querySelector('a.res-open[href^="http"]') || resEl.querySelector('.res-more a[href^="http"]');
        if (a) resUrl = a.href;
      }
      if (!resUrl && container.querySelector) {
        const a2 = container.querySelector('a[href^="http"]');
        if (a2) resUrl = a2.href;
      }

      const item = document.createElement('a');
      item.className = 'sr-item sr-item-link';
      if (resUrl) {
        item.href = resUrl; item.target = '_blank'; item.rel = 'noopener';
      } else {
        if (!container.id) container.id = 'm-' + secId + '-x' + total;
        // Declarative deep link: the router handles every kind of click.
        item.href = routeUrl(secId, container.id);
      }

      item.innerHTML =
        '<span class="sr-arrow">' + (resUrl ? '\u2197' : '\u21b5') + '</span>' +
        '<span class="sr-where">in ' + escHtml(name) + (where ? ' \u203a ' + escHtml(where) : '') + '</span>' +
        '<span class="sr-snippet">' + snippetFor(container.textContent, q) + '</span>';
      group.appendChild(item);
    });
    grid.appendChild(group);
  });

  if (total === 0) {
    grid.innerHTML = '<p class="sr-empty">No matches for "' + escHtml(q) + '" anywhere in the guide. Try a shorter or different term.</p>';
  }
  if (countEl) countEl.textContent = 'Found ' + total + ' result' + (total !== 1 ? 's' : '') + ' for "' + q + '"';
}

// Hide the search view's chrome without routing (called when a tab opens).
export function resetSearchUI() {
  const section = document.getElementById('search-results');
  if (section) {
    section.classList.remove('active');
    const intro = section.querySelector('p');
    if (intro) intro.style.display = '';
  }
  const clearBtn = document.getElementById('clear-search-btn');
  if (clearBtn) clearBtn.style.display = 'none';
}
