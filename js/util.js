// util.js
// Shared primitives used everywhere: tiny DOM/string helpers plus a safe
// localStorage wrapper. Kept in one place so the feature modules below don't
// each reinvent them.

export function escHtml(s) {
  return String(s).replace(/[&<>"]/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));
}

export function slugify(t) {
  return String(t)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 50);
}

// Run a callback once the DOM is parsed.
export function ready(fn) {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
}

// localStorage can throw (private mode, disabled storage), so every call is
// guarded. This is what makes the theme, the open tab, and progress persist.
export const LS = {
  get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch (e) {} },
  del(key) { try { localStorage.removeItem(key); } catch (e) {} }
};

// ---- Hash-based routing ---------------------------------------------------
// Everything lives in the URL hash so the page works on any plain static
// server (Live Server, python -m http.server, GitHub Pages...) and survives a
// reload: the server only ever sees the path "/", never "/level-1".
//
//   #/level-1              -> the Level 1 tab
//   #/level-1/m-level-1-7  -> that tab, scrolled to + flashing a target
//   #/q/triad              -> a search for "triad"

export function routeUrl(tab, target) {
  return '#/' + tab + (target ? '/' + encodeURIComponent(target) : '');
}

export function searchUrl(q) {
  return '#/q/' + encodeURIComponent(q);
}

export function parseHash() {
  const raw = (location.hash || '').replace(/^#\/?/, '');
  if (raw === '') return { kind: 'tab', tab: null, target: '' };
  if (raw.slice(0, 2) === 'q/') return { kind: 'search', q: decodeURIComponent(raw.slice(2)) };
  const slash = raw.indexOf('/');
  if (slash === -1) return { kind: 'tab', tab: raw, target: '' };
  return { kind: 'tab', tab: raw.slice(0, slash), target: decodeURIComponent(raw.slice(slash + 1)) };
}
