/** domain/target-hierarchy: see docs/architecture.md for responsibilities. */

export function normalizeTargetCategoryName(value) {
  var normalized = String(value == null ? '' : value)
    .replace(/\s+/g, ' ')
    .trim();
  if (normalized.normalize) {
    normalized = normalized.normalize('NFC');
  }
  return normalized.toLocaleLowerCase('de-DE');
}

export function parseTargetHierarchyCsv(csvText) {
  var text = String(csvText == null ? '' : csvText);
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  var rows = [];
  var row = [];
  var field = '';
  var inQuotes = false;
  for (var i = 0; i < text.length; i++) {
    var ch = text.charAt(i);
    if (inQuotes) {
      if (ch === '"') {
        if (text.charAt(i + 1) === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\r' || ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      if (ch === '\r' && text.charAt(i + 1) === '\n') i++;
    } else {
      field += ch;
    }
  }
  if (inQuotes) throw new Error('Die CSV enthält ein nicht geschlossenes Anführungszeichen.');
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function buildTargetHierarchy(csvText) {
  var rows = parseTargetHierarchyCsv(csvText);
  if (rows.length < 2) throw new Error('Die CSV enthält keine Zielobjektkategorien.');
  var headers = rows[0].map(function (value) {
    return String(value || '').trim();
  });
  var nameIndex = headers.indexOf('Zielobjekt');
  var definitionIndex = headers.indexOf('Definition');
  var categoryIndex = headers.indexOf('Kategorie');
  var synonymsIndex = headers.indexOf('Synonyme');
  var parentIndex = headers.indexOf('ChildOfUUID');
  var uuidIndex = headers.indexOf('UUID');
  if (
    nameIndex === -1 ||
    definitionIndex === -1 ||
    categoryIndex === -1 ||
    synonymsIndex === -1 ||
    parentIndex === -1 ||
    uuidIndex === -1
  ) {
    throw new Error('Erforderliche CSV-Spalten fehlen.');
  }

  var byUuid = Object.create(null);
  var byName = Object.create(null);
  var entries = [];
  for (var ri = 1; ri < rows.length; ri++) {
    var sourceRow = rows[ri];
    var hasValue = sourceRow.some(function (value) {
      return String(value || '').trim() !== '';
    });
    if (!hasValue) continue;
    var name = String(sourceRow[nameIndex] || '')
      .replace(/\s+/g, ' ')
      .trim();
    var uuid = String(sourceRow[uuidIndex] || '')
      .trim()
      .toLowerCase();
    var parentUuid = String(sourceRow[parentIndex] || '')
      .trim()
      .toLowerCase();
    var nameKey = normalizeTargetCategoryName(name);
    var definition = String(sourceRow[definitionIndex] || '')
      .replace(/\s+/g, ' ')
      .trim();
    var category = String(sourceRow[categoryIndex] || '')
      .replace(/\s+/g, ' ')
      .trim();
    var synonyms = String(sourceRow[synonymsIndex] || '')
      .split(',')
      .map(function (value) {
        return value.replace(/\s+/g, ' ').trim();
      })
      .filter(Boolean);
    if (
      !nameKey ||
      name.length > 160 ||
      definition.length > 10000 ||
      category.length > 160 ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(uuid)
    ) {
      throw new Error('Ungültige Zielobjektkategorie in CSV-Zeile ' + (ri + 1) + '.');
    }
    if (byUuid[uuid] || byName[nameKey]) {
      throw new Error('Doppelte Zielobjektkategorie oder UUID in CSV-Zeile ' + (ri + 1) + '.');
    }
    var entry = {
      name: name,
      nameKey: nameKey,
      definition: definition,
      category: category,
      synonyms: synonyms,
      uuid: uuid,
      parentUuid: parentUuid,
      children: [],
      depth: 0,
      rootUuid: uuid,
    };
    entries.push(entry);
    byUuid[uuid] = entry;
    byName[nameKey] = entry;
  }
  if (!entries.length) throw new Error('Die CSV enthält keine verwertbaren Zielobjektkategorien.');
  for (var ei = 0; ei < entries.length; ei++) {
    if (entries[ei].parentUuid && !byUuid[entries[ei].parentUuid]) {
      throw new Error('Die Elternkategorie von „' + entries[ei].name + '“ fehlt.');
    }
    if (entries[ei].parentUuid) byUuid[entries[ei].parentUuid].children.push(entries[ei]);
  }

  var ancestorsByUuid = Object.create(null);
  var visiting = Object.create(null);
  function collectAncestors(uuid) {
    if (ancestorsByUuid[uuid]) return ancestorsByUuid[uuid].slice();
    if (visiting[uuid]) throw new Error('Die Zielobjekthierarchie enthält einen Zyklus.');
    visiting[uuid] = true;
    var current = byUuid[uuid];
    var ancestors = [];
    if (current.parentUuid) {
      var parent = byUuid[current.parentUuid];
      ancestors.push(parent.name);
      ancestors = ancestors.concat(collectAncestors(parent.uuid));
    }
    delete visiting[uuid];
    ancestorsByUuid[uuid] = ancestors;
    return ancestors.slice();
  }

  var ancestorsByName = Object.create(null);
  var maxDepth = 0;
  for (var ai = 0; ai < entries.length; ai++) {
    var entryAncestors = collectAncestors(entries[ai].uuid);
    ancestorsByName[entries[ai].nameKey] = entryAncestors;
    entries[ai].depth = entryAncestors.length;
    if (entries[ai].depth > maxDepth) maxDepth = entries[ai].depth;
    var rootEntry = entries[ai];
    while (rootEntry.parentUuid) rootEntry = byUuid[rootEntry.parentUuid];
    entries[ai].rootUuid = rootEntry.uuid;
  }
  function sortEntries(list) {
    list.sort(function (a, b) {
      return b.name.localeCompare(a.name, 'de', { sensitivity: 'base' });
    });
    for (var si = 0; si < list.length; si++) sortEntries(list[si].children);
  }
  var roots = entries.filter(function (entry) {
    return !entry.parentUuid;
  });
  sortEntries(roots);
  return {
    ancestorsByName: ancestorsByName,
    entries: entries,
    roots: roots,
    count: entries.length,
    maxDepth: maxDepth,
  };
}
