// ============================================================
// STOCKROOM MANAGEMENT - TABLE VIEW
// ============================================================

// Global state
let allAssets = [];
let filteredAssets = [];
let currentFilters = {
    country: [],
    stockroom: [],
	category: [],
    substate: [],
    search: ''
};
let currentPage = 1;
let pageSize = 50;
let currentUser = null;
let userCountries = [];

// Country mapping
const COUNTRY_CODE_MAP = {
    'TR': 'Türkiye', 'ES': 'Spain', 'PT': 'Portugal', 'CH': 'Switzerland',
    'CZ': 'Czech Republic', 'AT': 'Austria', 'RO': 'Romania', 'HU': 'Hungary',
    'GR': 'Greece', 'BG': 'Bulgaria', 'SK': 'Slovakia', 'SI': 'Slovenia',
    'BE': 'Belgium', 'DK': 'Denmark', 'FI': 'Finland', 'FR': 'France',
    'DE': 'Germany', 'IE': 'Ireland', 'IT': 'Italy', 'NL': 'Netherlands',
    'PL': 'Poland', 'SE': 'Sweden', 'GB': 'United Kingdom'
};

// Category colors (same as assets page)
const CATEGORY_CONFIG = {
    'Computers': { color: '#eab308', icon: 'fa-laptop' },
    'Mobile Device': { color: '#3b82f6', icon: 'fa-mobile-screen-button' },
    'Wireless Access Points': { color: '#a855f7', icon: 'fa-wifi' },
    'Hubs/Switches': { color: '#a855f7', icon: 'fa-network-wired' },
    'Routers': { color: '#a855f7', icon: 'fa-router' },
    'Network Equipment': { color: '#a855f7', icon: 'fa-ethernet' },
    'Printing Devices': { color: '#06b6d4', icon: 'fa-print' },
    'Windows Server': { color: '#ef4444', icon: 'fa-server' },
    'Linux Server': { color: '#f97316', icon: 'fa-server' },
    'Storage': { color: '#10b981', icon: 'fa-hard-drive' },
    'Monitor': { color: '#8b5cf6', icon: 'fa-desktop' },
    'Peripheral': { color: '#64748b', icon: 'fa-mouse' }
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Stockroom - Initializing...');
    await loadCurrentUser();
    await loadData();
    setupEventListeners();
});

// Load user
async function loadCurrentUser() {
    try {
        if (window.currentUser && window.currentUser.countries) {
            userCountries = window.currentUser.countries;
            currentUser = window.currentUser;
            console.log('✅ User countries:', userCountries);
        }
    } catch (error) {
        console.error('❌ Error loading user:', error);
    }
}

// Normalize country
function normalizeCountryName(country) {
    if (!country) return country;
    if (country === 'Turkey') return 'Türkiye';
    return country;
}

// Get country code
function getCountryCode(countryName) {
    const normalized = normalizeCountryName(countryName);
    for (const [code, name] of Object.entries(COUNTRY_CODE_MAP)) {
        if (name === normalized) return code;
    }
    return null;
}

// Load data
async function loadData() {
    try {
        const response = await fetch('/Horizon/api/data/stockroom-assets');
        
        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }
        
        let assets = await response.json();
        
        if (!Array.isArray(assets)) {
            throw new Error('Invalid data format');
        }
        
        // Normalize
        assets = assets.map(asset => ({
            ...asset,
            country: normalizeCountryName(asset.country),
            countryCode: getCountryCode(normalizeCountryName(asset.country))
        }));
        
        // Filter by permissions
        if (userCountries && userCountries.length > 0) {
            assets = assets.filter(asset => userCountries.includes(asset.countryCode));
            console.log('🔒 Filtered to user countries:', assets.length);
        }
        
        allAssets = assets;
        filteredAssets = assets;
        
        console.log('📦 Assets loaded:', assets.length);
        
        populateFilters();
        renderTable();
        updatePagination();
        
    } catch (error) {
        console.error('❌ Error loading data:', error);
        document.getElementById('tableBody').innerHTML = `
            <tr><td colspan="8" class="no-data-cell">Failed to load data</td></tr>
        `;
    }
}

// Populate filters
function populateFilters() {
    // Country
    const countries = [...new Set(allAssets.map(a => a.country))].sort();
    renderFilterOptions('country', countries, (c) => ({
        value: c,
        label: `${getCountryFlag(c)} ${c}`
    }));
	
	const categories = [...new Set(allAssets.map(a => a.model_category).filter(Boolean))].sort();
    renderFilterOptions('category', categories, (cat) => {
        const config = CATEGORY_CONFIG[cat] || { icon: 'fa-box' };
        return {
            value: cat,
            label: `<i class="fas ${config.icon}"></i> ${cat}`
        };
    });
    
    // Substate
    const substates = [...new Set(allAssets.map(a => a.substate).filter(Boolean))].sort();
    renderFilterOptions('substate', substates, (s) => ({
        value: s,
        label: s
    }));
}

// Render filter options
function renderFilterOptions(type, items, formatter) {
    const container = document.getElementById(`${type}Options`);
    
    container.innerHTML = items.map(item => {
        const { value, label } = formatter(item);
        return `
            <div class="filter-option" data-value="${value}" data-type="${type}">
                <div class="filter-checkbox">
                    <i class="fas fa-check"></i>
                </div>
                <span>${label}</span>
            </div>
        `;
    }).join('');
    
    // Add handlers
    container.querySelectorAll('.filter-option').forEach(opt => {
        opt.addEventListener('click', () => toggleFilter(type, opt.dataset.value));
    });
    
    // Parse flags
    if (typeof twemoji !== 'undefined') {
        twemoji.parse(container);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Filter triggers
    document.querySelectorAll('.filter-panel-trigger').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            if (trigger.disabled) return;
            e.stopPropagation();
            
            const panel = trigger.nextElementSibling;
            const isActive = trigger.classList.contains('active');
            
            // Close others
            document.querySelectorAll('.filter-panel-trigger').forEach(t => {
                t.classList.remove('active');
            });
            document.querySelectorAll('.filter-panel-content').forEach(p => {
                p.classList.remove('show');
            });
            
            // Toggle current
            if (!isActive) {
                trigger.classList.add('active');
                panel.classList.add('show');
            }
        });
    });
	
	document.querySelectorAll('.filter-panel-content').forEach(panel => {
    panel.addEventListener('click', (e) => {
        e.stopPropagation();
    });
});
    
    // Close on outside click
    document.addEventListener('click', () => {
        document.querySelectorAll('.filter-panel-trigger').forEach(t => {
            t.classList.remove('active');
        });
        document.querySelectorAll('.filter-panel-content').forEach(p => {
            p.classList.remove('show');
        });
    });
    
    // Search inputs
    ['country', 'stockroom', 'substate', 'category'].forEach(type => {  // category EKLE
    const searchInput = document.getElementById(`${type}Search`);
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const options = document.querySelectorAll(`#${type}Options .filter-option`);
            options.forEach(opt => {
                const text = opt.textContent.toLowerCase();
                opt.style.display = text.includes(term) ? 'flex' : 'none';
            });
        });
    }
});
    
    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        currentFilters.search = e.target.value.toLowerCase();
        currentPage = 1;
        applyFilters();
    });
    
    // Buttons
    document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);
    document.getElementById('refreshBtn').addEventListener('click', () => loadData());
    document.getElementById('exportExcelBtn').addEventListener('click', exportToExcel);
    
    // Pagination
    document.getElementById('firstPageBtn').addEventListener('click', () => goToPage(1));
    document.getElementById('prevPageBtn').addEventListener('click', () => goToPage(currentPage - 1));
    document.getElementById('nextPageBtn').addEventListener('click', () => goToPage(currentPage + 1));
    document.getElementById('lastPageBtn').addEventListener('click', goToLastPage);
    document.getElementById('pageSizeSelect').addEventListener('change', (e) => {
        pageSize = parseInt(e.target.value);
        currentPage = 1;
        renderTable();
        updatePagination();
    });
}

// Toggle filter
function toggleFilter(type, value) {
    const filterArray = currentFilters[type];
    const index = filterArray.indexOf(value);
    
    if (index > -1) {
        filterArray.splice(index, 1);
    } else {
        filterArray.push(value);
    }
    
    updateFilterUI(type);
    updateFilterCount(type);
    renderChips();
    
    if (type === 'country') {
        updateStockroomFilter();
    }
    
    currentPage = 1;
    applyFilters();
}

// Update filter UI
function updateFilterUI(type) {
    const options = document.querySelectorAll(`#${type}Options .filter-option`);
    options.forEach(opt => {
        const isSelected = currentFilters[type].includes(opt.dataset.value);
        opt.classList.toggle('selected', isSelected);
    });
}

// Update filter count
function updateFilterCount(type) {
    const countElement = document.getElementById(`${type}Count`);
    const count = currentFilters[type].length;
    
    if (count > 0) {
        countElement.textContent = count;
        countElement.style.display = 'inline-block';
    } else {
        countElement.style.display = 'none';
    }
}

// Update stockroom filter
function updateStockroomFilter() {
    const trigger = document.getElementById('stockroomTriggerBtn');
    
    if (currentFilters.country.length === 0) {
        trigger.disabled = true;
        currentFilters.stockroom = [];
        updateFilterCount('stockroom');
        renderChips();
        return;
    }
    
    trigger.disabled = false;
    
    const stockrooms = [...new Set(
        allAssets
            .filter(a => currentFilters.country.includes(a.country))
            .map(a => a.stockroom)
            .filter(Boolean)
    )].sort();
    
    renderFilterOptions('stockroom', stockrooms, (s) => ({
        value: s,
        label: s
    }));
    
    // Remove invalid stockrooms
    currentFilters.stockroom = currentFilters.stockroom.filter(s => stockrooms.includes(s));
    updateFilterUI('stockroom');
    updateFilterCount('stockroom');
    renderChips();
}

// Render chips
function renderChips() {
    const container = document.getElementById('activeFilters');
    const chips = [];
    
    // Country chips
    currentFilters.country.forEach(country => {
        chips.push({
            type: 'country',
            value: country,
            label: `${getCountryFlag(country)} ${country}`,
            icon: 'fa-flag'
        });
    });
    
    // Stockroom chips
    currentFilters.stockroom.forEach(stockroom => {
        chips.push({
            type: 'stockroom',
            value: stockroom,
            label: stockroom,
            icon: 'fa-warehouse'
        });
    });
	
	currentFilters.category.forEach(category => {
    const config = CATEGORY_CONFIG[category] || { icon: 'fa-box' };
    chips.push({
        type: 'category',
        value: category,
        label: category,
        icon: config.icon
    });
});
    
    // Substate chips
    currentFilters.substate.forEach(substate => {
        chips.push({
            type: 'substate',
            value: substate,
            label: substate,
            icon: 'fa-tag'
        });
    });
    
    container.innerHTML = chips.map(chip => `
        <div class="filter-chip">
            <i class="fas ${chip.icon}"></i>
            <span>${chip.label}</span>
            <button class="filter-chip-remove" onclick="removeChip('${chip.type}', '${chip.value.replace(/'/g, "\\'")}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
    
    if (typeof twemoji !== 'undefined') {
        twemoji.parse(container);
    }
}

// Remove chip
function removeChip(type, value) {
    const index = currentFilters[type].indexOf(value);
    if (index > -1) {
        currentFilters[type].splice(index, 1);
    }
    
    updateFilterUI(type);
    updateFilterCount(type);
    renderChips();
    
    if (type === 'country') {
        updateStockroomFilter();
    }
    
    currentPage = 1;
    applyFilters();
}

// Apply filters
function applyFilters() {
    filteredAssets = allAssets.filter(asset => {
        // Country
        if (currentFilters.country.length > 0 && !currentFilters.country.includes(asset.country)) {
            return false;
        }
        
        // Stockroom
        if (currentFilters.stockroom.length > 0 && !currentFilters.stockroom.includes(asset.stockroom)) {
            return false;
        }
        
        // Substate
        if (currentFilters.substate.length > 0 && !currentFilters.substate.includes(asset.substate)) {
            return false;
        }
        
        // EKLE - Category
        if (currentFilters.category.length > 0 && !currentFilters.category.includes(asset.model_category)) {
            return false;
        }
        
        // Search - ESKİSİ KALSIN
        if (currentFilters.search) {
            const term = currentFilters.search;
            const hostname = (asset.configuration_item || '').toLowerCase();
            const model = (asset.model || '').toLowerCase();
            const serial = (asset.serial_number || '').toLowerCase();
            
            if (!hostname.includes(term) && !model.includes(term) && !serial.includes(term)) {
                return false;
            }
        }
        
        return true;
    });
    
    console.log('🔍 Filtered:', filteredAssets.length, 'assets');
    
    renderTable();
    updatePagination();
}

// Clear filters
function clearFilters() {
    currentFilters = {
        country: [],
        stockroom: [],
		category: [],
        substate: [],
        search: ''
    };
    
    // Reset UI
    document.querySelectorAll('.filter-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    document.querySelectorAll('.filter-count').forEach(count => {
        count.style.display = 'none';
    });
    
    document.getElementById('searchInput').value = '';
    document.getElementById('stockroomTriggerBtn').disabled = true;
    
    renderChips();
    
    filteredAssets = allAssets;
    currentPage = 1;
    renderTable();
    updatePagination();
}

// Get category badge
function getCategoryBadge(category) {
    if (!category) return '-';
    
    const config = CATEGORY_CONFIG[category] || { color: '#64748b', icon: 'fa-box' };
    
    return `
        <div class="category-badge" style="--category-color: ${config.color};">
            <i class="fas ${config.icon}"></i>
            <span>${category}</span>
        </div>
    `;
}

// Render table
function renderTable() {
    const tbody = document.getElementById('tableBody');
    
    if (filteredAssets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data-cell">No assets found</td></tr>';
        document.getElementById('tableInfo').textContent = 'Showing 0 assets';
        return;
    }
    
    // Pagination
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pagedAssets = filteredAssets.slice(start, end);
    
    tbody.innerHTML = pagedAssets.map(asset => {
        const flag = getCountryFlag(asset.country);
        const statusClass = getStatusClass(asset.substate);
        const hasReserved = asset.reserved_for && asset.reserved_for.trim() !== '';
        
        return `
            <tr>
                <td><span class="hostname">${asset.configuration_item || '-'}</span></td>
                <td>${asset.model || '-'}</td>
                <td>${asset.serial_number || '-'}</td>
                <td>${getCategoryBadge(asset.model_category)}</td>
                <td><span class="status-badge ${statusClass}">${asset.substate || '-'}</span></td>
                <td>${flag} ${asset.country || '-'}</td>
                <td>${asset.stockroom || '-'}</td>
                <td>${hasReserved ? asset.reserved_for : '-'}</td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('tableInfo').textContent = `Showing ${filteredAssets.length.toLocaleString()} assets`;
    
    if (typeof twemoji !== 'undefined') {
        twemoji.parse(tbody);
    }
}

// Get status class
function getStatusClass(substate) {
    if (!substate) return '';
    const lower = substate.toLowerCase();
    if (lower.includes('available')) return 'status-available';
    if (lower.includes('reserved')) return 'status-reserved';
    if (lower.includes('pending')) return 'status-pending';
    if (lower.includes('disposal')) return 'status-disposal';
    return '';
}

// Update pagination
function updatePagination() {
    const totalPages = Math.ceil(filteredAssets.length / pageSize);
    const start = filteredAssets.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, filteredAssets.length);
    
    document.getElementById('paginationInfo').textContent = 
        `Showing ${start.toLocaleString()} to ${end.toLocaleString()} of ${filteredAssets.length.toLocaleString()} assets`;
    
    document.getElementById('firstPageBtn').disabled = currentPage === 1;
    document.getElementById('prevPageBtn').disabled = currentPage === 1;
    document.getElementById('nextPageBtn').disabled = currentPage === totalPages || filteredAssets.length === 0;
    document.getElementById('lastPageBtn').disabled = currentPage === totalPages || filteredAssets.length === 0;
    
    renderPageNumbers(totalPages);
}

// Render page numbers
function renderPageNumbers(totalPages) {
    const container = document.getElementById('pageNumbers');
    const maxVisible = 5;
    let pages = [];
    
    if (totalPages <= maxVisible) {
        pages = Array.from({length: totalPages}, (_, i) => i + 1);
    } else {
        if (currentPage <= 3) {
            pages = [1, 2, 3, 4, '...', totalPages];
        } else if (currentPage >= totalPages - 2) {
            pages = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        } else {
            pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
        }
    }
    
    container.innerHTML = pages.map(p => {
        if (p === '...') {
            return '<span class="page-ellipsis">...</span>';
        }
        return `<button class="page-number ${p === currentPage ? 'active' : ''}" onclick="goToPage(${p})">${p}</button>`;
    }).join('');
}

// Go to page
function goToPage(page) {
    currentPage = page;
    renderTable();
    updatePagination();
}

// Go to last page
function goToLastPage() {
    const lastPage = Math.ceil(filteredAssets.length / pageSize);
    if (lastPage > 0) {
        goToPage(lastPage);
    }
}

// Export to Excel
function exportToExcel() {
    try {
        const headers = ['Hostname', 'Model', 'Serial Number', 'Category', 'Status', 'Country', 'Stockroom', 'Reserved For'];
        
        const csvContent = [
            headers.join(','),
            ...filteredAssets.map(asset => [
                asset.configuration_item || '',
                asset.model || '',
                asset.serial_number || '',
                asset.model_category || '',
                asset.substate || '',
                asset.country || '',
                asset.stockroom || '',
                asset.reserved_for || ''
            ].map(val => `"${val}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stockroom_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        
        console.log('✅ Excel exported');
    } catch (error) {
        console.error('❌ Export failed:', error);
    }
}

// Get country flag
function getCountryFlag(country) {
    const flagMap = {
        'Türkiye': '🇹🇷', 'Spain': '🇪🇸', 'Portugal': '🇵🇹', 'Switzerland': '🇨🇭',
        'Czech Republic': '🇨🇿', 'Austria': '🇦🇹', 'Romania': '🇷🇴', 'Hungary': '🇭🇺',
        'Greece': '🇬🇷', 'Bulgaria': '🇧🇬', 'Slovakia': '🇸🇰', 'Slovenia': '🇸🇮',
        'Belgium': '🇧🇪', 'Denmark': '🇩🇰', 'Finland': '🇫🇮', 'France': '🇫🇷',
        'Germany': '🇩🇪', 'Ireland': '🇮🇪', 'Italy': '🇮🇹', 'Netherlands': '🇳🇱',
        'Poland': '🇵🇱', 'Sweden': '🇸🇪', 'United Kingdom': '🇬🇧'
    };
    
    return flagMap[country] || '🏳️';
}