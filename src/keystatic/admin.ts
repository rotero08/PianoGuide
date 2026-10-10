// src/keystatic/admin.ts
//
// Where the Keystatic admin keeps its content and how to link into it. Shared by the Keystatic
// config, the "Edit page" link under every page and the editing guide inside the admin.

import { PRODUCTION_BRANCH, SECTIONS } from '../../site.config.mjs';

/**
 * `pnpm dev` edits the files of the working copy. The built site has no files to edit, so there
 * the admin reads and commits through GitHub. `pnpm dev:github` runs the dev server in GitHub
 * mode as well: that is how the GitHub App is created, and how to try that flow out locally.
 */
export const usesGitHub = import.meta.env.PROD || import.meta.env.PUBLIC_KEYSTATIC_STORAGE === 'github';

/** The public page that explains editing to contributors. */
export const CONTRIBUTING_PATH = '/reference/contributing/';

/**
 * Address of the admin's editor for one content file, given its path inside `src/content/docs`
 * without the extension (`curriculum/level-1`; `index` is the home page). Undefined for a file
 * that has no entry in the admin.
 */
export function adminPath(page: string): string | undefined {
  // In GitHub mode every admin address names the branch it edits.
  const base = usesGitHub ? `/keystatic/branch/${encodeURIComponent(PRODUCTION_BRANCH)}` : '/keystatic';
  if (page === 'index') return `${base}/singleton/home`;
  const [section, slug, ...deeper] = page.split('/');
  if (!slug || deeper.length || !SECTIONS.some(({ directory }) => directory === section)) return undefined;
  return `${base}/collection/${section}/item/${encodeURIComponent(slug)}`;
}
