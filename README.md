# The Complete Pianist

A self-paced piano curriculum (technique + sight-reading) as a small static
site. The original single 3,300-line HTML file has been split into one file per
tab plus a handful of small modules, so you can hand an AI (or yourself) just
the one file you want to change.

## Running it

The site uses ES modules and `fetch`, so it has to be served over HTTP — open
it through a local server, not by double-clicking the file.

- **VS Code Live Server:** right-click `index.html` → *Open with Live Server*.
- **Python:** `python3 -m http.server` in this folder, then open the printed
  `http://localhost:8000`.
- **Node:** `npx serve` (or any static file server) in this folder.

Any plain static server works. There is **no special configuration** — no
single-page-app fallback, no rewrite rules — because routing lives entirely in
the URL hash (see below), so the server only ever serves `index.html`.

## How routing works

State is kept in the URL hash, which means reloading the page or opening a link
in a new tab always works on any static server:

| URL                              | What it shows                                  |
| -------------------------------- | ---------------------------------------------- |
| `#/home`                         | the Home tab                                   |
| `#/level-1`                      | the Level 1 tab                                |
| `#/level-1/m-level-1-7`          | Level 1, scrolled to and flashing a target     |
| `#/q/triad`                      | a full-text search for "triad"                 |

Search results are ordinary links to those hashes, so left-click jumps in
place, and middle-click / Ctrl-click / "Open in new tab" open the match in a
new browser tab that loads already centred on it.

The last open tab, the theme, checkbox progress, and which resources you've
marked done are all saved to `localStorage` and restored on the next visit.
First-ever visit defaults to Home.

## Project layout

```
index.html              app shell: sidebar, top bar, search box, mount points
css/
  tokens.css            colours, fonts, spacing variables (+ light theme)
  layout.css            page frame, sidebar, top bar, search box
  typography.css        headings and body type
  components.css        every reusable block (cards, widgets, search results…)
  pages.css             the reading-column layout and home page
tabs/
  home.html             one file per tab — edit a tab in isolation here
  level-1.html
  …                     (26 tab fragments in total)
js/
  util.js               tiny shared helpers, localStorage wrapper, hash helpers
  app.js                tab list, fragment loader, hash router, theme, boot
  content.js            progress, resources/collapsibles, library, page contents
  media.js              audio keyboard, intro chord, hover tooltips
  search.js             full-text search across all tabs
```

### Editing a tab

Each file in `tabs/` is a single `<section class="content-section" id="…">`.
To change a tab's content, edit only that file. To add, remove, or reorder
tabs, update the `TAB_ORDER` list at the top of `js/app.js` and add the
matching nav button in `index.html`.

### How a tab is loaded

`app.js` fetches every fragment once at startup, parses each one, and injects
**only** its `<section>` element. Anything a dev server appends to a served
file (for example Live Server's live-reload script) is discarded during that
parse, so injected code can never show up in search results or interfere with
the page.
