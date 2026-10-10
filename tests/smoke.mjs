// tests/smoke.mjs
//
// Browser smoke test for the interactive parts of the site: checklists and progress bars,
// resource drawers (done / pin), the benchmark picker, citations and the bibliography, the
// searchable grid and the piano. It drives the *built* site in a headless browser, so run
// `pnpm build` first, then `pnpm test`.
//
// The checks use the Level 1 page as their fixture (ids like `lvl1-siskind`, `check-lvl1-triads`,
// `lvl1-haydn`, and its 2 / 1 / 3 resource counts). If that page's content changes, update the
// expectations below to match.

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser } from './browser.mjs';

const SITE = fileURLToPath(new URL('../dist/client/', import.meta.url));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };

if (!fs.existsSync(path.join(SITE, 'index.html'))) {
  console.error('No build found in dist/client. Run `pnpm build` first.');
  process.exit(1);
}

/** Serves the build like a static host would: directory indexes, and 404.html for unknown paths. */
const server = http.createServer((req, res) => {
  let file = path.join(SITE, decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  const found = fs.existsSync(file);
  res.writeHead(found ? 200 : 404, { 'content-type': MIME[path.extname(found ? file : '.html')] ?? 'application/octet-stream' });
  res.end(fs.readFileSync(found ? file : path.join(SITE, '404.html')));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

const browser = await launchBrowser();
const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok: Boolean(ok), detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Opens a page with clean (or seeded) saved progress and records any script errors. */
async function open(route, storage = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  page.errors = [];
  page.on('pageerror', (error) => page.errors.push(error.message));
  // Web fonts are irrelevant here and would make the test depend on the network.
  await page.setRequestInterception(true);
  page.on('request', (request) => (/fonts\.(googleapis|gstatic)\.com/.test(request.url()) ? request.abort() : request.continue()));
  await page.evaluateOnNewDocument((seed) => {
    if (sessionStorage.getItem('seeded')) return; // keep state across reloads within the tab
    sessionStorage.setItem('seeded', '1');
    localStorage.clear();
    for (const [key, value] of Object.entries(seed)) localStorage.setItem(key, value);
  }, storage);
  await page.goto(origin + route, { waitUntil: 'load' });
  await sleep(200);
  return page;
}

/** Clicks an element after centring it, so the sticky site header can never intercept the click. */
async function click(page, selector) {
  await page.$eval(selector, (el) => el.scrollIntoView({ block: 'center' }));
  await sleep(30);
  await page.click(selector);
  await sleep(120);
}

const text = (page, selector) => page.$eval(selector, (el) => el.textContent.trim());
const stored = (page, key) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}'), key);
const benchIds = (page, list) => page.$$eval(`${list} .uv-bench-item`, (cards) => cards.map((card) => card.dataset.benchId).join());

try {
  // ---------- Level 1: drawers, checklist, benchmarks ----------
  let page = await open('/curriculum/level-1/');
  const row = (id) => `[data-res-id="${id}"]`;
  const bench = (id) => `[data-bench-id="${id}"]`;

  check('columns count their resources', (await text(page, '#technique .ct-progress-text')) === '0/2 done' && (await text(page, '#reading .ct-progress-text')) === '0/1 done');

  await click(page, `${row('lvl1-siskind')} .res-done-checkbox`);
  const siskind = await page.$eval(row('lvl1-siskind'), (el) => ({ done: el.classList.contains('done'), open: el.open }));
  check('round button marks a drawer done without opening it', siskind.done && !siskind.open, siskind);

  await click(page, `${row('lvl1-leadsheets')} .res-title-label`);
  await click(page, `${row('lvl1-leadsheets')} .res-mark-btn`);
  check('"Mark as done" marks a drawer done', await page.$eval(row('lvl1-leadsheets'), (el) => el.classList.contains('done')));
  check('column progress follows', (await text(page, '#technique .ct-progress-text')) === '2/2 done', await text(page, '#technique .ct-progress-text'));
  check('done state is saved', (await stored(page, 'cp-checked-resources'))['lvl1-siskind'] === true);

  check('alternatives drawer counts its rows', (await text(page, '.alt-progress-text')) === '0/3 done', await text(page, '.alt-progress-text'));
  await click(page, '.alternatives-wrapper .alternatives-header');
  await click(page, `${row('lvl1-kravchuk')} .pin-btn`);
  const pinned = await page.$eval(row('lvl1-kravchuk'), (el) => ({
    inColumn: el.parentElement.classList.contains('res-list-container'),
    active: el.querySelector('.pin-btn').classList.contains('active'),
  }));
  check('pinning moves an alternative into the column', pinned.inColumn && pinned.active, pinned);
  check('both counters follow the move', (await text(page, '#reading .ct-progress-text')) === '0/2 done' && (await text(page, '.alt-progress-text')) === '0/2 done');

  await click(page, '#check-lvl1-triads');
  check('ticking a task updates the track percentage', (await text(page, '.vh-pct-label')) === '25%', await text(page, '.vh-pct-label'));
  check('a ticked task is struck through', (await page.$eval('.task-row-container:has(#check-lvl1-triads) .task-body-content', (el) => getComputedStyle(el).textDecorationLine)).includes('line-through'));
  check('tasks are saved under their own key only', (await stored(page, 'cp-completed-tasks'))['check-lvl1-triads'] === true && !('check-lvl1-triads' in (await stored(page, 'cp-checked-resources'))));

  await click(page, `${bench('lvl1-cole-p78')} .bench-done-checkbox`);

  const callout = () => page.$eval('.bench-select-callout', (el) => getComputedStyle(el).display !== 'none');
  check('benchmark picker starts with every piece and its prompt', (await benchIds(page, '.bench-main-active-list')).split(',').length === 5 && (await callout()));
  await click(page, `${bench('lvl1-haydn')} .select-bench-btn`);
  check('selecting a piece moves the others to the alternatives drawer', (await benchIds(page, '.bench-main-active-list')) === 'lvl1-haydn' && (await benchIds(page, '.alt-benchmarks-list')).split(',').length === 4 && !(await callout()));
  await click(page, '.benchmark-selector-wrapper .alternatives-header');
  await click(page, `${bench('lvl1-beyer')} .pin-btn`);
  check('pinning an alternative piece brings it back, in authored order', (await benchIds(page, '.bench-main-active-list')) === 'lvl1-haydn,lvl1-beyer', await benchIds(page, '.bench-main-active-list'));
  await click(page, `${bench('lvl1-haydn')} .bench-done-checkbox`);
  check('ticking a piece marks it completed', await page.$eval(bench('lvl1-haydn'), (el) => el.classList.contains('completed')));

  await page.reload({ waitUntil: 'load' });
  await sleep(300);
  const reloaded = await page.evaluate(() => {
    const q = (selector) => document.querySelector(selector);
    return {
      drawers: q('[data-res-id="lvl1-siskind"]').classList.contains('done') && q('[data-res-id="lvl1-leadsheets"]').classList.contains('done'),
      technique: q('#technique .ct-progress-text').textContent.trim(),
      pinnedInColumn: q('[data-res-id="lvl1-kravchuk"]').parentElement.classList.contains('res-list-container'),
      task: q('#check-lvl1-triads').checked,
      percent: q('.vh-pct-label').textContent.trim(),
      bar: q('.vh-bar-fg').style.width,
      standaloneBenchmark: q('[data-bench-id="lvl1-cole-p78"] .bench-done-checkbox').checked,
      pieceDone: q('[data-bench-id="lvl1-haydn"]').classList.contains('completed'),
    };
  });
  check('everything survives a reload', reloaded.drawers && reloaded.technique === '2/2 done' && reloaded.pinnedInColumn && reloaded.task && reloaded.percent === '25%' && reloaded.bar === '25%' && reloaded.standaloneBenchmark && reloaded.pieceDone, reloaded);
  check('benchmark choice survives a reload', (await benchIds(page, '.bench-main-active-list')) === 'lvl1-haydn,lvl1-beyer');

  await click(page, `${bench('lvl1-beyer')} .pin-btn`);
  await click(page, `${bench('lvl1-haydn')} .pin-btn`);
  check('unpinning everything returns to the "choose" state', (await benchIds(page, '.bench-main-active-list')).split(',').length === 5 && (await callout()));
  check('Level 1 runs without script errors', page.errors.length === 0, page.errors.join(' | '));
  await page.close();

  // ---------- Progress dashboard (tasks that live on other pages) ----------
  page = await open('/foundations/introduction/', { 'cp-completed-tasks': JSON.stringify({ 'check-lvl1-triads': true, 'check-lvl1-dyads': true, 'check-tech1-posture': true }) });
  const dashboard = await page.evaluate(() => {
    const card = (name) => [...document.querySelectorAll('.po-row')].find((el) => el.querySelector('.po-name').textContent.startsWith(name))?.querySelector('.po-pct').textContent.trim();
    const overall = document.querySelector('.po-overall-header');
    return { level1: card('Level 1'), technique1: card('Technique 1'), overall: overall.querySelector('.po-big-pct').textContent.trim(), total: overall.dataset.progressTasks.split(' ').length };
  });
  check('dashboard shows per-track and overall progress', dashboard.level1 === '50%' && dashboard.technique1 === '25%' && dashboard.overall === `${Math.round((3 / dashboard.total) * 100)}%`, dashboard);
  check('dashboard runs without script errors', page.errors.length === 0, page.errors.join(' | '));
  await page.close();

  // ---------- Citations and bibliography ----------
  page = await open('/foundations/methodology/');
  const citations = await page.$$eval('.sl-markdown-content a[href*="#ref-"]', (links) => links.map((a) => ({ id: a.id, href: a.getAttribute('href'), label: a.textContent })));
  check('citations get ids, slug links and [n] labels', citations.length > 0 && citations.every((c) => /^cite-[\w-]+-\d+$/.test(c.id) && /#ref-[a-z]/.test(c.href) && /^\[\d+\]$/.test(c.label)), citations.slice(0, 2));
  await page.close();

  page = await open('/reference/library/');
  const bibliography = await page.$$eval('.bibliography-container li', (items) => ({
    ids: items.map((li) => li.id),
    leftoverMarkers: items.filter((li) => /#ref-\d+/.test(li.textContent)).length,
    backlinks: items.flatMap((li) => [...li.querySelectorAll('.backlink-span a')].map((a) => a.getAttribute('href'))),
  }));
  check('bibliography entries have anchors and backlinks', bibliography.ids.length > 0 && bibliography.ids.every((id) => id.startsWith('ref-')) && bibliography.leftoverMarkers === 0 && bibliography.backlinks.length > 0, bibliography.ids.slice(0, 3));
  check('each citation points at a bibliography entry', citations.every((c) => bibliography.ids.includes(c.href.split('#')[1])));
  check('a backlink points back at that citation', bibliography.backlinks.includes(`/foundations/methodology/#${citations[0].id}`));

  const cards = '.grid-container[data-searchable] .resource-card';
  const visible = () => page.$$eval(cards, (els) => els.filter((el) => getComputedStyle(el).display !== 'none').map((el) => el.dataset.category));
  const total = (await visible()).length;
  await page.type('.input-filter', 'no-such-resource');
  check('search box filters the grid', total > 0 && (await visible()).length === 0);
  await page.$eval('.input-filter', (el) => { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.select('.select-filter', 'theory');
  const theory = await visible();
  check('category dropdown filters the grid', theory.length > 0 && theory.length < total && theory.every((category) => category === 'theory'));
  check('library runs without script errors', page.errors.length === 0, page.errors.join(' | '));
  await page.close();

  // ---------- Piano ----------
  page = await open('/');
  await page.keyboard.down('a');
  const pressed = await page.$eval('[data-note="C4"]', (el) => el.classList.contains('pressed'));
  await page.keyboard.up('a');
  check('piano key lights while its letter is held', pressed && !(await page.$eval('[data-note="C4"]', (el) => el.classList.contains('pressed'))));
  check('home runs without script errors', page.errors.length === 0, page.errors.join(' | '));
  await page.close();
} catch (error) {
  check('test run completed', false, error.stack);
} finally {
  await browser.close();
  server.close();
}

const failed = results.filter((result) => !result.ok);
for (const { name, ok, detail } of results) console.log(`${ok ? 'pass' : 'FAIL'}  ${name}${ok || !detail ? '' : `\n      ${detail.slice(0, 500)}`}`);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
