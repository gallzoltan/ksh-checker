// UI Functions - Search, Bulk Validate, Export

const SEARCH_DEBOUNCE_MS = 250; // Debounce delay
let searchDebounceTimer = null;

function handleSearch(event) {
    // Clear previous timer
    if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
    }

    // Debounce search
    searchDebounceTimer = setTimeout(() => {
        performSearch(event.target.value.trim().toLowerCase());
    }, SEARCH_DEBOUNCE_MS);
}

function performSearch(searchTerm) {
    if (!searchTerm || dataMap.size === 0) {
        displaySearchResults([]);
        return;
    }

    const results = [];

    // Optimized search with early termination
    for (let [ksh, data] of dataMap) {
        if (data.kshLower.includes(searchTerm) || data.lower.includes(searchTerm)) {
            results.push({ ksh, onev: data.original });

            // Early termination if we have enough results
            if (results.length >= MAX_SEARCH_RESULTS) {
                break;
            }
        }
    }

    displaySearchResults(results, searchTerm);
}

function displaySearchResults(results, searchTerm = '') {
    const resultsBody = document.getElementById('searchResults');
    const statsDiv = document.getElementById('searchStats');

    if (results.length === 0) {
        resultsBody.innerHTML = '<tr><td colspan="2" class="text-center text-muted">Nincs találat</td></tr>';
        statsDiv.innerHTML = 'Találatok száma: <strong>0</strong>';
        return;
    }

    // Limitáljuk az eredményeket (már a keresésben limitáltuk, de biztonsági check)
    const displayResults = results.slice(0, MAX_SEARCH_RESULTS);

    // Create regex once, outside the loop
    const regex = searchTerm ? new RegExp(`(${escapeRegex(searchTerm)})`, 'gi') : null;

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

    statsDiv.innerHTML = `Találatok száma: <strong>${results.length}</strong>${results.length >= MAX_SEARCH_RESULTS ? ' (első ' + MAX_SEARCH_RESULTS + ' megjelenítve)' : ''}`;
}

function handleBulkValidate() {
    const input = document.getElementById('bulkInput').value;
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

        let status = 'error'; // default: invalid KSH code
        let correctName = '';

        if (data) {
            correctName = data.original;
            // KSH code exists, now check name matching (pass pre-computed data object)
            const matchResult = fuzzyMatchNames(onev, data);

            if (matchResult === 'exact') {
                status = 'valid';
            } else if (matchResult === 'fuzzy') {
                status = 'warning';
            } else {
                status = 'error'; // KSH code valid but name doesn't match
            }
        } else {
            // KSH code doesn't exist
            status = 'error';
        }

        results.push({
            index: index + 1,
            ksh,
            onev,
            correctName,
            status
        });
    });

    displayBulkResults(results);
}

function displayBulkResults(results) {
    const resultsBody = document.getElementById('bulkResults');
    const statsDiv = document.getElementById('bulkStats');
    const exportBtn = document.getElementById('exportBtn');

    // Calculate statistics in a single pass for better performance
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

    // Clear and append in one operation
    resultsBody.innerHTML = '';
    resultsBody.appendChild(fragment);

    // Update statistics
    document.getElementById('totalCount').textContent = results.length;
    document.getElementById('validCount').textContent = validCount;

    // Add warning count display
    const invalidCountElement = document.getElementById('invalidCount');
    invalidCountElement.textContent = invalidCount;

    // Insert warning count after valid count if it doesn't exist yet
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
    window.lastBulkResults = results;
    window.currentFilter = 'all'; // Reset filter when new results are displayed
}

function filterResults(filter) {
    if (!window.lastBulkResults || window.lastBulkResults.length === 0) {
        return;
    }

    window.currentFilter = filter;

    // Filter results based on selected filter
    let filteredResults = window.lastBulkResults;
    if (filter === 'valid') {
        filteredResults = window.lastBulkResults.filter(r => r.status === 'valid');
    } else if (filter === 'invalid') {
        filteredResults = window.lastBulkResults.filter(r => r.status === 'invalid' || r.status === 'error');
    } else if (filter === 'warning') {
        filteredResults = window.lastBulkResults.filter(r => r.status === 'warning');
    }

    // Display filtered results
    const resultsBody = document.getElementById('bulkResults');
    const fragment = document.createDocumentFragment();

    filteredResults.forEach(item => {
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

    // Clear and append in one operation
    resultsBody.innerHTML = '';
    resultsBody.appendChild(fragment);

    // Update visual feedback for active filter
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

function handleExport() {
    if (!window.lastBulkResults || window.lastBulkResults.length === 0) {
        alert('Nincs exportálható eredmény!');
        return;
    }

    const csvContent = [
        ['Sorszám', 'Megadott KSH', 'Megadott Név', 'Helyes Név', 'Státusz'],
        ...window.lastBulkResults.map(r => {
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

function handleClear() {
    document.getElementById('bulkInput').value = '';
    document.getElementById('bulkResults').innerHTML =
        '<tr><td colspan="5" class="text-center text-muted">Az eredmények itt jelennek meg</td></tr>';
    document.getElementById('bulkStats').style.display = 'none';
    document.getElementById('exportBtn').style.display = 'none';
    window.lastBulkResults = null;
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

function showMainContent() {
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('toggleCsvBtn').style.display = 'inline-block';
    // Automatikusan az összes adat megjelenítése (optimized)
    displaySearchResults(Array.from(dataMap.entries()).map(([ksh, data]) => ({ ksh, onev: data.original })));
}

function updateStatus(message, type) {
    const statusDiv = document.getElementById('loadStatus');
    const statusText = document.getElementById('statusText');
    statusText.textContent = message;
    statusDiv.className = `alert alert-${type}`;
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toggleCustomCsv() {
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
