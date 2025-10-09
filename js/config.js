// Configuration Class - Static constants and settings

class Config {
    // Cache configuration
    static CACHE_VERSION = '2.0'; // Increment when data structure changes
    static CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    static STORAGE_KEY = 'kshData';
    static STORAGE_TIMESTAMP = 'kshDataTimestamp';
    static STORAGE_VERSION = 'kshDataVersion';

    // Search configuration
    static SEARCH_DEBOUNCE_MS = 250; // Debounce delay for search
    static MAX_SEARCH_RESULTS = 1000; // Maximum search results to display

    // List of administrative/common words to ignore in comparisons
    static IGNORED_WORDS = [
        'onkormanyzat', 'onkormanyzata', 'nagykozseg', 'nagykozsegi', 'kozseg', 'kozsegi',
        'telepules', 'telepulesi', 'varos', 'varosi', 'fovaros', 'fovarosi'
    ];

    // Pre-compiled regex for ignored words (optimize performance)
    static IGNORED_WORDS_REGEX = new RegExp(
        '\\b(' + Config.IGNORED_WORDS.join('|') + ')\\b',
        'gi'
    );

    // Pre-compiled regex map for Roman numerals (optimize performance)
    static ROMAN_REGEX_MAP = [
        [/\bXXIII\b/gi, '23'],
        [/\bXXII\b/gi, '22'],
        [/\bXXI\b/gi, '21'],
        [/\bXX\b/gi, '20'],
        [/\bXIX\b/gi, '19'],
        [/\bXVIII\b/gi, '18'],
        [/\bXVII\b/gi, '17'],
        [/\bXVI\b/gi, '16'],
        [/\bXV\b/gi, '15'],
        [/\bXIV\b/gi, '14'],
        [/\bXIII\b/gi, '13'],
        [/\bXII\b/gi, '12'],
        [/\bXI\b/gi, '11'],
        [/\bX\b/gi, '10'],
        [/\bIX\b/gi, '9'],
        [/\bVIII\b/gi, '8'],
        [/\bVII\b/gi, '7'],
        [/\bVI\b/gi, '6'],
        [/\bV\b/gi, '5'],
        [/\bIV\b/gi, '4'],
        [/\bIII\b/gi, '3'],
        [/\bII\b/gi, '2'],
        [/\bI\b/gi, '1']
    ];
}
