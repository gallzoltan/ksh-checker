// LocalStorage Cache Management

function isCacheValid() {
    const timestamp = localStorage.getItem(STORAGE_TIMESTAMP);
    if (!timestamp) return false;

    const age = new Date().getTime() - parseInt(timestamp);
    return age < CACHE_DURATION;
}

function loadFromCache() {
    if (isCacheValid()) {
        const cachedData = localStorage.getItem(STORAGE_KEY);
        if (cachedData) {
            try {
                const parsed = JSON.parse(cachedData);

                // Check if cached data is in new format (Map entries)
                if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0])) {
                    // New format: array of [key, value] entries - load directly into Map
                    dataMap = new Map(parsed);
                } else {
                    // Old format: fallback for compatibility
                    processData(parsed);
                }

                updateStatus(`Cached adatok betöltve (${dataMap.size} rekord)`, 'success');
                showMainContent();
                return true;
            } catch (e) {
                console.error('Cache betöltési hiba:', e);
            }
        }
    }
    return false;
}

function saveToCache() {
    try {
        // Save Map entries directly for faster loading (no need to reprocess)
        const mapEntries = Array.from(dataMap.entries());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mapEntries));
        localStorage.setItem(STORAGE_TIMESTAMP, new Date().getTime().toString());
    } catch (e) {
        console.error('Cache mentési hiba:', e);
    }
}
