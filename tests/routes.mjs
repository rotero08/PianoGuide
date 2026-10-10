// tests/routes.mjs
//
// Checks the parts of the built site that the Worker answers rather than a file: the Keystatic
// admin, its API and the preview endpoint, plus the "Edit page" link that leads to them. It
// serves the build with `astro preview`, which runs the real Workers runtime, so run
// `pnpm build` first.
//
// Requests are sent the way a browser sends a page navigation (`Sec-Fetch-Mode: navigate`).
// That matters: Cloudflare answers such a request for a path that is not a file with the 404
// page, without running the Worker, unless the path is listed under `run_worker_first` in
// wrangler.jsonc. A route missing from that list works with curl and breaks in the browser.

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { KEYSTATIC_GITHUB_APP_SLUG, PRODUCTION_BRANCH } from '../site.config.mjs';
import { ROOT, startAstro } from './server.mjs';

const SITE = path.join(ROOT, 'dist/client');
if (!fs.existsSync(path.join(SITE, 'index.html'))) {
  console.error('No build found in dist/client. Run `pnpm build` first.');
  process.exit(1);
}

const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok: Boolean(ok), detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });

let server;
try {
  server = await startAstro('preview');

  /** One browser-style navigation, without following redirects. */
  const navigate = (route) => new Promise((resolve, reject) => {
    http.get(server.origin + route, { headers: { accept: 'text/html', 'sec-fetch-mode': 'navigate', 'sec-fetch-dest': 'document' } }, (response) => {
      let body = '';
      response.setEncoding('utf8').on('data', (chunk) => (body += chunk)).on('end', () => resolve({ status: response.statusCode, location: response.headers.location ?? '', body }));
    }).on('error', reject);
  });
  const preview = (branch, to) => navigate(`/api/preview?branch=${encodeURIComponent(branch)}&to=${encodeURIComponent(to)}`);

  // ---------- Static pages are untouched ----------
  const level = await navigate('/curriculum/level-1/');
  check('a content page is served', level.status === 200 && level.body.includes('<title>'), level.status);
  const missing = await navigate('/no-such-page/');
  check('an unknown path gets the 404 page', missing.status === 404 && missing.body.includes('404'), missing.status);

  // ---------- "Edit page" link ----------
  // A build only links to the admin once the GitHub App exists (site.config.mjs); until then
  // nobody could sign in. The link names the branch, as every admin address does in GitHub mode.
  const editHref = `/keystatic/branch/${PRODUCTION_BRANCH}/collection/curriculum/item/level-1`;
  const linked = level.body.includes(`href="${editHref}"`);
  check(KEYSTATIC_GITHUB_APP_SLUG ? 'pages link to their editor' : 'pages have no edit link while the GitHub App is not set up', linked === Boolean(KEYSTATIC_GITHUB_APP_SLUG), { linked });

  // ---------- Admin ----------
  // Either the admin itself, or, on a machine without the GitHub App's secrets, the explanation
  // from src/middleware.ts. Never the 404 page: that would mean the Worker was not reached.
  for (const route of ['/keystatic', editHref, '/api/keystatic/github/login']) {
    const admin = await navigate(route);
    const reached = admin.status !== 404 && (admin.status < 400 || admin.body.includes('The editor is not available here'));
    check(`the Worker answers ${route}`, reached, admin.status);
  }

  // ---------- Preview endpoint ----------
  const live = await preview(PRODUCTION_BRANCH, '/curriculum/level-1/');
  check('previewing the production branch opens the page itself', live.status === 302 && new URL(live.location, server.origin).pathname === '/curriculum/level-1/', live);

  for (const to of ['//evil.example/x', '/\\evil.example/x', 'https://evil.example/x', 'curriculum/level-1/']) {
    const response = await preview(PRODUCTION_BRANCH, to);
    check(`preview refuses to redirect to ${to}`, response.status === 400, response);
  }

  // No such branch exists, so there is no preview build of it: the editor gets an explanation.
  // (Offline, the endpoint cannot tell and sends them on to where the preview would be.)
  const unbuilt = await preview('no-such-branch-for-tests', '/curriculum/level-1/');
  const explained = unbuilt.status === 404 && /preview/i.test(unbuilt.body);
  const sentOn = unbuilt.status === 302 && unbuilt.location.startsWith('https://no-such-branch-for-tests-');
  check('a branch without a preview build is explained, not a dead end', explained || sentOn, { status: unbuilt.status, location: unbuilt.location });
} catch (error) {
  check('test run completed', false, error.stack);
} finally {
  server?.stop();
}

const failed = results.filter((result) => !result.ok);
for (const { name, ok, detail } of results) console.log(`${ok ? 'pass' : 'FAIL'}  ${name}${ok || !detail ? '' : `\n      ${detail.slice(0, 500)}`}`);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
