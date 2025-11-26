// ============================================================
// LIVE COMPARISON PAGE - ENHANCED VERSION
// ============================================================
// Version: 3.0.0 - Rich Visualizations
// Author: Enhanced by Claude for HORIZON 
// Description: Professional country comparison with advanced charts

'use strict';

// ============================================================
// GLOBAL VARIABLES & STATE
// ============================================================

const API_BASE = '/Horizon/api/data';

let comparisonData = {
    country1: null,
    country2: null,
    country1Data: null,
    country2Data: null
};

let allAssets = [];
let charts = [];

// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Live Comparison page initializing...');
    await initializePage();
});

async function initializePage() {
    try {
        console.log('📡 Loading real asset data...');
        await loadAssetsFromAPI();
        initializeFlagGrids();
        setupEventListeners();
        console.log('✅ Live Comparison page ready');
    } catch (error) {
        console.error('❌ Failed to initialize:', error);
        showError('Failed to initialize page: ' + error.message);
    }
}

// ============================================================
// DATA LOADING FROM API
// ============================================================

async function loadAssetsFromAPI() {
    try {
        const response = await fetch(`${API_BASE}/assets`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        console.log(`✅ Loaded ${data.length} assets from API`);
        allAssets = data;
    } catch (error) {
        console.error('❌ Error loading assets:', error);
        throw error;
    }
}

// ============================================================
// FLAG GRIDS INITIALIZATION
// ============================================================

function initializeFlagGrids() {
    const country1Grid = document.getElementById('country1Grid');
    const country2Grid = document.getElementById('country2Grid');
    
    if (!country1Grid || !country2Grid) {
        console.error('❌ Flag grids not found');
        return;
    }
    
    let countries = [];
    
    if (window.COUNTRY_CONFIG) {
        countries = Object.entries(window.COUNTRY_CONFIG)
            .filter(([code]) => code !== 'GSP')
            .map(([code, config]) => ({
                code: code,
                name: config.name,
                flag: config.flag
            }));
    }
    
    console.log('🌍 Available countries:', countries.length);
    hideLoadingSkeletons();
    renderFlagGrid(country1Grid, countries, 1);
    renderFlagGrid(country2Grid, countries, 2);
    
    if (typeof twemoji !== 'undefined') {
        setTimeout(() => {
            twemoji.parse(country1Grid);
            twemoji.parse(country2Grid);
        }, 100);
    }
}

function renderFlagGrid(container, countries, countryNum) {
    container.innerHTML = '';
    
    countries.forEach(country => {
        const flagCard = document.createElement('div');
        flagCard.className = 'flag-card';
        flagCard.dataset.country = country.code;
        
        flagCard.innerHTML = `
            <div class="flag-emoji">${country.flag}</div>
            <div class="flag-name">${country.name.replace(' Operations', '')}</div>
        `;
        
        flagCard.addEventListener('click', () => selectCountry(country.code, countryNum));
        container.appendChild(flagCard);
    });
}

// ============================================================
// COUNTRY SELECTION
// ============================================================

function selectCountry(countryCode, countryNum) {
    console.log(`🎯 Selected ${countryCode} for Country ${countryNum}`);
    
    if (countryNum === 1) {
        comparisonData.country1 = countryCode;
    } else {
        comparisonData.country2 = countryCode;
    }
    
    const gridId = countryNum === 1 ? 'country1Grid' : 'country2Grid';
    const grid = document.getElementById(gridId);
    
    if (grid) {
        grid.querySelectorAll('.flag-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        const selectedCard = grid.querySelector(`[data-country="${countryCode}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }
    }
    
    updateSelectedCountryDisplay(countryCode, countryNum);
    loadCountryData(countryCode, countryNum);
    checkCompareButton();
}

function updateSelectedCountryDisplay(countryCode, countryNum) {
    const elementId = countryNum === 1 ? 'selectedCountry1' : 'selectedCountry2';
    const element = document.getElementById(elementId);
    
    if (!element) return;
    
    const config = window.COUNTRY_CONFIG?.[countryCode];
    const countryName = config?.name.replace(' Operations', '') || countryCode;
    const countryFlag = config?.flag || '🏳️';
    
    element.innerHTML = `
        <span class="selected-flag">${countryFlag}</span>
        <span class="selected-name">${countryName}</span>
    `;
    
    element.style.display = 'flex';
    
    if (typeof twemoji !== 'undefined') {
        setTimeout(() => twemoji.parse(element), 50);
    }
}

// ============================================================
// COUNTRY DATA CALCULATION
// ============================================================

function loadCountryData(countryCode, countryNum) {
    console.log(`📊 Loading data for ${countryCode}...`);
    
    const excelCountryNames = {
        'TR': 'Turkey', 'GR': 'Greece', 'BG': 'Bulgaria',
        'SI': 'Slovenia', 'CY': 'Cyprus', 'ES': 'Spain',
        'PT': 'Portugal', 'AT': 'Austria', 'CH': 'Switzerland',
        'CZ': 'Czech Republic', 'HU': 'Hungary', 'SK': 'Slovakia',
        'RO': 'Romania'
    };
    
    const excelCountryName = excelCountryNames[countryCode];
    const countryAssets = allAssets.filter(asset => asset.country === excelCountryName);
    
    console.log(`✅ Found ${countryAssets.length} assets for ${countryCode}`);
    
    const data = calculateCountryStats(countryAssets, countryCode);
    
    if (countryNum === 1) {
        comparisonData.country1Data = data;
    } else {
        comparisonData.country2Data = data;
    }
}

function calculateCountryStats(assets, countryCode) {
    const totalAssets = assets.length;
    const cities = [...new Set(assets.map(a => a.city).filter(Boolean))];
    const locations = cities.length;
    const locationCodes = [...new Set(assets.map(a => a.location_code).filter(Boolean))].length;
    const stations = [...new Set(assets.map(a => a.comat_station_id).filter(Boolean))].length;
    
    const categoriesMap = {};
    assets.forEach(asset => {
        const category = asset.model_category || 'Unknown';
        categoriesMap[category] = (categoriesMap[category] || 0) + 1;
    });
    
    const stateMap = {};
    assets.forEach(asset => {
        const state = asset.state || 'Unknown';
        stateMap[state] = (stateMap[state] || 0) + 1;
    });
    
    const supportGroups = [...new Set(assets.map(a => a.ci_support_group).filter(Boolean))].length;
    
    const activeAssets = assets.filter(a => 
        a.state && (a.state.toLowerCase().includes('in use') || a.state.toLowerCase().includes('active'))
    ).length;
    
    // City stats
    const cityStats = {};
    assets.forEach(asset => {
        if (asset.city) {
            cityStats[asset.city] = (cityStats[asset.city] || 0) + 1;
        }
    });
    
    return {
        countryCode,
        totalAssets,
        locations,
        cities: cities,
        locationCodes,
        stations,
        categories: categoriesMap,
        states: stateMap,
        supportGroups,
        activeAssets,
        activePercentage: totalAssets > 0 ? ((activeAssets / totalAssets) * 100).toFixed(1) : 0,
        cityStats
    };
}

// ============================================================
// COMPARISON EXECUTION
// ============================================================

function checkCompareButton() {
    const compareBtn = document.getElementById('compareBtn');
    
    if (compareBtn) {
        if (comparisonData.country1 && comparisonData.country2) {
            compareBtn.disabled = false;
            compareBtn.classList.add('ready');
        } else {
            compareBtn.disabled = true;
            compareBtn.classList.remove('ready');
        }
    }
}

function startComparison() {
    if (!comparisonData.country1 || !comparisonData.country2) {
        showNotification('Please select both countries', 'warning');
        return;
    }
    
    if (!comparisonData.country1Data || !comparisonData.country2Data) {
        showNotification('Loading country data...', 'info');
        return;
    }
    
    console.log('🔄 Starting comparison...');
    
    showResultsSection();
    renderComparison();
    
    setTimeout(() => {
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 300);
}

function showResultsSection() {
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'block';
        resultsSection.classList.add('fade-in');
    }
}

// ============================================================
// COMPARISON RENDERING
// ============================================================

function renderComparison() {
    console.log('📊 Rendering comparison...');
    
    const data1 = comparisonData.country1Data;
    const data2 = comparisonData.country2Data;
    
    if (!data1 || !data2) {
        console.error('❌ Missing country data');
        return;
    }
    
    clearAllCharts();
    
    // SECTION 1: Overview Cards
    renderOverviewCards(data1, data2);
    
    // SECTION 2: Winner Cards
    renderWinnerCards(data1, data2);
    
    // SECTION 3: Donut Charts Only
    renderDonutCharts(data1, data2);
    
    // SECTION 6: Detailed Tables
    renderDetailedTables(data1, data2);
    
    console.log('✅ Comparison rendered successfully');
}

// ============================================================
// SECTION 1: OVERVIEW CARDS
// ============================================================

function renderOverviewCards(data1, data2) {
    const config1 = window.COUNTRY_CONFIG?.[data1.countryCode];
    const config2 = window.COUNTRY_CONFIG?.[data2.countryCode];
    
    const overviewHtml = `
        <div class="comparison-overview">
            <div class="country-summary">
                <div class="summary-flag">${config1?.flag || '🏳️'}</div>
                <h3>${config1?.name.replace(' Operations', '') || data1.countryCode}</h3>
                <div class="summary-stats">
                    <div class="summary-stat">
                        <span class="stat-value">${data1.totalAssets.toLocaleString()}</span>
                        <span class="stat-label">Total Assets</span>
                    </div>
                    <div class="summary-stat">
                        <span class="stat-value">${data1.locations}</span>
                        <span class="stat-label">Locations</span>
                    </div>
                    <div class="summary-stat">
                        <span class="stat-value">${data1.activePercentage}%</span>
                        <span class="stat-label">Active</span>
                    </div>
                </div>
            </div>
            
            <div class="vs-divider">
                <div class="vs-icon">VS</div>
            </div>
            
            <div class="country-summary">
                <div class="summary-flag">${config2?.flag || '🏳️'}</div>
                <h3>${config2?.name.replace(' Operations', '') || data2.countryCode}</h3>
                <div class="summary-stats">
                    <div class="summary-stat">
                        <span class="stat-value">${data2.totalAssets.toLocaleString()}</span>
                        <span class="stat-label">Total Assets</span>
                    </div>
                    <div class="summary-stat">
                        <span class="stat-value">${data2.locations}</span>
                        <span class="stat-label">Locations</span>
                    </div>
                    <div class="summary-stat">
                        <span class="stat-value">${data2.activePercentage}%</span>
                        <span class="stat-label">Active</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const container = document.getElementById('overviewSection');
    if (container) {
        container.innerHTML = overviewHtml;
        if (typeof twemoji !== 'undefined') {
            setTimeout(() => twemoji.parse(container), 50);
        }
    }
}

// ============================================================
// SECTION 2: WINNER CARDS
// ============================================================

function renderWinnerCards(data1, data2) {
    const config1 = window.COUNTRY_CONFIG?.[data1.countryCode];
    const config2 = window.COUNTRY_CONFIG?.[data2.countryCode];
    
    const name1 = config1?.name.replace(' Operations', '') || data1.countryCode;
    const name2 = config2?.name.replace(' Operations', '') || data2.countryCode;
    
    // Determine winners
    const mostAssets = data1.totalAssets > data2.totalAssets ? 
        { name: name1, value: data1.totalAssets, flag: config1?.flag } : 
        { name: name2, value: data2.totalAssets, flag: config2?.flag };
    
    const mostLocations = data1.locations > data2.locations ? 
        { name: name1, value: data1.locations, flag: config1?.flag } : 
        { name: name2, value: data2.locations, flag: config2?.flag };
    
    // Calculate differences
    const assetRatio = data1.totalAssets > data2.totalAssets ? 
        (data1.totalAssets / data2.totalAssets).toFixed(1) : 
        (data2.totalAssets / data1.totalAssets).toFixed(1);
    
    const locationDiff = Math.abs(data1.locations - data2.locations);
    
    const winnerHtml = `
        <div class="winner-cards">
            <div class="winner-card">
                <div class="winner-icon"><i class="fas fa-trophy"></i></div>
                <div class="winner-title">Infrastructure Leader</div>
                <div class="winner-flag">${mostAssets.flag}</div>
                <div class="winner-name">${mostAssets.name}</div>
                <div class="winner-value">${mostAssets.value.toLocaleString()}</div>
                <div class="winner-detail">${assetRatio}x larger infrastructure</div>
            </div>
            
            <div class="winner-card">
                <div class="winner-icon"><i class="fas fa-map-marked-alt"></i></div>
                <div class="winner-title">Geographic Reach</div>
                <div class="winner-flag">${mostLocations.flag}</div>
                <div class="winner-name">${mostLocations.name}</div>
                <div class="winner-value">${mostLocations.value} Cities</div>
                <div class="winner-detail">+${locationDiff} more locations</div>
            </div>
        </div>
    `;
    
    const container = document.getElementById('winnerSection');
    if (container) {
        container.innerHTML = winnerHtml;
        if (typeof twemoji !== 'undefined') {
            setTimeout(() => twemoji.parse(container), 50);
        }
    }
}

// ============================================================
// SECTION 3: CHARTS - DONUT CHARTS
// ============================================================

function renderDonutCharts(data1, data2) {
    const config1 = window.COUNTRY_CONFIG?.[data1.countryCode];
    const config2 = window.COUNTRY_CONFIG?.[data2.countryCode];
    
    const name1 = config1?.name.replace(' Operations', '') || data1.countryCode;
    const name2 = config2?.name.replace(' Operations', '') || data2.countryCode;
    
    // Chart 1
    const canvas1 = document.getElementById('donutChart1');
    if (canvas1) {
        const ctx1 = canvas1.getContext('2d');
        const categories1 = Object.keys(data1.categories);
        const values1 = Object.values(data1.categories);
        
        const chart1 = new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: categories1,
                datasets: [{
                    data: values1,
                    backgroundColor: [
                        '#667eea', '#764ba2', '#f093fb', '#4facfe',
                        '#43e97b', '#fa709a', '#fee140', '#30cfd0',
                        '#a8edea', '#fed6e3'
                    ],
                    borderWidth: 2,
                    borderColor: '#1a1a2e'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: name1 + ' - Asset Categories',
                        color: '#ffffff',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'bottom',
                        labels: { 
                            color: '#ffffff',
                            padding: 15,
                            font: { size: 11 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true
                }
            }
        });
        
        charts.push(chart1);
    }
    
    // Chart 2
    const canvas2 = document.getElementById('donutChart2');
    if (canvas2) {
        const ctx2 = canvas2.getContext('2d');
        const categories2 = Object.keys(data2.categories);
        const values2 = Object.values(data2.categories);
        
        const chart2 = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: categories2,
                datasets: [{
                    data: values2,
                    backgroundColor: [
                        '#667eea', '#764ba2', '#f093fb', '#4facfe',
                        '#43e97b', '#fa709a', '#fee140', '#30cfd0',
                        '#a8edea', '#fed6e3'
                    ],
                    borderWidth: 2,
                    borderColor: '#1a1a2e'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: name2 + ' - Asset Categories',
                        color: '#ffffff',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'bottom',
                        labels: { 
                            color: '#ffffff',
                            padding: 15,
                            font: { size: 11 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true
                }
            }
        });
        
        charts.push(chart2);
    }
}

// ============================================================
// SECTION 3: CHARTS - RADAR CHART
// ============================================================

function renderRadarChart(data1, data2) {
    const canvas = document.getElementById('radarChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const config1 = window.COUNTRY_CONFIG?.[data1.countryCode];
    const config2 = window.COUNTRY_CONFIG?.[data2.countryCode];
    
    const name1 = config1?.name.replace(' Operations', '') || data1.countryCode;
    const name2 = config2?.name.replace(' Operations', '') || data2.countryCode;
    
    // Get all unique categories
    const allCategories = new Set([
        ...Object.keys(data1.categories),
        ...Object.keys(data2.categories)
    ]);
    
    // Take top 6 categories by total
    const categoryTotals = {};
    allCategories.forEach(cat => {
        categoryTotals[cat] = (data1.categories[cat] || 0) + (data2.categories[cat] || 0);
    });
    
    const topCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([cat]) => cat);
    
    const chart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: topCategories,
            datasets: [
                {
                    label: name1,
                    data: topCategories.map(cat => data1.categories[cat] || 0),
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderColor: '#667eea',
                    borderWidth: 2,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#667eea'
                },
                {
                    label: name2,
                    data: topCategories.map(cat => data2.categories[cat] || 0),
                    backgroundColor: 'rgba(118, 75, 162, 0.2)',
                    borderColor: '#764ba2',
                    borderWidth: 2,
                    pointBackgroundColor: '#764ba2',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#764ba2'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Multi-Dimensional Category Comparison',
                    color: '#ffffff',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    labels: { color: '#ffffff' }
                }
            },
            scales: {
                r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    pointLabels: { 
                        color: '#ffffff',
                        font: { size: 11 }
                    },
                    ticks: { 
                        color: '#ffffff',
                        backdropColor: 'transparent'
                    }
                }
            }
        }
    });
    
    charts.push(chart);
}

// ============================================================
// SECTION 3: CHARTS - STACKED BAR CHART
// ============================================================

function renderStackedBarChart(data1, data2) {
    const canvas = document.getElementById('stackedBarChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const config1 = window.COUNTRY_CONFIG?.[data1.countryCode];
    const config2 = window.COUNTRY_CONFIG?.[data2.countryCode];
    
    const name1 = config1?.name.replace(' Operations', '') || data1.countryCode;
    const name2 = config2?.name.replace(' Operations', '') || data2.countryCode;
    
    // Get all categories
    const allCategories = new Set([
        ...Object.keys(data1.categories),
        ...Object.keys(data2.categories)
    ]);
    
    const categories = Array.from(allCategories).sort();
    
    // Create datasets for each category
    const datasets = categories.map((cat, index) => {
        const colors = [
            '#667eea', '#764ba2', '#f093fb', '#4facfe',
            '#43e97b', '#fa709a', '#fee140', '#30cfd0',
            '#a8edea', '#fed6e3'
        ];
        
        return {
            label: cat,
            data: [data1.categories[cat] || 0, data2.categories[cat] || 0],
            backgroundColor: colors[index % colors.length],
            borderWidth: 1,
            borderColor: '#1a1a2e'
        };
    });
    
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [name1, name2],
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Category Mix Distribution',
                    color: '#ffffff',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    position: 'bottom',
                    labels: { 
                        color: '#ffffff',
                        padding: 10,
                        font: { size: 10 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y || 0;
                            return `${label}: ${value}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: {
                    stacked: true,
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    });
    
    charts.push(chart);
}

// ============================================================
// SECTION 6: DETAILED TABLES
// ============================================================

function renderDetailedTables(data1, data2) {
    const config1 = window.COUNTRY_CONFIG?.[data1.countryCode];
    const config2 = window.COUNTRY_CONFIG?.[data2.countryCode];
    
    const name1 = config1?.name.replace(' Operations', '') || data1.countryCode;
    const name2 = config2?.name.replace(' Operations', '') || data2.countryCode;
    const color1 = config1?.color || '#667eea';
    const color2 = config2?.color || '#764ba2';
    const flag1 = config1?.flag || '🏳️';
    const flag2 = config2?.flag || '🏳️';
    
    // Category breakdown table
    const allCategories = new Set([
        ...Object.keys(data1.categories),
        ...Object.keys(data2.categories)
    ]);
    
    const categories = Array.from(allCategories).sort();
    
    let tableRows = '';
    categories.forEach(cat => {
        const val1 = data1.categories[cat] || 0;
        const val2 = data2.categories[cat] || 0;
        const total = val1 + val2;
        const percent1 = total > 0 ? ((val1 / total) * 100).toFixed(1) : 0;
        const percent2 = total > 0 ? ((val2 / total) * 100).toFixed(1) : 0;
        
        tableRows += `
            <tr>
                <td class="category-name">
                    <i class="fas fa-cube" style="color: rgba(255,255,255,0.3); margin-right: 0.5rem;"></i>
                    ${cat}
                </td>
                <td class="country1-value" style="color: ${color1};">${val1.toLocaleString()}</td>
                <td class="country1-bar">
                    <div class="progress-bar-cell">
                        <div class="progress-fill" style="width: ${percent1}%; background: ${color1};"></div>
                        <span class="progress-text">${percent1}%</span>
                    </div>
                </td>
                <td class="country2-value" style="color: ${color2};">${val2.toLocaleString()}</td>
                <td class="country2-bar">
                    <div class="progress-bar-cell">
                        <div class="progress-fill" style="width: ${percent2}%; background: ${color2};"></div>
                        <span class="progress-text">${percent2}%</span>
                    </div>
                </td>
                <td class="total-value">${total.toLocaleString()}</td>
            </tr>
        `;
    });
    
    const tableHtml = `
        <div class="detailed-table-container">
            <h3 class="table-title">
                <i class="fas fa-table"></i>
                Detailed Asset Breakdown by Category
            </h3>
            <div class="table-wrapper">
                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th class="category-header">Asset Category</th>
                            <th class="country-header country1-header" style="background: linear-gradient(135deg, ${color1}40, ${color1}20);">
                                <span class="country-flag">${flag1}</span>
                                <span class="country-name">${name1}</span>
                            </th>
                            <th class="distribution-header" style="background: linear-gradient(135deg, ${color1}40, ${color1}20);">Distribution</th>
                            <th class="country-header country2-header" style="background: linear-gradient(135deg, ${color2}40, ${color2}20);">
                                <span class="country-flag">${flag2}</span>
                                <span class="country-name">${name2}</span>
                            </th>
                            <th class="distribution-header" style="background: linear-gradient(135deg, ${color2}40, ${color2}20);">Distribution</th>
                            <th class="total-header">Combined Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                    <tfoot>
                        <tr class="totals-row">
                            <td class="total-label"><strong>TOTAL ASSETS</strong></td>
                            <td class="country1-total" style="color: ${color1};"><strong>${data1.totalAssets.toLocaleString()}</strong></td>
                            <td class="country1-total-percent">100%</td>
                            <td class="country2-total" style="color: ${color2};"><strong>${data2.totalAssets.toLocaleString()}</strong></td>
                            <td class="country2-total-percent">100%</td>
                            <td class="grand-total"><strong>${(data1.totalAssets + data2.totalAssets).toLocaleString()}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    `;
    
    const container = document.getElementById('detailedTables');
    if (container) {
        container.innerHTML = tableHtml;
        
        // Parse emojis
        if (typeof twemoji !== 'undefined') {
            setTimeout(() => twemoji.parse(container), 50);
        }
    }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function clearAllCharts() {
    charts.forEach(chart => chart.destroy());
    charts = [];
}

function resetComparison() {
    comparisonData = {
        country1: null,
        country2: null,
        country1Data: null,
        country2Data: null
    };
    
    document.querySelectorAll('.flag-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    const selected1 = document.getElementById('selectedCountry1');
    const selected2 = document.getElementById('selectedCountry2');
    if (selected1) selected1.style.display = 'none';
    if (selected2) selected2.style.display = 'none';
    
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'none';
    }
    
    clearAllCharts();
    
    const compareBtn = document.getElementById('compareBtn');
    if (compareBtn) {
        compareBtn.disabled = true;
        compareBtn.classList.remove('ready');
    }
    
    showNotification('Comparison reset', 'info');
}

function hideLoadingSkeletons() {
    const loading1 = document.getElementById('country1Loading');
    const loading2 = document.getElementById('country2Loading');
    
    if (loading1) loading1.style.display = 'none';
    if (loading2) loading2.style.display = 'none';
}

function showError(message) {
    const setupCard = document.querySelector('.setup-card');
    if (setupCard) {
        setupCard.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>
                <h3 style="color: #ffffff; margin-bottom: 1rem;">Error Loading Page</h3>
                <p style="color: rgba(255,255,255,0.7);">${message}</p>
                <button onclick="location.reload()" style="margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-redo"></i> Reload Page
                </button>
            </div>
        `;
    }
}

function showNotification(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

function setupEventListeners() {
    const compareBtn = document.getElementById('compareBtn');
    if (compareBtn) {
        compareBtn.addEventListener('click', startComparison);
    }
    
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetComparison);
    }
}

// Export functions
function exportToPDF() {
    showNotification('PDF export coming soon!', 'info');
}

function shareComparison() {
    const data1 = comparisonData.country1Data;
    const data2 = comparisonData.country2Data;
    
    if (!data1 || !data2) {
        showNotification('Please complete comparison first', 'warning');
        return;
    }
    
    const config1 = window.COUNTRY_CONFIG?.[data1.countryCode];
    const config2 = window.COUNTRY_CONFIG?.[data2.countryCode];
    
    const name1 = config1?.name.replace(' Operations', '') || data1.countryCode;
    const name2 = config2?.name.replace(' Operations', '') || data2.countryCode;
    
    const shareText = `
HORIZON Country Comparison

${name1} vs ${name2}

Assets: ${data1.totalAssets} vs ${data2.totalAssets}
Locations: ${data1.locations} vs ${data2.locations}
Active: ${data1.activePercentage}% vs ${data2.activePercentage}%

Generated by HORIZON Dashboard
    `.trim();
    
    if (navigator.share) {
        navigator.share({
            title: 'HORIZON Country Comparison',
            text: shareText
        }).catch(err => console.log('Share cancelled'));
    } else {
        navigator.clipboard.writeText(shareText).then(() => {
            showNotification('Comparison copied to clipboard!', 'success');
        }).catch(err => {
            showNotification('Failed to copy to clipboard', 'error');
        });
    }
}

window.resetComparison = resetComparison;
window.exportToPDF = exportToPDF;
window.shareComparison = shareComparison;

console.log('✅ Live Comparison Enhanced Version loaded');