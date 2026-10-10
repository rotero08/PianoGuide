// integrations/mdx-components.mjs
//
// Makes the public components in src/components/ available to .mdx content, with a single source
// of truth: the `export interface Props` (and its JSDoc) in each component's frontmatter.
// From that it provides three things:
//
//   1. Auto-imports. A page can use <Callout> without an import line; the import is added at
//      compile time for exactly the components the page uses. (Keystatic cannot open a page that
//      contains import statements, so content pages must not have any.) Components from packages
//      can be made available the same way through the `external` option.
//   2. Editor types. The MDX language server is plain TypeScript and cannot open .astro files, so
//      declarations are generated into `.astro/` (see `injectTypes`). They give hover docs, prop
//      autocomplete and value completion inside .mdx.
//   3. `virtual:mdx-components`. The same information as data; keystatic.config.ts turns it into
//      the editing form of each component.
//
// Everything is rebuilt by `astro dev`, `astro build` and `astro sync`, and again whenever a
// component is saved while the dev server runs.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const COMPONENTS_DIR = 'src/components'; // only top-level files here are public MDX components
const ICONS_FILE = 'src/components/icons.ts';
const ALIAS = '@components';
const VIRTUAL_ID = 'virtual:mdx-components';
/** How aliased types are worded in the one-line-per-prop summary (the prop's own hover lists every value). */
const SUMMARY_TYPE_NAMES = { IconChoice: "icon name | 'none'", IconName: 'icon name' };

/** Calls `visit(char, index, depth)` for every character of `src` that is code: comments and string literals are skipped. Return `true` from `visit` to stop. */
function scanCode(src, start, visit) {
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (ch === '/' && src[i + 1] === '*') {
      i = src.indexOf('*/', i + 2) + 1;
      if (i < 1) return;
    } else if (ch === '/' && src[i + 1] === '/') {
      i = src.indexOf('\n', i);
      if (i < 0) return;
    } else if (ch === '"' || ch === "'" || ch === '`') {
      for (i++; i < src.length && src[i] !== ch; i++) if (src[i] === '\\') i++;
    } else {
      if (ch === '{' || ch === '(' || ch === '[') depth++;
      if (ch === '}' || ch === ')' || ch === ']') depth--;
      if (visit(ch, i, depth)) return;
    }
  }
}

/** Every `export interface X { … }` in a component's frontmatter, with the JSDoc block right above it. */
function exportedInterfaces(frontmatter) {
  const found = [];
  const pattern = /(\/\*\*(?:(?!\*\/)[\s\S])*\*\/\s*)?export\s+interface\s+(\w+)[^{]*\{/g;
  for (const match of frontmatter.matchAll(pattern)) {
    const open = match.index + match[0].length - 1;
    let close = -1;
    scanCode(frontmatter, open, (ch, i, depth) => ch === '}' && depth === 0 && ((close = i), true));
    if (close < 0) throw new Error(`Unbalanced braces in interface ${match[2]}`);
    found.push({ name: match[2], doc: match[1]?.trim() ?? '', body: frontmatter.slice(open + 1, close) });
  }
  return found;
}

/** Strips the comment frame from a JSDoc block and separates its description from its `@tags`. */
function parseDoc(doc) {
  const lines = doc.replace(/^\/\*\*|\*\/$/g, '').split('\n').map((line) => line.replace(/^\s*\* ?/, ''));
  const firstTag = lines.findIndex((line) => line.trimStart().startsWith('@'));
  const description = (firstTag < 0 ? lines : lines.slice(0, firstTag)).join('\n').trim();
  const tags = firstTag < 0 ? '' : lines.slice(firstTag).join('\n').trim();
  return { description, tags, default: tags.match(/@default\s+(.+)/)?.[1].trim(), outline: Number(tags.match(/@outline\s+([2-6])\b/)?.[1]) || undefined };
}

/**
 * Splits an interface body into its members: `{ name, optional, type, description, default, outline }`.
 * `outline` is the level given by an `@outline <level>` tag: the prop is a section title that
 * belongs in the page's "On this page" list (see src/routeData.ts).
 */
function members(body) {
  const list = [];
  let start = 0;
  scanCode(body, 0, (ch, i, depth) => {
    if (ch !== ';' || depth !== 0) return;
    const chunk = body.slice(start, i);
    start = i + 1;
    const doc = parseDoc([...chunk.matchAll(/\/\*\*((?:(?!\*\/)[\s\S])*)\*\//g)].at(-1)?.[1] ?? '');
    const declaration = chunk.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '').trim();
    const parts = declaration.match(/^(\w+)(\?)?\s*:\s*([\s\S]+)$/);
    if (parts) list.push({ name: parts[1], optional: !!parts[2], type: parts[3].replace(/\s+/g, ' '), description: doc.description, default: doc.default, outline: doc.outline });
  });
  return list;
}

/** Names of every icon in icons.ts, so `icon` props can list them instead of an opaque alias. */
function iconNames(root) {
  const source = readFileSync(path.join(root, ICONS_FILE), 'utf8');
  const catalogue = source.slice(source.indexOf('export const icons'), source.indexOf('} as const'));
  return [...catalogue.matchAll(/^\s*'([\w-]+)'\s*:/gm)].map((match) => `'${match[1]}'`);
}

/** Reads every public component: its docs, its props, and whether it takes children. */
function readComponents(root) {
  const icons = iconNames(root);
  const aliases = { IconChoice: [...icons, "'none'"].join(' | '), IconName: icons.join(' | ') };
  const expand = (text) => Object.entries(aliases).reduce((out, [alias, type]) => out.replace(new RegExp(`\\b${alias}\\b`, 'g'), type), text);

  const files = readdirSync(path.join(root, COMPONENTS_DIR)).filter((file) => file.endsWith('.astro')).sort();
  return files.map((file) => {
    const source = readFileSync(path.join(root, COMPONENTS_DIR, file), 'utf8');
    const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
    const interfaces = exportedInterfaces(frontmatter);
    const props = interfaces.find((item) => item.name === 'Props');
    return {
      name: path.basename(file, '.astro'),
      file,
      documented: !!props,
      hasSlot: /<slot[\s/>]|Astro\.slots\.render/.test(source),
      ...parseDoc(props?.doc ?? ''),
      props: members(props?.body ?? ''),
      // Verbatim source of every exported interface, with aliases expanded: copied into the editor types.
      declarations: interfaces.map((item) => `${item.doc ? `${item.doc}\n` : ''}export interface ${item.name} {${expand(item.body)}}`),
      // Other interfaces a prop may refer to (e.g. `FilterOption[]`), as members.
      types: Object.fromEntries(interfaces.filter((item) => item.name !== 'Props').map((item) => [item.name, members(expand(item.body))])),
      expand,
    };
  });
}

const indent = (text, prefix) => text.split('\n').map((line) => (prefix + line).trimEnd()).join('\n');

/** The .d.ts that teaches the MDX language server about the components. */
function editorTypes(components, external) {
  const documented = components.filter((component) => component.documented);

  // What hovering a tag shows: description, one line per prop, then the examples.
  const hoverDoc = (component) => {
    const summary = component.props.map((prop) => {
      const named = SUMMARY_TYPE_NAMES[prop.type] ?? prop.type;
      const type = named.length > 60 ? `${named.slice(0, 57)}…` : named;
      const required = prop.optional ? '' : ' **(required)**';
      const fallback = prop.default ? ` Default: \`${prop.default}\`.` : '';
      return `- \`${prop.name}\`${required}: \`${type}\` — ${prop.description.replace(/\s+/g, ' ')}${fallback}`;
    });
    const text = [component.description, summary.length ? `**Props**\n${summary.join('\n')}` : '_Takes no props._', component.tags].filter(Boolean).join('\n\n');
    return indent(`/**\n${indent(text, ' * ')}\n */`, '  ');
  };

  return [
    `// Generated by integrations/mdx-components.mjs from ${COMPONENTS_DIR}/*.astro. Do not edit:\n` +
      '// change the Props interface (and its JSDoc) in the component file instead.',
    ...documented.map((component) =>
      [
        `declare module '${ALIAS}/${component.file}' {`,
        ...component.declarations.map((declaration) => indent(declaration, '  ')),
        hoverDoc(component),
        `  const ${component.name}: (props: Props) => any;`,
        `  export default ${component.name};`,
        '}',
      ].join('\n'),
    ),
    // Components are auto-imported, so .mdx pages use them without an import line: this global
    // interface is how the MDX language server learns which names exist (and their docs).
    `interface MDXProvidedComponents {\n${[
      ...documented.map((component) => `${hoverDoc(component)}\n  ${component.name}: typeof import('${ALIAS}/${component.file}').default;`),
      ...Object.entries(external).map(([local, { from, name }]) => `  ${local}: typeof import('${from}').${name};`),
    ].join('\n')}\n}`,
    [
      `declare module '${VIRTUAL_ID}' {`,
      '  export interface PropInfo { name: string; optional: boolean; type: string; description: string; default?: string; outline?: number }',
      '  export interface ComponentInfo { name: string; description: string; hasSlot: boolean; props: PropInfo[]; types: Record<string, PropInfo[]> }',
      '  const components: ComponentInfo[];',
      '  export default components;',
      '}',
    ].join('\n'),
    '',
  ].join('\n\n');
}

/** What `virtual:mdx-components` exports: plain data, with type aliases expanded to their values. */
function componentData(components) {
  return components.map(({ name, description, hasSlot, props, types, expand }) => ({
    name,
    description,
    hasSlot,
    props: props.map((prop) => ({ ...prop, type: expand(prop.type) })),
    types,
  }));
}

/** Names bound by a page's own import statements; those are never auto-imported on top. */
function importedNames(tree) {
  const names = new Set();
  for (const node of tree.children) {
    if (node.type !== 'mdxjsEsm') continue;
    for (const statement of node.data?.estree?.body ?? []) {
      for (const specifier of statement.specifiers ?? []) names.add(specifier.local.name);
    }
  }
  return names;
}

/** Names of every JSX tag in the page. */
function usedNames(node, used = new Set()) {
  if ((node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') && node.name) used.add(node.name);
  for (const child of node.children ?? []) usedNames(child, used);
  return used;
}

const identifier = (name) => ({ type: 'Identifier', name });
const importFrom = (source, specifier) => ({
  type: 'ImportDeclaration',
  specifiers: [specifier],
  source: { type: 'Literal', value: source, raw: JSON.stringify(source) },
  attributes: [],
});

/**
 * Remark plugin: prepends an import for each known component an .mdx page uses and has not
 * imported itself. `resolve(name)` returns the import statement for a known name, else undefined.
 */
function remarkAutoImport(resolve) {
  return () => (tree, file) => {
    if (!file.basename?.endsWith('.mdx')) return;
    const already = importedNames(tree);
    const imports = [...usedNames(tree)].filter((name) => !already.has(name)).map(resolve).filter(Boolean);
    if (imports.length === 0) return;
    tree.children.unshift({ type: 'mdxjsEsm', value: '', data: { estree: { type: 'Program', sourceType: 'module', body: imports } } });
  };
}

/**
 * @param {object} [options]
 * @param {Record<string, { from: string, name: string }>} [options.external] Components from
 *   packages to auto-import as well, keyed by the tag name pages use: `{ StarlightCard: { from:
 *   '@astrojs/starlight/components', name: 'Card' } }`. Their Keystatic forms are written by hand
 *   in src/keystatic/components.ts.
 */
export default function mdxComponents({ external = {} } = {}) {
  let root;
  let typesFile;
  let components = [];
  const read = () => (components = readComponents(root));

  const resolveImport = (name) => {
    if (components.some((component) => component.name === name)) {
      return importFrom(`${ALIAS}/${name}.astro`, { type: 'ImportDefaultSpecifier', local: identifier(name) });
    }
    if (external[name]) {
      return importFrom(external[name].from, { type: 'ImportSpecifier', imported: identifier(external[name].name), local: identifier(name) });
    }
  };

  return {
    name: 'mdx-components',
    hooks: {
      'astro:config:setup': ({ config, updateConfig }) => {
        root = fileURLToPath(config.root);
        read();
        updateConfig({
          markdown: { remarkPlugins: [remarkAutoImport(resolveImport)] },
          vite: {
            plugins: [
              {
                name: 'mdx-components',
                resolveId: (id) => (id === VIRTUAL_ID ? `\0${VIRTUAL_ID}` : undefined),
                load: (id) => (id === `\0${VIRTUAL_ID}` ? `export default ${JSON.stringify(componentData(components))};` : undefined),
              },
            ],
          },
        });
      },
      'astro:config:done': ({ injectTypes, logger }) => {
        typesFile = injectTypes({ filename: 'components.d.ts', content: editorTypes(components, external) });
        const undocumented = components.filter((component) => !component.documented).map((component) => component.name);
        if (undocumented.length) logger.warn(`No \`export interface Props\` found in: ${undocumented.join(', ')}`);
      },
      'astro:server:setup': ({ server, logger }) => {
        const watched = path.join(root, COMPONENTS_DIR);
        server.watcher.on('all', (_event, file) => {
          if (path.dirname(file) !== watched || !/\.astro$|icons\.ts$/.test(file)) return;
          try {
            read();
            writeFileSync(typesFile, editorTypes(components, external));
            const module = server.moduleGraph.getModuleById(`\0${VIRTUAL_ID}`);
            if (module) server.moduleGraph.invalidateModule(module);
          } catch (error) {
            logger.warn(`Could not refresh component information: ${error.message}`);
          }
        });
      },
    },
  };
}
