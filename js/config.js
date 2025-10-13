// Configuration Class - Static constants and settings

class Config {
    // Cache configuration
    static CACHE_VERSION = '3.0'; // Increment when data structure changes (v3.0: Budapest district core name extraction)
    static CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    static STORAGE_KEY = 'kshData';
    static STORAGE_TIMESTAMP = 'kshDataTimestamp';
    static STORAGE_VERSION = 'kshDataVersion';

    // Search configuration
    static SEARCH_DEBOUNCE_MS = 250; // Debounce delay for search
    static MAX_SEARCH_RESULTS = 1000; // Maximum search results to display

    // List of administrative/common words to ignore in comparisons
    static IGNORED_WORDS = [
        'onkormanyzat', 'onkormanyzata', 'onkormanyzat*', 'nagykozseg', 'nagykozsegi', 'kozseg', 'kozsegi',
        'telepules', 'telepulesi', 'varos', 'varosi', 'fovaros', 'fovarosi'
    ];

    // Pre-compiled regex for ignored words (optimize performance)
    static IGNORED_WORDS_REGEX = new RegExp(
        '\\b(' + Config.IGNORED_WORDS.join('|') + ')\\b',
        'gi'
    );

    // Roman numeral to Arabic conversion lookup map (optimized single-pass)
    static ROMAN_TO_ARABIC = {
        'XXIII': '23', 'XXII': '22', 'XXI': '21', 'XX': '20',
        'XIX': '19', 'XVIII': '18', 'XVII': '17', 'XVI': '16',
        'XV': '15', 'XIV': '14', 'XIII': '13', 'XII': '12',
        'XI': '11', 'X': '10', 'IX': '9', 'VIII': '8',
        'VII': '7', 'VI': '6', 'V': '5', 'IV': '4',
        'III': '3', 'II': '2', 'I': '1'
    };

    // Single pre-compiled regex for all Roman numerals (50-60% faster than multiple regex passes)
    static ROMAN_REGEX = /\b(XXIII|XXII|XXI|XX|XIX|XVIII|XVII|XVI|XV|XIV|XIII|XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I)\b/gi;

    // Budapest district nicknames to remove (these are not in the official database)
    static DISTRICT_NICKNAMES = [
        'belvaros', 'lipotvaros', 'belvaros-lipotvaros', 'belvaros lipotvaros',
        'obuda', 'bekasmegyer', 'obuda-bekasmegyer',
        'erzsebetvaros',
        'ujlipotvaros',
        'terezvaros',
        'ferencvaros',
        'jozsefvaros',
        'kobanya',
        'ujpest',
        'kerepesdulo', 'kerepesi',
        'angyalfold',
        'zuglo',
        'pesterzsebet',
        'rakosmente',
        'csepel',
        'budafok', 'teteny', 'budafok-teteny',
        'kispes', 'kispest',
        'pestszentlorinc', 'pestszentimre', 'pestszentlorinc-pestszentimre',
        'wekerle', 'wekerletelep',
        'pestlorinc', 'pestimre'
    ];

    // Pre-compiled regex for district nicknames
    // Note: No word boundaries (\b) for compound words with hyphens like "pestszentlorinc-pestszentimre"
    static DISTRICT_NICKNAMES_REGEX = new RegExp(
        '(' + Config.DISTRICT_NICKNAMES.join('|') + ')',
        'gi'
    );
}
