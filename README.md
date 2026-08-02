# Edwin's Budgettool

Professionele, webgebaseerde budgettool voor interieur- en verbouwingsprojecten —
de opvolger van een bestaande Excel-budgettool.

**Live app:** wordt automatisch gepubliceerd via GitHub Pages zodra deze repository
Pages inschakelt (Settings → Pages → Source: *GitHub Actions*). Na de eerste
succesvolle deploy is de tool bereikbaar op:

`https://edwindw00.github.io/DreSo-Budgettool/`

## Wat kan de tool

- **Installeerbaar als app (PWA)**: open de site in Chrome of Edge en klik op
  "App installeren" (rechtsboven, verschijnt zodra de browser dit toestaat) — of gebruik
  het installatie-icoon in de adresbalk. Je krijgt dan een los venster met eigen
  app-icoon op je bureaublad/startmenu, en de tool blijft daarna ook **offline**
  werken (een service worker cachet de volledige applicatie; je projectdata stond
  toch al alleen lokaal in de browser).
- **Meertalig**: Nederlands (standaard), Engels, Duits, Frans, Russisch, Thai en Arabisch
  (met rechts-naar-links-opmaak), te kiezen via het taalmenu rechtsboven. Vertaald is de
  interface (knoppen, labels, meldingen); categorieën, subcategorieën en
  catalogusomschrijvingen blijven bewust in het Engels, omdat dit vaktermen uit de
  bouw-/inrichtingswereld zijn.
- **Budget-tabblad staat altijd volledig uitgeklapt**: alle standaard posten (89 items
  uit de catalogus, per hoofd- en subcategorie) staan al klaar — je vult alleen de
  hoeveelheid in. Per subcategorie kun je daarnaast losse, eigen (niet-standaard)
  items toevoegen. Eenheden zijn per regel aanpasbaar, en met één knop zet je alle
  hoeveelheden terug naar 0 (met bevestiging).
- **Projectkengetallen**: vloeroppervlak, aantal werkplekken, headcount en aantal
  vergaderruimtes/-plekken invullen op het Dashboard. Vloeroppervlak, werkplekken en
  headcount kunnen per catalogusitem gekoppeld worden (tabblad Eenheidsprijzen) zodat
  de hoeveelheid van die regel automatisch meeschaalt — geen handmatig overtypen meer.
  Het Dashboard toont ook budget per m², per werkplek en per persoon.
- **Opmerkingen per budgetregel**: voeg een toelichting toe aan elke regel (bv. "klant
  wil natuursteen i.p.v. standaard") via het spraakbelletje-icoon — deze opmerkingen
  verschijnen ook in het rapport, als onderbouwing voor de klant.
- **Eenheidsprijzen centraal beheren en aanpassen** op het tabblad *Eenheidsprijzen* —
  wijzigingen werken direct door in elk project, tenzij een projectregel lokaal is
  overschreven.
- **Afwerkingsniveau** (Low -5% / Medium +0% / High +10%) dat automatisch op alle
  eenheidsprijzen wordt toegepast, net als in de Excel-tool. De percentages per niveau
  zijn zelf aan te passen op het tabblad Eenheidsprijzen (met reset naar standaard), en
  in het rapport kies je zelf welke niveaus getoond worden — één of meerdere naast
  elkaar, bijvoorbeeld om een klant een Low/Medium/High-vergelijking te geven.
- **Dashboard** met doelbudget vs. begrote uitgaven, resterend budget en verdeling per
  categorie (donutchart + staafdiagram).
- **Rapport** in een representatieve, professionele lay-out (cover met projectlogo,
  samenvatting met taartdiagram, detailtabellen per categorie inclusief opmerkingen) —
  met één klik te printen of als PDF op te slaan.
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

De categorieën, subcategorieën en standaard eenheidsprijzen zijn overgenomen uit een
bestaande Excel-budgettool. De rapportlay-out is geïnspireerd op het format van
budgetramingen zoals gebruikelijk in de bouw-/projectmanagementwereld, herontworpen
voor een professionelere, overzichtelijkere uitstraling.
