/** domain/parameters: see docs/architecture.md for responsibilities. */
import { valueOfProp } from './properties.js';

export function normalizeParamEntry(entry) {
  var src = entry || {};
  var label = src.label == null ? '' : String(src.label);
  var value = src.value == null ? '' : String(src.value);
  return { label: label, value: value, hasValue: !!value };
}

export function buildParamMap(paramsArr, idKey) {
  var map = {};
  var keyName = idKey || 'id';
  if (Array.isArray(paramsArr)) {
    for (var i = 0; i < paramsArr.length; i++) {
      var p = paramsArr[i] || {};
      var pid = (p[keyName] || p.id || '').toLowerCase();
      var label = p.label || valueOfProp(p.props, 'label') || '';
      var values = Array.isArray(p.values) ? p.values : [];
      var value = values.length ? String(values[0]) : p.value != null ? String(p.value) : '';
      if (pid) {
        map[pid] = normalizeParamEntry({ label: label, value: value });
      }
    }
  }
  return map;
}

export function mergeParamMaps(baseMap, overrideMap) {
  var out = {},
    key,
    entry;
  if (baseMap) {
    for (key in baseMap) {
      if (Object.prototype.hasOwnProperty.call(baseMap, key)) {
        out[key] = normalizeParamEntry(baseMap[key]);
      }
    }
  }
  if (overrideMap) {
    for (key in overrideMap) {
      if (!Object.prototype.hasOwnProperty.call(overrideMap, key)) continue;
      entry = normalizeParamEntry(overrideMap[key]);
      if (entry.hasValue || entry.label || !out[key]) out[key] = entry;
    }
  }
  return out;
}

export function replaceParams(text, paramMap) {
  if (!text) return text;
  return String(text).replace(
    /\{\{\s*insert\s*:\s*param\s*,\s*([^}\s]+)\s*\}\}/gi,
    function (m, pid) {
      var key = String(pid || '').toLowerCase();
      var entry = paramMap && paramMap[key];
      if (entry && entry.hasValue && entry.value) {
        return '{{ value:' + entry.value + ' }}';
      }
      if (entry && entry.label) {
        return '{{ label:' + entry.label + ' }}';
      }
      return m;
    },
  );
}

export function partText(parts, name) {
  if (!parts) return '';
  for (var i = 0; i < parts.length; i++) {
    if (parts[i] && parts[i].name === name) return parts[i].prose || '';
  }
  return '';
}
