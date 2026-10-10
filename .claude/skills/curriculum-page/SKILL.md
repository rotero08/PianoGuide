---
name: curriculum-page
description: Write or restructure content pages of The Complete Pianist (the MDX files in src/content/docs). Use this whenever the task involves adding a new level, technique or harmony page, adding or editing resources, checklist tasks, benchmark pieces, citations or bibliography entries, or changing the sidebar, even if the request only says something like "add a book to level 3" or "write the next level". It covers the page anatomy, the id rules that keep readers' saved progress intact, the tag vocabulary, the citation syntax and the places outside the page that must be updated.
---

# Writing a curriculum page

Content pages are MDX files under `src/content/docs/<section>/`. They are assembled from the custom components in `src/components/`, which are available in every page without an import line. For the exact props of any component, read the JSDoc on its `Props` interface in `src/components/<Name>.astro`: that JSDoc is the single source of truth (it also drives the editor hover docs and the Keystatic forms), so prefer it over guessing or copying an old usage.

Pages are also edited through the Keystatic admin (`/keystatic`, on the dev server and on the live site), which rewrites a page in its own tidy format when it saves. Hand edits and Keystatic edits can be mixed freely as long as the page keeps to what Keystatic can read (see "What a page may contain").

## Start from the template

For a new level, copy `assets/level-page.mdx` from this skill and replace the `LEVEL`, `lvlN` and bracketed placeholders. It mirrors the existing levels (`src/content/docs/curriculum/level-1.mdx` is the most complete real example). The shape is:

1. Frontmatter: `title`, `description` and `sidebar` (see "Outside the page"). Keystatic drops any other key when it saves; the home page is the one exception, with its own form.
2. An italic kicker line, then a gold `<Callout>` stating the level's goal.
3. `<Grid cols={2}>` holding two `<ResourceColumn>`s: `id="technique"` (gold) and `id="reading"` (`accentColor="rose"`). Each holds `<Resource variant="drawer">` rows; the reading column usually ends with an `<AlternativesBox>`.
4. A `<VerificationBox trackId="lvlN">` holding a `<BenchmarkGuide>` and a two-column grid of `<Card variant="flat">`: the `<Task>` checklist on the left, the benchmark pieces on the right.
5. Optionally an `<UnlockBanner>` when the level unlocks a branch.

Technique pages use the same pieces with a single column; reference pages are plain grids of `<Resource>` cards.

## Ids are saved-progress keys

Readers' ticks, pins and choices are stored in their browser under the `id` you give a `<Task>` or `<Resource>`. That has three consequences:

- **Unique across the whole site.** Two elements with the same id share one saved state. Follow the existing prefixes: resources `lvl3-<short-name>`, tasks `check-lvl3-<short-name>`, track id `lvl3` (others in use: `tech1`, `tech2`, `prestaff`, `leadsheets`). Before adding one, grep for it: `grep -rn 'id="lvl3-' src/content`.
- **Don't rename an existing id** unless asked. Readers who already ticked it lose that progress.
- **Write `id` and `trackId` as plain string literals** (`id="check-lvl3-leaps"`, not an expression). The build finds tasks by scanning the page source, and an expression is invisible to it: the task would silently not count towards any progress bar.

Every `<Task>` needs the `trackId` of the `<VerificationBox>` it sits in; the box's percentage is "tasks with my trackId that are ticked". `<BenchmarkSelector level="…">` uses the same value.

## Resources

`<Resource>` has three shapes; pick by where it goes:

| Where | Write | Notes |
| --- | --- | --- |
| In a `<ResourceColumn>` | `variant="drawer"` + `id`, `title`, `tagline`, `link`, `tags` | Optional `practicePlan` / `doneWhen` add the two detail cells. |
| In an `<AlternativesBox>` | the same, plus `isAlternative={true}` | Readers can pin it up into the column. An `isAlternative` row placed directly in the column starts pinned and can be unpinned: use that for the one recommended default. |
| Benchmark piece | `variant="card" isBenchmark={true}` + `id`, `era`, `title`, `composer`, `sheetUrl`, `audioUrl`, `tags` | Inside `<BenchmarkSelector>` add `isPrimarySelectable={true}`. The single pass/fail "audition" piece sits above the selector, without that flag, with `tags="free audition"`. |
| Reference grids | plain card: `title`, `link`, `tags`, optional `subs`, `focus`, `icon`, `buttonText` | No `id` needed. |

`tags` is a space-separated list shown as badges. Known tags: `free`, `paid`, `paid-book`, `imslp`, `video`, `freevideo`, `blueprint`, `alternate`, `branch`, `recommended`, and the categories `acoustics`, `pedagogy`, `theory` (these also feed the category dropdown of a searchable `<Grid>`). Any other word becomes a plain badge, so a typo shows up as a stray badge rather than an error.

## Citations

Claims backed by research cite the bibliography on `/reference/library/`:

```mdx
Motor gains consolidate during sleep [7](/reference/library/#ref-7).
```

The number in the link is the authoring id of the source, not what readers see: the visible `[n]` is the source's position in the bibliography, and the anchor becomes a stable author slug. To add a source, append a line to the `<Bibliography>` list in `src/content/docs/reference/library.mdx`, using the next unused number:

```mdx
  * #ref-20 **Author, A. (2020).** *Title of the work.* Journal or publisher. One line on what it shows.
```

The first word of the bold author block becomes the anchor, so keep the `**Author (Year).**` opening. Don't renumber existing `#ref-N` markers: every citation of them elsewhere would point at the wrong source.

## Outside the page

A new page is not reachable until it is wired up:

- **Sidebar:** nothing to register. Each sidebar group lists the pages of one folder, ordered by `sidebar.order` in their frontmatter (lower first; pages without one go last, alphabetically). Give a new page the next number, or renumber its neighbours to insert it. The sidebar shows the page `title` unless `sidebar.label` gives a shorter one:

  ```yaml
  sidebar:
    order: 6
    label: Level 4 (Inversions + Speed)
  ```

  A whole new section is different: create its folder and add a line to `SECTIONS` in `site.config.mjs`. The sidebar group and the Keystatic collection are both made from that list.
- **Progress dashboard:** a new track needs a `<ProgressCard trackId="lvlN" title="…" />` in `src/content/docs/foundations/introduction.mdx`. The overall percentage picks up new tasks by itself.
- **Cross-links:** internal links are root-relative with a trailing slash (`/curriculum/level-3/`).

## What a page may contain

Keystatic refuses to open a page that contains anything it has no model for, so keep pages to Markdown plus the site's components:

- No `import` or `export` lines. Components are auto-imported; just use the tag.
- No `{/* comments */}` and no other `{expressions}` in the body. Braces are fine inside a prop value (`cols={2}`).
- No raw HTML tags (`<div>`, `<br />`, `<a>`); use Markdown or a component.
- Only the site's components (and `StarlightCard` / `CardGrid` on the home page). A new component becomes usable once it has a documented `Props` interface; see the `site-component` skill.

Other MDX details that bite:

- Boolean and number props need braces: `bordered={true}`, `cols={2}`. `bordered="true"` is a non-empty string and happens to work, `bordered="false"` is also truthy.
- Markdown inside a component needs its own lines; a `###` heading or a list must be preceded by a blank line or it renders as literal text.
- Write headings in normal case (`### Checklist & Verification`). The verification box shows its headings in small capitals by itself, and the text you type is what "On this page" lists. That list also picks up the titles of the resource columns and of the verification box, so a level page needs no extra headings to be navigable.
- `link` buttons on cards and drawers open in a new tab, including internal links.
- Don't hand-format to match Keystatic's output or "fix" what it wrote: `<Callout label="…" bordered>` and `<Callout bordered={true} accentColor="gold" label="…">` are the same thing, and Keystatic leaves out props that are at their default.

## Check your work

```sh
corepack pnpm build && corepack pnpm check && corepack pnpm test
```

The build fails on MDX syntax errors. `pnpm test` includes `tests/keystatic.mjs`, which fails with the reason if any page can no longer be opened in Keystatic. Then open the page with `corepack pnpm dev` and confirm: the column counters show the right totals, ticking a task moves the box's percentage, the page sits where you expect in the sidebar (and in the previous / next links at the bottom), the new track appears on the introduction dashboard, and any new citation shows a number and jumps to the right bibliography entry (which should list a backlink to your page). If you changed the Level 1 page, update the expectations in `tests/smoke.mjs`.
