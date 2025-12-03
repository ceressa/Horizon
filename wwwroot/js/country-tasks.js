// ========== COUNTRY TASKS MODULE V2.1 ========== //
// Enhanced version with all user requirements

'use strict';

let globalData = null;
let filteredData = null;
let allTasks = [];
let currentChart = null;
let currentSortColumn = 'number';
let currentSortDirection = 'desc';
let currentPageSize = 50;
let currentPage = 1;
let modalFilters = {
    assignmentGroup: 'all',
    assignee: 'all'
};

// Exclude UK and US, show all other countries
const EXCLUDED_COUNTRIES = ['GB', 'UK', 'US', 'USA'];

const COUNTRY_NAMES = {
    'TR': 'Turkey',
    'ES': 'Spain',
    'PT': 'Portugal',
    'CH': 'Switzerland',
    'CZ': 'Czech Republic',
    'AT': 'Austria',
    'RO': 'Romania',
    'HU': 'Hungary',
    'GR': 'Greece',
    'BG': 'Bulgaria',
    'SK': 'Slovakia',
    'SI': 'Slovenia',
    'CY': 'Cyprus'
};

const COUNTRY_EMOJI_FLAGS = {
    'TR': '🇹🇷', 'ES': '🇪🇸', 'PT': '🇵🇹', 'CH': '🇨🇭',
    'CZ': '🇨🇿', 'AT': '🇦🇹', 'RO': '🇷🇴', 'HU': '🇭🇺',
    'GR': '🇬🇷', 'BG': '🇧🇬', 'SK': '🇸🇰', 'SI': '🇸🇮',
    'CY': '🇨🇾'
};

// State-based colors for chart
const STATE_COLORS = {
    // Green states (Closed/Resolved)
    'Closed': { bg: 'rgba(34, 197, 94, 0.7)', border: 'rgba(34, 197, 94, 1)' },
    'Resolved': { bg: 'rgba(34, 197, 94, 0.7)', border: 'rgba(34, 197, 94, 1)' },
    'Closed Complete': { bg: 'rgba(34, 197, 94, 0.7)', border: 'rgba(34, 197, 94, 1)' },

    // Yellow states (On Hold)
    'On Hold': { bg: 'rgba(234, 179, 8, 0.7)', border: 'rgba(234, 179, 8, 1)' },

    // Gray states (Canceled/Skipped/Incomplete)
    'Canceled': { bg: 'rgba(156, 163, 175, 0.7)', border: 'rgba(156, 163, 175, 1)' },
    'Closed Incomplete': { bg: 'rgba(156, 163, 175, 0.7)', border: 'rgba(156, 163, 175, 1)' },
    'Closed Skipped': { bg: 'rgba(156, 163, 175, 0.7)', border: 'rgba(156, 163, 175, 1)' },

    // Blue states (In Progress)
    'In Progress': { bg: 'rgba(59, 130, 246, 0.7)', border: 'rgba(59, 130, 246, 1)' },
    'Work in Progress': { bg: 'rgba(59, 130, 246, 0.7)', border: 'rgba(59, 130, 246, 1)' },

    // Default
    'Other': { bg: 'rgba(107, 114, 128, 0.7)', border: 'rgba(107, 114, 128, 1)' }
};

// ========== INITIALIZATION ========== //

async function initializeCountryTasks() {
    const loader = document.getElementById('universalPageLoader');
    const loaderText = document.querySelector('.loader-text');
    const loaderProgress = document.querySelector('.loader-progress-fill');
    const loaderPercentage = document.querySelector('.loader-progress-text');

    try {
        console.log('🚀 Initializing Country Tasks module...');

        // Ensure loader is visible
        if (loader) {
            loader.classList.add('active');
            updateLoaderProgress(10, 'Loading configuration...');
        }

        // Fetch summary data
        updateLoaderProgress(30, 'Fetching country summary...');
        const summaryResponse = await fetch('/Horizon/api/data/country-tasks/summary');

        if (!summaryResponse.ok) {
            let errorDetails = `HTTP ${summaryResponse.status}: ${summaryResponse.statusText}`;
            try {
                const errorData = await summaryResponse.json();
                errorDetails = errorData.error || errorDetails;
                console.error('❌ API Error Details:', errorData);
            } catch (e) {
                const errorText = await summaryResponse.text();
                console.error('❌ API Error Response:', errorText);
            }

            if (window.horizonLogger) {
                window.horizonLogger.logServerError('/api/data/country-tasks/summary', new Error(errorDetails));
            }

            throw new Error(`Failed to fetch summary: ${errorDetails}`);
        }

        globalData = await summaryResponse.json();

        // Exclude UK and US, show all other countries
        globalData.countries = globalData.countries.filter(c =>
            !EXCLUDED_COUNTRIES.includes(c.countryCode.toUpperCase())
        );

        console.log(`✅ Filtered to ${globalData.countries.length} countries (excluding UK/US)`);

        filteredData = globalData;

        console.log('✅ Summary data loaded:', globalData);

        // Fetch all tasks for details and charts
        updateLoaderProgress(60, 'Fetching all tasks...');
        await fetchAllTasks();

        // Render UI components
        updateLoaderProgress(80, 'Rendering interface...');
        renderGlobalStats(globalData.globalStats);
        renderCountryCards(globalData.countries);
        populateCountryFilter(globalData.countries);
        populateAssignmentGroupFilter();

        // Setup event listeners
        setupFilterListeners();

        // Apply Twemoji to render emoji flags as SVG
        updateLoaderProgress(90, 'Rendering flags...');
        if (window.twemoji) {
            twemoji.parse(document.body, {
                folder: 'svg',
                ext: '.svg'
            });
        }

        updateLoaderProgress(100, 'Complete!');
        console.log('✅ Country Tasks module initialized successfully');

    } catch (error) {
        console.error('❌ Error initializing country tasks:', error);
        console.error('Stack trace:', error.stack);

        if (window.horizonLogger) {
            window.horizonLogger.logError('COUNTRY_TASKS_INIT_ERROR', error.message, {
                endpoint: '/api/data/country-tasks/summary',
                stack: error.stack
            });
        }

        showError(error.message);
    } finally {
        // Hide loading screen with smooth fade
        if (loader) {
            setTimeout(() => {
                loader.classList.add('fade-out');
                setTimeout(() => {
                    loader.classList.remove('active', 'fade-out');
                }, 500);
            }, 500);
        }
    }

    function updateLoaderProgress(percent, text) {
        if (loaderText) loaderText.textContent = text;
        if (loaderProgress) loaderProgress.style.width = `${percent}%`;
        if (loaderPercentage) loaderPercentage.textContent = `${percent}%`;
    }
}

// ========== FETCH ALL TASKS ========== //

async function fetchAllTasks() {
    try {
        const response = await fetch('/Horizon/api/data/country-tasks');

        if (!response.ok) {
            let errorDetails = `HTTP ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorDetails = errorData.error || errorDetails;
            } catch (e) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
            }

            if (window.horizonLogger) {
                window.horizonLogger.logServerError('/api/data/country-tasks', new Error(errorDetails));
            }

            throw new Error(`Failed to fetch tasks: ${errorDetails}`);
        }

        allTasks = await response.json();

        // Exclude UK and US, show all other countries
        allTasks = allTasks.filter(task =>
            task.country_code && !EXCLUDED_COUNTRIES.includes(task.country_code.toUpperCase())
        );

        console.log(`✅ Loaded ${allTasks.length} tasks (excluding UK/US)`);
    } catch (error) {
        console.error('❌ Error fetching all tasks:', error);

        if (window.horizonLogger) {
            window.horizonLogger.logError('FETCH_TASKS_ERROR', error.message, {
                endpoint: '/api/data/country-tasks',
                stack: error.stack
            });
        }
    }
}

// ========== RENDER GLOBAL STATS ========== //

function renderGlobalStats(stats) {
    const container = document.getElementById('globalStatsContainer');
    if (!container) return;

    const statCards = [
        {
            icon: 'fa-solid fa-ticket',
            color: '#8b5cf6',
            label: 'Total Tasks',
            value: stats.totalTasks.toLocaleString(),
            subtext: 'INC + SCTASK'
        },
        {
            icon: 'fa-solid fa-triangle-exclamation',
            color: '#ef4444',
            label: 'Incidents',
            value: stats.incidents.toLocaleString(),
            subtext: `${((stats.incidents / stats.totalTasks) * 100).toFixed(1)}% of total`
        },
        {
            icon: 'fa-solid fa-clipboard-list',
            color: '#3b82f6',
            label: 'Service Requests',
            value: stats.requests.toLocaleString(),
            subtext: `${((stats.requests / stats.totalTasks) * 100).toFixed(1)}% of total`
        },
        {
            icon: 'fa-solid fa-circle-check',
            color: '#22c55e',
            label: 'Closed Tasks',
            value: stats.closedTasks.toLocaleString(),
            subtext: `${stats.closedPercentage}% completion rate`
        },
        {
            icon: 'fa-solid fa-fire',
            color: '#dc2626',
            label: 'Critical (P1)',
            value: stats.highPriorityTasks.toLocaleString(),
            subtext: 'Highest priority'
        },
        {
            icon: 'fa-solid fa-clock',
            color: '#f59e0b',
            label: 'Avg Resolution',
            value: `${stats.avgDurationHours.toFixed(1)}h`,
            subtext: 'Average time'
        }
    ];

    container.innerHTML = statCards.map(card => `
        <div class="stat-card">
            <div class="stat-card-icon" style="color: ${card.color};">
                <i class="${card.icon}"></i>
            </div>
            <div class="stat-card-label">${card.label}</div>
            <div class="stat-card-value">${card.value}</div>
            <div class="stat-card-subtext">${card.subtext}</div>
        </div>
    `).join('');
}

// ========== RENDER COUNTRY CARDS ========== //

function renderCountryCards(countries) {
    const container = document.getElementById('countriesContainer');
    if (!container) return;

    if (!countries || countries.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No data available</p>';
        return;
    }

    container.innerHTML = countries.map(country => {
        const countryName = COUNTRY_NAMES[country.countryCode] || country.countryCode;
        const flagEmoji = COUNTRY_EMOJI_FLAGS[country.countryCode] || '🏳️';
        const closedPercentage = ((country.closedTasks / country.totalTasks) * 100).toFixed(1);
        const avgDurationHours = (country.avgDuration / 3600).toFixed(1);

        // Get priority distribution (only for Incidents)
        const priorityDist = Array.from(country.priorityDistribution || []);
        const sortedPriorities = priorityDist.sort((a, b) => {
            const priorityA = parseInt(a.priority) || 999;
            const priorityB = parseInt(b.priority) || 999;
            return priorityA - priorityB; // P1 first, P5 last
        });

        return `
            <div class="country-card" onclick="showCountryDetails('${country.countryCode}')">
                <div class="country-card-header">
                    <div class="country-card-title">
                        <span class="country-flag-emoji">${flagEmoji}</span>
                        <span class="country-name">${countryName}</span>
                    </div>
                    <div class="country-total">${country.totalTasks}</div>
                </div>

                <!-- Split: Incidents vs Requests -->
                <div class="country-type-split">
                    <div class="type-box incident">
                        <div class="type-header">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            <span>Incidents</span>
                        </div>
                        <div class="type-count">${country.incidents}</div>
                        <div class="type-percentage">${((country.incidents / country.totalTasks) * 100).toFixed(1)}% of total</div>
                    </div>

                    <div class="type-box request">
                        <div class="type-header">
                            <i class="fa-solid fa-clipboard-check"></i>
                            <span>Requests</span>
                        </div>
                        <div class="type-count">${country.requests}</div>
                        <div class="type-percentage">${((country.requests / country.totalTasks) * 100).toFixed(1)}% of total</div>
                    </div>
                </div>

                <!-- Additional Stats -->
                <div class="country-stats">
                    <div class="stat-row">
                        <span class="stat-row-label">
                            <i class="fa-solid fa-circle-check" style="color: #22c55e;"></i>
                            Closed
                        </span>
                        <span class="stat-row-value">
                            ${country.closedTasks}
                            <span class="stat-row-percentage">(${closedPercentage}%)</span>
                        </span>
                    </div>

                    <div class="stat-row">
                        <span class="stat-row-label">
                            <i class="fa-solid fa-hourglass-half" style="color: #8b5cf6;"></i>
                            Avg Resolution
                        </span>
                        <span class="stat-row-value">${avgDurationHours}h</span>
                    </div>
                </div>

                <!-- Priority Badges (only for Incidents - P1 = highest) -->
                ${sortedPriorities.length > 0 ? `
                    <div class="priority-badges">
                        <span class="priority-label">Priority Distribution:</span>
                        ${sortedPriorities.map(p => {
                            const pNum = p.priority;
                            const pClass = `p${pNum}`;
                            return `<span class="priority-badge ${pClass}">P${pNum}: ${p.count}</span>`;
                        }).join('')}
                    </div>
                ` : ''}

                <button class="detail-button" onclick="event.stopPropagation(); showCountryDetails('${country.countryCode}')">
                    <i class="fa-solid fa-chart-column"></i> View Details & Chart
                </button>
            </div>
        `;
    }).join('');

    // Apply Twemoji to render flag emojis as SVG
    if (window.twemoji) {
        twemoji.parse(container, {
            folder: 'svg',
            ext: '.svg'
        });
    }
}

// ========== SHOW COUNTRY DETAILS MODAL ========== //

function showCountryDetails(countryCode) {
    const country = filteredData.countries.find(c => c.countryCode === countryCode);
    if (!country) return;

    const countryName = COUNTRY_NAMES[countryCode] || countryCode;
    const flagEmoji = COUNTRY_EMOJI_FLAGS[countryCode] || '🏳️';

    const countryTasks = allTasks.filter(task =>
        task.country_code && task.country_code.toUpperCase() === countryCode.toUpperCase()
    );

    const modal = document.getElementById('taskDetailModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    // Reset modal filters
    modalFilters = { assignmentGroup: 'all', assignee: 'all' };
    currentSortColumn = 'number';
    currentSortDirection = 'desc';
    currentPage = 1;

    // Get unique assignment groups and assignees
    const assignmentGroups = [...new Set(countryTasks.map(t => t.assignment_group).filter(g => g))].sort();
    const assignees = [...new Set(countryTasks.map(t => t.assigned_to).filter(a => a))].sort();

    const stateDist = Array.from(country.stateDistribution || []);
    const topGroups = Array.from(country.topAssignmentGroups || []).slice(0, 5);
    const topAssignees = Array.from(country.topAssignees || []).slice(0, 5);

    modalTitle.innerHTML = `<span class="modal-flag">${flagEmoji}</span><span>${countryName} - Task Details (${countryTasks.length} tasks)</span>`;

    const groupOptions = assignmentGroups.map(g => `<option value="${g}">${g}</option>`).join('');
    const assigneeOptions = assignees.map(a => `<option value="${a}">${a}</option>`).join('');

    modalBody.innerHTML = `
        <div class="chart-section" style="background: var(--card-bg); padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem;">
            <h4 style="color: var(--text-primary); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <i class="fa-solid fa-chart-column"></i> Monthly Task Trend by State
            </h4>
            <div class="chart-controls" style="display: flex; gap: 0.5rem; justify-content: center; margin-bottom: 1.5rem;">
                <button class="chart-pill-btn active" data-period="3m" onclick="updateChartPeriod('${countryCode}', '3m')">3 Months</button>
                <button class="chart-pill-btn" data-period="6m" onclick="updateChartPeriod('${countryCode}', '6m')">6 Months</button>
                <button class="chart-pill-btn" data-period="1y" onclick="updateChartPeriod('${countryCode}', '1y')">1 Year</button>
            </div>
            <div class="chart-container" style="position: relative; height: 300px;"><canvas id="monthlyTaskChart"></canvas></div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
            <div>
                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">Filter by Assignment Group</label>
                <select id="modalFilterGroup" class="filter-select" style="width: 100%; padding: 0.5rem; background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary);">
                    <option value="all">All Groups</option>${groupOptions}
                </select>
            </div>
            <div>
                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">Filter by Assignee</label>
                <select id="modalFilterAssignee" class="filter-select" style="width: 100%; padding: 0.5rem; background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary);">
                    <option value="all">All Assignees</option>${assigneeOptions}
                </select>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
            <div><h4 style="color: var(--text-secondary); margin-bottom: 0.5rem; font-size: 0.875rem;">STATE DISTRIBUTION</h4>
                ${stateDist.map(s => `<div style="display: flex; justify-content: space-between; padding: 0.5rem; background: var(--input-bg); border-radius: 6px; margin-bottom: 0.5rem;"><span style="font-size: 0.875rem;">${s.state}</span><span style="font-weight: 600;">${s.count}</span></div>`).join('')}
            </div>
            <div><h4 style="color: var(--text-secondary); margin-bottom: 0.5rem; font-size: 0.875rem;">TOP ASSIGNMENT GROUPS</h4>
                ${topGroups.map(g => `<div style="display: flex; justify-content: space-between; padding: 0.5rem; background: var(--input-bg); border-radius: 6px; margin-bottom: 0.5rem;"><span style="font-size: 0.875rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${g.group}</span><span style="font-weight: 600; margin-left: 0.5rem;">${g.count}</span></div>`).join('')}
            </div>
            <div><h4 style="color: var(--text-secondary); margin-bottom: 0.5rem; font-size: 0.875rem;">TOP ASSIGNEES</h4>
                ${topAssignees.map(a => `<div style="display: flex; justify-content: space-between; padding: 0.5rem; background: var(--input-bg); border-radius: 6px; margin-bottom: 0.5rem;"><span style="font-size: 0.875rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${a.assignee}</span><span style="font-weight: 600; margin-left: 0.5rem;">${a.count}</span></div>`).join('')}
            </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h4 style="color: var(--text-primary); margin: 0;">All Tasks</h4>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
                <span style="color: var(--text-secondary); font-size: 0.875rem;">Show:</span>
                <select id="pageSizeSelect" class="filter-select" style="padding: 0.5rem; background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary);">
                    <option value="10">10</option><option value="50" selected>50</option><option value="100">100</option><option value="all">All</option>
                </select>
            </div>
        </div>
        <div id="tasksTableContainer"></div>
    `;

    modal.classList.add('active');
    if (window.twemoji) twemoji.parse(modal, { folder: 'svg', ext: '.svg' });

    document.getElementById('modalFilterGroup').addEventListener('change', () => {
        modalFilters.assignmentGroup = document.getElementById('modalFilterGroup').value;
        renderTasksTable(countryCode);
    });
    document.getElementById('modalFilterAssignee').addEventListener('change', () => {
        modalFilters.assignee = document.getElementById('modalFilterAssignee').value;
        renderTasksTable(countryCode);
    });
    document.getElementById('pageSizeSelect').addEventListener('change', (e) => {
        currentPageSize = e.target.value === 'all' ? 9999999 : parseInt(e.target.value);
        currentPage = 1;
        renderTasksTable(countryCode);
    });

    renderMonthlyChart(countryCode, '3m');
    renderTasksTable(countryCode);
}

// ========== RENDER TASKS TABLE WITH SORT/FILTER/PAGINATION ========== //

function renderTasksTable(countryCode) {
    const container = document.getElementById('tasksTableContainer');
    if (!container) return;

    let countryTasks = allTasks.filter(task =>
        task.country_code && task.country_code.toUpperCase() === countryCode.toUpperCase()
    );

    // Apply modal filters
    if (modalFilters.assignmentGroup !== 'all') {
        countryTasks = countryTasks.filter(t => t.assignment_group === modalFilters.assignmentGroup);
    }
    if (modalFilters.assignee !== 'all') {
        countryTasks = countryTasks.filter(t => t.assigned_to === modalFilters.assignee);
    }

    // Sort tasks
    countryTasks.sort((a, b) => {
        let aVal = a[currentSortColumn] || '';
        let bVal = b[currentSortColumn] || '';

        if (currentSortColumn === 'number') {
            // Extract numeric part for proper sorting
            const aNum = parseInt(aVal.replace(/[^0-9]/g, '')) || 0;
            const bNum = parseInt(bVal.replace(/[^0-9]/g, '')) || 0;
            return currentSortDirection === 'desc' ? bNum - aNum : aNum - bNum;
        }

        if (currentSortColumn === 'opened' || currentSortColumn === 'business_duration') {
            aVal = new Date(aVal).getTime() || 0;
            bVal = new Date(bVal).getTime() || 0;
            return currentSortDirection === 'desc' ? bVal - aVal : aVal - bVal;
        }

        // String comparison
        return currentSortDirection === 'desc'
            ? String(bVal).localeCompare(String(aVal))
            : String(aVal).localeCompare(String(bVal));
    });

    // Pagination
    const totalTasks = countryTasks.length;
    const totalPages = Math.ceil(totalTasks / currentPageSize);
    const startIdx = (currentPage - 1) * currentPageSize;
    const endIdx = Math.min(startIdx + currentPageSize, totalTasks);
    const paginatedTasks = countryTasks.slice(startIdx, endIdx);

    const sortIcon = (col) => {
        if (currentSortColumn !== col) return '<i class="fa-solid fa-sort" style="opacity: 0.3;"></i>';
        return currentSortDirection === 'desc'
            ? '<i class="fa-solid fa-sort-down"></i>'
            : '<i class="fa-solid fa-sort-up"></i>';
    };

    container.innerHTML = `
        <div style="overflow-x: auto;">
            <table class="task-table" style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: var(--input-bg);">
                        <th onclick="sortTable('number')" style="cursor: pointer; padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--border-color);">Number ${sortIcon('number')}</th>
                        <th onclick="sortTable('short_description')" style="cursor: pointer; padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--border-color);">Description ${sortIcon('short_description')}</th>
                        <th onclick="sortTable('priority')" style="cursor: pointer; padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--border-color);">Priority ${sortIcon('priority')}</th>
                        <th onclick="sortTable('state')" style="cursor: pointer; padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--border-color);">State ${sortIcon('state')}</th>
                        <th onclick="sortTable('opened')" style="cursor: pointer; padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--border-color);">Opened ${sortIcon('opened')}</th>
                        <th onclick="sortTable('assigned_to')" style="cursor: pointer; padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--border-color);">Assigned To ${sortIcon('assigned_to')}</th>
                        <th onclick="sortTable('business_duration')" style="cursor: pointer; padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--border-color);">Duration (h) ${sortIcon('business_duration')}</th>
                    </tr>
                </thead>
                <tbody>
                    ${paginatedTasks.map(task => {
                        const taskType = task.number && task.number.toUpperCase().startsWith('INC') ? 'incident' : 'request';
                        const rowBgColor = taskType === 'incident' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(59, 130, 246, 0.05)';
                        const taskTypeLabel = taskType === 'incident' ? 'INC' : 'REQ';
                        const taskTypeBadgeColor = taskType === 'incident' ? '#ef4444' : '#3b82f6';

                        let stateClass = 'other';
                        if (task.state && task.state.toLowerCase().includes('closed')) stateClass = 'closed';
                        else if (task.state && task.state.toLowerCase().includes('progress')) stateClass = 'progress';

                        const duration = task.business_duration ? (parseFloat(task.business_duration) / 3600).toFixed(1) : '-';
                        const openedDate = task.opened ? new Date(task.opened).toLocaleDateString() : '-';
                        const shortDesc = task.short_description ? (task.short_description.length > 50 ? task.short_description.substring(0, 50) + '...' : task.short_description) : '-';

                        let priorityBadge = '-';
                        if (taskType === 'incident' && task.priority) {
                            const pNum = task.priority;
                            const pClass = `p${pNum}`;
                            priorityBadge = `<span class="priority-badge ${pClass}">P${pNum}</span>`;
                        }

                        const taskJson = JSON.stringify(task).replace(/'/g, '&apos;').replace(/"/g, '&quot;');

                        return `
                            <tr onclick='showTaskDetailPopup(${taskJson})' style="background: ${rowBgColor}; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='var(--input-bg)'" onmouseout="this.style.background='${rowBgColor}'">
                                <td style="padding: 0.75rem; border-bottom: 1px solid var(--border-color);">
                                    <code style="font-size: 0.75rem; background: ${taskTypeBadgeColor}20; color: ${taskTypeBadgeColor}; padding: 0.25rem 0.5rem; border-radius: 4px;">${task.number || '-'}</code>
                                </td>
                                <td style="padding: 0.75rem; border-bottom: 1px solid var(--border-color); max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${task.short_description || ''}">${shortDesc}</td>
                                <td style="padding: 0.75rem; border-bottom: 1px solid var(--border-color);">${priorityBadge}</td>
                                <td style="padding: 0.75rem; border-bottom: 1px solid var(--border-color);"><span class="state-badge ${stateClass}">${task.state || '-'}</span></td>
                                <td style="padding: 0.75rem; border-bottom: 1px solid var(--border-color);">${openedDate}</td>
                                <td style="padding: 0.75rem; border-bottom: 1px solid var(--border-color); max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${task.assigned_to || '-'}</td>
                                <td style="padding: 0.75rem; border-bottom: 1px solid var(--border-color);">${duration}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>

        ${totalPages > 1 ? `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding: 1rem; background: var(--input-bg); border-radius: 8px;">
                <div style="color: var(--text-secondary); font-size: 0.875rem;">
                    Showing ${startIdx + 1}-${endIdx} of ${totalTasks} tasks
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="changePage(${currentPage - 1}, '${countryCode}')" ${currentPage === 1 ? 'disabled' : ''} style="padding: 0.5rem 1rem; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer;" ${currentPage === 1 ? 'style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                        <i class="fa-solid fa-chevron-left"></i> Previous
                    </button>
                    <span style="padding: 0.5rem 1rem; background: var(--card-bg); border-radius: 6px;">Page ${currentPage} of ${totalPages}</span>
                    <button onclick="changePage(${currentPage + 1}, '${countryCode}')" ${currentPage === totalPages ? 'disabled' : ''} style="padding: 0.5rem 1rem; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer;" ${currentPage === totalPages ? 'style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                        Next <i class="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        ` : ''}
    `;
}

function sortTable(column) {
    if (currentSortColumn === column) {
        currentSortDirection = currentSortDirection === 'desc' ? 'asc' : 'desc';
    } else {
        currentSortColumn = column;
        currentSortDirection = 'desc';
    }
    const countryCode = document.querySelector('.modal-flag').textContent.trim();
    const country = filteredData.countries.find(c => COUNTRY_EMOJI_FLAGS[c.countryCode] === countryCode);
    if (country) renderTasksTable(country.countryCode);
}

function changePage(page, countryCode) {
    currentPage = page;
    renderTasksTable(countryCode);
}

// ========== TASK DETAIL POPUP ========== //

function showTaskDetailPopup(task) {
    const popup = document.createElement('div');
    popup.id = 'taskDetailPopup';
    popup.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 2rem;';

    const taskType = task.number && task.number.toUpperCase().startsWith('INC') ? 'Incident' : 'Service Request';
    const taskTypeColor = taskType === 'Incident' ? '#ef4444' : '#3b82f6';

    popup.innerHTML = `
        <div style="background: var(--card-bg); border-radius: 12px; padding: 2rem; max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto; position: relative; border: 2px solid ${taskTypeColor};">
            <button onclick="closeTaskDetailPopup()" style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; color: var(--text-secondary); font-size: 1.5rem; cursor: pointer;">&times;</button>

            <h2 style="color: ${taskTypeColor}; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <i class="fa-solid ${taskType === 'Incident' ? 'fa-triangle-exclamation' : 'fa-clipboard-check'}"></i>
                ${task.number || 'N/A'}
            </h2>
            <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 2rem;">${taskType}</p>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
                <div><strong style="color: var(--text-secondary); font-size: 0.875rem;">Short Description:</strong><p style="margin-top: 0.5rem;">${task.short_description || 'N/A'}</p></div>
                <div><strong style="color: var(--text-secondary); font-size: 0.875rem;">State:</strong><p style="margin-top: 0.5rem;"><span class="state-badge">${task.state || 'N/A'}</span></p></div>
                <div><strong style="color: var(--text-secondary); font-size: 0.875rem;">Priority:</strong><p style="margin-top: 0.5rem;">${task.priority ? `<span class="priority-badge p${task.priority}">P${task.priority}</span>` : 'N/A'}</p></div>
                <div><strong style="color: var(--text-secondary); font-size: 0.875rem;">Opened:</strong><p style="margin-top: 0.5rem;">${task.opened ? new Date(task.opened).toLocaleString() : 'N/A'}</p></div>
                <div><strong style="color: var(--text-secondary); font-size: 0.875rem;">Assigned To:</strong><p style="margin-top: 0.5rem;">${task.assigned_to || 'N/A'}</p></div>
                <div><strong style="color: var(--text-secondary); font-size: 0.875rem;">Assignment Group:</strong><p style="margin-top: 0.5rem;">${task.assignment_group || 'N/A'}</p></div>
                <div><strong style="color: var(--text-secondary); font-size: 0.875rem;">Country:</strong><p style="margin-top: 0.5rem;">${COUNTRY_NAMES[task.country_code] || task.country_code || 'N/A'}</p></div>
                <div><strong style="color: var(--text-secondary); font-size: 0.875rem;">Duration:</strong><p style="margin-top: 0.5rem;">${task.business_duration ? (parseFloat(task.business_duration) / 3600).toFixed(1) + ' hours' : 'N/A'}</p></div>
            </div>

            ${task.close_notes ? `
                <div style="margin-top: 2rem; padding: 1rem; background: var(--input-bg); border-radius: 8px;">
                    <strong style="color: var(--text-secondary); font-size: 0.875rem;">Close Notes:</strong>
                    <p style="margin-top: 0.5rem; white-space: pre-wrap;">${task.close_notes}</p>
                </div>
            ` : ''}
        </div>
    `;

    document.body.appendChild(popup);
}

function closeTaskDetailPopup() {
    const popup = document.getElementById('taskDetailPopup');
    if (popup) popup.remove();
}

// ========== RENDER MONTHLY CHART WITH STATE COLORS ========== //

function renderMonthlyChart(countryCode, period = '3m') {
    const countryTasks = allTasks.filter(task =>
        task.country_code && task.country_code.toUpperCase() === countryCode.toUpperCase()
    );

    const monthsToShow = period === '3m' ? 3 : period === '6m' ? 6 : 12;
    const now = new Date();
    const monthLabels = [];
    const monthDataByState = {};

    for (let i = monthsToShow - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        monthLabels.push(monthLabel);
        monthDataByState[monthKey] = {};
    }

    // Group tasks by month and state
    countryTasks.forEach(task => {
        if (!task.opened) return;
        const openedDate = new Date(task.opened);
        const monthKey = `${openedDate.getFullYear()}-${String(openedDate.getMonth() + 1).padStart(2, '0')}`;

        if (monthDataByState[monthKey]) {
            let state = task.state || 'Other';
            // Normalize state names
            if (state.toLowerCase().includes('closed') && state.toLowerCase().includes('complete')) state = 'Closed Complete';
            else if (state.toLowerCase().includes('closed') && state.toLowerCase().includes('incomplete')) state = 'Closed Incomplete';
            else if (state.toLowerCase().includes('closed') && state.toLowerCase().includes('skipped')) state = 'Closed Skipped';
            else if (state.toLowerCase().includes('closed')) state = 'Closed';
            else if (state.toLowerCase().includes('resolved')) state = 'Resolved';
            else if (state.toLowerCase().includes('progress')) state = 'In Progress';
            else if (state.toLowerCase().includes('hold')) state = 'On Hold';
            else if (state.toLowerCase().includes('cancel')) state = 'Canceled';
            else state = 'Other';

            monthDataByState[monthKey][state] = (monthDataByState[monthKey][state] || 0) + 1;
        }
    });

    // Get unique states
    const allStates = [...new Set(Object.values(monthDataByState).flatMap(m => Object.keys(m)))];
    const datasets = allStates.map(state => {
        const stateColor = STATE_COLORS[state] || STATE_COLORS['Other'];
        return {
            label: state,
            data: monthLabels.map((_, idx) => {
                const monthKey = Object.keys(monthDataByState)[idx];
                return monthDataByState[monthKey][state] || 0;
            }),
            backgroundColor: stateColor.bg,
            borderColor: stateColor.border,
            borderWidth: 2
        };
    });

    if (currentChart) currentChart.destroy();

    const ctx = document.getElementById('monthlyTaskChart');
    if (!ctx) return;

    currentChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: monthLabels, datasets: datasets },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'top', labels: { color: '#e5e7eb', font: { size: 11 } } },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                x: { stacked: true, grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#9ca3af' } },
                y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#9ca3af', stepSize: 1 } }
            }
        }
    });
}

function updateChartPeriod(countryCode, period) {
    document.querySelectorAll('.chart-pill-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.period === period) btn.classList.add('active');
    });
    renderMonthlyChart(countryCode, period);
}

// ========== POPULATE FILTERS ========== //

function populateCountryFilter(countries) {
    const select = document.getElementById('filterCountry');
    if (!select) return;
    const options = countries.map(country => {
        const countryName = COUNTRY_NAMES[country.countryCode] || country.countryCode;
        return `<option value="${country.countryCode}">${countryName} (${country.totalTasks})</option>`;
    }).join('');
    select.innerHTML = '<option value="all">All Countries</option>' + options;
}

function populateAssignmentGroupFilter() {
    const select = document.getElementById('filterAssignmentGroup');
    if (!select || !allTasks || allTasks.length === 0) return;

    const groupCounts = {};
    allTasks.forEach(task => {
        const group = task.assignment_group;
        if (group && group.trim()) groupCounts[group] = (groupCounts[group] || 0) + 1;
    });

    const sortedGroups = Object.entries(groupCounts).sort((a, b) => b[1] - a[1]).map(([group, count]) => ({ group, count }));
    const options = sortedGroups.map(item => `<option value="${item.group}">${item.group} (${item.count})</option>`).join('');
    select.innerHTML = '<option value="all">All Groups</option>' + options;
}

// ========== SETUP FILTER LISTENERS ========== //

function setupFilterListeners() {
    ['filterTaskType', 'filterStatus', 'filterPriority', 'filterCountry', 'filterAssignmentGroup'].forEach(id => {
        const filter = document.getElementById(id);
        if (filter) filter.addEventListener('change', applyFilters);
    });
}

// ========== APPLY FILTERS & UPDATE GLOBAL STATS ========== //

function applyFilters() {
    if (!globalData) return;

    const taskType = document.getElementById('filterTaskType')?.value || 'all';
    const status = document.getElementById('filterStatus')?.value || 'all';
    const priority = document.getElementById('filterPriority')?.value || 'all';
    const country = document.getElementById('filterCountry')?.value || 'all';
    const assignmentGroup = document.getElementById('filterAssignmentGroup')?.value || 'all';

    console.log('🔍 Applying filters:', { taskType, status, priority, country, assignmentGroup });

    let countries = [...globalData.countries];
    if (country !== 'all') countries = countries.filter(c => c.countryCode === country);

    const filteredCountries = countries.map(countryData => {
        const countryTasksData = allTasks.filter(task => task.country_code && task.country_code.toUpperCase() === countryData.countryCode.toUpperCase());
        let filteredTasks = [...countryTasksData];

        if (taskType === 'incident') filteredTasks = filteredTasks.filter(t => t.number && t.number.toUpperCase().startsWith('INC'));
        else if (taskType === 'request') filteredTasks = filteredTasks.filter(t => t.number && t.number.toUpperCase().startsWith('SCTASK'));

        if (status === 'closed') filteredTasks = filteredTasks.filter(t => t.state && t.state.toLowerCase().includes('closed'));
        else if (status === 'progress') filteredTasks = filteredTasks.filter(t => t.state && t.state.toLowerCase().includes('progress'));
        else if (status === 'other') filteredTasks = filteredTasks.filter(t => !t.state || (!t.state.toLowerCase().includes('closed') && !t.state.toLowerCase().includes('progress')));

        if (priority !== 'all') filteredTasks = filteredTasks.filter(t => t.priority && t.priority.toString() === priority);
        if (assignmentGroup !== 'all') filteredTasks = filteredTasks.filter(t => t.assignment_group === assignmentGroup);

        const incidents = filteredTasks.filter(t => t.number && t.number.toUpperCase().startsWith('INC')).length;
        const requests = filteredTasks.filter(t => t.number && t.number.toUpperCase().startsWith('SCTASK')).length;
        const closedTasks = filteredTasks.filter(t => t.state && t.state.toLowerCase().includes('closed')).length;
        const inProgressTasks = filteredTasks.filter(t => t.state && t.state.toLowerCase().includes('progress')).length;

        return { ...countryData, totalTasks: filteredTasks.length, incidents, requests, closedTasks, inProgressTasks };
    }).filter(c => c.totalTasks > 0);

    const totalTasks = filteredCountries.reduce((sum, c) => sum + c.totalTasks, 0);
    const incidents = filteredCountries.reduce((sum, c) => sum + c.incidents, 0);
    const requests = filteredCountries.reduce((sum, c) => sum + c.requests, 0);
    const closedTasks = filteredCountries.reduce((sum, c) => sum + c.closedTasks, 0);

    const filteredGlobalStats = {
        totalTasks, incidents, requests, closedTasks,
        highPriorityTasks: globalData.globalStats.highPriorityTasks,
        avgDurationHours: globalData.globalStats.avgDurationHours,
        closedPercentage: totalTasks > 0 ? ((closedTasks / totalTasks) * 100).toFixed(2) : 0
    };

    filteredData = { globalStats: filteredGlobalStats, countries: filteredCountries };

    renderGlobalStats(filteredGlobalStats);
    renderCountryCards(filteredCountries);
}

// ========== MODAL CONTROLS ========== //

function closeTaskModal() {
    const modal = document.getElementById('taskDetailModal');
    modal.classList.remove('active');
    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }
}

// ========== ERROR HANDLING ========== //

function showError(message) {
    const container = document.getElementById('countriesContainer');
    if (!container) return;

    const statsContainer = document.getElementById('globalStatsContainer');
    if (statsContainer) statsContainer.innerHTML = '';

    container.innerHTML = `
        <div class="error-container" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem; color: #ef4444;"></i>
            <h3>⚠️ Error Loading Country Tasks Data</h3>
            <p style="font-size: 1.1rem; margin: 1rem 0; color: #ef4444; font-weight: 600;">${message}</p>
            <details style="margin: 1.5rem auto; text-align: left; max-width: 600px;">
                <summary style="cursor: pointer; padding: 0.5rem; background: rgba(239, 68, 68, 0.1); border-radius: 8px; margin-bottom: 0.5rem;">🔍 Technical Details</summary>
                <pre style="background: #1a1a1a; padding: 1rem; border-radius: 8px; overflow-x: auto; text-align: left; font-size: 0.875rem;">
Endpoint: /Horizon/api/data/country-tasks/summary
Expected File: Data/Horizon_Tasks.xlsx

Possible causes:
1. File Horizon_Tasks.xlsx is missing
2. File has incorrect format or corrupted
3. Backend API error (check server logs)
4. Permission issues reading the file
5. File is being used by another process

Next steps:
- Open browser DevTools (F12) → Console tab
- Look for red error messages
- Check if file exists: D:\\INTRANET\\Horizon\\Data\\Horizon_Tasks.xlsx
- Close Excel if file is open</pre>
            </details>
            <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1.5rem;">
                <button onclick="location.reload()" style="padding: 0.75rem 1.5rem; background: var(--primary-color); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    <i class="fas fa-redo"></i> Retry
                </button>
                <button onclick="window.location.href='/Horizon/'" style="padding: 0.75rem 1.5rem; background: var(--border-color); color: white; border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-home"></i> Go Home
                </button>
            </div>
        </div>
    `;
}

// ========== EVENT LISTENERS ========== //

document.addEventListener('click', (e) => {
    const modal = document.getElementById('taskDetailModal');
    if (e.target === modal) closeTaskModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeTaskModal();
        closeTaskDetailPopup();
    }
});

// ========== AUTO-INITIALIZE ========== //

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCountryTasks);
} else {
    initializeCountryTasks();
}

console.log('✅ Country Tasks V2.1 script loaded');
