# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"The Complete Pianist": a self-paced piano curriculum published as a docs site. Astro 6 + Starlight; the content is MDX in `src/content/docs/`, built from custom components in `src/components/` and editable through the Keystatic admin. Readers tick off tasks, mark resources done and pick benchmarks; all of that state lives in their browser (localStorage), there is no backend.

`README.md` is the public face of the project: what it is and what it does, with the logo, badges and screenshots, and little else. Technical and setup detail belongs in this file, not there. `site.config.mjs` holds the facts several files share: the GitHub repository, the production branch, the site's addresses, the GitHub App slug and the list of sidebar sections.

## Commands

The repo pins pnpm 12 (`packageManager` in package.json). A globally installed pnpm 9 ignores that pin: it runs scripts fine, but `pnpm install` / `pnpm add` offer to delete `node_modules` and reinstall. Run everything through corepack so the pinned version is used.

```sh
corepack pnpm dev          # dev server on Node, http://localhost:4321 ; Keystatic admin at /keystatic, editing local files
corepack pnpm dev:github   # the same with the admin in GitHub mode (creating the GitHub App, trying the sign-in flow)
corepack pnpm build        # production build: static site in dist/client/, Worker in dist/server/
corepack pnpm preview      # serve the build on the Workers runtime (workerd)
corepack pnpm check        # astro sync + type-check (see limits below)
corepack pnpm test         # the three test scripts below; run build first
corepack pnpm exec wrangler deploy --dry-run   # validate deploy packaging
corepack pnpm screenshots  # retake the README screenshots from the build (.github/assets/)
```

- `tests/smoke.mjs` drives the *built* site in a local Chromium-family browser and exercises every interactive widget. Its expectations use the Level 1 page as fixture, so update them when that page's ids or resource counts change.
- `tests/routes.mjs` serves the build with `astro preview` and checks what the Worker answers: the admin, the preview endpoint (including that it cannot be used as an open redirect) and the "Edit page" link. It sends requests as browser navigations, which is what catches a route missing from `run_worker_first` (see Cloudflare below).
- `tests/keystatic.mjs` starts its own dev server and checks that every page opens and saves cleanly in Keystatic. Run any of the three directly with `node tests/<name>.mjs`. There is no linter.
- `pnpm check` only type-checks `.ts` files (scripts, utils, Keystatic config, generated component types). `.astro` frontmatter is not checked: the project uses TypeScript 7, which `@astrojs/check` does not support. The script filters out errors from Starlight's own shipped `.ts` sources.
- `wrangler deploy` publishes the live site. Only run it when asked. There is deliberately no `deploy` script: `pnpm deploy` is a built-in pnpm command, not a script runner.
- When stopping a dev server you started, kill it by port (`lsof -ti tcp:<port>`); `pkill -f` with the command text also matches the shell running it.

Version constraints that are deliberate (don't "fix" them by upgrading): Astro 6, Starlight 0.40, `@astrojs/cloudflare` 13, `@astrojs/react` 5. Newer majors exist, so `astro add <x>` and unpinned `pnpm add` pull incompatible versions; install integrations by explicit compatible version. TypeScript 7 removed `baseUrl`; `tsconfig.json` paths must stay relative. Packages with install scripts must be approved under `allowBuilds` in `pnpm-workspace.yaml`.

## Git

Commits and pull requests are made as the repository owner, with no trace of Claude: no `Co-Authored-By` trailer, no "Generated with Claude Code" line, no mention of an assistant in the message or the description. `.claude/settings.json` turns the automatic attribution off; do not add any by hand.

- Write messages the way the existing history does: one short lowercase line saying what changed (`git log --oneline`).
- This machine has no global git identity. Commit as the author of the existing commits by passing it for that command (`git -c user.name=… -c user.email=… commit`, values from `git log -1 --format='%an %ae'`), rather than changing git config.

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

Keystatic drops any frontmatter key its form does not list, so a page's frontmatter is exactly `title`, `description` and `sidebar` (`order`, optional `label`); the home page has its own form. The sidebar is generated from the section folders and ordered by `sidebar.order`, which is why a page created in the admin appears without a config change. A new section is a folder plus one line in `SECTIONS` (`site.config.mjs`): the sidebar group and the Keystatic collection both come from that list.

### The admin: local files in dev, GitHub on the deployed site

`keystatic.config.ts` defines one collection per section, a singleton for the home page and the "Editing guide" singleton. Where it stores content is decided by `usesGitHub` in `src/keystatic/admin.ts`:

- **`pnpm dev`: local mode.** Save writes the `.mdx` files of the working copy. The dev server runs on Node without the Cloudflare adapter (`isDev` in `astro.config.mjs`) because this needs a real filesystem.
- **Builds (and `pnpm dev:github`): GitHub mode.** The admin and its API are on-demand routes of the Worker. People sign in with GitHub through a GitHub App; someone with write access commits straight to the branch (on `main` that publishes), anyone else is taken through forking the repository and opening a pull request. That behaviour is Keystatic's own; nothing here implements it. It needs three Worker secrets (`KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`) and the app's slug in `site.config.mjs`. Where the secrets are missing (branch previews) `src/middleware.ts` answers the admin routes with an explanation instead of Keystatic's bare error.

  The GitHub App was created with Keystatic's own setup screen (`pnpm dev:github`, then `/keystatic`), which writes the four values to an untracked `.env`; `wrangler secret bulk .env` uploads them. The app only accepts sign-ins from the callback addresses registered with it, so if the site moves, add `https://<new address>/api/keystatic/github/oauth/callback` in the app's settings on GitHub. It must be installed on the repository for saves to work.

Pieces around it:

- **"Edit page" link** (`src/components/overrides/EditLink.astro`) at the foot of every page opens that page's editor. Admin addresses differ by mode (GitHub mode puts `/branch/<name>/` in them); build them with `adminPath()` from `src/keystatic/admin.ts`. A build renders the link only when `KEYSTATIC_GITHUB_APP_SLUG` is set and it is the production branch being built.
- **Preview button** (`previewUrl` in the config, answered by `src/pages/api/preview.ts`). Pages are built ahead of time, so a branch cannot be rendered on demand: the endpoint sends the editor to where that branch is built, which is the site itself for `main` and Cloudflare's per-branch preview build for anything else. It only ever redirects to a path of this site or to that preview host; keep it that way.
- **Editing guide** (`src/keystatic/guide.tsx`) is a tutorial inside the admin: a form field that renders text and stores nothing (`src/keystatic/guide.yaml` exists only so the entry does not show as "unsaved"). The public version is `src/content/docs/reference/contributing.mdx`. Both describe the editor's actual buttons, so change them together and check the wording against the running admin.

### "On this page"

Starlight builds the outline in the right-hand column from a page's Markdown headings. Level pages have only two of those; their real sections get their titles from component props. So:

- A component marks a section-title prop with `@outline <level>` in its JSDoc and gives the heading it renders `id={sectionAnchor(title)}` (`src/utils/outline.ts`). `ResourceColumn` and `VerificationBox` do this.
- `src/routeData.ts` (Starlight route middleware) scans the page source for those tags and merges the titles with the Markdown headings, in document order. If its count of heading lines ever disagrees with the compiler's, it leaves Starlight's list alone.
- `src/scripts/toc.ts` adds two rules to Starlight's highlighting: at the end of the page the last entry is marked (short final sections never reach the top of the window), and a clicked entry stays marked until the reader scrolls again (`scripts/citations.ts` centres every `#target`, so it would otherwise not be the marked one).

Write headings in normal case. `VerificationBox` capitalises its `###` headings with CSS; typing them in capitals puts capitals in the outline.

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
- `custom.css` also sets the space between the end of a page and its Previous / Next links (one 2rem gap, whatever block the page ends with) and keeps the outline list inside its column.
- `VerificationBox` restyles every `h3` inside it as a small uppercase section heading but only colours the ones written in the page (Starlight wraps those in `.sl-heading-wrapper`); a component rendering its own `h3` there keeps its own colour.

### Logo

`public/favicon.svg` is the logo: the browser-tab icon and, through `.site-title::before` in `custom.css`, the mark beside the site name. `public/favicon.ico` and `public/apple-touch-icon.png` are rendered from it (three PNG sizes in an .ico container; a 180px PNG flattened onto the tile colour). Run `corepack pnpm icons` after changing the SVG to regenerate both. The same command renders `.github/assets/app-logo.png`, the picture of the editor's GitHub App, which has to be uploaded by hand in the app's settings on GitHub. The admin shows the logo beside the site name through `ui.brand.mark` in `keystatic.config.ts`.

The README's screenshots live in `.github/assets/` too and are taken by `tools/make-screenshots.mjs` (`corepack pnpm screenshots`, after a build): the site in its dark theme with some progress filled in, and the editor from the dev server. Retake them when the look of those pages changes.

### Cloudflare

Builds use the Cloudflare adapter, which targets **Workers**; since Astro 6 it does not support Cloudflare Pages. All content pages are prerendered (`output: 'static'`, the default), in Node (`prerenderEnvironment: 'node'`, because Starlight's build dependencies need it). `wrangler.jsonc` holds only project-level settings; the adapter generates the deployable config into `dist/` at build time. The dev server does not use the adapter (see the admin above).

The on-demand routes (`export const prerender = false`) are the Keystatic admin (`/keystatic/*`), its API (`/api/keystatic/*`) and `/api/preview`. They run on workerd, so anything they import must avoid Node-only APIs. What is not obvious from the files:

- **A new on-demand route must be added to `assets.run_worker_first` in `wrangler.jsonc`.** With `not_found_handling: "404-page"`, Cloudflare answers a browser navigation to a path that is not a file with the 404 page without running the Worker. Such a route works with `curl` and 404s in the browser; `tests/routes.mjs` exists to catch exactly that.
- `astro.config.mjs` names a session driver only to stop the adapter from defaulting to a Cloudflare KV store (nothing uses sessions), and excludes `@keystatic/astro` from dependency pre-bundling because esbuild cannot resolve the virtual module its routes import. Both look removable and are not.
- Cloudflare (Workers Builds) is connected to the repository and builds and deploys every push to `main` (`pnpm run build`, then `npx wrangler deploy`), which is how a save in the live editor reaches the site. `site.config.mjs` holds the site's addresses; change `SITE_URL` there if it gets its own domain.
- Branch previews come from Workers Builds running `wrangler preview` for branches other than `main`, when preview builds are enabled for the Worker; they are served at `<branch>-<worker>.<account>.workers.dev` and get none of the production secrets (the `previews` block in `wrangler.jsonc`), so the admin does not work there.

## Project skills

- `curriculum-page`: writing or restructuring a level / content page (page anatomy, ids, tags, citations, sidebar, what Keystatic accepts).
- `site-component`: creating or changing a component, icon or client script, and how its props reach the editor and Keystatic.
