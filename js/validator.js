// Validator Class - Validation and fuzzy matching logic

class Validator {
    /**
     * Normalize text for fuzzy matching
     * @param {string} text
     * @returns {string}
     */
    normalizeText(text) {
        return text
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }

    /**
     * Remove administrative words for core name extraction
     * @param {string} text
     * @returns {string}
     */
    extractCoreName(text) {
        let normalized = this.normalizeText(text);

        // Remove all ignored words using pre-compiled regex from Config
        normalized = normalized.replace(Config.IGNORED_WORDS_REGEX, '');

        // Clean up extra whitespace
        return normalized.replace(/\s+/g, ' ').trim();
    }

    /**
     * Expand common abbreviations
     * @param {string} text
     * @returns {string}
     */
    expandAbbreviations(text) {
        return text
            .replace(/\bker\./gi, 'Kerület')
            .replace(/\bfőv\./gi, 'főváros');
    }

    /**
     * Convert Roman numerals to Arabic (I-XXIII range)
     * @param {string} text
     * @returns {string}
     */
    romanToArabic(text) {
        let result = text;
        // Use pre-compiled regex map from Config for better performance
        for (const [regex, arabic] of Config.ROMAN_REGEX_MAP) {
            result = result.replace(regex, arabic);
        }
        return result;
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

        // Extract core name from normalized input (reuse normalized value)
        const coreInput = this.romanToArabic(this.extractCoreName(expandedInput));
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
}
