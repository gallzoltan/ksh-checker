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
- Natív JSON feldolgozás (nincs külső CSV library dependency)
- **Nincs szükség szerverre** - működik `file://` protokollal is
- Terser-alapú build rendszer egyetlen minifikált bundle létrehozásához

**JavaScript modulok (`js/` könyvtár) - OOP struktúra:**
- `data.js` - Beágyazott JSON adat (auto-generált a `convert-csv-to-json.js` által)
- `Config.js` - Static configuration class (konstansok, regex map-ek)
- `NameNormalizer.js` - Települési nevek normalizálása és összehasonlítása osztály
- `CacheManager.js` - localStorage kezelés osztály (load/save/isValid)
- `DataProcessor.js` - JSON feldolgozás és Map építés osztály
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
# CSV → JSON konverzió és beágyazás a js/data.js fájlba
npm run embed

# Ezután futtass build-et a dist frissítéséhez
npm run build

# (Opcionális) Ha közvetlenül CSV formátumot szeretnél beágyazni
npm run embed:csv
```

**Build rendszer részletei:**
- `build.js` - Terser-alapú bundle készítő script
- 8 JS fájl összefűzése helyes sorrendben (data.js → Config.js → NameNormalizer.js → ... → App.js)
- Minifikálás egyetlen `bundle.min.js` fájlba (~26-27% méretcsökkenés)
- HTML automatikus frissítése (8 script tag → 1 bundle script)
- `--debug` flag: nem minifikált bundle hibakereséshez

**JavaScript módosítások (OOP struktúra):**
- `Config.js` - Static konstansok, cache időtartam, regex pattern-ek
- `NameNormalizer.js` - Települési nevek normalizálása, összehasonlítása, hasonlóság számítás
- `Validator.js` - Validációs szabályok, fuzzy matching algoritmus (NameNormalizer-t használja)
- `UIManager.js` - UI logika, megjelenítés, interakciók, DOM műveletek
- `DataProcessor.js` - CSV feldolgozás, Map kezelés (NameNormalizer-t használja)
- `CacheManager.js` - localStorage műveletek
- `App.js` - Dependency injection, alkalmazás orchestration

## Kód szervezés

**Fő osztályok és metódusok:**
- `Config` - Static configuration class
  - `CACHE_DURATION`, `STORAGE_KEY`, `SEARCH_DEBOUNCE_MS`, `MAX_SEARCH_RESULTS`
  - `IGNORED_WORDS_REGEX`, `ROMAN_REGEX_MAP`
- `NameNormalizer` - Települési nevek normalizálása és összehasonlítása
  - `normalize(text)` - Szöveg normalizálás ékezetek eltávolításával
  - `removeAccents(text)` - Magyar ékezetek eltávolítása
  - `parse(name)` - Település nevének parsolása (név, típus, normalizált formák)
  - `areEqual(name1, name2)` - Két név összehasonlítása (ékezetek nélkül)
  - `areEqualWithAccents(name1, name2)` - Összehasonlítás ékezetekkel
  - `smartMatch(name1, name2, threshold)` - Intelligens egyezés hasonlóság alapján
  - `similarity(name1, name2)` - Hasonlóság számítás (Levenshtein távolság)
  - `levenshteinDistance(str1, str2)` - Levenshtein távolság számítás
- `CacheManager` - localStorage kezelés
  - `load()`, `save(dataMap)`, `isValid()`, `clear()`
- `DataProcessor` - JSON/CSV feldolgozás
  - `processData(data)` - JSON/CSV → Map konverzió (NameNormalizer-t használja)
  - `loadDefaultJSON()` - Beágyazott JSON betöltése (natív)
  - `loadFromFile(file)` - File input kezelés (CSV, PapaParse-szal)
  - `loadData(cacheManager)` - Cache-ből vagy JSON-ből
- `Validator` - Validációs logika
  - `normalizeText(text)` - Szöveg normalizálás (NameNormalizer-t használja)
  - `extractCoreName(text)` - Core név kinyerés
  - `fuzzyMatchNames(input, referenceData)` - Fuzzy matching (NameNormalizer-t használja)
  - `validateEntry(ksh, onev, dataMap)` - Egy bejegyzés validálása
  - `findByName(input, dataMap)` - KSH kód keresése név alapján
- `UIManager` - UI kezelés
  - `setupEventListeners()` - Event binding
  - `handleSearch(event)` - Keresés debounce-szal
  - `handleBulkValidate()` - Tömeges validálás
  - `displaySearchResults()`, `displayBulkResults()` - Megjelenítés
  - `handleExport()` - CSV export
- `App` - Fő alkalmazás
  - `constructor()` - Dependency injection (NameNormalizer létrehozása)
  - `init()` - Alkalmazás inicializálás

**Adatfolyam (OOP):**
1. DOMContentLoaded → `App` példány létrehozása
2. `app.init()` → event listeners setup
3. `dataProcessor.loadData(cacheManager)` → cache vagy JSON betöltés
4. Cache hit: `cacheManager.load()` → Map visszaállítás
5. Cache miss: `dataProcessor.loadDefaultJSON()` → natív JSON parse → `processData()` → `cacheManager.save()`
6. `uiManager.showMainContent()` → UI megjelenítése
7. User interakció → `uiManager` event handlerek → `validator` metódusok
8. Eredmények megjelenítése színkódolással (zöld=helyes, sárga=figyelmeztető, piros=hibás)

## Optimalizációk

**2025-10-08 - CSV → JSON adatformátum átalakítás:**

### 5. Adatformátum váltás: CSV → JSON
- **Probléma:**
  - CSV string parsing PapaParse library-vel (47 KB CDN dependency)
  - Külső dependency a CSV feldolgozáshoz
  - Lassabb parse idő (~50ms vs ~10ms)
- **Megoldás:**
  - Új `convert-csv-to-json.js` script a CSV → JSON konverzióhoz
  - `data.js` átírása JSON array formátumra (`EMBEDDED_JSON_DATA`)
  - `DataProcessor.js` refaktorálás: `loadDefaultJSON()` natív `JSON.parse()` használattal
  - PapaParse CDN link eltávolítása az `index.html`-ből
  - `package.json` `embed` script frissítése
- **Hatás:**
  - **PapaParse CDN (47 KB) megszűnt** → nettó hálózati megtakarítás: ~9 KB
  - Bundle méret növekedés: 94 KB → 144 KB (JSON verbose miatt)
  - Minifikált: 77 KB → 115 KB (de nincs külső CDN!)
  - ~80% gyorsabb parse idő
  - Egyszerűbb kód, kevesebb dependency
  - Gyorsabb alkalmazás inicializálás

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

**2025-10-09 - NameNormalizer osztály integráció:**

### 6. NameNormalizer osztály bevezetése
- **Probléma:**
  - Települési nevek normalizálása és összehasonlítása szétszórva volt a `Validator.js`-ben
  - Kevésbé átlátható ékezet-kezelés (NFD normalize használata)
  - Hiányzott a dedikált települési név parsing (típusok, core nevek)
  - Levenshtein távolság alapú hasonlóság számítás nem volt implementálva
- **Megoldás:**
  - Új `NameNormalizer.js` osztály létrehozása dedikált név normalizációhoz
  - Magyar ékezetek explicit kezelése (accentMap)
  - Települési nevek intelligens parsolása (típusok felismerése: község, város, kerület, stb.)
  - Levenshtein távolság alapú hasonlóság számítás implementálása
  - `smartMatch()` metódus intelligens név összehasonlításhoz
  - Dependency injection: `App.js` → `Validator.js` és `DataProcessor.js`
  - Build rendszer frissítése: 8 JS modul (NameNormalizer.js hozzáadva)
- **Hatás:**
  - **Tisztább architektúra:** Települési név kezelés elkülönítve dedikált osztályba
  - **Jobb validáció:** Intelligens név összehasonlítás hasonlóság küszöbértékkel (95%)
  - **Ékezet-kezelés:** Explicit magyar ékezet map, pontosabb normalizálás
  - **Bővíthetőség:** Könnyebb települési név típusok bővítése (municipalityTypes)
  - **Bundle méret:** 164.91 KB → 120.73 KB minifikált (26.8% csökkentés)
  - **Teljesítmény:** Gyorsabb név validáció pre-parsed adatokkal
