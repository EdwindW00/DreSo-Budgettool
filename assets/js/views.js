/* DreSo Budgettool — render-functies per tabblad */

// ============================================================ DASHBOARD
function renderDashboard(project) {
  const el = document.getElementById("view-dashboard");
  const total = Calc.projectTotal(project);
  const diff = (Number(project.targetBudget) || 0) - total;
  const pctUsed = project.targetBudget ? total / project.targetBudget : 0;
  const byCategory = Calc.totalsByCategory(project);

  const catRows = Store.state.categories
    .map(c => ({ code: c.code, name: c.name, value: byCategory[c.code] || 0 }))
    .filter(r => r.value > 0)
    .sort((a, b) => b.value - a.value);

  const donut = catRows.length
    ? donutChart(catRows.map((r, i) => ({ value: r.value, color: PALETTE[i % PALETTE.length] })), { size: 168, stroke: 24 })
    : `<div class="empty-state small">Nog geen regels ingevuld</div>`;

  const legend = catRows.map((r, i) => `
    <div class="legend-row">
      <span class="legend-swatch" style="background:${PALETTE[i % PALETTE.length]}"></span>
      <span class="lbl">${r.code} &middot; ${escapeHTML(r.name)}</span>
      <span class="val">${fmtEUR(r.value)}</span>
    </div>`).join("") || `<div class="text-muted small">Voeg regels toe op het tabblad Budget.</div>`;

  el.innerHTML = `
    <div class="view-header">
      <div>
        <h1>Dashboard</h1>
        <p>Projectgegevens, voortgang en verdeling van het budget.</p>
      </div>
      <div class="view-actions">
        <button class="btn btn-light" data-action="goto-budget">Naar budgetinvoer &rarr;</button>
        <button class="btn btn-primary" data-action="print-report">Rapport genereren</button>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head"><h2>Projectgegevens</h2><span class="hint">wijzigingen worden automatisch opgeslagen</span></div>
      <div class="panel-body">
        <div class="field-row">
          <div class="field"><label>Projectnaam</label>
            <input type="text" data-project-field="name" value="${escapeHTML(project.name)}"></div>
          <div class="field"><label>Vloeroppervlak (m²)</label>
            <input type="number" min="0" data-project-field="floorArea" value="${project.floorArea || 0}"></div>
          <div class="field"><label>Datum</label>
            <input type="date" data-project-field="projectDate" value="${project.projectDate || ""}"></div>
          <div class="field"><label>Opgesteld door</label>
            <input type="text" data-project-field="preparedBy" value="${escapeHTML(project.preparedBy || "")}" placeholder="Naam"></div>
        </div>
        <div class="field-row" style="margin-top:14px;">
          <div class="field"><label>Doelbudget (excl. btw)</label>
            <input type="number" min="0" step="1000" data-project-field="targetBudget" value="${project.targetBudget || 0}"></div>
          <div class="field" style="flex:2;">
            <label>Afwerkingsniveau (past eenheidsprijzen automatisch aan)</label>
            <div class="finish-toggle">
              ${Object.entries(FINISHING_LEVELS).map(([key, lvl]) => `
                <div class="finish-opt ${project.finishingLevel === key ? "active" : ""}" data-action="set-finishing" data-level="${key}">
                  ${lvl.label}<small>${lvl.suffix}</small>
                </div>`).join("")}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-4" style="margin-top:18px;">
      <div class="kpi accent">
        <div class="label">Doelbudget</div>
        <div class="value">${fmtEUR(project.targetBudget)}</div>
        <div class="sub">${fmtNum(project.floorArea)} m² &middot; ${project.floorArea ? fmtEUR2((project.targetBudget||0)/project.floorArea) + "/m²" : "—"}</div>
      </div>
      <div class="kpi">
        <div class="label">Begrote uitgaven</div>
        <div class="value">${fmtEUR(total)}</div>
        <div class="sub">${project.floorArea ? fmtEUR2(total/project.floorArea) + " per m²" : `${project.lines.length} regels`}</div>
      </div>
      <div class="kpi ${diff >= 0 ? "good" : "bad"}">
        <div class="label">${diff >= 0 ? "Nog beschikbaar" : "Overschrijding"}</div>
        <div class="value">${fmtEUR(Math.abs(diff))}</div>
        <div class="sub">${project.targetBudget ? fmtPct(diff/project.targetBudget) + " van doelbudget" : "—"}</div>
      </div>
      <div class="kpi">
        <div class="label">Besteed</div>
        <div class="value">${fmtPct(pctUsed)}</div>
        <div class="sub">van het doelbudget</div>
      </div>
    </div>

    <div class="grid grid-2" style="margin-top:18px; align-items:stretch;">
      <div class="panel">
        <div class="panel-head"><h2>Verdeling per hoofdcategorie</h2></div>
        <div class="panel-body" style="display:flex; gap:22px; align-items:center; flex-wrap:wrap;">
          <div>${donut}</div>
          <div class="chart-legend" style="flex:1; min-width:200px;">${legend}</div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head"><h2>Budget per categorie</h2></div>
        <div class="panel-body">
          ${catRows.length ? barList(catRows.map(r => ({ label: `${r.code} ${r.name}`, value: r.value })), { fmt: fmtEUR }) : `<div class="empty-state small">Nog geen regels ingevuld</div>`}
        </div>
      </div>
    </div>
  `;
}

// ============================================================ BUDGET
function renderBudget(project) {
  // zorg dat elk catalogusitem als regel aanwezig is: het budget staat altijd
  // volledig uitgeklapt, mensen hoeven alleen hoeveelheden in te vullen.
  Store.ensureCatalogLines(project);

  const el = document.getElementById("view-budget");
  const total = Calc.projectTotal(project);
  const byCategory = Calc.totalsByCategory(project);
  const bySubheader = Calc.totalsBySubheader(project);

  const catBlocks = Store.state.categories.map(cat => {
    const subheaders = Store.subheadersFor(cat.code);
    const catTotal = byCategory[cat.code] || 0;

    const subBlocks = subheaders.map(sub => {
      const lines = project.lines.filter(l => l.subheader === sub.code);
      const subTotal = bySubheader[sub.code] || 0;

      const lineRows = lines.map(line => {
        const catalogItem = Store.catalogItem(line.code);
        const description = catalogItem ? catalogItem.description : line.description;
        const unit = catalogItem ? catalogItem.unit : line.unit;
        const effectivePrice = Calc.effectiveUnitPrice(line, project);
        const lineTotal = Calc.lineTotal(line, project);
        const isOverride = line.priceOverride != null;
        return `
          <tr class="item-row">
            <td class="small text-muted">${line.code || "&mdash;"}</td>
            <td>
              ${catalogItem
                ? `${escapeHTML(description)} <span class="chip">catalogus</span>`
                : `<input class="desc-input" data-line-field="description" data-line-id="${line.id}" value="${escapeHTML(description)}">`}
            </td>
            <td class="center">
              <input class="qty-input" type="number" min="0" step="any" data-line-field="quantity" data-line-id="${line.id}" value="${line.quantity}">
            </td>
            <td class="center">
              ${catalogItem
                ? `<span class="unit-badge">${escapeHTML(unit)}</span>`
                : `<input class="qty-input" style="width:70px" data-line-field="unit" data-line-id="${line.id}" value="${escapeHTML(unit)}">`}
            </td>
            <td class="num">
              <input class="price-input" type="number" min="0" step="any" data-line-field="price" data-line-id="${line.id}" value="${round2(effectivePrice)}">
              ${isOverride ? `<span class="chip override-chip">aangepast</span>` : ""}
            </td>
            <td class="num" style="font-weight:700;">${fmtEUR2(lineTotal)}</td>
            <td class="center">${catalogItem ? "" : `<button class="icon-btn" data-action="remove-line" data-line-id="${line.id}" title="Verwijderen">&#10005;</button>`}</td>
          </tr>`;
      }).join("");

      return `
        <tr class="sub-row">
          <td colspan="5">${sub.code} &middot; ${escapeHTML(sub.name)}</td>
          <td class="num sub-total">${fmtEUR2(subTotal)}</td>
          <td></td>
        </tr>
        ${lineRows}
        <tr class="add-row">
          <td></td>
          <td><input class="add-custom-desc" placeholder="+ eigen item toevoegen (omschrijving)" style="width:100%;"></td>
          <td class="center"><input class="add-qty" type="number" min="0" step="any" value="1" style="width:56px; text-align:center;"></td>
          <td class="center"><input class="add-custom-unit" placeholder="eenheid" style="width:70px;"></td>
          <td class="num"><input class="add-custom-price" type="number" placeholder="€ / eenheid" style="width:100px; text-align:right;"></td>
          <td></td>
          <td class="center"><button class="btn btn-sm btn-light" data-action="add-line" data-subheader="${sub.code}">+ Toevoegen</button></td>
        </tr>`;
    }).join("");

    return `
      <table class="budget-table" style="margin-bottom:22px;">
        <thead>
          <tr class="cat-row"><td colspan="5">${cat.code} &middot; ${escapeHTML(cat.name).toUpperCase()}</td><td class="num cat-total">${fmtEUR2(catTotal)}</td><td></td></tr>
          <tr>
            <th style="width:70px;">Code</th>
            <th>Omschrijving</th>
            <th class="center" style="width:80px;">Aantal</th>
            <th class="center" style="width:80px;">Eenheid</th>
            <th class="num" style="width:130px;">€ / eenheid</th>
            <th class="num" style="width:120px;">Totaal</th>
            <th style="width:36px;"></th>
          </tr>
        </thead>
        <tbody>${subBlocks}</tbody>
      </table>`;
  }).join("");

  el.innerHTML = `
    <div class="view-header">
      <div>
        <h1>Budget &mdash; ${escapeHTML(project.name)}</h1>
        <p>Alle standaardposten staan al klaar &mdash; vul per regel alleen de hoeveelheid in. Eenheidsprijzen komen uit de catalogus
        en schalen automatisch mee met het afwerkingsniveau (<strong>${FINISHING_LEVELS[project.finishingLevel].label} ${FINISHING_LEVELS[project.finishingLevel].suffix}</strong>).
        Pas een prijs hier aan om alleen deze regel te overschrijven. Onderaan elke subcategorie kun je een eigen (niet-standaard) item toevoegen.</p>
      </div>
      <div class="view-actions">
        <button class="btn btn-light" data-action="add-category">+ Hoofdcategorie</button>
      </div>
    </div>
    ${catBlocks}
    <table class="budget-table">
      <tbody><tr class="grand-total-row"><td style="width:70%;">Totaal begroting (excl. btw)</td><td class="num">${fmtEUR2(total)}</td></tr></tbody>
    </table>
  `;
}

// ============================================================ EENHEIDSPRIJZEN
function renderPrices(filter) {
  const el = document.getElementById("view-prices");
  const q = (filter || document.getElementById("catalogSearch")?.value || "").trim().toLowerCase();

  const catBlocks = Store.state.categories.map(cat => {
    const subheaders = Store.subheadersFor(cat.code);
    const subBlocks = subheaders.map(sub => {
      let items = Store.state.catalog.filter(i => i.subheader === sub.code);
      if (q) items = items.filter(i => i.description.toLowerCase().includes(q) || i.code.toLowerCase().includes(q));
      if (q && items.length === 0) return "";

      const rows = items.map(item => `
        <tr class="item-row">
          <td class="small text-muted">${item.code}</td>
          <td><input class="desc-input" data-catalog-field="description" data-code="${item.code}" value="${escapeHTML(item.description)}"></td>
          <td class="center"><input class="qty-input" style="width:80px" data-catalog-field="unit" data-code="${item.code}" value="${escapeHTML(item.unit)}"></td>
          <td class="num"><input class="price-input" type="number" min="0" step="any" data-catalog-field="price" data-code="${item.code}" value="${item.price}"></td>
          <td class="center"><button class="icon-btn" data-action="remove-catalog-item" data-code="${item.code}" title="Verwijderen">&#10005;</button></td>
        </tr>`).join("");

      return `
        <tr class="sub-row"><td colspan="5">${sub.code} &middot; ${escapeHTML(sub.name)}</td></tr>
        ${rows}
        <tr class="add-row">
          <td></td>
          <td><input class="new-item-desc" placeholder="Nieuwe omschrijving" style="width:100%;"></td>
          <td class="center"><input class="new-item-unit" placeholder="eenheid" style="width:80px;"></td>
          <td class="num"><input class="new-item-price" type="number" placeholder="0" style="width:100px;"></td>
          <td class="center"><button class="btn btn-sm btn-light" data-action="add-catalog-item" data-subheader="${sub.code}">+</button></td>
        </tr>`;
    }).join("");

    if (q && !subBlocks.trim()) return "";

    return `
      <table class="budget-table" style="margin-bottom:22px;">
        <thead>
          <tr class="cat-row"><td colspan="5">${cat.code} &middot; ${escapeHTML(cat.name).toUpperCase()} <button class="btn btn-sm btn-ghost" style="margin-left:10px; background:rgba(255,255,255,.15); border-color:rgba(255,255,255,.3);" data-action="add-subheader" data-category="${cat.code}">+ subcategorie</button></td></tr>
          <tr><th style="width:70px;">Code</th><th>Omschrijving</th><th class="center" style="width:100px;">Eenheid</th><th class="num" style="width:120px;">€ / eenheid</th><th style="width:36px;"></th></tr>
        </thead>
        <tbody>${subBlocks}</tbody>
      </table>`;
  }).join("");

  el.innerHTML = `
    <div class="view-header">
      <div>
        <h1>Eenheidsprijzen</h1>
        <p>Dit is de centrale prijslijst. Wijzigingen hier gelden direct voor alle nieuwe regels in elk project (tenzij een regel lokaal is overschreven).</p>
      </div>
      <div class="view-actions">
        <input id="catalogSearch" placeholder="Zoek op omschrijving of code…" style="border:1px solid var(--line); border-radius:8px; padding:8px 12px; min-width:240px;" value="${escapeHTML(q)}">
        <button class="btn btn-light" data-action="add-category">+ Hoofdcategorie</button>
      </div>
    </div>
    ${catBlocks || `<div class="empty-state">Geen items gevonden voor "${escapeHTML(q)}"</div>`}
  `;
  const search = document.getElementById("catalogSearch");
  if (search && document.activeElement !== search) { /* keep as is */ }
}

// ============================================================ PROJECTEN
function renderProjects() {
  const el = document.getElementById("view-projects");
  const projects = Object.values(Store.state.projects).sort((a, b) => a.name.localeCompare(b.name));

  const cards = projects.map(p => {
    const total = Calc.projectTotal(p);
    const isActive = p.id === Store.state.activeId;
    const pwVisible = App.visiblePasswords.has(p.id);
    return `
      <div class="project-card ${isActive ? "active" : ""}">
        <div style="flex:1;">
          <div class="pname">${escapeHTML(p.name)} ${isActive ? '<span class="chip">actief</span>' : ""} ${p.password ? '<span class="chip override-chip">🔒 vergrendeld</span>' : ""}</div>
          <div class="pmeta">${fmtNum(p.floorArea)} m² &middot; begroot ${fmtEUR(total)} &middot; doel ${fmtEUR(p.targetBudget)} &middot; ${p.lines.length} regels &middot; ${p.projectDate || ""}</div>
          <div class="pw-row">
            <span class="small text-muted">Wachtwoord:</span>
            <span class="pw-value">${p.password ? (pwVisible ? escapeHTML(p.password) : "••••••••") : "geen"}</span>
            ${p.password ? `<button class="icon-btn" data-action="toggle-pw" data-id="${p.id}" title="Tonen/verbergen">${pwVisible ? "🙈" : "👁"}</button>` : ""}
            <button class="btn btn-sm btn-light" data-action="change-password" data-id="${p.id}">${p.password ? "Wijzigen" : "Instellen"}</button>
          </div>
        </div>
        <div class="pactions">
          <button class="btn btn-sm btn-light" data-action="select-project" data-id="${p.id}">Openen</button>
          <button class="btn btn-sm btn-light" data-action="duplicate-project" data-id="${p.id}">Dupliceren</button>
          <button class="btn btn-sm btn-light" data-action="export-project" data-id="${p.id}">Exporteren</button>
          <button class="btn btn-sm btn-danger" data-action="delete-project" data-id="${p.id}">Verwijderen</button>
        </div>
      </div>`;
  }).join("");

  el.innerHTML = `
    <div class="view-header">
      <div>
        <h1>Projecten</h1>
        <p>Beheer al je budgetprojecten. Alles wordt lokaal in deze browser bewaard &mdash; exporteer om te delen of te back-uppen.</p>
      </div>
      <div class="view-actions">
        <button class="btn btn-light" data-action="trigger-import-project">Project importeren</button>
        <button class="btn btn-primary" data-action="new-project">+ Nieuw project</button>
      </div>
    </div>

    ${cards || `<div class="empty-state"><div class="big">📁</div>Nog geen projecten. Maak je eerste project aan.</div>`}

    <div class="panel" style="margin-top:24px;">
      <div class="panel-head"><h2>Wachtwoorden &amp; toegang</h2></div>
      <div class="panel-body">
        <p class="small text-muted mt-0">Elk project kan met een wachtwoord vergrendeld worden. Als iemand het wachtwoord kwijt is, kun je het
        hier altijd opvragen of wijzigen (👁 om te tonen). Let op: dit is een eenvoudige toegangsgrendel, geen echte beveiliging &mdash;
        deze data staat lokaal in de browser en wordt <em>niet</em> automatisch naar GitHub gestuurd. Wil je een wachtwoordoverzicht
        buiten deze browser bewaren, exporteer dan een back-up hieronder (die bevat de wachtwoorden in leesbare tekst).</p>
      </div>
    </div>

    <div class="panel" style="margin-top:18px;">
      <div class="panel-head"><h2>Back-up &amp; overdracht</h2></div>
      <div class="panel-body" style="display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn btn-light" data-action="export-backup">Volledige back-up exporteren (alle projecten + eenheidsprijzen)</button>
        <button class="btn btn-light" data-action="trigger-import-backup">Back-up importeren (overschrijft alles)</button>
      </div>
    </div>

    <input type="file" id="importProjectFile" accept="application/json" class="hidden">
    <input type="file" id="importBackupFile" accept="application/json" class="hidden">
  `;
}

// ============================================================ RAPPORT
function renderReport(project) {
  const el = document.getElementById("view-report");
  const total = Calc.projectTotal(project);
  const byCategory = Calc.totalsByCategory(project);
  const bySubheader = Calc.totalsBySubheader(project);

  const catRows = Store.state.categories
    .map(c => ({ code: c.code, name: c.name, value: byCategory[c.code] || 0 }))
    .filter(r => r.value > 0);

  const summaryRows = catRows.map((r, i) => `
    <tr>
      <td>${i + 1}. ${escapeHTML(r.name)}</td>
      <td class="num">${fmtPct(total ? r.value / total : 0)}</td>
      <td class="num">${fmtEUR(r.value)}</td>
    </tr>`).join("");

  // in het rapport tonen we alleen daadwerkelijk ingevulde regels (aantal > 0),
  // niet de volledige lege catalogus zoals op het Budget-tabblad.
  const filledLines = project.lines.filter(l => Number(l.quantity) > 0);

  const detailSections = Store.state.categories.map((cat, idx) => {
    const subheaders = Store.subheadersFor(cat.code);
    const hasLines = filledLines.some(l => {
      const sh = Store.state.subheaders.find(s => s.code === l.subheader);
      return sh && sh.category === cat.code;
    });
    if (!hasLines) return "";

    const subTables = subheaders.map(sub => {
      const lines = filledLines.filter(l => l.subheader === sub.code);
      if (!lines.length) return "";
      const subTotal = bySubheader[sub.code] || 0;
      const rows = lines.map(l => {
        const catalogItem = Store.catalogItem(l.code);
        const description = catalogItem ? catalogItem.description : l.description;
        const unit = catalogItem ? catalogItem.unit : l.unit;
        return `
        <tr>
          <td>${l.code || ""}</td>
          <td>${escapeHTML(description)}</td>
          <td class="num">${fmtNum(l.quantity)} ${escapeHTML(unit)}</td>
          <td class="num">${fmtEUR2(Calc.effectiveUnitPrice(l, project))}</td>
          <td class="num">${fmtEUR2(Calc.lineTotal(l, project))}</td>
        </tr>`;
      }).join("");
      return `
        <table class="rep-table" style="width:100%; margin-bottom:10px;">
          <thead><tr><th colspan="5" style="color:var(--navy-800); font-weight:800; font-size:11.5px; border-bottom:1px solid var(--line); padding-top:10px;">${sub.code} ${escapeHTML(sub.name)}</th></tr></thead>
          <tbody>${rows}<tr class="rep-sub-row"><td colspan="4">Subtotaal</td><td class="num">${fmtEUR2(subTotal)}</td></tr></tbody>
        </table>`;
    }).join("");

    return `
      <div class="report-section">
        <div class="report-header-row">
          <div><div class="rh-name">${escapeHTML(project.name)}</div>Alle prijzen excl. btw</div>
          <div style="text-align:right;">${fmtNum(project.floorArea)} m²<br>${project.projectDate}<br>${escapeHTML(project.preparedBy || "")}</div>
        </div>
        <div class="rep-cat-band">${cat.code} &middot; ${escapeHTML(cat.name).toUpperCase()}</div>
        <table class="rep-table" style="width:100%; margin-top:8px;">
          <thead><tr><th>Code</th><th>Omschrijving</th><th class="num">Aantal</th><th class="num">€ / eenheid</th><th class="num">Totaal</th></tr></thead>
        </table>
        ${subTables}
        <table class="rep-table" style="width:100%;"><tbody><tr class="rep-cat-total-row"><td colspan="4">${cat.code} totaal</td><td class="num">${fmtEUR2(byCategory[cat.code] || 0)}</td></tr></tbody></table>
      </div>`;
  }).join("");

  el.innerHTML = `
    <div class="panel no-print" style="margin-bottom:16px;">
      <div class="panel-head"><h2>Rapportlogo / afbeelding</h2><span class="hint">wordt gebruikt op de coverpagina hieronder</span></div>
      <div class="panel-body" style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
        ${project.logoDataUrl
          ? `<img src="${project.logoDataUrl}" class="logo-preview" alt="Logo">`
          : `<div class="logo-preview placeholder">Geen logo</div>`}
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <label class="btn btn-light btn-sm" style="cursor:pointer;">Logo uploaden<input type="file" id="reportLogoFile" accept="image/*" class="hidden"></label>
          ${project.logoDataUrl ? `<button class="btn btn-sm btn-danger" data-action="remove-logo">Verwijderen</button>` : ""}
        </div>
      </div>
    </div>
    <div class="report-toolbar no-print">
      <button class="btn btn-light" data-action="goto-budget">&larr; Terug naar budget</button>
      <button class="btn btn-primary" data-action="print-report">Printen / opslaan als PDF</button>
    </div>
    <div id="report">
      <div class="report-cover">
        <div class="rc-mark">${project.logoDataUrl ? `<img src="${project.logoDataUrl}" alt="Logo">` : "D&amp;S"}</div>
        <h1>${escapeHTML(project.name).toUpperCase()}</h1>
        <div class="rc-sub">Budget Estimate</div>
        <div class="rc-meta">
          <div>${fmtNum(project.floorArea)} m²</div>
          <div>${project.projectDate || ""}</div>
          <div>${escapeHTML(project.preparedBy || "Drees & Sommer")}</div>
        </div>
      </div>

      <div class="report-section">
        <div class="report-header-row">
          <div><div class="rh-name">${escapeHTML(project.name)}</div>Alle prijzen excl. btw</div>
          <div style="text-align:right;">${fmtNum(project.floorArea)} m²<br>${project.projectDate}<br>${escapeHTML(project.preparedBy || "")}</div>
        </div>
        <h2 class="report-h2">Samenvatting</h2>
        <div class="grid grid-3" style="margin-bottom:22px;">
          <div class="kpi"><div class="label">Doelbudget</div><div class="value">${fmtEUR(project.targetBudget)}</div></div>
          <div class="kpi"><div class="label">Begrote uitgaven</div><div class="value">${fmtEUR(total)}</div></div>
          <div class="kpi ${project.targetBudget - total >= 0 ? "good" : "bad"}"><div class="label">${project.targetBudget - total >= 0 ? "Resterend" : "Overschrijding"}</div><div class="value">${fmtEUR(Math.abs(project.targetBudget - total))}</div></div>
        </div>
        <table class="rep-table summary-table" style="width:100%;">
          <thead><tr><th>Categorie</th><th class="num">%</th><th class="num">Bedrag</th></tr></thead>
          <tbody>
            ${summaryRows}
            <tr class="rep-cat-total-row"><td>Totaal</td><td class="num">100%</td><td class="num">${fmtEUR(total)}</td></tr>
          </tbody>
        </table>
      </div>

      ${detailSections}
    </div>
  `;
}

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }

// ============================================================ VERGRENDELSCHERM
function renderLockScreen(project) {
  const el = document.getElementById("view-locked");
  el.innerHTML = `
    <div class="lock-wrap">
      <div class="lock-card">
        <div class="lock-icon">&#128274;</div>
        <h1>${escapeHTML(project.name)} is vergrendeld</h1>
        <p>Voer het projectwachtwoord in om dit project te bekijken en te bewerken.</p>
        <div class="field"><input type="password" id="unlockInput" placeholder="Wachtwoord" autocomplete="off"></div>
        ${App.unlockError ? `<div class="lock-error">Onjuist wachtwoord. Probeer het opnieuw.</div>` : ""}
        <button class="btn btn-primary" style="width:100%;" data-action="unlock-project" data-id="${project.id}">Ontgrendelen</button>
        <p class="small text-muted">Wachtwoord kwijt? Ga naar het tabblad <strong>Projecten</strong> &mdash; daar kan de beheerder het opvragen of wijzigen.</p>
      </div>
    </div>`;
  const input = document.getElementById("unlockInput");
  if (input) {
    input.focus();
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") document.querySelector('[data-action="unlock-project"]')?.click();
    });
  }
}

// ============================================================ MODAL: NIEUW PROJECT
function renderModal() {
  const root = document.getElementById("modalRoot");
  if (!App.modal) { root.innerHTML = ""; root.classList.add("hidden"); return; }
  root.classList.remove("hidden");

  if (App.modal.type === "newProject") {
    const m = App.modal;
    root.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card">
          <h2>Nieuw project</h2>
          <p class="small text-muted mt-0">Vul een naam en wachtwoord in. Het wachtwoord beveiligt Dashboard, Budget en Rapport van dit project
          &mdash; jij kunt het later altijd terugvinden via het tabblad Projecten.</p>
          <div class="field"><label>Projectnaam *</label><input id="npName" type="text" value="${escapeHTML(m.name || "")}" placeholder="Bijv. BCG Amsterdam Office"></div>
          <div class="field" style="margin-top:12px;"><label>Wachtwoord *</label><input id="npPassword" type="text" value="${escapeHTML(m.password || "")}" placeholder="Projectwachtwoord"></div>
          <div class="field" style="margin-top:12px;">
            <label>Logo / afbeelding voor rapport (optioneel)</label>
            <input type="file" id="npLogoFile" accept="image/*">
            ${m.logoDataUrl ? `<img src="${m.logoDataUrl}" class="logo-preview" style="margin-top:8px;">` : ""}
          </div>
          ${m.error ? `<div class="lock-error" style="margin-top:12px;">${escapeHTML(m.error)}</div>` : ""}
          <div class="modal-actions">
            <button class="btn btn-light" data-action="modal-cancel">Annuleren</button>
            <button class="btn btn-primary" data-action="modal-create-project">Project aanmaken</button>
          </div>
        </div>
      </div>`;
    document.getElementById("npName")?.focus();
  }
}
