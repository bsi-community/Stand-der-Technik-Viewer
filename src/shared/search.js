/** shared/search: see docs/architecture.md for responsibilities. */

export function normalizeSearchValue(value) {
  return String(value == null ? '' : value)
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('de-DE');
}

var _searchQueryCacheRaw = null;

var _searchQueryCache = { groups: [], terms: [], highlightTerms: [] };

export function parseSearchQuery(rawQuery) {
  var raw = String(rawQuery == null ? '' : rawQuery);
  if (raw === _searchQueryCacheRaw) return _searchQueryCache;
  var tokens = [];
  var current = '';
  var inQuotes = false;
  function addCurrent(quoted) {
    var value = normalizeSearchValue(current);
    current = '';
    if (value) tokens.push({ value: value, quoted: !!quoted });
  }
  for (var i = 0; i < raw.length; i++) {
    var ch = raw.charAt(i);
    if (ch === '"') {
      addCurrent(inQuotes);
      inQuotes = !inQuotes;
    } else if (/\s/.test(ch) && !inQuotes) {
      addCurrent(false);
    } else {
      current += ch;
    }
  }
  addCurrent(inQuotes);
  var groups = [];
  var currentGroup = [];
  var groupSeen = Object.create(null);
  var terms = [];
  var termSeen = Object.create(null);
  var highlightTerms = [];
  var highlightByValue = Object.create(null);
  function finishGroup() {
    if (currentGroup.length) groups.push(currentGroup);
    currentGroup = [];
    groupSeen = Object.create(null);
  }
  for (var ti = 0; ti < tokens.length; ti++) {
    var token = tokens[ti];
    if (!token.quoted && token.value === 'oder') {
      finishGroup();
      continue;
    }
    var groupKey = (token.quoted ? 'exact:' : 'partial:') + token.value;
    if (!groupSeen[groupKey]) {
      groupSeen[groupKey] = true;
      currentGroup.push({ value: token.value, exact: !!token.quoted });
    }
    if (!termSeen[token.value]) {
      termSeen[token.value] = true;
      terms.push(token.value);
    }
    if (!highlightByValue[token.value]) {
      highlightByValue[token.value] = { value: token.value, exact: !!token.quoted };
      highlightTerms.push(highlightByValue[token.value]);
    } else if (!token.quoted) {
      highlightByValue[token.value].exact = false;
    }
  }
  finishGroup();
  _searchQueryCacheRaw = raw;
  _searchQueryCache = { groups: groups, terms: terms, highlightTerms: highlightTerms };
  return _searchQueryCache;
}

export function normalizeSearchQuery(searchQuery) {
  return searchQuery && Array.isArray(searchQuery.groups) && Array.isArray(searchQuery.terms)
    ? searchQuery
    : parseSearchQuery(searchQuery);
}

var _searchWordCharacterRe;

try {
  _searchWordCharacterRe = new RegExp('[\\p{L}\\p{N}\\p{M}]', 'u');
} catch (_searchWordCharacterError) {
  _searchWordCharacterRe = /[0-9A-Za-zÀ-ÖØ-öø-ÿ]/;
}

export function isSearchWordCharacter(value) {
  return !!value && _searchWordCharacterRe.test(value);
}

export function hasStandaloneSearchBoundaries(text, start, length) {
  var before = start > 0 ? text.charAt(start - 1) : '';
  var after = start + length < text.length ? text.charAt(start + length) : '';
  return !isSearchWordCharacter(before) && !isSearchWordCharacter(after);
}

export function containsSearchClause(normalizedText, clause) {
  var value = typeof clause === 'string' ? clause : clause && clause.value;
  var exact = !!(clause && typeof clause === 'object' && clause.exact);
  if (!value) return false;
  var start = 0;
  var index;
  while ((index = normalizedText.indexOf(value, start)) !== -1) {
    if (!exact || hasStandaloneSearchBoundaries(normalizedText, index, value.length)) return true;
    start = index + Math.max(1, value.length);
  }
  return false;
}

export function matchesSearchText(text, searchQuery) {
  var query = normalizeSearchQuery(searchQuery);
  if (!query.groups.length) return true;
  var normalizedText = normalizeSearchValue(text);
  for (var gi = 0; gi < query.groups.length; gi++) {
    var group = query.groups[gi];
    var groupMatches = true;
    for (var ti = 0; ti < group.length; ti++) {
      if (!containsSearchClause(normalizedText, group[ti])) {
        groupMatches = false;
        break;
      }
    }
    if (groupMatches) return true;
  }
  return false;
}

export function containsAnySearchTerm(text, searchQuery) {
  var query = normalizeSearchQuery(searchQuery);
  if (!query.terms.length) return false;
  var normalizedText = normalizeSearchValue(text);
  for (var gi = 0; gi < query.groups.length; gi++) {
    for (var ti = 0; ti < query.groups[gi].length; ti++) {
      if (containsSearchClause(normalizedText, query.groups[gi][ti])) return true;
    }
  }
  return false;
}

export function escapeRegExp(s) {
  return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function searchTermRegexSource(term) {
  return escapeRegExp(term).replace(/\s+/g, '\\s+');
}

var _searchHighlightCacheQuery = '';

var _searchHighlightCachePatterns = [];

export function getSearchHighlightPatterns(rawQuery) {
  var query = String(rawQuery == null ? '' : rawQuery);
  if (query === _searchHighlightCacheQuery) return _searchHighlightCachePatterns;
  var parsedQuery = parseSearchQuery(query);
  var terms = (parsedQuery.highlightTerms || []).slice().sort(function (a, b) {
    return b.value.length - a.value.length;
  });
  _searchHighlightCacheQuery = query;
  _searchHighlightCachePatterns = terms.map(function (term) {
    return { exact: term.exact, regex: new RegExp(searchTermRegexSource(term.value), 'gi') };
  });
  return _searchHighlightCachePatterns;
}

export function getSearchHighlightRanges(text, patterns) {
  var ranges = [];
  for (var pi = 0; pi < patterns.length; pi++) {
    var pattern = patterns[pi];
    var match;
    pattern.regex.lastIndex = 0;
    while ((match = pattern.regex.exec(text)) !== null) {
      if (!pattern.exact || hasStandaloneSearchBoundaries(text, match.index, match[0].length)) {
        ranges.push({ start: match.index, end: match.index + match[0].length });
      }
      if (!match[0].length) pattern.regex.lastIndex++;
    }
  }
  ranges.sort(function (a, b) {
    return a.start - b.start || b.end - b.start - (a.end - a.start);
  });
  var selected = [];
  var cursor = -1;
  for (var ri = 0; ri < ranges.length; ri++) {
    if (ranges[ri].start < cursor) continue;
    selected.push(ranges[ri]);
    cursor = ranges[ri].end;
  }
  return selected;
}

export function highlightSearchInHtml(html, rawQuery) {
  var patterns = getSearchHighlightPatterns(rawQuery);
  if (!patterns.length) return html;
  return String(html)
    .split(/(<[^>]+>)/g)
    .map(function (part) {
      if (part && part.charAt(0) === '<') return part;
      var ranges = getSearchHighlightRanges(part, patterns);
      if (!ranges.length) return part;
      var highlighted = '';
      var cursor = 0;
      for (var ri = 0; ri < ranges.length; ri++) {
        highlighted +=
          part.slice(cursor, ranges[ri].start) +
          '<mark class="search-hit">' +
          part.slice(ranges[ri].start, ranges[ri].end) +
          '</mark>';
        cursor = ranges[ri].end;
      }
      return highlighted + part.slice(cursor);
    })
    .join('');
}
