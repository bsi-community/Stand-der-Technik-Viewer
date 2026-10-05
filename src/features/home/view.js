/** features/home/view: see docs/architecture.md for responsibilities. */
import { loadCatalogFromUrl, loadComponentFromUrl, switchTab } from '../../app/actions.js';
import { updateVisualizationContext } from '../../app/navigation.js';
import { uiStore } from '../../app/store.js';
import { resetTargetHierarchyDetails } from '../visualizations/target-hierarchy.js';
import { $$ } from '../../shared/dom.js';
import { escapeHtml } from '../../shared/html.js';
import { hideEffortTooltip } from '../../shared/ui/effort-tooltip.js';
import { hideMsg } from '../../shared/ui/messages.js';
import { updateHeaderSubtitle } from '../../shared/ui/overview.js';

export function registryModelConfig(kind) {
  if (kind === 'component') {
    return {
      key: 'component',
      title: 'Komponentendefinitionen',
      shortTitle: 'Komponentendefinition',
      description:
        'Beschreibt Komponenten, Capabilities und die Anforderungserfüllung referenzierter Anforderungen aus Katalogen.',
      color: '#176b78',
      badge: 'Komponentendefinition',
    };
  }
  return {
    key: 'catalog',
    title: 'Kataloge',
    shortTitle: 'Katalog',
    description: 'Sammlung strukturierter Anforderungen, Vorschriften und Sicherheitskontrollen.',
    color: '#001b3d',
    badge: 'Catalog',
  };
}

export function registryFilesForModel(model) {
  if (model === 'component') return uiStore.registryState.components || [];
  if (model === 'catalog') return uiStore.registryState.catalogs || [];
  return (uiStore.registryState.catalogs || []).concat(uiStore.registryState.components || []);
}

export function registryFileTitle(file) {
  return String(
    (file && (file.title || file.fallbackTitle || file.name)) || 'OSCAL-Dokument',
  ).trim();
}

export function registryFileSearchText(file) {
  return [
    registryFileTitle(file),
    file && file.name,
    file && file.path,
    file && file.category,
    file && file.kind,
    file && file.documentId,
  ]
    .join(' ')
    .toLowerCase();
}

export function registryVisibleFiles() {
  var query = String(uiStore.registryState.query || '')
    .trim()
    .toLowerCase();
  var files = registryFilesForModel(uiStore.registryState.selectedModel);
  if (!query) return files.slice(0);
  return files.filter(function (file) {
    return registryFileSearchText(file).indexOf(query) !== -1;
  });
}

export function renderRegistrySearch(parent, placeholder) {
  var row = document.createElement('div');
  row.className = 'registry-search-row';
  var input = document.createElement('input');
  input.className = 'input';
  input.type = 'search';
  input.placeholder = placeholder || 'Dokumente suchen...';
  input.value = uiStore.registryState.query || '';
  input.setAttribute('aria-label', 'Repository-Dokumente suchen');
  var button = document.createElement('button');
  button.className = 'btn';
  button.type = 'button';
  button.textContent = 'Suchen';
  function applySearch() {
    uiStore.registryState.query = input.value || '';
    if (!uiStore.registryState.selectedModel && uiStore.registryState.query.trim())
      uiStore.registryState.selectedModel = 'all';
    renderRegistryHome();
  }
  input.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      applySearch();
    }
  });
  button.addEventListener('click', applySearch);
  row.appendChild(input);
  row.appendChild(button);
  parent.appendChild(row);
}

export function renderRegistryModelCard(parent, kind, count) {
  var cfg = registryModelConfig(kind);
  var card = document.createElement('button');
  card.className = 'registry-model-card';
  card.type = 'button';
  card.style.setProperty('--model-color', cfg.color);
  var statusHtml;
  if (uiStore.registryState.status === 'loading') {
    statusHtml =
      '<span class="registry-model-status registry-model-loading" role="status" aria-live="polite"><span class="registry-model-loading-text">Inhalte werden geladen, dies kann einige Sekunden dauern.</span><span class="registry-model-spinner" aria-hidden="true"></span></span>';
  } else if (uiStore.registryState.status === 'error') {
    statusHtml =
      '<span class="registry-model-status registry-model-load-error">Inhalte konnten nicht geladen werden.</span>';
  } else {
    statusHtml = '<span class="registry-model-status">' + count + ' Dokumente</span>';
  }
  card.innerHTML =
    '' +
    '<span class="registry-model-dot" aria-hidden="true"></span>' +
    '<h3>' +
    escapeHtml(cfg.title) +
    '</h3>' +
    '<p>' +
    escapeHtml(cfg.description) +
    '</p>' +
    '<div class="registry-model-footer"><span class="registry-model-link">Durchsuchen →</span>' +
    statusHtml +
    '</div>';
  card.addEventListener('click', function () {
    uiStore.registryState.selectedModel = kind;
    uiStore.registryState.query = '';
    renderRegistryHome();
  });
  parent.appendChild(card);
}

export function renderRegistryHomeHelp(parent) {
  var help = document.createElement('div');
  help.className = 'registry-help';
  help.setAttribute('role', 'complementary');
  help.setAttribute('aria-label', 'Hinweise zur Nutzung des Viewers');
  help.innerHTML =
    '' +
    '<section class="registry-help-card guide">' +
    '<div class="registry-help-header">' +
    '<h3>Wie nutze ich den Viewer?</h3>' +
    '<p>Ein kurzer Ablauf für die Arbeit mit Katalogen, Komponentendefinitionen und Mappings.</p>' +
    '</div>' +
    '<ol class="registry-guide-list">' +
    '<li><strong>Dokument finden oder laden.</strong><span>Nutze die Suche auf der Startseite, eine Modellkachel, einen lokalen JSON-Upload oder eine URL. Upload und URL-Abruf stehen im jeweiligen Arbeitsbereich unter &quot;Dateiupload&quot; bereit. Die Kacheln &quot;Kataloge&quot; und &quot;Komponentendefinitionen&quot; zeigen Inhalte aus dem <a href="https://github.com/BSI-Bund/Stand-der-Technik-Bibliothek" target="_blank" rel="noopener noreferrer">öffentlichen BSI Stand der Technik GitHub-Repository</a>, die sich direkt im Viewer öffnen lassen.</span></li>' +
    '<li><strong>Obere Menüleiste verstehen.</strong><span>Kataloge, Komponentendefinitionen und Mappings sind die drei Arbeitsbereiche. Die rechts daneben angezeigte Kontextzeile nennt jederzeit den aktiven Datenbereich. Graph, Sunburst und Balkendiagramm passen ihren Inhalt automatisch an diesen Bereich an. Bei geeigneten Katalogen wird zusätzlich die aktuelle Vererbung der BSI-Zielobjektkategorien eingeblendet.</span></li>' +
    '<li><strong>Passende Ansicht wählen.</strong><span>Kataloge zeigen Anforderungen, Komponentendefinitionen zeigen die Anforderungserfüllung referenzierter Anforderungen, Mappings zeigen Beziehungen zwischen Anforderungen (es muss sichergestellt sein, dass die passenden Kataloge in der Katalogansicht hochgeladen sind, um die Inhalte der entsprechenden Kataloge sauber in der Ansicht für Komponentendefinitionen und in der Mappingansicht anzeigen zu können).</span></li>' +
    '<li><strong>Inhalte eingrenzen.</strong><span>In der Katalogansicht, der Ansicht für Komponentendefinitionen und der Mappingansicht steht jeweils eine Menüleiste auf der linken Seite zur Verfügung, welche es ermöglicht die angezeigten Inhalte zu filtern (z.B. über ein Volltext-Suchfeld oder andere vorgegebene Filterungsmöglichkeiten). Somit ist man in der Lage gezielt nach Inhalten zu suchen.</span></li>' +
    '<li><strong>Ergebnisse sichern.</strong><span>Über den PDF-Export können die aktuellen Ansichten für Kataloge und Komponentendefinitionen druckoptimiert ausgegeben werden (via Browser Print-to-PDF-Funktion).</span></li>' +
    '</ol>' +
    '</section>' +
    '<section class="registry-help-card terms">' +
    '<div class="registry-help-header">' +
    '<h3>Begriffserklärungen</h3>' +
    '<p>Die wichtigsten OSCAL- und Viewer-Begriffe auf einen Blick.</p>' +
    '</div>' +
    '<dl class="registry-terms-list">' +
    '<div><dt>OSCAL</dt><dd>Die <a href="https://pages.nist.gov/OSCAL/" target="_blank" rel="noopener noreferrer">Open Security Controls Assessment Language (OSCAL)</a> ist ein standardisiertes, maschinenlesbares Framework, das von NIST entwickelt wurde, um die Effizienz und Konsistenz von Dokumentationen zur Informationssicherheit zu verbessern. Es ermöglicht eine Automatisierung über den gesamten Compliance-Lebenszyklus hinweg.</dd></div>' +
    '<div><dt>Katalog</dt><dd>Kataloge sind maschinenlesbare, standardisierte Sammlungen von Sicherheitsanforderungen. Sie dienen als strukturierte Datenbasis, um Kontrollvorgaben (zum Beispiel aus dem Digitalen Kompendium oder Technischen Richtlinien) eindeutig und automatisierbar zu dokumentieren. Mit <a href="https://pages.nist.gov/OSCAL/learn/concepts/layer/control/catalog/" target="_blank" rel="noopener noreferrer">OSCAL-Katalogen</a> wird der traditionelle, oft manuelle Prozess der Sicherheitsdokumentation durch einen datenzentrierten Ansatz ersetzt, was zu einer effizienteren und konsistenteren Verwaltung von Sicherheits- und Compliance-Anforderungen führt.</dd></div>' +
    '<div><dt>Anforderung</dt><dd>Einzelne Anforderung oder Sicherheitskontrolle innerhalb eines Katalogs.</dd></div>' +
    '<div><dt>Komponenten-<br>definition</dt><dd>Eine <a href="https://pages.nist.gov/OSCAL-Reference/models/v1.1.3/component-definition/" target="_blank" rel="noopener noreferrer">OSCAL-Komponentendefinition</a> enthält eine Sammlung von Komponenten. Jede Komponente in einer Komponentendefinition beschreibt, wie eine bestimmte Implementierung einer Hardware, Software, eines Dienstes, einer Richtlinie, eines Prozesses oder einer Prozedur bestimmte Vorschriften aus einem oder mehreren OSCAL-Katalogen oder -Profilen unterstützen oder implementieren kann.</dd></div>' +
    '<div><dt>Mappings</dt><dd>Sammlung von Beziehungen zwischen Anforderungen aus verschiedenen Katalogen.</dd></div>' +
    '<div><dt>Metadata</dt><dd>Titel, Version, Datum, Rollen und weitere Verwaltungsinformationen eines Dokuments.</dd></div>' +
    '<div><dt>Back Matter</dt><dd>Anhangsbereich für Ressourcen, Links, Dokumente und Referenzen.</dd></div>' +
    '</dl>' +
    '</section>' +
    '<section class="registry-help-card compatibility">' +
    '<div class="registry-help-header">' +
    '<h3>Kompatibilität</h3>' +
    '<p>Unterstützte Desktop-Umgebungen und technische Voraussetzungen.</p>' +
    '</div>' +
    '<span class="compatibility-badge">Desktop-Version</span>' +
    '<dl class="registry-compatibility-list">' +
    '<div><dt>Bildschirm</dt><dd>Für Desktop und Notebook ab 1280 × 720 Pixeln ausgelegt; empfohlen sind mindestens 1440 Pixel Breite. Smartphones und Tablets werden nicht unterstützt.</dd></div>' +
    '<div><dt>Browser</dt><dd>Aktuelle stabile Versionen von Google Chrome, Microsoft Edge, Mozilla Firefox und Apple Safari. JavaScript muss aktiviert sein. Internet Explorer, veraltete Browser und eingebettete WebViews werden nicht unterstützt.</dd></div>' +
    '<div><dt>Betriebssysteme</dt><dd>Windows 10/11, macOS 12 oder neuer sowie aktuelle 64-Bit-Linux-Desktopdistributionen, sofern dort einer der genannten Browser unterstützt wird.</dd></div>' +
    '<div><dt>Lokale Nutzung</dt><dd>Lokale JSON-Dateien werden ausschließlich im Browser verarbeitet. Für lokale Uploads und bereits mitgelieferte Viewer-Dateien ist keine Internetverbindung erforderlich.</dd></div>' +
    '<div><dt>Online-Funktionen</dt><dd>Repository-Inhalte und URLs benötigen Internetzugriff. Externe Server müssen Browserabrufe per HTTPS und CORS erlauben.</dd></div>' +
    '<div><dt>PDF-Export</dt><dd>Erfolgt über den Druckdialog des Browsers. Pop-ups beziehungsweise Druckdialoge dürfen nicht durch Richtlinien blockiert sein.</dd></div>' +
    '</dl>' +
    '</section>';
  parent.appendChild(help);
}

export function renderRegistryBrowse(parent) {
  var visible = registryVisibleFiles();
  var model = uiStore.registryState.selectedModel || 'all';
  var selectedTitle =
    model === 'component'
      ? 'Komponentendefinitionen'
      : model === 'catalog'
        ? 'Kataloge'
        : 'Alle Dokumente';
  var root = parent || uiStore.els.homeTab;

  var list = document.createElement('div');
  list.className = 'registry-list';
  list.innerHTML =
    '<div class="registry-list-head"><span>Titel</span><span>Quelle</span><span>Modell</span></div>';
  if (!visible.length) {
    var empty = document.createElement('div');
    empty.className = 'registry-empty';
    empty.textContent =
      uiStore.registryState.status === 'loading'
        ? 'Repository-Inhalte werden geladen.'
        : 'Keine Dokumente entsprechen der aktuellen Suche.';
    list.appendChild(empty);
  }
  for (var i = 0; i < visible.length; i++) {
    (function (file) {
      var cfg = registryModelConfig(file.kind);
      var row = document.createElement('button');
      row.className = 'registry-document-row';
      row.type = 'button';
      row.innerHTML =
        '' +
        '<span class="registry-document-title">' +
        escapeHtml(registryFileTitle(file)) +
        '</span>' +
        '<span class="registry-document-meta">' +
        escapeHtml(file.category || 'Repository') +
        '</span>' +
        '<span class="registry-document-badge">' +
        escapeHtml(cfg.badge) +
        '</span>';
      row.addEventListener('click', function () {
        loadRegistryDocument(file);
      });
      list.appendChild(row);
    })(visible[i]);
  }
  var label = document.createElement('div');
  label.className = 'registry-section-label';
  label.textContent = selectedTitle;
  root.appendChild(label);
  root.appendChild(list);
}

export function renderRegistryHome() {
  if (!uiStore.els.homeTab) return;
  uiStore.els.homeTab.innerHTML = '';
  document.body.classList.add('home-mode');
  var total = uiStore.registryState.catalogs.length + uiStore.registryState.components.length;
  var shell = document.createElement('div');
  shell.className = 'registry-home-shell';
  var primary = document.createElement('div');
  primary.className = 'registry-home-main';
  var hero = document.createElement('section');
  hero.className = 'registry-hero';
  hero.innerHTML =
    '<h2 id="homeTitle">Einstieg in die Stand der Technik-Bibliothek</h2><p>Die Stand der Technik-Bibliothek des BSI bündelt maschinenlesbare Sicherheitsanforderungen und produktspezifische Umsetzungsbeschreibungen im OSCAL-Format. Sie schafft eine gemeinsame, versionierbare Datenbasis, um den Stand der Technik strukturiert zu recherchieren, zu vergleichen und in Sicherheits- und Compliance-Prozessen weiterzuverwenden.</p><p>Durchsuche und öffne aktuelle OSCAL-Kataloge und Komponentendefinitionen direkt aus dem öffentlichen BSI Stand der Technik Repository oder lasse dir die Inhalte aus dem öffentlichen Repository direkt über die unten stehenden Kacheln „Kataloge“ und „Komponentendefinitionen“ anzeigen.</p>';
  renderRegistrySearch(hero, 'Dokumente suchen...');
  var count = document.createElement('div');
  count.className = 'registry-count';
  if (uiStore.registryState.status === 'loading')
    count.textContent = 'Repository-Inhalte werden frisch geladen...';
  else if (uiStore.registryState.status === 'error')
    count.textContent =
      'Repository-Inhalte konnten nicht geladen werden. Lokale Dateien und URL-Uploads funktionieren weiterhin.';
  else count.textContent = total + ' Dokumente in 2 Modelltypen';
  hero.appendChild(count);
  if (uiStore.registryState.selectedModel || uiStore.registryState.query) {
    var backBtn = document.createElement('button');
    backBtn.className = 'btn registry-back-button';
    backBtn.type = 'button';
    backBtn.textContent = 'Zurück';
    backBtn.addEventListener('click', function () {
      showHomePage(true);
    });
    hero.appendChild(backBtn);
  }
  primary.appendChild(hero);

  if (uiStore.registryState.selectedModel || uiStore.registryState.query) {
    renderRegistryBrowse(primary);
    shell.appendChild(primary);
    renderRegistryHomeHelp(shell);
    uiStore.els.homeTab.appendChild(shell);
    return;
  }

  var label = document.createElement('div');
  label.className = 'registry-section-label';
  label.textContent = 'Inhalte der Stand der Technik-Bibliothek durchsuchen';
  primary.appendChild(label);
  var grid = document.createElement('div');
  grid.className = 'registry-model-grid';
  renderRegistryModelCard(grid, 'catalog', uiStore.registryState.catalogs.length);
  renderRegistryModelCard(grid, 'component', uiStore.registryState.components.length);
  primary.appendChild(grid);
  var helpIntro = document.createElement('p');
  helpIntro.className = 'registry-help-intro';
  helpIntro.textContent =
    'Im Folgenden werden die Nutzung des Viewers, verwendete Begriffe und die Kompatibilität näher erläutert.';
  primary.appendChild(helpIntro);
  shell.appendChild(primary);
  renderRegistryHomeHelp(shell);
  uiStore.els.homeTab.appendChild(shell);
}

export function showHomePage(resetRegistry) {
  if (resetRegistry) {
    uiStore.registryState.selectedModel = '';
    uiStore.registryState.query = '';
  }
  hideEffortTooltip();
  resetTargetHierarchyDetails();
  uiStore.uiState.view = 'home';
  updateHeaderSubtitle('home');
  var tabs = $$('.tab');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].classList.remove('active');
    tabs[i].setAttribute('aria-selected', 'false');
  }
  updateVisualizationContext();
  if (uiStore.els.homeTab) uiStore.els.homeTab.classList.remove('hidden');
  if (uiStore.els.viewSummary) uiStore.els.viewSummary.classList.add('hidden');
  uiStore.els.listTab.classList.add('hidden');
  uiStore.els.componentTab.classList.add('hidden');
  uiStore.els.mappingTab.classList.add('hidden');
  uiStore.els.graphTab.classList.add('hidden');
  uiStore.els.sunburstTab.classList.add('hidden');
  uiStore.els.barTab.classList.add('hidden');
  uiStore.els.targetHierarchyTab.classList.add('hidden');
  renderRegistryHome();
  hideMsg();
}

export function loadRegistryDocument(file) {
  if (!file || !file.url) return;
  var title = registryFileTitle(file);
  if (file.kind === 'component') {
    loadComponentFromUrl(file.url, title).then(function (kind) {
      if (kind) switchTab('components');
    });
  } else {
    loadCatalogFromUrl(file.url, title).then(function (kind) {
      if (kind) switchTab('list');
    });
  }
}
