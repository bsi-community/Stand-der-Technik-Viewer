/** shared/dom: see docs/architecture.md for responsibilities. */

var $ = function (s) {
  return document.querySelector(s);
};

var $$ = function (s) {
  return Array.prototype.slice.call(document.querySelectorAll(s));
};

export function cssId(s) {
  return String(s).replace(/[^a-z0-9-_]+/gi, '_');
}
export { $, $$ };
