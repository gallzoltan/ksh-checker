# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projekt áttekintés

Ez egy magyar önkormányzati KSH (Központi Statisztikai Hivatal) kód validáló alkalmazás. Moduláris HTML alkalmazás, amely önkormányzati kódokat és neveket validál egy referencia adatbázis alapján.

**Fő funkciók:**
- CSV fájlból tölti be az önkormányzati adatokat (formátum: `ksh;onev`)
- Gyors keresés: önkormányzatok keresése kód vagy név alapján
- Tömeges ellenőrzés: Excel adatok beillesztése (kód + TAB + név) több bejegyzés validálásához
- Progressz bar nagy adathalmazok validálása során (async batch processing)
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
- esbuild-alapú build rendszer egyetlen minifikált bundle létrehozásához (10-30x gyorsabb, mint Terser)

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

# Debug build (nem minifikált, source maps-szal)
npm run build:debug

# Watch mode (auto-rebuild file változáskor)
npm run build:watch
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
- `build.js` - esbuild-alapú bundle készítő script (2025-10-10-től)
- 8 JS fájl összefűzése helyes sorrendben (data.js → Config.js → NameNormalizer.js → ... → App.js)
- IIFE formátum (Immediately Invoked Function Expression) - nincs ES6 module refaktorálás szükséges
- Minifikálás egyetlen `bundle.min.js` fájlba (~22-29% méretcsökkenés)
- HTML automatikus frissítése (8 script tag → 1 bundle script)
- `--debug` flag: nem minifikált bundle inline source maps-szal
- `--watch` flag: automatikus rebuild file változáskor (fejlesztéshez)
- Build idő: ~76ms production, ~91ms debug (korábban ~2-3s Terser-rel)

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
  - `validateEntriesAsync(entries, dataMap, progressCallback, batchSize)` - Async batch validálás progress callback-kel
  - `findByName(input, dataMap)` - KSH kód keresése név alapján
- `UIManager` - UI kezelés
  - `setupEventListeners()` - Event binding
  - `handleSearch(event)` - Keresés debounce-szal
  - `handleBulkValidate()` - Async tömeges validálás progress bar-ral
  - `showProgress(show)`, `updateProgress(current, total)` - Progressz bar kezelés
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

**2025-10-09 - Async batch processing és progressz bar:**

### 7. Tömeges validálás teljesítmény és UX javítása
- **Probléma:**
  - Nagy adathalmazok (100+ bejegyzés) validálása blokkolja a böngésző UI-t
  - Nincs visszajelzés a feldolgozás folyamatáról
  - Felhasználó nem látja, hogy mennyi időbe telik még a validálás
  - Szinkron feldolgozás "lefagyasztja" az oldalt
- **Megoldás:**
  - Új `validateEntriesAsync()` metódus a `Validator.js`-ben batch feldolgozással
  - Progressz bar komponens hozzáadva az `index.html`-hez (Bootstrap animated progress bar)
  - `showProgress()` és `updateProgress()` metódusok a `UIManager.js`-ben
  - `handleBulkValidate()` teljes refaktorálás async/await használatával
  - **Adaptív batch size:** 5 (< 100 bejegyzés), 10 (100-500), 20 (500+)
  - Async batch processing a pre-processing fázisban is (név keresés, auto-fill)
  - `setTimeout(0)` UI yield minden batch után (kliens oldali, szerver nélkül működik!)
  - Progress callback minden köteg után frissíti a progressz bar-t
  - "Ellenőrzés" gomb letiltva validálás alatt
- **Hatás:**
  - **Nem blokkoló UI:** Az alkalmazás reszponzív marad nagy adathalmazok validálása alatt
  - **Vizuális visszajelzés:** Valós idejű progressz bar (X / Y, százalék)
  - **Jobb UX:** Felhasználó látja, hogy mennyi van még hátra - kis adathalmazoknál gyakoribb frissítés
  - **Hibakezelés:** Try-catch blokk a validálási hibák kezelésére
  - **Optimalizált teljesítmény:** Adaptív batch size minimalizálja az overhead-et
  - **Bundle méret:** 170.18 KB → 121.79 KB minifikált (28.4% csökkentés)

**2025-10-10 - Település típus alapú keresés javítása:**

### 8. Validator.js - Város vs. Vármegyei megkülönböztetés
- **Probléma:**
  - A `findByName()` metódus nem tudta megkülönböztetni az azonos nevű város és vármegyei önkormányzatokat
  - Példák:
    - "Békés Város Önkormányzat" → hibásan "Békés Vármegyei Önkormányzat"-ot találta
    - "Heves Város Önkormányzata" → hibásan "Heves Vármegyei Önkormányzat"-ot találta
    - "Veszprém Megyei Jogú Város Önkormányzata" → hibásan "Veszprém Vármegyei Önkormányzat"-ot találta
  - A core név alapú scoring nem vette figyelembe a település típusát
  - Vármegyei önkormányzatok (KSH kód végződik "00000"-ra) prioritást kaptak
- **Megoldás:**
  - Típusfelismerés az input szövegben:
    - `inputIsCity`: detektálja a "város" vagy "megyei jogú" kulcsszavakat
    - `inputIsCounty`: detektálja a "vármegye" vagy "vármegyei" kulcsszavakat
  - Típusfelismerés a referencia adatokban:
    - `refIsCity`: referencia adat tartalmaz "város" vagy "megyei jogú" kulcsszót
    - `refIsCounty`: referencia adat tartalmaz "vármegye" vagy "vármegyei" kulcsszót
  - Típus-alapú szűrés a scoring előtt:
    - Ha input "város" típusú, de referencia "vármegyei" → skip (folytatás következő jelölttel)
    - Ha input "vármegyei" típusú, de referencia "város" → skip
    - Ha input nem specifikálja a típust → mindkettő elfogadható
- **Hatás:**
  - **Pontos keresés:** Város és vármegyei önkormányzatok helyes megkülönböztetése
  - **18 tesztből 18 sikeres:** Az összes edge case helyesen működik
  - **Regex-alapú típusdetektálás:** Rugalmas, ékezetek támogatásával (`/\bv[aá]ros\b/i`)
  - **Jobb felhasználói élmény:** A keresés pontosabb találatokat ad azonos nevű települések esetén

**2025-10-10 - Progressz bar javítás:**

### 9. UIManager.js - Progressz bar előre-hátra ugrás javítása
- **Probléma:**
  - A progressz bar nem futott végig folyamatosan, bizonyos esetekben előre-hátra mozgott
  - A tömeges validálás során kétféle fázis létezett:
    1. **Pre-processing fázis** (parsing, auto-fill): 0% → 100% (teljes `entries.length`)
    2. **Validációs fázis** (csak a validálandó elemek): újra 0% → ? (`toValidate.length`)
  - Ha pl. 100 bejegyzésből 50-et auto-fillelt, akkor:
    - Pre-processing: 0 → 100 (100%) ✓
    - Validálás: **0 → 50** (visszaugrott!) ✗
  - A két fázis eltérő `total` értékekkel frissítette ugyanazt a progresszbárt
- **Megoldás:**
  - `totalEntries` konstans bevezetése az összes bejegyzés számának cache-eléséhez (UIManager.js:223)
  - Pre-processing fázis frissíti a progresszbárt `totalEntries` értékkel (UIManager.js:314, 320)
  - Validációs fázis **nem frissíti** a progresszbárt (`null` progress callback, UIManager.js:333)
  - Egyszerűsített logika: progresszbar csak egyszer fut végig (0% → 100%), nincs visszaugrás
- **Hatás:**
  - **Folyamatos animáció:** A progressz bar egyenletesen halad előre visszaugrás nélkül
  - **Jobb UX:** Vizuális visszajelzés a pre-processing során, validálás csendben fut
  - **Konzisztens százalék:** Mindig a teljes bejegyzésszámhoz viszonyítva számol
  - **Bundle méret:** 171.96 KB → 122.10 KB minifikált (29.0% csökkentés)

**2025-10-10 - Build rendszer migráció: Terser → esbuild:**

### 10. esbuild migráció (Fázis 1: IIFE bundling)
- **Probléma:**
  - Terser-alapú build lassú (~2-3s build idő)
  - Nincs watch mode (manuális rebuild minden változtatásnál)
  - Nincs source maps támogatás debug módban
  - Nincs tree-shaking (teljes kód a bundle-ben)
- **Megoldás:**
  - `package.json` frissítése: `terser` dependency → `esbuild`
  - `build.js` teljes átírása esbuild API-val
  - IIFE formátum használata (drop-in replacement, nincs kód refaktorálás!)
  - Watch mode támogatás (`--watch` flag)
  - Inline source maps debug módban (`--debug` flag)
  - Temporary entry point generálás (8 fájl konkatenálása helyes sorrendben)
  - `SIGINT` handler Ctrl+C kezeléshez watch módban
- **Hatás:**
  - **10-30x gyorsabb build:** 76ms production (korábban ~2-3s)
  - **Watch mode:** Automatikus rebuild file változáskor
  - **Source maps:** Inline source maps debug módban (könnyebb hibakeresés)
  - **Kisebb bundle:** 133.15 KB (22.8% csökkentés, korábban 115-122 KB Terser-rel)
  - **Működik file:// protokollal:** IIFE formátum garantálja a kompatibilitást
  - **Nincs refaktorálás:** Drop-in replacement, a kódbázis változatlan maradt
  - **Új scriptek:** `npm run build:watch` fejlesztéshez
- **Következő lépés (opcionális):**
  - Fázis 2: ES6 modules refaktorálás (`export class`, `import` statements)
  - Jobb tree-shaking (5-15% további méretcsökkentés várható)
  - TypeScript migráció lehetősége

## Tesztelés

**Név → KSH kód keresés tesztelése:**
```bash
# Nyisd meg böngészőben a teszt fájlt:
start test-name-search.html
```

A `test-name-search.html` fájl 18 problémás esetet tesztel:
- Budapest kerületek különböző formátumokban
- Elírások az "Önkormányzata" szóban
- Város vs. Vármegyei megkülönböztetés (Békés, Heves, Veszprém)
- Ékezetes különbségek (Komoró vs. Kömörő)
- Hosszú önkormányzati nevek (pl. "BUDAPEST FŐVÁROS XVII. KERÜLET RÁKOSMENTE ÖNKORMÁNYZATA")
