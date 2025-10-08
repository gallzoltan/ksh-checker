// DataProcessor Class - CSV processing and data management

class DataProcessor {
    constructor(validator) {
        this.validator = validator;
        this.dataMap = new Map();
    }

    /**
     * Get the data map
     * @returns {Map}
     */
    getData() {
        return this.dataMap;
    }

    /**
     * Get the size of the data map
     * @returns {number}
     */
    getSize() {
        return this.dataMap.size;
    }

    /**
     * Process CSV data into dataMap
     * @param {Array} data - Parsed CSV data from PapaParse
     */
    processData(data) {
        this.dataMap.clear();

        data.forEach(row => {
            const ksh = row.ksh ? row.ksh.trim() : '';
            const onev = row.onev ? row.onev.trim() : '';

            if (ksh && onev) {
                // Pre-compute expensive normalizations for better validation performance
                const expanded = this.validator.expandAbbreviations(onev);
                const normalized = this.validator.normalizeText(expanded);
                const core = this.validator.romanToArabic(this.validator.extractCoreName(onev));

                // Store object with pre-computed values for fast searching and validation
                this.dataMap.set(ksh, {
                    original: onev,
                    lower: onev.toLowerCase(),
                    kshLower: ksh.toLowerCase(),
                    normalized: normalized,
                    core: core
                });
            }
        });
    }

    /**
     * Load default embedded JSON data
     * @param {Function} onProgress - Callback for progress updates
     * @param {Function} onComplete - Callback when loading is complete
     * @param {Function} onError - Callback when error occurs
     */
    loadDefaultJSON(onProgress, onComplete, onError) {
        if (typeof EMBEDDED_JSON_DATA === 'undefined') {
            onError('Beágyazott JSON adat nem található!');
            return;
        }

        onProgress('Beágyazott adatok betöltése...', 'info');

        try {
            // Process embedded JSON data directly (no parsing needed, already an array)
            this.processData(EMBEDDED_JSON_DATA);
            onComplete();
        } catch (error) {
            onError('Hiba a JSON betöltése során: ' + error.message);
        }
    }

    /**
     * Load CSV from file
     * @param {File} file - File object from file input
     * @param {Function} onProgress - Callback for progress updates
     * @param {Function} onComplete - Callback when loading is complete
     * @param {Function} onError - Callback when error occurs
     */
    loadFromFile(file, onProgress, onComplete, onError) {
        if (!file) {
            onError('Nincs fájl kiválasztva');
            return;
        }

        onProgress('CSV fájl betöltése folyamatban...', 'info');

        Papa.parse(file, {
            header: true,
            delimiter: ';',
            skipEmptyLines: true,
            complete: (results) => {
                this.processData(results.data);
                onComplete();
            },
            error: (error) => {
                onError('Hiba a CSV betöltése során: ' + error.message);
            }
        });
    }

    /**
     * Load data from cache or default JSON
     * @param {CacheManager} cacheManager - Cache manager instance
     * @param {Function} onProgress - Callback for progress updates
     * @param {Function} onComplete - Callback when loading is complete
     * @param {Function} onError - Callback when error occurs
     */
    loadData(cacheManager, onProgress, onComplete, onError) {
        // Try to load from cache first
        const cachedMap = cacheManager.load();

        if (cachedMap) {
            this.dataMap = cachedMap;
            onProgress(`Cached adatok betöltve (${this.dataMap.size} rekord)`, 'success');
            onComplete();
        } else {
            // Load default JSON if no cache
            this.loadDefaultJSON(
                onProgress,
                () => {
                    cacheManager.save(this.dataMap);
                    onProgress(`Sikeresen betöltve ${this.dataMap.size} rekord`, 'success');
                    onComplete();
                },
                onError
            );
        }
    }
}
