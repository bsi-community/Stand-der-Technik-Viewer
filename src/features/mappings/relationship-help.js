/** German translations of the NIST OSCAL 1.2.3 relationship definitions. */
export const RELATIONSHIP_SOURCE =
  'https://pages.nist.gov/OSCAL-Reference/models/v1.2.3/mapping/json-reference/#/mapping-collection/mappings/mapping/maps/relationship';
const definitions = {
  'equal-to': [
    'Gleich',
    'Die Anforderungen von Source und Target sind gleich. Unterschiede in Groß- und Kleinschreibung, Schreibweise und Grammatik können ignoriert werden, sofern sie die Bedeutung nicht verändern. Die Beziehung gilt auch in umgekehrter Richtung.',
  ],
  'equivalent-to': [
    'Gleichwertig',
    'Die Anforderungen von Source und Target sind ähnlich, aber nicht notwendigerweise identisch. Die Formulierungen können abweichen; beide zugeordneten Mengen vermitteln ähnliche Informationen mit derselben wirksamen Bedeutung. Die Beziehung gilt auch umgekehrt und ist für einen syntaktischen Vergleich weniger geeignet.',
  ],
  'subset-of': [
    'Teilmenge',
    'Die Anforderungen der Source sind eine Teilmenge der Anforderungen des Targets. Target enthält alle Anforderungen der Source und zusätzliche Anforderungen. In umgekehrter Richtung lautet die Beziehung „superset-of“.',
  ],
  'superset-of': [
    'Obermenge',
    'Die Anforderungen der Source sind eine Obermenge der Anforderungen des Targets. Source enthält alle Anforderungen des Targets und zusätzliche Anforderungen. In umgekehrter Richtung lautet die Beziehung „subset-of“.',
  ],
  'intersects-with': [
    'Teilweise Überschneidung',
    'Die Anforderungen von Source und Target überschneiden sich teilweise. Beide enthalten jedoch auch Inhalte, die in der jeweils anderen Menge fehlen. Die Beziehung gilt auch umgekehrt. Ein Mapping einzelner Anforderungsaussagen kann Beziehungen ergeben, die weitergehende Schlussfolgerungen erlauben.',
  ],
  'no-relationship': [
    'Keine Beziehung',
    'Die Anforderungen von Source und Target stehen in keiner Beziehung; ihre Inhalte überschneiden sich nicht. Dieser Typ dient besonderen Fällen, etwa der Anpassung einer Beziehung an die Implementierung und Konfiguration einer Komponente oder eines Systems, und nicht der vollständigen Auflistung aller überschneidungsfreien Anforderungen. Er unterstützt auch NIST IR 8477.',
  ],
};
let sequence = 0;
let active;

function dismiss() {
  active?.close();
  active = null;
}
// One set of global dismissal handlers, irrespective of the mapping size.
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') dismiss();
});
document.addEventListener('pointerdown', (event) => {
  if (active && !active.button.contains(event.target) && !active.tip.contains(event.target))
    dismiss();
});
window.addEventListener('scroll', () => active?.position(), true);
window.addEventListener('resize', () => active?.position());

export function addRelationshipHelp(cell, relationship) {
  const badge = cell.querySelector('.mapping-relation-badge');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = badge.className + ' mapping-relationship-trigger';
  button.textContent = relationship;
  button.setAttribute('aria-label', relationship + ' – Bedeutung');
  const tip = document.createElement('div');
  tip.id = 'mapping-relationship-help-' + ++sequence;
  tip.className = 'mapping-relationship-tooltip';
  tip.setAttribute('role', 'tooltip');
  tip.setAttribute('popover', 'manual');
  button.setAttribute('aria-describedby', tip.id);
  const [title, description] = definitions[relationship] || [
    'Benutzerdefinierte Beziehung',
    'Für diesen Wert enthält OSCAL 1.2.3 keine vordefinierte Bedeutung. Maßgeblich ist die Dokumentation des Mapping-Herausgebers.',
  ];
  const heading = document.createElement('strong');
  heading.textContent = title;
  const text = document.createElement('p');
  text.textContent = description;
  const source = document.createElement('small');
  source.textContent = definitions[relationship]
    ? 'Deutsche Übersetzung · OSCAL 1.2.3, NIST. Quelle unter „Mapping-Informationen“ verlinkt.'
    : 'Keine offizielle OSCAL-Definition.';
  tip.append(heading, text, source);
  badge.replaceWith(button);
  cell.append(tip);
  cell.removeAttribute('title');
  let timer;
  let hovered = false;
  function close() {
    clearTimeout(timer);
    if (tip.isConnected) tip.hidePopover();
    if (active?.tip === tip) active = null;
  }
  function show() {
    clearTimeout(timer);
    if (tip.matches(':popover-open')) return;
    dismiss();
    tip.showPopover();
    position();
    active = { close, position, button, tip };
  }
  function position() {
    const box = button.getBoundingClientRect();
    if (!button.isConnected || box.bottom < 0 || box.top > innerHeight) {
      dismiss();
      return;
    }
    const above = Math.max(0, box.top - 20);
    const below = Math.max(0, innerHeight - box.bottom - 20);
    const placeBelow = below >= 300 || below >= above;
    tip.style.maxHeight = Math.max(80, placeBelow ? below : above) + 'px';
    const size = tip.getBoundingClientRect();
    tip.style.left =
      Math.max(12, Math.min(innerWidth - size.width - 12, box.x + box.width / 2 - size.width / 2)) +
      'px';
    tip.style.top = Math.max(12, placeBelow ? box.bottom + 8 : box.top - size.height - 8) + 'px';
  }
  function leave() {
    timer = setTimeout(() => {
      if (!hovered && document.activeElement !== button) close();
    }, 120);
  }
  for (const element of [button, tip]) {
    element.addEventListener('mouseenter', () => {
      hovered = true;
      show();
    });
    element.addEventListener('mouseleave', () => {
      hovered = false;
      leave();
    });
  }
  button.addEventListener('focus', show);
  button.addEventListener('blur', leave);
  button.addEventListener('click', show);
}
