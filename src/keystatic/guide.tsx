// src/keystatic/guide.tsx
//
// The "Editing guide" entry of the Keystatic admin: a short tutorial shown inside the admin
// itself. Keystatic has no help pages of its own, but a form field may render anything, so the
// guide is a field that shows text and stores nothing. The longer public version is the
// Contributing page of the site (src/content/docs/reference/contributing.mdx): keep both in step.

import type { BasicFormField } from '@keystatic/core';
import type { ReactNode } from 'react';
import { GITHUB_REPO, PRODUCTION_BRANCH } from '../../site.config.mjs';
import { CONTRIBUTING_PATH, usesGitHub } from './admin';

// Colours and fonts come from the admin's own theme variables, so the guide follows its light and dark modes.
const css = `
.cp-guide { max-width: 44rem; font-family: var(--kui-typography-font-family-base, system-ui, sans-serif); font-size: 0.95rem; line-height: 1.6; color: var(--kui-color-foreground-neutral); }
.cp-guide h2 { margin: 2rem 0 0.5rem; font-size: 1.1rem; font-weight: 600; color: var(--kui-color-foreground-neutral-emphasis); }
.cp-guide p { margin: 0 0 0.75rem; }
.cp-guide ol, .cp-guide ul { margin: 0 0 0.75rem; padding-inline-start: 1.4rem; }
.cp-guide li { margin-bottom: 0.35rem; }
.cp-guide a { color: var(--kui-color-foreground-accent); }
.cp-guide b { font-weight: 600; color: var(--kui-color-foreground-neutral-emphasis); }
.cp-guide code { padding: 0.1em 0.35em; border-radius: 4px; background: var(--kui-color-background-surface-secondary); font-family: var(--kui-typography-font-family-code, monospace); font-size: 0.9em; }
.cp-guide .cp-guide-note { margin: 0 0 1rem; padding: 0.85rem 1rem; border: 1px solid var(--kui-color-border-accent); border-radius: 8px; background: var(--kui-color-background-accent); }
.cp-guide .cp-guide-note p:last-child { margin-bottom: 0; }
`;

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section>
    <h2>{title}</h2>
    {children}
  </section>
);

/** What pressing Save does, which is the one thing that differs between the dev server and the live site. */
function Saving() {
  if (!usesGitHub) {
    return (
      <Section title="Where your changes go">
        <p>
          You are on the development server, so <b>Save</b> writes straight to the <code>.mdx</code> files of your working copy, and the site in your other tab
          reloads by itself. Nothing is published: commit and push as usual when you are done.
        </p>
      </Section>
    );
  }
  return (
    <Section title="Where your changes go">
      <p>
        <b>Save</b> records your change in the GitHub repository <code>{GITHUB_REPO}</code>, on the branch shown at the top of the menu on the left.
      </p>
      <ul>
        <li>
          <b>If you can write to the repository</b>, the change is committed directly. On <code>{PRODUCTION_BRANCH}</code> that publishes it: the live site
          rebuilds and shows it a couple of minutes later.
        </li>
        <li>
          <b>If you cannot</b>, your first save asks you to fork the repository (make your own copy on GitHub) and to install this editor's GitHub App on that
          copy. From then on your saves go to your copy, and you propose them with a pull request:
          <ol>
            <li>
              Open the branch menu at the top left and choose <b>New branch…</b>. Give it a short name such as <code>fix-level-2-links</code>.
            </li>
            <li>Edit and save as many pages as you like on that branch.</li>
            <li>
              Open the branch menu again and choose <b>Create pull request</b>. GitHub opens with your changes listed: describe them and submit.
            </li>
          </ol>
          A maintainer reviews the pull request, and merging it publishes your changes.
        </li>
      </ul>
    </Section>
  );
}

function Guide() {
  return (
    <div className="cp-guide">
      <style>{css}</style>
      <div className="cp-guide-note">
        <p>
          This editor changes the pages of The Complete Pianist. Nothing here needs code: you edit text, fill in forms, and press <b>Save</b>. This page itself
          is only a guide; there is nothing on it to save.
        </p>
      </div>

      <Section title="Find a page">
        <p>
          The menu on the left lists the site's sections under <b>Pages</b>; they are the groups of the site's sidebar. Open a section, then a page. The home
          page is on its own under <b>Site</b>. On the site, the <b>Edit page</b> link at the foot of every page brings you straight to that page here.
        </p>
      </Section>

      <Section title="Edit the text">
        <p>
          The middle of the screen is the page. Click into it and type. The toolbar above it sets headings, bold, italics, lists, links and tables, and{' '}
          <b>Reset changes</b> at the top right takes the page back to how it was when you opened it.
        </p>
      </Section>

      <Section title="Edit the boxes">
        <p>
          Most of a page is made of labelled boxes: a Callout, a Resource, a Task, a Grid. Each is a building block of the site with its own settings.
        </p>
        <ul>
          <li>
            <b>Edit</b>, on a box's title bar, opens its settings as a form. Every field says underneath what it is for.
          </li>
          <li>Text inside a box is edited in place, like any other text. Boxes can hold other boxes: a Grid holds Resource columns, which hold Resources.</li>
          <li>
            To add a box, put the cursor on an empty line and press the <b>+</b> button at the right of the toolbar. It lists every kind of box with a line
            on what it is for.
          </li>
          <li>To remove one, click its title bar to select it and press Delete.</li>
        </ul>
      </Section>

      <Section title="Page settings">
        <p>
          The panel on the right holds the page's <b>Title</b>, its <b>Description</b> (shown in search results), and its place in the sidebar:{' '}
          <b>Position</b> orders the pages of a section, lower numbers first. <b>File name</b> is the last part of the page's address, so changing it breaks
          every existing link to the page.
        </p>
      </Section>

      <Section title="Three things to leave alone">
        <ul>
          <li>
            <b>The Id of a Task or a Resource.</b> Readers' ticks and pins are saved under it in their browser. Change it and everyone loses that progress.
            A new Task or Resource needs an Id that no other page uses.
          </li>
          <li>
            <b>The Track id of a Task</b> must match the Verification box it sits in, or the task stops counting towards the progress bar.
          </li>
          <li>
            <b>The numbers of the sources in the Library</b> (<code>#ref-7</code>). Other pages cite them by that number. Add new sources at the end with the
            next free number.
          </li>
        </ul>
      </Section>

      <Saving />

      <Section title="Check the result">
        <p>
          <b>Preview</b>, the icon at the top right of a page, opens that page on the site.{' '}
          {usesGitHub
            ? `On ${PRODUCTION_BRANCH} that is the live page, which catches up with a save in a couple of minutes. Any other branch has its own preview address, built a minute or two after each save.`
            : 'Here that is the development site, which already shows what you saved.'}
        </p>
      </Section>

      <Section title="More">
        <p>
          The <a href={CONTRIBUTING_PATH} target="_blank" rel="noreferrer">Contributing page</a> of the site goes through all of this step by step, and
          explains what makes a good addition.
        </p>
      </Section>
    </div>
  );
}

/** A field that only displays the guide: it has no value and writes nothing to the file. */
export function guideField(): BasicFormField<null> {
  return {
    kind: 'form',
    label: 'Editing guide',
    Input: Guide,
    defaultValue: () => null,
    parse: () => null,
    serialize: () => ({ value: undefined }),
    validate: (value) => value,
    reader: { parse: () => null },
  };
}
