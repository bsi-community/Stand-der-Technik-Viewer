/** features/components/requirements-view: see docs/architecture.md for responsibilities. */
import { goToCatalogControlFromComponent } from '../../app/actions.js';
import {
  findCatalogControlForRequirement,
  getCatalogControlTitle,
  getCatalogPreviewParamMap,
  getCatalogStatementProse,
} from '../../app/catalog-lookup.js';
import { normalizeControlRef } from '../../domain/references.js';
import { appendConfigCommands } from './commands.js';
import { cssId } from '../../shared/dom.js';
import { renderHighlightedInline, renderMarkupWithParams } from '../../shared/markup.js';
import { openJsonModal } from '../../shared/ui/messages.js';

export function appendImplementedRequirementRemarks(parent, req, searchTerm) {
  if (!String((req && req.remarks) || '').trim()) return false;

  var section = document.createElement('section');
  section.className = 'implemented-requirement-remarks catalog-md';
  var heading = document.createElement('h4');
  heading.textContent = 'Anmerkungen';
  section.appendChild(heading);
  var prose = document.createElement('div');
  prose.innerHTML = renderMarkupWithParams(req.remarks, req.paramMap, searchTerm);
  section.appendChild(prose);
  parent.appendChild(section);
  return true;
}

export function renderImplementationRequirementsTable(impl, searchTerm) {
  var wrap = document.createElement('div');
  wrap.className = 'implementation-table-wrap';
  var table = document.createElement('table');
  table.className = 'implementation-table';
  table.innerHTML =
    '<thead><tr><th>Anforderung</th><th>Implementierungsbeschreibung</th></tr></thead>';
  var tbody = document.createElement('tbody');
  var requirements = (impl && impl.requirements) || [];

  if (!requirements.length) {
    var emptyRow = document.createElement('tr');
    emptyRow.innerHTML =
      '<td colspan="2" class="component-empty">Keine implementierten Anforderungen vorhanden.</td>';
    tbody.appendChild(emptyRow);
  }

  for (var i = 0; i < requirements.length; i++) {
    (function (req) {
      var row = document.createElement('tr');
      row.id = 'component-req-' + cssId(req.id);
      var normalizedControlId = normalizeControlRef(req.controlId);
      var catalogMatch = findCatalogControlForRequirement(req);
      var catalogControl = catalogMatch.control;
      var jumpAvailable = !!catalogControl || catalogMatch.sourceIndex !== -1;
      var displayId =
        (catalogControl && (catalogControl.labelId || catalogControl.id || catalogControl.rawId)) ||
        req.catalogControlId ||
        normalizedControlId ||
        req.controlId ||
        'ohne-control-id';
      var displayTitle = getCatalogControlTitle(catalogControl);

      var requirementCell = document.createElement('td');
      var id = document.createElement('span');
      id.className = 'implementation-requirement-id';
      id.innerHTML =
        '<strong>' +
        renderHighlightedInline(displayId, searchTerm) +
        '</strong>' +
        (displayTitle ? ' - ' + renderHighlightedInline(displayTitle, searchTerm) : '');
      requirementCell.appendChild(id);

      var prose = document.createElement('div');
      prose.className = 'implementation-requirement-prose catalog-md';
      var statementProse = getCatalogStatementProse(catalogControl);
      prose.innerHTML = statementProse
        ? renderMarkupWithParams(
            statementProse,
            getCatalogPreviewParamMap(catalogControl),
            searchTerm,
          )
        : '<span class="component-empty">Kein passender Katalog in der Katalogansicht geladen.</span>';
      requirementCell.appendChild(prose);

      var actions = document.createElement('div');
      actions.className = 'implementation-row-actions';
      var gotoBtn = document.createElement('button');
      gotoBtn.className = 'btn small component-ref-btn';
      gotoBtn.type = 'button';
      gotoBtn.textContent = jumpAvailable
        ? 'Im Katalog öffnen'
        : 'Katalog-Anforderung nicht geladen';
      gotoBtn.disabled = !jumpAvailable;
      gotoBtn.addEventListener('click', function () {
        goToCatalogControlFromComponent(req);
      });
      actions.appendChild(gotoBtn);
      var jsonBtn = document.createElement('button');
      jsonBtn.className = 'btn small';
      jsonBtn.type = 'button';
      jsonBtn.textContent = 'JSON';
      jsonBtn.addEventListener('click', function () {
        openJsonModal(req.raw, jsonBtn);
      });
      actions.appendChild(jsonBtn);
      requirementCell.appendChild(actions);

      var implementationCell = document.createElement('td');
      var hasDescription = false;
      var hasRequirementDescription = !!String(req.description || '').trim();
      var hasRequirementRemarks = !!String(req.remarks || '').trim();
      if (hasRequirementDescription || hasRequirementRemarks) {
        var reqDescription = document.createElement('div');
        reqDescription.className =
          'implementation-description catalog-md js-collapsible-description';
        if (hasRequirementDescription) {
          reqDescription.innerHTML = renderMarkupWithParams(
            req.description,
            req.paramMap,
            searchTerm,
          );
        }
        appendImplementedRequirementRemarks(reqDescription, req, searchTerm);
        implementationCell.appendChild(reqDescription);
        hasDescription = true;
      }

      if (appendConfigCommands(implementationCell, req, searchTerm)) {
        hasDescription = true;
      }

      var statements = req.statements || [];
      for (var s = 0; s < statements.length; s++) {
        var stmt = statements[s];
        if (!String(stmt.description || '').trim()) continue;
        var statement = document.createElement('div');
        statement.className = 'implementation-statement';
        statement.id = 'component-stmt-' + cssId(stmt.id);
        var label = document.createElement('div');
        label.className = 'implementation-statement-label';
        label.innerHTML =
          'Statement' +
          (stmt.statementId ? ': ' + renderHighlightedInline(stmt.statementId, searchTerm) : '');
        statement.appendChild(label);
        var statementDescription = document.createElement('div');
        statementDescription.className =
          'implementation-description catalog-md js-collapsible-description';
        statementDescription.innerHTML = renderMarkupWithParams(
          stmt.description,
          stmt.paramMap,
          searchTerm,
        );
        statement.appendChild(statementDescription);
        implementationCell.appendChild(statement);
        hasDescription = true;
      }
      if (!hasDescription) {
        implementationCell.innerHTML =
          '<span class="component-empty">Keine Beschreibung vorhanden.</span>';
      }

      row.appendChild(requirementCell);
      row.appendChild(implementationCell);
      tbody.appendChild(row);
    })(requirements[i]);
  }

  table.appendChild(tbody);
  wrap.appendChild(table);
  return wrap;
}
