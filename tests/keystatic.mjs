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

import fs from 'node:fs';
import path from 'node:path';
import { launchBrowser } from './browser.mjs';
import { ROOT, startAstro } from './server.mjs';

const DOCS = path.join(ROOT, 'src/content/docs');

/** Every page with the Keystatic collection (its folder) or singleton it belongs to. */
const pages = [
  { singleton: 'home', slug: 'index', file: 'index.mdx' },
  ...fs.readdirSync(DOCS, { withFileTypes: true }).filter((entry) => entry.isDirectory()).flatMap((dir) =>
    fs.readdirSync(path.join(DOCS, dir.name)).filter((name) => name.endsWith('.mdx')).map((name) => ({ collection: dir.name, slug: name.replace(/\.mdx$/, ''), file: `${dir.name}/${name}` })),
  ),
].map((page) => ({ ...page, body: fs.readFileSync(path.join(DOCS, page.file), 'utf8').replace(/^---\n[\s\S]*?\n---\n/, '') }));

let server;
let browser;
let failures = 0;

try {
  // The dev server: that is where the admin edits local files, with nothing to sign in to.
  server = await startAstro('dev', '/keystatic');
  const { origin } = server;

  browser = await launchBrowser();
  const page = await browser.newPage();
  await page.goto(`${origin}/keystatic`, { waitUntil: 'networkidle2', timeout: 120_000 });
  await page.waitForFunction(() => document.body.innerText.includes('Dashboard'), { timeout: 60_000 });
  console.log('pass  admin dashboard loads');

  await page.goto(`${origin}/keystatic/singleton/guide`, { waitUntil: 'networkidle2', timeout: 120_000 });
  await page.waitForFunction(() => document.body.innerText.includes('Three things to leave alone'), { timeout: 60_000 });
  console.log('pass  the editing guide is shown inside the admin');

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
  server?.stop();
}

process.exit(failures ? 1 : 0);
