# KSH Kód Ellenőrző

Magyar önkormányzati KSH (Központi Statisztikai Hivatal) kód validáló alkalmazás.

## 🚀 Gyors használat

### Fejlesztői verzió (development)
1. **Alkalmazás megnyitása:**
   - Dupla kattintás az `index.html` fájlon
   - Böngészőben megnyílik `file://` protokollal
   - **Nincs szükség szerverre!**

### Production verzió (minifikált)
1. **Build készítése:**
   ```bash
   npm install        # Első alkalommal
   npm run build      # Minifikált bundle (76ms ⚡)
   ```
2. **Alkalmazás futtatása:**
   - Nyisd meg a `dist/index.html` fájlt böngészőben
   - Minifikált JavaScript bundle (~22-29% kisebb)

### Használat
- **Gyors keresés tab:** Kód vagy név alapján keresés
- **Tömeges ellenőrzés tab:** Excel adatok beillesztése validáláshoz

## 📁 Fájl struktúra

```
ksh_checker/
├── index.html              # Fő HTML fájl (UI + CSS) - development
├── js/                     # JavaScript modulok (fejlesztéshez)
│   ├── data.js            # Beágyazott JSON adatok (auto-generált)
│   ├── Config.js          # Static configuration class
│   ├── NameNormalizer.js  # Települési nevek normalizálása osztály
│   ├── CacheManager.js    # localStorage kezelés osztály
│   ├── DataProcessor.js   # JSON feldolgozás osztály
│   ├── Validator.js       # Validációs logika osztály
│   ├── UIManager.js       # UI kezelés osztály
│   └── App.js             # Fő alkalmazás osztály
├── dist/                   # Build kimenet (production)
│   ├── index.html         # HTML bundle scripttel
│   └── js/
│       └── bundle.min.js  # Minifikált JavaScript bundle
├── db/
│   └── t_onkorm_tech_20251006.csv  # Referencia CSV
├── build.js               # Build script (esbuild-alapú bundler)
├── convert-csv-to-json.js # CSV → JSON konverzió és beágyazás
├── package.json           # npm scripts és dependencies
└── .gitignore             # Git ignore (node_modules, dist, .entry.js)
```

## 🔧 Önkormányzati adatok frissítése

1. Cseréld ki a CSV fájlt a `db/` könyvtárban
2. Konvertáld és ágyazd be JSON formátumban:
   ```bash
   npm run embed
   ```
3. **Development:** Frissítsd a böngészőt
4. **Production:** Build-eld újra:
   ```bash
   npm run build
   ```

## ✨ Funkciók

- **Gyors keresés:** KSH kód vagy önkormányzat név alapján
- **Tömeges validálás:** Excel adatok beillesztése (TAB-elválasztva)
- **Progressz bar:** Vizuális visszajelzés nagy adathalmazok validálása során
- **Fuzzy matching:** Intelligens név egyeztetés (római számok, rövidítések, település típusok)
- **Export:** Validációs eredmények CSV exportálása
- **Cache:** 24 órás localStorage cache a gyorsabb betöltésért

## 🛠️ Fejlesztés

### Build parancsok

```bash
# Függőségek telepítése (első alkalommal)
npm install

# Production build (minifikált, ~76ms)
npm run build

# Debug build (source maps, ~91ms)
npm run build:debug

# Watch mode (auto-rebuild file változáskor)
npm run build:watch

# CSV beágyazás
npm run embed
```

### Fejlesztési workflow

1. **Kód módosítás:** Szerkeszd a `js/*.js` vagy `index.html` fájlokat
2. **Tesztelés (opció 1):** Nyisd meg/frissítsd az `index.html` fájlt böngészőben
3. **Tesztelés (opció 2):** `npm run build:watch` - automatikus rebuild minden változtatásnál ⚡
4. **Production build:** `npm run build` - létrehozza a `dist/` könyvtárat
5. **Cache törlés (ha szükséges):** DevTools → Application → Local Storage → Clear

### Objektumorientált architektúra

Az alkalmazás OOP (Object-Oriented Programming) struktúrát használ:
- **Dependency Injection:** Az `App` osztály injektálja a függőségeket
- **Single Responsibility:** Minden osztály egy jól definiált felelősségi kört kezel
- **Encapsulation:** Private state az osztályokon belül
- **Separation of Concerns:** UI, adat, validáció elkülönítve

**JavaScript osztályok:**
- `Config.js` - Static konstansok (cache időtartam, limitek, regex-ek)
- `NameNormalizer.js` - Települési nevek normalizálása és összehasonlítása
- `CacheManager.js` - localStorage műveletek
- `DataProcessor.js` - JSON feldolgozás, Map kezelés
- `Validator.js` - Validációs szabályok, fuzzy matching
- `UIManager.js` - UI logika, DOM műveletek, progressz bar
- `App.js` - Alkalmazás orchestration, dependency injection

### Build rendszer

- **Bundler:** `build.js` (esbuild-alapú, 2025-10-10-től)
- **Folyamat:**
  1. Temporary entry point generálás (`.entry.js`)
  2. 8 JS fájl beolvasása helyes sorrendben (data.js → Config.js → ... → App.js)
  3. IIFE formátum bundling (Immediately Invoked Function Expression)
  4. Minifikálás (~22-29% méretcsökkenés)
  5. HTML frissítése (8 script → 1 bundle)
  6. Cleanup (temporary entry point törlése)
- **Kimenet:** `dist/index.html` + `dist/js/bundle.min.js`
- **Build idő:** ~76ms production, ~91ms debug (korábban ~2-3s Terser-rel)
- **Watch mode:** Auto-rebuild file változáskor (`npm run build:watch`)
- **Source maps:** Inline source maps debug módban
- **File:// kompatibilitás:** Működik szerver nélkül

## 📊 Validációs logika

Az alkalmazás többszintű fuzzy matching-et használ:
1. **Exact match:** Pontos egyezés (kis/nagy betű független)
2. **Normalizált match:** Ékezetek, szóközök normalizálása után
3. **Core name match:** Közigazgatási szavak eltávolítása után (önkormányzat, város, stb.)
4. **Római szám konverzió:** XVII ↔ 17
5. **Word overlap:** Szavak közötti átfedés vizsgálata (70%+ egyezés)

**Eredmény típusok:**
- 🟢 **Helyes:** Pontos vagy fuzzy egyezés
- 🟡 **Figyelmeztető:** Kisebb eltérés (pl. római szám használat)
- 🔴 **Hibás:** Nem egyező név vagy ismeretlen KSH kód

## 📝 Technológiák

- **Nincs szerver szükséges** - működik `file://` protokollal (development és production is)
- **Natív JSON feldolgozás** - nincs külső CSV library dependency
- **esbuild-alapú build** - Szupergyors JavaScript bundling (~76ms, 10-30x gyorsabb mint Terser)
- **Watch mode** - Automatikus rebuild file változáskor (fejlesztéshez)
- **localStorage cache** - 24 órás cache a gyorsabb betöltésért
- **Bootstrap 5** - modern, reszponzív UI
- **Async batch processing** - nem blokkoló UI nagy adathalmazok validálása során
- **OOP JavaScript** - osztály-alapú moduláris architektúra

## 📦 Dependencies

```json
{
  "devDependencies": {
    "esbuild": "^0.24.0"
  }
}
```

**Runtime dependencies:** Nincs (Bootstrap CDN-ről töltődik, beágyazott JSON adatok)

## ⚡ Teljesítmény

- **Build idő:** ~76ms production build (10-30x gyorsabb mint a korábbi Terser-alapú rendszer)
- **Bundle méret:** 133.15 KB minifikált (22.8% csökkentés az eredeti 172.54 KB-hoz képest)
- **Watch mode:** Automatikus rebuild másodpercek alatt
- **Parse idő:** ~10ms JSON parsing (80% gyorsabb mint a korábbi CSV parsing)
