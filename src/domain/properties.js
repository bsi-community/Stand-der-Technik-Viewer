/** domain/properties: see docs/architecture.md for responsibilities. */
import { SECURITY_TARGET_DEFINITIONS } from '../config.js';
import { splitMulti, uniqueList } from '../shared/collections.js';

export function valueOfProp(props, name) {
  if (!props || !props.length) return '';
  var wanted = String(name || '').toLowerCase();
  for (var i = 0; i < props.length; i++) {
    var p = props[i];
    if (p && String(p.name || '').toLowerCase() === wanted) return p.value || '';
  }
  return '';
}

export function extractEffortInfo(props) {
  var value = '';
  if (props && props.length) {
    // effort_level ist in OSCAL-Katalogen nur ein Verfuegbarkeitssignal.
    // Der hinterlegte Zahlenwert darf in der Katalogansicht nicht erscheinen.
    var hasEffortLevel = false;
    for (var i = 0; i < props.length; i++) {
      var effortProp = props[i];
      if (effortProp && String(effortProp.name || '').toLowerCase() === 'effort_level') {
        hasEffortLevel = true;
        break;
      }
    }
    if (hasEffortLevel) {
      value = 'n/a';
    }
    var names = ['effort', 'level', 'aufwand'];
    for (var ni = 0; ni < names.length && !value; ni++) {
      value = valueOfProp(props, names[ni]) || '';
    }
    if (!value) {
      for (var j = 0; j < props.length && !value; j++) {
        var p = props[j];
        if (!p) continue;
        if (p.value != null && /^[0-9]+(\.[0-9]+)?$/.test(String(p.value))) {
          value = String(p.value);
        }
      }
    }
  }
  return { label: 'Aufwand', value: value };
}

export function extractSecLevelsFromProps(props) {
  var out = [];
  if (!props || !props.length) return out;
  for (var i = 0; i < props.length; i++) {
    var p = props[i];
    if (!p) continue;
    var name = p.name || '';
    var ns = p.ns || '';
    var val = p.value || '';
    var nameMatch = /^(sec_level|sec-level|security_level|security-level|sicherheitsniveau)$/i.test(
      name,
    );
    var nsMatch = /sicherheitsniveau/i.test(String(ns));
    if (nameMatch || nsMatch) {
      var vals = splitMulti(val);
      if (!vals.length && val) {
        vals = [String(val)];
      }
      for (var k = 0; k < vals.length; k++) {
        out.push(vals[k]);
      }
    }
  }
  return out;
}

export function extractSecLevels(props) {
  return uniqueList(extractSecLevelsFromProps(props));
}

export function extractTargetsFromProps(props) {
  var out = [];
  if (!props || !props.length) return out;
  for (var i = 0; i < props.length; i++) {
    var p = props[i];
    if (!p) continue;
    var name = p.name || '';
    var ns = p.ns || '';
    var val = p.value || '';
    var nameMatch = /^(target_object_categories?|zielobjektkategorien?|zielobjekte?)$/i.test(name);
    var nsMatch = /(target_object_categories?|zielobjektkategorien?|zielobjekte?)/i.test(
      String(ns),
    );
    if (nameMatch || nsMatch) {
      var vals = splitMulti(val);
      if (!vals.length && val) {
        vals = [String(val)];
      }
      for (var k = 0; k < vals.length; k++) {
        out.push(vals[k]);
      }
    }
  }
  return out;
}

export function extractTargets(props, parts) {
  var out = [];
  var a = extractTargetsFromProps(props);
  for (var i = 0; i < a.length; i++) out.push(a[i]);
  if (Array.isArray(parts)) {
    for (var j = 0; j < parts.length; j++) {
      var p = parts[j];
      if (p && Array.isArray(p.props)) {
        var b = extractTargetsFromProps(p.props);
        for (var k = 0; k < b.length; k++) out.push(b[k]);
      }
    }
  }
  return uniqueList(out);
}

export function propsDeclareTargetObjectCategories(props) {
  if (!Array.isArray(props)) return false;
  for (var i = 0; i < props.length; i++) {
    var prop = props[i];
    if (!prop) continue;
    var name = String(prop.name || '')
      .trim()
      .toLowerCase();
    var ns = String(prop.ns || '')
      .trim()
      .toLowerCase();
    if (
      name === 'target_object_categories' ||
      /(?:^|\/)target_object_categories\.csv(?:$|[?#])/.test(ns)
    )
      return true;
  }
  return false;
}

export function controlDeclaresTargetObjectCategories(props, parts) {
  if (propsDeclareTargetObjectCategories(props)) return true;
  if (!Array.isArray(parts)) return false;
  for (var i = 0; i < parts.length; i++) {
    if (parts[i] && propsDeclareTargetObjectCategories(parts[i].props)) return true;
  }
  return false;
}

export function extractTagsFromProps(props) {
  var out = [];
  if (!props || !props.length) return out;
  for (var i = 0; i < props.length; i++) {
    var p = props[i];
    if (!p) continue;
    var name = p.name || '';
    var ns = p.ns || '';
    var val = p.value || '';
    var nameMatch = /^(tags?|tag)$/i.test(name);
    var nsMatch = /tags?/i.test(String(ns));
    if (nameMatch || nsMatch) {
      var vals = splitMulti(val);
      if (!vals.length && val) {
        vals = [String(val)];
      }
      for (var k = 0; k < vals.length; k++) {
        out.push(vals[k]);
      }
    }
  }
  return out;
}

export function extractTags(props, parts) {
  var out = [];
  var a = extractTagsFromProps(props);
  for (var i = 0; i < a.length; i++) out.push(a[i]);
  if (Array.isArray(parts)) {
    for (var j = 0; j < parts.length; j++) {
      var p = parts[j];
      if (p && Array.isArray(p.props)) {
        var b = extractTagsFromProps(p.props);
        for (var k = 0; k < b.length; k++) out.push(b[k]);
      }
    }
  }
  return uniqueList(out);
}

export function extractModalverbsFromProps(props) {
  var out = [];
  if (!props || !props.length) return out;
  for (var i = 0; i < props.length; i++) {
    var p = props[i];
    if (!p) continue;
    var name = p.name || '';
    var ns = p.ns || '';
    var val = p.value || '';
    var nameMatch = /^modal_?verb$/i.test(name);
    var nsMatch = /modal_?verb/i.test(String(ns));
    if (nameMatch || nsMatch) {
      var vals = splitMulti(val);
      if (!vals.length && val) {
        vals = [String(val)];
      }
      for (var k = 0; k < vals.length; k++) {
        var mv = String(vals[k] || '')
          .trim()
          .toUpperCase();
        if (mv) out.push(mv);
      }
    }
  }
  return out;
}

export function extractModalverbs(props, parts) {
  var out = [];
  var a = extractModalverbsFromProps(props);
  for (var i = 0; i < a.length; i++) out.push(a[i]);
  if (Array.isArray(parts)) {
    for (var j = 0; j < parts.length; j++) {
      var p = parts[j];
      if (p && Array.isArray(p.props)) {
        var b = extractModalverbsFromProps(p.props);
        for (var k = 0; k < b.length; k++) out.push(b[k]);
      }
    }
  }
  return uniqueList(out);
}

export function extractDocumentationFromProps(props) {
  var out = [];
  if (!props || !props.length) return out;
  for (var i = 0; i < props.length; i++) {
    var p = props[i];
    if (!p) continue;
    var name = p.name || '';
    var ns = p.ns || '';
    var val = p.value || '';
    var nameMatch = /^(documentation|documentation_recommendation|dokumentationsempfehlung)$/i.test(
      name,
    );
    var nsMatch = /(dokumentationsempfehlungen|documentation_recommendation)/i.test(String(ns));
    if (nameMatch || nsMatch) {
      if (val != null && String(val).trim()) {
        out.push(String(val).trim());
      }
    }
  }
  return out;
}

export function extractDocumentation(props, parts) {
  var out = [];
  var a = extractDocumentationFromProps(props);
  for (var i = 0; i < a.length; i++) out.push(a[i]);
  function walkParts(arr) {
    if (!Array.isArray(arr)) return;
    for (var j = 0; j < arr.length; j++) {
      var p = arr[j];
      if (!p) continue;
      if (Array.isArray(p.props)) {
        var b = extractDocumentationFromProps(p.props);
        for (var k = 0; k < b.length; k++) out.push(b[k]);
      }
      if (Array.isArray(p.parts) && p.parts.length) {
        walkParts(p.parts);
      }
    }
  }
  walkParts(parts);
  return uniqueList(out);
}

export function extractActionWordsFromProps(props) {
  var out = [];
  if (!props || !props.length) return out;
  for (var i = 0; i < props.length; i++) {
    var p = props[i];
    if (!p) continue;
    var name = p.name || '';
    var ns = p.ns || '';
    var val = p.value || '';
    var nameMatch = /^(handlungsworte|handlungswort|action_words?)$/i.test(name);
    var nsMatch = /handlungsworte|action_words?/i.test(String(ns));
    if (nameMatch || nsMatch) {
      if (val != null && String(val).trim()) {
        out.push(String(val).trim());
      }
    }
  }
  return out;
}

export function extractActionWords(props, parts) {
  var out = [];
  var a = extractActionWordsFromProps(props);
  for (var i = 0; i < a.length; i++) out.push(a[i]);
  function walkParts(arr) {
    if (!Array.isArray(arr)) return;
    for (var j = 0; j < arr.length; j++) {
      var p = arr[j];
      if (!p) continue;
      if (Array.isArray(p.props)) {
        var b = extractActionWordsFromProps(p.props);
        for (var k = 0; k < b.length; k++) out.push(b[k]);
      }
      if (Array.isArray(p.parts) && p.parts.length) {
        walkParts(p.parts);
      }
    }
  }
  walkParts(parts);
  return uniqueList(out);
}

export function isAssignedSecurityTargetValue(value) {
  var normalized = String(value == null ? '' : value)
    .trim()
    .toLowerCase();
  if (!normalized) return false;
  if (/^[+-]?\d+(?:[.,]\d+)?$/.test(normalized))
    return parseFloat(normalized.replace(',', '.')) > 0;
  return !/^(?:false|no|nein|none|nicht zugeordnet|n\/a|-)$/.test(normalized);
}

export function extractControlSecurityMetadata(props) {
  var result = { threats: [], targetValues: {}, assignedTargets: [] };
  for (var d = 0; d < SECURITY_TARGET_DEFINITIONS.length; d++) {
    result.targetValues[SECURITY_TARGET_DEFINITIONS[d].key] = [];
  }
  var items = Array.isArray(props) ? props : [];
  for (var i = 0; i < items.length; i++) {
    var prop = items[i];
    if (!prop) continue;
    var name = String(prop.name || '')
      .trim()
      .toLowerCase();
    var value = prop.value == null ? '' : String(prop.value).trim();
    if (!value) continue;
    if (name === 'threats') {
      var threatValues = splitMulti(value);
      result.threats = result.threats.concat(threatValues.length ? threatValues : [value]);
      continue;
    }
    for (var t = 0; t < SECURITY_TARGET_DEFINITIONS.length; t++) {
      var definition = SECURITY_TARGET_DEFINITIONS[t];
      if (name === definition.key) {
        result.targetValues[definition.key].push(value);
        break;
      }
    }
  }
  result.threats = uniqueList(result.threats);
  for (var ti = 0; ti < SECURITY_TARGET_DEFINITIONS.length; ti++) {
    var key = SECURITY_TARGET_DEFINITIONS[ti].key;
    result.targetValues[key] = uniqueList(result.targetValues[key]);
    for (var vi = 0; vi < result.targetValues[key].length; vi++) {
      if (isAssignedSecurityTargetValue(result.targetValues[key][vi])) {
        result.assignedTargets.push(key);
        break;
      }
    }
  }
  return result;
}

export function securityTargetLabel(key) {
  for (var i = 0; i < SECURITY_TARGET_DEFINITIONS.length; i++) {
    if (SECURITY_TARGET_DEFINITIONS[i].key === key) return SECURITY_TARGET_DEFINITIONS[i].label;
  }
  return key;
}
