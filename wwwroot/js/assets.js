/* ============================================================
   ASSETS PAGE - HARDWARE INVENTORY MANAGEMENT
   ============================================================ */

// ============================================================
// COUNTRY CODE MAPPING
// ============================================================

function getCountryCode(countryName) {
    if (!countryName) return '';
    
    const normalized = countryName.trim();
    
    const countryMap = {
        'Türkiye': 'TR',
        'Turkey': 'TR',
        'Spain': 'ES',
        'Portugal': 'PT',
        'Switzerland': 'CH',
        'Czech Republic': 'CZ',
        'Austria': 'AT',
        'Romania': 'RO',
        'Hungary': 'HU',
        'Greece': 'GR',
        'Bulgaria': 'BG',
        'Slovakia': 'SK',
        'Slovenia': 'SI',
        'Cyprus': 'CY',
        'Belgium': 'BE',
        'Denmark': 'DK',
        'Finland': 'FI',
        'France': 'FR',
        'Germany': 'DE',
        'Ireland': 'IE',
        'Italy': 'IT',
        'Netherlands': 'NL',
        'Poland': 'PL',
        'Sweden': 'SE',
        'United Kingdom': 'GB',
        'Bosnia and Herzegovina': 'BA',
        'North Macedonia': 'MK',
        'Serbia': 'RS',
        'Croatia': 'HR'
    };
    
    return countryMap[normalized] || '';
}

// Filter state
let selectedModalCategories = [];
let categoryFilterMode = 'all';
let selectedLocationFilter = 'all';
let selectedUtilizationFilter = 'all';

// ✅ yeni
let selectedOSFilter = 'all';
let selectedActivityFilter = 'all';

let activeQuickFilters = [];
let filtersPanelOpen = false;
let currentSearchTerm = '';

// Sorting state
let currentSortColumn = null;
let currentSortDirection = 'asc';


// API Base URL
const API_BASE = '/Horizon/api/data';


// Category icons and colors mapping
const CATEGORY_CONFIG = {
    'Computers': { icon: 'fa-laptop', color: '#eab308' },
     'Mobile Phone': { icon: 'fa-mobile-screen', color: '#3b82f6' },        // ✅ YENİ
    'Mobile Device': { icon: 'fa-mobile-screen-button', color: '#8b5cf6' }, // ✅ DEĞİŞTİ (mor)
    'Wireless Access Points': { icon: 'fa-wifi', color: '#a855f7' },
    'Hubs/Switches': { icon: 'fa-network-wired', color: '#a855f7' },
    'Routers': { icon: 'fa-router', color: '#a855f7' },
    'Network Equipment': { icon: 'fa-ethernet', color: '#a855f7' },
    'Printing Devices': { icon: 'fa-print', color: '#06b6d4' },
    'Windows Server': { icon: 'fa-server', color: '#ef4444' },
    'Linux Server': { icon: 'fa-server', color: '#f97316' },
    'Servers': { icon: 'fa-server', color: '#ef4444' },
    'Hardware': { icon: 'fa-clock', color: '#10b981' },
    'Telephony Equipment': { icon: 'fa-phone', color: '#8b5cf6' },
    'UPS': { icon: 'fa-battery-full', color: '#14b8a6' },
    'Others': { icon: 'fa-cube', color: '#6b7280' }
};

const CATEGORY_GROUPS = {
    'Computers': ['Computers'],
    'Mobile Phone': ['Mobile Phone'],          // ✅ YENİ
    'Mobile Device': ['Mobile Device'],        // ✅ YENİ
    'Network': ['Wireless Access Points', 'Hubs/Switches', 'Routers', 'Network Equipment', 'UPS'],
    'Printers': ['Printing Devices'],
    'Servers': ['Windows Server', 'Servers'],
    'Operational': ['Linux Server'],
    'eTime': ['Hardware'],
    'Telephony': ['Telephony Equipment']
};

// Display names for categories
const CATEGORY_DISPLAY_NAMES = {
    'Hardware': 'eTime Devices',
    'Linux Server': 'Operational Devices'
};

// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('ðŸš€ Assets page initializing...');
	
	showLoader();
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
    
    
    if (window.currentUser && window.currentUser.countries) {
        userCountries = window.currentUser.countries;
        console.log('âœ… User authorized countries (codes):', userCountries);
    } else {
        console.error('âŒ No authorized countries found!');
        showError('No authorized countries found. Please contact administrator.');
        hideLoader();
        return;
    }
    
    await loadAssets();
    hideLoader();
    initializeTwemoji();
});


// ============================================================
// TWEMOJI INITIALIZATION
// ============================================================

function initializeTwemoji() {
    if (typeof twemoji !== 'undefined') {
        setTimeout(() => {
            const filterContainer = document.getElementById('countryFilters');
            if (filterContainer) {
                twemoji.parse(filterContainer, {
                    folder: 'svg',
                    ext: '.svg'
                });
            }
            
            const cardsContainer = document.getElementById('assetsContainer');
            if (cardsContainer) {
                twemoji.parse(cardsContainer, {
                    folder: 'svg',
                    ext: '.svg'
                });
            }
            
            console.log('âœ… Twemoji initialized for flags');
        }, 300);
    }
}

// ============================================================
// LOADER FUNCTIONS WITH ANIMATED MESSAGES & PROGRESS
// ============================================================

const LOADING_MESSAGES = [
    "Scanning hardware inventory...",
    "Connecting to ServiceNow database...",
    "Loading asset configurations...",
    "Verifying serial numbers...",
    "Fetching network devices...",
    "Retrieving mobile device data...",
    "Processing server information...",
    "Synchronizing global inventory...",
    "Validating asset records...",
    "Loading location data...",
    "Calculating asset statistics...",
    "Preparing dashboard view...",
    "Organizing by category...",
    "Loading country assignments...",
    "Fetching warranty information...",
    "Retrieving IP allocations...",
    "Processing MAC addresses...",
    "Loading utilization data...",
    "Finalizing asset details...",
    "Almost ready..."
];

let messageInterval = null;
let progressInterval = null;
let currentProgress = 0;

function hideLoader() {
    console.log('ðŸ›‘ Hiding loader...');
    
    // Stop intervals immediately
    if (messageInterval) {
        clearInterval(messageInterval);
        messageInterval = null;
    }
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
    
    // Complete progress to 100%
    updateLoaderProgress(100);
    
    setTimeout(() => {
        const loader = document.getElementById('assetsPageLoader');
        if (loader) {
            loader.classList.add('fade-out');
            setTimeout(() => {
                loader.classList.remove('active');
            }, 600);
        }
    }, 300);
}

function showLoader() {
    console.log('â–¶ï¸ Showing loader...');
    
    const loader = document.getElementById('assetsPageLoader');
    if (loader) {
        loader.classList.add('active');
        loader.classList.remove('fade-out');
    }
    
    // Reset progress
    currentProgress = 0;
    updateLoaderProgress(0);
    
    // Start rotating messages
    setTimeout(() => {
        startLoadingMessages();
    }, 100);
    
    // Start progress animation
    setTimeout(() => {
        startProgressAnimation();
    }, 100);
}

function startLoadingMessages() {
    const textElement = document.querySelector('.assets-loader-text');
    if (!textElement) {
        console.error('âŒ Loader text element not found!');
        return;
    }
    
    console.log('âœ… Starting message rotation...');
    
    let lastIndex = -1;
    
    // Set first random message immediately
    let currentIndex = Math.floor(Math.random() * LOADING_MESSAGES.length);
    textElement.textContent = LOADING_MESSAGES[currentIndex];
    textElement.style.opacity = '1';
    lastIndex = currentIndex;
    
    // âœ… Rotate messages randomly every 2 seconds
    messageInterval = setInterval(() => {
        // Get a random index that's different from the last one
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * LOADING_MESSAGES.length);
        } while (newIndex === lastIndex && LOADING_MESSAGES.length > 1);
        
        lastIndex = newIndex;
        
        // Fade out
        textElement.style.opacity = '0';
        
        setTimeout(() => {
            textElement.textContent = LOADING_MESSAGES[newIndex];
            // Fade in
            textElement.style.opacity = '1';
        }, 300);
    }, 2000);
}

function startProgressAnimation() {
    const progressBar = document.querySelector('.assets-loader-progress-fill');
    if (!progressBar) {
        console.error('âŒ Progress bar not found!');
        return;
    }
    
    console.log('âœ… Starting progress animation...');
    
    currentProgress = 0;
    updateLoaderProgress(0);
    
    // Smooth progress animation
    progressInterval = setInterval(() => {
        if (currentProgress < 85) {
            const increment = Math.max(0.5, (85 - currentProgress) / 30);
            currentProgress += increment;
            updateLoaderProgress(currentProgress);
        }
    }, 100);
}

function updateLoaderProgress(percent) {
    const progressBar = document.querySelector('.assets-loader-progress-fill');
    const progressText = document.querySelector('.assets-loader-progress-text');
    
    if (progressBar) {
        progressBar.style.width = `${Math.min(percent, 100)}%`;
    }
    
    if (progressText) {
        progressText.textContent = `${Math.round(Math.min(percent, 100))}%`;
    }
}

// ============================================================
// DATA LOADING
// ============================================================

async function loadAssets() {
    try {
        console.log('📡 Fetching assets data...');

        const response = await fetch(`${API_BASE}/assets`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        console.log(`✅ Loaded ${data.length} assets`);

        // 🗺️ Kullanıcı bilgileri üzerinden country context oluştur
        const currentUserData = window.currentUser || {};
        const userCountries = currentUserData.countries || ['TR'];
        const currentCountry = userCountries[0] || 'TR';

        // ✅ Normalize + iPhone detection
        allAssets = data.map(asset => {
            let category = asset.model_category;

            // 📱 iPhone detection - hem model hem display_name'e bak
            if (category === 'Mobile Device') {
                const modelText = (asset.model || '').toLowerCase();
                const displayText = (asset.display_name || '').toLowerCase();
                const configItem = (asset.configuration_item || '').toLowerCase();

                // iPhone geçiyorsa Mobile Phone yap
                if (
                    modelText.includes('iphone') ||
                    displayText.includes('iphone') ||
                    configItem.includes('iphone')
                ) {
                    category = 'Mobile Phone';
                }
            }

            return {
                ...asset,
                model_category: category,
                country: normalizeCountryName(asset.country),
                countryCode: getCountryCode(normalizeCountryName(asset.country)),

                // ✅ OS normalization
                operating_system_normalized: window.normalizeOS
                    ? window.normalizeOS(asset['Operating System'] || asset.operating_system || '')
                    : (asset.operating_system || asset['Operating System'] || 'Unknown'),

                // 🕒 Aktivite günü hesaplama
                activity_days: calcActivityDays(asset['Most recent discovery'] || asset.most_recent_discovery),
            };
        });

        console.log('✅ Country names normalized and iPhone devices categorized');

        // 🧭 Authorized countries filter
        filteredAssets = allAssets.filter(asset =>
            userCountries.includes(asset.countryCode)
        );

        console.log(`✅ Filtered to ${filteredAssets.length} assets for authorized countries: [${userCountries.join(', ')}]`);

        // 📊 Category breakdown (log amaçlı)
        const categoryBreakdown = {};
        filteredAssets.forEach(a => {
            categoryBreakdown[a.model_category] = (categoryBreakdown[a.model_category] || 0) + 1;
        });
        console.log('📊 Category breakdown:', categoryBreakdown);

        // 🧩 UI rendering
        renderCountryFilters(userCountries);
        renderSummaryStats(filteredAssets);
        renderAssetCards(filteredAssets, userCountries);
        initializeTwemoji();

        console.log(`🌍 Assets successfully rendered for ${currentCountry}`);

    } catch (error) {
        console.error('❌ Error loading assets:', error);
        showError('Failed to load assets data. Please try again.');
    }
}



// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getDisplayName(category) {
    return CATEGORY_DISPLAY_NAMES[category] || category;
}

function getCategoryConfig(category) {
    return CATEGORY_CONFIG[category] || CATEGORY_CONFIG['Others'];
}

function calcActivityDays(lastDiscovery) {
    if (!lastDiscovery) return null;
    const d = new Date(lastDiscovery);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    const diffMs = now - d;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}


// ============================================================
// COUNTRY FILTERS
// ============================================================

function renderCountryFilters() {
    const container = document.getElementById('countryFilters');
    if (!container) return;

    // 🔹 Kullanıcının yetkili ülkeleri
    const authorizedCodes = window.currentUser?.countries || [];
    if (!authorizedCodes.length) {
        console.warn('⚠️ No authorized countries found for current user.');
        return;
    }

    // 🔹 Verideki ülkeleri al ve normalize et
    const uniqueCountries = [...new Set(filteredAssets.map(a => normalizeCountryName(a.country)))];

    // 🔹 Sadece yetkili ülkeleri göster
    const displayCountries = uniqueCountries.filter(c => authorizedCodes.includes(getCountryCode(c)));

    // 🔹 Coğrafi sıralama
    const countries = displayCountries.sort((a, b) => {
        const codeA = getCountryCode(a);
        const codeB = getCountryCode(b);
        if (window.COUNTRY_ORDER && codeA && codeB) {
            const indexA = window.COUNTRY_ORDER.indexOf(codeA);
            const indexB = window.COUNTRY_ORDER.indexOf(codeB);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
        }
        return a.localeCompare(b);
    });

    // 🔹 "All Countries" chip
    let html = `
        <div class="country-filter-chip active" data-country="ALL">
            <span class="flag-emoji">🌍</span>
            <span>All Countries</span>
        </div>
    `;

    // 🔹 Ülke chip'leri (Twemoji ile)
    countries.forEach(country => {
        const code = getCountryCode(country);
        const flag = getCountryFlagByName(country) || '🏳️';

        html += `
            <div class="country-filter-chip" data-country="${code}">
                <span class="flag-emoji">${flag}</span>
                <span>${country}</span>
            </div>
        `;
    });

    // 🔹 Render sonrası
container.innerHTML = html;

// 🔹 Twemoji'yi hemen uygula (senkron)
if (window.twemoji) {
    window.twemoji.parse(container, {
        folder: 'svg',
        ext: '.svg'
    });
}

// 🔹 Event listener
container.querySelectorAll('.country-filter-chip').forEach(chip => {
    chip.addEventListener('click', e => {
        const selected = chip.getAttribute('data-country');

        // Aktif chip güncelle
        container.querySelectorAll('.country-filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        if (selected === 'ALL') {
            console.log('🌍 Showing all authorized countries:', window.currentUser?.countries);
            renderAssetCards(filteredAssets, window.currentUser?.countries);
        } else {
            console.log(`🏳️ Showing assets for: ${selected}`);
            renderAssetCards(filteredAssets, [selected]);
        }

        // ✅ Flag'leri tekrar uygula (yeniden render sonrası)
        if (window.twemoji) {
            window.twemoji.parse(document.body, {
                folder: 'svg',
                ext: '.svg'
            });
        }
    });
});


    // ✅ Twemoji ilk yüklemede de uygula
    if (window.initializeTwemoji) {
        initializeTwemoji();
    }

    console.log(`✅ Rendered ${countries.length} country filters with Twemoji flags`);
}



function filterByCountry(country, event) {
    currentCountry = country === 'all' ? null : country;
    
    document.querySelectorAll('.country-filter-chip').forEach(chip => {
        chip.classList.remove('active');
    });
    
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    } else {
        const targetChip = document.querySelector(`[data-country="${country}"]`);
        if (targetChip) targetChip.classList.add('active');
    }
    
    renderSummaryStats();
    renderAssetCards();
    initializeTwemoji();
}

// ============================================================
// SUMMARY STATS
// ============================================================

function getCategoryCount(dataset, categoryGroup) {
    const categories = CATEGORY_GROUPS[categoryGroup] || [];
    return dataset.filter(a => categories.includes(a.model_category)).length;
}

function renderSummaryStats() {
    const container = document.getElementById('summaryStats');
    if (!container) return;
    
    const dataset = currentCountry 
        ? filteredAssets.filter(a => a.country === currentCountry)
        : filteredAssets;
    
    const computers = getCategoryCount(dataset, 'Computers');
    const mobilePhones = getCategoryCount(dataset, 'Mobile Phone');     // ✅ YENİ
    const mobileDevices = getCategoryCount(dataset, 'Mobile Device');   // ✅ YENİ
    const network = getCategoryCount(dataset, 'Network');
    const servers = getCategoryCount(dataset, 'Servers');
    const operational = getCategoryCount(dataset, 'Operational');
    
    const html = `
        <div class="stat-card">
            <div class="stat-card-header">
                <div class="stat-icon">
                    <i class="fas fa-microchip"></i>
                </div>
                <span class="stat-label">Total Assets</span>
            </div>
            <p class="stat-value">${dataset.length.toLocaleString()}</p>
        </div>
        
        <div class="stat-card">
            <div class="stat-card-header">
                <div class="stat-icon">
                    <i class="fas fa-laptop"></i>
                </div>
                <span class="stat-label">Computers</span>
            </div>
            <p class="stat-value">${computers.toLocaleString()}</p>
        </div>
        
        <div class="stat-card">
            <div class="stat-card-header">
                <div class="stat-icon">
                    <i class="fas fa-mobile-screen"></i>
                </div>
                <span class="stat-label">Mobile Phones</span>
            </div>
            <p class="stat-value">${mobilePhones.toLocaleString()}</p>
        </div>
        
        <div class="stat-card">
            <div class="stat-card-header">
                <div class="stat-icon">
                    <i class="fas fa-mobile-screen-button"></i>
                </div>
                <span class="stat-label">Mobile Devices</span>
            </div>
            <p class="stat-value">${mobileDevices.toLocaleString()}</p>
        </div>
        
        <div class="stat-card">
            <div class="stat-card-header">
                <div class="stat-icon">
                    <i class="fas fa-network-wired"></i>
                </div>
                <span class="stat-label">Network Devices</span>
            </div>
            <p class="stat-value">${network.toLocaleString()}</p>
        </div>
        
        <div class="stat-card">
            <div class="stat-card-header">
                <div class="stat-icon">
                    <i class="fas fa-server"></i>
                </div>
                <span class="stat-label">Servers</span>
            </div>
            <p class="stat-value">${servers.toLocaleString()}</p>
        </div>
        
        <div class="stat-card">
            <div class="stat-card-header">
                <div class="stat-icon">
                    <i class="fas fa-server"></i>
                </div>
                <span class="stat-label">Operational</span>
            </div>
            <p class="stat-value">${operational.toLocaleString()}</p>
        </div>
    `;
    
    container.innerHTML = html;
}

// ============================================================
// ASSET CARDS
// ============================================================

/**
 * Render grouped asset cards by country and category.
 * @param {Array} assets - The filtered asset dataset.
 * @param {string|Array} [countries='ALL'] - Single country code or array of codes.
 */
function renderAssetCards(assets = [], countries = 'ALL') {
    const container = document.getElementById('assetsContainer');
    if (!container) {
        console.error('❌ renderAssetCards: Missing #assetsContainer element.');
        return;
    }

    if (!Array.isArray(assets)) {
        console.error('❌ renderAssetCards: assets is not an array:', assets);
        return;
    }

    // Çoklu ülke desteği
    let dataset = assets;
    if (countries && countries !== 'ALL') {
        const countryList = Array.isArray(countries) ? countries : [countries];
        dataset = assets.filter(a => countryList.includes(a.countryCode) || countryList.includes(a.country));
    }

    console.log(`🔍 Rendering cards for: ${Array.isArray(countries) ? countries.join(', ') : countries}`);
    console.log(`📊 Dataset size: ${dataset.length}`);

    if (dataset.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fas fa-inbox"></i></div>
                <h3 class="empty-state-title">No Assets Found</h3>
                <p class="empty-state-subtitle">No assets available for the selected filter.</p>
            </div>`;
        return;
    }

    const grouped = dataset.reduce((acc, asset) => {
        const ctry = asset.country || 'Unknown';
        if (!acc[ctry]) acc[ctry] = [];
        acc[ctry].push(asset);
        return acc;
    }, {});

    console.log(`🌍 Countries in grouped data:`, Object.keys(grouped));

    const countriesSorted = Object.keys(grouped).sort((a, b) => {
        const codeA = getCountryCode(a);
        const codeB = getCountryCode(b);
        if (window.COUNTRY_ORDER && codeA && codeB) {
            const indexA = window.COUNTRY_ORDER.indexOf(codeA);
            const indexB = window.COUNTRY_ORDER.indexOf(codeB);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
        }
        return a.localeCompare(b);
    });

    let html = '';

    countriesSorted.forEach(ctry => {
        const assetsByCountry = grouped[ctry];
        const flag = getCountryFlagByName(ctry) || '🏳️';

        const categories = [
            ['Computers', 'laptop'],
            ['Mobile Phone', 'mobile-screen'],
            ['Mobile Device', 'mobile-screen-button'],
            ['Network', 'network-wired'],
            ['Printers', 'print'],
            ['Servers', 'server'],
            ['Operational', 'server'],
            ['eTime', 'clock'],
            ['Telephony', 'phone']
        ];

        const totalKnown = categories.reduce((sum, [label]) => sum + getCategoryCount(assetsByCountry, label), 0);
        const others = assetsByCountry.length - totalKnown;

        html += `
            <div class="asset-card" onclick="showAssetDetail('${ctry}', 'all')">
                <div class="asset-card-header">
                    <div class="asset-card-flag">${flag}</div>
                    <div class="asset-card-title">
                        <h3 class="asset-card-country">${ctry}</h3>
                        <p class="asset-card-count">${assetsByCountry.length} assets</p>
                    </div>
                </div>
                <div class="asset-categories">
                    ${categories.map(([label, icon]) =>
                        renderCategoryItem(ctry, label, getCategoryCount(assetsByCountry, label), icon)
                    ).join('')}
                    ${others > 0 ? renderCategoryItem(ctry, 'Others', others, 'cube') : ''}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    console.log('✅ Cards rendered successfully.');
}


/**
 * Helper to render a single category item.
 */
function renderCategoryItem(country, label, count, icon) {
    if (!count || count <= 0) return '';
    return `
        <div class="category-item" onclick="event.stopPropagation(); showAssetDetail('${country}', '${label}');">
            <div class="category-label">
                <i class="fas fa-${icon}"></i>
                <span>${label}</span>
            </div>
            <p class="category-value">${count}</p>
        </div>
    `;
}


// ============================================================
// ASSET DETAIL MODAL
// ============================================================

function showAssetDetail(country, category) {
    console.log(`📘 Opening detail modal for ${country} - ${category}`);
    
    currentCountry = country;
    currentCategory = category;
    
    let assets = filteredAssets.filter(a => a.country === country);
    console.log(`🔍 Found ${assets.length} assets in ${country}`);

    if (category !== 'all') {
        const categoryList = CATEGORY_GROUPS[category];

        if (categoryList) {
            console.log(`🎯 Filtering by category: ${category}`, categoryList);
            assets = assets.filter(a => categoryList.includes(a.model_category));
            console.log(`📉 After category filter: ${assets.length}`);
        } else if (category === 'Others') {
            const allMainCategories = Object.values(CATEGORY_GROUPS).flat();
            assets = assets.filter(a => !allMainCategories.includes(a.model_category));
        }
    }

    modalAssets = assets;
    currentFilteredAssets = assets;

    // Reset filter states
    categoryFilterMode = 'all';
    selectedLocationFilter = 'all';
    selectedUtilizationFilter = 'all';
    activeQuickFilters = [];
    filtersPanelOpen = false;

    // Header title
    const flag = getCountryFlagByName(country) || '🏳️';
    const modalTitle = document.getElementById('assetsModalTitle');
    if (modalTitle) {
        modalTitle.innerHTML = `${flag} ${country} - ${category === 'all' ? 'All Assets' : category} <span style="color: #38bdf8;">(${assets.length})</span>`;
        if (typeof twemoji !== 'undefined') {
            twemoji.parse(modalTitle, { folder: 'svg', ext: '.svg' });
        }
    }

    // Render and reset UI
    renderAssetTable(assets);
    renderModalFilters();

    const panel = document.getElementById('filtersPanel');
    const toggleBtn = document.getElementById('toggleFiltersBtn');

    if (panel) panel.classList.add('collapsed');
    if (toggleBtn)
        toggleBtn.innerHTML = `
            <i class="fas fa-filter"></i> Filters
            <span class="filter-count-badge" id="filterCountBadge" style="display: none;">0</span>
        `;

    updateFilterCountBadge();

    const modal = document.getElementById('assetsDetailModal');
    if (modal) modal.classList.add('show');

    console.log(`✅ Modal opened successfully with ${assets.length} assets`);
}


function closeAssetModal() {
    const modal = document.getElementById('assetsDetailModal');
    if (modal) {
        modal.classList.remove('show');
    }
    
    const searchInput = document.getElementById('assetsSearchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    const clearBtn = document.querySelector('.assets-clear-search');
    if (clearBtn) {
        clearBtn.style.display = 'none';
    }
    
    modalAssets = [];
}

// ============================================================
// TOGGLE FILTERS PANEL
// ============================================================

function toggleFiltersPanel() {
    const panel = document.getElementById('filtersPanel');
    const btn = document.getElementById('toggleFiltersBtn');
    
    if (!panel || !btn) {
        console.error('âŒ Panel or button not found!');
        return;
    }
    
    filtersPanelOpen = !filtersPanelOpen;
    
    console.log('ðŸ”„ Toggling filters panel:', filtersPanelOpen ? 'OPEN' : 'CLOSED');
    
    if (filtersPanelOpen) {
        panel.classList.remove('collapsed');
        btn.innerHTML = '<i class="fas fa-filter"></i> Hide Filters <span class="filter-count-badge" id="filterCountBadge" style="display: none;">0</span>';
    } else {
        panel.classList.add('collapsed');
        btn.innerHTML = '<i class="fas fa-filter"></i> Filters <span class="filter-count-badge" id="filterCountBadge" style="display: none;">0</span>';
    }
    
    updateFilterCountBadge();
}

// ============================================================
// UPDATE FILTER COUNT BADGE
// ============================================================

function updateFilterCountBadge() {
    const badge = document.getElementById('filterCountBadge');
    if (!badge) return;
    
    let count = 0;
    
    if (categoryFilterMode !== 'all') count++;
    if (selectedLocationFilter !== 'all') count++;
    if (selectedUtilizationFilter !== 'all') count++;
    count += activeQuickFilters.length;
    
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'inline-flex';
    } else {
        badge.style.display = 'none';
    }
}

// ============================================================
// RENDER MODAL FILTERS
// ============================================================

function renderModalFilters() {
    renderModalCategoryFilters();
    renderLocationFilter();
}

function renderModalCategoryFilters() {
    const container = document.getElementById('modalCategoryFilters');
    if (!container) return;
    
    const categories = {};
    modalAssets.forEach(asset => {
        const displayName = getDisplayName(asset.model_category);
        const config = getCategoryConfig(asset.model_category);
        
        if (!categories[displayName]) {
            categories[displayName] = {
                count: 0,
                config: config
            };
        }
        categories[displayName].count++;
    });
    
    categoryFilterMode = 'all';
    selectedModalCategories = Object.keys(categories);
    
    let html = `
        <div class="modal-category-chip active" data-category="all">
            <i class="fas fa-globe"></i>
            <span>All</span>
            <span class="chip-count">(${modalAssets.length})</span>
        </div>
    `;
    
    Object.keys(categories).sort().forEach(catName => {
        const cat = categories[catName];
        // ESCAPE category name for safe HTML attribute
        const safeCatName = catName.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
        
        html += `
            <div class="modal-category-chip" data-category="${safeCatName}">
                <i class="fas ${cat.config.icon}" style="color: ${cat.config.color};"></i>
                <span>${catName}</span>
                <span class="chip-count">(${cat.count})</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // âœ… Add event listeners AFTER rendering
    attachCategoryChipListeners();
}

function attachCategoryChipListeners() {
    // All chip
    const allChip = document.querySelector('.modal-category-chip[data-category="all"]');
    if (allChip) {
        allChip.addEventListener('click', () => {
            toggleAllCategories();
        });
    }
    
    // Category chips
    const categoryChips = document.querySelectorAll('.modal-category-chip[data-category]:not([data-category="all"])');
    categoryChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const category = chip.getAttribute('data-category');
            // Decode HTML entities
            const decodedCategory = category.replace(/&#39;/g, "'").replace(/&quot;/g, '"');
            toggleModalCategory(decodedCategory);
        });
    });
}

function renderLocationFilter() {
    const select = document.getElementById('locationFilterSelect');
    if (!select) return;
    
    const locations = new Set();
    currentFilteredAssets.forEach(asset => {
        const location = getSmartLocation(asset);
        if (location && location !== 'N/A') {
            locations.add(location);
        }
    });
    
    let html = '<option value="all">All Locations</option>';
    
    Array.from(locations).sort().forEach(location => {
        html += `<option value="${location}">${location}</option>`;
    });
    
    select.innerHTML = html;
    select.value = selectedLocationFilter;
}

// ============================================================
// CATEGORY FILTER LOGIC
// ============================================================

function toggleAllCategories() {
    console.log('ðŸŒ Toggle ALL categories');
    categoryFilterMode = 'all';
    
    // TÃ¼m kategorileri listeye ekle
    const allChips = document.querySelectorAll('.modal-category-chip[data-category]:not([data-category="all"])');
    selectedModalCategories = [];
    allChips.forEach(chip => {
        const cat = chip.getAttribute('data-category');
        // Decode HTML entities
        const decodedCat = cat.replace(/&#39;/g, "'").replace(/&quot;/g, '"');
        selectedModalCategories.push(decodedCat);
        chip.classList.remove('active');
    });
    
    // Sadece All chip'i aktif et
    const allChip = document.querySelector('.modal-category-chip[data-category="all"]');
    if (allChip) {
        allChip.classList.add('active');
    }
    
    console.log('âœ… ALL mode, categories in list:', selectedModalCategories);
    
    updateFilterCountBadge();
    applyModalFilters();
}

function toggleModalCategory(category) {
    console.log('ðŸ”„ Toggle category:', category);
    
    const allChip = document.querySelector('.modal-category-chip[data-category="all"]');
    
    // Escape category for selector
    const safeCat = category.replace(/'/g, "\\'").replace(/"/g, '\\"');
    const chip = document.querySelector(`.modal-category-chip[data-category="${safeCat}"]`);
    
    if (!chip) {
        console.error('âŒ Chip not found for category:', category);
        return;
    }
    
    // EÄŸer All aktifse, All'Ä± kapat ve SADECE bu kategoriyi aÃ§
    if (categoryFilterMode === 'all') {
        console.log('ðŸ“Œ Switching from ALL to specific category');
        categoryFilterMode = 'specific';
        
        if (allChip) {
            allChip.classList.remove('active');
        }
        
        // TÃ¼m kategorileri deaktif et
        document.querySelectorAll('.modal-category-chip[data-category]:not([data-category="all"])').forEach(c => {
            c.classList.remove('active');
        });
        
        // Sadece tÄ±klanan kategoriyi aktif et
        selectedModalCategories = [category];
        chip.classList.add('active');
        
        console.log('âœ… Selected categories:', selectedModalCategories);
        
    } else {
        // Specific modundayÄ±z, toggle yap
        console.log('ðŸ“Œ Specific mode - toggling category');
        
        if (selectedModalCategories.includes(category)) {
            // Ã‡Ä±kar
            selectedModalCategories = selectedModalCategories.filter(c => c !== category);
            chip.classList.remove('active');
            
            console.log(`âž– Removed ${category}, remaining:`, selectedModalCategories);
            
            // HiÃ§ kategori kalmadÄ±ysa All'a dÃ¶n
            if (selectedModalCategories.length === 0) {
                console.log('âš ï¸ No categories left, switching to ALL');
                toggleAllCategories();
                return;
            }
        } else {
            // Ekle
            selectedModalCategories.push(category);
            chip.classList.add('active');
            
            console.log(`âž• Added ${category}, total:`, selectedModalCategories);
            
            // TÃ¼m kategoriler seÃ§ildiyse All moduna geÃ§
            const allChips = document.querySelectorAll('.modal-category-chip[data-category]:not([data-category="all"])');
            if (selectedModalCategories.length === allChips.length) {
                console.log('âœ… All categories selected, switching to ALL mode');
                toggleAllCategories();
                return;
            }
        }
    }
    
    updateFilterCountBadge();
    applyModalFilters();
}

// ============================================================
// LOCATION & UTILIZATION FILTERS
// ============================================================

function filterByLocation() {
    const select = document.getElementById('locationFilterSelect');
    if (!select) return;
    
    selectedLocationFilter = select.value;
    console.log('ðŸ“ Location filter:', selectedLocationFilter);
    updateFilterCountBadge();
    applyModalFilters();
}

function filterByUtilization(utilization) {
    console.log('ðŸ“Š Utilization filter:', utilization);
    selectedUtilizationFilter = utilization;
    
    document.querySelectorAll('[data-utilization]').forEach(chip => {
        chip.classList.remove('active');
    });
    
    const targetChip = document.querySelector(`[data-utilization="${utilization}"]`);
    if (targetChip) {
        targetChip.classList.add('active');
    }
    
    updateFilterCountBadge();
    applyModalFilters();
}

function toggleQuickFilter(filterType, element) {
    console.log('âš¡ Quick filter:', filterType);
    
    if (activeQuickFilters.includes(filterType)) {
        activeQuickFilters = activeQuickFilters.filter(f => f !== filterType);
        element.classList.remove('active');
    } else {
        activeQuickFilters.push(filterType);
        element.classList.add('active');
    }
    
    updateFilterCountBadge();
    applyModalFilters();
}

// ============================================================
// CLEAR ALL FILTERS
// ============================================================

function clearAllFilters() {
    console.log('ðŸ§¹ Clearing all filters');
    
    categoryFilterMode = 'all';
    selectedLocationFilter = 'all';
    selectedUtilizationFilter = 'all';
    activeQuickFilters = [];
    
    const searchInput = document.getElementById('assetsSearchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    renderModalFilters();
    
    const utilizationChips = document.querySelectorAll('[data-utilization]');
    utilizationChips.forEach(chip => chip.classList.remove('active'));
    document.querySelector('[data-utilization="all"]')?.classList.add('active');
    
    document.querySelectorAll('.modal-quick-filter').forEach(chip => {
        chip.classList.remove('active');
    });
    
    const locationSelect = document.getElementById('locationFilterSelect');
    if (locationSelect) {
        locationSelect.value = 'all';
    }
    
    updateFilterCountBadge();
    applyModalFilters();
}

// ============================================================
// APPLY ALL FILTERS
// ============================================================

function applyModalFilters() {
    let assets = [...modalAssets];

    // 1) Kategori
    if (categoryFilterMode === 'specific' && selectedModalCategories.length > 0) {
        assets = assets.filter(asset => {
            const disp = getDisplayName(asset.model_category);
            return selectedModalCategories.includes(disp);
        });
    }

    // 2) Lokasyon
    if (selectedLocationFilter !== 'all') {
        assets = assets.filter(asset => {
            const loc = getSmartLocation(asset);
            return loc === selectedLocationFilter;
        });
    }

    // 3) Utilization
    if (selectedUtilizationFilter !== 'all') {
        assets = assets.filter(asset => asset.asset_utilization === selectedUtilizationFilter);
    }

    // 4) ✅ OS filtresi
    if (selectedOSFilter !== 'all') {
        assets = assets.filter(asset => {
            const os = asset.operating_system_normalized || asset.operating_system || asset['Operating System'] || '';
            return os === selectedOSFilter;
        });
    }

    // 5) ✅ Aktivite filtresi
    if (selectedActivityFilter !== 'all') {
        const limit = parseInt(selectedActivityFilter, 10); // 30 / 60 / 90
        assets = assets.filter(asset => {
            const days = asset.activity_days;
            if (days == null) return false;
            // 30 dersen son 30 günde görülenler
            return days <= limit;
        });
    }

    // 6) Hızlı filtreler
    if (activeQuickFilters.length > 0) {
        activeQuickFilters.forEach(f => {
            if (f === 'has_ip') {
                assets = assets.filter(a => a.ip_address && a.ip_address.trim() !== '');
            } else if (f === 'has_mac') {
                assets = assets.filter(a => a.mac_address && a.mac_address.trim() !== '');
            } else if (f === 'has_warranty') {
                assets = assets.filter(a => a.warranty_expiration);
            }
        });
    }

    // 7) Arama
    const searchInput = document.getElementById('assetsSearchInput');
    const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
    if (q) {
        const qClean = q.replace(/[:\-\s]/g, '');
        assets = assets.filter(asset => {
            const macClean = asset.mac_address ? asset.mac_address.replace(/[:\-\s]/g, '').toLowerCase() : '';
            return (
                (asset.model && asset.model.toLowerCase().includes(q)) ||
                (asset.assigned_to && asset.assigned_to.toLowerCase().includes(q)) ||
                (asset.serial_number && asset.serial_number.toLowerCase().includes(q)) ||
                (macClean && macClean.includes(qClean)) ||
                (asset.city && asset.city.toLowerCase().includes(q)) ||
                (asset.model_category && asset.model_category.toLowerCase().includes(q)) ||
                (asset.display_name && asset.display_name.toLowerCase().includes(q)) ||
                (asset.location_code && asset.location_code.toLowerCase().includes(q)) ||
                (asset.operating_system_normalized && asset.operating_system_normalized.toLowerCase().includes(q))
            );
        });
    }

    // Sonucu yaz
    currentFilteredAssets = assets;
    renderAssetTable(assets);
    renderLocationFilter();
    updateFilterCountBadge();
}


// ============================================================
// SEARCH FUNCTIONALITY
// ============================================================

function searchAssets() {
    applyModalFilters();
    
    const searchInput = document.getElementById('assetsSearchInput');
    const clearBtn = document.querySelector('.assets-clear-search');
    if (searchInput && clearBtn) {
        clearBtn.style.display = searchInput.value.trim() ? 'flex' : 'none';
    }
}

function clearSearch() {
    const searchInput = document.getElementById('assetsSearchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    searchAssets();
}

function setOSFilter(os) {
    selectedOSFilter = os;
    document.querySelectorAll('#osFilterChips .modal-filter-chip').forEach(ch => ch.classList.remove('active'));
    const chip = document.querySelector(`#osFilterChips .modal-filter-chip[data-os="${os}"]`);
    if (chip) chip.classList.add('active');
    applyModalFilters();
}

function setActivityFilter(v) {
    selectedActivityFilter = v;
    document.querySelectorAll('#activityFilterChips .modal-filter-chip').forEach(ch => ch.classList.remove('active'));
    const chip = document.querySelector(`#activityFilterChips .modal-filter-chip[data-activity="${v}"]`);
    if (chip) chip.classList.add('active');
    applyModalFilters();
}


// ============================================================
// COLUMN SORTING
// ============================================================

function sortTable(column) {
    console.log('ðŸ”„ Sorting by:', column);
    
    if (currentSortColumn === column) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortColumn = column;
        currentSortDirection = 'asc';
    }
    
    const sorted = [...currentFilteredAssets].sort((a, b) => {
        let valA = a[column] || '';
        let valB = b[column] || '';
        
        if (column === 'model_category') {
            valA = getDisplayName(valA);
            valB = getDisplayName(valB);
        }
        
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        
        if (valA < valB) return currentSortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return currentSortDirection === 'asc' ? 1 : -1;
        return 0;
    });
    
    currentFilteredAssets = sorted;
    renderAssetTable(sorted);
}

// ============================================================
// ASSET TABLE
// ============================================================

function renderAssetTable(assets) {
    const tbody = document.getElementById('assetsTableBody');
    const resultCount = document.getElementById('assetsResultCount');
    
    if (!tbody) return;
    
    if (resultCount) {
        resultCount.textContent = assets.length.toLocaleString();
    }
    
    // Empty state - Premium design
    if (assets.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-state-row">
                <td colspan="6">
                    <div class="table-empty-state">
                        <div class="empty-icon-container">
                            <i class="fas fa-database"></i>
                            <i class="fas fa-search empty-search-icon"></i>
                        </div>
                        <h3 class="empty-title">No Assets Found</h3>
                        <p class="empty-description">Try adjusting your filters or search criteria</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    assets.forEach((asset, index) => {
        const config = getCategoryConfig(asset.model_category);
        const displayName = getDisplayName(asset.model_category);
        const smartLocation = getSmartLocation(asset);
        const cityLocation = asset.city || 'N/A';
        
        // State badge helper
        const getStateDot = (state) => {
            const stateMap = {
                'In Use': '#22c55e',
                'In Stock': '#3b82f6',
                'Retired': '#ef4444',
                'In Repair': '#f59e0b'
            };
            const color = stateMap[state] || '#6b7280';
            return `<span class="state-dot" style="background: ${color};" title="${state || 'Unknown'}"></span>`;
        };
        
        // Animate rows on render
        const delay = Math.min(index * 0.03, 1);
        
        html += `
            <tr class="asset-table-row" 
                onclick='showAssetDetailInfo(${JSON.stringify(asset).replace(/'/g, "&#39;")})'
                style="animation-delay: ${delay}s;">
                
                <!-- Type Badge -->
                <td class="cell-type">
                    <div class="type-badge-container">
                        ${getStateDot(asset.state)}
                        <span class="type-badge" style="
                            --badge-bg: ${config.color}18;
                            --badge-border: ${config.color}40;
                            --badge-color: ${config.color};
                        ">
                            <i class="fas ${config.icon}"></i>
                            <span class="badge-text">${displayName}</span>
                        </span>
                    </div>
                </td>
                
                <!-- Hostname -->
                <td class="cell-hostname">
                    <div class="hostname-container">
                        <i class="fas fa-desktop hostname-icon"></i>
                        <span class="hostname-text">${escapeHtml(asset.configuration_item || 'N/A')}</span>
                    </div>
                </td>
                
                <!-- Model -->
                <td class="cell-model">
                    <span class="model-text">${escapeHtml(asset.model || 'N/A')}</span>
                </td>
                
                <!-- Serial Number -->
                <td class="cell-serial">
                    <code class="serial-code" title="Click asset row for details">
                        <i class="fas fa-barcode"></i>
                        ${escapeHtml(asset.serial_number || 'N/A')}
                    </code>
                </td>
                
                <!-- Assigned To -->
                <td class="cell-assigned">
                    <div class="assigned-container">
                        ${asset.assigned_to ? `
                            <div class="user-avatar-small">
                                ${getInitials(asset.assigned_to)}
                            </div>
                            <span class="assigned-name">${escapeHtml(asset.assigned_to)}</span>
                        ` : `
                            <span class="unassigned-badge">
                                <i class="fas fa-user-slash"></i>
                                Unassigned
                            </span>
                        `}
                    </div>
                </td>
                
                <!-- Location -->
                <td class="cell-location">
                    <div class="location-container">
                        <i class="fas fa-map-marker-alt location-icon"></i>
                        <div class="location-text">
                            <span class="location-city">${escapeHtml(cityLocation)}</span>
                            ${smartLocation !== 'N/A' && smartLocation !== cityLocation ? 
                                `<span class="location-code">${escapeHtml(smartLocation)}</span>` 
                                : ''}
                        </div>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    
    // Add stagger animation class
    setTimeout(() => {
        const rows = tbody.querySelectorAll('.asset-table-row');
        rows.forEach(row => row.classList.add('visible'));
    }, 10);
}

// Helper: Get user initials for avatar
function getInitials(name) {
    if (!name || name === 'N/A') return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// ============================================================
// ASSET DETAIL INFO MODAL
// ============================================================

window.copyToClipboard = function (text) {
    navigator.clipboard.writeText(text).then(() => {
        const toast = document.createElement('div');
        toast.className = 'copy-toast';
        toast.textContent = 'Copied to clipboard';
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('visible'), 10);
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 1800);
    }).catch(err => console.error('Clipboard copy failed:', err));
};

function showAssetDetailInfo(asset) {
    const config = getCategoryConfig(asset.model_category);
    const displayName = getDisplayName(asset.model_category);
    const smartLocation = getSmartLocation(asset);

    // Relative time helper
    const getRelativeTime = (dateString) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Unknown';
        
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    };

    // Format Turkish date
    const formatTRDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    };

    // Status badge helper
    const getStatusBadge = (state) => {
        const statusMap = {
            'In Use': { icon: 'fa-circle-check', color: '#22c55e', text: 'Active' },
            'In Stock': { icon: 'fa-box', color: '#3b82f6', text: 'In Stock' },
            'Retired': { icon: 'fa-ban', color: '#ef4444', text: 'Retired' },
            'In Repair': { icon: 'fa-wrench', color: '#f59e0b', text: 'In Repair' }
        };
        const status = statusMap[state] || { icon: 'fa-question-circle', color: '#6b7280', text: state || 'Unknown' };
        return `<span class="status-badge" style="--badge-color: ${status.color}">
            <i class="fas ${status.icon}"></i> ${status.text}
        </span>`;
    };

    // Warranty status helper with expired date
    const getWarrantyStatus = (date) => {
        if (!date) return '<span class="warranty-badge expired"><i class="fas fa-times-circle"></i> No Warranty</span>';
        const warrantyDate = new Date(date);
        const now = new Date();
        const daysLeft = Math.floor((warrantyDate - now) / (1000 * 60 * 60 * 24));
        
        if (daysLeft < 0) {
            return `<span class="warranty-badge expired" title="Expired on ${formatTRDate(date)}">
                <i class="fas fa-times-circle"></i> Expired (${formatTRDate(date)})
            </span>`;
        }
        if (daysLeft < 90) {
            return `<span class="warranty-badge warning" title="Expires on ${formatTRDate(date)}">
                <i class="fas fa-exclamation-triangle"></i> ${daysLeft} days left
            </span>`;
        }
        return `<span class="warranty-badge valid" title="Valid until ${formatTRDate(date)}">
            <i class="fas fa-shield-check"></i> Valid until ${formatDate(date)}
        </span>`;
    };

    // Field renderer with icons
    const renderField = (icon, label, value, copyable = false, type = 'text') => {
        if (!value || value === 'N/A') return '';
        
        let displayValue = value;
        let extraClass = '';
        let tooltip = copyable ? 'Click to copy' : '';
        
        if (type === 'code') {
            displayValue = `<code class="field-code">${escapeHtml(value)}</code>`;
            extraClass = 'has-code';
        } else if (type === 'badge') {
            displayValue = value; // Already formatted
            extraClass = 'has-badge';
            tooltip = ''; // badges have their own tooltips
        } else if (type === 'country') {
            const flag = getCountryFlagByName(value) || '🏳️';
            displayValue = `<span class="country-with-flag"><span class="flag-emoji">${flag}</span> ${escapeHtml(value)}</span>`;
            extraClass = 'has-flag';
            tooltip = '';
        } else if (type === 'relative-time') {
            const relativeText = getRelativeTime(value);
            const fullDate = formatTRDate(value);
            displayValue = `<span class="relative-time" onclick="toggleTimeFormat(this)" data-full-date="${fullDate}" data-relative="${relativeText}">
                ${relativeText}
            </span>`;
            extraClass = 'has-relative-time';
            tooltip = 'Click to see full date';
        }
        
        return `
            <div class="detail-field ${copyable ? 'copyable' : ''} ${extraClass}" 
                 ${copyable ? `onclick="copyToClipboard('${escapeHtml(value)}')" title="${tooltip}"` : ''}
                 data-field="${label}">
                <div class="field-icon">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="field-content">
                    <span class="field-label">${label}</span>
                    <span class="field-value">${displayValue}</span>
                </div>
            </div>
        `;
    };

    // Organize fields into sections
    const sections = {
        basic: {
            title: 'Device Information',
            icon: 'fa-info-circle',
            fields: [
                renderField('fa-desktop', 'Hostname', asset.configuration_item, true, 'code'),
                renderField('fa-tag', 'Display Name', asset.display_name),
                renderField('fa-microchip', 'Model', asset.model, true),
                renderField('fa-barcode', 'Serial Number', asset.serial_number, true, 'code'),
                renderField('fa-signal', 'State', getStatusBadge(asset.state), false, 'badge'),
                renderField('fa-shield-halved', 'Warranty', getWarrantyStatus(asset.warranty_expiration), false, 'badge')
            ].filter(f => f).join('')
        },
        assignment: {
            title: 'Assignment & Location',
            icon: 'fa-map-marker-alt',
            fields: [
                renderField('fa-user', 'Assigned To', asset.assigned_to || 'Unassigned'),
                renderField('fa-building', 'Location Code', smartLocation, true),
                renderField('fa-city', 'City', asset.city),
                renderField('fa-flag', 'Country', asset.country, false, 'country'),
                renderField('fa-chart-pie', 'Utilization', asset.asset_utilization),
                renderField('fa-clock', 'Last Discovery', asset['Most recent discovery'] || asset.most_recent_discovery, false, 'relative-time')
            ].filter(f => f).join('')
        },
        technical: {
            title: 'Technical Details',
            icon: 'fa-cogs',
            fields: [
                renderField('fa-network-wired', 'IP Address', asset.ip_address, true, 'code'),
                renderField('fa-fingerprint', 'MAC Address', asset.mac_address, true, 'code'),
                renderField('fa-desktop', 'Operating System', asset.operating_system_normalized || asset.operating_system),
                renderField('fa-users', 'Hardware Support', asset.hardware_support_group),
                renderField('fa-headset', 'CI Support Group', asset.ci_support_group)
            ].filter(f => f).join('')
        }
    };

    const modalHtml = `
        <div class="asset-info-overlay show" id="assetInfoModal" onclick="closeAssetInfo(event)">
            <div class="asset-info-dialog" onclick="event.stopPropagation()">
                <!-- Header with device type badge -->
                <div class="asset-info-header">
                    <div class="header-left">
                        <div class="device-type-badge" style="--device-color: ${config.color}">
                            <i class="fas ${config.icon}"></i>
                            <span>${displayName}</span>
                        </div>
                        <h2 class="asset-info-title">${escapeHtml(asset.configuration_item || 'Asset Details')}</h2>
                    </div>
                    <button class="asset-info-close" onclick="closeAssetInfo()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <!-- Body with sections -->
                <div class="asset-info-body">
                    ${Object.entries(sections).map(([key, section]) => `
                        <div class="info-section" data-section="${key}">
                            <div class="section-header">
                                <i class="fas ${section.icon}"></i>
                                <h3>${section.title}</h3>
                            </div>
                            <div class="section-grid">
                                ${section.fields}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Parse twemoji flags
    if (typeof twemoji !== 'undefined') {
        const modal = document.getElementById('assetInfoModal');
        twemoji.parse(modal, { folder: 'svg', ext: '.svg' });
    }
    
    // Trigger animation
    setTimeout(() => {
        const dialog = document.querySelector('.asset-info-dialog');
        if (dialog) dialog.classList.add('animated');
    }, 10);
}

// Toggle between relative and full date
window.toggleTimeFormat = function(element) {
    const fullDate = element.getAttribute('data-full-date');
    const relative = element.getAttribute('data-relative');
    const current = element.textContent;
    
    if (current === relative) {
        element.textContent = fullDate;
        element.setAttribute('title', 'Click to see relative time');
    } else {
        element.textContent = relative;
        element.setAttribute('title', 'Click to see full date');
    }
};

function closeAssetInfo(event) {
    if (event && event.target.id !== 'assetInfoModal') return;
    
    const modal = document.getElementById('assetInfoModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

// ============================================================
// EXPORT TO CSV
// ============================================================

function exportToCSV() {
    const assetsToExport = currentFilteredAssets.length > 0 ? currentFilteredAssets : modalAssets;
    
    if (assetsToExport.length === 0) {
        alert('No data to export!');
        return;
    }
    
    console.log('ðŸ“¤ Exporting to CSV...');
    
    const headers = ['Type', 'Hostname', 'Model', 'Serial Number', 'Assigned To', 'City', 'Location Code', 'Asset Utilization', 'Country', 'IP Address', 'MAC Address'];
    
    const rows = assetsToExport.map(asset => {
        const displayName = getDisplayName(asset.model_category);
        const smartLocation = getSmartLocation(asset);
        
        return [
            displayName,
            asset.display_name || 'N/A',
            asset.model || 'N/A',
            asset.serial_number || 'N/A',
            asset.assigned_to || 'Unassigned',
            asset.city || 'N/A',
            smartLocation,
            asset.asset_utilization || 'N/A',
            asset.country || 'N/A',
            asset.ip_address || 'N/A',
            asset.mac_address || 'N/A'
        ];
    });
    
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const filename = `assets_${currentCountry || 'all'}_${currentCategory || 'all'}_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('âœ… CSV exported:', filename);
}

// ============================================================
// REFRESH FUNCTION
// ============================================================

async function refreshAssets() {
    console.log('ðŸ”„ Refreshing assets...');
    showLoader();
    
    currentCountry = null;
    currentCategory = null;
    
    await loadAssets();
    
    hideLoader();
    
    console.log('âœ… Assets refreshed');
}


// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function normalizeCountryName(name) {
    if (!name) return name;
    
    const normalized = name.trim().toLowerCase();
    
    // Handle Turkey/Türkiye/Turkiye variations
    if (normalized === 'turkey' || normalized === 'türkiye' || normalized === 'turkiye' || normalized === 'türkiye') {
        return 'Türkiye';
    }
    
    // Handle other common variations
    const commonMappings = {
        'uk': 'United Kingdom',
        'united kingdom': 'United Kingdom',
        'bosnia': 'Bosnia and Herzegovina',
        'macedonia': 'North Macedonia',
        'north macedonia': 'North Macedonia'
    };
    
    if (commonMappings[normalized]) {
        return commonMappings[normalized];
    }
    
    // Capitalize first letter of each word
    return name.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
}

function getCountryFlagByName(countryName) {
    const normalized = normalizeCountryName(countryName);
    const code = getCountryCode(normalized);
    return code ? getCountryFlag(code) : '🏳️';
}

function getCategoryConfig(category) {
    return CATEGORY_CONFIG[category] || { icon: 'fa-cube', color: '#6b7280' };
}

function getSmartLocation(asset) {
    // ✅ Sadece location_code ve city kontrolü yap
    if (asset.location_code && asset.location_code.trim() !== '') {
        return asset.location_code.trim();
    }
    
    if (asset.city && asset.city.trim() !== '') {
        return asset.city.trim();
    }
    
    return 'N/A';
}

function getDisplayName(category) {
    return CATEGORY_DISPLAY_NAMES[category] || category;
}

function getCategoryIcon(category) {
    return CATEGORY_CONFIG[category]?.icon || 'fa-cube';
}

function getCategoryColor(category) {
    return CATEGORY_CONFIG[category]?.color || '#6b7280';
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    console.error('❌', message);
    alert(message);
}
// ============================================================
// EVENT LISTENERS
// ============================================================

document.addEventListener('click', (e) => {
    const modal = document.getElementById('assetsDetailModal');
    if (modal && e.target === modal) {
        closeAssetModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const infoModal = document.getElementById('assetInfoModal');
        if (infoModal) {
            closeAssetInfo();
        } else {
            closeAssetModal();
        }
    }
});

console.log('âœ… Assets.js loaded');