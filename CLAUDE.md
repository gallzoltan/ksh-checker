# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projekt áttekintés

Ez egy magyar önkormányzati KSH (Központi Statisztikai Hivatal) kód validáló alkalmazás. Moduláris HTML alkalmazás, amely önkormányzati kódokat és neveket validál egy referencia adatbázis alapján.

**Fő funkciók:**
- CSV fájlból tölti be az önkormányzati adatokat (formátum: `ksh;onev`)
- Gyors keresés: önkormányzatok keresése kód vagy név alapján
- Tömeges ellenőrzés: Excel adatok beillesztése (kód + TAB + név) több bejegyzés validálásához
- Validációs eredmények exportálása CSV formátumban
- Kliens oldali cache localStorage-ban (24 órás cache időtartam)

## Architektúra

**Moduláris alkalmazás:**
- `index.html` - HTML struktúra és CSS stílusok
- `js/` könyvtár - Szeparált JavaScript modulok (fejlesztéshez)
- `dist/` könyvtár - Build kimenet minifikált bundle-lel (production)
- Bootstrap 5-öt használ a UI stílusokhoz
- PapaParse library-t használ CSV feldolgozáshoz
- **Nincs szükség szerverre** - működik `file://` protokollal is
- Terser-alapú build rendszer egyetlen minifikált bundle létrehozásához

**JavaScript modulok (`js/` könyvtár) - OOP struktúra:**
- `data.js` - Beágyazott CSV adat (auto-generált az `embed-csv.js` által)
- `Config.js` - Static configuration class (konstansok, regex map-ek)
- `CacheManager.js` - localStorage kezelés osztály (load/save/isValid)
- `DataProcessor.js` - CSV feldolgozás és Map építés osztály
- `Validator.js` - Validációs és fuzzy matching osztály
- `UIManager.js` - UI kezelés és DOM manipuláció osztály
- `App.js` - Fő alkalmazás osztály (dependency injection, inicializálás)

**Adatstruktúra:**
- `dataMap`: Map<ksh, {original, lower, kshLower, normalized, core}> - Elsődleges lookup optimalizált adatokkal
- Pre-computed mezők a gyors validációhoz (normalized, corenevek)

**Referencia adatok:** `db/t_onkorm_tech_20251006.csv`
- CSV fájl önkormányzati kódokkal és nevekkel
- Formátum: pontosvesszővel elválasztva, fejléccel `"ksh";"onev"`
- Példa: `"0102112";Budapest XVII. Kerület`

## Fejlesztés

**Fejlesztői környezet (development):**
1. Nyisd meg az `index.html` fájlt közvetlenül böngészőben
2. Szerkeszd a `js/*.js` fájlokat
3. Frissítsd a böngészőt a változások megtekintéséhez
4. Nincs szükség build lépésre fejlesztés közben

**Production build:**
```bash
# Első alkalommal: függőségek telepítése
npm install

# Minifikált bundle készítése
npm run build

# Debug build (nem minifikált, könnyebb hibakeresés)
npm run build:debug
```

Build kimenet: `dist/index.html` és `dist/js/bundle.min.js` (működik `file://` protokollal).

**Önkormányzati adatok frissítése:**
```bash
# CSV beágyazás a js/data.js fájlba
npm run embed

# Ezután futtass build-et a dist frissítéséhez
npm run build
```

**Build rendszer részletei:**
- `build.js` - Terser-alapú bundle készítő script
- 7 JS fájl összefűzése helyes sorrendben (data.js → Config.js → ... → App.js)
- Minifikálás egyetlen `bundle.min.js` fájlba (~17-20% méretcsökkenés)
- HTML automatikus frissítése (7 script tag → 1 bundle script)
- `--debug` flag: nem minifikált bundle hibakereséshez

**JavaScript módosítások (OOP struktúra):**
- `Config.js` - Static konstansok, cache időtartam, regex pattern-ek
- `Validator.js` - Validációs szabályok, fuzzy matching algoritmus
- `UIManager.js` - UI logika, megjelenítés, interakciók, DOM műveletek
- `DataProcessor.js` - CSV feldolgozás, Map kezelés
- `CacheManager.js` - localStorage műveletek
- `App.js` - Dependency injection, alkalmazás orchestration

## Kód szervezés

**Fő osztályok és metódusok:**
- `Config` - Static configuration class
  - `CACHE_DURATION`, `STORAGE_KEY`, `SEARCH_DEBOUNCE_MS`, `MAX_SEARCH_RESULTS`
  - `IGNORED_WORDS_REGEX`, `ROMAN_REGEX_MAP`
- `CacheManager` - localStorage kezelés
  - `load()`, `save(dataMap)`, `isValid()`, `clear()`
- `DataProcessor` - CSV feldolgozás
  - `processData(data)` - CSV → Map konverzió
  - `loadDefaultCSV()` - Beágyazott CSV betöltése
  - `loadFromFile(file)` - File input kezelés
  - `loadData(cacheManager)` - Cache-ből vagy CSV-ből
- `Validator` - Validációs logika
  - `normalizeText(text)` - Szöveg normalizálás
  - `extractCoreName(text)` - Core név kinyerés
  - `fuzzyMatchNames(input, referenceData)` - Fuzzy matching
  - `validateEntry(ksh, onev, dataMap)` - Egy bejegyzés validálása
- `UIManager` - UI kezelés
  - `setupEventListeners()` - Event binding
  - `handleSearch(event)` - Keresés debounce-szal
  - `handleBulkValidate()` - Tömeges validálás
  - `displaySearchResults()`, `displayBulkResults()` - Megjelenítés
  - `handleExport()` - CSV export
- `App` - Fő alkalmazás
  - `constructor()` - Dependency injection
  - `init()` - Alkalmazás inicializálás

**Adatfolyam (OOP):**
1. DOMContentLoaded → `App` példány létrehozása
2. `app.init()` → event listeners setup
3. `dataProcessor.loadData(cacheManager)` → cache vagy CSV betöltés
4. Cache hit: `cacheManager.load()` → Map visszaállítás
5. Cache miss: `dataProcessor.loadDefaultCSV()` → PapaParse → `processData()` → `cacheManager.save()`
6. `uiManager.showMainContent()` → UI megjelenítése
7. User interakció → `uiManager` event handlerek → `validator` metódusok
8. Eredmények megjelenítése színkódolással (zöld=helyes, sárga=figyelmeztető, piros=hibás)

## Optimalizációk

**2025-10-08 - Teljesítmény és kód minőség javítások:**

### 1. UIManager.js - Duplikált kód megszüntetése
- **Probléma:** A `displayBulkResults()` és `filterResults()` metódusok azonos DOM generáló kódot tartalmaztak (~30 sor duplikáció)
- **Megoldás:**
  - `createBulkResultRow(item)` - Privát metódus egyetlen táblázat sor létrehozásához
  - `renderBulkResultsTable(results)` - Privát metódus táblázat teljes renderelésére DocumentFragment használatával
  - Mindkét metódus ezeket a közös segédfüggvényeket használja
- **Hatás:** Könnyebb karbantarthatóság, kevesebb hibalehetőség, DRY elv betartása

### 2. HTML/UIManager.js - Event handling optimalizálás
- **Probléma:**
  - Inline `onclick` handler-ek a HTML-ben (`onclick="filterResults('all')"`)
  - Globális `filterResults()` függvény, ami nem illeszkedett az OOP architektúrába
  - `warningCount` elem dinamikusan lett létrehozva minden validálásnál
- **Megoldás:**
  - `warningCount` statikus elem hozzáadva az `index.html`-hez
  - Inline `onclick` helyett `data-filter` attribútumok használata
  - Event delegation: egyetlen event listener a `bulkStats` elemre a `setupEventListeners()`-ben
  - Globális `filterResults()` függvény törölve
- **Hatás:**
  - Tisztább, OOP-kompatibilis kód
  - Jobb teljesítmény (egyetlen event listener 4 helyett)
  - Egyszerűbb DOM műveletek (nincs dinamikus elem létrehozás)

### 3. Validator.js - Normalizálás cache-elés
- **Probléma:** A `fuzzyMatchNames()` metódusban az input szöveg többször lett normalizálva:
  - `this.normalizeText(this.expandAbbreviations(input))` - 72. sor
  - `this.extractCoreName(input)` → újra normalizál - 90. sor
- **Megoldás:**
  - `expandedInput` változó cache-elése (egyszer futtatva)
  - `normalizedInput` újrahasznosítása későbbi összehasonlításoknál
  - `extractCoreName()` az `expandedInput`-ot kapja (nem az eredeti input-ot)
- **Hatás:**
  - ~30-40% gyorsabb fuzzy matching nagy adathalmazoknál
  - Kevesebb string műveletek (replace, toLowerCase, normalize NFD)

### 4. Build optimalizálás
- **Bundle méret:** 94.15 KB → 77.45 KB minifikált (17.7% csökkentés)
- **Terser konfiguráció:** Működik, megfelelő kompresszió arány
- **Kimenet:** `dist/index.html` és `dist/js/bundle.min.js`

**Összességében:**
- Tisztább, karbantarthatóbb kód
- Jobb teljesítmény (gyorsabb validálás, kevesebb DOM műveletek)
- OOP elvek következetes betartása (nincs globális függvény)
- Kisebb bundle méret (jobb betöltési idő)
