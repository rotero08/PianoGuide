// keystatic.config.ts
//
// The Keystatic admin (http://localhost:4321/keystatic while `pnpm dev` runs) edits the MDX pages
// in src/content/docs directly. Each sidebar section is a collection over its folder, so a new
// page is created in the right place and appears in that section of the sidebar by itself.
import { collection, config, fields, singleton } from '@keystatic/core';
import { omitDefault, pageContent } from './src/keystatic/components';

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
  storage: { kind: 'local' },
  ui: {
    brand: { name: 'The Complete Pianist' },
    navigation: {
      Site: ['home'],
      Pages: ['foundations', 'technique', 'curriculum', 'harmony', 'skills', 'reference'],
    },
  },
  singletons: {
    // src/content/docs/index.mdx: the only page with Starlight's "hero" banner.
    home: singleton({
      label: 'Home page',
      path: 'src/content/docs/index',
      format: { contentField: 'content' },
      entryLayout: 'content',
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
  collections: {
    foundations: section('Foundations', 'foundations'),
    technique: section('Technique Foundations', 'technique'),
    curriculum: section('Sight-Reading Curriculum', 'curriculum'),
    harmony: section('Harmony & Keyboard Track', 'harmony'),
    skills: section('Reading Skills & Tools', 'skills'),
    reference: section('Discovery & Reference', 'reference'),
  },
});
