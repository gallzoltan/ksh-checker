# Tesztelési Útmutató - KSH Checker

Ez a dokumentum leírja, hogyan tesztelheted a KSH Checker alkalmazást.

## 📋 Elérhető Tesztek

A projekt **HTML-alapú manuális teszteket** használ, amelyek közvetlenül futtathatók böngészőben (`file://` protokollal is).

### 1. **Név → KSH Kód Keresés Tesztek**
**Fájl:** `test-name-search.html`

**Mit tesztel:**
- 18 problémás esetet az önkormányzati név → KSH kód keresésnél
- Budapest kerületek különböző formátumokban (Főváros, RÁKOSMENTE, stb.)
- Elírások az "Önkormányzata" szóban (Önkományzata, Ökormányzata)
- Város vs. Vármegyei megkülönböztetés (Békés, Heves, Veszprém)
- Ékezetes különbségek (Komoró vs. Kömörő)
- Hosszú önkormányzati nevek

**Futtatás:**
```bash
# Böngészőben megnyitás (Windows)
start test-name-search.html

# Vagy közvetlenül fájlkezelőből dupla kattintással
```

**Várt eredmény:**
- ✅ **18/18 teszt sikeres** (zöld háttér)
- Minden teszt esetén a helyes KSH kódot kell megtalálni
- Console logban látható részletes kimenet

**Példa kimenet:**
```
✓ Loaded 3174 municipalities from database
✓ Test 1: PASS
  Input:    "Budapest Főváros Önkormányzata"
  Expected: 0113578 → "Budapest Főváros"
  Got:      0113578 → "Budapest Főváros" (exact)
...
✓ All tests passed!
```

---

### 2. **Teljesítmény Tesztek**
**Fájl:** `test-performance.html`

**Mit tesztel:**
- Név → KSH keresési teljesítmény különböző adathalmazméretekkel
- 100, 500, 1000 név keresése
- O(1) fast-path optimalizációk működése

**Futtatás:**
```bash
start test-performance.html
```

**Műveletek:**
- Kattints a "100 név teszt", "500 név teszt" vagy "1000 név teszt" gombokra
- Vagy futtasd az "Összes teszt futtatása" gombot mindhárom egymás után

**Várt eredmény:**
- **100 név:** ~5-10ms teljes idő (0.05-0.1ms/név)
- **500 név:** ~20-50ms teljes idő
- **1000 név:** ~50-100ms teljes idő
- **Találatok:** 100% (minden név megtalálva)

**Példa kimenet:**
```
✅ Teszt kész: 1000 név
Teljes idő:        87.45 ms
Átlagos idő/név:   0.09 ms
Találatok:         1000 / 1000 (100.0%)
Névkeresés/sec:    11438 név/sec
```

---

## 🎯 Tesztelési Folyamat

### Minden változtatás után:

1. **Név keresési tesztek futtatása:**
   ```bash
   start test-name-search.html
   ```
   - Ellenőrizd: **18/18 teszt sikeres**
   - Ha van hiba: Console logban látható részletes hiba

2. **Teljesítmény tesztek (opcionális):**
   ```bash
   start test-performance.html
   ```
   - Ellenőrizd: átlagos keresési idő < 0.2ms/név

3. **Manuális funkcionális teszt:**
   ```bash
   start index.html  # vagy dist/index.html
   ```
   - Próbálj keresni önkormányzatra
   - Tömeges validálás 10-20 sorral
   - Export CSV működése

---

## 🔍 Debugging Tippek

### Ha a név keresés teszt hibázik:

1. **Nyisd meg a Developer Tools-t** (F12)
2. **Console** fülön látható részletes log:
   ```
   ✗ Test 12: FAIL
     Input:    "Békés Város Önkormányzat"
     Expected: 0409760 → "Békés"
     Got:      0400000 → "Békés Vármegyei Önkormányzat"
   ```
3. **Nézd meg a `Validator.js:findByName()` metódust** - itt lehet a hiba

### Ha a teljesítmény teszt lassú:

1. **Ellenőrizd a reverse indexek működését:**
   - `DataProcessor.js:rebuildIndexes()` meghívódik-e cache betöltéskor?
   - `lowerIndex`, `nameIndex`, `normalizedIndex` Map-ek mérete helyes?

2. **Console Performance tab:**
   - Futtasd a tesztet "Record" módban
   - Keresd a lassú függvényeket

---

## 📊 Test Coverage

Jelenleg **manuálisan tesztelt komponensek:**

| Komponens | Tesztelt funkcionalitás | Teszt fájl |
|-----------|------------------------|------------|
| **NameNormalizer** | parse(), normalize(), smartMatch() | test-name-search.html |
| **Validator** | findByName(), fuzzyMatchNames() | test-name-search.html |
| **DataProcessor** | processData(), reverse indexek | test-name-search.html, test-performance.html |
| **Config** | ROMAN_REGEX, IGNORED_WORDS_REGEX | test-name-search.html (implicit) |
| **Cache** | localStorage működés | index.html (manuális) |

**Nem tesztelt komponensek:**
- `CacheManager` - csak manuális tesztelés
- `UIManager` - csak manuális tesztelés (DOM műveletek)
- `App` - csak manuális tesztelés

---

## 🚀 Jövőbeli Fejlesztési Lehetőségek

### Opció 1: Playwright E2E Tesztek
```javascript
// test/e2e/name-search.spec.js
test('should find Budapest Főváros', async ({ page }) => {
  await page.goto('file:///.../index.html');
  await page.fill('#searchInput', 'Budapest Főváros');
  await expect(page.locator('.search-result')).toContainText('0113578');
});
```

**Előnyök:**
- Automatizált böngésző tesztek
- CI/CD integráció lehetséges
- Valódi felhasználói interakciók tesztelése

### Opció 2: ES6 Modules Migráció + Vitest
**Lépések:**
1. Refaktoráld a `js/*.js` fájlokat ES6 module formátumra
2. `export class Config { ... }`
3. `import { Config } from './Config.js'`
4. Build: `format: 'esm'`
5. Vitest unit tesztek működőképessé válnak

**Előnyök:**
- Modern JavaScript standard
- Automatizált unit tesztek
- Code coverage report
- Fast feedback loop (watch mode)

---

## 📝 Teszt Scriptek

```bash
# package.json
npm test          # Üzenet: nyisd meg a HTML teszteket
npm run build     # Production build
npm run embed     # CSV → JSON konverzió
```

---

## ✅ Acceptance Criteria

**Minden release előtt:**
- ✅ `test-name-search.html`: 18/18 teszt sikeres
- ✅ `test-performance.html`: 1000 név < 200ms
- ✅ Manuális teszt: keresés + bulk validálás + export működik
- ✅ Böngésző támogatás: Chrome, Firefox, Edge (file:// protokoll)

---

## 📚 További Dokumentáció

- **Fejlesztői útmutató:** `CLAUDE.md`
- **README:** `README.md` (ha létezik)
- **Build rendszer:** `build.js` kommentek

---

**Utolsó frissítés:** 2025-10-13
**Verzió:** 1.0.1
