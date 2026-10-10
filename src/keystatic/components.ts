// src/keystatic/components.ts
//
// Builds the Keystatic editing form of every content component from its `Props` interface.
// The props (names, types, JSDoc descriptions and `@default` values) arrive as data from
// `virtual:mdx-components` (see integrations/mdx-components.mjs), so a component only has to be
// documented once, in its own file, to be editable here.
//
// How a prop type becomes a field:
//   string                → text input (required when the prop is)
//   boolean               → checkbox
//   number                → number input
//   'a' | 'b' | 'c'       → dropdown
//   SomeInterface[]       → list of small forms (the interface must be exported by the component)
//
// A checkbox or dropdown left at the prop's default is not written to the saved MDX, so pages
// edited here stay as terse as hand-written ones: `<Callout label="Goal">`, not
// `<Callout label="Goal" bordered={false} bgColor="dark" …>`.

import { fields, type BasicFormField, type ComponentSchema } from '@keystatic/core';
import { block, wrapper } from '@keystatic/core/content-components';
import components, { type PropInfo } from 'virtual:mdx-components';

/** `buttonText` → "Button text", `ResourceColumn` → "Resource column". */
const humanize = (name: string) => name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase()).replace(/ ([A-Z])(?=[a-z])/g, (_, c: string) => ` ${c.toLowerCase()}`);

/** JSDoc is written in Markdown; field help text is plain. */
const plain = (text: string) => text.replace(/[`*]/g, '').replace(/\s+/g, ' ').trim();

/** The value of an `@default` tag (`"gold"`, `false`, `1.5`), or undefined when there is none. */
function defaultOf(prop: PropInfo): unknown {
  if (prop.default === undefined) return undefined;
  try {
    return JSON.parse(prop.default);
  } catch {
    return prop.default;
  }
}

/** Wraps a field so that a value equal to the default is not written to the file (reading it back yields the default again). */
export function omitDefault<Value extends {} | null>(field: BasicFormField<Value>, defaultValue: Value): BasicFormField<Value> {
  return { ...field, serialize: (value) => (value === defaultValue ? { value: undefined } : field.serialize(value)) };
}

const LITERAL_UNION = /^'[^']*'(\s*\|\s*'[^']*')*$/;

function fieldFor(prop: PropInfo, types: Record<string, PropInfo[]>): ComponentSchema {
  const label = humanize(prop.name);
  const description = plain(prop.description);
  const fallback = defaultOf(prop);

  if (prop.type === 'boolean') {
    const defaultValue = fallback === true;
    return omitDefault(fields.checkbox({ label, description, defaultValue }), defaultValue);
  }

  if (prop.type === 'number') {
    return fields.number({ label, description, validation: { isRequired: !prop.optional } });
  }

  if (LITERAL_UNION.test(prop.type)) {
    const values = [...prop.type.matchAll(/'([^']*)'/g)].map((match) => match[1]);
    const defaultValue = typeof fallback === 'string' && values.includes(fallback) ? fallback : values[0];
    const field = fields.select({ label, description, defaultValue, options: values.map((value) => ({ label: value, value })) });
    // A required choice is always written; an optional one only when it differs from the default.
    return prop.optional ? omitDefault(field, defaultValue) : field;
  }

  // `Item[]`, where Item is another interface exported by the component: a list of small forms.
  const itemType = prop.type.match(/^(\w+)\[\]$/)?.[1];
  if (itemType && types[itemType]) {
    const item = fields.object(Object.fromEntries(types[itemType].map((member) => [member.name, fieldFor(member, types)])));
    return fields.array(item, { label, description, itemLabel: (props) => Object.values(props.fields).map((entry) => ('value' in entry ? String(entry.value) : '')).filter(Boolean).join(' · ') });
  }

  return fields.text({ label, description, validation: { isRequired: !prop.optional } });
}

/** Every public component as a Keystatic content component. Components with children wrap content; the rest are single blocks. */
const siteComponents = Object.fromEntries(
  components.map((component) => {
    const options = {
      label: humanize(component.name),
      description: plain(component.description.split(/(?<=\.)\s/)[0] ?? ''),
      schema: Object.fromEntries(component.props.map((prop) => [prop.name, fieldFor(prop, component.types)])),
    };
    return [component.name, component.hasSlot ? wrapper(options) : block(options)];
  }),
);

/**
 * Starlight's own cards (see `external` in astro.config.mjs). Their props live in the Starlight
 * package, not in this repo, so their forms are written by hand. Keep the names in step with
 * that `external` list.
 */
const starlightComponents = {
  CardGrid: wrapper({
    label: 'Card grid (Starlight)',
    description: "Lays out Starlight cards side by side; used on the home page.",
    schema: { stagger: omitDefault(fields.checkbox({ label: 'Stagger', description: 'Shifts the second column down slightly.' }), false) },
  }),
  StarlightCard: wrapper({
    label: 'Card (Starlight)',
    description: "Starlight's built-in card; goes inside a card grid.",
    schema: {
      title: fields.text({ label: 'Title', validation: { isRequired: true } }),
      icon: fields.text({ label: 'Icon', description: 'Name of a Starlight icon, for example star or setting.' }),
    },
  }),
};

/**
 * The page body: Markdown plus the site's components.
 *
 * Keystatic writes an empty list prop as `filterOptions={[]}` on every tag that has one, so those
 * are removed from the saved text (an absent list prop reads back as an empty list).
 */
export function pageContent() {
  const field = fields.mdx({ label: 'Content', components: { ...siteComponents, ...starlightComponents } });
  const serialize: typeof field.serialize = (value, extra) => {
    const saved = field.serialize(value, extra);
    const text = new TextDecoder().decode(saved.content).replace(/ \w+=\{\[\]\}/g, '');
    return { ...saved, content: new TextEncoder().encode(text) };
  };
  return { ...field, serialize };
}
