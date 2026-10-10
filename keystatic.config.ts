// keystatic.config.ts
//
// The Keystatic admin at /keystatic edits the MDX pages in src/content/docs. Each sidebar section
// is a collection over its folder, so a new page is created in the right place and appears in
// that section of the sidebar by itself.
//
// Under `pnpm dev` it edits the files of the working copy. On the deployed site it works through
// GitHub: someone with write access to the repository commits directly, anyone else is taken
// through forking it and opening a pull request.
import { collection, config, fields, singleton } from '@keystatic/core';
import { GITHUB_REPO, SECTIONS } from './site.config.mjs';
import { usesGitHub } from './src/keystatic/admin';
import { BrandMark } from './src/keystatic/brand';
import { omitDefault, pageContent } from './src/keystatic/components';
import { guideField } from './src/keystatic/guide';

/**
 * Address of the admin's "Preview" button for a page. Keystatic fills in `{branch}` (and `{slug}`
 * in a collection); src/pages/api/preview.ts then sends the editor to wherever that branch is built.
 */
const previewUrl = (page: string) => `/api/preview?branch={branch}&to=${page}`;

const description = fields.text({ label: 'Description', description: 'One sentence, shown in search results and link previews.', multiline: true });

/** One sidebar section: the .mdx files directly inside src/content/docs/<directory>/. */
function section(label: string, directory: string) {
  return collection({
    label,
    path: `src/content/docs/${directory}/*`,
    slugField: 'title',
    format: { contentField: 'content' },
    entryLayout: 'content',
    columns: ['title', 'description'],
    previewUrl: previewUrl(`/${directory}/{slug}/`),
    schema: {
      title: fields.slug({
        name: { label: 'Title', validation: { isRequired: true } },
        slug: { label: 'File name', description: 'The last part of the page address. Changing it changes the URL.' },
      }),
      description,
      sidebar: fields.object(
        {
          order: fields.integer({ label: 'Position', description: 'Lower numbers come first within the section. Leave empty to place the page after the numbered ones.' }),
          label: fields.text({ label: 'Label', description: 'Shown in the sidebar instead of the title. Leave empty to use the title.' }),
        },
        { label: 'Sidebar' },
      ),
      content: pageContent(),
    },
  });
}

export default config({
  storage: usesGitHub ? { kind: 'github', repo: GITHUB_REPO } : { kind: 'local' },
  ui: {
    brand: { name: 'The Complete Pianist', mark: BrandMark },
    navigation: {
      'Start here': ['guide'],
      Site: ['home'],
      Pages: SECTIONS.map(({ directory }) => directory),
    },
  },
  singletons: {
    // Not content: a tutorial for editors, shown inside the admin (src/keystatic/guide.tsx).
    guide: singleton({
      label: 'Editing guide',
      path: 'src/keystatic/guide',
      schema: { guide: guideField() },
    }),
    // src/content/docs/index.mdx: the only page with Starlight's "hero" banner.
    home: singleton({
      label: 'Home page',
      path: 'src/content/docs/index',
      format: { contentField: 'content' },
      entryLayout: 'content',
      previewUrl: previewUrl('/'),
      schema: {
        title: fields.text({ label: 'Title', validation: { isRequired: true } }),
        description,
        tableOfContents: omitDefault(fields.checkbox({ label: 'Show the "On this page" sidebar', defaultValue: true }), true),
        hero: fields.object(
          {
            tagline: fields.text({ label: 'Tagline', description: 'The line under the big title.' }),
            actions: fields.array(
              fields.object({
                text: fields.text({ label: 'Button text', validation: { isRequired: true } }),
                link: fields.text({ label: 'Link', description: 'A site path such as /foundations/introduction/ or a full URL.', validation: { isRequired: true } }),
                icon: fields.text({ label: 'Icon', description: 'Name of a Starlight icon, for example right-arrow.' }),
              }),
              { label: 'Buttons', itemLabel: (props) => props.fields.text.value },
            ),
          },
          { label: 'Hero banner' },
        ),
        content: pageContent(),
      },
    }),
  },
  collections: Object.fromEntries(SECTIONS.map(({ directory, label }) => [directory, section(label, directory)])),
});
