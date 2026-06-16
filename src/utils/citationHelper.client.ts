(function() {
  interface Backlink {
    url: string;
    label: string;
  }

  interface CitationData {
    numToSlug: Record<string, string>;
    slugToNumber: Record<string, number>;
    backlinks: Record<string, Backlink[]>;
  }

  function getCidData(): CitationData {
    const numEl = document.querySelector('[data-num-to-slug]');
    const slugEl = document.querySelector('[data-slug-to-number]');
    
    const numToSlug: Record<string, string> = numEl 
      ? JSON.parse(numEl.getAttribute('data-num-to-slug') || '{}') 
      : {};
    const slugToNumber: Record<string, number> = slugEl 
      ? JSON.parse(slugEl.getAttribute('data-slug-to-number') || '{}') 
      : {};
    const backlinks: Record<string, Backlink[]> = numEl 
      ? JSON.parse(numEl.getAttribute('data-backlinks') || '{}') 
      : {};
    
    return { numToSlug, slugToNumber, backlinks };
  }

  function assignCitationIds(): void {
    const counts: Record<string, number> = {};
    const { numToSlug, slugToNumber } = getCidData();
    const slugKeys = Object.keys(slugToNumber);

    document.querySelectorAll('a[href*="#ref-"]').forEach((element) => {
      const link = element as HTMLAnchorElement;
      
      // Skip already processed citation elements
      if (link.id && link.id.startsWith('cite-')) return;

      const href = link.getAttribute('href') || '';
      const hashPart = href.split('#')[1];
      if (!hashPart) return;

      const cleanHash = hashPart.replace(/^#/, '');
      const rawRef = cleanHash.replace(/^ref-/, '');

      // Idempotent Check: If hash already contains a resolved slug, skip rewrite
      if (isNaN(Number(rawRef)) && slugKeys.includes(rawRef.toLowerCase())) {
        if (!link.id) {
          const finalSlug = rawRef.toLowerCase();
          counts[finalSlug] = (counts[finalSlug] || 0) + 1;
          link.id = `cite-${finalSlug}-${counts[finalSlug]}`;
        }
        return;
      }

      const slug = numToSlug[rawRef] || rawRef.toLowerCase();
      
      counts[slug] = (counts[slug] || 0) + 1;
      link.id = `cite-${slug}-${counts[slug]}`;

      const baseUrl = href.split('#')[0];
      link.setAttribute('href', `${baseUrl}#ref-${slug}`);

      const realIndex = slugToNumber[slug];
      if (realIndex) {
        link.textContent = `[${realIndex}]`;
      }
    });
  }

  function assignBibliographyIds(): void {
    const bibContainer = document.querySelector('.bibliography-container');
    if (bibContainer) {
      const backlinks: Record<string, Backlink[]> = JSON.parse(bibContainer.getAttribute('data-backlinks') || '{}');
      const slugToNumber: Record<string, number> = JSON.parse(bibContainer.getAttribute('data-slug-to-number') || '{}');
      const items = bibContainer.querySelectorAll('li');
      
      items.forEach((item, index) => {
        if (item.id && item.id.startsWith('ref-') && item.querySelector('.backlink-span')) return;
        
        item.innerHTML = item.innerHTML.replace(/^\s*#ref-\d+\s*/, '');
        const itemNum = index + 1;
        const slug = Object.keys(slugToNumber).find(key => slugToNumber[key] === itemNum);
        
        if (slug) {
          item.id = `ref-${slug}`;
          
          const citations = backlinks[slug];
          if (citations && citations.length > 0 && !item.querySelector('.backlink-span')) {
            let backHtml = '';
            if (citations.length === 1) {
              backHtml = `<a href="${citations[0].url}" class="backlink-arrow" title="Back to citation">^</a> `;
            } else {
              backHtml = `<span class="backlink-arrow-text">^</span> `;
              citations.forEach((cit, citIndex) => {
                const letter = String.fromCharCode(97 + citIndex);
                backHtml += `<a href="${cit.url}" class="backlink-letter" title="Back to citation ${letter}">${letter}</a> `;
              });
            }
            
            const span = document.createElement('span');
            span.className = 'backlink-span';
            span.innerHTML = backHtml;
            item.insertBefore(span, item.firstChild);
          }
        } else if (!item.id) {
          item.id = `ref-item-${index + 1}`;
        }
      });
    }
  }

  function highlightTargetAndScroll(): void {
    const hash = window.location.hash;
    if (!hash) return;
    
    try {
      const target = document.querySelector(hash);
      if (target) {
        let highlightEl: HTMLElement | null = target as HTMLElement;
        const blockTypes = ['P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DIV', 'TR', 'BLOCKQUOTE'];
        while (highlightEl.parentElement && !blockTypes.includes(highlightEl.tagName)) {
          highlightEl = highlightEl.parentElement as HTMLElement;
        }

        // Apply a high-performance inline CSS animation sequence
        highlightEl.style.transition = 'none';
        highlightEl.style.backgroundColor = 'rgba(201, 168, 76, 0.25)'; // Gold tint
        highlightEl.style.boxShadow = '0 0 0 8px rgba(201, 168, 76, 0.25)';
        highlightEl.style.borderRadius = '4px';

        // Check for Light theme configurations
        const isLightTheme = document.documentElement.getAttribute('data-theme') === 'light' || 
                              document.body.classList.contains('light');
        if (isLightTheme) {
          highlightEl.style.backgroundColor = 'rgba(154, 116, 32, 0.20)';
          highlightEl.style.boxShadow = '0 0 0 8px rgba(154, 116, 32, 0.20)';
        }

        // Scroll cleanly to the target container
        highlightEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Force browser layout repaint to register layout changes
        void highlightEl.offsetHeight;

        // Smoothly fade-out the styling using standard transition timings
        highlightEl.style.transition = 'background-color 2.5s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 2.5s cubic-bezier(0.25, 1, 0.5, 1)';
        highlightEl.style.backgroundColor = 'transparent';
        highlightEl.style.boxShadow = '0 0 0 0 transparent';

        // Strip inline styles once the transition completes to keep DOM clean
        setTimeout(() => {
          if (highlightEl) {
            highlightEl.style.transition = '';
            highlightEl.style.backgroundColor = '';
            highlightEl.style.boxShadow = '';
            highlightEl.style.borderRadius = '';
          }
        }, 2500);

        if (target instanceof HTMLElement) {
          target.focus();
          setTimeout(() => {
            target.blur();
          }, 100);
        }
      }
    } catch (e) {
      console.warn("Target scroll error:", e);
    }
  }

  // Execute processing steps synchronously
  assignBibliographyIds();
  assignCitationIds();
  highlightTargetAndScroll();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      assignBibliographyIds();
      assignCitationIds();
      highlightTargetAndScroll();
    });
  } else {
    assignBibliographyIds();
    assignCitationIds();
    highlightTargetAndScroll();
  }

  if (!(window as any).__citationListenersAttached) {
    (window as any).__citationListenersAttached = true;
    window.addEventListener('hashchange', highlightTargetAndScroll);
    document.addEventListener('astro:page-load', () => {
      assignBibliographyIds();
      assignCitationIds();
      highlightTargetAndScroll();
    });
  }
})();
