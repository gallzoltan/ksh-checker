// Application Initialization and Event Listeners

document.addEventListener('DOMContentLoaded', function() {
    const cacheLoaded = loadFromCache();
    if (!cacheLoaded) {
        // Ha nincs cache, automatikusan betöltjük a default CSV fájlt
        loadDefaultCSV();
    }
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('csvFile').addEventListener('change', handleFileSelect);
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('validateBtn').addEventListener('click', handleBulkValidate);
    document.getElementById('exportBtn').addEventListener('click', handleExport);
    document.getElementById('clearBtn').addEventListener('click', handleClear);
    document.getElementById('toggleCsvBtn').addEventListener('click', toggleCustomCsv);
}
