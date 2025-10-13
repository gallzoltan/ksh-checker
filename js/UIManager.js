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
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e));
        document.getElementById('clearSearchBtn').addEventListener('click', () => this.clearSearch());
        document.getElementById('validateBtn').addEventListener('click', () => this.handleBulkValidate());
        document.getElementById('exportBtn').addEventListener('click', () => this.handleExport());
        document.getElementById('clearBtn').addEventListener('click', () => this.handleClear());

        // Add event listeners for filter badges (event delegation)
        const bulkStats = document.getElementById('bulkStats');
        bulkStats.addEventListener('click', (e) => {
            const badge = e.target.closest('[data-filter]');
            if (badge) {
                const filter = badge.getAttribute('data-filter');
                this.filterResults(filter);
            }
        });

        // Keyboard support for filter badges
        bulkStats.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const badge = e.target.closest('[data-filter]');
                if (badge) {
                    e.preventDefault();
                    const filter = badge.getAttribute('data-filter');
                    this.filterResults(filter);
                }
            }
        });
    }

    /**
     * Handle search input with debouncing
     */
    handleSearch(event) {
        const searchTerm = event.target.value;
        const clearBtn = document.getElementById('clearSearchBtn');

        // Show/hide clear button
        if (searchTerm.trim()) {
            clearBtn.classList.add('visible');
        } else {
            clearBtn.classList.remove('visible');
        }

        // Clear previous timer
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }

        // Debounce search
        this.searchDebounceTimer = setTimeout(() => {
            this.performSearch(searchTerm.trim().toLowerCase());
        }, Config.SEARCH_DEBOUNCE_MS);
    }

    /**
     * Clear search input
     */
    clearSearch() {
        const searchInput = document.getElementById('searchInput');
        const clearBtn = document.getElementById('clearSearchBtn');

        searchInput.value = '';
        clearBtn.classList.remove('visible');
        searchInput.focus();

        // Trigger search to reset results
        this.performSearch('');
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
     * Show/hide progress bar
     */
    showProgress(show) {
        const progressContainer = document.getElementById('progressContainer');
        const validateBtn = document.getElementById('validateBtn');

        progressContainer.style.display = show ? 'block' : 'none';
        validateBtn.disabled = show;

        if (!show) {
            this.updateProgress(0, 0);
        }
    }

    /**
     * Update progress bar
     */
    updateProgress(current, total) {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');

        const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

        progressBar.style.width = percentage + '%';
        progressBar.setAttribute('aria-valuenow', percentage);
        progressText.textContent = `${current} / ${total} (${percentage}%)`;
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toastId = 'toast-' + Date.now();

        const bgClass = {
            'success': 'bg-success',
            'error': 'bg-danger',
            'warning': 'bg-warning',
            'info': 'bg-info'
        }[type] || 'bg-info';

        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `toast align-items-center text-white ${bgClass} border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');

        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Bezárás"></button>
            </div>
        `;

        container.appendChild(toast);

        const bsToast = new bootstrap.Toast(toast, { delay: 4000 });
        bsToast.show();

        // Remove from DOM after hiding
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    /**
     * Handle bulk validation
     */
    async handleBulkValidate() {
        const input = document.getElementById('bulkInput').value;
        const dataMap = this.dataProcessor.getData();

        if (!input.trim()) {
            this.showToast('Kérem, illesszen be adatokat!', 'warning');
            return;
        }

        if (dataMap.size === 0) {
            this.showToast('Kérem, először töltsön be egy CSV fájlt!', 'error');
            return;
        }

        const lines = input.split('\n').filter(line => line.trim());
        const entries = [];

        // Parse all lines into entries for processing
        lines.forEach((line, index) => {
            const parts = line.split('\t');
            const ksh = parts[0] ? parts[0].trim().replace(/"/g, '') : '';
            const onev = parts[1] ? parts[1].trim().replace(/"/g, '') : '';

            if (!ksh && !onev) {
                return; // Skip empty lines
            }

            entries.push({
                index: index + 1,
                ksh,
                onev,
                parts: parts
            });
        });

        if (entries.length === 0) {
            this.showToast('Nincs feldolgozható adat!', 'warning');
            return;
        }

        // Show progress bar and initialize
        this.showProgress(true);
        const totalEntries = entries.length;
        this.updateProgress(0, totalEntries);

        try {
            // Process entries with validation logic (async with batching)
            const processedEntries = [];

            // Adaptive batch size based on data volume
            const batchSize = entries.length < 100 ? 5 :    // Small datasets: frequent updates
                              entries.length < 500 ? 10 :   // Medium datasets: balanced
                              20;                           // Large datasets: performance priority

            // Process entries in batches
            for (let batchStart = 0; batchStart < entries.length; batchStart += batchSize) {
                const batchEnd = Math.min(batchStart + batchSize, entries.length);
                const batch = entries.slice(batchStart, batchEnd);

                // Process each entry in the current batch
                for (const entry of batch) {
                    let ksh = entry.ksh;
                    let onev = entry.onev;
                    let status = 'error';
                    let correctName = '';
                    let inputName = '';

                    // Single column input - auto-detect type
                    if (entry.parts.length === 1 && ksh) {
                        const isNumeric = /^\d+$/.test(ksh);

                        if (isNumeric) {
                            // Case 1: Only KSH code provided
                            ksh = ksh.padStart(7, '0');
                            const data = dataMap.get(ksh);
                            if (data) {
                                inputName = '';
                                onev = data.original;
                                correctName = data.original;
                                status = 'auto-filled-ksh';
                            }
                        } else {
                            // Case 2: Only name provided
                            inputName = ksh;
                            onev = ksh;
                            ksh = '';
                            const found = this.validator.findByName(onev, dataMap);
                            if (found) {
                                ksh = found.ksh;
                                correctName = found.onev;
                                status = found.matchType === 'exact' ? 'auto-filled-name' : 'auto-filled-fuzzy';
                            }
                        }
                    } else if (ksh && onev) {
                        // Case 3: Both provided
                        inputName = onev;
                        ksh = ksh.padStart(7, '0');
                        processedEntries.push({
                            index: entry.index,
                            ksh: ksh,
                            onev: onev,
                            inputName: inputName
                        });
                        continue; // Skip adding to processedEntries again
                    } else if (ksh && !onev) {
                        // Case 4: Only KSH (TAB-separated)
                        inputName = '';
                        ksh = ksh.padStart(7, '0');
                        const data = dataMap.get(ksh);
                        if (data) {
                            onev = data.original;
                            correctName = data.original;
                            status = 'auto-filled-ksh';
                        }
                    } else if (!ksh && onev) {
                        // Case 5: Only name (TAB-separated)
                        inputName = onev;
                        const found = this.validator.findByName(onev, dataMap);
                        if (found) {
                            ksh = found.ksh;
                            correctName = found.onev;
                            status = found.matchType === 'exact' ? 'auto-filled-name' : 'auto-filled-fuzzy';
                        }
                    }

                    // Add auto-filled results (Case 3 already added above)
                    if (status && status !== 'error') {
                        processedEntries.push({
                            index: entry.index,
                            ksh: ksh,
                            onev: inputName || onev,
                            correctName: correctName,
                            status: status,
                            inputName: inputName
                        });
                    }
                }

                // Yield to UI after each batch
                this.updateProgress(batchEnd, totalEntries);
                await new Promise(resolve => setTimeout(resolve, 0));
            }

            // Final update for pre-processing
            this.updateProgress(entries.length, totalEntries);

            // Filter entries that need validation
            const toValidate = processedEntries.filter(e => !e.status && e.ksh && e.onev);
            const noValidation = processedEntries.filter(e => e.status);

            let validated = [];

            // Validate entries (validation doesn't update progress to avoid jumping back)
            if (toValidate.length > 0) {
                validated = await this.validator.validateEntriesAsync(
                    toValidate,
                    dataMap,
                    null // No progress callback to avoid progress bar jumping back
                );
            }

            // Combine results
            const allResults = [...noValidation, ...validated].sort((a, b) => a.index - b.index);

            // Hide progress bar
            this.showProgress(false);

            // Display results
            this.displayBulkResults(allResults);
        } catch (error) {
            console.error('Validation error:', error);
            this.showProgress(false);
            this.showToast('Hiba történt a validálás során: ' + error.message, 'error');
        }
    }

    /**
     * Create table row element for bulk result
     * @private
     */
    createBulkResultRow(item) {
        const tr = document.createElement('tr');

        // Set row class based on status
        if (item.status === 'valid' || item.status === 'auto-filled-ksh' || item.status === 'auto-filled-name') {
            tr.className = 'valid-row';
        } else if (item.status === 'warning' || item.status === 'auto-filled-fuzzy') {
            tr.className = 'warning-row';
        } else {
            tr.className = 'invalid-row';
        }

        // Get badge HTML based on status
        let badge;
        if (item.status === 'valid') {
            badge = '<span class="badge bg-success">✓ Helyes</span>';
        } else if (item.status === 'auto-filled-ksh') {
            badge = '<span class="badge bg-info">🔍 KSH → Név</span>';
        } else if (item.status === 'auto-filled-name') {
            badge = '<span class="badge bg-info">🔍 Név → KSH</span>';
        } else if (item.status === 'auto-filled-fuzzy') {
            badge = '<span class="badge bg-warning text-dark">⚠ Név → KSH (közelítő)</span>';
        } else if (item.status === 'warning') {
            badge = '<span class="badge bg-warning text-dark">⚠ Figyelmeztető</span>';
        } else {
            badge = '<span class="badge bg-danger">✗ Hibás</span>';
        }

        // Build row content
        tr.innerHTML = `
            <td>${item.index}</td>
            <td>${item.ksh}</td>
            <td>${item.onev}</td>
            <td>${item.correctName || '<em class="text-danger">Nem található</em>'}</td>
            <td class="text-center">${badge}</td>
        `;

        return tr;
    }

    /**
     * Render bulk results to table
     * @private
     */
    renderBulkResultsTable(results) {
        const resultsBody = document.getElementById('bulkResults');
        const fragment = document.createDocumentFragment();

        results.forEach(item => {
            fragment.appendChild(this.createBulkResultRow(item));
        });

        resultsBody.innerHTML = '';
        resultsBody.appendChild(fragment);
    }

    /**
     * Display bulk validation results
     */
    displayBulkResults(results) {
        const statsDiv = document.getElementById('bulkStats');
        const exportBtn = document.getElementById('exportBtn');

        // Calculate statistics
        const stats = results.reduce((acc, r) => {
            if (r.status === 'valid' || r.status === 'auto-filled-ksh' || r.status === 'auto-filled-name') {
                acc.valid++;
            } else if (r.status === 'warning' || r.status === 'auto-filled-fuzzy') {
                acc.warning++;
            } else {
                acc.invalid++;
            }
            return acc;
        }, { valid: 0, warning: 0, invalid: 0 });

        const validCount = stats.valid;
        const warningCount = stats.warning;
        const invalidCount = stats.invalid;
        const accuracy = results.length > 0 ? ((validCount / results.length) * 100).toFixed(1) : 0;

        // Render table using shared method
        this.renderBulkResultsTable(results);

        // Update statistics
        document.getElementById('totalCount').textContent = results.length;
        document.getElementById('validCount').textContent = validCount;
        document.getElementById('warningCount').textContent = warningCount;
        document.getElementById('invalidCount').textContent = invalidCount;
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
            filteredResults = this.lastBulkResults.filter(r =>
                r.status === 'valid' ||
                r.status === 'auto-filled-ksh' ||
                r.status === 'auto-filled-name'
            );
        } else if (filter === 'invalid') {
            filteredResults = this.lastBulkResults.filter(r =>
                r.status === 'invalid' ||
                r.status === 'error'
            );
        } else if (filter === 'warning') {
            filteredResults = this.lastBulkResults.filter(r =>
                r.status === 'warning' ||
                r.status === 'auto-filled-fuzzy'
            );
        }

        // Render using shared method
        this.renderBulkResultsTable(filteredResults);

        // Update visual feedback
        ['totalCount', 'validCount', 'warningCount', 'invalidCount'].forEach(id => {
            const element = document.getElementById(id);
            element.style.fontWeight = 'normal';
            element.style.textDecoration = 'none';
        });

        const activeElement = filter === 'all' ? 'totalCount' :
                             filter === 'valid' ? 'validCount' :
                             filter === 'warning' ? 'warningCount' : 'invalidCount';
        const element = document.getElementById(activeElement);
        element.style.fontWeight = 'bold';
        element.style.textDecoration = 'underline';
    }

    /**
     * Handle export
     */
    handleExport() {
        if (!this.lastBulkResults || this.lastBulkResults.length === 0) {
            this.showToast('Nincs exportálható eredmény!', 'warning');
            return;
        }

        const csvContent = [
            ['Megadott KSH', 'Megadott Név', 'Helyes Név', 'Státusz'],
            ...this.lastBulkResults.map(r => {
                let statusText = 'Hibás';
                if (r.status === 'valid') {
                    statusText = 'Helyes';
                } else if (r.status === 'auto-filled-ksh') {
                    statusText = 'KSH → Név';
                } else if (r.status === 'auto-filled-name') {
                    statusText = 'Név → KSH';
                } else if (r.status === 'auto-filled-fuzzy') {
                    statusText = 'Név → KSH (közelítő)';
                } else if (r.status === 'warning') {
                    statusText = 'Figyelmeztető';
                }

                return [
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

        this.showToast('CSV export sikeresen letöltve!', 'success');
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

        // Display all data initially
        this.displaySearchResults(
            Array.from(dataMap.entries()).map(([ksh, data]) => ({ ksh, onev: data.original }))
        );
    }

    /**
     * Escape regex special characters
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

}
