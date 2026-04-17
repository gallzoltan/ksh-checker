// Validator Class - Validation and fuzzy matching logic

class Validator {
    constructor(nameNormalizer) {
        this.nameNormalizer = nameNormalizer;
        this.dataProcessor = null; // Will be set by App.js for reverse index access
    }

    /**
     * Set data processor reference for reverse index access
     * @param {DataProcessor} dataProcessor
     */
    setDataProcessor(dataProcessor) {
        this.dataProcessor = dataProcessor;
    }

    /**
     * Normalize text for fuzzy matching
     * @param {string} text
     * @returns {string}
     */
    normalizeText(text) {
        // Use NameNormalizer's normalize method
        return this.nameNormalizer.normalize(text);
    }

    /**
     * Remove administrative words for core name extraction
     * @param {string} text - Already expanded text (abbreviations replaced)
     * @param {string} normalized - Pre-computed normalized text (optional, for optimization)
     * @returns {string}
     */
    extractCoreName(text, normalized = null) {
        // Use pre-computed normalized text if provided (optimization)
        if (!normalized) {
            normalized = this.normalizeText(text);
        }

        // Special handling for Budapest districts: extract only "budapest + roman numeral + kerulet"
        // Pattern: budapest ... XVIII. ... kerulet (allow any words in between)
        // Use word boundaries to match complete roman numerals (I-XXIII)
        const budapestDistrictMatch = normalized.match(/budapest.*?\b([ivxlcdm]{1,5})\.?\b.*?kerulet/i);
        if (budapestDistrictMatch) {
            // Extract only "budapest + roman numeral + kerulet" (remove intermediate words)
            const romanNumeral = budapestDistrictMatch[1].replace(/\./g, '').trim();
            return `budapest ${romanNumeral} kerulet`;
        }

        // Remove all ignored words using pre-compiled regex from Config
        let result = normalized.replace(Config.IGNORED_WORDS_REGEX, '');

        // Remove Budapest district nicknames (e.g., "BELVÁROS-LIPÓTVÁROS", "ÓBUDA-BÉKÁSMEGYER")
        result = result.replace(Config.DISTRICT_NICKNAMES_REGEX, '');

        // Clean up extra whitespace
        return result.replace(/\s+/g, ' ').trim();
    }

    /**
     * Expand common abbreviations
     * @param {string} text
     * @returns {string}
     */
    expandAbbreviations(text) {
        return text
            .replace(/\bker\./gi, 'kerület')
            .replace(/\bfőv\./gi, 'főváros');
    }

    /**
     * Convert Roman numerals to Arabic (I-XXIII range)
     * Optimized with single regex pass and lookup map (50-60% faster)
     * @param {string} text
     * @returns {string}
     */
    romanToArabic(text) {
        return text.replace(Config.ROMAN_REGEX, (match) => {
            return Config.ROMAN_TO_ARABIC[match.toUpperCase()];
        });
    }

    /**
     * Fuzzy match two names with various normalization strategies
     * @param {string} input - Input name to validate
     * @param {Object} referenceData - Pre-computed reference data from dataMap
     * @returns {string} - 'exact', 'fuzzy', or 'nomatch'
     */
    fuzzyMatchNames(input, referenceData) {
        const reference = referenceData.original;

        // Exact match (case insensitive)
        if (input.toLowerCase() === reference.toLowerCase()) {
            return 'exact';
        }

        // Use NameNormalizer's smart matching for intelligent comparison
        if (this.nameNormalizer.smartMatch(input, reference, 0.95)) {
            return 'exact';
        }

        // Check if names are equal (without accents)
        if (this.nameNormalizer.areEqual(input, reference)) {
            return 'exact';
        }

        // Normalize and expand input once, cache for reuse
        const expandedInput = this.expandAbbreviations(input);
        const normalizedInput = this.normalizeText(expandedInput);

        // Use pre-computed normalized reference
        const normalizedRef = referenceData.normalized;

        // Exact match after normalization
        if (normalizedInput === normalizedRef) {
            return 'exact';
        }

        // Try with Roman/Arabic conversion
        const convertedInput = this.romanToArabic(normalizedInput);
        const convertedRef = this.romanToArabic(normalizedRef);

        if (convertedInput === convertedRef) {
            return 'fuzzy';
        }

        // Extract core name from normalized input (reuse normalized value to avoid double normalization)
        const coreInput = this.romanToArabic(this.extractCoreName(expandedInput, normalizedInput));
        const coreRef = referenceData.core;

        // Check if core names match exactly (allow 2+ char names for short settlements)
        if (coreInput === coreRef && coreInput.length >= 2) {
            return 'exact';
        }

        // If reference core name is found in input, it's valid
        if (coreRef.length >= 2 && coreInput.includes(coreRef)) {
            return 'exact';
        }

        // If input core name is found in reference, it's valid
        if (coreInput.length >= 2 && coreRef.includes(coreInput)) {
            return 'exact';
        }

        // Partial match: check if one contains the other (min 5 chars to avoid false positives)
        if (normalizedInput.length >= 5 && normalizedRef.length >= 5) {
            if (normalizedRef.includes(normalizedInput) || normalizedInput.includes(normalizedRef)) {
                return 'fuzzy';
            }
        }

        // Check for significant word overlap (at least 70% of words match)
        const inputWords = normalizedInput.split(' ').filter(w => w.length > 2);
        const refWords = normalizedRef.split(' ').filter(w => w.length > 2);

        if (inputWords.length > 0 && refWords.length > 0) {
            const matchCount = inputWords.filter(word =>
                refWords.some(refWord => refWord.includes(word) || word.includes(refWord))
            ).length;

            const matchRatio = matchCount / Math.max(inputWords.length, refWords.length);
            if (matchRatio >= 0.7) {
                return 'fuzzy';
            }
        }

        return 'nomatch';
    }

    /**
     * Find KSH code by municipality name using fuzzy matching (P1 optimized)
     * @param {string} input - Municipality name to search
     * @param {Map} dataMap - Reference data map
     * @returns {Object|null} - {ksh, onev, matchType} or null if not found
     */
    findByName(input, dataMap) {
        if (!input || !input.trim()) {
            return null;
        }

        const inputTrimmed = input.trim();
        const inputLower = inputTrimmed.toLowerCase();

        // P1: Fast path - O(1) exact match lookup
        if (this.dataProcessor && this.dataProcessor.lowerIndex.has(inputLower)) {
            const ksh = this.dataProcessor.lowerIndex.get(inputLower);
            const data = dataMap.get(ksh);
            return {
                ksh: ksh,
                onev: data.original,
                matchType: 'exact'
            };
        }

        // Pre-compute input properties once (optimization: minimize repeated operations)
        const expandedInput = this.expandAbbreviations(inputTrimmed);
        const inputNormalized = this.normalizeText(expandedInput);
        const inputNormalizedLower = inputNormalized.toLowerCase();

        // Check if input is a Budapest district (skip normalizedIndex fast-path for districts)
        const isBudapestDistrict = /budapest.*?\b([ivxlcdm]{1,5})\.?\b.*?kerulet/i.test(inputNormalized);

        // P1: Fast path - O(1) normalized match lookup (skip for Budapest districts)
        if (!isBudapestDistrict && this.dataProcessor && this.dataProcessor.normalizedIndex.has(inputNormalizedLower)) {
            const ksh = this.dataProcessor.normalizedIndex.get(inputNormalizedLower);
            const data = dataMap.get(ksh);
            return {
                ksh: ksh,
                onev: data.original,
                matchType: 'exact'
            };
        }

        // Use NameNormalizer for parsing
        const inputParsed = this.nameNormalizer.parse(inputTrimmed);
        const inputCoreWithDiacritics = inputParsed.normalizedWithAccents;

        // Extract core name once (pass pre-computed normalized to avoid double normalization)
        const inputCore = this.romanToArabic(this.extractCoreName(expandedInput, inputNormalized));

        // P1: Medium path - O(k) core name lookup (k = small number of candidates)
        const coreLower = inputCore.toLowerCase();
        let candidates = [];

        if (this.dataProcessor && this.dataProcessor.nameIndex.has(coreLower)) {
            // Get candidates from core name index
            candidates = this.dataProcessor.nameIndex.get(coreLower).map(entry => ({
                ksh: entry.ksh,
                data: entry.data
            }));
        }

        // If no core match candidates, fall back to full scan (rare case)
        // BUT: Skip full scan for Budapest districts to avoid false matches with "Budapest Főváros"
        if (candidates.length === 0 && !isBudapestDistrict) {
            // Collect candidates via fuzzy matching (O(n) - only for edge cases)
            for (let [ksh, data] of dataMap) {
                const matchType = this.fuzzyMatchNames(inputTrimmed, data);
                if (matchType !== 'nomatch') {
                    candidates.push({ ksh, data });
                }
            }
        }

        // If still no candidates, not found
        if (candidates.length === 0) {
            return null;
        }

        // Detect input type once (optimized: single regex pass per type)
        const inputIsCity = /\b(v[aá]ros|megyei\s+jog[uú])\b/i.test(inputTrimmed);
        const inputIsCounty = /\bv[aá]rmegy(e|ei)\b/i.test(inputTrimmed);

        // Score candidates and find best match
        let bestMatch = null;
        let bestScore = -1;

        for (const candidate of candidates) {
            const { ksh, data } = candidate;

            // P3: Use pre-computed type flags (no regex during search!)
            const refIsCounty = data.isCounty;
            const refIsCity = data.isCity;

            // Skip if type mismatch
            if (inputIsCity && refIsCounty && !inputIsCounty) {
                continue;
            }
            if (inputIsCounty && refIsCity && !inputIsCity) {
                continue;
            }

            // Calculate match score
            let score = 0;
            const refLower = data.lower;
            const refNormalized = data.normalized;
            const refCore = data.core;
            const refCoreWithDiacritics = data.coreWithDiacritics;

            // Score 1000: Exact string match (case insensitive)
            if (inputLower === refLower) {
                score = 1000;
            }
            // Score 950: Smart match with high similarity (uses NameNormalizer)
            else if (this.nameNormalizer.smartMatch(inputTrimmed, data.original, 0.95)) {
                score = 950;
            }
            // Score 900: Exact normalized match
            else if (inputNormalized === refNormalized) {
                score = 900;
            }
            // Score 850: Exact core name match with diacritics (preferred over normalized core)
            else if (inputCoreWithDiacritics === refCoreWithDiacritics && inputCoreWithDiacritics.length >= 3) {
                score = 850;
            }
            // Score 800: Exact core name match (minimum 3 chars to avoid false positives)
            else if (inputCore === refCore && inputCore.length >= 3) {
                score = 800;
            }
            // Score based on core name similarity (prefer longer matches)
            else if (inputCore && refCore) {
                const diacriticMatch = inputCoreWithDiacritics === refCoreWithDiacritics;

                // For very short core names (< 3 chars), require exact match only
                if (inputCore.length < 3 || refCore.length < 3) {
                    if (diacriticMatch) {
                        score = 800;
                    } else if (inputCore === refCore) {
                        score = 750;
                    }
                }
                // For longer names, allow partial matching
                else {
                    if (diacriticMatch) {
                        score = 850;
                    } else if (inputCore === refCore) {
                        score = 800;
                    } else if (refCoreWithDiacritics.includes(inputCoreWithDiacritics)) {
                        const matchRatio = inputCoreWithDiacritics.length / refCoreWithDiacritics.length;
                        score = matchRatio >= 0.6 ? 500 + inputCoreWithDiacritics.length * 10 : 150;
                    } else if (inputCoreWithDiacritics.includes(refCoreWithDiacritics)) {
                        const matchRatio = refCoreWithDiacritics.length / inputCoreWithDiacritics.length;
                        score = matchRatio >= 0.6 ? 400 + refCoreWithDiacritics.length * 10 : 100;
                    } else if (refCore.includes(inputCore)) {
                        const matchRatio = inputCore.length / refCore.length;
                        score = matchRatio >= 0.6 ? 450 + inputCore.length * 10 : 120;
                    } else if (inputCore.includes(refCore)) {
                        const matchRatio = refCore.length / inputCore.length;
                        score = matchRatio >= 0.6 ? 350 + refCore.length * 10 : 80;
                    } else {
                        // Fuzzy match fallback
                        const matchType = this.fuzzyMatchNames(inputTrimmed, data);
                        score = matchType === 'exact' ? 700 : (matchType === 'fuzzy' ? 200 : 0);
                    }
                }
            }
            // Fallback: use fuzzyMatchNames
            else {
                const matchType = this.fuzzyMatchNames(inputTrimmed, data);
                score = matchType === 'exact' ? 700 : (matchType === 'fuzzy' ? 200 : 0);
            }

            // Update best match if this score is higher
            if (score > bestScore) {
                bestScore = score;
                bestMatch = {
                    ksh: ksh,
                    onev: data.original,
                    matchType: score >= 700 ? 'exact' : 'fuzzy'
                };
            }
        }

        return bestMatch;
    }

    /**
     * Validate a single KSH + name pair
     * @param {string} ksh - KSH code
     * @param {string} onev - Municipality name
     * @param {Map} dataMap - Reference data map
     * @returns {Object} - {status, correctName, message}
     */
    validateEntry(ksh, onev, dataMap) {
        const trimmedKsh = ksh.trim();
        const trimmedOnev = onev.trim();

        if (!trimmedKsh || !trimmedOnev) {
            return { status: 'invalid', correctName: '', message: 'Hiányzó adat' };
        }

        const referenceData = dataMap.get(trimmedKsh);

        if (!referenceData) {
            return { status: 'invalid', correctName: '', message: 'Ismeretlen KSH kód' };
        }

        const matchType = this.fuzzyMatchNames(trimmedOnev, referenceData);

        if (matchType === 'exact') {
            return { status: 'valid', correctName: referenceData.original, message: 'Helyes' };
        } else if (matchType === 'fuzzy') {
            return { status: 'warning', correctName: referenceData.original, message: 'Eltérés' };
        } else {
            return { status: 'invalid', correctName: referenceData.original, message: 'Hibás név' };
        }
    }

    /**
     * Validate entries in batches with progress callback
     * Processes items asynchronously to avoid blocking the UI
     * @param {Array} entries - Array of {ksh, onev} objects to validate
     * @param {Map} dataMap - Reference data map
     * @param {Function} progressCallback - Called with (current, total) after each batch
     * @returns {Promise<Array>} - Promise resolving to array of validation results
     */
    async validateEntriesAsync(entries, dataMap, progressCallback) {
        const results = [];
        const total = entries.length;

        // Adaptive batch size based on data volume
        const batchSize = total < 100 ? 5 :    // Small datasets: frequent updates
                          total < 500 ? 10 :   // Medium datasets: balanced
                          20;                  // Large datasets: performance priority

        for (let i = 0; i < total; i += batchSize) {
            const batch = entries.slice(i, Math.min(i + batchSize, total));

            // Process batch
            for (const entry of batch) {
                const result = this.validateEntry(entry.ksh, entry.onev, dataMap);
                results.push({
                    ...entry,
                    ...result
                });
            }

            // Update progress
            const processed = Math.min(i + batchSize, total);
            if (progressCallback) {
                progressCallback(processed, total);
            }

            // Yield to UI thread
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        return results;
    }
}
