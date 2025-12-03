// ========== COUNTRY TASKS MODULE ========== //
// Version: 2.0.0 - Complete rewrite with Twemoji, charts, and enhanced features

'use strict';

let globalData = null;
let filteredData = null;
let allTasks = [];
let currentChart = null;

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
    'BE': 'Belgium',
    'DK': 'Denmark',
    'FI': 'Finland',
    'FR': 'France',
    'DE': 'Germany',
    'IE': 'Ireland',
    'IT': 'Italy',
    'NL': 'Netherlands',
    'PL': 'Poland',
    'SE': 'Sweden',
    'GB': 'United Kingdom'
};

// Country code to emoji flag mapping
const COUNTRY_EMOJI_FLAGS = {
    'TR': '🇹🇷', 'ES': '🇪🇸', 'PT': '🇵🇹', 'CH': '🇨🇭',
    'CZ': '🇨🇿', 'AT': '🇦🇹', 'RO': '🇷🇴', 'HU': '🇭🇺',
    'GR': '🇬🇷', 'BG': '🇧🇬', 'SK': '🇸🇰', 'BE': '🇧🇪',
    'DK': '🇩🇰', 'FI': '🇫🇮', 'FR': '🇫🇷', 'DE': '🇩🇪',
    'IE': '🇮🇪', 'IT': '🇮🇹', 'NL': '🇳🇱', 'PL': '🇵🇱',
    'SE': '🇸🇪', 'GB': '🇬🇧'
};

// ========== INITIALIZATION ========== //

async function initializeCountryTasks() {
    const loader = document.getElementById('universalPageLoader');

    try {
        console.log('🚀 Initializing Country Tasks module...');

        // Show loading screen
        if (loader) loader.classList.add('active');

        // Fetch summary data
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
        filteredData = globalData;

        console.log('✅ Summary data loaded:', globalData);

        // Fetch all tasks for details and charts
        await fetchAllTasks();

        // Render UI components
        renderGlobalStats(globalData.globalStats);
        renderCountryCards(globalData.countries);
        populateCountryFilter(globalData.countries);
        populateAssignmentGroupFilter();

        // Setup event listeners
        setupFilterListeners();

        // Apply Twemoji to all rendered content
        if (window.twemoji) {
            twemoji.parse(document.body);
        }

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
        // Hide loading screen
        if (loader) {
            setTimeout(() => loader.classList.remove('active'), 500);
        }
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
        console.log(`✅ Loaded ${allTasks.length} tasks`);
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
            icon: '🎫',
            label: 'Total Tasks',
            value: stats.totalTasks.toLocaleString(),
            subtext: 'INC + SCTASK'
        },
        {
            icon: '🚨',
            label: 'Incidents',
            value: stats.incidents.toLocaleString(),
            subtext: `${((stats.incidents / stats.totalTasks) * 100).toFixed(1)}% of total`
        },
        {
            icon: '📋',
            label: 'Service Requests',
            value: stats.requests.toLocaleString(),
            subtext: `${((stats.requests / stats.totalTasks) * 100).toFixed(1)}% of total`
        },
        {
            icon: '✅',
            label: 'Closed Tasks',
            value: stats.closedTasks.toLocaleString(),
            subtext: `${stats.closedPercentage}% completion rate`
        },
        {
            icon: '🔥',
            label: 'Critical (P1)',
            value: stats.highPriorityTasks.toLocaleString(),
            subtext: 'Highest priority'
        },
        {
            icon: '⏱️',
            label: 'Avg Resolution',
            value: `${stats.avgDurationHours.toFixed(1)}h`,
            subtext: 'Average time'
        }
    ];

    container.innerHTML = statCards.map(card => `
        <div class="stat-card">
            <div class="stat-card-icon">${card.icon}</div>
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
                            <i class="fas fa-exclamation-circle"></i>
                            <span>Incidents</span>
                        </div>
                        <div class="type-count">${country.incidents}</div>
                        <div class="type-percentage">${((country.incidents / country.totalTasks) * 100).toFixed(1)}% of total</div>
                    </div>

                    <div class="type-box request">
                        <div class="type-header">
                            <i class="fas fa-clipboard-check"></i>
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
                            <i class="fas fa-check-circle" style="color: #22c55e;"></i>
                            Closed
                        </span>
                        <span class="stat-row-value">
                            ${country.closedTasks}
                            <span class="stat-row-percentage">(${closedPercentage}%)</span>
                        </span>
                    </div>

                    <div class="stat-row">
                        <span class="stat-row-label">
                            <i class="fas fa-hourglass-half" style="color: #8b5cf6;"></i>
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
                    <i class="fas fa-chart-bar"></i> View Details & Chart
                </button>
            </div>
        `;
    }).join('');

    // Apply Twemoji to render flag emojis as SVG
    if (window.twemoji) {
        twemoji.parse(container);
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

    modalTitle.innerHTML = `
        <span class="modal-flag">${flagEmoji}</span>
        <span>${countryName} - Task Details (${countryTasks.length} tasks)</span>
    `;

    const stateDist = Array.from(country.stateDistribution || []);
    const topGroups = Array.from(country.topAssignmentGroups || []).slice(0, 5);
    const topAssignees = Array.from(country.topAssignees || []).slice(0, 5);

    modalBody.innerHTML = `
        <!-- Monthly Chart Section -->
        <div class="chart-section">
            <h4 style="color: var(--text-primary); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-chart-bar"></i>
                Monthly Task Trend
            </h4>
            <div class="chart-controls">
                <button class="chart-btn active" data-period="3m" onclick="updateChartPeriod('${countryCode}', '3m')">3 Months</button>
                <button class="chart-btn" data-period="6m" onclick="updateChartPeriod('${countryCode}', '6m')">6 Months</button>
                <button class="chart-btn" data-period="1y" onclick="updateChartPeriod('${countryCode}', '1y')">1 Year</button>
            </div>
            <div class="chart-container">
                <canvas id="monthlyTaskChart"></canvas>
            </div>
        </div>

        <!-- Stats Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
            <div>
                <h4 style="color: var(--text-secondary); margin-bottom: 0.5rem; font-size: 0.875rem;">STATE DISTRIBUTION</h4>
                ${stateDist.map(s => `
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: var(--input-bg); border-radius: 6px; margin-bottom: 0.5rem;">
                        <span style="font-size: 0.875rem;">${s.state}</span>
                        <span style="font-weight: 600;">${s.count}</span>
                    </div>
                `).join('')}
            </div>

            <div>
                <h4 style="color: var(--text-secondary); margin-bottom: 0.5rem; font-size: 0.875rem;">TOP ASSIGNMENT GROUPS</h4>
                ${topGroups.map(g => `
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: var(--input-bg); border-radius: 6px; margin-bottom: 0.5rem;">
                        <span style="font-size: 0.875rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${g.group}</span>
                        <span style="font-weight: 600; margin-left: 0.5rem;">${g.count}</span>
                    </div>
                `).join('')}
            </div>

            <div>
                <h4 style="color: var(--text-secondary); margin-bottom: 0.5rem; font-size: 0.875rem;">TOP ASSIGNEES</h4>
                ${topAssignees.map(a => `
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: var(--input-bg); border-radius: 6px; margin-bottom: 0.5rem;">
                        <span style="font-size: 0.875rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${a.assignee}</span>
                        <span style="font-weight: 600; margin-left: 0.5rem;">${a.count}</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Tasks Table -->
        <h4 style="color: var(--text-primary); margin-bottom: 1rem;">All Tasks</h4>
        <div style="overflow-x: auto;">
            <table class="task-table">
                <thead>
                    <tr>
                        <th>Number</th>
                        <th>Type</th>
                        <th>Short Description</th>
                        <th>Priority</th>
                        <th>State</th>
                        <th>Opened</th>
                        <th>Assigned To</th>
                        <th>Duration (h)</th>
                    </tr>
                </thead>
                <tbody>
                    ${countryTasks.slice(0, 50).map(task => {
                        const taskType = task.number && task.number.toUpperCase().startsWith('INC') ? 'incident' : 'request';
                        const taskTypeLabel = taskType === 'incident' ? 'INC' : 'SCTASK';

                        let stateClass = 'other';
                        if (task.state && task.state.toLowerCase().includes('closed')) {
                            stateClass = 'closed';
                        } else if (task.state && task.state.toLowerCase().includes('progress')) {
                            stateClass = 'progress';
                        }

                        const duration = task.business_duration ? (parseFloat(task.business_duration) / 3600).toFixed(1) : '-';
                        const openedDate = task.opened ? new Date(task.opened).toLocaleDateString() : '-';
                        const shortDesc = task.short_description ?
                            (task.short_description.length > 50 ? task.short_description.substring(0, 50) + '...' : task.short_description)
                            : '-';

                        // Priority badge - only show for Incidents, use correct P1-P5 logic
                        let priorityBadge = '-';
                        if (taskType === 'incident' && task.priority) {
                            const pNum = task.priority;
                            const pClass = `p${pNum}`;
                            priorityBadge = `<span class="priority-badge ${pClass}">P${pNum}</span>`;
                        }

                        return `
                            <tr>
                                <td><code style="font-size: 0.75rem;">${task.number || '-'}</code></td>
                                <td><span class="task-type-badge ${taskType}">${taskTypeLabel}</span></td>
                                <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${task.short_description || ''}">${shortDesc}</td>
                                <td>${priorityBadge}</td>
                                <td><span class="state-badge ${stateClass}">${task.state || '-'}</span></td>
                                <td>${openedDate}</td>
                                <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${task.assigned_to || '-'}</td>
                                <td>${duration}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            ${countryTasks.length > 50 ? `<p style="margin-top: 1rem; text-align: center; color: var(--text-secondary); font-size: 0.875rem;">Showing first 50 of ${countryTasks.length} tasks</p>` : ''}
        </div>
    `;

    modal.classList.add('active');

    // Apply Twemoji to modal content
    if (window.twemoji) {
        twemoji.parse(modal);
    }

    // Render the monthly chart (default: 3 months)
    renderMonthlyChart(countryCode, '3m');
}

// ========== RENDER MONTHLY CHART ========== //

function renderMonthlyChart(countryCode, period = '3m') {
    const countryTasks = allTasks.filter(task =>
        task.country_code && task.country_code.toUpperCase() === countryCode.toUpperCase()
    );

    // Determine how many months to show
    const monthsToShow = period === '3m' ? 3 : period === '6m' ? 6 : 12;

    // Get current date and calculate start date
    const now = new Date();
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - monthsToShow);

    // Create month labels and data buckets
    const monthLabels = [];
    const monthData = {};

    for (let i = monthsToShow - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

        monthLabels.push(monthLabel);
        monthData[monthKey] = { incidents: 0, requests: 0 };
    }

    // Group tasks by month
    countryTasks.forEach(task => {
        if (!task.opened) return;

        const openedDate = new Date(task.opened);
        const monthKey = `${openedDate.getFullYear()}-${String(openedDate.getMonth() + 1).padStart(2, '0')}`;

        if (monthData[monthKey]) {
            const isIncident = task.number && task.number.toUpperCase().startsWith('INC');
            if (isIncident) {
                monthData[monthKey].incidents++;
            } else {
                monthData[monthKey].requests++;
            }
        }
    });

    // Extract data arrays
    const incidentData = Object.values(monthData).map(m => m.incidents);
    const requestData = Object.values(monthData).map(m => m.requests);

    // Destroy previous chart if exists
    if (currentChart) {
        currentChart.destroy();
    }

    // Create new chart
    const ctx = document.getElementById('monthlyTaskChart');
    if (!ctx) return;

    currentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthLabels,
            datasets: [
                {
                    label: 'Incidents (INC)',
                    data: incidentData,
                    backgroundColor: 'rgba(239, 68, 68, 0.7)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 2
                },
                {
                    label: 'Service Requests (SCTASK)',
                    data: requestData,
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#e5e7eb',
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: false,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#9ca3af' }
                },
                y: {
                    stacked: false,
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: {
                        color: '#9ca3af',
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// ========== UPDATE CHART PERIOD ========== //

function updateChartPeriod(countryCode, period) {
    // Update button states
    document.querySelectorAll('.chart-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.period === period) {
            btn.classList.add('active');
        }
    });

    // Re-render chart with new period
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

    // Extract unique assignment groups
    const groupCounts = {};
    allTasks.forEach(task => {
        const group = task.assignment_group;
        if (group && group.trim()) {
            groupCounts[group] = (groupCounts[group] || 0) + 1;
        }
    });

    // Sort by count descending
    const sortedGroups = Object.entries(groupCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([group, count]) => ({ group, count }));

    const options = sortedGroups.map(item =>
        `<option value="${item.group}">${item.group} (${item.count})</option>`
    ).join('');

    select.innerHTML = '<option value="all">All Groups</option>' + options;
}

// ========== SETUP FILTER LISTENERS ========== //

function setupFilterListeners() {
    const filterTaskType = document.getElementById('filterTaskType');
    const filterStatus = document.getElementById('filterStatus');
    const filterPriority = document.getElementById('filterPriority');
    const filterCountry = document.getElementById('filterCountry');
    const filterAssignmentGroup = document.getElementById('filterAssignmentGroup');

    [filterTaskType, filterStatus, filterPriority, filterCountry, filterAssignmentGroup].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', applyFilters);
        }
    });
}

// ========== APPLY FILTERS ========== //

function applyFilters() {
    if (!globalData) return;

    const taskType = document.getElementById('filterTaskType')?.value || 'all';
    const status = document.getElementById('filterStatus')?.value || 'all';
    const priority = document.getElementById('filterPriority')?.value || 'all';
    const country = document.getElementById('filterCountry')?.value || 'all';
    const assignmentGroup = document.getElementById('filterAssignmentGroup')?.value || 'all';

    console.log('🔍 Applying filters:', { taskType, status, priority, country, assignmentGroup });

    // Filter countries
    let countries = [...globalData.countries];

    if (country !== 'all') {
        countries = countries.filter(c => c.countryCode === country);
    }

    // Recalculate stats based on filters
    const filteredCountries = countries.map(countryData => {
        const countryTasksData = allTasks.filter(task =>
            task.country_code && task.country_code.toUpperCase() === countryData.countryCode.toUpperCase()
        );

        let filteredTasks = [...countryTasksData];

        // Apply task type filter
        if (taskType === 'incident') {
            filteredTasks = filteredTasks.filter(t => t.number && t.number.toUpperCase().startsWith('INC'));
        } else if (taskType === 'request') {
            filteredTasks = filteredTasks.filter(t => t.number && t.number.toUpperCase().startsWith('SCTASK'));
        }

        // Apply status filter
        if (status === 'closed') {
            filteredTasks = filteredTasks.filter(t => t.state && t.state.toLowerCase().includes('closed'));
        } else if (status === 'progress') {
            filteredTasks = filteredTasks.filter(t => t.state && t.state.toLowerCase().includes('progress'));
        } else if (status === 'other') {
            filteredTasks = filteredTasks.filter(t => !t.state || (!t.state.toLowerCase().includes('closed') && !t.state.toLowerCase().includes('progress')));
        }

        // Apply priority filter (only for incidents)
        if (priority !== 'all') {
            filteredTasks = filteredTasks.filter(t => t.priority && t.priority.toString() === priority);
        }

        // Apply assignment group filter
        if (assignmentGroup !== 'all') {
            filteredTasks = filteredTasks.filter(t => t.assignment_group === assignmentGroup);
        }

        // Recalculate country stats
        const incidents = filteredTasks.filter(t => t.number && t.number.toUpperCase().startsWith('INC')).length;
        const requests = filteredTasks.filter(t => t.number && t.number.toUpperCase().startsWith('SCTASK')).length;
        const closedTasks = filteredTasks.filter(t => t.state && t.state.toLowerCase().includes('closed')).length;
        const inProgressTasks = filteredTasks.filter(t => t.state && t.state.toLowerCase().includes('progress')).length;

        return {
            ...countryData,
            totalTasks: filteredTasks.length,
            incidents,
            requests,
            closedTasks,
            inProgressTasks
        };
    }).filter(c => c.totalTasks > 0);

    // Update global stats
    const totalTasks = filteredCountries.reduce((sum, c) => sum + c.totalTasks, 0);
    const incidents = filteredCountries.reduce((sum, c) => sum + c.incidents, 0);
    const requests = filteredCountries.reduce((sum, c) => sum + c.requests, 0);
    const closedTasks = filteredCountries.reduce((sum, c) => sum + c.closedTasks, 0);

    const filteredGlobalStats = {
        totalTasks,
        incidents,
        requests,
        closedTasks,
        highPriorityTasks: globalData.globalStats.highPriorityTasks,
        avgDurationHours: globalData.globalStats.avgDurationHours,
        closedPercentage: totalTasks > 0 ? ((closedTasks / totalTasks) * 100).toFixed(2) : 0
    };

    filteredData = {
        globalStats: filteredGlobalStats,
        countries: filteredCountries
    };

    renderGlobalStats(filteredGlobalStats);
    renderCountryCards(filteredCountries);
}

// ========== MODAL CONTROLS ========== //

function closeTaskModal() {
    const modal = document.getElementById('taskDetailModal');
    modal.classList.remove('active');

    // Destroy chart when closing modal
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
    if (statsContainer) {
        statsContainer.innerHTML = '';
    }

    container.innerHTML = `
        <div class="error-container" style="grid-column: 1/-1;">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <h3>⚠️ Error Loading Country Tasks Data</h3>
            <p style="font-size: 1.1rem; margin: 1rem 0; color: #ef4444; font-weight: 600;">${message}</p>
            <details style="margin: 1.5rem 0; text-align: left; max-width: 600px; margin-left: auto; margin-right: auto;">
                <summary style="cursor: pointer; padding: 0.5rem; background: rgba(239, 68, 68, 0.1); border-radius: 8px; margin-bottom: 0.5rem;">
                    🔍 Click to see technical details
                </summary>
                <pre style="background: #1a1a1a; padding: 1rem; border-radius: 8px; overflow-x: auto; text-align: left; font-size: 0.875rem;">
Endpoint: /Horizon/api/data/country-tasks/summary
Expected File: Data/Horizon_Tasks.xlsx

Possible causes:
1. File Horizon_Tasks.xlsx is missing in Data folder
2. File has incorrect format or corrupted
3. Backend API error (check server logs)
4. Permission issues reading the file

Next steps:
- Open browser DevTools (F12) → Console tab
- Look for red error messages
- Copy the full error and share with developer
- Check if file exists: D:\\INTRANET\\Horizon\\Data\\Horizon_Tasks.xlsx</pre>
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

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('taskDetailModal');
    if (e.target === modal) {
        closeTaskModal();
    }
});

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeTaskModal();
    }
});

// ========== AUTO-INITIALIZE ========== //

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCountryTasks);
} else {
    initializeCountryTasks();
}

console.log('✅ Country Tasks script loaded');
