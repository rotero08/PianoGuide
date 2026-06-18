// src/utils/trackingHelper.client.ts

interface TaskMap {
  [trackId: string]: string[];
}

/**
 * A static, centralized directory of all track task IDs.
 * This guarantees accurate mathematical percentage calculations even on pages
 * where only some of the checkboxes are currently rendered.
 */
const GLOBAL_TASK_REGISTRY: TaskMap = {
  tech1: [
    'check-tech1-posture',
    'check-tech1-drop',
    'check-tech1-release',
    'check-tech1-checkpoint'
  ],
  tech2: [
    'check-tech2-dozen',
    'check-tech2-scales',
    'check-tech2-chords',
    'check-tech2-checkpoint'
  ],
  prestaff: [
    'check-prestaff-posture',
    'check-prestaff-ear',
    'check-prestaff-reading',
    'check-prestaff-checkpoint'
  ],
  lvl0: [
    'check-lvl0-dandelot',
    'check-lvl0-intervals',
    'check-lvl0-kravchuk',
    'check-lvl0-chang',
    'check-lvl0-checkpoint'
  ],
  lvl1: [
    'check-lvl1-triads',
    'check-lvl1-dyads',
    'check-lvl1-leadsheet',
    'check-lvl1-checkpoint'
  ],
  lvl2: [
    'check-lvl2-scales',
    'check-lvl2-keysig',
    'check-lvl2-canons',
    'check-lvl2-checkpoint'
  ],
  lvl3: [
    'check-lvl3-leaps',
    'check-lvl3-reading',
    'check-lvl3-checkpoint'
  ],
  lvl4: [
    'check-lvl4-inv',
    'check-lvl4-expr',
    'check-lvl4-checkpoint'
  ],
  lvl5: [
    'check-lvl5-gradus',
    'check-lvl5-anki',
    'check-lvl5-checkpoint'
  ],
  lvl6: [
    'check-lvl6-octaves',
    'check-lvl6-phrasing',
    'check-lvl6-checkpoint'
  ],
  lvl7: [
    'check-lvl7-chorale',
    'check-lvl7-loop',
    'check-lvl7-checkpoint'
  ]
};

/**
 * Reads verified states from local browser storage.
 */
function getSavedCheckedStates(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem('cp-completed-tasks');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Saves checked states to local browser storage.
 */
function saveCheckedStates(states: Record<string, boolean>): void {
  try {
    localStorage.setItem('cp-completed-tasks', JSON.stringify(states));
  } catch (e) {
    console.warn('Unable to write progress data to localStorage:', e);
  }
}

/**
 * Scans the current DOM, initializes checked states, and recalculates progress.
 */
function initializeTracking(): void {
  const savedStates = getSavedCheckedStates();
  const visibleCheckboxes = document.querySelectorAll<HTMLInputElement>('.task-checkbox-input');

  // Synchronize state of all visible checkboxes
  visibleCheckboxes.forEach((checkbox) => {
    const id = checkbox.id;
    if (id in savedStates) {
      checkbox.checked = savedStates[id];
    } else {
      checkbox.checked = false;
    }
  });

  calculateAndRenderProgress(savedStates);
}

/**
 * Computes completion metrics and triggers DOM state updates.
 */
function calculateAndRenderProgress(savedStates: Record<string, boolean>): void {
  let totalRegistryTasks = 0;
  let totalRegistryCompleted = 0;

  // Calculate percentages for each registered track
  Object.keys(GLOBAL_TASK_REGISTRY).forEach((trackId) => {
    const taskIds = GLOBAL_TASK_REGISTRY[trackId];
    const registeredCount = taskIds.length;
    
    let completedCount = 0;
    taskIds.forEach((id) => {
      if (savedStates[id]) {
        completedCount++;
      }
    });

    totalRegistryTasks += registeredCount;
    totalRegistryCompleted += completedCount;

    const percentage = registeredCount > 0 ? Math.round((completedCount / registeredCount) * 100) : 0;

    // Dynamically update individual track progress bars and percentage text (if present in DOM)
    updateProgressElementPair(trackId, percentage);
  });

  // Calculate and update global curriculum overview percent
  const overallPercentage = totalRegistryTasks > 0 ? Math.round((totalRegistryCompleted / totalRegistryTasks) * 100) : 0;
  updateOverallElements(overallPercentage);
}

/**
 * Helper to update individual progression bars and text labels.
 */
function updateProgressElementPair(trackId: string, percentage: number): void {
  const textLabel = document.getElementById(`${trackId}-pct`);
  const barFill = document.getElementById(`${trackId}-bar`);

  if (textLabel) {
    textLabel.textContent = `${percentage}%`;
  }
  if (barFill) {
    barFill.style.width = `${percentage}%`;
  }
}

/**
 * Helper to update global totals.
 */
function updateOverallElements(overallPercentage: number): void {
  const overallText = document.getElementById('overall-pct');
  const overallBar = document.getElementById('overall-bar');

  if (overallText) {
    overallText.textContent = `${overallPercentage}%`;
  }
  if (overallBar) {
    overallBar.style.width = `${overallPercentage}%`;
  }
}

/**
 * Handles individual task checkbox toggle events.
 */
function handleCheckboxToggle(event: Event): void {
  const target = event.target as HTMLInputElement;
  if (!target || !target.classList.contains('task-checkbox-input')) return;

  const savedStates = getSavedCheckedStates();
  savedStates[target.id] = target.checked;
  saveCheckedStates(savedStates);

  calculateAndRenderProgress(savedStates);
}

// Binds lifecycle events once on compile, adapting to Starlight's SPA transitions.
if (typeof window !== 'undefined') {
  document.addEventListener('change', handleCheckboxToggle);
  document.addEventListener('astro:page-load', initializeTracking);
  
  // Fast initial page setup pass
  initializeTracking();
}
