/* DreSo Budgettool — UI & interactie (vanilla JS, geen build-stap) */

const App = {
  tab: "dashboard",

  init() {
    Store.init();
    this.bindGlobalEvents();
    this.render();
  },

  bindGlobalEvents() {
    document.getElementById("tabs").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-tab]");
      if (!btn) return;
      this.tab = btn.dataset.tab;
      this.render();
    });

    document.getElementById("projectPicker").addEventListener("change", (e) => {
      Store.setActiveProject(e.target.value);
      this.render();
    });

    document.body.addEventListener("click", (e) => this.handleClick(e));
    document.body.addEventListener("change", (e) => this.handleChange(e));
    document.body.addEventListener("input", (e) => this.handleInput(e));
  },

  render() {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === this.tab));
    document.querySelectorAll(".tab-view").forEach(v => v.classList.add("hidden"));
    const active = document.getElementById("view-" + this.tab);
    active.classList.remove("hidden");

    this.renderProjectPicker();

    const p = Store.activeProject;
    if (!p) return;

    if (this.tab === "dashboard") renderDashboard(p);
    if (this.tab === "budget") renderBudget(p);
    if (this.tab === "prices") renderPrices();
    if (this.tab === "projects") renderProjects();
    if (this.tab === "report") renderReport(p);
  },

  renderProjectPicker() {
    const sel = document.getElementById("projectPicker");
    const projects = Object.values(Store.state.projects).sort((a, b) => a.name.localeCompare(b.name));
    sel.innerHTML = projects.map(p =>
      `<option value="${p.id}" ${p.id === Store.state.activeId ? "selected" : ""}>${escapeHTML(p.name)}</option>`
    ).join("");
  },

  // ---------------- centrale event handling ----------------
  handleClick(e) {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    const p = Store.activeProject;

    switch (action) {
      case "add-line": {
        const row = el.closest("tr");
        const select = row.querySelector(".add-select");
        const qtyInput = row.querySelector(".add-qty");
        const subheader = el.dataset.subheader;
        const qty = Number(qtyInput.value) || 1;
        if (!select.value) return;
        if (select.value === "__custom__") {
          const desc = row.querySelector(".add-custom-desc").value.trim();
          const unit = row.querySelector(".add-custom-unit").value.trim() || "pieces";
          const price = Number(row.querySelector(".add-custom-price").value) || 0;
          if (!desc) { row.querySelector(".add-custom-desc").focus(); return; }
          Store.addLine(subheader, { description: desc, unit, quantity: qty, priceOverride: price });
        } else {
          const item = Store.catalogItem(select.value);
          if (!item) return;
          Store.addLine(subheader, { code: item.code, description: item.description, unit: item.unit, quantity: qty });
        }
        this.render();
        break;
      }
      case "remove-line":
        if (confirm("Deze regel verwijderen?")) { Store.removeLine(el.dataset.lineId); this.render(); }
        break;

      case "add-catalog-item": {
        const row = el.closest("tr");
        const subheader = el.dataset.subheader;
        const desc = row.querySelector(".new-item-desc").value.trim();
        const unit = row.querySelector(".new-item-unit").value.trim() || "pieces";
        const price = Number(row.querySelector(".new-item-price").value) || 0;
        if (!desc) { row.querySelector(".new-item-desc").focus(); return; }
        Store.addCatalogItem({ code: Store.nextItemCode(subheader), subheader, description: desc, unit, price });
        this.render();
        break;
      }
      case "remove-catalog-item":
        if (confirm("Dit catalogusitem verwijderen? Bestaande projectregels blijven hun laatst bekende prijs behouden.")) {
          Store.removeCatalogItem(el.dataset.code); this.render();
        }
        break;

      case "add-subheader": {
        const category = el.dataset.category;
        const name = prompt("Naam van de nieuwe subcategorie:");
        if (name && name.trim()) { Store.addSubheader(category, name.trim()); this.render(); }
        break;
      }
      case "add-category": {
        const name = prompt("Naam van de nieuwe hoofdcategorie:");
        if (name && name.trim()) { Store.addCategory(name.trim()); this.render(); }
        break;
      }

      case "set-finishing":
        Store.updateActiveProject({ finishingLevel: el.dataset.level });
        this.render();
        break;

      case "new-project": {
        const proj = Store.createProject("Nieuw project");
        Store.setActiveProject(proj.id);
        this.tab = "dashboard";
        this.render();
        break;
      }
      case "select-project":
        Store.setActiveProject(el.dataset.id);
        this.tab = "dashboard";
        this.render();
        break;
      case "duplicate-project":
        Store.duplicateProject(el.dataset.id);
        this.render();
        break;
      case "delete-project":
        if (confirm("Dit project definitief verwijderen? Dit kan niet ongedaan gemaakt worden.")) {
          Store.deleteProject(el.dataset.id);
          this.render();
        }
        break;
      case "export-project":
        downloadJSON(Store.exportProject(el.dataset.id), `${slug(Store.state.projects[el.dataset.id].name)}-dreso-budget.json`);
        break;
      case "export-backup":
        downloadJSON(Store.exportAll(), `dreso-budgettool-backup-${todayStamp()}.json`);
        break;
      case "trigger-import-project":
        document.getElementById("importProjectFile").click();
        break;
      case "trigger-import-backup":
        document.getElementById("importBackupFile").click();
        break;
      case "print-report":
        this.tab = "report";
        this.render();
        setTimeout(() => window.print(), 80);
        break;
      case "goto-budget":
        this.tab = "budget"; this.render();
        break;
    }
  },

  handleChange(e) {
    // toggle custom-item fields in "add line" rows
    if (e.target.matches(".add-select")) {
      const row = e.target.closest("tr");
      const isCustom = e.target.value === "__custom__";
      row.querySelectorAll(".custom-fields").forEach(f => f.classList.toggle("hidden", !isCustom));
      return;
    }

    // project meta fields
    if (e.target.matches("[data-project-field]")) {
      const field = e.target.dataset.projectField;
      let value = e.target.value;
      if (["floorArea", "targetBudget"].includes(field)) value = Number(value) || 0;
      Store.updateActiveProject({ [field]: value });
      this.render();
      return;
    }

    // line field edits (qty / unit / price override)
    if (e.target.matches("[data-line-field]")) {
      const lineId = e.target.dataset.lineId;
      const field = e.target.dataset.lineField;
      const project = Store.activeProject;
      const line = project.lines.find(l => l.id === lineId);
      if (!line) return;

      if (field === "quantity") {
        Store.updateLine(lineId, { quantity: Number(e.target.value) || 0 });
      } else if (field === "unit") {
        Store.updateLine(lineId, { unit: e.target.value });
      } else if (field === "description") {
        Store.updateLine(lineId, { description: e.target.value });
      } else if (field === "price") {
        const raw = e.target.value;
        const catalogItem = Store.catalogItem(line.code);
        const catalogEffective = catalogItem ? catalogItem.price * Calc.finishingFactor(project.finishingLevel) : null;
        const num = raw === "" ? null : Number(raw);
        if (line.code && catalogEffective != null && num != null && Math.abs(num - catalogEffective) < 0.005) {
          Store.updateLine(lineId, { priceOverride: null });
        } else {
          Store.updateLine(lineId, { priceOverride: num });
        }
      }
      this.render();
      return;
    }

    // catalog item edits (Eenheidsprijzen tab)
    if (e.target.matches("[data-catalog-field]")) {
      const code = e.target.dataset.code;
      const field = e.target.dataset.catalogField;
      const value = field === "price" ? Number(e.target.value) || 0 : e.target.value;
      Store.updateCatalogItem(code, { [field]: value });
      this.render();
      return;
    }

    if (e.target.id === "importProjectFile") {
      readJSONFile(e.target.files[0], (data) => {
        const p = Store.importProject(data);
        if (p) { Store.setActiveProject(p.id); this.render(); }
      });
      e.target.value = "";
    }
    if (e.target.id === "importBackupFile") {
      readJSONFile(e.target.files[0], (data) => {
        if (confirm("Dit vervangt alle lokale projecten en eenheidsprijzen door de inhoud van dit back-upbestand. Doorgaan?")) {
          Store.importAll(data);
          this.render();
        }
      });
      e.target.value = "";
    }
  },

  handleInput(e) {
    // live update while typing for text-ish fields, without losing focus:
    // we intentionally do NOT full re-render on every keystroke for text/number inputs
    // that are already handled onchange, to keep focus. Only used for the search field.
    if (e.target.id === "catalogSearch") {
      renderPrices(e.target.value);
    }
  },
};

// ---------------- helpers ----------------
function escapeHTML(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function slug(str) {
  return String(str).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "project";
}
function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}
function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
function readJSONFile(file, cb) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try { cb(JSON.parse(reader.result)); }
    catch (e) { alert("Kon dit bestand niet lezen: geen geldig JSON-bestand."); }
  };
  reader.readAsText(file);
}

document.addEventListener("DOMContentLoaded", () => App.init());
