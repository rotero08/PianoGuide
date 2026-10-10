// src/scripts/benchmarks.ts
// <BenchmarkSelector>: the reader picks one primary era piece (and may pin more); the active
// cards stay in the main list and the rest move into the "alternatives" drawer.
import { readFlags, writeFlags } from './store';

function setup(root: HTMLElement): void {
  const level = root.dataset.level!;
  const mainList = root.querySelector<HTMLElement>('.bench-main-active-list')!;
  const altList = root.querySelector<HTMLElement>('.alt-benchmarks-list')!;
  const drawer = root.querySelector<HTMLElement>('.alternatives-drawer')!;
  const callout = root.querySelector<HTMLElement>('.bench-select-callout')!;
  // Captured once, in authored order, so cards never reshuffle as they move between lists.
  const cards = [...root.querySelectorAll<HTMLElement>('.uv-bench-item')];

  const keys = {
    primary: `cp-primary-bench-${level}`,
    pinned: `cp-pinned-bench-${level}`,
    completed: `cp-completed-bench-${level}`,
  };
  let primary = localStorage.getItem(keys.primary);
  const pinned = readFlags(keys.pinned);
  const completed = readFlags(keys.completed);

  function save(): void {
    try {
      if (primary) localStorage.setItem(keys.primary, primary);
      else localStorage.removeItem(keys.primary);
    } catch {
      // storage unavailable: the choice simply won't persist
    }
    writeFlags(keys.pinned, pinned);
    writeFlags(keys.completed, completed);
  }

  const isActive = (id: string) => id === primary || !!pinned[id];

  function render(): void {
    // Until something is chosen, every card stays in the main list with its "Select" button.
    const choosing = !cards.some((card) => isActive(card.dataset.benchId!));
    callout.hidden = !choosing;

    for (const card of cards) {
      const id = card.dataset.benchId!;
      const active = isActive(id);
      (active || choosing ? mainList : altList).append(card);
      card.classList.toggle('selected', active);
      card.classList.toggle('dashed', !active);
      card.classList.toggle('completed', !!completed[id]);
      card.querySelector<HTMLInputElement>('.bench-done-checkbox')!.checked = !!completed[id];
      card.querySelector('.pin-btn')?.classList.toggle('active', active);
      const select = card.querySelector<HTMLElement>('.select-bench-btn');
      if (select) select.hidden = !choosing;
    }
    drawer.hidden = altList.childElementCount === 0;
  }

  root.addEventListener('click', (event) => {
    const target = event.target as Element;
    const id = target.closest<HTMLElement>('.uv-bench-item')?.dataset.benchId;
    if (!id) return;

    if (target.closest('.select-bench-btn')) {
      primary = id;
    } else if (target.closest('.pin-btn')) {
      // Unpinning the primary piece deselects it; otherwise the pin simply toggles.
      if (id === primary) {
        primary = null;
        pinned[id] = false;
      } else {
        pinned[id] = !pinned[id];
      }
    } else {
      return;
    }
    save();
    render();
  });

  root.addEventListener('change', ({ target }) => {
    if (!(target instanceof HTMLInputElement) || !target.classList.contains('bench-done-checkbox')) return;
    completed[target.dataset.checkId!] = target.checked;
    save();
    render();
  });

  render();
}

document.querySelectorAll<HTMLElement>('.benchmark-selector-wrapper').forEach(setup);
