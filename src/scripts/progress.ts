// src/scripts/progress.ts
// Checklist state for <Task>, plus every read-out that summarises it (<VerificationBox>,
// <ProgressCard>, <CurriculumProgress>). Each read-out lists the task ids it covers in
// `data-progress-tasks`, so pages can show tracks whose checkboxes live elsewhere.
import { TASKS, paintProgress, percent, readFlags, setFlag, type Flags } from './store';

const isTaskBox = (el: EventTarget | null): el is HTMLInputElement =>
  el instanceof HTMLInputElement && el.classList.contains('task-checkbox-input');

function paint(done: Flags): void {
  document.querySelectorAll<HTMLElement>('[data-progress-tasks]').forEach((readout) => {
    const ids = readout.dataset.progressTasks!.split(' ').filter(Boolean);
    const pct = Math.round(percent(ids.filter((id) => done[id]).length, ids.length));
    paintProgress(readout, pct, `${pct}%`);
  });
}

const done = readFlags(TASKS);
document.querySelectorAll<HTMLInputElement>('.task-checkbox-input').forEach((box) => {
  box.checked = !!done[box.id];
});
paint(done);

document.addEventListener('change', ({ target }) => {
  if (isTaskBox(target)) paint(setFlag(TASKS, target.id, target.checked));
});
