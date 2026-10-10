// src/scripts/store.ts
// All learner progress lives in the browser, as small JSON maps under `cp-*` localStorage keys.

export type Flags = Record<string, boolean>;

/** Checklist items ticked off, keyed by `<Task id>`. */
export const TASKS = 'cp-completed-tasks';
/** Resources marked done, keyed by `<Resource id>`. */
export const DONE = 'cp-checked-resources';
/** Resources pinned into (or unpinned from) their column, keyed by `<Resource id>`. */
export const PINNED = 'cp-pinned-resources';

export function readFlags(key: string): Flags {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '{}') ?? {};
  } catch {
    return {};
  }
}

export function writeFlags(key: string, flags: Flags): void {
  try {
    localStorage.setItem(key, JSON.stringify(flags));
  } catch (error) {
    console.warn('Unable to save progress to localStorage:', error);
  }
}

/** Sets one flag and returns the whole updated map. */
export function setFlag(key: string, id: string, value: boolean): Flags {
  const flags = readFlags(key);
  flags[id] = value;
  writeFlags(key, flags);
  return flags;
}

/**
 * Paints one progress read-out: `container` holds a `[data-progress-bar]` fill and a
 * `[data-progress-label]` text node (see VerificationBox, ProgressCard, ResourceColumn…).
 */
export function paintProgress(container: Element | null, pct: number, label: string): void {
  if (!container) return;
  const bar = container.querySelector<HTMLElement>('[data-progress-bar]');
  const text = container.querySelector<HTMLElement>('[data-progress-label]');
  if (bar) bar.style.width = `${pct}%`;
  if (text) text.textContent = label;
}

/** Share of `done` out of `total` as a 0–100 percentage (0 when there is nothing to do). */
export const percent = (done: number, total: number) => (total > 0 ? (done / total) * 100 : 0);
