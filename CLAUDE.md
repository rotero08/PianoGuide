# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"The Complete Pianist": a self-paced piano curriculum published as a docs site. Astro 6 + Starlight; the content is MDX in `src/content/docs/`, built from custom components in `src/components/` and editable through the Keystatic admin. Readers tick off tasks, mark resources done and pick benchmarks; all of that state lives in their browser (localStorage), there is no backend.

`README.md` is the project roadmap, in five phases. Phases 1 (content and components), 2 (Cloudflare adapter) and 3 (Keystatic, local mode) are done. Phase 4 (live preview) is next; Phase 5 moves Keystatic to GitHub storage in production.

## Commands

The repo pins pnpm 12 (`packageManager` in package.json). A globally installed pnpm 9 ignores that pin: it runs scripts fine, but `pnpm install` / `pnpm add` offer to delete `node_modules` and reinstall. Run everything through corepack so the pinned version is used.

```sh
corepack pnpm dev          # dev server on Node, http://localhost:4321 ; Keystatic admin at /keystatic
corepack pnpm build        # production build: static site in dist/client/
corepack pnpm preview      # serve the build on the Workers runtime (workerd)
corepack pnpm check        # astro sync + type-check (see limits below)
corepack pnpm test         # both test scripts below; run build first
corepack pnpm exec wrangler deploy --dry-run   # validate deploy packaging
```

- `tests/smoke.mjs` drives the *built* site in a local Chromium-family browser and exercises every interactive widget. Its expectations use the Level 1 page as fixture, so update them when that page's ids or resource counts change.
- `tests/keystatic.mjs` starts its own dev server and checks that every page opens and saves cleanly in Keystatic. Run either file directly with `node tests/<name>.mjs`. There is no linter.
- `pnpm check` only type-checks `.ts` files (scripts, utils, Keystatic config, generated component types). `.astro` frontmatter is not checked: the project uses TypeScript 7, which `@astrojs/check` does not support. The script filters out errors from Starlight's own shipped `.ts` sources.
- `wrangler deploy` publishes the live site. Only run it when asked.
- When stopping a dev server you started, kill it by port (`lsof -ti tcp:<port>`); `pkill -f` with the command text also matches the shell running it.

Version constraints that are deliberate (don't "fix" them by upgrading): Astro 6, Starlight 0.40, `@astrojs/cloudflare` 13, `@astrojs/react` 5. Newer majors exist, so `astro add <x>` and unpinned `pnpm add` pull incompatible versions; install integrations by explicit compatible version. TypeScript 7 removed `baseUrl`; `tsconfig.json` paths must stay relative. Packages with install scripts must be approved under `allowBuilds` in `pnpm-workspace.yaml`.

## Architecture

### Components: three kinds

- `src/components/*.astro` are the **public content components**, usable in any `.mdx` page.
- `src/components/ui/` holds internal building blocks shared by components (not for content).
- `src/components/overrides/` holds Starlight component overrides, registered in `astro.config.mjs`.
- `src/components/icons.ts` is the single icon catalogue; `Icon.astro` renders from it and every `icon` prop type derives from its keys.

### One description of each component, three consumers

Each public component declares `export interface Props` with JSDoc in its frontmatter. `integrations/mdx-components.mjs` reads that and provides:

1. **Auto-imports.** A page writes `<Callout>` with no import line; a remark plugin adds the import at compile time for exactly the components the page uses (so per-page CSS stays minimal). A page's own explicit imports still win.
2. **Editor types**, generated into `.astro/integrations/mdx-components/components.d.ts`: hover docs, prop autocomplete and value completion in `.mdx` (the MDX language server cannot read `.astro` files).
3. **`virtual:mdx-components`**, the same information as data. `src/keystatic/components.ts` turns it into the Keystatic editing form of each component: `string` → text, `boolean` → checkbox, literal union → dropdown, `Item[]` of an exported interface → list. Checkboxes and dropdowns left at their `@default` are not written to the file.

Consequences: never hand-write component type declarations or Keystatic forms for our components; give every prop JSDoc with `@default` where one exists (Keystatic's "omit when default" depends on it); keep prop types to the shapes above. The exception is components from packages (Starlight's cards on the home page): they are listed under `external` in `astro.config.mjs` and their forms are hand-written in `src/keystatic/components.ts`.

### Content must stay Keystatic-editable

Keystatic's MDX editor rejects a whole page if it meets anything it has no model for. Content pages therefore must not contain `import` / `export` lines, `{/* comments */}` or other `{expressions}` in the body, raw HTML, or a tag without a Keystatic form. `tests/keystatic.mjs` enforces this. Saving in Keystatic rewrites a page in its normalised format (props in schema order, one tag per line, some characters escaped, e.g. `\#ref-1`); code that scans raw MDX (`contentIndex.ts`) must accept both forms.

Keystatic (`keystatic.config.ts`) is in local mode: one collection per sidebar section folder plus a singleton for the home page. It is only loaded by `astro dev` (`isDev` in `astro.config.mjs`), because local mode needs Node's filesystem; builds do not include the admin.

Keystatic drops any frontmatter key its form does not list, so a page's frontmatter is exactly `title`, `description` and `sidebar` (`order`, optional `label`); the home page has its own form. The sidebar is generated from the section folders and ordered by `sidebar.order`, which is why a page created in the admin appears without a config change. A new section needs a folder, a sidebar group in `astro.config.mjs` and a collection in `keystatic.config.ts`.

### Interactivity: plain modules, no framework

Behaviour lives in `src/scripts/*.ts` and is pulled in by a `<script>import '../scripts/x';</script>` in the component that needs it. Astro bundles and de-duplicates those, so a script runs once per page however many instances exist. Each module uses delegated listeners and finds elements by class or `data-*` attribute; that markup is the contract between a component and its script, so change both together.

- Starlight has no client-side router: scripts run once per full page load. Don't add `astro:page-load` handlers.
- Don't use `<script is:inline>` (or `define:vars`) in components: it is emitted once per instance. That previously put a dozen copies of the same script on each level page.
- State is JSON under `cp-*` localStorage keys (`store.ts`). `<Task id>` and `<Resource id>` values are those keys: they must be unique across the whole site, and renaming one discards readers' saved progress.
- Progress read-outs share one contract: an element with `data-progress-tasks="<ids>"` containing `[data-progress-bar]` and `[data-progress-label]`.

### Build-time content index

`src/utils/contentIndex.ts` scans the raw MDX source of the whole `docs` collection once per build for facts that span pages:

- **Tasks per track:** every `<Task id="…" trackId="…">` is collected, and `VerificationBox`, `ProgressCard` and `CurriculumProgress` render the id lists they summarise. This is why a card on one page can show progress for tasks on another, and why `id` / `trackId` must be written as plain string literals.
- **Citations:** content cites with `[8](/reference/library/#ref-8)`; the `<Bibliography>` list in `reference/library.mdx` defines each `#ref-N`. The index turns numbers into stable author slugs and collects backlinks; `Bibliography.astro` renders anchors and backlinks at build time, and `scripts/citations.ts` relabels the links on citing pages.

It reads through `getCollection`, not the filesystem, so it works in any runtime. Keep it that way.

### Styling

- Design tokens are in `src/styles/custom.css`, in a dark and a light block. `--gold` and `--rose` are theme-aware (and `--gold` equals Starlight's accent in both themes), so gold/rose rules need no per-theme override. For tints use `rgba(var(--gold-rgb), <alpha>)` / `--rose-rgb`.
- Starlight sets `scopedStyleStrategy: 'where'`: scoped selectors add no specificity, so ties between components are decided by source order. Most existing rules carry `!important` for that reason; match the surrounding file rather than stripping it.
- A parent can style a child component's root by passing `class` (the parent's scope class travels with it); use `:global()` for slotted Markdown.
- Buttons shared by several components (`.btn-link`, `.btn-pill`) are global, in `custom.css`.
- `VerificationBox` restyles every `h3` inside it as a small uppercase section heading but only colours the ones written in the page (Starlight wraps those in `.sl-heading-wrapper`); a component rendering its own `h3` there keeps its own colour.

### Logo

`public/favicon.svg` is the logo: the browser-tab icon and, through `.site-title::before` in `custom.css`, the mark beside the site name. `public/favicon.ico` and `public/apple-touch-icon.png` are rendered from it (three PNG sizes in an .ico container; a 180px PNG flattened onto the tile colour). Run `corepack pnpm icons` after changing the SVG to regenerate both.

### Cloudflare

Builds use the Cloudflare adapter, which targets **Workers**; since Astro 6 it does not support Cloudflare Pages. All pages are prerendered (`output: 'static'`, the default), in Node (`prerenderEnvironment: 'node'`, because Starlight's build dependencies need it). A route opts into on-demand rendering with `export const prerender = false` and then runs on workerd in production, so anything such a route imports must avoid Node-only APIs. `wrangler.jsonc` holds only project-level settings; the adapter generates the deployable config into `dist/` at build time. The dev server does not use the adapter (see Keystatic above).

## Project skills

- `curriculum-page`: writing or restructuring a level / content page (page anatomy, ids, tags, citations, sidebar, what Keystatic accepts).
- `site-component`: creating or changing a component, icon or client script, and how its props reach the editor and Keystatic.
