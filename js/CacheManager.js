// CacheManager Class - localStorage operations

class CacheManager {
    constructor() {
        this.storageKey = Config.STORAGE_KEY;
        this.timestampKey = Config.STORAGE_TIMESTAMP;
        this.cacheDuration = Config.CACHE_DURATION;
    }

    /**
     * Check if cache is valid (not expired)
     * @returns {boolean}
     */
    isValid() {
        const timestamp = localStorage.getItem(this.timestampKey);
        if (!timestamp) return false;

        const age = new Date().getTime() - parseInt(timestamp);
        return age < this.cacheDuration;
    }

    /**
     * Load data from cache
     * @returns {Map|null} - Returns dataMap or null if cache invalid/empty
     */
    load() {
        if (!this.isValid()) {
            return null;
        }

        const cachedData = localStorage.getItem(this.storageKey);
        if (!cachedData) return null;

        try {
            const parsed = JSON.parse(cachedData);

            // Check if cached data is in Map format (array of [key, value] entries)
            if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0])) {
                // Convert array entries back to Map
                return new Map(parsed);
            }
        } catch (e) {
            console.error('Cache betöltési hiba:', e);
        }

        return null;
    }

    /**
     * Save dataMap to cache
     * @param {Map} dataMap - The data map to save
     */
    save(dataMap) {
        try {
            // Convert Map to array of entries for JSON serialization
            const mapEntries = Array.from(dataMap.entries());
            localStorage.setItem(this.storageKey, JSON.stringify(mapEntries));
            localStorage.setItem(this.timestampKey, new Date().getTime().toString());
        } catch (e) {
            console.error('Cache mentési hiba:', e);
        }
    }

    /**
     * Clear cache
     */
    clear() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.timestampKey);
    }
}
