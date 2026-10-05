/** domain/catalog-groups: see docs/architecture.md for responsibilities. */
import { SDT_PRACTICES } from '../config.js';

export function normalizePracticeKey(value) {
  var text = String(value || '')
    .trim()
    .toLowerCase();
  if (text.normalize) {
    text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  return text.replace(/[^a-z0-9]+/g, '');
}

export function groupAltIdentifier(group) {
  var props = group && Array.isArray(group.props) ? group.props : [];
  for (var i = 0; i < props.length; i++) {
    if (props[i] && String(props[i].name || '').toLowerCase() === 'alt-identifier')
      return String(props[i].value || '').trim();
  }
  return '';
}

export function isKnownPracticeGroup(group) {
  if (!group) return false;
  var id = String(group.id || '')
    .trim()
    .toUpperCase();
  var title = normalizePracticeKey(group.title || '');
  var uuid = String(group.uuid || groupAltIdentifier(group) || '')
    .trim()
    .toLowerCase();
  for (var i = 0; i < SDT_PRACTICES.length; i++) {
    var practice = SDT_PRACTICES[i];
    if (uuid && uuid === practice.uuid) return true;
    if (id === practice.id && (!title || title === normalizePracticeKey(practice.title)))
      return true;
  }
  return false;
}

export function detectCatalogGroupMode(groups) {
  var top = Array.isArray(groups)
    ? groups.filter(function (group) {
        return !!group;
      })
    : [];
  if (!top.length) return 'none';
  for (var i = 0; i < top.length; i++) {
    if (!isKnownPracticeGroup(top[i])) return 'groups';
  }
  return 'practices';
}

export function formatCatalogGroupOptionLabel(identifier, title) {
  var id = String(identifier || '').trim();
  var name = String(title || '').trim();
  if (!name || normalizePracticeKey(id) === normalizePracticeKey(name)) return id || name;
  return id ? id + ' - ' + name : name;
}
