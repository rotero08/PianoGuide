// src/utils/contentIndex.ts
import { getCollection } from 'astro:content';

export interface Backlink {
  /** URL of the citing page, including the `#cite-…` anchor of that occurrence. */
  url: string;
  /** The anchor id the client assigns to that occurrence (`cite-<slug>-<n>`). */
  label: string;
}

export interface ContentIndex {
  /** Authored reference number (`#ref-8`) → stable slug (`ericsson`). */
  numToSlug: Record<string, string>;
  /** Slug → 1-based position in the bibliography, used as the visible `[n]` label. */
  slugToNumber: Record<string, number>;
  /** Slug → every place in the docs that cites it, in page order. */
  backlinks: Record<string, Backlink[]>;
  /** Progress track id → ids of every `<Task>` that belongs to it, across all pages. */
  tasks: Record<string, string[]>;
}

const LIBRARY_ID = 'reference/library';
/** The `* #ref-12 ` that opens a bibliography entry. Keystatic saves the `#` escaped (`\#ref-12`). */
const REF_MARKER = /^\s*[*-]\s*\\?#ref-(\d+)\s*/;

/** Derives a short, stable slug from a bibliography line (the first word of its bold author block). */
function extractSlug(line: string): string {
  const firstWord = (text: string) => text.replace(/^[^a-zA-Z0-9]+/, '').match(/[a-zA-Z0-9_-]+/)?.[0].toLowerCase();
  const text = line.replace(REF_MARKER, '').trim();
  const author = text.match(/^\*\*([^*]+)\*\*/)?.[1];
  return (author && firstWord(author)) ?? firstWord(text) ?? 'ref';
}

const pageUrl = (id: string) => {
  const slug = id.replace(/(^|\/)index$/, '');
  return slug ? `/${slug}/` : '/';
};

async function buildIndex(): Promise<ContentIndex> {
  // Sorted so backlink letters (a, b, c…) are stable from one build to the next.
  const docs = (await getCollection('docs')).sort((a, b) => a.id.localeCompare(b.id));
  const index: ContentIndex = { numToSlug: {}, slugToNumber: {}, backlinks: {}, tasks: {} };

  // 1. The bibliography on the library page defines the number → slug mapping.
  const library = docs.find((doc) => doc.id === LIBRARY_ID);
  const bibliography = library?.body?.match(/<Bibliography>([\s\S]*?)<\/Bibliography>/)?.[1] ?? '';
  let position = 0;
  for (const line of bibliography.split('\n')) {
    const num = line.match(REF_MARKER)?.[1];
    if (!num) continue;
    // Two sources by the same author would collide: the later one becomes `<author>-2`, and so on.
    const base = extractSlug(line);
    let slug = base;
    for (let n = 2; slug in index.slugToNumber; n++) slug = `${base}-${n}`;
    index.numToSlug[num] = slug;
    index.slugToNumber[slug] = ++position;
  }

  for (const doc of docs) {
    const body = doc.body ?? '';

    // 2. Every other page contributes backlinks for the references it cites.
    if (doc.id !== LIBRARY_ID) {
      const counts: Record<string, number> = {};
      for (const [, ref] of body.matchAll(/#ref-([a-zA-Z0-9_-]+)/g)) {
        const slug = index.numToSlug[ref] ?? ref.toLowerCase();
        counts[slug] = (counts[slug] ?? 0) + 1;
        const label = `cite-${slug}-${counts[slug]}`;
        (index.backlinks[slug] ??= []).push({ url: `${pageUrl(doc.id)}#${label}`, label });
      }
    }

    // 3. Every <Task id trackId> registers itself with its progress track.
    for (const [tag] of body.matchAll(/<Task\b[^>]*>/g)) {
      const id = tag.match(/\bid="([^"]+)"/)?.[1];
      const trackId = tag.match(/\btrackId="([^"]+)"/)?.[1];
      if (id && trackId) (index.tasks[trackId] ??= []).push(id);
    }
  }

  return index;
}

let cached: Promise<ContentIndex> | undefined;

/**
 * Cross-page facts gathered from the raw docs source: citation numbering/backlinks and the
 * task list of each progress track. Scanned once per build; re-scanned per call in dev so
 * edits show up without a restart.
 */
export function getContentIndex(): Promise<ContentIndex> {
  if (import.meta.env.DEV) return buildIndex();
  return (cached ??= buildIndex());
}
