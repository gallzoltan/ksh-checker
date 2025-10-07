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
- `js/` könyvtár - Szeparált JavaScript modulok
- Bootstrap 5-öt használ a UI stílusokhoz
- PapaParse library-t használ CSV feldolgozáshoz
- **Nincs szükség szerverre** - működik `file://` protokollal is
- Nincs szükség build folyamatra vagy package kezelésre

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

**Alkalmazás futtatása:**
Nyisd meg az `index.html` fájlt közvetlenül böngészőben - nincs szükség szerverre (működik `file://` protokollal).

**Változtatások tesztelése:**
1. Szerkeszd a megfelelő fájlt (`index.html` vagy `js/*.js`)
2. Frissítsd a böngészőt
3. Szükség esetén töröld a localStorage-t: DevTools → Application → Local Storage → Clear

**Önkormányzati adatok frissítése:**
1. Cseréld ki a CSV fájlt a `db/` könyvtárban
2. Futtasd: `node embed-csv.js` (ez frissíti a `js/data.js` fájlt)
3. Frissítsd a böngészőt

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
