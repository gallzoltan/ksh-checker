const fs = require('fs');

// CSV fájl beolvasása
const csvContent = fs.readFileSync('./db/t_onkorm_tech_20251006.csv', 'utf8');

// HTML template beolvasása
let htmlContent = fs.readFileSync('./ksh-validator.html', 'utf8');

// Keressük meg a beágyazandó részt és cseréljük le
const startMarker = 'const EMBEDDED_CSV_DATA = `';
const endMarker = '`;';

const startPos = htmlContent.indexOf(startMarker);
if (startPos === -1) {
    console.error("Hiba: Nem található a beágyazási pont!");
    process.exit(1);
}

const actualStart = startPos + startMarker.length;
const endPos = htmlContent.indexOf(endMarker, actualStart);

if (endPos === -1) {
    console.error("Hiba: Nem található a záró marker!");
    process.exit(1);
}

// Összeállítjuk az új HTML tartalmat
const newHtml = (
    htmlContent.substring(0, actualStart) +
    csvContent +
    htmlContent.substring(endPos)
);

// Kiírjuk az új HTML-t
fs.writeFileSync('./ksh-validator.html', newHtml, 'utf8');

console.log(`Sikeres beágyazás! CSV méret: ${csvContent.length} karakter`);
