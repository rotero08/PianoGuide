// src/pages/api/preview.ts
//
// Where the "Preview" button of the Keystatic admin goes (`previewUrl` in keystatic.config.ts):
//
//   /api/preview?branch=<branch being edited>&to=<path of the page>
//
// Pages are built ahead of time, so a branch can only be looked at where that branch has been
// built. For the dev server and for the production branch that is this site. Every other branch
// gets its own preview build from Cloudflare, at <branch>-<worker>.<account>.workers.dev, a
// minute or two after each save.

import type { APIRoute } from 'astro';
import { PRODUCTION_BRANCH, WORKERS_DEV_HOST } from '../../../site.config.mjs';
import { notice } from '../../utils/notice';

export const prerender = false;

/** How Cloudflare turns a branch name into the first part of its preview address. */
const previewName = (branch: string) => branch.replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();

export const GET: APIRoute = async ({ url, redirect }) => {
  const branch = url.searchParams.get('branch') ?? '';

  // `to` must be a page of this site. Resolving it against our own origin and comparing origins
  // rejects every way of smuggling in another address (//host, /\host, https://host).
  const requested = url.searchParams.get('to') ?? '/';
  const page = URL.canParse(requested, url.origin) ? new URL(requested, url.origin) : undefined;
  if (!page || page.origin !== url.origin || !requested.startsWith('/')) {
    return new Response('The "to" parameter must be a path of this site, for example /curriculum/level-1/.', { status: 400 });
  }
  const to = page.pathname + page.search + page.hash;

  if (import.meta.env.DEV || !branch || branch === PRODUCTION_BRANCH) return redirect(to, 302);

  const host = WORKERS_DEV_HOST || (url.hostname.endsWith('.workers.dev') ? url.hostname : '');
  const name = previewName(branch);
  const livePage = { text: 'Open the live page', href: to };
  if (!host || !name) {
    return notice(404, 'Branch previews are not set up', [`There is no address to look for a preview of the branch "${branch}".`, 'Set WORKERS_DEV_HOST in site.config.mjs to the workers.dev address of the site.'], [livePage]);
  }

  const preview = `https://${name}-${host}${to}`;
  // Look before sending the editor there: a branch that has not been built answers with a bare Cloudflare error page.
  const built = await fetch(preview, { method: 'HEAD', redirect: 'manual' }).then((response) => response.status < 400, () => true);
  if (built) return redirect(preview, 302);

  return notice(
    404,
    `No preview of "${branch}" yet`,
    [
      'A preview is built each time you save on a branch, and takes a minute or two. If you have just saved, try again shortly.',
      'Branches of a fork are not built. Your changes are reviewed from the pull request instead, and go live once it is merged.',
    ],
    // The direct link is there in case the check above is wrong about a preview that does exist.
    [{ text: 'Try again', href: url.pathname + url.search }, { text: 'Open the preview address', href: preview }, livePage],
  );
};
