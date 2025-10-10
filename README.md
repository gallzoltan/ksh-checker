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
   npm run build      # Minifikált bundle
   ```
2. **Alkalmazás futtatása:**
   - Nyisd meg a `dist/index.html` fájlt böngészőben
   - Minifikált JavaScript bundle (~17-20% kisebb)

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
├── build.js               # Build script (Terser-alapú bundler)
├── convert-csv-to-json.js # CSV → JSON konverzió és beágyazás
├── package.json           # npm scripts és dependencies
└── .gitignore             # Git ignore (node_modules, dist)
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

# Production build (minifikált)
npm run build

# Debug build (nem minifikált, könnyebb hibakeresés)
npm run build:debug

# CSV beágyazás
npm run embed
```

### Fejlesztési workflow

1. **Kód módosítás:** Szerkeszd a `js/*.js` vagy `index.html` fájlokat
2. **Tesztelés:** Nyisd meg/frissítsd az `index.html` fájlt böngészőben
3. **Production build:** `npm run build` - létrehozza a `dist/` könyvtárat
4. **Cache törlés (ha szükséges):** DevTools → Application → Local Storage → Clear

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

- **Bundler:** `build.js` (Terser-alapú)
- **Folyamat:**
  1. 8 JS fájl beolvasása helyes sorrendben (data.js → Config.js → ... → App.js)
  2. Összefűzés egyetlen fájlba
  3. Minifikálás (~26-29% méretcsökkenés)
  4. HTML frissítése (8 script → 1 bundle)
- **Kimenet:** `dist/index.html` + `dist/js/bundle.min.js`
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
- **Terser-alapú build** - JavaScript minifikálás egyetlen bundle-be (~29% méretcsökkenés)
- **localStorage cache** - 24 órás cache a gyorsabb betöltésért
- **Bootstrap 5** - modern, reszponzív UI
- **Async batch processing** - nem blokkoló UI nagy adathalmazok validálása során
- **OOP JavaScript** - osztály-alapú moduláris architektúra

## 📦 Dependencies

```json
{
  "devDependencies": {
    "terser": "^5.36.0"
  }
}
```

**Runtime dependencies:** Nincs (Bootstrap CDN-ről töltődik, beágyazott JSON adatok)
