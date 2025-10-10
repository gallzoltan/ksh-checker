// DataProcessor Class - CSV processing and data management

class DataProcessor {
    constructor(validator, nameNormalizer) {
        this.validator = validator;
        this.nameNormalizer = nameNormalizer;
        this.dataMap = new Map();

        // Reverse indexes for O(1) lookups (P1 optimization)
        this.lowerIndex = new Map();     // lowercase name → ksh (exact match)
        this.nameIndex = new Map();      // core name (lowercase) → [{ksh, data}] (core match)
        this.normalizedIndex = new Map(); // normalized name → ksh (normalized match)
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
        this.lowerIndex.clear();
        this.nameIndex.clear();
        this.normalizedIndex.clear();

        data.forEach(row => {
            const ksh = row.ksh ? row.ksh.trim() : '';
            const onev = row.onev ? row.onev.trim() : '';

            if (ksh && onev) {
                // Use NameNormalizer for parsing and normalization
                const parsed = this.nameNormalizer.parse(onev);

                // Pre-compute expensive normalizations for better validation performance
                // Optimize: reuse expanded value to avoid duplicate expandAbbreviations call
                const expanded = this.validator.expandAbbreviations(onev);
                const normalized = this.validator.normalizeText(expanded);
                const core = this.validator.romanToArabic(this.validator.extractCoreName(expanded));

                // P3: Pre-compute regex-based type detection flags
                const isCounty = /\bv[aá]rmegy(e|ei)\b/i.test(onev);
                const isCity = /\bv[aá]ros\b/i.test(onev) || /\bmegyei\s+jog[uú]\b/i.test(onev);

                // Store object with pre-computed values for fast searching and validation
                const dataObj = {
                    original: onev,
                    lower: onev.toLowerCase(),
                    kshLower: ksh.toLowerCase(),
                    normalized: normalized,
                    core: core,
                    coreWithDiacritics: parsed.normalizedWithAccents,
                    // Add NameNormalizer parsed data
                    parsedName: parsed.normalized,
                    parsedFullNormalized: parsed.fullNormalized,
                    parsedType: parsed.type,
                    // P3: Pre-computed type flags
                    isCounty: isCounty,
                    isCity: isCity
                };

                this.dataMap.set(ksh, dataObj);

                // P1: Build reverse indexes for O(1) lookups
                const lowerName = onev.toLowerCase();
                const coreLower = core.toLowerCase();
                const normalizedLower = normalized.toLowerCase();

                // Exact match index (lowercase)
                if (!this.lowerIndex.has(lowerName)) {
                    this.lowerIndex.set(lowerName, ksh);
                }

                // Normalized match index
                if (!this.normalizedIndex.has(normalizedLower)) {
                    this.normalizedIndex.set(normalizedLower, ksh);
                }

                // Core name index (multiple matches possible for same core)
                if (!this.nameIndex.has(coreLower)) {
                    this.nameIndex.set(coreLower, []);
                }
                this.nameIndex.get(coreLower).push({
                    ksh: ksh,
                    data: dataObj
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
            // Rebuild reverse indexes from cached data (P1 optimization)
            this.rebuildIndexes();
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

    /**
     * Rebuild reverse indexes from existing dataMap
     * Used when loading from cache to restore O(1) lookup performance
     * @private
     */
    rebuildIndexes() {
        this.lowerIndex.clear();
        this.nameIndex.clear();
        this.normalizedIndex.clear();

        for (let [ksh, dataObj] of this.dataMap) {
            const lowerName = dataObj.lower;
            const coreLower = dataObj.core.toLowerCase();
            const normalizedLower = dataObj.normalized.toLowerCase();

            // Exact match index (lowercase)
            if (!this.lowerIndex.has(lowerName)) {
                this.lowerIndex.set(lowerName, ksh);
            }

            // Normalized match index
            if (!this.normalizedIndex.has(normalizedLower)) {
                this.normalizedIndex.set(normalizedLower, ksh);
            }

            // Core name index (multiple matches possible for same core)
            if (!this.nameIndex.has(coreLower)) {
                this.nameIndex.set(coreLower, []);
            }
            this.nameIndex.get(coreLower).push({
                ksh: ksh,
                data: dataObj
            });
        }
    }
}
