// UIManager Class - UI operations and DOM manipulation

class UIManager {
    constructor(dataProcessor, validator) {
        this.dataProcessor = dataProcessor;
        this.validator = validator;
        this.searchDebounceTimer = null;
        this.lastBulkResults = null;
        this.currentFilter = 'all';
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        document.getElementById('csvFile').addEventListener('change', (e) => this.handleFileSelect(e));
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e));
        document.getElementById('validateBtn').addEventListener('click', () => this.handleBulkValidate());
        document.getElementById('exportBtn').addEventListener('click', () => this.handleExport());
        document.getElementById('clearBtn').addEventListener('click', () => this.handleClear());
        document.getElementById('toggleCsvBtn').addEventListener('click', () => this.toggleCustomCsv());
    }

    /**
     * Handle file selection
     */
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.showLoading(true);

        this.dataProcessor.loadFromFile(
            file,
            (message, type) => this.updateStatus(message, type),
            () => {
                // On complete
                this.showLoading(false);
                this.showMainContent();
            },
            (error) => {
                // On error
                this.updateStatus(error, 'danger');
                this.showLoading(false);
            }
        );
    }

    /**
     * Handle search input with debouncing
     */
    handleSearch(event) {
        // Clear previous timer
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }

        // Debounce search
        this.searchDebounceTimer = setTimeout(() => {
            this.performSearch(event.target.value.trim().toLowerCase());
        }, Config.SEARCH_DEBOUNCE_MS);
    }

    /**
     * Perform search operation
     */
    performSearch(searchTerm) {
        const dataMap = this.dataProcessor.getData();

        if (!searchTerm || dataMap.size === 0) {
            this.displaySearchResults([]);
            return;
        }

        const results = [];

        // Optimized search with early termination
        for (let [ksh, data] of dataMap) {
            if (data.kshLower.includes(searchTerm) || data.lower.includes(searchTerm)) {
                results.push({ ksh, onev: data.original });

                // Early termination if we have enough results
                if (results.length >= Config.MAX_SEARCH_RESULTS) {
                    break;
                }
            }
        }

        this.displaySearchResults(results, searchTerm);
    }

    /**
     * Display search results
     */
    displaySearchResults(results, searchTerm = '') {
        const resultsBody = document.getElementById('searchResults');
        const statsDiv = document.getElementById('searchStats');

        if (results.length === 0) {
            resultsBody.innerHTML = '<tr><td colspan="2" class="text-center text-muted">Nincs találat</td></tr>';
            statsDiv.innerHTML = 'Találatok száma: <strong>0</strong>';
            return;
        }

        // Limit results
        const displayResults = results.slice(0, Config.MAX_SEARCH_RESULTS);

        // Create regex once, outside the loop
        const regex = searchTerm ? new RegExp(`(${this.escapeRegex(searchTerm)})`, 'gi') : null;

        // Use DocumentFragment for better performance
        const fragment = document.createDocumentFragment();

        displayResults.forEach(item => {
            const tr = document.createElement('tr');
            const tdKsh = document.createElement('td');
            const tdOnev = document.createElement('td');

            // Highlighting
            if (regex) {
                tdKsh.innerHTML = item.ksh.replace(regex, '<span class="highlight">$1</span>');
                tdOnev.innerHTML = item.onev.replace(regex, '<span class="highlight">$1</span>');
            } else {
                tdKsh.textContent = item.ksh;
                tdOnev.textContent = item.onev;
            }

            tr.appendChild(tdKsh);
            tr.appendChild(tdOnev);
            fragment.appendChild(tr);
        });

        // Clear and append in one operation
        resultsBody.innerHTML = '';
        resultsBody.appendChild(fragment);

        statsDiv.innerHTML = `Találatok száma: <strong>${results.length}</strong>${results.length >= Config.MAX_SEARCH_RESULTS ? ' (első ' + Config.MAX_SEARCH_RESULTS + ' megjelenítve)' : ''}`;
    }

    /**
     * Handle bulk validation
     */
    handleBulkValidate() {
        const input = document.getElementById('bulkInput').value;
        const dataMap = this.dataProcessor.getData();

        if (!input.trim()) {
            alert('Kérem, illesszen be adatokat!');
            return;
        }

        if (dataMap.size === 0) {
            alert('Kérem, először töltsön be egy CSV fájlt!');
            return;
        }

        const lines = input.split('\n').filter(line => line.trim());
        const results = [];

        lines.forEach((line, index) => {
            const parts = line.split('\t');
            if (parts.length < 2) return;

            // Normalize KSH code: pad with leading zeros to 7 digits
            let ksh = parts[0].trim().replace(/"/g, '');
            ksh = ksh.padStart(7, '0');

            const onev = parts[1].trim().replace(/"/g, '');
            const data = dataMap.get(ksh);

            let status = 'error';
            let correctName = '';

            if (data) {
                correctName = data.original;
                const matchResult = this.validator.fuzzyMatchNames(onev, data);

                if (matchResult === 'exact') {
                    status = 'valid';
                } else if (matchResult === 'fuzzy') {
                    status = 'warning';
                } else {
                    status = 'error';
                }
            }

            results.push({
                index: index + 1,
                ksh,
                onev,
                correctName,
                status
            });
        });

        this.displayBulkResults(results);
    }

    /**
     * Display bulk validation results
     */
    displayBulkResults(results) {
        const resultsBody = document.getElementById('bulkResults');
        const statsDiv = document.getElementById('bulkStats');
        const exportBtn = document.getElementById('exportBtn');

        // Calculate statistics
        const stats = results.reduce((acc, r) => {
            if (r.status === 'valid') acc.valid++;
            else if (r.status === 'warning') acc.warning++;
            else acc.invalid++;
            return acc;
        }, { valid: 0, warning: 0, invalid: 0 });

        const validCount = stats.valid;
        const warningCount = stats.warning;
        const invalidCount = stats.invalid;
        const accuracy = results.length > 0 ? ((validCount / results.length) * 100).toFixed(1) : 0;

        // Use DocumentFragment for better DOM performance
        const fragment = document.createDocumentFragment();

        results.forEach(item => {
            const tr = document.createElement('tr');

            // Set row class based on status
            tr.className = item.status === 'valid' ? 'valid-row' :
                           item.status === 'warning' ? 'warning-row' : 'invalid-row';

            // Get badge HTML
            const badge = item.status === 'valid' ? '<span class="badge bg-success">✓ Helyes</span>' :
                          item.status === 'warning' ? '<span class="badge bg-warning text-dark">⚠ Figyelmeztető</span>' :
                          '<span class="badge bg-danger">✗ Hibás</span>';

            // Build row content
            tr.innerHTML = `
                <td>${item.index}</td>
                <td>${item.ksh}</td>
                <td>${item.onev}</td>
                <td>${item.correctName || '<em class="text-danger">Nem található</em>'}</td>
                <td class="text-center">${badge}</td>
            `;

            fragment.appendChild(tr);
        });

        // Clear and append
        resultsBody.innerHTML = '';
        resultsBody.appendChild(fragment);

        // Update statistics
        document.getElementById('totalCount').textContent = results.length;
        document.getElementById('validCount').textContent = validCount;
        document.getElementById('invalidCount').textContent = invalidCount;

        // Add warning count display
        const validCountElement = document.getElementById('validCount');
        let warningElement = document.getElementById('warningCount');
        if (!warningElement) {
            warningElement = document.createElement('span');
            warningElement.id = 'warningCount';
            warningElement.className = 'text-warning fw-bold';

            const warningLabel = document.createElement('span');
            warningLabel.textContent = ' | Figyelmeztető: ';
            warningLabel.className = 'text-muted';

            validCountElement.parentNode.appendChild(warningLabel);
            validCountElement.parentNode.appendChild(warningElement);
        }
        warningElement.textContent = warningCount;

        document.getElementById('accuracy').textContent = accuracy + '%';

        statsDiv.style.display = 'block';
        exportBtn.style.display = 'inline-block';

        // Store results for export and filtering
        this.lastBulkResults = results;
        this.currentFilter = 'all';
    }

    /**
     * Filter bulk results
     */
    filterResults(filter) {
        if (!this.lastBulkResults || this.lastBulkResults.length === 0) {
            return;
        }

        this.currentFilter = filter;

        // Filter results
        let filteredResults = this.lastBulkResults;
        if (filter === 'valid') {
            filteredResults = this.lastBulkResults.filter(r => r.status === 'valid');
        } else if (filter === 'invalid') {
            filteredResults = this.lastBulkResults.filter(r => r.status === 'invalid' || r.status === 'error');
        } else if (filter === 'warning') {
            filteredResults = this.lastBulkResults.filter(r => r.status === 'warning');
        }

        // Display filtered results
        const resultsBody = document.getElementById('bulkResults');
        const fragment = document.createDocumentFragment();

        filteredResults.forEach(item => {
            const tr = document.createElement('tr');
            tr.className = item.status === 'valid' ? 'valid-row' :
                           item.status === 'warning' ? 'warning-row' : 'invalid-row';

            const badge = item.status === 'valid' ? '<span class="badge bg-success">✓ Helyes</span>' :
                          item.status === 'warning' ? '<span class="badge bg-warning text-dark">⚠ Figyelmeztető</span>' :
                          '<span class="badge bg-danger">✗ Hibás</span>';

            tr.innerHTML = `
                <td>${item.index}</td>
                <td>${item.ksh}</td>
                <td>${item.onev}</td>
                <td>${item.correctName || '<em class="text-danger">Nem található</em>'}</td>
                <td class="text-center">${badge}</td>
            `;

            fragment.appendChild(tr);
        });

        resultsBody.innerHTML = '';
        resultsBody.appendChild(fragment);

        // Update visual feedback
        ['totalCount', 'validCount', 'invalidCount'].forEach(id => {
            const element = document.getElementById(id);
            element.style.fontWeight = 'normal';
            element.style.textDecoration = 'none';
        });

        const activeElement = filter === 'all' ? 'totalCount' :
                             filter === 'valid' ? 'validCount' : 'invalidCount';
        const element = document.getElementById(activeElement);
        element.style.fontWeight = 'bold';
        element.style.textDecoration = 'underline';
    }

    /**
     * Handle export
     */
    handleExport() {
        if (!this.lastBulkResults || this.lastBulkResults.length === 0) {
            alert('Nincs exportálható eredmény!');
            return;
        }

        const csvContent = [
            ['Sorszám', 'Megadott KSH', 'Megadott Név', 'Helyes Név', 'Státusz'],
            ...this.lastBulkResults.map(r => {
                let statusText = 'Hibás';
                if (r.status === 'valid') {
                    statusText = 'Helyes';
                } else if (r.status === 'warning') {
                    statusText = 'Figyelmeztető';
                }

                return [
                    r.index,
                    r.ksh,
                    r.onev,
                    r.correctName,
                    statusText
                ];
            })
        ].map(row => row.join(';')).join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `ellenorzes_eredmeny_${new Date().toISOString().slice(0,10)}.csv`;
        link.click();
    }

    /**
     * Handle clear
     */
    handleClear() {
        document.getElementById('bulkInput').value = '';
        document.getElementById('bulkResults').innerHTML =
            '<tr><td colspan="5" class="text-center text-muted">Az eredmények itt jelennek meg</td></tr>';
        document.getElementById('bulkStats').style.display = 'none';
        document.getElementById('exportBtn').style.display = 'none';
        this.lastBulkResults = null;
    }

    /**
     * Show/hide loading spinner
     */
    showLoading(show) {
        document.getElementById('loading').style.display = show ? 'block' : 'none';
    }

    /**
     * Show main content
     */
    showMainContent() {
        const dataMap = this.dataProcessor.getData();
        document.getElementById('mainContent').style.display = 'block';
        document.getElementById('toggleCsvBtn').style.display = 'inline-block';

        // Display all data initially
        this.displaySearchResults(
            Array.from(dataMap.entries()).map(([ksh, data]) => ({ ksh, onev: data.original }))
        );
    }

    /**
     * Update status message
     */
    updateStatus(message, type) {
        const statusDiv = document.getElementById('loadStatus');
        const statusText = document.getElementById('statusText');
        statusText.textContent = message;
        statusDiv.className = `alert alert-${type}`;
    }

    /**
     * Escape regex special characters
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Toggle custom CSV section
     */
    toggleCustomCsv() {
        const csvSection = document.getElementById('customCsvSection');
        const btn = document.getElementById('toggleCsvBtn');

        if (csvSection.style.display === 'none') {
            csvSection.style.display = 'block';
            btn.textContent = '✖️ Mégse';
            btn.classList.remove('btn-outline-secondary');
            btn.classList.add('btn-outline-danger');
        } else {
            csvSection.style.display = 'none';
            btn.textContent = '📂 Egyéni CSV betöltése';
            btn.classList.remove('btn-outline-danger');
            btn.classList.add('btn-outline-secondary');
        }
    }
}

// Global function for onclick handlers in HTML
function filterResults(filter) {
    if (window.app && window.app.uiManager) {
        window.app.uiManager.filterResults(filter);
    }
}
