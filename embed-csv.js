const fs = require('fs');

// CSV fájl beolvasása
const csvContent = fs.readFileSync('./db/t_onkorm_tech_20251006.csv', 'utf8');

// JavaScript data.js fájl beolvasása
let dataJsContent = fs.readFileSync('./js/data.js', 'utf8');

// Keressük meg a beágyazandó részt és cseréljük le
const startMarker = 'const EMBEDDED_CSV_DATA = `';
const endMarker = '`;';

const startPos = dataJsContent.indexOf(startMarker);
if (startPos === -1) {
    console.error("Hiba: Nem található a beágyazási pont a js/data.js fájlban!");
    process.exit(1);
}

const actualStart = startPos + startMarker.length;
const endPos = dataJsContent.indexOf(endMarker, actualStart);

if (endPos === -1) {
    console.error("Hiba: Nem található a záró marker!");
    process.exit(1);
}

// Összeállítjuk az új data.js tartalmat
const newDataJs = (
    dataJsContent.substring(0, actualStart) +
    csvContent +
    dataJsContent.substring(endPos)
);

// Kiírjuk az új data.js fájlt
fs.writeFileSync('./js/data.js', newDataJs, 'utf8');

console.log(`Sikeres beágyazás! CSV méret: ${csvContent.length} karakter`);
console.log(`A js/data.js fájl frissítve.`);

// Minifikált verzió is a dist könyvtárba (ha létezik)
const distJsDir = './dist/js';
if (fs.existsSync(distJsDir)) {
    fs.writeFileSync(`${distJsDir}/data.js`, newDataJs, 'utf8');
    console.log(`A dist/js/data.js fájl is frissítve (minifikálatlan - futtasd az 'npm run build'-et a minifikáláshoz).`);
}
