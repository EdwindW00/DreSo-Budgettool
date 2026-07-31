/* DreSo Budgettool — render-functies per tabblad */

function finishLabel(key) {
  return t("finish." + key);
}

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
    : `<div class="empty-state small">${t("dash.emptyNoLines")}</div>`;

  const legend = catRows.map((r, i) => `
    <div class="legend-row">
      <span class="legend-swatch" style="background:${PALETTE[i % PALETTE.length]}"></span>
      <span class="lbl">${r.code} &middot; ${escapeHTML(r.name)}</span>
      <span class="val">${fmtEUR(r.value)}</span>
    </div>`).join("") || `<div class="text-muted small">${t("dash.emptyAddOnBudget")}</div>`;

  el.innerHTML = `
    <div class="view-header">
      <div>
        <h1>${t("dash.title")}</h1>
        <p>${t("dash.subtitle")}</p>
      </div>
      <div class="view-actions">
        <button class="btn btn-light" data-action="goto-budget">${t("dash.gotoBudget")}</button>
        <button class="btn btn-primary" data-action="print-report">${t("dash.generateReport")}</button>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head"><h2>${t("dash.projectInfo")}</h2><span class="hint">${t("dash.autosaveHint")}</span></div>
      <div class="panel-body">
        <div class="field-row">
          <div class="field"><label>${t("dash.fieldName")}</label>
            <input type="text" data-project-field="name" value="${escapeHTML(project.name)}"></div>
          <div class="field"><label>${t("dash.fieldFloorArea")}</label>
            <input type="number" min="0" data-project-field="floorArea" value="${project.floorArea || 0}"></div>
          <div class="field"><label>${t("dash.fieldDate")}</label>
            <input type="date" data-project-field="projectDate" value="${project.projectDate || ""}"></div>
          <div class="field"><label>${t("dash.fieldPreparedBy")}</label>
            <input type="text" data-project-field="preparedBy" value="${escapeHTML(project.preparedBy || "")}" placeholder="${t("dash.fieldPreparedByPlaceholder")}"></div>
        </div>
        <div class="field-row" style="margin-top:14px;">
          <div class="field"><label>${t("dash.fieldTargetBudget")}</label>
            <input type="number" min="0" step="1000" data-project-field="targetBudget" value="${project.targetBudget || 0}"></div>
          <div class="field" style="flex:2;">
            <label>${t("dash.finishLevelLabel")}</label>
            <div class="finish-toggle">
              ${Object.entries(FINISHING_LEVELS).map(([key, lvl]) => `
                <div class="finish-opt ${project.finishingLevel === key ? "active" : ""}" data-action="set-finishing" data-level="${key}">
                  ${finishLabel(key)}<small>${lvl.suffix}</small>
                </div>`).join("")}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-4" style="margin-top:18px;">
      <div class="kpi accent">
        <div class="label">${t("dash.kpiTargetBudget")}</div>
        <div class="value">${fmtEUR(project.targetBudget)}</div>
        <div class="sub">${fmtNum(project.floorArea)} m² &middot; ${project.floorArea ? fmtEUR2((project.targetBudget||0)/project.floorArea) + "/m²" : "—"}</div>
      </div>
      <div class="kpi">
        <div class="label">${t("dash.kpiExpenses")}</div>
        <div class="value">${fmtEUR(total)}</div>
        <div class="sub">${project.floorArea ? fmtEUR2(total/project.floorArea) + " " + t("dash.perM2") : t("dash.linesCount", { n: project.lines.length })}</div>
      </div>
      <div class="kpi ${diff >= 0 ? "good" : "bad"}">
        <div class="label">${diff >= 0 ? t("dash.kpiRemaining") : t("dash.kpiOverrun")}</div>
        <div class="value">${fmtEUR(Math.abs(diff))}</div>
        <div class="sub">${project.targetBudget ? fmtPct(diff/project.targetBudget) + " " + t("dash.ofTarget") : "—"}</div>
      </div>
      <div class="kpi">
        <div class="label">${t("dash.kpiSpent")}</div>
        <div class="value">${fmtPct(pctUsed)}</div>
        <div class="sub">${t("dash.kpiSpentSub")}</div>
      </div>
    </div>

    <div class="grid grid-2" style="margin-top:18px; align-items:stretch;">
      <div class="panel">
        <div class="panel-head"><h2>${t("dash.categoryBreakdown")}</h2></div>
        <div class="panel-body" style="display:flex; gap:22px; align-items:center; flex-wrap:wrap;">
          <div>${donut}</div>
          <div class="chart-legend" style="flex:1; min-width:200px;">${legend}</div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head"><h2>${t("dash.budgetPerCategory")}</h2></div>
        <div class="panel-body">
          ${catRows.length ? barList(catRows.map(r => ({ label: `${r.code} ${r.name}`, value: r.value })), { fmt: fmtEUR }) : `<div class="empty-state small">${t("dash.emptyNoLines")}</div>`}
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
                ? `${escapeHTML(description)} <span class="chip">${t("budget.chipCatalog")}</span>`
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
              ${isOverride ? `<span class="chip override-chip">${t("budget.chipCustom")}</span>` : ""}
            </td>
            <td class="num" style="font-weight:700;">${fmtEUR2(lineTotal)}</td>
            <td class="center">${catalogItem ? "" : `<button class="icon-btn" data-action="remove-line" data-line-id="${line.id}" title="${t("budget.remove")}">&#10005;</button>`}</td>
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
          <td><input class="add-custom-desc" placeholder="${t("budget.addPlaceholderDesc")}" style="width:100%;"></td>
          <td class="center"><input class="add-qty" type="number" min="0" step="any" value="1" style="width:56px; text-align:center;"></td>
          <td class="center"><input class="add-custom-unit" placeholder="${t("budget.addPlaceholderUnit")}" style="width:70px;"></td>
          <td class="num"><input class="add-custom-price" type="number" placeholder="${t("budget.addPlaceholderPrice")}" style="width:100px; text-align:right;"></td>
          <td></td>
          <td class="center"><button class="btn btn-sm btn-light" data-action="add-line" data-subheader="${sub.code}">${t("budget.addButton")}</button></td>
        </tr>`;
    }).join("");

    return `
      <table class="budget-table" style="margin-bottom:22px;">
        <thead>
          <tr class="cat-row"><td colspan="5">${cat.code} &middot; ${escapeHTML(cat.name).toUpperCase()}</td><td class="num cat-total">${fmtEUR2(catTotal)}</td><td></td></tr>
          <tr>
            <th style="width:70px;">${t("budget.colCode")}</th>
            <th>${t("budget.colDescription")}</th>
            <th class="center" style="width:80px;">${t("budget.colQty")}</th>
            <th class="center" style="width:80px;">${t("budget.colUnit")}</th>
            <th class="num" style="width:130px;">${t("budget.colUnitPrice")}</th>
            <th class="num" style="width:120px;">${t("budget.colTotal")}</th>
            <th style="width:36px;"></th>
          </tr>
        </thead>
        <tbody>${subBlocks}</tbody>
      </table>`;
  }).join("");

  el.innerHTML = `
    <div class="view-header">
      <div>
        <h1>${t("budget.title", { name: escapeHTML(project.name) })}</h1>
        <p>${t("budget.description", { level: `${finishLabel(project.finishingLevel)} ${FINISHING_LEVELS[project.finishingLevel].suffix}` })}</p>
      </div>
      <div class="view-actions">
        <button class="btn btn-light" data-action="add-category">${t("budget.addCategory")}</button>
      </div>
    </div>
    ${catBlocks}
    <table class="budget-table">
      <tbody><tr class="grand-total-row"><td style="width:70%;">${t("budget.grandTotal")}</td><td class="num">${fmtEUR2(total)}</td></tr></tbody>
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
          <td class="center"><button class="icon-btn" data-action="remove-catalog-item" data-code="${item.code}" title="${t("budget.remove")}">&#10005;</button></td>
        </tr>`).join("");

      return `
        <tr class="sub-row"><td colspan="5">${sub.code} &middot; ${escapeHTML(sub.name)}</td></tr>
        ${rows}
        <tr class="add-row">
          <td></td>
          <td><input class="new-item-desc" placeholder="${t("prices.newDescPlaceholder")}" style="width:100%;"></td>
          <td class="center"><input class="new-item-unit" placeholder="${t("prices.newUnitPlaceholder")}" style="width:80px;"></td>
          <td class="num"><input class="new-item-price" type="number" placeholder="0" style="width:100px;"></td>
          <td class="center"><button class="btn btn-sm btn-light" data-action="add-catalog-item" data-subheader="${sub.code}">+</button></td>
        </tr>`;
    }).join("");

    if (q && !subBlocks.trim()) return "";

    return `
      <table class="budget-table" style="margin-bottom:22px;">
        <thead>
          <tr class="cat-row"><td colspan="5">${cat.code} &middot; ${escapeHTML(cat.name).toUpperCase()} <button class="btn btn-sm btn-ghost" style="margin-left:10px; background:rgba(255,255,255,.15); border-color:rgba(255,255,255,.3);" data-action="add-subheader" data-category="${cat.code}">${t("prices.addSubheader")}</button></td></tr>
          <tr><th style="width:70px;">${t("prices.colCode")}</th><th>${t("prices.colDescription")}</th><th class="center" style="width:100px;">${t("prices.colUnit")}</th><th class="num" style="width:120px;">${t("prices.colUnitPrice")}</th><th style="width:36px;"></th></tr>
        </thead>
        <tbody>${subBlocks}</tbody>
      </table>`;
  }).join("");

  el.innerHTML = `
    <div class="view-header">
      <div>
        <h1>${t("prices.title")}</h1>
        <p>${t("prices.description")}</p>
      </div>
      <div class="view-actions">
        <input id="catalogSearch" placeholder="${t("prices.searchPlaceholder")}" style="border:1px solid var(--line); border-radius:8px; padding:8px 12px; min-width:240px;" value="${escapeHTML(q)}">
        <button class="btn btn-light" data-action="add-category">${t("prices.addCategory")}</button>
      </div>
    </div>
    ${catBlocks || `<div class="empty-state">${t("prices.noResults", { q: escapeHTML(q) })}</div>`}
  `;
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
          <div class="pname">${escapeHTML(p.name)} ${isActive ? `<span class="chip">${t("projects.chipActive")}</span>` : ""} ${p.password ? `<span class="chip override-chip">${t("projects.chipLocked")}</span>` : ""}</div>
          <div class="pmeta">${t("projects.metaLine", { m2: fmtNum(p.floorArea), budgeted: fmtEUR(total), target: fmtEUR(p.targetBudget), lines: p.lines.length, date: p.projectDate || "" })}</div>
          <div class="pw-row">
            <span class="small text-muted">${t("projects.passwordLabel")}</span>
            <span class="pw-value">${p.password ? (pwVisible ? escapeHTML(p.password) : "••••••••") : t("projects.passwordNone")}</span>
            ${p.password ? `<button class="icon-btn" data-action="toggle-pw" data-id="${p.id}" title="${t("projects.toggleShow")}">${pwVisible ? "🙈" : "👁"}</button>` : ""}
            <button class="btn btn-sm btn-light" data-action="change-password" data-id="${p.id}">${p.password ? t("projects.change") : t("projects.setPassword")}</button>
          </div>
        </div>
        <div class="pactions">
          <button class="btn btn-sm btn-light" data-action="select-project" data-id="${p.id}">${t("projects.open")}</button>
          <button class="btn btn-sm btn-light" data-action="duplicate-project" data-id="${p.id}">${t("projects.duplicate")}</button>
          <button class="btn btn-sm btn-light" data-action="export-project" data-id="${p.id}">${t("projects.export")}</button>
          <button class="btn btn-sm btn-danger" data-action="delete-project" data-id="${p.id}">${t("projects.delete")}</button>
        </div>
      </div>`;
  }).join("");

  el.innerHTML = `
    <div class="view-header">
      <div>
        <h1>${t("projects.title")}</h1>
        <p>${t("projects.description")}</p>
      </div>
      <div class="view-actions">
        <button class="btn btn-light" data-action="trigger-import-project">${t("projects.importProject")}</button>
        <button class="btn btn-primary" data-action="new-project">${t("projects.newProject")}</button>
      </div>
    </div>

    ${cards || `<div class="empty-state"><div class="big">📁</div>${t("projects.emptyState")}</div>`}

    <div class="panel" style="margin-top:24px;">
      <div class="panel-head"><h2>${t("projects.securityTitle")}</h2></div>
      <div class="panel-body">
        <p class="small text-muted mt-0">${t("projects.securityText")}</p>
      </div>
    </div>

    <div class="panel" style="margin-top:18px;">
      <div class="panel-head"><h2>${t("projects.backupTitle")}</h2></div>
      <div class="panel-body" style="display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn btn-light" data-action="export-backup">${t("projects.exportBackup")}</button>
        <button class="btn btn-light" data-action="trigger-import-backup">${t("projects.importBackup")}</button>
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
          <tbody>${rows}<tr class="rep-sub-row"><td colspan="4">${t("report.subtotal")}</td><td class="num">${fmtEUR2(subTotal)}</td></tr></tbody>
        </table>`;
    }).join("");

    return `
      <div class="report-section">
        <div class="report-header-row">
          <div><div class="rh-name">${escapeHTML(project.name)}</div>${t("report.pricesExclVat")}</div>
          <div style="text-align:right;">${fmtNum(project.floorArea)} m²<br>${project.projectDate}<br>${escapeHTML(project.preparedBy || "")}</div>
        </div>
        <div class="rep-cat-band">${cat.code} &middot; ${escapeHTML(cat.name).toUpperCase()}</div>
        <table class="rep-table" style="width:100%; margin-top:8px;">
          <thead><tr><th>${t("report.repColCode")}</th><th>${t("report.repColDescription")}</th><th class="num">${t("report.repColQty")}</th><th class="num">${t("report.repColUnitPrice")}</th><th class="num">${t("report.repColTotal")}</th></tr></thead>
        </table>
        ${subTables}
        <table class="rep-table" style="width:100%;"><tbody><tr class="rep-cat-total-row"><td colspan="4">${t("report.categoryTotal", { cat: cat.code })}</td><td class="num">${fmtEUR2(byCategory[cat.code] || 0)}</td></tr></tbody></table>
      </div>`;
  }).join("");

  const logoScale = project.logoScale || 1;
  const logoOffX = project.logoOffsetX || 0;
  const logoOffY = project.logoOffsetY || 0;
  const logoTransform = `translate(${logoOffX}px, ${logoOffY}px) scale(${logoScale})`;

  el.innerHTML = `
    <div class="panel no-print" style="margin-bottom:16px;">
      <div class="panel-head"><h2>${t("report.logoTitle")}</h2><span class="hint">${t("report.logoHint")}</span></div>
      <div class="panel-body" style="display:flex; align-items:center; gap:20px; flex-wrap:wrap;">
        ${project.logoDataUrl
          ? `<img src="${project.logoDataUrl}" class="logo-preview" alt="Logo">`
          : `<div class="logo-preview placeholder">${t("report.logoPlaceholder")}</div>`}
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <label class="btn btn-light btn-sm" style="cursor:pointer;">${t("report.logoUpload")}<input type="file" id="reportLogoFile" accept="image/*" class="hidden"></label>
          ${project.logoDataUrl ? `<button class="btn btn-sm btn-danger" data-action="remove-logo">${t("report.logoRemove")}</button>` : ""}
        </div>
        ${project.logoDataUrl ? `
        <div class="field" style="min-width:220px;">
          <label id="logoScaleLabel">${t("report.logoScaleLabel", { pct: Math.round(logoScale * 100) })}</label>
          <input type="range" min="30" max="300" step="5" id="logoScaleRange" value="${Math.round(logoScale * 100)}">
        </div>
        <button class="btn btn-sm btn-light" data-action="reset-logo-position">${t("report.logoResetBtn")}</button>
        <p class="small text-muted" style="width:100%; margin:0;">${t("report.dragHint")}</p>` : ""}
      </div>
    </div>
    <div class="report-toolbar no-print">
      <button class="btn btn-light" data-action="goto-budget">${t("report.backToBudget")}</button>
      <button class="btn btn-primary" data-action="print-report">${t("report.print")}</button>
    </div>
    <div id="report">
      <div class="report-cover">
        <div class="cover-ruler"></div>
        <div class="cover-headstrip">
          <div class="cover-doclabel">${t("report.docLabel")}</div>
          <div class="cover-docmeta">${t("report.docMeta", { id: escapeHTML((project.id || "").slice(-6).toUpperCase()) })}</div>
        </div>
        <div class="cover-corner tl"></div>
        <div class="cover-corner tr"></div>
        <div class="cover-corner bl"></div>
        <div class="cover-corner br"></div>

        <div class="cover-logo-zone">
          ${project.logoDataUrl
            ? `<img id="coverLogoImg" src="${project.logoDataUrl}" alt="Logo" style="transform:${logoTransform};">`
            : `<div class="cover-logo-empty">${t("report.logoPlaceholder")}</div>`}
        </div>

        <div class="cover-titlearea">
          <h1>${escapeHTML(project.name).toUpperCase()}</h1>
          <div class="cover-rule"></div>
        </div>

        <div class="cover-titleblock">
          <div class="tb-cell"><span class="tb-label">${t("report.tbProject")}</span><span class="tb-value">${escapeHTML(project.name)}</span></div>
          <div class="tb-cell"><span class="tb-label">${t("report.tbArea")}</span><span class="tb-value">${fmtNum(project.floorArea)} m&sup2;</span></div>
          <div class="tb-cell"><span class="tb-label">${t("report.tbDate")}</span><span class="tb-value">${project.projectDate || ""}</span></div>
          <div class="tb-cell"><span class="tb-label">${t("report.tbPreparedBy")}</span><span class="tb-value">${escapeHTML(project.preparedBy || "Drees & Sommer")}</span></div>
          <div class="tb-cell"><span class="tb-label">${t("report.tbDocument")}</span><span class="tb-value">${t("report.tbDocumentValue")}</span></div>
          <div class="tb-cell"><span class="tb-label">${t("report.tbStatus")}</span><span class="tb-value">${t("report.tbStatusValue")}</span></div>
        </div>
      </div>

      <div class="report-section">
        <div class="report-header-row">
          <div><div class="rh-name">${escapeHTML(project.name)}</div>${t("report.pricesExclVat")}</div>
          <div style="text-align:right;">${fmtNum(project.floorArea)} m²<br>${project.projectDate}<br>${escapeHTML(project.preparedBy || "")}</div>
        </div>
        <h2 class="report-h2">${t("report.summary")}</h2>
        <div class="grid grid-3" style="margin-bottom:22px;">
          <div class="kpi"><div class="label">${t("report.kpiTarget")}</div><div class="value">${fmtEUR(project.targetBudget)}</div></div>
          <div class="kpi"><div class="label">${t("report.kpiExpenses")}</div><div class="value">${fmtEUR(total)}</div></div>
          <div class="kpi ${project.targetBudget - total >= 0 ? "good" : "bad"}"><div class="label">${project.targetBudget - total >= 0 ? t("report.kpiRemaining") : t("report.kpiOverrun")}</div><div class="value">${fmtEUR(Math.abs(project.targetBudget - total))}</div></div>
        </div>
        <table class="rep-table summary-table" style="width:100%;">
          <thead><tr><th>${t("report.colCategory")}</th><th class="num">${t("report.colPercent")}</th><th class="num">${t("report.colAmount")}</th></tr></thead>
          <tbody>
            ${summaryRows}
            <tr class="rep-cat-total-row"><td>${t("report.colTotal")}</td><td class="num">100%</td><td class="num">${fmtEUR(total)}</td></tr>
          </tbody>
        </table>
      </div>

      ${detailSections}
    </div>
  `;

  bindCoverLogoDrag();
}

// sleepbaar maken van het covers-logo (grootte via de slider hierboven, positie via drag)
function bindCoverLogoDrag() {
  const img = document.getElementById("coverLogoImg");
  if (!img) return;
  let dragging = false;
  let startX = 0, startY = 0, startOffX = 0, startOffY = 0;

  const applyTransform = (offX, offY) => {
    const scale = (Store.activeProject.logoScale || 1);
    img.style.transform = `translate(${offX}px, ${offY}px) scale(${scale})`;
  };

  img.addEventListener("pointerdown", (e) => {
    dragging = true;
    img.setPointerCapture(e.pointerId);
    img.classList.add("dragging");
    startX = e.clientX; startY = e.clientY;
    const proj = Store.activeProject;
    startOffX = proj.logoOffsetX || 0;
    startOffY = proj.logoOffsetY || 0;
  });
  img.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    applyTransform(startOffX + (e.clientX - startX), startOffY + (e.clientY - startY));
  });
  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    img.classList.remove("dragging");
    Store.updateActiveProject({
      logoOffsetX: startOffX + (e.clientX - startX),
      logoOffsetY: startOffY + (e.clientY - startY),
    });
  };
  img.addEventListener("pointerup", endDrag);
  img.addEventListener("pointercancel", endDrag);
}

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }

// ============================================================ VERGRENDELSCHERM
function renderLockScreen(project) {
  const el = document.getElementById("view-locked");
  el.innerHTML = `
    <div class="lock-wrap">
      <div class="lock-card">
        <div class="lock-icon">&#128274;</div>
        <h1>${t("lock.title", { name: escapeHTML(project.name) })}</h1>
        <p>${t("lock.desc")}</p>
        <div class="field"><input type="password" id="unlockInput" placeholder="${t("lock.passwordPlaceholder")}" autocomplete="off"></div>
        ${App.unlockError ? `<div class="lock-error">${t("lock.wrongPassword")}</div>` : ""}
        <button class="btn btn-primary" style="width:100%;" data-action="unlock-project" data-id="${project.id}">${t("lock.unlockBtn")}</button>
        <p class="small text-muted">${t("lock.forgotHint")}</p>
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
          <h2>${t("modal.title")}</h2>
          <p class="small text-muted mt-0">${t("modal.helpText")}</p>
          <div class="field"><label>${t("modal.fieldName")}</label><input id="npName" type="text" value="${escapeHTML(m.name || "")}" placeholder="${t("modal.fieldNamePlaceholder")}"></div>
          <div class="field" style="margin-top:12px;"><label>${t("modal.fieldPassword")}</label><input id="npPassword" type="text" value="${escapeHTML(m.password || "")}" placeholder="${t("modal.fieldPasswordPlaceholder")}"></div>
          <div class="field" style="margin-top:12px;">
            <label>${t("modal.fieldLogo")}</label>
            <input type="file" id="npLogoFile" accept="image/*">
            ${m.logoDataUrl ? `<img src="${m.logoDataUrl}" class="logo-preview" style="margin-top:8px;">` : ""}
          </div>
          ${m.error ? `<div class="lock-error" style="margin-top:12px;">${escapeHTML(m.error)}</div>` : ""}
          <div class="modal-actions">
            <button class="btn btn-light" data-action="modal-cancel">${t("modal.cancel")}</button>
            <button class="btn btn-primary" data-action="modal-create-project">${t("modal.create")}</button>
          </div>
        </div>
      </div>`;
    document.getElementById("npName")?.focus();
  }
}
