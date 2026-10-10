// src/scripts/gridFilter.ts
// Live text + category filtering for <Grid searchable>.

document.querySelectorAll<HTMLElement>('.grid-container[data-searchable]').forEach((grid) => {
  const search = grid.querySelector<HTMLInputElement>('.input-filter');
  const select = grid.querySelector<HTMLSelectElement>('.select-filter');
  const cards = [...grid.querySelectorAll<HTMLElement>('.resource-card')];

  function filter(): void {
    const query = search?.value.toLowerCase().trim() ?? '';
    const category = select?.value ?? 'all';
    for (const card of cards) {
      const matches =
        (card.textContent ?? '').toLowerCase().includes(query) &&
        (category === 'all' || card.dataset.category === category);
      // Inline `!important` because the card's own `display` rule is `!important` too.
      if (matches) card.style.removeProperty('display');
      else card.style.setProperty('display', 'none', 'important');
    }
  }

  search?.addEventListener('input', filter);
  select?.addEventListener('change', filter);
});
