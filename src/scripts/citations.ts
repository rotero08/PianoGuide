// src/scripts/citations.ts
// Citations are authored as `[8](/reference/library/#ref-8)`. On load each link is rewritten to
// the reference's stable slug anchor, relabelled with its current bibliography number, and given
// a `cite-<slug>-<n>` id so the bibliography's backlinks (rendered at build time) can jump back.

interface CitationData {
  numToSlug: Record<string, string>;
  slugToNumber: Record<string, number>;
}

function linkCitations(): void {
  const data = document.getElementById('citation-data');
  if (!data) return; // only emitted on pages that cite something
  const { numToSlug, slugToNumber }: CitationData = JSON.parse(data.textContent ?? '{}');
  const counts: Record<string, number> = {};

  document.querySelectorAll<HTMLAnchorElement>('a[href*="#ref-"]').forEach((link) => {
    const [path, hash = ''] = (link.getAttribute('href') ?? '').split('#');
    const ref = hash.replace(/^ref-/, '');
    const slug = numToSlug[ref] ?? ref.toLowerCase();

    counts[slug] = (counts[slug] ?? 0) + 1;
    link.id = `cite-${slug}-${counts[slug]}`;
    link.setAttribute('href', `${path}#ref-${slug}`);
    // Links authored with a slug keep their own label; numbered ones follow the bibliography order.
    if (ref in numToSlug && slugToNumber[slug]) link.textContent = `[${slugToNumber[slug]}]`;
  });
}

const BLOCK_TAGS = new Set(['P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DIV', 'TR', 'BLOCKQUOTE']);

/** Scrolls to the element named by the URL hash and flashes its enclosing block (see custom.css). */
function flashTarget(): void {
  const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (!target) return;

  let block: HTMLElement = target;
  while (block.parentElement && !BLOCK_TAGS.has(block.tagName)) block = block.parentElement;

  block.scrollIntoView({ behavior: 'smooth', block: 'center' });
  block.classList.remove('citation-flash');
  void block.offsetWidth; // restart the animation when the same target is hit twice
  block.classList.add('citation-flash');
  block.addEventListener('animationend', () => block.classList.remove('citation-flash'), { once: true });

  // Move keyboard focus to the target without leaving a focus ring behind.
  target.focus();
  setTimeout(() => target.blur(), 100);
}

linkCitations();
flashTarget();
window.addEventListener('hashchange', flashTarget);
