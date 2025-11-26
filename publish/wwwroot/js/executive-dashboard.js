/* ============================================================
   EXECUTIVE DASHBOARD - IMPROVED VERSION
   ============================================================ */

// Global variables
let allAssets = [];
let allUsers = [];
let charts = {};
let warrantyData = {};
let osAnalysis = {};
let criticalSystems = [];
const API_BASE = '/Horizon/api/data';

// Category colors from assets.js
const CATEGORY_CONFIG = {
    'Computers': { icon: 'fa-laptop', color: '#eab308' },
    'Mobile Device': { icon: 'fa-mobile-screen-button', color: '#3b82f6' },
    'Mobile Phone': { icon: 'fa-mobile-screen', color: '#3b82f6' },
    'Wireless Access Points': { icon: 'fa-wifi', color: '#a855f7' },
    'Hubs/Switches': { icon: 'fa-network-wired', color: '#a855f7' },
    'Routers': { icon: 'fa-router', color: '#a855f7' },
    'Network Equipment': { icon: 'fa-ethernet', color: '#a855f7' },
    'Network Gear': { icon: 'fa-ethernet', color: '#a855f7' },
    'Printing Devices': { icon: 'fa-print', color: '#06b6d4' },
    'Windows Server': { icon: 'fa-server', color: '#ef4444' },
    'Linux Server': { icon: 'fa-server', color: '#f97316' },
    'Servers': { icon: 'fa-server', color: '#ef4444' },
    'Hardware': { icon: 'fa-clock', color: '#10b981' },
    'Telephony Equipment': { icon: 'fa-phone', color: '#8b5cf6' },
    'UPS': { icon: 'fa-battery-full', color: '#14b8a6' },
    'Others': { icon: 'fa-cube', color: '#6b7280' }
};

// Critical/EOL Operating Systems
const CRITICAL_OS = {
    'Windows 2003': { risk: 'CRITICAL', reason: 'End of Life - No security updates', color: '#dc2626' },
    'Windows 2003 Standard': { risk: 'CRITICAL', reason: 'End of Life - No security updates', color: '#dc2626' },
    'Windows 2008': { risk: 'CRITICAL', reason: 'End of Life since 2020', color: '#dc2626' },
    'Windows 2008 R2': { risk: 'CRITICAL', reason: 'End of Life since 2020', color: '#dc2626' },
    'Windows 2012': { risk: 'HIGH', reason: 'Extended support ended 2023', color: '#ef4444' },
    'Windows 2012 R2': { risk: 'HIGH', reason: 'Extended support ended 2023', color: '#ef4444' },
    'Windows 10 Enterprise 2016 LTSB': { risk: 'MEDIUM', reason: 'LTSB support ending soon', color: '#f59e0b' },
    'Windows Server 2008': { risk: 'CRITICAL', reason: 'End of Life', color: '#dc2626' },
    'Windows Server 2012': { risk: 'HIGH', reason: 'Extended support ended', color: '#ef4444' }
};

// Current Windows versions (for reference)
const CURRENT_OS_VERSIONS = {
    'Windows 11': ['23H2 (Build 22631)', '22H2 (Build 22621)', '21H2 (Build 22000)'],
    'Windows 10': ['22H2 (Build 19045)', '21H2 (Build 19044)', '21H1 (Build 19043)'],
    'Windows Server 2022': ['21H2 (Build 20348)'],
    'Windows Server 2019': ['1809 (Build 17763)'],
    'Windows Server 2016': ['1607 (Build 14393)']
};

// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Executive Dashboard initializing...');
    
    try {
        // Load all data
        await Promise.all([
            loadDashboardData(),
            loadUsersData()
        ]);
        
        // Setup event listeners
        setupEventListeners();
        
        // Hide loader
        setTimeout(() => {
            const loader = document.getElementById('pageLoader');
            if (loader) {
                loader.classList.add('hidden');
            }
            console.log('✅ Dashboard loaded successfully!');
        }, 500);
        
    } catch (error) {
        console.error('❌ Dashboard initialization failed:', error);
        hideLoader();
        showError('Failed to load dashboard data. Please refresh the page.');
    }
});

// ============================================================
// DATA LOADING
// ============================================================

async function loadDashboardData() {
    try {
        console.log('📡 Fetching assets data...');
        
        const response = await fetch(`${API_BASE}/assets`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        allAssets = data;
        
        console.log(`✅ Loaded ${allAssets.length} assets`);
        
        // Process and analyze data
        analyzeWarrantyStatus();
        analyzeOperatingSystems();
        detectCriticalSystems();
        
        // Render all dashboard components
        renderTopKPIs();
        renderAssetDistributionChart();
        renderTopCountries();
        renderUtilizationMetrics();
        renderCriticalAlerts();
        renderCategoryChart();
        renderQuickStats();
        renderRecentActivity();
        renderWarrantyStatus();
        renderOSDistribution();
        renderCriticalSystemsWidget();
        renderCurrentOSVersions();
        
    } catch (error) {
        console.error('❌ Error loading assets:', error);
        throw error;
    }
}

async function loadUsersData() {
    try {
        console.log('📡 Fetching users data...');
        
        // Users API'si farklı path'te: /api/users
        const response = await fetch('/Horizon/api/users');
        
        if (!response.ok) {
            console.warn('Users data not available');
            allUsers = [];
            return;
        }
        
        const data = await response.json();
        allUsers = data.users || data;
        
        console.log(`✅ Loaded ${allUsers.length} users`);
        
    } catch (error) {
        console.warn('⚠️ Could not load users:', error);
        allUsers = [];
    }
}

// ============================================================
// WARRANTY ANALYSIS
// ============================================================

function analyzeWarrantyStatus() {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    warrantyData = {
        active: 0,
        expiringSoon: 0,
        expired: 0,
        noWarranty: 0,
        expiringList: [],
        expiredList: []
    };
    
    allAssets.forEach(asset => {
        const warrantyExp = asset.warranty_expiration;
        
        if (!warrantyExp) {
            warrantyData.noWarranty++;
            return;
        }
        
        const expirationDate = new Date(warrantyExp);
        
        if (isNaN(expirationDate.getTime())) {
            warrantyData.noWarranty++;
            return;
        }
        
        if (expirationDate < today) {
            warrantyData.expired++;
            warrantyData.expiredList.push({
                name: asset.configuration_item || asset.display_name,
                country: asset.country,
                date: expirationDate,
                category: asset.model_category
            });
        } else if (expirationDate <= thirtyDaysFromNow) {
            warrantyData.expiringSoon++;
            warrantyData.expiringList.push({
                name: asset.configuration_item || asset.display_name,
                country: asset.country,
                date: expirationDate,
                category: asset.model_category,
                daysRemaining: Math.ceil((expirationDate - today) / (24 * 60 * 60 * 1000))
            });
        } else {
            warrantyData.active++;
        }
    });
    
    warrantyData.expiringList.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

// ============================================================
// OPERATING SYSTEM ANALYSIS
// ============================================================

function analyzeOperatingSystems() {
    osAnalysis = {
        distribution: {},
        versions: {},
        criticalCount: 0,
        highRiskCount: 0,
        mediumRiskCount: 0,
        byCategory: {
            computers: {},
            servers: {},
            mobile: {}
        }
    };
    
    allAssets.forEach(asset => {
        const os = asset.operating_system;
        const osVersion = asset.os_version;
        const category = asset.model_category;
        
        if (!os) return;
        
        osAnalysis.distribution[os] = (osAnalysis.distribution[os] || 0) + 1;
        
        if (osVersion) {
            const osKey = `${os} ${osVersion}`;
            osAnalysis.versions[osKey] = (osAnalysis.versions[osKey] || 0) + 1;
        }
        
        if (category === 'Computers') {
            osAnalysis.byCategory.computers[os] = (osAnalysis.byCategory.computers[os] || 0) + 1;
        } else if (category === 'Linux Server' || category === 'Windows Server') {
            osAnalysis.byCategory.servers[os] = (osAnalysis.byCategory.servers[os] || 0) + 1;
        } else if (category === 'Mobile Device' || category === 'Mobile Phone') {
            osAnalysis.byCategory.mobile[os] = (osAnalysis.byCategory.mobile[os] || 0) + 1;
        }
        
        if (CRITICAL_OS[os]) {
            const risk = CRITICAL_OS[os].risk;
            if (risk === 'CRITICAL') osAnalysis.criticalCount++;
            else if (risk === 'HIGH') osAnalysis.highRiskCount++;
            else if (risk === 'MEDIUM') osAnalysis.mediumRiskCount++;
        }
    });
}

// ============================================================
// DETECT CRITICAL SYSTEMS
// ============================================================

function detectCriticalSystems() {
    criticalSystems = [];
    
    allAssets.forEach(asset => {
        const os = asset.operating_system;
        
        if (!os) return;
        
        if (CRITICAL_OS[os]) {
            criticalSystems.push({
                name: asset.configuration_item || asset.display_name,
                os: os,
                osVersion: asset.os_version,
                country: asset.country,
                location: asset.location,
                category: asset.model_category,
                assignedTo: asset.assigned_to,
                serialNumber: asset.serial_number,
                manufacturer: asset.manufacturer,
                model: asset.model,
                risk: CRITICAL_OS[os].risk,
                reason: CRITICAL_OS[os].reason,
                color: CRITICAL_OS[os].color
            });
        }
        
        if (os && os.includes('Windows 10')) {
            const version = asset.os_version;
            if (version) {
                const versionNum = parseInt(version);
                if (versionNum < 19041) {
                    criticalSystems.push({
                        name: asset.configuration_item || asset.display_name,
                        os: os,
                        osVersion: version,
                        country: asset.country,
                        location: asset.location,
                        category: asset.model_category,
                        assignedTo: asset.assigned_to,
                        serialNumber: asset.serial_number,
                        manufacturer: asset.manufacturer,
                        model: asset.model,
                        risk: 'MEDIUM',
                        reason: 'Windows 10 build is EOL',
                        color: '#f59e0b'
                    });
                }
            }
        }
    });
    
    criticalSystems.sort((a, b) => {
        const riskOrder = { 'CRITICAL': 1, 'HIGH': 2, 'MEDIUM': 3 };
        return riskOrder[a.risk] - riskOrder[b.risk];
    });
}

// ============================================================
// RENDER TOP KPIs (ONLY 2 NOW)
// ============================================================

function renderTopKPIs() {
    const totalAssets = allAssets.length;
    
    const countries = new Set(allAssets.map(a => a.country).filter(Boolean));
    const totalCountries = countries.size;
    
    const employees = allUsers.length;
    
    document.querySelector('.kpi-card:nth-child(1) .kpi-value').textContent = formatNumber(totalAssets);
    document.querySelector('.kpi-card:nth-child(2) .kpi-value').textContent = totalCountries;
    
    // Update third card with employee count
    const thirdCard = document.querySelector('.kpi-card:nth-child(3)');
    if (thirdCard) {
        thirdCard.querySelector('h3').textContent = 'IT Team Members';
        thirdCard.querySelector('.kpi-value').textContent = employees;
        thirdCard.querySelector('.kpi-icon').className = 'kpi-icon';
        thirdCard.querySelector('.kpi-icon').classList.add('employees');
        thirdCard.querySelector('.kpi-icon').innerHTML = '<i class="fas fa-users"></i>';
    }
}

// ============================================================
// RENDER ASSET DISTRIBUTION CHART
// ============================================================

function renderAssetDistributionChart() {
    const container = document.getElementById('assetDistributionChart');
    if (!container) return;
    
    const distribution = {};
    allAssets.forEach(asset => {
        const category = asset.model_category || 'Unknown';
        distribution[category] = (distribution[category] || 0) + 1;
    });
    
    const sortedCategories = Object.entries(distribution)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);
    
    const labels = sortedCategories.map(item => item[0]);
    const data = sortedCategories.map(item => item[1]);
    
    const colors = labels.map(label => {
        const config = CATEGORY_CONFIG[label];
        return config ? config.color : '#6b7280';
    });
    
    if (charts.assetDistribution) {
        charts.assetDistribution.destroy();
    }
    
    charts.assetDistribution = new Chart(container, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#94a3b8',
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

// ============================================================
// RENDER TOP 5 COUNTRIES
// ============================================================

function renderTopCountries() {
    const container = document.getElementById('topCountries');
    if (!container) return;
    
    const countryStats = {};
    allAssets.forEach(asset => {
        const country = asset.country || 'Unknown';
        countryStats[country] = (countryStats[country] || 0) + 1;
    });
    
    const sortedCountries = Object.entries(countryStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const maxCount = sortedCountries[0] ? sortedCountries[0][1] : 1;
    
    let html = '';
    sortedCountries.forEach((item, index) => {
        const [country, count] = item;
        const percentage = (count / maxCount) * 100;
        const flag = getCountryFlag(country);
        
        html += `
            <div class="country-item">
                <div class="country-rank">${index + 1}</div>
                <div class="country-flag">${flag}</div>
                <div class="country-info">
                    <div class="country-name">${escapeHtml(country)}</div>
                    <div class="country-count">${count} assets</div>
                </div>
                <div class="country-bar">
                    <div class="country-bar-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ============================================================
// RENDER UTILIZATION METRICS
// ============================================================

function renderUtilizationMetrics() {
    const container = document.getElementById('utilizationGrid');
    if (!container) return;
    
    const total = allAssets.length;
    const assigned = allAssets.filter(a => a.assigned_to).length;
    const inUse = allAssets.filter(a => a.install_status === 'In Use' || a.install_status === 'Installed').length;
    const activeWarranty = warrantyData.active || 0;
    
    const assignedPercent = total > 0 ? Math.round((assigned / total) * 100) : 0;
    const inUsePercent = total > 0 ? Math.round((inUse / total) * 100) : 0;
    const warrantyPercent = total > 0 ? Math.round((activeWarranty / total) * 100) : 0;
    
    const html = `
        <div class="util-item">
            <div class="util-header">
                <div class="util-icon" style="color: #84cc16;">
                    <i class="fas fa-user-check"></i>
                </div>
                <div class="util-percentage">${assignedPercent}%</div>
            </div>
            <div class="util-label">Assigned Assets</div>
            <div class="util-count">${formatNumber(assigned)} / ${formatNumber(total)}</div>
        </div>
        <div class="util-item">
            <div class="util-header">
                <div class="util-icon" style="color: #3b82f6;">
                    <i class="fas fa-power-off"></i>
                </div>
                <div class="util-percentage">${inUsePercent}%</div>
            </div>
            <div class="util-label">Active/In Use</div>
            <div class="util-count">${formatNumber(inUse)} / ${formatNumber(total)}</div>
        </div>
        <div class="util-item">
            <div class="util-header">
                <div class="util-icon" style="color: #10b981;">
                    <i class="fas fa-shield-check"></i>
                </div>
                <div class="util-percentage">${warrantyPercent}%</div>
            </div>
            <div class="util-label">Under Warranty</div>
            <div class="util-count">${formatNumber(activeWarranty)} / ${formatNumber(total)}</div>
        </div>
    `;
    
    container.innerHTML = html;
}

// ============================================================
// RENDER CRITICAL ALERTS
// ============================================================

function renderCriticalAlerts() {
    const alerts = [];
    
    if (osAnalysis.criticalCount > 0) {
        alerts.push({
            type: 'error',
            icon: 'fa-exclamation-triangle',
            title: 'Critical OS Vulnerabilities',
            description: `${osAnalysis.criticalCount} systems running end-of-life operating systems with no security updates.`,
            priority: 1
        });
    }
    
    if (osAnalysis.highRiskCount > 0) {
        alerts.push({
            type: 'warning',
            icon: 'fa-shield-alt',
            title: 'High-Risk Operating Systems',
            description: `${osAnalysis.highRiskCount} systems running OS versions with ended extended support.`,
            priority: 2
        });
    }
    
    if (warrantyData.expiringSoon > 50) {
        alerts.push({
            type: 'warning',
            icon: 'fa-calendar-times',
            title: 'Warranty Expiration Alert',
            description: `${warrantyData.expiringSoon} assets have warranties expiring within 30 days.`,
            priority: 3
        });
    }
    
    if (warrantyData.expired > 100) {
        alerts.push({
            type: 'error',
            icon: 'fa-calendar-times',
            title: 'Expired Warranties',
            description: `${warrantyData.expired} assets are operating with expired warranties.`,
            priority: 2
        });
    }
    
    const unassigned = allAssets.filter(a => !a.assigned_to).length;
    if (unassigned > 50) {
        alerts.push({
            type: 'info',
            icon: 'fa-box',
            title: 'High Unassigned Asset Count',
            description: `${unassigned} assets are currently unassigned and idle.`,
            priority: 4
        });
    }
    
    alerts.sort((a, b) => a.priority - b.priority);
    
    document.getElementById('alertCount').textContent = alerts.length;
    
    const container = document.getElementById('alertsList');
    let html = '';
    
    alerts.forEach(alert => {
        html += `
            <div class="alert-item ${alert.type}">
                <div class="alert-header">
                    <div class="alert-title">
                        <i class="fas ${alert.icon}"></i>
                        ${alert.title}
                    </div>
                    <div class="alert-time">${alert.time}</div>
                </div>
                <div class="alert-description">${alert.description}</div>
            </div>
        `;
    });
    
    container.innerHTML = html || '<div style="text-align: center; color: #94a3b8; padding: 20px;">No critical alerts</div>';
}

// ============================================================
// RENDER CATEGORY CHART (WITH CORRECT COLORS)
// ============================================================

function renderCategoryChart() {
    const container = document.getElementById('categoryChart');
    if (!container) return;
    
    const categories = {};
    allAssets.forEach(asset => {
        const category = asset.model_category || 'Unknown';
        categories[category] = (categories[category] || 0) + 1;
    });
    
    const sortedCategories = Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);
    
    const labels = sortedCategories.map(item => item[0]);
    const data = sortedCategories.map(item => item[1]);
    
    const colors = labels.map(label => {
        const config = CATEGORY_CONFIG[label];
        return config ? config.color : '#6b7280';
    });
    
    if (charts.category) {
        charts.category.destroy();
    }
    
    charts.category = new Chart(container, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Assets',
                data: data,
                backgroundColor: colors,
                borderRadius: 8,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#94a3b8'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        color: '#94a3b8'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// ============================================================
// RENDER QUICK STATS (WITH NETWORK FIX)
// ============================================================

function renderQuickStats() {
    const container = document.getElementById('quickStats');
    if (!container) return;
    
    const computers = allAssets.filter(a => a.model_category === 'Computers').length;
    const servers = allAssets.filter(a => 
        a.model_category === 'Linux Server' || 
        a.model_category === 'Windows Server' ||
        a.model_category === 'Servers'
    ).length;
    const mobile = allAssets.filter(a => 
        a.model_category === 'Mobile Device' || 
        a.model_category === 'Mobile Phone'
    ).length;
    
    // FIX: Network = Hubs/Switches + Routers + Network Equipment
    const network = allAssets.filter(a => 
        a.model_category === 'Hubs/Switches' || 
        a.model_category === 'Routers' ||
        a.model_category === 'Network Equipment' ||
        a.model_category === 'Network Gear' ||
        a.model_category === 'Wireless Access Points'
    ).length;
    
    const html = `
        <div class="stat-item">
            <span class="stat-label">Computers</span>
            <span class="stat-value">${formatNumber(computers)}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Servers</span>
            <span class="stat-value">${formatNumber(servers)}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Mobile Devices</span>
            <span class="stat-value">${formatNumber(mobile)}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Network Equipment</span>
            <span class="stat-value">${formatNumber(network)}</span>
        </div>
    `;
    
    container.innerHTML = html;
}

// ============================================================
// RENDER RECENT ACTIVITY
// ============================================================

function renderRecentActivity() {
    const container = document.getElementById('activityTimeline');
    if (!container) return;
    
    const recentAssets = allAssets
        .filter(a => a.sys_created_on)
        .sort((a, b) => new Date(b.sys_created_on) - new Date(a.sys_created_on))
        .slice(0, 5);
    
    let html = '';
    
    recentAssets.forEach((asset, index) => {
        const types = ['added', 'updated', 'added', 'updated', 'warning'];
        const type = types[index % types.length];
        const name = asset.configuration_item || asset.display_name || 'Unknown Asset';
        const country = asset.country || 'Unknown';
        const timeAgo = getTimeAgo(new Date(asset.sys_created_on));
        
        html += `
            <div class="activity-item">
                <div class="activity-icon ${type}">
                    <i class="fas fa-${type === 'added' ? 'plus' : type === 'updated' ? 'edit' : 'exclamation'}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">Asset ${type === 'added' ? 'Added' : 'Updated'}</div>
                    <div class="activity-description">${escapeHtml(name)} in ${escapeHtml(country)}</div>
                </div>
                <div class="activity-time">${timeAgo}</div>
            </div>
        `;
    });
    
    container.innerHTML = html || '<div style="text-align: center; color: #94a3b8; padding: 20px;">No recent activity</div>';
}

// ============================================================
// RENDER WARRANTY STATUS
// ============================================================

function renderWarrantyStatus() {
    const container = document.getElementById('warrantySummary');
    if (!container) return;
    
    const total = warrantyData.active + warrantyData.expiringSoon + warrantyData.expired;
    
    const activePercent = total > 0 ? (warrantyData.active / total) * 100 : 0;
    const expiringPercent = total > 0 ? (warrantyData.expiringSoon / total) * 100 : 0;
    const expiredPercent = total > 0 ? (warrantyData.expired / total) * 100 : 0;
    
    const html = `
        <div class="warranty-item">
            <div class="warranty-header">
                <span class="warranty-label">
                    <i class="fas fa-check-circle"></i>
                    Active
                </span>
                <span class="warranty-count">${warrantyData.active}</span>
            </div>
            <div class="warranty-progress">
                <div class="warranty-progress-bar active" style="width: ${activePercent}%"></div>
            </div>
        </div>
        <div class="warranty-item">
            <div class="warranty-header">
                <span class="warranty-label">
                    <i class="fas fa-exclamation-triangle"></i>
                    Expiring Soon
                </span>
                <span class="warranty-count">${warrantyData.expiringSoon}</span>
            </div>
            <div class="warranty-progress">
                <div class="warranty-progress-bar expiring" style="width: ${expiringPercent}%"></div>
            </div>
        </div>
        <div class="warranty-item">
            <div class="warranty-header">
                <span class="warranty-label">
                    <i class="fas fa-times-circle"></i>
                    Expired
                </span>
                <span class="warranty-count">${warrantyData.expired}</span>
            </div>
            <div class="warranty-progress">
                <div class="warranty-progress-bar expired" style="width: ${expiredPercent}%"></div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// ============================================================
// RENDER OS DISTRIBUTION CHART
// ============================================================

function renderOSDistribution() {
    const container = document.getElementById('osDistributionChart');
    if (!container) return;
    
    const sortedOS = Object.entries(osAnalysis.distribution)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);
    
    const labels = sortedOS.map(item => item[0]);
    const data = sortedOS.map(item => item[1]);
    
    const colors = [
        '#84cc16', '#3b82f6', '#a855f7', '#06b6d4',
        '#ef4444', '#f97316', '#8b5cf6', '#ec4899'
    ];
    
    if (charts.osDistribution) {
        charts.osDistribution.destroy();
    }
    
    charts.osDistribution = new Chart(container, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Assets',
                data: data,
                backgroundColor: colors,
                borderWidth: 0,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        color: '#94a3b8'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                },
                y: {
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// ============================================================
// RENDER CURRENT OS VERSIONS (NEW!)
// ============================================================

function renderCurrentOSVersions() {
    const container = document.getElementById('currentOSVersions');
    if (!container) return;
    
    let html = '';
    
    Object.entries(CURRENT_OS_VERSIONS).forEach(([os, versions]) => {
        html += `
            <div class="os-version-item">
                <div class="os-version-header">
                    <i class="fas fa-desktop"></i>
                    <span>${os}</span>
                    <i class="fas fa-chevron-down os-toggle"></i>
                </div>
                <div class="os-version-list">
                    ${versions.map(v => `<div class="os-version-detail">✓ ${v}</div>`).join('')}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Add toggle functionality
    document.querySelectorAll('.os-version-header').forEach(header => {
        header.addEventListener('click', function() {
            this.classList.toggle('active');
            const list = this.nextElementSibling;
            const icon = this.querySelector('.os-toggle');
            
            if (list.style.maxHeight) {
                list.style.maxHeight = null;
                icon.style.transform = 'rotate(0deg)';
            } else {
                list.style.maxHeight = list.scrollHeight + 'px';
                icon.style.transform = 'rotate(180deg)';
            }
        });
    });
}

// ============================================================
// RENDER CRITICAL SYSTEMS WIDGET (WITH CLICK EVENT)
// ============================================================

function renderCriticalSystemsWidget() {
    const container = document.getElementById('criticalSystemsList');
    const badge = document.getElementById('criticalSystemsBadge');
    
    if (!container) return;
    
    if (badge) {
        badge.textContent = criticalSystems.length;
    }
    
    if (criticalSystems.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #10b981;">
                <i class="fas fa-check-circle" style="font-size: 32px; margin-bottom: 8px;"></i>
                <div style="font-weight: 600;">No Critical Systems Detected</div>
                <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">All systems are up to date</div>
            </div>
        `;
        return;
    }
    
    const topCritical = criticalSystems.slice(0, 5);
    
    let html = '';
    topCritical.forEach((system, index) => {
        const riskBadge = system.risk === 'CRITICAL' ? 'critical-badge' : 
                         system.risk === 'HIGH' ? 'high-badge' : 'medium-badge';
        
        html += `
            <div class="critical-system-item clickable" style="border-left-color: ${system.color};" onclick="openCriticalSystemDetail(${index})">
                <div class="critical-system-header">
                    <div class="critical-system-name">${escapeHtml(system.name)}</div>
                    <span class="risk-badge ${riskBadge}">${system.risk}</span>
                </div>
                <div class="critical-system-details">
                    <div class="detail-row">
                        <i class="fas fa-desktop"></i>
                        <span>${escapeHtml(system.os || 'Unknown')} ${escapeHtml(system.osVersion || '')}</span>
                    </div>
                    <div class="detail-row">
                        <i class="fas fa-flag"></i>
                        <span>${escapeHtml(system.country || 'Unknown')}</span>
                    </div>
                    <div class="detail-row">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>${escapeHtml(system.reason)}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    if (criticalSystems.length > 5) {
        html += `
            <div class="more-critical-systems" onclick="openCriticalSystemsModal()">
                <i class="fas fa-list"></i>
                <span>View all ${criticalSystems.length} critical systems</span>
            </div>
        `;
    }
    
    container.innerHTML = html;
}


// ============================================================
// CRITICAL SYSTEMS MODAL - GLOBAL FONKSIYONLAR
// ============================================================

window.openCriticalSystemsModal = function() {
    const modal = document.getElementById('criticalSystemsModal');
    if (!modal) {
        console.error('Critical Systems Modal not found!');
        return;
    }
    
    // Populate country filter
    const countryFilter = document.getElementById('countryFilter');
    if (countryFilter) {
        const countries = [...new Set(criticalSystems.map(s => s.country).filter(Boolean))].sort();
        countryFilter.innerHTML = '<option value="">All Countries</option>' + 
            countries.map(c => `<option value="${escapeHtml(c)}">${getCountryFlag(c)} ${escapeHtml(c)}</option>`).join('');
    }
    
    // Reset filters
    document.getElementById('criticalSystemSearch').value = '';
    document.getElementById('riskFilter').value = '';
    if (countryFilter) countryFilter.value = '';
    
    // Render table
    renderCriticalSystemsTable();
    
    modal.style.display = 'flex';
};

window.closeCriticalSystemsModal = function() {
    const modal = document.getElementById('criticalSystemsModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

function renderCriticalSystemsTable() {
    const tbody = document.getElementById('criticalSystemsTableBody');
    if (!tbody) return;
    
    let html = '';
    
    criticalSystems.forEach((system, index) => {
        const riskClass = system.risk === 'CRITICAL' ? 'critical-badge' : 
                         system.risk === 'HIGH' ? 'high-badge' : 'medium-badge';
        
        html += `
            <tr data-index="${index}" data-risk="${system.risk}" data-country="${escapeHtml(system.country || '')}" 
                data-search="${escapeHtml((system.name + ' ' + system.os + ' ' + system.country).toLowerCase())}"
                onclick="openCriticalSystemDetail(${index})">
                <td><span class="risk-badge ${riskClass}">${system.risk}</span></td>
                <td style="font-weight: 600;">${escapeHtml(system.name)}</td>
                <td>${escapeHtml(system.os || 'Unknown')}</td>
                <td>${getCountryFlag(system.country)} ${escapeHtml(system.country || 'Unknown')}</td>
                <td style="color: #fca5a5; font-size: 13px;">${escapeHtml(system.reason)}</td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    
    // Parse emojis with Twemoji
    if (typeof twemoji !== 'undefined') {
        twemoji.parse(tbody);
    }
}

window.openCriticalSystemDetail = function(index) {
    const system = criticalSystems[index];
    if (!system) {
        console.error('System not found at index:', index);
        return;
    }
    
    const modal = document.getElementById('criticalSystemDetailModal');
    if (!modal) {
        console.error('Detail Modal not found!');
        return;
    }
    
    const manager = getManagerForCountry(system.country);
    
    const detailHTML = `
        <div class="cr-detail-grid">
            <div class="cr-detail-section">
                <h3><i class="fas fa-info-circle"></i> Device Information</h3>
                <div class="cr-detail-item">
                    <span class="cr-detail-label">Device Name:</span>
                    <span class="cr-detail-value">${escapeHtml(system.name)}</span>
                </div>
                <div class="cr-detail-item">
                    <span class="cr-detail-label">Serial Number:</span>
                    <span class="cr-detail-value">${escapeHtml(system.serialNumber || 'N/A')}</span>
                </div>
                <div class="cr-detail-item">
                    <span class="cr-detail-label">Manufacturer:</span>
                    <span class="cr-detail-value">${escapeHtml(system.manufacturer || 'N/A')}</span>
                </div>
                <div class="cr-detail-item">
                    <span class="cr-detail-label">Model:</span>
                    <span class="cr-detail-value">${escapeHtml(system.model || 'N/A')}</span>
                </div>
                <div class="cr-detail-item">
                    <span class="cr-detail-label">Category:</span>
                    <span class="cr-detail-value">${escapeHtml(system.category || 'N/A')}</span>
                </div>
            </div>
            
            <div class="cr-detail-section">
                <h3><i class="fas fa-map-marker-alt"></i> Location</h3>
                <div class="cr-detail-item">
                    <span class="cr-detail-label">Country:</span>
                    <span class="cr-detail-value">${getCountryFlag(system.country)} ${escapeHtml(system.country || 'N/A')}</span>
                </div>
                <div class="cr-detail-item">
                    <span class="cr-detail-label">Location:</span>
                    <span class="cr-detail-value">${escapeHtml(system.location || 'N/A')}</span>
                </div>
                <div class="cr-detail-item">
                    <span class="cr-detail-label">Assigned To:</span>
                    <span class="cr-detail-value">${escapeHtml(system.assignedTo || 'Unassigned')}</span>
                </div>
            </div>
            
            <div class="cr-detail-section cr-risk-section">
                <h3><i class="fas fa-exclamation-triangle"></i> Security Risk</h3>
                <div class="cr-risk-banner ${system.risk.toLowerCase()}-risk">
                    <div class="cr-risk-level">${system.risk} RISK</div>
                    <div class="cr-risk-reason">${escapeHtml(system.reason)}</div>
                </div>
                <div class="cr-detail-item">
                    <span class="cr-detail-label">Operating System:</span>
                    <span class="cr-detail-value">${escapeHtml(system.os || 'Unknown')}</span>
                </div>
                <div class="cr-detail-item">
                    <span class="cr-detail-label">OS Version:</span>
                    <span class="cr-detail-value">${escapeHtml(system.osVersion || 'N/A')}</span>
                </div>
            </div>
            
            ${manager ? `
            <div class="cr-detail-section cr-manager-section">
                <h3><i class="fas fa-user-shield"></i> IT Manager Contact</h3>
                <div class="cr-manager-card">
                    <div class="cr-manager-info">
                        <div class="cr-manager-name">${escapeHtml(manager.name)}</div>
                        <div class="cr-manager-role">${escapeHtml(manager.role.replace(/_/g, ' '))}</div>
                        <div class="cr-manager-email">
                            <i class="fas fa-envelope"></i>
                            <a href="mailto:${escapeHtml(manager.email)}">${escapeHtml(manager.email)}</a>
                        </div>
                    </div>
                    <button type="button" class="cr-contact-btn" data-system-index="${index}" id="emailBtn${index}">
                        <i class="fas fa-paper-plane"></i>
                        Send Alert Email
                    </button>
                </div>
            </div>
            ` : ''}
        </div>
    `;
    
    const contentDiv = document.getElementById('criticalSystemDetailContent');
    contentDiv.innerHTML = detailHTML;
    
    // Twemoji parse
    if (typeof twemoji !== 'undefined') {
        twemoji.parse(contentDiv);
    }
    
    // Event listener ekle (HTML'den sonra!)
    if (manager) {
        const emailBtn = document.getElementById(`emailBtn${index}`);
        if (emailBtn) {
            emailBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                sendCriticalAlertEmail(index);
            });
        }
    }
    
    modal.style.display = 'flex';
};

window.closeCriticalSystemDetailModal = function() {
    const modal = document.getElementById('criticalSystemDetailModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

function sendCriticalAlertEmail(systemIndex) {
    const system = criticalSystems[systemIndex];
    
    if (!system) {
        alert('System not found!');
        console.error('System not found at index:', systemIndex);
        return false;
    }
    
    const manager = getManagerForCountry(system.country);
    
    if (!manager) {
        alert(`No IT Manager found for ${system.country}. Please contact your administrator.`);
        console.error('No manager found for country:', system.country);
        return false;
    }
    
    sendCriticalSystemEmail(system, manager);
    return false; // Sayfa yenilenmeyi engelle
}

function sendCriticalSystemEmail(system, manager) {
    const subject = `CRITICAL ALERT: ${system.name}`;
    const body = `Dear ${manager.name},

Critical system requires attention:

Device: ${system.name}
Location: ${system.country}
OS: ${system.os}
Risk: ${system.risk}
Issue: ${system.reason}

Please review immediately.`;

    const mailtoLink = `mailto:${manager.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Invisible link oluştur
    const a = document.createElement('a');
    a.href = mailtoLink;
    a.target = '_blank';  // Önemli!
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    
    // Temizle
    setTimeout(() => {
        document.body.removeChild(a);
    }, 100);
    
    console.log('📧 Email client opened!');
}

// ============================================================
// GET MANAGER FOR COUNTRY
// ============================================================

function getManagerForCountry(country) {
    if (!country || allUsers.length === 0) return null;
    
    // Normalize country name
    const normalizedCountry = country.toLowerCase().trim();
    
    // Find user whose countries array contains this country
    const manager = allUsers.find(user => {
        if (!user.countries || !Array.isArray(user.countries)) return false;
        
        // Check if user has this country in their assigned countries
        return user.countries.some(countryCode => {
            const countryName = COUNTRY_CODE_MAP[countryCode];
            if (!countryName) return false;
            return countryName.toLowerCase().trim() === normalizedCountry;
        });
    });
    
    return manager;
}

function filterCriticalSystems() {
    const searchTerm = document.getElementById('criticalSystemSearch').value.toLowerCase();
    const riskFilter = document.getElementById('riskFilter').value;
    const countryFilter = document.getElementById('countryFilter').value;
    
    const rows = document.querySelectorAll('#criticalSystemsTableBody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const searchData = row.getAttribute('data-search');
        const rowRisk = row.getAttribute('data-risk');
        const rowCountry = row.getAttribute('data-country');
        
        const matchesSearch = searchData.includes(searchTerm);
        const matchesRisk = !riskFilter || rowRisk === riskFilter;
        const matchesCountry = !countryFilter || rowCountry === countryFilter;
        
        if (matchesSearch && matchesRisk && matchesCountry) {
            row.classList.remove('hidden');
            visibleCount++;
        } else {
            row.classList.add('hidden');
        }
    });
    
    // Show/hide no results message
    const noResultsMsg = document.getElementById('noResultsMessage');
    if (noResultsMsg) {
        noResultsMsg.style.display = visibleCount === 0 ? 'block' : 'none';
    }
}


function exportCriticalSystemsToXLSX() {
    if (typeof XLSX === 'undefined') {
        alert('Excel export library not loaded. Please add SheetJS CDN to your HTML.');
        return;
    }
    
    // Get only visible rows (filtered results)
    const visibleRows = document.querySelectorAll('#criticalSystemsTableBody tr:not(.hidden)');
    
    if (visibleRows.length === 0) {
        alert('No systems to export. Please adjust your filters.');
        return;
    }
    
    // Prepare data
    const data = [
        ['Risk Level', 'Device Name', 'Serial Number', 'Operating System', 'OS Version', 'Country', 'Location', 'Category', 'Issue', 'Assigned To']
    ];
    
    // Get only filtered systems
    visibleRows.forEach(row => {
        const index = parseInt(row.getAttribute('data-index'));
        const system = criticalSystems[index];
        
        if (system) {
            data.push([
                system.risk,
                system.name,
                system.serialNumber || 'N/A',
                system.os || 'Unknown',
                system.osVersion || 'N/A',
                system.country || 'Unknown',
                system.location || 'N/A',
                system.category || 'N/A',
                system.reason,
                system.assignedTo || 'Unassigned'
            ]);
        }
    });
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Set column widths
    ws['!cols'] = [
        {wch: 12}, // Risk Level
        {wch: 25}, // Device Name
        {wch: 15}, // Serial Number
        {wch: 25}, // Operating System
        {wch: 20}, // OS Version
        {wch: 15}, // Country
        {wch: 20}, // Location
        {wch: 18}, // Category
        {wch: 50}, // Issue
        {wch: 20}  // Assigned To
    ];
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Critical Systems');
    
    // Generate filename with timestamp and count
    const timestamp = new Date().toISOString().split('T')[0];
    const count = visibleRows.length;
    const filename = `Critical_Systems_Report_${count}_items_${timestamp}.xlsx`;
    
    // Download
    XLSX.writeFile(wb, filename);
    
    // Show success message
    console.log(`✅ Exported ${count} critical systems to Excel`);
}

const COUNTRY_CODE_MAP = {
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

// ============================================================
// EVENT LISTENERS
// ============================================================

function setupEventListeners() {
    // Refresh button
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.disabled = true;
            try {
                await Promise.all([loadDashboardData(), loadUsersData()]);
            } catch (error) {
                console.error('Refresh failed:', error);
            } finally {
                refreshBtn.disabled = false;
            }
        });
    }
    
    // Export button
    const exportBtn = document.querySelector('.export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportDashboard);
    }
}

// ============================================================
// EXPORT DASHBOARD
// ============================================================

async function exportDashboard() {
    const exportBtn = document.querySelector('.export-btn');
    const originalText = exportBtn.innerHTML;
    
    try {
        exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
        exportBtn.disabled = true;
        
        const dashboard = document.querySelector('.executive-dashboard');
        const canvas = await html2canvas(dashboard, {
            scale: 2,
            backgroundColor: '#0f172a',
            logging: false
        });
        
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });
        
        const imgWidth = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save('executive-dashboard.pdf');
        
        console.log('✅ Dashboard exported successfully!');
        
    } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export dashboard. Please try again.');
    } finally {
        exportBtn.innerHTML = originalText;
        exportBtn.disabled = false;
    }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function hideLoader() {
    const loader = document.getElementById('pageLoader');
    if (loader) {
        loader.classList.add('hidden');
    }
}

function showError(message) {
    console.error(message);
    alert(message);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// ============================================================
// GET COUNTRY FLAG EMOJI
// ============================================================

function getCountryFlag(country) {
    const flagMap = {
        'Turkey': '🇹🇷',
        'Türkiye': '🇹🇷',
        'Spain': '🇪🇸',
        'Portugal': '🇵🇹',
        'Switzerland': '🇨🇭',
        'Czech Republic': '🇨🇿',
        'Austria': '🇦🇹',
        'Romania': '🇷🇴',
        'Hungary': '🇭🇺',
        'Greece': '🇬🇷',
        'Bulgaria': '🇧🇬',
        'Slovakia': '🇸🇰',
        'Slovenia': '🇸🇮',
        'Cyprus': '🇨🇾'
    };
    
    return flagMap[country] || '🏳️';
}

function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return Math.floor(diffInSeconds / 60) + ' min ago';
    if (diffInSeconds < 86400) return Math.floor(diffInSeconds / 3600) + ' hours ago';
    return Math.floor(diffInSeconds / 86400) + ' days ago';
}

// ============================================================
// MAKE FUNCTIONS GLOBAL
// ============================================================
window.openCriticalSystemsModal = openCriticalSystemsModal;
window.closeCriticalSystemsModal = closeCriticalSystemsModal;
window.openCriticalSystemDetail = openCriticalSystemDetail;
window.closeCriticalSystemDetailModal = closeCriticalSystemDetailModal;

console.log('✅ Executive Dashboard JS loaded successfully!');
console.log('✅ Global functions:', {
    openCriticalSystemsModal: typeof window.openCriticalSystemsModal,
    openCriticalSystemDetail: typeof window.openCriticalSystemDetail
});

console.log('✅ Executive Dashboard JS loaded successfully!');