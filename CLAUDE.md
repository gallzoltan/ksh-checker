# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projekt áttekintés

Ez egy magyar önkormányzati KSH (Központi Statisztikai Hivatal) kód validáló alkalmazás. Egyoldalas HTML alkalmazás, amely önkormányzati kódokat és neveket validál egy referencia adatbázis alapján.

**Fő funkciók:**
- CSV fájlból tölti be az önkormányzati adatokat (formátum: `ksh;onev`)
- Gyors keresés: önkormányzatok keresése kód vagy név alapján
- Tömeges ellenőrzés: Excel adatok beillesztése (kód + TAB + név) több bejegyzés validálásához
- Validációs eredmények exportálása CSV formátumban
- Kliens oldali cache localStorage-ban (24 órás cache időtartam)

## Architektúra

**Egyfájlos alkalmazás:** `ksh-validator.html`
- Önálló HTML fájl beágyazott CSS-sel és JavaScripttel
- Bootstrap 5-öt használ a UI stílusokhoz
- PapaParse library-t használ CSV feldolgozáshoz
- Nincs szükség build folyamatra vagy package kezelésre

**Adatstruktúra:**
- `dataMap`: Map<ksh, onev> - Elsődleges lookup kódból név felé
- `reverseMap`: Map<onev.lowercase, ksh> - Fordított lookup névből kód felé
- `allData`: Array - Nyers CSV adatok a cache-eléshez

**Referencia adatok:** `db/t_onkorm_tech_20251006.csv`
- CSV fájl önkormányzati kódokkal és nevekkel
- Formátum: pontosvesszővel elválasztva, fejléccel `"ksh";"onev"`
- Példa: `"0102112";Budapest XVII. Kerület`

## Fejlesztés

**Alkalmazás futtatása:**
Nyisd meg a `ksh-validator.html` fájlt közvetlenül böngészőben - nincs szükség szerverre.

**Változtatások tesztelése:**
1. Szerkeszd a `ksh-validator.html` fájlt
2. Frissítsd a böngészőt
3. Szükség esetén töröld a localStorage-t: DevTools → Application → Local Storage → Clear

**Önkormányzati adatok frissítése:**
Cseréld ki a CSV fájlt a `db/` könyvtárban, majd töltsd be a fájl input mezőn keresztül a UI-ban.

## Kód szervezés

**Fő funkciók:**
- `processData(data)` - CSV adatok feldolgozása Map struktúrákba (ksh-validator.html:286)
- `handleSearch(event)` - Valós idejű keresés és szűrés (ksh-validator.html:303)
- `handleBulkValidate()` - Beillesztett Excel adatok validálása (ksh-validator.html:360)
- `saveToCache(data)` / `loadFromCache()` - localStorage perzisztencia (ksh-validator.html:231, 251)

**Adatfolyam:**
1. CSV betöltés fájl inputon keresztül → PapaParse
2. Feldolgozott adatok → `processData()` → Map-ek létrehozása
3. Adatok mentése localStorage-ba időbélyeggel
4. Keresés/validálás lekérdezések a Map-ek alapján
5. Eredmények megjelenítése színkódolással (zöld=helyes, piros=hibás)
