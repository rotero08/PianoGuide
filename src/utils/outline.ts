// src/utils/outline.ts
//
// Some section titles are rendered by a component rather than written as a Markdown heading: a
// resource column, the verification box. They belong in the page's "On this page" list all the
// same. Such a component marks the prop with `@outline <level>` in its JSDoc and gives the
// heading it renders the id from `sectionAnchor`; src/routeData.ts finds the tags in the page
// source and adds the entries, which link to that id.

/** Anchor of a section title. The same text always gives the same anchor, so the component and the outline agree without sharing state. */
export const sectionAnchor = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
