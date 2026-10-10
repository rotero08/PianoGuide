// src/routeData.ts
//
// Starlight builds "On this page" from a page's Markdown headings. On a level page that is only
// the two headings inside the verification box, because the real sections (the two resource
// columns, the verification box itself) get their titles from component props. This adds those
// titles to the list, in the order they appear on the page.
//
// Which props count is declared on the components: `@outline <level>` in the prop's JSDoc
// (see src/utils/outline.ts). Registered as `routeMiddleware` in astro.config.mjs.

import { defineRouteMiddleware, type StarlightRouteData } from '@astrojs/starlight/route-data';
import components from 'virtual:mdx-components';
import { sectionAnchor } from './utils/outline';

type TocItem = NonNullable<StarlightRouteData['toc']>['items'][number];

/** Tag name → the prop that holds its section title, and the outline level of that title. */
const sections = new Map(
  components.flatMap((component) => component.props.filter((prop) => prop.outline).map((prop) => [component.name, { prop: prop.name, depth: prop.outline! }] as const)),
);

// One pass over the page source finds both kinds of entry in document order: a Markdown heading
// line, or the opening tag of a section component (quoted values may contain `>`).
const ENTRY = new RegExp(`^[ \\t]*#{1,6}[ \\t]+\\S|<(${[...sections.keys()].join('|') || '(?!)'})\\b((?:"[^"]*"|'[^']*'|\\{[^}]*\\}|[^>"'{])*)>`, 'gm');
const FENCED_CODE = /^[ \t]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t]*\1[ \t]*$/gm;

/** A JSX string attribute as the component receives it: MDX decodes character references in it. */
const NAMED: Record<string, string> = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' };
const decode = (text: string) =>
  text.replace(/&(?:#x([0-9a-f]+)|#(\d+)|(amp|quot|apos|lt|gt));/gi, (_, hex, dec, name) => (name ? NAMED[name.toLowerCase()] : String.fromCodePoint(hex ? parseInt(hex, 16) : Number(dec))));

/** Appends an item under the last item that is shallower than it, as Starlight nests headings. */
function place(items: TocItem[], item: TocItem): void {
  const last = items.at(-1);
  if (!last || last.depth >= item.depth) items.push(item);
  else place(last.children, item);
}

export const onRequest = defineRouteMiddleware((context) => {
  const { toc, headings, entry } = context.locals.starlightRoute;
  const overview = toc?.items[0];
  if (!toc || !overview || !entry.body || !sections.size) return;

  const found: { depth: number; slug: string; text: string }[] = [];
  let markdownHeadings = 0;
  for (const [, tag, attributes = ''] of entry.body.replace(FENCED_CODE, '').matchAll(ENTRY)) {
    if (!tag) {
      // The nth heading line is the nth heading Astro compiled; take its text and anchor from there.
      const heading = headings[markdownHeadings++];
      if (heading) found.push(heading);
      continue;
    }
    const { prop, depth } = sections.get(tag)!;
    const value = attributes.match(new RegExp(`(?:^|\\s)${prop}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`));
    const title = decode(value?.[1] ?? value?.[2] ?? '').trim();
    if (title) found.push({ depth, slug: sectionAnchor(title), text: title });
  }
  // If the scan and the compiler disagree about the headings, the order cannot be trusted:
  // leave Starlight's own list in place.
  if (markdownHeadings !== headings.length) return;

  const items: TocItem[] = [{ ...overview, children: [] }];
  for (const heading of found) {
    if (heading.depth >= toc.minHeadingLevel && heading.depth <= toc.maxHeadingLevel) place(items, { ...heading, children: [] });
  }
  toc.items = items;
});
