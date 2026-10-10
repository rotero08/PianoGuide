// src/components/icons.ts

const pin =
  '<line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-.44-1.24l-2.12-2.65A1 1 0 0 1 16 10.76V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v5.76a1 1 0 0 1-.44.59l-2.12 2.65a2 2 0 0 0-.44 1.24Z"/>';

/**
 * Inner SVG markup for every icon, drawn on a 24×24 grid and stroked with `currentColor`.
 * This is the single source of truth: `IconName` (and every `icon` prop) is derived from its keys.
 */
export const icons = {
  'info': '<circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="13"/><circle cx="12" cy="16.5" r="0.6" fill="currentColor" stroke="none"/>',
  'target': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
  'warning': '<path d="M12 3 2.5 20h19L12 3Z"/><line x1="12" y1="9.5" x2="12" y2="14.5"/><circle cx="12" cy="17.4" r="0.7" fill="currentColor" stroke="none"/>',
  'play-box': '<path d="M20 4H4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3v3.5L11 15h9a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1Z"/>',
  'link': '<path d="M9.5 14.5 14.5 9.5"/><path d="M11 6.2l.9-.9a3.8 3.8 0 0 1 5.4 5.4l-.9.9"/><path d="M13 17.8l-.9.9a3.8 3.8 0 0 1-5.4-5.4l.9-.9"/>',
  'speed-wall': '<rect x="3" y="5" width="18" height="14" rx="1"/><line x1="3" y1="9.7" x2="21" y2="9.7"/><line x1="3" y1="14.3" x2="21" y2="14.3"/><line x1="9" y1="5" x2="9" y2="9.7"/><line x1="15" y1="5" x2="15" y2="9.7"/><line x1="12" y1="9.7" x2="12" y2="14.3"/><line x1="6" y1="14.3" x2="6" y2="19"/><line x1="18" y1="14.3" x2="18" y2="19"/>',
  'app-trap': '<rect x="7" y="3" width="10" height="18" rx="2.2"/><line x1="11" y1="17.6" x2="13" y2="17.6"/><path d="M9.5 6.5l3 2.5-3 2.5"/>',
  'acronym-trap': '<path d="M5 7V5h14v2"/><line x1="12" y1="5" x2="12" y2="19"/><line x1="9" y1="19" x2="15" y2="19"/>',
  'repeat': '<path d="M4 12a8 8 0 0 1 13.3-5.9L20 8"/><path d="M20 4v4h-4"/><path d="M20 12a8 8 0 0 1-13.3 5.9L4 16"/><path d="M4 20v-4h4"/>',
  'moon': '<path d="M20 14.2A8.2 8.2 0 1 1 9.8 4 6.6 6.6 0 0 0 20 14.2Z"/>',
  'retreat': '<path d="M4 9a8 8 0 1 1-1.6 5"/><path d="M4 4v5h5"/>',
  'chevron-down': '<polyline points="6 9 12 15 18 9"/>',
  'chevron-right': '<polyline points="9 18 15 12 9 6"/>',
  'star': '<path d="M12 3.6l2.5 5.1 5.6.8-4 4 1 5.6L12 16.5 6.9 19.1l1-5.6-4-4 5.6-.8Z"/>',
  'map': '<path d="M9 4 3 6.5v13.5L9 17.5l6 2.5 6-2.5V4L15 6.5 9 4Z"/><line x1="9" y1="4" x2="9" y2="17.5"/><line x1="15" y1="6.5" x2="15" y2="20"/>',
  'check': '<polyline points="20 6 9 17 4 12"/>',
  'pin': pin,
  'pin-off': `${pin}<line x1="2" y1="2" x2="22" y2="22" stroke-width="2.5"/>`,
  'lock': '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.9-.9"/>',
  'hand': '<path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8M10 10.5V5.5a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v9M6 13V9a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v6a10 10 0 0 0 10 10h1a10 10 0 0 0 10-10v-4"/>',
  'eye': '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  'play': '<polygon points="6 3 20 12 6 21 6 3" fill="currentColor" stroke="none"/>',
} as const;

/** Name of any icon in the `icons` catalogue. */
export type IconName = keyof typeof icons;

/** What an optional `icon` prop accepts: a catalogue name, or `'none'` to render nothing. */
export type IconChoice = IconName | 'none';
