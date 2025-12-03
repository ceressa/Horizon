// Country Tasks Module
// Handles fetching, filtering, and displaying IT tasks by country

let globalData = null;
let filteredData = null;
let allTasks = [];

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

// Initialize the country tasks module
async function initializeCountryTasks() {
    try {
        console.log('Initializing country tasks module...');

        // Fetch data from API
        const response = await fetch('/Horizon/api/data/country-tasks/summary');
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        globalData = await response.json();
        filteredData = globalData;

        console.log('Country tasks data loaded:', globalData);

        // Render components
        renderGlobalStats(globalData.globalStats);
        renderCountryCards(globalData.countries);
        populateCountryFilter(globalData.countries);

        // Setup filter listeners
        setupFilterListeners();

        // Fetch all tasks for detail view
        await fetchAllTasks();

    } catch (error) {
        console.error('Error initializing country tasks:', error);
        showError(error.message);
    }
}

// Fetch all tasks for detail modal
async function fetchAllTasks() {
    try {
        const response = await fetch('/Horizon/api/data/country-tasks');
        if (!response.ok) {
            throw new Error(`Failed to fetch tasks: ${response.statusText}`);
        }
        allTasks = await response.json();
        console.log('All tasks loaded:', allTasks.length);
    } catch (error) {
        console.error('Error fetching all tasks:', error);
    }
}

// Render global statistics
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
            label: 'High Priority',
            value: stats.highPriorityTasks.toLocaleString(),
            subtext: 'Priority 5 tasks'
        },
        {
            icon: '⏱️',
            label: 'Avg Resolution',
            value: `${stats.avgDurationHours.toFixed(1)}h`,
            subtext: 'Average time to resolve'
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

// Render country cards
function renderCountryCards(countries) {
    const container = document.getElementById('countriesContainer');
    if (!container) return;

    if (!countries || countries.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No data available</p>';
        return;
    }

    container.innerHTML = countries.map(country => {
        const countryName = COUNTRY_NAMES[country.countryCode] || country.countryCode;
        const flagCode = country.countryCode.toLowerCase();
        const closedPercentage = ((country.closedTasks / country.totalTasks) * 100).toFixed(1);
        const incidentPercentage = ((country.incidents / country.totalTasks) * 100).toFixed(1);
        const requestPercentage = ((country.requests / country.totalTasks) * 100).toFixed(1);
        const avgDurationHours = (country.avgDuration / 3600).toFixed(1);

        const priorityDist = Array.from(country.priorityDistribution || []);
        const topPriorities = priorityDist.slice(0, 3);

        return `
            <div class="country-card" onclick="showCountryDetails('${country.countryCode}')">
                <div class="country-card-header">
                    <div class="country-card-title">
                        <img src="https://flagcdn.com/32x24/${flagCode}.png"
                             alt="${countryName}"
                             class="country-flag"
                             onerror="this.style.display='none'">
                        <span class="country-name">${countryName}</span>
                    </div>
                    <div class="country-total">${country.totalTasks}</div>
                </div>

                <div class="country-stats">
                    <div class="stat-row">
                        <span class="stat-row-label">
                            <i class="fas fa-exclamation-circle" style="color: #ef4444;"></i>
                            Incidents (INC)
                        </span>
                        <span class="stat-row-value">
                            ${country.incidents}
                            <span class="stat-row-percentage">(${incidentPercentage}%)</span>
                        </span>
                    </div>

                    <div class="stat-row">
                        <span class="stat-row-label">
                            <i class="fas fa-clipboard-check" style="color: #3b82f6;"></i>
                            Requests (SCTASK)
                        </span>
                        <span class="stat-row-value">
                            ${country.requests}
                            <span class="stat-row-percentage">(${requestPercentage}%)</span>
                        </span>
                    </div>

                    <div class="stat-row">
                        <span class="stat-row-label">
                            <i class="fas fa-check-circle" style="color: #22c55e;"></i>
                            Closed Tasks
                        </span>
                        <span class="stat-row-value">
                            ${country.closedTasks}
                            <span class="stat-row-percentage">(${closedPercentage}%)</span>
                        </span>
                    </div>

                    <div class="stat-row">
                        <span class="stat-row-label">
                            <i class="fas fa-clock" style="color: #eab308;"></i>
                            In Progress
                        </span>
                        <span class="stat-row-value">${country.inProgressTasks || 0}</span>
                    </div>

                    <div class="stat-row">
                        <span class="stat-row-label">
                            <i class="fas fa-hourglass-half" style="color: #8b5cf6;"></i>
                            Avg Resolution
                        </span>
                        <span class="stat-row-value">${avgDurationHours}h</span>
                    </div>
                </div>

                ${topPriorities.length > 0 ? `
                    <div class="priority-badges">
                        ${topPriorities.map(p => {
                            const priorityClass = p.priority === '5' ? 'p5' : p.priority === '4' ? 'p4' : p.priority === '3' ? 'p3' : 'other';
                            return `<span class="priority-badge ${priorityClass}">P${p.priority}: ${p.count}</span>`;
                        }).join('')}
                    </div>
                ` : ''}

                <button class="detail-button" onclick="event.stopPropagation(); showCountryDetails('${country.countryCode}')">
                    <i class="fas fa-eye"></i> View Details
                </button>
            </div>
        `;
    }).join('');
}

// Show country details modal
function showCountryDetails(countryCode) {
    const country = filteredData.countries.find(c => c.countryCode === countryCode);
    if (!country) return;

    const countryName = COUNTRY_NAMES[countryCode] || countryCode;
    const flagCode = countryCode.toLowerCase();
    const countryTasks = allTasks.filter(task =>
        task.country_code && task.country_code.toUpperCase() === countryCode.toUpperCase()
    );

    const modal = document.getElementById('taskDetailModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.innerHTML = `
        <img src="https://flagcdn.com/32x24/${flagCode}.png"
             alt="${countryName}"
             style="width: 32px; height: 24px; border-radius: 4px;"
             onerror="this.style.display='none'">
        <span>${countryName} - Task Details (${countryTasks.length} tasks)</span>
    `;

    const stateDist = Array.from(country.stateDistribution || []);
    const topGroups = Array.from(country.topAssignmentGroups || []);
    const topAssignees = Array.from(country.topAssignees || []);

    modalBody.innerHTML = `
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

                        return `
                            <tr>
                                <td><code style="font-size: 0.75rem;">${task.number || '-'}</code></td>
                                <td><span class="task-type-badge ${taskType}">${taskTypeLabel}</span></td>
                                <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${task.short_description || ''}">${shortDesc}</td>
                                <td><span class="priority-badge ${task.priority === '5' ? 'p5' : task.priority === '4' ? 'p4' : 'other'}">${task.priority || '-'}</span></td>
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
}

// Close task modal
function closeTaskModal() {
    const modal = document.getElementById('taskDetailModal');
    modal.classList.remove('active');
}

// Populate country filter dropdown
function populateCountryFilter(countries) {
    const select = document.getElementById('filterCountry');
    if (!select) return;

    const options = countries.map(country => {
        const countryName = COUNTRY_NAMES[country.countryCode] || country.countryCode;
        return `<option value="${country.countryCode}">${countryName} (${country.totalTasks})</option>`;
    }).join('');

    select.innerHTML = '<option value="all">All Countries</option>' + options;
}

// Setup filter listeners
function setupFilterListeners() {
    const filterTaskType = document.getElementById('filterTaskType');
    const filterStatus = document.getElementById('filterStatus');
    const filterPriority = document.getElementById('filterPriority');
    const filterCountry = document.getElementById('filterCountry');

    [filterTaskType, filterStatus, filterPriority, filterCountry].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', applyFilters);
        }
    });
}

// Apply filters
function applyFilters() {
    if (!globalData) return;

    const taskType = document.getElementById('filterTaskType')?.value || 'all';
    const status = document.getElementById('filterStatus')?.value || 'all';
    const priority = document.getElementById('filterPriority')?.value || 'all';
    const country = document.getElementById('filterCountry')?.value || 'all';

    console.log('Applying filters:', { taskType, status, priority, country });

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

        // Apply priority filter
        if (priority !== 'all') {
            filteredTasks = filteredTasks.filter(t => t.priority && t.priority.toString() === priority);
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

// Show error message
function showError(message) {
    const container = document.getElementById('countriesContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="error-container">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <h3>Error Loading Data</h3>
            <p>${message}</p>
            <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: var(--primary-color); color: white; border: none; border-radius: 8px; cursor: pointer;">
                Retry
            </button>
        </div>
    `;
}

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
