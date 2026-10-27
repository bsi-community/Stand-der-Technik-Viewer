/** Render each catalog part in source order, including nested sections. */
import { renderMarkupWithParams, renderTextWithParams } from '../../shared/markup.js';
import { containsAnySearchTerm, parseSearchQuery } from '../../shared/search.js';

const partLabels = new Map([
  ['guidance', 'Hinweise'],
  ['assessment-method', 'Prüfmethode'],
  ['assessment-objective', 'Prüfziel'],
]);

export function renderCatalogParts(parts, paramMap, query) {
  const searchQuery = parseSearchQuery(query);
  function renderPart(part) {
    const children = (part.parts || []).map(renderPart).filter(Boolean);
    const title = String(part.title || '').trim();
    const prose = String(part.prose || '').trim();
    if (!title && !prose && !children.length) return null;

    const label =
      part.name === 'statement'
        ? 'Anforderung'
        : title || partLabels.get(part.name) || part.name || part.id || 'Part';
    const matched =
      containsAnySearchTerm(title + ' ' + prose, searchQuery) ||
      children.some((child) => child.matched);
    const element = document.createElement('details');
    element.className = 'catalog-part';
    element.open = part.name === 'statement' || matched;
    element.innerHTML =
      '<summary><strong>' + renderTextWithParams(label, paramMap, query) + '</strong></summary>';
    if (prose) {
      const content = document.createElement('div');
      content.className = 'catalog-md';
      content.innerHTML = renderMarkupWithParams(prose, paramMap, query);
      element.append(content);
    }
    element.append(...children.map((child) => child.element));
    return { element, matched };
  }

  const fragment = document.createDocumentFragment();
  for (const part of parts || []) {
    const rendered = renderPart(part);
    if (rendered) fragment.append(rendered.element);
  }
  return fragment;
}
