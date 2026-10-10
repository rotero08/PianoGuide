// src/scripts/toc.ts
//
// "On this page" marks the heading that is passing under the site header. That leaves two cases
// where the marked entry is not where the reader is:
//
//   - The last sections of a page are often too short to ever get that far up, so the mark
//     stops a few entries short of the end. Here the last entry is marked once the page is
//     scrolled to its end.
//   - A clicked entry is scrolled to the middle of the window (scripts/citations.ts does that
//     for every #target), not under the header. Here the clicked entry stays marked until the
//     reader scrolls again.

/** Starlight's table of contents (desktop and mobile): assigning `current` moves the mark. */
type Toc = HTMLElement & { current: HTMLAnchorElement };

/** At the end of a page that actually scrolls; a page that fits the window stays on its first entry. */
const atEnd = () => window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8;

function follow(toc: Toc) {
  const last = [...toc.querySelectorAll('a')].at(-1);
  if (!last) return;

  let clicked: HTMLAnchorElement | null = null; // the entry the reader clicked, until they scroll again
  let jumping: ReturnType<typeof setTimeout> | undefined; // set while the scroll that follows a click is under way
  let kept: HTMLAnchorElement | null = null; // the entry this script is keeping marked
  let before: HTMLAnchorElement | null = null; // what Starlight had marked when the end was reached

  const update = () => {
    const current = toc.querySelector<HTMLAnchorElement>('a[aria-current="true"]');
    const wanted = clicked ?? (atEnd() ? last : null);
    if (wanted) {
      if (!kept) before = current;
      kept = wanted;
      if (current !== wanted) toc.current = wanted;
    } else if (kept) {
      // Scrolling back up from the end: hand the mark back, unless Starlight has already moved it.
      if (kept === last && current === last && before) toc.current = before;
      kept = null;
    }
  };

  /** The jump is over once no scroll event has arrived for a moment. */
  const settle = () => {
    clearTimeout(jumping);
    jumping = setTimeout(() => (jumping = undefined), 250);
  };

  toc.addEventListener('click', (event) => {
    const link = (event.target as Element).closest('a');
    if (!link) return;
    clicked = link;
    settle();
    update();
  });
  addEventListener(
    'scroll',
    () => {
      if (jumping) settle();
      else clicked = null; // the reader is scrolling by themselves again
      update();
    },
    { passive: true },
  );
  addEventListener('resize', update);
  // Starlight moves the mark from an observer that can fire after the last scroll event.
  new MutationObserver(update).observe(toc, { subtree: true, attributeFilter: ['aria-current'] });
  update();
}

for (const name of ['starlight-toc', 'mobile-starlight-toc']) {
  customElements.whenDefined(name).then(() => document.querySelectorAll<Toc>(name).forEach(follow));
}
