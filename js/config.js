// Configuration and Constants

// Cache configuration
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const STORAGE_KEY = 'kshData';
const STORAGE_TIMESTAMP = 'kshDataTimestamp';

// List of administrative/common words to ignore in comparisons
const IGNORED_WORDS = [
    'onkormanyzat', 'onkormanyzata', 'nagykozseg', 'nagykozsegi', 'kozseg', 'kozsegi',
    'telepules', 'varos', 'varosi', 'fovaros', 'fovarosi','kerulet', 'ker', 'megye', 'megyei',
    'varmegye', 'varmegyei'
];

// Pre-compiled regex for ignored words (optimize performance)
const IGNORED_WORDS_REGEX = new RegExp(
    '\\b(' + IGNORED_WORDS.join('|') + ')\\b',
    'gi'
);

// Pre-compiled regex map for Roman numerals (optimize performance)
const ROMAN_REGEX_MAP = [
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

// Validation result limit
const MAX_SEARCH_RESULTS = 1000;
