// CSV Data Processing

// Global data structures
let dataMap = new Map();
let reverseMap = new Map();
let allData = [];

function processData(data) {
    dataMap.clear();

    data.forEach(row => {
        const ksh = row.ksh ? row.ksh.trim() : '';
        const onev = row.onev ? row.onev.trim() : '';

        if (ksh && onev) {
            // Pre-compute expensive normalizations for better validation performance
            const expanded = expandAbbreviations(onev);
            const normalized = normalizeText(expanded);
            const core = romanToArabic(extractCoreName(onev));

            // Store object with pre-computed values for fast searching and validation
            dataMap.set(ksh, {
                original: onev,
                lower: onev.toLowerCase(),
                kshLower: ksh.toLowerCase(),
                normalized: normalized,
                core: core
            });
        }
    });

    // Debug: Feldolgozva ${dataMap.size} rekord
}

function loadDefaultCSV() {
    showLoading(true);
    updateStatus('Beágyazott adatok betöltése...', 'info');

    // Beágyazott CSV adat feldolgozása (nincs szükség hálózati kérésre)
    Papa.parse(EMBEDDED_CSV_DATA, {
        header: true,
        delimiter: ';',
        skipEmptyLines: true,
        complete: function(results) {
            processData(results.data);
            saveToCache();
            updateStatus(`Sikeresen betöltve ${dataMap.size} rekord`, 'success');
            showLoading(false);
            showMainContent();
        },
        error: function(error) {
            updateStatus('Hiba a CSV betöltése során: ' + error.message, 'danger');
            showLoading(false);
        }
    });
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    showLoading(true);
    updateStatus('CSV fájl betöltése folyamatban...', 'info');

    Papa.parse(file, {
        header: true,
        delimiter: ';',
        skipEmptyLines: true,
        complete: function(results) {
            processData(results.data);
            saveToCache();
            updateStatus(`Sikeresen betöltve ${dataMap.size} rekord`, 'success');
            showLoading(false);
            showMainContent();
        },
        error: function(error) {
            updateStatus('Hiba a CSV betöltése során: ' + error.message, 'danger');
            showLoading(false);
        }
    });
}
