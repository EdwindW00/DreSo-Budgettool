# DreSo Budgettool

Professionele, webgebaseerde budgettool voor interieur- en verbouwingsprojecten van
Drees & Sommer — de opvolger van de Excel-budgettool (`aaDreSo Excel Budgettool.xlsx`).

**Live app:** wordt automatisch gepubliceerd via GitHub Pages zodra deze repository
Pages inschakelt (Settings → Pages → Source: *GitHub Actions*). Na de eerste
succesvolle deploy is de tool bereikbaar op:

`https://edwindw00.github.io/DreSo-Budgettool/`

## Wat kan de tool

- **Budget invullen** per hoofdcategorie (Construction costs, Installations, Joinery,
  Furniture, Inventory & decorations, Others, Consultancy costs, Contingency) en
  subcategorie, met regels uit een centrale eenheidsprijzencatalogus of eigen
  (aangepaste) regels.
- **Eenheidsprijzen centraal beheren en aanpassen** op het tabblad *Eenheidsprijzen* —
  wijzigingen werken direct door in elk project, tenzij een projectregel lokaal is
  overschreven.
- **Afwerkingsniveau** (Low -5% / Medium +0% / High +10%) dat automatisch op alle
  eenheidsprijzen wordt toegepast, net als in de Excel-tool.
- **Dashboard** met doelbudget vs. begrote uitgaven, resterend budget en verdeling per
  categorie (donutchart + staafdiagram).
- **Rapport** in een representatieve, professionele lay-out (cover, samenvatting,
  detailtabellen per categorie) — met één klik te printen of als PDF op te slaan.
- **Meerdere projecten** beheren, dupliceren, exporteren/importeren als JSON-bestand
  om te delen of te back-uppen.

## Techniek

Bewust een lichte, dependency-vrije webapp: puur HTML/CSS/JavaScript, geen
build-stap, geen server nodig. Gegevens worden lokaal in de browser opgeslagen
(`localStorage`). Daardoor is de tool overal te draaien: rechtstreeks via GitHub
Pages, of lokaal door `index.html` te openen of `serve.ps1` te draaien.

```
assets/
  css/styles.css      styling (incl. printvriendelijke rapportopmaak)
  js/data.js           standaard categorieën, subcategorieën & eenheidsprijzen
  js/store.js          opslag (localStorage) + berekeningen
  js/charts.js         lichte SVG-grafieken
  js/views.js           schermweergave per tabblad
  js/app.js            interactie/eventafhandeling
index.html
```

### Lokaal draaien

```powershell
pwsh -NoProfile -File serve.ps1 -Port 8791
```

en open `http://localhost:8791` in de browser.

## Herkomst

De categorieën, subcategorieën en standaard eenheidsprijzen zijn overgenomen uit de
bestaande `aaDreSo Excel Budgettool.xlsx`. De rapportlay-out is geïnspireerd op het
format van BCG Amsterdam Office budgetramingen, herontworpen voor een
professionelere, overzichtelijkere uitstraling.
