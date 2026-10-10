// tools/make-screenshots.mjs
// Takes the screenshots shown in README.md into .github/assets/: `pnpm screenshots`, after `pnpm build`.
//
// The site is shown as built, in its dark theme, with a little progress filled in so that the
// trackers have something to show. The editor comes from the dev server, where it needs no sign-in.

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { launchBrowser } from '../tests/browser.mjs';
import { ROOT, startAstro } from '../tests/server.mjs';

const OUT = path.join(ROOT, '.github/assets');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

fs.mkdirSync(OUT, { recursive: true });
const browser = await launchBrowser();

async function open(origin, route, height = 800) {
  const page = await browser.newPage();
  // Captured at twice the size, then scaled down in `save`: sharper text than a 1x capture.
  await page.setViewport({ width: 1280, height, deviceScaleFactor: 2 });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await page.evaluateOnNewDocument(() => localStorage.setItem('starlight-theme', 'dark'));
  await page.goto(origin + route, { waitUntil: 'networkidle2', timeout: 120_000 });
  await page.evaluate(() => document.fonts.ready);
  await sleep(600);
  return page;
}

/** A palette PNG at 1600px wide is a fraction of the raw capture and looks the same on GitHub. */
async function save(name, capture) {
  const file = path.join(OUT, name);
  await sharp(capture).resize({ width: 1600, withoutEnlargement: true }).png({ palette: true, quality: 90, compressionLevel: 9 }).toFile(file);
  console.log(`${name}  ${Math.round(fs.statSync(file).size / 1024)} kB`);
}

/** The part of the page from the top of one element to the bottom of another, with a margin. */
async function region(page, from, to = from, margin = 24) {
  const clip = await page.evaluate(
    (from, to, margin) => {
      const top = document.querySelector(from).getBoundingClientRect();
      const bottom = document.querySelector(to).getBoundingClientRect();
      const left = Math.min(top.left, bottom.left) - margin;
      return { x: left + scrollX, y: top.top + scrollY - margin, width: Math.max(top.right, bottom.right) - left + margin, height: bottom.bottom - top.top + 2 * margin };
    },
    from,
    to,
    margin,
  );
  return page.screenshot({ clip });
}

const press = (page, selector) => page.$eval(selector, (element) => element.click());

let server;
try {
  // ---------- The site ----------
  server = await startAstro('preview');

  let page = await open(server.origin, '/', 900);
  await save('home.png', await page.screenshot());
  await page.close();

  // Level 1 with a resource finished, two tasks ticked and a benchmark piece chosen.
  page = await open(server.origin, '/curriculum/level-1/', 820);
  await press(page, '[data-res-id="lvl1-siskind"] .res-done-checkbox');
  await press(page, '#check-lvl1-triads');
  await press(page, '#check-lvl1-dyads');
  await press(page, '[data-bench-id="lvl1-cole-p78"] .bench-done-checkbox');
  await press(page, '[data-bench-id="lvl1-haydn"] .select-bench-btn');
  await sleep(700);
  await save('level.png', await page.screenshot());
  // The checkpoint with its long "how to use these benchmarks" note folded away.
  await press(page, '.verification-outer-container .benchmark-guide-header');
  await sleep(400);
  await save('checkpoint.png', await region(page, '.verification-outer-container'));
  await page.close();

  // The dashboard, as it looks part-way through the curriculum: the first four tracks done, the fifth half done.
  page = await open(server.origin, '/foundations/introduction/');
  await page.evaluate(() => {
    const tracks = [...document.querySelectorAll('.po-row')].map((row) => row.dataset.progressTasks.split(' '));
    const done = [...tracks.slice(0, 4).flat(), ...tracks[4].slice(0, Math.ceil(tracks[4].length / 2))];
    localStorage.setItem('cp-completed-tasks', JSON.stringify(Object.fromEntries(done.map((id) => [id, true]))));
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await sleep(900);
  await save('progress.png', await region(page, '.progress-overview-container', '.grid-container:has(.po-row)'));
  await page.close();
  server.stop();

  // ---------- The editor ----------
  server = await startAstro('dev', '/keystatic');
  page = await open(server.origin, '/keystatic/collection/curriculum/item/level-1');
  await page.waitForFunction(() => document.body.innerText.includes('RESOURCE COLUMN'), { timeout: 60_000 });
  await sleep(800);
  await save('editor.png', await page.screenshot());
} finally {
  server?.stop();
  await browser.close();
}
