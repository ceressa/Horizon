// ========== APPS PAGE CONTROLLER ========== //
// HORIZON - Local Applications Manager
// Version: 2.0.0 - Enhanced with Platform, Department, Vendor

'use strict';

// ============================================================
// GLOBAL STATE
// ============================================================
let allApps = [];
let filteredApps = [];
let currentView = 'grid';
let currentUser = null;
let showInactive = false;

const COUNTRY_NAMES = {
    'TR': 'Türkiye',
    'BG': 'Bulgaria',
    'GR': 'Greece',
    'SI': 'Slovenia',
    'CY': 'Cyprus',
    'GSP': 'GSP',
    'ES': 'Spain',
    'PT': 'Portugal',
    'AT': 'Austria',
    'CH': 'Switzerland',
    'CZ': 'Czechia',
    'HU': 'Hungary',
    'RO': 'Romania',
    'SK': 'Slovakia'
};

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Apps page initializing...');
    
    currentUser = window.currentUser || window.authService?.getCurrentUser();
    
    if (!currentUser) {
        console.error('❌ No user found!');
        showError('Authentication required. Please login.');
        return;
    }
    
    console.log('👤 Current user:', currentUser.name);
    console.log('🌍 Authorized countries:', currentUser.countries);
    
    await loadApps();
    setupEventListeners();
    
    console.log('✅ Apps page initialized');
});

// ============================================================
// LOAD APPS DATA
// ============================================================
async function loadApps() {
    console.log('📥 Loading apps data...');
    
    try {
        const response = await fetch('/Horizon/api/data/apps');
        
        console.log(`📡 Response status: ${response.status}`);
        console.log(`📡 Response ok: ${response.ok}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ JSON parsed successfully!');
        console.log('📊 Total apps in file:', data.length);
        
        // Filter by user's authorized countries
        allApps = data.filter(app => {
            const isAuthorized = currentUser.countries.includes(app.country);
            console.log(`App: ${app.name} (${app.country}) - Authorized: ${isAuthorized}`);
            return isAuthorized;
        });
        
        console.log(`✅ Loaded ${allApps.length} apps (filtered by authorized countries)`);
        console.log(`🔒 User can only see apps from: ${currentUser.countries.join(', ')}`);
        
        updateAccessBanner();
        
        applyFilters(); // ✅ BURASI DEĞİŞTİ - filtreleyip render edecek
        updateStats();
        populateCountryFilter();
        
    } catch (error) {
        console.error('❌ Failed to load apps:', error);
        showError('Failed to load applications. Please try again later.');
        
        if (window.horizonLogger) {
            window.horizonLogger.logError('DATA_LOAD_FAILED', 'Failed to load apps', {
                error: error.message
            });
        }
    }
}

// ============================================================
// UPDATE ACCESS BANNER
// ============================================================
function updateAccessBanner() {
    const accessCountriesElement = document.getElementById('accessCountries');
    if (!accessCountriesElement) return;
    
    const countriesHTML = currentUser.countries.map(countryCode => {
        const countryName = COUNTRY_NAMES[countryCode] || countryCode;
        return `
            <span class="country-badge">
                <img src="https://flagcdn.com/18x13/${countryCode.toLowerCase()}.png" 
                     alt="${countryCode}"
                     onerror="this.style.display='none'">
                ${countryName}
            </span>
        `;
    }).join('');
    
    accessCountriesElement.innerHTML = `
        Viewing applications for: ${countriesHTML}
    `;
    
    console.log('✅ Access banner updated');
}

// ============================================================
// RENDER APPS
// ============================================================
function renderApps() {
    console.log('🎨 Rendering apps...');
    
    const container = document.getElementById('appsContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (!container) {
        console.error('❌ Container #appsContainer not found!');
        return;
    }
    
    container.innerHTML = '';
    
    if (filteredApps.length === 0) {
        console.warn('⚠️ No apps to display');
        container.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }
    
    container.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';
    
    container.className = currentView === 'list' ? 'apps-container list-view' : 'apps-container';
    
    filteredApps.forEach(app => {
        const appCard = createAppCard(app);
        container.appendChild(appCard);
    });
    
    console.log(`✅ Rendered ${filteredApps.length} apps in ${currentView} view`);
}

// ============================================================
// CREATE APP CARD - GÜNCELLENMIŞ
// ============================================================
function createAppCard(app) {
    const card = document.createElement('div');
    card.className = 'app-card';
    card.setAttribute('data-id', app.id);
    
    const iconGradient = getIconGradient(app.category);
    const platformBadge = getPlatformBadge(app.platform);
    
    card.innerHTML = `
        <div class="app-card-header">
            <div class="app-icon" style="background: ${iconGradient}">
                <i class="${app.icon || 'fas fa-rocket'}"></i>
            </div>
            <div class="app-info">
                <h3>${escapeHtml(app.name)}</h3>
                <div class="app-badges">
                    ${platformBadge}
                    <span class="app-category">${escapeHtml(app.category)}</span>
                </div>
            </div>
        </div>
        
        <p class="app-description">${escapeHtml(app.description)}</p>
        
        <div class="app-meta-info">
            <div class="meta-item">
                <i class="fas fa-building"></i>
                <span>${escapeHtml(app.department)}</span>
            </div>
            <div class="meta-item">
                <i class="fas fa-code-branch"></i>
                <span>${escapeHtml(app.vendor)}</span>
            </div>
        </div>
        
        <div class="app-footer">
            <div class="app-country">
                <img src="https://flagcdn.com/20x15/${app.country.toLowerCase()}.png" 
                     alt="${app.country}" 
                     class="country-flag"
                     onerror="this.style.display='none'"
            </div>
            <span class="app-status ${app.status === 'active' ? 'active' : 'inactive'}">
                ${app.status === 'active' ? 'Active' : 'Inactive'}
            </span>
        </div>
    `;
    
    card.addEventListener('click', () => {
        openApp(app);
    });
    
    return card;
}

// ============================================================
// GET PLATFORM BADGE
// ============================================================
function getPlatformBadge(platform) {
    const platformConfig = {
        'Web': { icon: 'fas fa-globe', color: '#4facfe' },
        'Windows': { icon: 'fab fa-windows', color: '#0078d4' },
        'Desktop': { icon: 'fas fa-desktop', color: '#667eea' },
        'Teams': { icon: 'fab fa-microsoft', color: '#6264a7' },
        'Web Service': { icon: 'fas fa-cloud', color: '#43e97b' }
    };
    
    const config = platformConfig[platform] || { icon: 'fas fa-laptop-code', color: '#a855f7' };
    
    return `<span class="platform-badge" style="border-color: ${config.color}; color: ${config.color};">
        <i class="${config.icon}"></i> ${escapeHtml(platform)}
    </span>`;
}

// ============================================================
// OPEN APP
// ============================================================
function openApp(app) {
    console.log('🚀 Opening app modal:', app.name);
    showAppModal(app);
}


// ============================================================
// SHOW APP MODAL - ENHANCED & CONDITIONAL URL
// ============================================================
function showAppModal(app) {
    console.log('🎬 showAppModal called for:', app.name);
    
    const modal = document.getElementById('appModal');
    const modalContent = document.getElementById('appModalContent');
    
    if (!modal || !modalContent) {
        console.error('❌ Modal elements not found!');
        return;
    }
    
    const iconGradient = getIconGradient(app.category);
    const isInactive = app.status !== 'active';
    const platformBadge = getPlatformBadge(app.platform);
    
    // ✅ URL gösterilmeli mi? (Sadece Web ve Teams için)
    const showUrl = app.platform === 'Web' || app.platform === 'Teams' || app.platform === 'Web Service';
    
    // ✅ Category badge gösterilmeli mi? (Local hariç)
    const showCategory = app.category !== 'Local';
    
    modalContent.innerHTML = `
        <div class="modal-app-header">
            <div class="modal-app-icon" style="background: ${iconGradient}">
                <i class="${app.icon || 'fas fa-rocket'}"></i>
            </div>
            <div class="modal-app-info">
                <h2 class="modal-app-name">${escapeHtml(app.name)}</h2>
                <div class="modal-app-meta">
                    ${platformBadge}
                    ${showCategory ? `<span class="app-category">${escapeHtml(app.category)}</span>` : ''}
                    <span class="app-status ${app.status === 'active' ? 'active' : 'inactive'}">
                        ${app.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                   
                </div>
            </div>
        </div>
        
        <div class="modal-app-body">
            <div class="modal-section">
                <h3 class="modal-section-title">Description</h3>
                <p class="modal-app-description">${escapeHtml(app.description)}</p>
            </div>
            
            <div class="modal-section">
                <h3 class="modal-section-title">Application Details</h3>
                <div class="modal-info-grid">
                    <div class="modal-info-item">
                        <div class="modal-info-icon">
                            <i class="fas fa-building"></i>
                        </div>
                        <div class="modal-info-text">
                            <div class="modal-info-label">Department</div>
                            <div class="modal-info-value">${escapeHtml(app.department)}</div>
                        </div>
                    </div>
                    
                    <div class="modal-info-item">
                        <div class="modal-info-icon">
                            <i class="fas fa-user-tie"></i>
                        </div>
                        <div class="modal-info-text">
                            <div class="modal-info-label">Business Owner</div>
                            <div class="modal-info-value">${escapeHtml(app.businessOwner)}</div>
                        </div>
                    </div>
                    
                    <div class="modal-info-item">
                        <div class="modal-info-icon">
                            <i class="fas fa-code-branch"></i>
                        </div>
                        <div class="modal-info-text">
                            <div class="modal-info-label">Vendor</div>
                            <div class="modal-info-value">${escapeHtml(app.vendor)}</div>
                        </div>
                    </div>
                    
                    <div class="modal-info-item">
                        <div class="modal-info-icon">
                            <i class="fas fa-laptop-code"></i>
                        </div>
                        <div class="modal-info-text">
                            <div class="modal-info-label">Platform</div>
                            <div class="modal-info-value">${escapeHtml(app.platform)}</div>
                        </div>
                    </div>
                    
                    <div class="modal-info-item">
                        <div class="modal-info-icon">
                            <i class="fas fa-hashtag"></i>
                        </div>
                        <div class="modal-info-text">
                            <div class="modal-info-label">Application ID</div>
                            <div class="modal-info-value">${escapeHtml(app.id)}</div>
                        </div>
                    </div>
                    
                    <div class="modal-info-item">
                        <div class="modal-info-icon">
                            <i class="fas fa-globe"></i>
                        </div>
                        <div class="modal-info-text">
                            <div class="modal-info-label">Country</div>
                            <div class="modal-info-value">${COUNTRY_NAMES[app.country] || app.country}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="modal-app-footer">
            <button class="modal-btn modal-btn-secondary" onclick="closeAppModal()">
                <i class="fas fa-times"></i> 
                <span>Close</span>
            </button>
            ${showUrl ? `
                <button class="modal-btn modal-btn-primary" ${isInactive ? 'disabled' : ''} 
                        onclick="launchApp('${escapeHtml(app.url)}', '${escapeHtml(app.name)}', '${app.id}', '${app.country}')">
                    <i class="fas fa-external-link-alt"></i> 
                    <span>${isInactive ? 'Application Inactive' : 'Open Application'}</span>
                </button>
            ` : `
                <button class="modal-btn modal-btn-primary" disabled>
                    <i class="fas fa-desktop"></i>
                    <span>Desktop Application</span>
                </button>
            `}
        </div>
    `;
    
    modal.style.display = 'flex';
    void modal.offsetHeight;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ============================================================
// CLOSE APP MODAL
// ============================================================
function closeAppModal() {
    console.log('🔴 Closing modal...');
    
    const modal = document.getElementById('appModal');
    if (modal) {
        modal.classList.remove('active');
        
        // Animation bitince display'i gizle
        setTimeout(() => {
            modal.style.display = 'none';
            console.log('✅ Modal hidden');
        }, 300);
        
        document.body.style.overflow = '';
    }
}

// ============================================================
// LAUNCH APP
// ============================================================
function launchApp(url, name, id, country) {
    console.log('🚀 Launching app:', name);
    
    window.open(url, '_blank', 'noopener,noreferrer');
    
    if (window.horizonLogger) {
        window.horizonLogger.log('AUTH', 'APP_ACCESS', {
            username: currentUser.name || currentUser.fedexId,
            success: true,
            message: `User accessed app: ${name}`,
            data: {
                appId: id,
                appName: name,
                country: country,
                url: url
            }
        });
    }
    
    setTimeout(() => {
        closeAppModal();
    }, 300);
}

// ============================================================
// UPDATE STATS
// ============================================================
function updateStats() {
    console.log('📊 Updating stats...');
    
    const totalApps = allApps.length;
    const activeApps = allApps.filter(app => app.status === 'active').length;
    const categories = [...new Set(allApps.map(app => app.category))].length;
    const countries = [...new Set(allApps.map(app => app.country))].length;
    
    console.log('Stats:', { totalApps, activeApps, categories, countries });
    
    const totalElement = document.getElementById('totalApps');
    const activeElement = document.getElementById('activeApps');
    const categoriesElement = document.getElementById('totalCategories');
    const countriesElement = document.getElementById('totalCountries');
    
    if (totalElement) totalElement.textContent = totalApps;
    if (activeElement) activeElement.textContent = activeApps;
    if (categoriesElement) categoriesElement.textContent = categories;
    if (countriesElement) countriesElement.textContent = countries;
}

// ============================================================
// POPULATE COUNTRY FILTER
// ============================================================
function populateCountryFilter() {
    const countryFilter = document.getElementById('countryFilter');
    if (!countryFilter) return;
    
    const countries = [...new Set(allApps.map(app => app.country))].sort();
    
    countryFilter.innerHTML = '<option value="all">All Countries</option>';
    
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = COUNTRY_NAMES[country] || country;
        countryFilter.appendChild(option);
    });
    
    console.log('✅ Populated country filter with', countries.length, 'countries');
}

function setupEventListeners() {
    console.log('🎯 Setting up event listeners...');
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(applyFilters, 300));
    }
    
    const countryFilter = document.getElementById('countryFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    if (countryFilter) countryFilter.addEventListener('change', applyFilters);
    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);
    
    const showInactiveToggle = document.getElementById('showInactiveToggle');
    if (showInactiveToggle) {
        showInactiveToggle.addEventListener('change', (e) => {
            showInactive = e.target.checked;
            console.log('🔄 Show Inactive:', showInactive);
            applyFilters();
        });
    }
    
    // ✅ Export Button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToExcel);
    }
    
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view');
            switchView(view);
        });
    });
    
    console.log('✅ Event listeners ready');
}

// ============================================================
// APPLY FILTERS
// ============================================================
function applyFilters() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const countryFilter = document.getElementById('countryFilter')?.value || 'all';
    const categoryFilter = document.getElementById('categoryFilter')?.value || 'all';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    
    // ✅ Kullanıcı "Inactive" seçerse toggle otomatik aktif olur
    if (statusFilter === 'inactive') {
        showInactive = true;
        const toggle = document.getElementById('showInactiveToggle');
        if (toggle && !toggle.checked) toggle.checked = true;
    }

    filteredApps = allApps.filter(app => {
        // ❗ Eğer showInactive kapalıysa ve app inaktifse, direkt çıkar
        if (!showInactive && app.status !== 'active') {
            return false;
        }

        const matchesSearch = 
            app.name.toLowerCase().includes(searchTerm) ||
            app.description.toLowerCase().includes(searchTerm) ||
            app.department.toLowerCase().includes(searchTerm) ||
            app.vendor.toLowerCase().includes(searchTerm) ||
            (app.tags && app.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
        
        const matchesCountry = countryFilter === 'all' || app.country === countryFilter;
        const matchesCategory = categoryFilter === 'all' || app.category === categoryFilter;
        const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
        
        return matchesSearch && matchesCountry && matchesCategory && matchesStatus;
    });

    // ✅ Ülke adına göre, sonra uygulama adına göre sırala
    filteredApps.sort((a, b) => {
        const countryA = COUNTRY_NAMES[a.country] || a.country;
        const countryB = COUNTRY_NAMES[b.country] || b.country;
        if (countryA < countryB) return -1;
        if (countryA > countryB) return 1;
        return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
    });
    
    console.log(`🔍 Filtered & Sorted: ${filteredApps.length} / ${allApps.length} apps`);
    renderApps();
}



// ============================================================
// SWITCH VIEW
// ============================================================
function switchView(view) {
    currentView = view;
    
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(btn => {
        if (btn.getAttribute('data-view') === view) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    renderApps();
    console.log('👁️ View switched to:', view);
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getIconGradient(category) {
    const gradients = {
        'Local': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'Internal': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'External': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'Development': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'Default': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    };
    
    return gradients[category] || gradients['Default'];
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showError(message) {
    console.error('❌', message);
    
    const container = document.getElementById('appsContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (container) container.style.display = 'none';
    if (emptyState) {
        emptyState.style.display = 'flex';
        emptyState.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error Loading Applications</h3>
            <p>${escapeHtml(message)}</p>
        `;
    }
}

// ============================================================
// EXPORT TO EXCEL
// ============================================================
function exportToExcel() {
    console.log('📊 Exporting to Excel...');
    
    if (filteredApps.length === 0) {
        alert('No applications to export!');
        return;
    }
    
    try {
        // Prepare data for Excel
        const excelData = filteredApps.map((app, index) => ({
            'No': index + 1,
            'Application Name': app.name,
			'EAI': app.id,
            'Status': app.status === 'active' ? 'Active' : 'Inactive',
            'Category': app.category,
            'Platform': app.platform,
            'Country': COUNTRY_NAMES[app.country] || app.country,
            'Department': app.department,
            'Business Owner': app.businessOwner,
            'Vendor': app.vendor,
            'Description': app.description,
            'Application URL': app.url
        }));
        
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);
        
        // Set column widths
        ws['!cols'] = [
            { wch: 5 },   // No
            { wch: 30 },  // Application Name
            { wch: 10 },  // Status
            { wch: 15 },  // Category
            { wch: 15 },  // Platform
            { wch: 15 },  // Country
            { wch: 20 },  // Department
            { wch: 25 },  // Business Owner
            { wch: 20 },  // Vendor
            { wch: 50 },  // Description
            { wch: 60 },  // Application URL
            { wch: 15 },  // Application ID
        ];
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Applications');
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const filename = `HORIZON_Applications_${timestamp}.xlsx`;
        
        // Save file
        XLSX.writeFile(wb, filename);
        
        console.log('✅ Excel file exported:', filename);
        
        // Show success notification
        if (window.showToast) {
            window.showToast(`Exported ${filteredApps.length} applications successfully!`, 'success');
        }
        
        // Log export action
        if (window.horizonLogger) {
            window.horizonLogger.log('DATA', 'EXPORT_APPS', {
                username: currentUser.name || currentUser.fedexId,
                success: true,
                message: 'User exported applications to Excel',
                data: {
                    count: filteredApps.length,
                    filename: filename
                }
            });
        }
        
    } catch (error) {
        console.error('❌ Export failed:', error);
        alert('Failed to export data. Please try again.');
        
        if (window.horizonLogger) {
            window.horizonLogger.logError('EXPORT_FAILED', 'Failed to export apps', {
                error: error.message
            });
        }
    }
};

// ESC to close modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAppModal();
    }
});

// Click outside to close
document.getElementById('appModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'appModal') {
        closeAppModal();
    }
});