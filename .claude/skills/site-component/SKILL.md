---
name: site-component
description: Create or change a component of The Complete Pianist site (the .astro files in src/components, their props, markup, styles, icons and client-side behaviour in src/scripts). Use this whenever the task touches a component's props or JSDoc, adds a new MDX component or icon, changes how something looks in light or dark theme, adds or fixes interactive behaviour (checkboxes, drawers, pins, progress bars, saved state), or when hover docs / autocomplete for a component inside .mdx files are wrong or missing. Follow it before editing, because several conventions here are invisible in a single file.
---

# Working on site components

## Where a component belongs

- `src/components/Name.astro`: a public component. Everything at this top level is treated as public API: it is auto-imported into every `.mdx` page that uses it, gets generated editor docs, and gets a form in the Keystatic admin.
- `src/components/ui/`: internal building blocks shared by components (for example `PinButton`, `Drawer`). Put something here when two components need the same markup and styles; not meant for MDX.
- `src/components/overrides/`: Starlight overrides, registered under `components` in `astro.config.mjs`.
- Icons are entries in `src/components/icons.ts` (inner SVG markup on a 24×24 grid, stroked with `currentColor`). Add the path there and render it with `<Icon name="…" />`; don't paste inline `<svg>` into a component. Every `icon` prop accepts the new name automatically.

## Props and their JSDoc are the public contract

`integrations/mdx-components.mjs` reads each public component's `export interface Props`, with its JSDoc, and feeds three things from it: the auto-import, the editor types that give hover docs and autocomplete in `.mdx` (the MDX tooling cannot read `.astro` files), and the component's editing form in Keystatic (`src/keystatic/components.ts`). Nothing else describes a component, so:

- Declare `export interface Props` in the frontmatter (an interface, even if empty), with a JSDoc block above it describing the component and giving at least one `@example`. The first sentence becomes the component's description in the Keystatic "insert" menu.
- Give every prop a JSDoc comment: description first, then `@default` when there is one, and an `@example` when the shape is not obvious. Write for someone authoring content: the description is shown as help text under the field in Keystatic.
- State `@default` accurately. Keystatic pre-selects it and leaves a checkbox or dropdown that is still at its default out of the saved file, so a wrong `@default` silently changes what a saved page renders.
- Keep prop types to shapes that have a form field: `string` (text), `boolean` (checkbox), `number`, a union of string literals (dropdown; give optional ones a `@default`), or `Item[]` where `Item` is another interface exported from the same frontmatter (list). `IconChoice` / `IconName` from `./icons` are fine: they are expanded into the list of icon names. Anything else falls back to a plain text field.
- A component is a "wrapper" in Keystatic when it renders a `<slot />` (or `Astro.slots`), otherwise a childless block.
- If a prop is the title of a page section (as with `ResourceColumn` and `VerificationBox`), add `@outline 2` to its JSDoc and render the heading as an `h2` or `h3` with `id={sectionAnchor(title)}` from `src/utils/outline.ts`. The title then appears in the page's "On this page" list, which otherwise only knows Markdown headings.
- Removing or renaming a prop changes content: grep `src/content` for usages and update them in the same change. Keystatic will refuse to open a page that still passes a prop the component no longer declares.

To see exactly what authors will get, run `corepack pnpm exec astro sync` and read the component's block in `.astro/integrations/mdx-components/components.d.ts`; for the Keystatic side, open any page at `/keystatic` on the dev server and press "Edit" on the component. Never edit the generated file, add hand-written `declare module` blocks, or hand-write a Keystatic form for one of our components.

Components that come from a package (Starlight's cards on the home page) are the exception: list them under `external` in `astro.config.mjs` and write their form by hand in `src/keystatic/components.ts`.

## Styling

- Use the tokens from `src/styles/custom.css` (`--gold`, `--rose`, `--bg-card`, `--border-color`, `--text-main`, `--text-muted`, `--radius`, the `--badge-*` colours). `--gold` and `--rose` already change with the theme, so a gold or rose rule needs no `:root[data-theme="light"]` twin. For translucent tints write `rgba(var(--gold-rgb), 0.13)` or `rgba(var(--rose-rgb), …)` rather than a literal colour, which would be wrong in the other theme.
- Add a light-theme override only when the value genuinely differs between themes (a different alpha, a gradient, the "ink on gold" text colour).
- Scoped styles here add no specificity (Starlight uses the `where` strategy), so two components' rules for the same element tie and source order decides. That is why most existing rules use `!important` and why components avoid styling bare tags from outside. Match the file you are in; if a rule seems to have no effect, look for a tie with another component (for example `VerificationBox` styles every `h3` inside it).
- To style a child component's root from its parent, pass it a `class`; the parent's scope class rides along. Use `:global(...)` for elements that arrive through a slot (the Markdown inside the tag).
- Reuse the shared global classes for buttons, `.btn-link` (solid) and `.btn-pill` (outlined), instead of redefining them.
- An element whose `display` is set with `!important` ignores the `hidden` attribute; add a `[hidden] { display: none !important; }` rule next to it if a script hides it.

## Behaviour

Interactive behaviour is a plain TypeScript module in `src/scripts/`, loaded by the component that needs it:

```astro
<script>
  import '../scripts/resources';
</script>
```

Astro bundles this and emits it once per page no matter how many instances render, which is the point: a page can hold twenty `<Resource>`s. For the same reason:

- Do not use `<script is:inline>` or `define:vars`; those are emitted for every instance and re-run each time.
- Handle events with one delegated listener (`document.addEventListener('click', …)` plus `closest()`), not a listener per element.
- Find elements through classes and `data-*` attributes that the component renders. That markup is the contract with the script: when you rename a class or attribute, update the script, and check `tests/smoke.mjs`, which relies on the same hooks.
- There is no client-side router, so the module runs once per full page load; no `astro:page-load` handling is needed.
- Persist reader state through the helpers in `src/scripts/store.ts` (JSON maps under `cp-*` localStorage keys), keyed by the id the author gave the element.
- A progress read-out is any element carrying `data-progress-tasks="<task ids>"` with a `[data-progress-bar]` and a `[data-progress-label]` inside; `scripts/progress.ts` fills in every one it finds.

If a component needs a fact from other pages (which tasks exist, who cites what), get it from `src/utils/contentIndex.ts` at build time and render it into the HTML. Extend that module rather than reading files directly: it must keep working without filesystem access, because on-demand routes run on Cloudflare's runtime.

## Check your work

```sh
corepack pnpm build && corepack pnpm check && corepack pnpm test
```

`check` only covers `.ts` files, so a type error inside `.astro` frontmatter will not be reported; the build and the tests are what catch component mistakes. `tests/smoke.mjs` drives the built site in a real browser through every interactive widget (extend it when you add behaviour); `tests/keystatic.mjs` confirms every page still opens in the Keystatic editor, which is what breaks when a prop is renamed or its type stops matching the content; `tests/routes.mjs` covers the routes the Worker answers and is not affected by component work.

If a change alters what an author sees in the editor (a renamed prop, a new component people should know about), check whether the editing guide (`src/keystatic/guide.tsx`) and the Contributing page (`src/content/docs/reference/contributing.mdx`) still describe it correctly.

Then look at the result yourself with `corepack pnpm dev`: both themes (the theme picker in the header), a narrow window, and for anything stateful, that it is still there after a reload.
