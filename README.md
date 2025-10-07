# KSH Kód Ellenőrző

Magyar önkormányzati KSH (Központi Statisztikai Hivatal) kód validáló alkalmazás.

## 🚀 Gyors használat

1. **Alkalmazás megnyitása:**
   - Dupla kattintás az `index.html` fájlon
   - Böngészőben megnyílik `file://` protokollal
   - **Nincs szükség szerverre!**

2. **Keresés:**
   - Gyors keresés tab: Kód vagy név alapján keresés
   - Tömeges ellenőrzés tab: Excel adatok beillesztése validáláshoz

## 📁 Fájl struktúra

```
ksh_checker/
├── index.html              # Fő HTML fájl (UI + CSS)
├── js/
│   ├── data.js            # Beágyazott CSV adatok (auto-generált)
│   ├── config.js          # Konfiguráció, konstansok
│   ├── cache.js           # localStorage kezelés
│   ├── data-processor.js  # CSV feldolgozás
│   ├── validator.js       # Validációs logika
│   ├── ui.js              # UI funkciók
│   └── app.js             # Inicializálás
├── db/
│   └── t_onkorm_tech_20251006.csv  # Referencia CSV
└── embed-csv.js           # CSV → data.js generáló
```

## 🔧 CSV adatok frissítése

1. Cseréld ki a CSV fájlt a `db/` könyvtárban
2. Futtasd a generáló scriptet:
   ```bash
   node embed-csv.js
   ```
3. Frissítsd a böngészőt

## ✨ Funkciók

- **Gyors keresés:** KSH kód vagy önkormányzat név alapján
- **Tömeges validálás:** Excel adatok beillesztése (TAB-elválasztva)
- **Fuzzy matching:** Intelligens név egyeztetés (római számok, rövidítések, stb.)
- **Export:** Validációs eredmények CSV exportálása
- **Cache:** 24 órás localStorage cache a gyorsabb betöltésért

## 🛠️ Fejlesztés

**JavaScript modulok módosítása:**
- `config.js` - Konfiguráció (cache időtartam, limitekstb.)
- `validator.js` - Validációs szabályok
- `ui.js` - Felhasználói felület
- `data-processor.js` - Adat feldolgozás

**HTML/CSS módosítás:**
- `index.html` - Egyetlen fájl tartalmazza mindkettőt

**Tesztelés:**
1. Módosítsd a kívánt fájlt
2. Frissítsd a böngészőt (F5)
3. Ha szükséges, töröld a cache-t: DevTools → Application → Local Storage → Clear

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

## 📝 Megjegyzések

- **Nincs szerver szükséges** - működik `file://` protokollal
- **Nincs build folyamat** - egyszerű HTML/JS modulok
- **localStorage cache** - 24 órás cache a gyorsabb betöltésért
- **Bootstrap 5** - modern, reszponzív UI
- **PapaParse** - CSV feldolgozás
