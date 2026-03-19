# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projekt áttekintés

Magyar önkormányzati KSH (Központi Statisztikai Hivatal) kód validáló alkalmazás. Önkormányzati kódokat és neveket validál egy referencia adatbázis alapján.

**Fő funkciók:**
- Beágyazott JSON adatok (auto-generált a CSV fájlból, nincs runtime CSV parsing)
- Gyors keresés kód vagy név alapján
- Tömeges ellenőrzés: Excel adatok beillesztése (kód + TAB + név)
- Async batch processing progressz bar-ral nagy adathalmazokhoz
- Validációs eredmények exportálása CSV formátumban
- Kliens oldali cache localStorage-ban (24 órás időtartam)

## Architektúra

**Fájlstruktúra:**
- `index.html` - HTML struktúra és CSS stílusok
- `js/` - JavaScript modulok (fejlesztéshez)
- `dist/` - Build kimenet (`dist/index.html` + `dist/js/bundle.min.js`)
- `db/t_onkorm_tech_20251006.csv` - Referencia adatok (`"ksh";"onev"` formátum)
- Bootstrap 5, nincs szerver szükséges (`file://` protokollal is működik)

**JavaScript modulok - betöltési sorrend:**
1. `data.js` - Beágyazott JSON adat (auto-generált)
2. `Config.js` - Static konfigurációs osztály (konstansok, regex map-ek)
3. `NameNormalizer.js` - Települési nevek normalizálása, hasonlóság számítás
4. `CacheManager.js` - localStorage kezelés
5. `DataProcessor.js` - JSON feldolgozás, Map és reverse indexek építése
6. `Validator.js` - Validáció, fuzzy matching, KSH keresés
7. `UIManager.js` - DOM manipuláció, event handling, toast-ok
8. `App.js` - Dependency injection, alkalmazás inicializálás

**Adatstruktúra:**
- `dataMap`: `Map<ksh, {original, lower, kshLower, normalized, core, isCity, isCounty}>`
- Reverse indexek: `lowerIndex`, `normalizedIndex`, `nameIndex` (O(1) gyors keresés)
- Cache betöltés után `rebuildIndexes()` kötelező (különben a reverse indexek üresek!)

**Kritikus implementációs részletek:**
- Budapest kerületek: `extractCoreName()` regex-szel nyeri ki a római számot, a `findByName()` kihagyja a fast-path-eket és a `nameIndex`-et használja
- Város vs. Vármegye: típus-alapú szűrés a `findByName()` scoring előtt
- Cache verzió: `Config.CACHE_VERSION = '3.0'` - változtatáskor bumpolni kell
- Build: IIFE formátum (nem ES6 module) - `file://` kompatibilitás miatt

## Fejlesztés

**Fejlesztői workflow:**
```bash
# Fejlesztés: index.html közvetlen megnyitása böngészőben, nincs build szükséges

npm install          # első alkalommal
npm run build        # production bundle (dist/)
npm run build:debug  # nem minifikált, source maps-szal
npm run build:watch  # auto-rebuild file változáskor
npm run embed        # CSV → JSON konverzió → js/data.js frissítése
npm run build        # embed után kötelező!
```

## Kód szervezés

**Főbb metódusok:**
- `NameNormalizer`: `normalize()`, `removeAccents()`, `parse()`, `areEqual()`, `smartMatch()`, `similarity()`, `levenshteinDistance()`, `countAccentDifferences()`
- `CacheManager`: `load()`, `save(dataMap)`, `isValid()`, `clear()`
- `DataProcessor`: `processData()`, `loadDefaultJSON()`, `loadData(cacheManager)`, `rebuildIndexes()`
- `Validator`: `normalizeText()`, `extractCoreName()`, `fuzzyMatchNames()`, `validateEntry()`, `validateEntriesAsync()`, `findByName()`
- `UIManager`: `setupEventListeners()`, `handleSearch()`, `handleBulkValidate()`, `showProgress()`, `updateProgress()`, `displaySearchResults()`, `displayBulkResults()`, `handleExport()`, `showToast(message, type)`, `showLoading()`, `showMainContent()`
- `App`: `constructor()` (dependency injection), `init()`

**Adatfolyam:**
1. `App` példány → `init()` → event listeners
2. Cache hit: `cacheManager.load()` → `rebuildIndexes()`
3. Cache miss: `loadDefaultJSON()` → `processData()` → `cacheManager.save()`
4. User interakció → `uiManager` → `validator`
5. Eredmények: zöld=helyes, sárga=figyelmeztető, piros=hibás

## Tesztelés

**Minden változtatás után:**
1. `test-name-search.html` → Ellenőrizd: **22/22 sikeres**
2. (Opcionális) `test-performance.html` → Ellenőrizd: < 0.2ms/név
3. Manuális teszt: `index.html` (keresés, bulk validálás, export)

**Mit tesztel a `test-name-search.html`:**
- Budapest kerületek különböző formátumokban (főváros, kerületi nevek, rövidítések)
- Város vs. Vármegyei megkülönböztetés (Békés, Heves, Veszprém)
- Elírások, ékezetes különbségek, interpunkció

**Várt teljesítmény:** 100 név ~5-10ms, 1000 név ~50-100ms
