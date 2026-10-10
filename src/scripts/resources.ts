// src/scripts/resources.ts
// Behaviour for <Resource> drawers and stand-alone benchmark cards: marking items done, and
// pinning alternatives in and out of their <ResourceColumn>. One delegated listener serves
// every instance on the page; state lives in localStorage (see store.ts).
import { DONE, PINNED, paintProgress, percent, readFlags, setFlag, type Flags } from './store';

const ROW = '.resource-row-container';
/** Benchmark cards inside a <BenchmarkSelector> are owned by benchmarks.ts, not this module. */
const LONE_BENCH = '.uv-bench-item:not(.benchmark-selector-wrapper .uv-bench-item)';

const all = <T extends HTMLElement = HTMLElement>(selector: string, root: ParentNode = document) =>
  [...root.querySelectorAll<T>(selector)];

/** An alternative counts as pinned if the reader said so, or by default when it was authored in the main list. */
function isPinned(row: HTMLElement, pinned: Flags): boolean {
  const id = row.dataset.resId!;
  return id in pinned ? !!pinned[id] : row.dataset.home === 'main';
}

function paintDone(done: Flags): void {
  for (const row of all(ROW)) {
    const isDone = !!done[row.dataset.resId!];
    row.classList.toggle('done', isDone);
    const check = row.querySelector('.res-done-checkbox');
    check?.classList.toggle('checked', isDone);
    check?.setAttribute('aria-pressed', String(isDone));
    const mark = row.querySelector('.res-mark-btn');
    mark?.classList.toggle('completed', isDone);
    if (mark) mark.textContent = isDone ? 'Done ✓' : 'Mark as done';
  }
  for (const card of all(LONE_BENCH)) {
    const isDone = !!done[card.dataset.benchId!];
    card.classList.toggle('completed', isDone);
    const box = card.querySelector<HTMLInputElement>('.bench-done-checkbox');
    if (box) box.checked = isDone;
  }
}

/** Moves each alternative to where its pin state says it belongs, then recounts the column. */
function layoutColumn(column: HTMLElement, pinned: Flags, done: Flags): void {
  const list = column.querySelector<HTMLElement>('.res-list-container');
  if (!list) return;
  const altBox = column.querySelector<HTMLElement>('.alternatives-wrapper');
  const altList = column.querySelector<HTMLElement>('.alternatives-list-container');

  if (altBox && altList) {
    const alternatives = all(`${ROW}[data-is-alternative="true"]`, column);
    for (const row of alternatives) {
      // Remember where the author put it, before anything moves.
      row.dataset.home ??= altList.contains(row) ? 'alt' : 'main';
      const rowPinned = isPinned(row, pinned);
      if (rowPinned && row.parentElement !== list) list.insertBefore(row, altBox);
      if (!rowPinned && row.parentElement !== altList) altList.append(row);
      row.querySelector('.pin-btn')?.classList.toggle('active', rowPinned);
    }

    // Recommended alternatives first, then alphabetical by id.
    all(ROW, altList)
      .sort((a, b) =>
        Number(b.dataset.isRecommended === 'true') - Number(a.dataset.isRecommended === 'true') ||
        a.dataset.resId!.localeCompare(b.dataset.resId!))
      .forEach((row) => altList.append(row));

    // Nothing left to offer once every alternative authored inside the box has been pinned out.
    const boxed = alternatives.filter((row) => row.dataset.home === 'alt');
    altBox.hidden = boxed.length > 0 && boxed.every((row) => isPinned(row, pinned));

    const altRows = all(ROW, altList);
    const altDone = altRows.filter((row) => done[row.dataset.resId!]).length;
    paintProgress(altBox.querySelector('.alt-progress-wrapper'), percent(altDone, altRows.length), `${altDone}/${altRows.length} done`);
  }

  const mainRows = all(ROW, list).filter((row) => !altList?.contains(row));
  const mainDone = mainRows.filter((row) => done[row.dataset.resId!]).length;
  paintProgress(column.querySelector('.column-track-progress'), percent(mainDone, mainRows.length), `${mainDone}/${mainRows.length} done`);
}

function paintAll(): void {
  const done = readFlags(DONE);
  const pinned = readFlags(PINNED);
  paintDone(done);
  all('.res-column-wrapper').forEach((column) => layoutColumn(column, pinned, done));
}

document.addEventListener('click', (event) => {
  const target = event.target as Element;

  const doneBtn = target.closest<HTMLElement>(`${ROW} .res-done-checkbox, ${ROW} .res-mark-btn`);
  if (doneBtn) {
    event.preventDefault(); // the round button sits inside <summary>: don't toggle the drawer
    const id = doneBtn.dataset.checkId!;
    setFlag(DONE, id, !readFlags(DONE)[id]);
    return paintAll();
  }

  const pinBtn = target.closest<HTMLElement>(`${ROW} .pin-btn`);
  if (pinBtn) {
    event.preventDefault();
    const row = pinBtn.closest<HTMLElement>(ROW)!;
    setFlag(PINNED, pinBtn.dataset.pinId!, !isPinned(row, readFlags(PINNED)));
    paintAll();
  }
});

document.addEventListener('change', ({ target }) => {
  if (!(target instanceof HTMLInputElement) || !target.matches(`${LONE_BENCH} .bench-done-checkbox`)) return;
  setFlag(DONE, target.dataset.checkId!, target.checked);
  paintAll();
});

paintAll();
