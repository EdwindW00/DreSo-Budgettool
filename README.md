# DreSo Budgettool

Professionele, webgebaseerde budgettool voor interieur- en verbouwingsprojecten van
Drees & Sommer — de opvolger van de Excel-budgettool (`aaDreSo Excel Budgettool.xlsx`).

**Live app:** wordt automatisch gepubliceerd via GitHub Pages zodra deze repository
Pages inschakelt (Settings → Pages → Source: *GitHub Actions*). Na de eerste
succesvolle deploy is de tool bereikbaar op:

`https://edwindw00.github.io/DreSo-Budgettool/`

## Wat kan de tool

- **Budget-tabblad staat altijd volledig uitgeklapt**: alle standaard posten (89 items
  uit de catalogus, per hoofd- en subcategorie) staan al klaar — je vult alleen de
  hoeveelheid in. Per subcategorie kun je daarnaast losse, eigen (niet-standaard)
  items toevoegen.
- **Eenheidsprijzen centraal beheren en aanpassen** op het tabblad *Eenheidsprijzen* —
  wijzigingen werken direct door in elk project, tenzij een projectregel lokaal is
  overschreven.
- **Afwerkingsniveau** (Low -5% / Medium +0% / High +10%) dat automatisch op alle
  eenheidsprijzen wordt toegepast, net als in de Excel-tool.
- **Dashboard** met doelbudget vs. begrote uitgaven, resterend budget en verdeling per
  categorie (donutchart + staafdiagram).
- **Rapport** in een representatieve, professionele lay-out (cover met projectlogo,
  samenvatting, detailtabellen per categorie) — met één klik te printen of als PDF op
  te slaan.
- **Logo / afbeelding per project**: te uploaden bij het aanmaken van een project of
  later via het tabblad Rapport; verschijnt op de coverpagina van het rapport.
- **Projectwachtwoord**: elk nieuw project vraagt een verplicht wachtwoord dat
  Dashboard, Budget en Rapport van dat project vergrendelt. Wachtwoorden zijn altijd
  in te zien of te wijzigen door de beheerder via het tabblad *Projecten* (dus nooit
  definitief kwijt). Dit is een eenvoudige toegangsgrendel voor per ongeluk aanpassen
  door collega's, **geen echte beveiliging** — de data staat client-side in de browser
  van de gebruiker, en wachtwoorden worden bewust *niet* automatisch naar deze
  (publieke) GitHub-repository gestuurd. Zie "Wachtwoorden & GitHub" hieronder.
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

## Wachtwoorden & GitHub

Projectwachtwoorden worden in leesbare tekst opgeslagen (bewust, zodat de beheerder
ze kan terugvinden) — maar alléén lokaal in `localStorage` van de browser van de
gebruiker. Er is expliciet géén automatische koppeling gebouwd die wachtwoorden naar
deze GitHub-repository stuurt: dat zou een GitHub-token met schrijfrechten in de
publiek toegankelijke websitecode vereisen, waarmee iedere bezoeker van de site dat
token uit de broncode zou kunnen halen en volledige schrijftoegang tot deze
repository zou krijgen. Dat risico wegen we zwaarder dan het gemak.

Wil je toch een kopie van alle wachtwoorden buiten de browser bewaren (bijv. omdat
een collega zijn/haar browserdata kwijtraakt)? Gebruik de knop **"Volledige back-up
exporteren"** op het tabblad Projecten — dat JSON-bestand bevat alle projectdata
inclusief wachtwoorden in leesbare tekst. Voeg dat bestand handmatig toe aan deze
repository (of vraag dat te doen) als je een centraal recovery-punt wilt. Let op: deze
repository is **publiek**, dus behandel deze wachtwoorden als eenvoudige PIN-codes,
niet als echte geheimen.

## Herkomst

De categorieën, subcategorieën en standaard eenheidsprijzen zijn overgenomen uit de
bestaande `aaDreSo Excel Budgettool.xlsx`. De rapportlay-out is geïnspireerd op het
format van BCG Amsterdam Office budgetramingen, herontworpen voor een
professionelere, overzichtelijkere uitstraling.
