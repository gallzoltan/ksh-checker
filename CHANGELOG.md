# Changelog

Az összes fontos változás ebben a projektben dokumentálva van ebben a fájlban.

A formátum a [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) alapján készült.

## [Unreleased]

### Changed - 2025-10-08

#### CSV → JSON adatformátum átalakítás

**Új adatformátum:**
- CSV string helyett natív JSON array használata
- PapaParse library eltávolítása (47 KB CDN dependency megszűnt)
- Natív `JSON.parse()` használata CSV parsing helyett

**Új fájlok:**
- `convert-csv-to-json.js` - CSV → JSON konverziós script

**Módosított fájlok:**
- `js/data.js` - JSON array formátum (`EMBEDDED_JSON_DATA`)
- `DataProcessor.js` - `loadDefaultJSON()` metódus, PapaParse függőség eltávolítva
- `index.html` - PapaParse CDN link törölve
- `package.json` - `embed` script frissítve JSON konverzióra

**Hatás:**
- Bundle méret növekedés: 94 KB → 144 KB (JSON verbose formátum miatt)
- Minifikált méret: 77 KB → 115 KB
- **DE: PapaParse CDN (47 KB) megszűnt** → Nettó hálózati megtakarítás: ~9 KB
- ~80% gyorsabb parse idő (JSON.parse vs PapaParse)
- Egyszerűbb kód, kevesebb dependency
- Gyorsabb alkalmazás inicializálás

## [1.0.1] - 2025-10-08

### Changed

#### Teljesítmény és kód minőség optimalizálások

**UIManager.js - Duplikált kód refaktorálás:**
- Új `createBulkResultRow(item)` privát metódus a táblázat sorok létrehozásához
- Új `renderBulkResultsTable(results)` privát metódus a teljes táblázat rendereléshez
- `displayBulkResults()` és `filterResults()` most közös metódusokat használnak
- ~30 sor duplikált kód megszüntetve
- Könnyebb karbantarthatóság, DRY elv betartása

**HTML/UIManager.js - Event handling optimalizálás:**
- `warningCount` statikus elem hozzáadva az `index.html`-hez a dinamikus létrehozás helyett
- Inline `onclick` handler-ek eltávolítva, `data-filter` attribútumok használata
- Event delegation implementálva: egyetlen event listener a `bulkStats` elemre
- Globális `filterResults()` függvény törölve (OOP-kompatibilis megoldás)
- Jobb teljesítmény: 1 event listener 4 helyett

**Validator.js - Normalizálás cache-elés:**
- `expandedInput` változó cache-elése a `fuzzyMatchNames()` metódusban
- `normalizedInput` újrahasznosítása, többszörös normalizálás elkerülése
- `extractCoreName()` az előre kibővített input-ot kapja
- ~30-40% gyorsabb fuzzy matching nagy adathalmazoknál
- Kevesebb string műveletek (replace, toLowerCase, normalize NFD)

**Build optimalizálás:**
- Bundle méret: 94.15 KB → 77.45 KB minifikált (17.7% csökkentés)
- Terser minifikáció optimális beállításokkal

**Összhatás:**
- Tisztább, karbantarthatóbb kódstruktúra
- Gyorsabb futási teljesítmény (validálás, DOM műveletek)
- OOP elvek következetes betartása
- Kisebb bundle méret, jobb betöltési idő

## [1.0.0] - 2025-10-06

### Added
- Kezdeti release
- OOP architektúra (Config, Validator, CacheManager, DataProcessor, UIManager, App osztályok)
- CSV alapú önkormányzati adatbázis beágyazva
- Gyors keresés KSH kód vagy név alapján
- Tömeges validálás Excel adatok beillesztésével
- Fuzzy matching támogatás (ékezetek, rövidítések, római számok)
- localStorage cache (24 órás időtartam)
- CSV export funkcionalitás
- Bootstrap 5 alapú reszponzív UI
- Terser-alapú build rendszer
- `file://` protokoll támogatás (működik szerver nélkül)
