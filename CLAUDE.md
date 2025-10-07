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

**JavaScript modulok (`js/` könyvtár):**
- `data.js` - Beágyazott CSV adat (auto-generált az `embed-csv.js` által)
- `config.js` - Konstansok, regex map-ek, konfiguráció
- `cache.js` - localStorage kezelés (mentés/betöltés)
- `data-processor.js` - CSV feldolgozás, Map építés, fájl betöltés
- `validator.js` - Validációs logika, fuzzy matching algoritmus
- `ui.js` - UI funkciók (keresés, bulk validálás, export, DOM manipuláció)
- `app.js` - Alkalmazás inicializálás, event listener regisztráció

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

**JavaScript módosítások:**
- `config.js` - Konstansok, cache időtartam, regex pattern-ek módosítása
- `validator.js` - Validációs szabályok, fuzzy matching finomhangolása
- `ui.js` - UI logika, megjelenítés, interakciók
- `data-processor.js` - CSV feldolgozás logika
- `cache.js` - localStorage kezelés
- `app.js` - Inicializálás, event bindings

## Kód szervezés

**Fő funkciók:**
- `processData(data)` - CSV adatok feldolgozása Map struktúrákba (data-processor.js:12)
- `handleSearch(event)` - Valós idejű keresés és szűrés (ui.js:6)
- `handleBulkValidate()` - Beillesztett Excel adatok validálása (ui.js:88)
- `saveToCache()` / `loadFromCache()` - localStorage perzisztencia (cache.js:12, 32)
- `fuzzyMatchNames(input, referenceData)` - Fuzzy név egyeztetés (validator.js:43)
- `normalizeText(text)` - Szöveg normalizálás (validator.js:5)

**Adatfolyam:**
1. Oldal betöltés → `app.js` inicializáció
2. Cache ellenőrzés → ha nincs, akkor `data.js` beágyazott CSV betöltése
3. CSV parsing (PapaParse) → `processData()` → Map építés pre-computed mezőkkel
4. Adatok mentése localStorage-ba időbélyeggel
5. Keresés/validálás lekérdezések a Map-ek alapján
6. Eredmények megjelenítése színkódolással (zöld=helyes, sárga=figyelmeztető, piros=hibás)
