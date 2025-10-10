// App Class - Main application orchestration

class App {
    constructor() {
        // Initialize all managers and processors
        this.nameNormalizer = new NameNormalizer();
        this.validator = new Validator(this.nameNormalizer);
        this.cacheManager = new CacheManager();
        this.dataProcessor = new DataProcessor(this.validator, this.nameNormalizer);
        this.uiManager = new UIManager(this.dataProcessor, this.validator);

        // P1: Link validator to dataProcessor for reverse index access
        this.validator.setDataProcessor(this.dataProcessor);
    }

    /**
     * Initialize the application
     */
    async init() {
        // Setup event listeners
        this.uiManager.setupEventListeners();

        // Load data (from cache or default CSV)
        this.dataProcessor.loadData(
            this.cacheManager,
            // onProgress callback
            (message, type) => {
                this.uiManager.updateStatus(message, type);
            },
            // onComplete callback
            () => {
                this.uiManager.showLoading(false);
                this.uiManager.showMainContent();
            },
            // onError callback
            (error) => {
                this.uiManager.updateStatus(error, 'danger');
                this.uiManager.showLoading(false);
            }
        );
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.app = new App();
    window.app.init();
});
