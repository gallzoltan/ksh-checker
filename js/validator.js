// Validation and Fuzzy Matching Logic

// Normalize text for fuzzy matching
function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
}

// Remove administrative words for core name extraction
function extractCoreName(text) {
    let normalized = normalizeText(text);

    // Remove all ignored words using pre-compiled regex
    normalized = normalized.replace(IGNORED_WORDS_REGEX, '');

    // Clean up extra whitespace
    return normalized.replace(/\s+/g, ' ').trim();
}

// Expand common abbreviations
function expandAbbreviations(text) {
    return text
        .replace(/\bker\./gi, 'Kerület')
        .replace(/\bfőv\./gi, 'főváros');
}

// Convert Roman numerals to Arabic (I-XXIII range)
function romanToArabic(text) {
    let result = text;
    // Use pre-compiled regex map for better performance
    for (const [regex, arabic] of ROMAN_REGEX_MAP) {
        result = result.replace(regex, arabic);
    }
    return result;
}

// Fuzzy match two names with various normalization strategies
// referenceData should be the pre-computed object from dataMap
function fuzzyMatchNames(input, referenceData) {
    const reference = referenceData.original;

    // Exact match (case insensitive)
    if (input.toLowerCase() === reference.toLowerCase()) {
        return 'exact';
    }

    // Normalize input string
    const normalizedInput = normalizeText(expandAbbreviations(input));
    // Use pre-computed normalized reference
    const normalizedRef = referenceData.normalized;

    // Exact match after normalization
    if (normalizedInput === normalizedRef) {
        return 'exact';
    }

    // Try with Roman/Arabic conversion
    const convertedInput = romanToArabic(normalizedInput);
    const convertedRef = romanToArabic(normalizedRef);

    if (convertedInput === convertedRef) {
        return 'fuzzy';
    }

    // Extract core name from input and use pre-computed core reference
    const coreInput = romanToArabic(extractCoreName(input));
    const coreRef = referenceData.core;

    // Check if core names match exactly (allow 2+ char names for short settlements like Ág, Őr, Bő, Sé)
    if (coreInput === coreRef && coreInput.length >= 2) {
        return 'exact';
    }

    // If reference core name is found in input, it's valid (min 2 chars for short settlements)
    if (coreRef.length >= 2 && coreInput.includes(coreRef)) {
        return 'exact';
    }

    // If input core name is found in reference, it's valid (min 2 chars for short settlements)
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

// Validate a single KSH + name pair
function validateEntry(ksh, onev) {
    const trimmedKsh = ksh.trim();
    const trimmedOnev = onev.trim();

    if (!trimmedKsh || !trimmedOnev) {
        return { status: 'invalid', correctName: '', message: 'Hiányzó adat' };
    }

    const referenceData = dataMap.get(trimmedKsh);

    if (!referenceData) {
        return { status: 'invalid', correctName: '', message: 'Ismeretlen KSH kód' };
    }

    const matchType = fuzzyMatchNames(trimmedOnev, referenceData);

    if (matchType === 'exact') {
        return { status: 'valid', correctName: referenceData.original, message: 'Helyes' };
    } else if (matchType === 'fuzzy') {
        return { status: 'warning', correctName: referenceData.original, message: 'Eltérés' };
    } else {
        return { status: 'invalid', correctName: referenceData.original, message: 'Hibás név' };
    }
}
