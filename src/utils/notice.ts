// src/utils/notice.ts
//
// A small standalone page for on-demand routes that have something to explain instead of a page
// to show (no preview yet, the editor is not set up). It carries its own styles because those
// routes run on the Worker, outside Starlight's layout.

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

export function notice(status: number, heading: string, paragraphs: string[], links: { text: string; href: string }[]): Response {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(heading)}</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #12131f; color: #f0ede6; font: 1rem/1.6 system-ui, sans-serif; }
  main { max-width: 34rem; padding: 2rem; }
  h1 { margin: 0 0 1rem; font-size: 1.5rem; line-height: 1.25; color: #c9a84c; }
  p { margin: 0 0 0.9rem; color: rgba(240, 237, 230, 0.8); }
  nav { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1.5rem; }
  a { padding: 0.5rem 1rem; border: 1px solid #c9a84c; border-radius: 6px; color: #c9a84c; text-decoration: none; }
  a:first-child { background: #c9a84c; color: #12131f; }
</style>
</head>
<body>
<main>
<h1>${escapeHtml(heading)}</h1>
${paragraphs.map((text) => `<p>${escapeHtml(text)}</p>`).join('\n')}
<nav>${links.map(({ text, href }) => `<a href="${escapeHtml(href)}">${escapeHtml(text)}</a>`).join('')}</nav>
</main>
</body>
</html>`;
  return new Response(html, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}
