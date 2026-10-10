// tests/keystatic.mjs
//
// Checks that every content page can be opened and saved in the Keystatic admin. It starts the
// dev server, opens the admin in a headless browser, and runs each page through the same
// parse → save code the editor uses, twice, to confirm the saved form is stable.
//
// A page fails here when it contains something Keystatic's MDX editor does not understand:
// an `import` / `export` line, a `{/* comment */}` or any other `{expression}`, raw HTML, or a
// tag with no Keystatic form (see src/keystatic/components.ts). Fix the page, or document the
// component's Props, rather than loosening this test: a page that fails cannot be edited in the CMS.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser } from './browser.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const DOCS = path.join(ROOT, 'src/content/docs');

/** Every page with the Keystatic collection (its folder) or singleton it belongs to. */
const pages = [
  { singleton: 'home', slug: 'index', file: 'index.mdx' },
  ...fs.readdirSync(DOCS, { withFileTypes: true }).filter((entry) => entry.isDirectory()).flatMap((dir) =>
    fs.readdirSync(path.join(DOCS, dir.name)).filter((name) => name.endsWith('.mdx')).map((name) => ({ collection: dir.name, slug: name.replace(/\.mdx$/, ''), file: `${dir.name}/${name}` })),
  ),
].map((page) => ({ ...page, body: fs.readFileSync(path.join(DOCS, page.file), 'utf8').replace(/^---\n[\s\S]*?\n---\n/, '') }));

const freePort = () => new Promise((resolve) => {
  const probe = net.createServer().listen(0, '127.0.0.1', () => {
    const { port } = probe.address();
    probe.close(() => resolve(port));
  });
});

const port = await freePort();
const origin = `http://127.0.0.1:${port}`;
const astroDir = path.join(ROOT, 'node_modules/astro');
const astroCli = path.join(astroDir, JSON.parse(fs.readFileSync(path.join(astroDir, 'package.json'), 'utf8')).bin.astro);
// `dev` must be on the command line: astro.config.mjs only loads Keystatic for the dev server.
const server = spawn(process.execPath, [astroCli, 'dev', '--port', String(port)], { cwd: ROOT, stdio: 'ignore' });
let browser;
let failures = 0;

try {
  for (let attempt = 0; ; attempt++) {
    const up = await fetch(`${origin}/keystatic`).then((response) => response.ok, () => false);
    if (up) break;
    if (attempt > 120) throw new Error('The dev server did not start within 60 seconds.');
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  browser = await launchBrowser();
  const page = await browser.newPage();
  await page.goto(`${origin}/keystatic`, { waitUntil: 'networkidle2', timeout: 120_000 });
  await page.waitForFunction(() => document.body.innerText.includes('Dashboard'), { timeout: 60_000 });
  console.log('pass  admin dashboard loads');

  const results = await page.evaluate(async (pages) => {
    const { default: config } = await import('/keystatic.config.ts');
    const encode = (text) => new TextEncoder().encode(text);
    const decode = (bytes) => new TextDecoder().decode(bytes);
    return pages.map(({ collection, singleton, slug, file, body }) => {
      const entry = singleton ? config.singletons[singleton] : config.collections[collection];
      if (!entry) return { file, error: `No Keystatic collection is configured for the "${collection}" folder (keystatic.config.ts).` };
      const field = entry.schema.content;
      const save = (text) => decode(field.serialize(field.parse(undefined, { content: encode(text), other: new Map(), external: new Map(), slug }), { slug }).content);
      try {
        const saved = save(body);
        return { file, stable: save(saved) === saved };
      } catch (error) {
        return { file, error: String(error.message) };
      }
    });
  }, pages);

  for (const { file, error, stable } of results) {
    if (error) console.log(`FAIL  ${file} cannot be opened in Keystatic\n      ${error.split('\n').slice(0, 5).join('\n      ')}`);
    else if (!stable) console.log(`FAIL  ${file} changes again each time it is saved`);
    else continue;
    failures++;
  }
  console.log(`${failures ? 'FAIL' : 'pass'}  ${results.length - failures}/${results.length} pages open and save cleanly in Keystatic`);
} catch (error) {
  failures++;
  console.log(`FAIL  ${error.message}`);
} finally {
  await browser?.close();
  server.kill();
}

process.exit(failures ? 1 : 0);
