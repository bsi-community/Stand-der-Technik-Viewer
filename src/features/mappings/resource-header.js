/** Compact resource identity and loading guidance in the existing table header. */
import { describeMappingResource } from '../../domain/mapping-resource.js';
import { resolveMappingCatalogSource } from './resolution.js';

function appendText(parent, className, value) {
  const element = document.createElement('div');
  element.className = className;
  element.textContent = value;
  parent.appendChild(element);
  return element;
}

export function appendMappingResourceHeader(cell, entries, side, state) {
  const seen = new Set();
  const rendered = new Set();
  for (const entry of entries) {
    const resource = entry[side + 'Resource'];
    if (seen.has(resource)) continue;
    seen.add(resource);
    const details = describeMappingResource(resource, state.backMatter, state.baseUrl);
    const source = resolveMappingCatalogSource(
      resource,
      entry[side + 'Catalog'],
      entry[side + 'CatalogRefs'] || entry[side + 'Refs'],
    );
    const loadedVersion = source?.json?.catalog?.metadata?.version;
    const key = JSON.stringify([details, source?.catalogUuid, source?.catalogTitle, loadedVersion]);
    if (rendered.has(key)) continue;
    rendered.add(key);
    const block = document.createElement('div');
    block.className = 'mapping-catalog-context';
    appendText(block, 'mapping-catalog-name', source?.catalogTitle || details.title);
    for (const ref of details.references) {
      const line = appendText(
        block,
        'mapping-catalog-reference',
        ref.value.startsWith('#') ? 'Mapping-Referenz: ' : 'Referenz: ',
      );
      const value = document.createElement(ref.url ? 'a' : 'span');
      value.textContent = ref.value;
      if (ref.url) {
        value.href = ref.url;
        value.target = '_blank';
        value.rel = 'noopener noreferrer';
      }
      line.appendChild(value);
    }
    const versions = [...new Set(details.versions.map((version) => version.value))];
    const versionLine = appendText(
      block,
      'mapping-catalog-version',
      versions.length
        ? 'Versionsangabe im Mapping: ' + versions.join(' · ')
        : 'Katalogversion im Mapping nicht angegeben',
    );
    if (versions.length) {
      versionLine.title =
        details.versions
          .map(
            (version) =>
              `${version.origin}: ${version.name} = ${version.value}${version.namespace ? ' (' + version.namespace + ')' : ''}`,
          )
          .join('\n') + '\nAngabe des Herausgebers; nicht anhand der Katalogdatei verifiziert.';
    }
    appendText(
      block,
      'mapping-catalog-status',
      source
        ? 'Zugeordneter Katalog geladen' + (loadedVersion ? ' · Version ' + loadedVersion : '')
        : details.type === 'profile'
          ? 'Für Titel und Anforderungstexte den aufgelösten Katalog in der Katalogansicht laden.'
          : 'Für Titel und Anforderungstexte in der Katalogansicht laden.',
    );
    cell.appendChild(block);
  }
}
