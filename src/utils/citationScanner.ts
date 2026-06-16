import fs from 'node:fs';
import path from 'node:path';
import { getCollection } from 'astro:content';

function getFilesRecursively(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(filePath));
    } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
      results.push(filePath);
    }
  });
  return results;
}

function extractSlug(lineText: string): string {
  const cleanLine = lineText.replace(/^\s*[*|-]\s*#ref-\d+\s*/, '').trim();
  
  const boldMatch = cleanLine.match(/^\*\*([^*]+)\*\*/);
  if (boldMatch) {
    const boldContent = boldMatch[1].trim();
    const wordMatch = boldContent.match(/[a-zA-Z0-9_-]+/);
    if (wordMatch) {
      return wordMatch[0].toLowerCase();
    }
  }
  
  const fallbackLine = cleanLine.replace(/^[^a-zA-Z0-9]+/, '');
  const wordMatch = fallbackLine.match(/[a-zA-Z0-9_-]+/);
  if (wordMatch) {
    return wordMatch[0].toLowerCase();
  }
  
  return 'ref';
}

export async function getCitationData() {
  const docsDir = path.join(process.cwd(), 'src/content/docs');
  const files = getFilesRecursively(docsDir);

  const backlinks: Record<string, Array<{ url: string; label: string }>> = {};
  const numToSlug: Record<string, string> = {};
  const slugToNumber: Record<string, number> = {};

  // 1. Scan library.mdx to build the numToSlug and slugToNumber index maps
  const libraryPath = files.find(file => file.replace(/\\/g, '/').includes('reference/library'));
  if (libraryPath && fs.existsSync(libraryPath)) {
    const content = fs.readFileSync(libraryPath, 'utf-8');
    const lines = content.split('\n');
    let insideBibliography = false;
    let index = 1;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.includes('<Bibliography>')) {
        insideBibliography = true;
        continue;
      }
      if (trimmed.includes('</Bibliography>')) {
        insideBibliography = false;
        continue;
      }
      
      if (insideBibliography && (trimmed.startsWith('* #ref-') || trimmed.startsWith('- #ref-'))) {
        const numMatch = trimmed.match(/^\s*[*|-]\s*#ref-(\d+)/);
        if (numMatch) {
          const refNum = numMatch[1];
          const slug = extractSlug(trimmed);
          numToSlug[refNum] = slug;
          slugToNumber[slug] = index;
          index++;
        }
      }
    }
  }

  // 2. Scan all files on disk to locate citations and compile backlinks
  for (const file of files) {
    if (!fs.existsSync(file)) continue;

    // EXCLUDE library.mdx itself to prevent detecting listings as active citations
    if (file.replace(/\\/g, '/').includes('reference/library')) {
      continue;
    }
    
    const content = fs.readFileSync(file, 'utf-8');
    
    const regex = /#ref-([a-zA-Z0-9_-]+)/g;
    let match;
    const counts: Record<string, number> = {};
    
    while ((match = regex.exec(content)) !== null) {
      const rawRef = match[1];
      const refSlug = numToSlug[rawRef] || rawRef.toLowerCase();
      
      counts[refSlug] = (counts[refSlug] || 0) + 1;
      
      const relativePath = path.relative(docsDir, file).replace(/\\/g, '/');
      const cleanSlug = relativePath
        .replace(/\.mdx?$/, '')
        .replace(/\/index$/, '');
        
      const docUrl = cleanSlug === '' ? '/' : `/${cleanSlug}/`;
      
      const citeId = `cite-${refSlug}-${counts[refSlug]}`;
      const targetUrl = `${docUrl}#${citeId}`;
      
      if (!backlinks[refSlug]) {
        backlinks[refSlug] = [];
      }
      if (!backlinks[refSlug].some(back => back.url === targetUrl)) {
        backlinks[refSlug].push({ url: targetUrl, label: citeId });
      }
    }
  }

  return { backlinks, numToSlug, slugToNumber };
}
