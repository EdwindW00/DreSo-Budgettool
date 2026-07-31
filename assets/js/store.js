/* DreSo Budgettool — dataopslag & berekeningen (localStorage, geen server nodig) */

const LS_KEYS = {
  categories: "dreso.categories.v1",
  subheaders: "dreso.subheaders.v1",
  catalog:    "dreso.catalog.v1",
  projects:   "dreso.projects.v1",
  activeId:   "dreso.activeProject.v1",
};

function uid(prefix) {
  return (prefix ? prefix + "_" : "") + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch (e) {
    console.warn("Kon", key, "niet laden:", e);
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const Store = {
  state: {
    categories: [],
    subheaders: [],
    catalog: [],
    projects: {},
    activeId: null,
  },

  init() {
    this.state.categories = loadJSON(LS_KEYS.categories, null) || structuredClone(DEFAULT_CATEGORIES);
    this.state.subheaders = loadJSON(LS_KEYS.subheaders, null) || structuredClone(DEFAULT_SUBHEADERS);
    this.state.catalog    = loadJSON(LS_KEYS.catalog, null)    || structuredClone(DEFAULT_CATALOG);
    this.state.projects   = loadJSON(LS_KEYS.projects, null)   || {};
    this.state.activeId   = loadJSON(LS_KEYS.activeId, null);

    if (Object.keys(this.state.projects).length === 0) {
      const p = this.createProject("Nieuw project");
      this.state.activeId = p.id;
    }
    if (!this.state.activeId || !this.state.projects[this.state.activeId]) {
      this.state.activeId = Object.keys(this.state.projects)[0];
    }
    this.persistAll();
  },

  persistAll() {
    saveJSON(LS_KEYS.categories, this.state.categories);
    saveJSON(LS_KEYS.subheaders, this.state.subheaders);
    saveJSON(LS_KEYS.catalog, this.state.catalog);
    saveJSON(LS_KEYS.projects, this.state.projects);
    saveJSON(LS_KEYS.activeId, this.state.activeId);
  },

  // ---------- projecten ----------
  createProject(name) {
    const id = uid("proj");
    const project = {
      id,
      name: name || "Nieuw project",
      floorArea: 0,
      projectDate: new Date().toISOString().slice(0, 10),
      preparedBy: "",
      targetBudget: 0,
      finishingLevel: "medium",
      notes: "",
      lines: [],
    };
    this.state.projects[id] = project;
    this.persistAll();
    return project;
  },

  duplicateProject(id) {
    const src = this.state.projects[id];
    if (!src) return null;
    const copy = structuredClone(src);
    copy.id = uid("proj");
    copy.name = src.name + " (kopie)";
    copy.lines = copy.lines.map(l => ({ ...l, id: uid("line") }));
    this.state.projects[copy.id] = copy;
    this.persistAll();
    return copy;
  },

  deleteProject(id) {
    delete this.state.projects[id];
    if (this.state.activeId === id) {
      const remaining = Object.keys(this.state.projects);
      this.state.activeId = remaining[0] || null;
      if (!this.state.activeId) this.createProject("Nieuw project").id;
    }
    this.persistAll();
  },

  get activeProject() {
    return this.state.projects[this.state.activeId] || null;
  },

  setActiveProject(id) {
    if (this.state.projects[id]) {
      this.state.activeId = id;
      this.persistAll();
    }
  },

  updateActiveProject(patch) {
    const p = this.activeProject;
    if (!p) return;
    Object.assign(p, patch);
    this.persistAll();
  },

  // ---------- regels ----------
  addLine(subheaderCode, opts) {
    const p = this.activeProject;
    if (!p) return null;
    const line = {
      id: uid("line"),
      code: opts.code || null,
      subheader: subheaderCode,
      description: opts.description || "",
      unit: opts.unit || "pieces",
      quantity: Number(opts.quantity) || 0,
      priceOverride: opts.priceOverride != null ? Number(opts.priceOverride) : null,
    };
    p.lines.push(line);
    this.persistAll();
    return line;
  },

  updateLine(lineId, patch) {
    const p = this.activeProject;
    if (!p) return;
    const line = p.lines.find(l => l.id === lineId);
    if (!line) return;
    Object.assign(line, patch);
    this.persistAll();
  },

  removeLine(lineId) {
    const p = this.activeProject;
    if (!p) return;
    p.lines = p.lines.filter(l => l.id !== lineId);
    this.persistAll();
  },

  // ---------- catalogus (eenheidsprijzen) ----------
  addCatalogItem(item) {
    this.state.catalog.push({
      code: item.code || uid("item"),
      subheader: item.subheader,
      description: item.description || "Nieuw item",
      unit: item.unit || "pieces",
      price: Number(item.price) || 0,
    });
    this.persistAll();
  },

  updateCatalogItem(code, patch) {
    const item = this.state.catalog.find(i => i.code === code);
    if (!item) return;
    Object.assign(item, patch);
    this.persistAll();
  },

  removeCatalogItem(code) {
    this.state.catalog = this.state.catalog.filter(i => i.code !== code);
    this.persistAll();
  },

  catalogItem(code) {
    return this.state.catalog.find(i => i.code === code) || null;
  },

  nextItemCode(subheaderCode) {
    const prefix = subheaderCode.replace(/^0/, ""); // "01.01" -> "1.01"
    const existing = this.state.catalog
      .filter(i => i.subheader === subheaderCode)
      .map(i => Number(i.code.split(".").pop()))
      .filter(n => !Number.isNaN(n));
    const next = existing.length ? Math.max(...existing) + 1 : 1;
    return `${prefix}.${String(next).padStart(2, "0")}`;
  },

  // ---------- categorieën / subcategorieën ----------
  addCategory(name) {
    const nums = this.state.categories.map(c => Number(c.code));
    const nextNum = (nums.length ? Math.max(...nums) : 0) + 1;
    const code = String(nextNum).padStart(2, "0");
    this.state.categories.push({ code, name });
    this.persistAll();
    return code;
  },

  addSubheader(categoryCode, name) {
    const nums = this.state.subheaders
      .filter(s => s.category === categoryCode)
      .map(s => Number(s.code.split(".")[1]));
    const nextNum = (nums.length ? Math.max(...nums) : 0) + 1;
    const code = `${categoryCode}.${String(nextNum).padStart(2, "0")}`;
    this.state.subheaders.push({ code, category: categoryCode, name });
    this.persistAll();
    return code;
  },

  subheadersFor(categoryCode) {
    return this.state.subheaders.filter(s => s.category === categoryCode);
  },

  categoryOf(subheaderCode) {
    const sh = this.state.subheaders.find(s => s.code === subheaderCode);
    return sh ? this.state.categories.find(c => c.code === sh.category) : null;
  },

  // ---------- import/export ----------
  exportAll() {
    return {
      exportedAt: new Date().toISOString(),
      categories: this.state.categories,
      subheaders: this.state.subheaders,
      catalog: this.state.catalog,
      projects: this.state.projects,
    };
  },

  importAll(data) {
    if (data.categories) this.state.categories = data.categories;
    if (data.subheaders) this.state.subheaders = data.subheaders;
    if (data.catalog) this.state.catalog = data.catalog;
    if (data.projects) this.state.projects = data.projects;
    this.state.activeId = Object.keys(this.state.projects)[0] || null;
    this.persistAll();
  },

  exportProject(id) {
    const p = this.state.projects[id];
    return {
      exportedAt: new Date().toISOString(),
      project: p,
      catalog: this.state.catalog,
      categories: this.state.categories,
      subheaders: this.state.subheaders,
    };
  },

  importProject(data) {
    const p = data.project;
    if (!p) return null;
    p.id = uid("proj");
    this.state.projects[p.id] = p;
    // merg ontbrekende catalogusitems mee, zodat prijzen kloppen
    if (Array.isArray(data.catalog)) {
      const existingCodes = new Set(this.state.catalog.map(i => i.code));
      data.catalog.forEach(item => {
        if (!existingCodes.has(item.code)) this.state.catalog.push(item);
      });
    }
    this.persistAll();
    return p;
  },
};

// ---------- berekeningen ----------
const Calc = {
  finishingFactor(level) {
    return (FINISHING_LEVELS[level] || FINISHING_LEVELS.medium).factor;
  },

  effectiveUnitPrice(line, project) {
    if (line.priceOverride != null && line.priceOverride !== "") {
      return Number(line.priceOverride);
    }
    const catalogItem = Store.catalogItem(line.code);
    const base = catalogItem ? catalogItem.price : 0;
    return base * Calc.finishingFactor(project.finishingLevel);
  },

  lineTotal(line, project) {
    return (Number(line.quantity) || 0) * Calc.effectiveUnitPrice(line, project);
  },

  projectTotal(project) {
    return project.lines.reduce((sum, l) => sum + Calc.lineTotal(l, project), 0);
  },

  totalsBySubheader(project) {
    const totals = {};
    project.lines.forEach(l => {
      totals[l.subheader] = (totals[l.subheader] || 0) + Calc.lineTotal(l, project);
    });
    return totals;
  },

  totalsByCategory(project) {
    const bySub = Calc.totalsBySubheader(project);
    const totals = {};
    Object.entries(bySub).forEach(([subCode, amount]) => {
      const sh = Store.state.subheaders.find(s => s.code === subCode);
      const catCode = sh ? sh.category : "??";
      totals[catCode] = (totals[catCode] || 0) + amount;
    });
    return totals;
  },
};

const fmtEUR = (n) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

const fmtEUR2 = (n) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n || 0);

const fmtNum = (n) => new Intl.NumberFormat("nl-NL").format(n || 0);

const fmtPct = (n) => new Intl.NumberFormat("nl-NL", { style: "percent", maximumFractionDigits: 1 }).format(n || 0);
