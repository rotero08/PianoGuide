// src/middleware.ts
//
// The admin on a built site signs people in through a GitHub App, whose credentials are secrets
// of the Worker (README, "Editing on the live site"). Where they are missing, which is the case
// before that setup is done and on every branch preview, Keystatic's own routes fail with a bare
// error. This answers for them with an explanation instead.

import { getSecret } from 'astro:env/server';
import { defineMiddleware } from 'astro:middleware';
import { GITHUB_REPO } from '../site.config.mjs';
import { notice } from './utils/notice';

export const onRequest = defineMiddleware((context, next) => {
  // Pages are prerendered; only the on-demand routes of a built site are of interest. On the
  // dev server Keystatic handles missing credentials itself, with its setup screen.
  if (context.isPrerendered || import.meta.env.DEV) return next();

  const { pathname } = context.url;
  const isAdmin = /^\/(api\/)?keystatic(\/|$)/.test(pathname);
  if (!isAdmin || getSecret('KEYSTATIC_GITHUB_CLIENT_ID')) return next();

  return notice(
    503,
    'The editor is not available here',
    [
      'Editing has not been set up at this address. If this is a preview of a branch, open the editor on the live site instead.',
      'Maintainers: the steps are in the README of the repository, under "Editing on the live site".',
    ],
    [
      { text: 'Back to the site', href: '/' },
      { text: 'Repository', href: `https://github.com/${GITHUB_REPO}` },
    ],
  );
});
