// ========== COMMON FUNCTIONS - SHARED ACROSS ALL PAGES ========== //
// Version: 1.0.1
// Author: IT Playbook System

'use strict';

// ========== GLOBAL CONFIGURATION ========== //
window.COUNTRY_ORDER = ['TR', 'BG', 'GR', 'SI', 'CY', 'GSP', 'ES', 'PT', 'AT', 'CH', 'CZ', 'HU', 'RO', 'SK'];

window.countryNames = {
    'TR': 'Türkiye',
    'BG': 'Bulgaria',
    'GR': 'Greece',
    'SI': 'Slovenia',
    'CY': 'Cyprus',
    'GSP': 'GSP Countries',
    'ES': 'Spain',
    'PT': 'Portugal',
    'AT': 'Austria',
    'CH': 'Switzerland',
    'CZ': 'Czechia',
    'HU': 'Hungary',
    'RO': 'Romania',
    'SK': 'Slovakia'
};

window.COUNTRY_CONFIG = {
    'TR': { name: 'Türkiye', flag: '🇹🇷' },
    'BG': { name: 'Bulgaria', flag: '🇧🇬' },
    'GR': { name: 'Greece', flag: '🇬🇷' },
    'SI': { name: 'Slovenia', flag: '🇸🇮' },
    'CY': { name: 'Cyprus', flag: '🇨🇾' },
    'ES': { name: 'Spain', flag: '🇪🇸' },
    'PT': { name: 'Portugal', flag: '🇵🇹' },
    'AT': { name: 'Austria', flag: '🇦🇹' },
    'CH': { name: 'Switzerland', flag: '🇨🇭' },
    'CZ': { name: 'Czechia', flag: '🇨🇿' },
    'HU': { name: 'Hungary', flag: '🇭🇺' },
    'RO': { name: 'Romania', flag: '🇷🇴' },
    'SK': { name: 'Slovakia', flag: '🇸🇰' },
    'GSP': { name: 'GSP Countries', flag: '🌍' }
};

// Helper functions
function getCountryName(code) {
    return window.countryNames[code] || code;
}

// ========== GLOBAL VARIABLES ========== //
let systemData = {
    users: {},
    devices: {},
    projects: [],
    networkDevicesByCountry: {},
    locations: {},
    contracts: [],
    applications: [],
    notes: {},
    locationCoordinates: {}
};

let exchangeRates = { EUR: 1, USD: 1.1, TRY: 50.0 };
let lastRateUpdate = null;
let currentTimezone = 'Europe/Istanbul';
let currentTimezoneCode = 'TR';




function getCountryName(code) {
    const names = {
        'TR': 'Türkiye',
        'GR': 'Greece',
        'BG': 'Bulgaria',
        'SI': 'Slovenia',
        'CY': 'Cyprus',
        'AT': 'Austria',
        'CH': 'Switzerland',
        'CZ': 'Czechia',
        'HU': 'Hungary',
        'RO': 'Romania',
        'ES': 'Spain',
        'PT': 'Portugal',
        'SK': 'Slovakia',
        'GSP': 'GSP'
    };
    return names[code] || code;
}

function getCountryColor(countryCode) {
    const colors = {
        // Güliz'in ülkeleri
        'TR': '#e74c3c',  // Kırmızı
        'GR': '#3498db',  // Mavi  
        'BG': '#2ecc71',  // Yeşil
        'SI': '#f39c12',  // Turuncu
        'CY': '#9b59b6',  // Mor
        
        // Filip'in ülkeleri
        'AT': '#c0392b',  // Koyu kırmızı
        'CH': '#e74c3c',  // Kırmızı
        'CZ': '#3498db',  // Mavi
        'HU': '#27ae60',  // Yeşil
        'RO': '#f1c40f',  // Sarı
		'SK': '#2980b9',  // Mavi

        // Marcel'in ülkeleri
        'ES': '#e67e22',  // Turuncu
        'PT': '#27ae60',  // Yeşil
        

        // GSP
        'GSP': '#95a5a6'  // Gri
    };
    return colors[countryCode] || '#34495e';
}

/* ============================================
   NAVBAR DROPDOWN SYSTEM
   ============================================ */
(function() {
    'use strict';
    
    function initDropdowns() {
        const dropdowns = document.querySelectorAll('.hz-dropdown');
        
        if (dropdowns.length === 0) return;
        
        dropdowns.forEach(dropdown => {
            const trigger = dropdown.querySelector('.hz-dropdown-trigger');
            
            if (trigger) {
                trigger.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Close others
                    dropdowns.forEach(d => {
                        if (d !== dropdown) d.classList.remove('open');
                    });
                    
                    // Toggle
                    dropdown.classList.toggle('open');
                });
            }
        });
        
        // Close on outside click
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.hz-dropdown')) {
                dropdowns.forEach(d => d.classList.remove('open'));
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDropdowns);
    } else {
        initDropdowns();
    }
})();


function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
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

function populateAllTables() {
    try {
        // Dashboard sayfasında sadece temel güncellemeler
        console.log('Dashboard tables update skipped - no complex tables on main page');
    } catch (error) {
        console.error('Error populating tables:', error);
    }
}

function processInventoryData(data) {
    try {
        console.log('Processing inventory data:', data);
        
        if (data.countries) {
            // Mevcut systemData referansını kullan, yenisini oluşturma
            if (!window.systemData) {
                window.systemData = {};
            }
            
            // Initialize empty objects
            window.systemData.users = {};
            window.systemData.devices = {};
            window.systemData.networkDevicesByCountry = {};
            window.systemData.locationCoordinates = {};
            
            // Process each country
            Object.keys(data.countries).forEach(country => {
                const countryData = data.countries[country];
                
                // Users mapping
                window.systemData.users[country] = countryData.employee || 0;
                
                // Devices mapping
                window.systemData.devices[country] = countryData.enduser_machine || 0;
                
                // Network devices mapping - null değerleri 0 yap
                window.systemData.networkDevicesByCountry[country] = {
                    router: countryData.router || 0,
                    switch: countryData.switch || 0,
                    ap: countryData.ap || 0,
                    firewall: countryData.firewall || 0,
                    UDS: countryData.uds || 0  // 'uds' küçük harften 'UDS' büyük harfe
                };
                
                // Location coordinates mapping
                window.systemData.locationCoordinates[country] = countryData.locationCoordinates || [];
                
                console.log(`Processed ${country}: ${countryData.locationCoordinates?.length || 0} locations`);
            });
            
            // Debug logs
            console.log('Final systemData.locationCoordinates:', window.systemData.locationCoordinates);
            console.log('SI locations after processing:', window.systemData.locationCoordinates.SI);
            
            // ✅ Country detail sayfasını HEMEN yeniden initialize et
            if (window.location.pathname.includes('country-detail.html')) {
                console.log('IMMEDIATE re-initialization with processed data...');
                
                // Timeout kullanma, hemen çağır
                if (typeof initializeCountryMap === 'function') {
                    initializeCountryMap();
                }
                if (typeof loadLocationsList === 'function') {
                    loadLocationsList();
                }
            }
            
            // Dashboard güncellemesi
            if (typeof updateDashboard === 'function') {
                console.log('Triggering dashboard update...');
                updateDashboard();
            }
        }
        
        console.log('✅ Inventory data processing completed successfully');
        
    } catch (error) {
        console.error('❌ Error processing inventory data:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            data: data
        });
    }
}


async function loadInventoryData() {
    try {
        // Root'tan başlayan absolute path
        const response = await fetch('../api/data/inventory');
        const data = await response.json();
        console.log('Inventory data loaded');
        processInventoryData(data);
        return data;
    } catch (error) {
        console.error('Error loading inventory data:', error);
        return null;
    }
}

// ========== CURRENCY SYSTEM ========== //
function formatCurrency(amount, currency) {
    const convertedAmount = amount * (exchangeRates[currency] || 1);
    const symbols = { EUR: '€', USD: '$', TRY: '₺' };
    
    return `${symbols[currency] || currency} ${convertedAmount.toLocaleString()}`;
}

function setCurrency(currency) {
    console.log('Currency changed to:', currency);
    userSettings.currency = currency;
    
    localStorage.setItem('horizonSettings', JSON.stringify(userSettings));
    updateAllCurrencyDisplays();
    showNotification(`Currency changed to ${currency}`);
}

function updateAllCurrencyDisplays() {
    console.log('Updating all currency displays to:', userSettings.currency);
    
    // Update all elements with data-currency attribute
    const currencyElements = document.querySelectorAll('[data-currency]');
    currencyElements.forEach(element => {
        const value = parseFloat(element.dataset.currency) || 0;
        element.textContent = formatCurrency(value, userSettings.currency);
    });
    
    // Update contract values in tables
    const contractRows = document.querySelectorAll('#contractsTable tr');
    contractRows.forEach(row => {
        if (row.cells && row.cells[6]) {
            const valueCell = row.cells[6];
            const amount = parseFloat(valueCell.textContent.replace(/[^0-9.]/g, ''));
            if (!isNaN(amount) && amount > 0) {
                valueCell.textContent = formatCurrency(amount, userSettings.currency);
            }
        }
    });
}

// ========== NOTIFICATION SYSTEM ========== //
function showNotification(message, type = 'success', duration = 5000) {
    try {
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${getNotificationIcon(type)}"></i>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, duration);
        }
        
    } catch (error) {
        console.error('Error showing notification:', error);
    }
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-triangle',
        'warning': 'fa-exclamation-circle',
        'info': 'fa-info-circle'
    };
    return icons[type] || 'fa-info-circle';
}

// ========== DATA LOADING & SAVING ========== //
window.loadDataFromServer = async function loadDataFromServer() {
    try {
        const response = await fetch('/Horizon/api/data/inventory');
        const inventoryData = await response.json();
        
        // ✅ processInventoryData fonksiyonunu çağır
        processInventoryData(inventoryData);
        
        console.log('Data loaded and processed:', systemData);
        return inventoryData;
        
    } catch (error) {
        console.error('Error loading data:', error);
        loadDataFromLocalStorage();
        return null;
    }
}


function loadDataFromLocalStorage() {
    try {
        const localData = localStorage.getItem('itPlaybookData');
        if (localData) {
            const parsedData = JSON.parse(localData);
            systemData = { ...systemData, ...parsedData };
            console.log('Data loaded from localStorage');
        } else {
            console.log('No local data found, using defaults');
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
    }
}

async function saveData() {
    try {
        console.log('Saving data to server...', systemData);
        
        const dataToSave = {
            countries: {}
        };
        
        const allCountries = [...new Set([
            ...Object.keys(systemData.users || {}),
            ...Object.keys(systemData.devices || {}),
            ...Object.keys(systemData.networkDevicesByCountry || {})
        ])];
        
        allCountries.forEach(country => {
            const networkDevices = systemData.networkDevicesByCountry?.[country] || {};
            const locationCount = systemData.locationCoordinates?.[country]?.length || null;
            
            dataToSave.countries[country] = {
                employee: systemData.users[country] || 0,
                enduser_machine: systemData.devices[country] || 0,
                network_devices: 0,
                ap: networkDevices.ap || 0,
                router: networkDevices.router || 0,
                switch: networkDevices.switch || 0,
                firewall: networkDevices.firewall || 0,
                uds: null,
                location: locationCount
            };
            
            dataToSave.countries[country].network_devices = 
                dataToSave.countries[country].ap +
                dataToSave.countries[country].router +
                dataToSave.countries[country].switch +
                dataToSave.countries[country].firewall;
        });
        
        console.log('Data formatted for API:', dataToSave);
        
        const response = await fetch('/Horizon/api/data/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSave)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server response error:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Data saved successfully to server:', result);
        
        localStorage.setItem('itPlaybookData', JSON.stringify(systemData));
        return result;
        
    } catch (error) {
        console.error('Error saving to server:', error);
        
        try {
            localStorage.setItem('itPlaybookData', JSON.stringify(systemData));
            console.log('Data saved to localStorage as fallback');
            return { success: true, source: 'localStorage' };
        } catch (localError) {
            console.error('localStorage save also failed:', localError);
            throw new Error('Failed to save data');
        }
    }
}

// ========== USER SETTINGS ========== //
function loadUserSettings() {
    try {
        const savedSettings = localStorage.getItem('horizonSettings');
        if (savedSettings) {
            userSettings = { ...userSettings, ...JSON.parse(savedSettings) };
            console.log('Settings loaded from localStorage:', userSettings);
        }
        
        const currencySelect = document.getElementById('currencySelect');
        if (currencySelect) {
            currencySelect.value = userSettings.currency;
        }
        
        applySettings();
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

function saveUserSettings() {
    try {
        localStorage.setItem('horizonSettings', JSON.stringify(userSettings));
        showNotification('Settings saved successfully');
        applySettings();
    } catch (error) {
        console.error('Error saving settings:', error);
        showNotification('Error saving settings', 'error');
    }
}

function applySettings(settings) {
    // ✅ NULL CHECK EKLE!
    if (!settings) {
        console.warn('⚠️ No settings provided, using defaults');
        settings = {
            emailNotifications: true,
            projectNotifications: true,
            systemAlerts: true,
            timezone: 'Europe/Istanbul',
            timezoneCode: 'TR',
            timezoneFlagCode: 'tr',
            dateFormat: 'DD/MM/YYYY',
            compactMode: false
        };
    }
    
    console.log('Applying settings:', settings);
    
    // Currency preference'ı uygula
    if (settings.currency) {
        updateAllCurrencyDisplays(settings.currency);
    }
    
    // ⚠️ BURAYI DEĞİŞTİR: userSettings → settings
    if (settings.browserNotifications && 'Notification' in window) {
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
    
    setTimeout(() => {
        updateAllCurrencyDisplays();
    }, 500);
}



// ========== MODAL FUNCTIONS ========== //
function closeModal(modalId) {
    console.log(`Closing modal: ${modalId}`);
    
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// ========== NAVIGATION FUNCTIONS ========== //
function backToDashboard() {
    const currentPath = window.location.pathname;
    
    // Eğer /pages/ klasöründeyse
    if (currentPath.includes('/pages/')) {
        window.location.href = '../index.html';
    } 
    // Eğer /Horizon/ root'undaysa veya index.html'deyse
    else {
        window.location.href = '/Horizon/index.html';
    }
}

// ========== INITIALIZATION ========== //
document.addEventListener('DOMContentLoaded', function() {
    console.log('Common.js initialized');
    loadUserSettings();
    loadDataFromServer();
});

// ========== TAB NAVIGATION SYSTEM ========== //
function showTab(tabName, clickedElement = null) {
    console.log('Switching to tab:', tabName);
    
    try {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
            tab.style.display = 'none';
        });
        
        // Remove active class from all nav tabs
        document.querySelectorAll('.nav-tab').forEach(nav => {
            nav.classList.remove('active');
        });
        
        // Show target tab
        const targetTab = document.getElementById(tabName);
        if (targetTab) {
            targetTab.classList.add('active');
            targetTab.style.display = 'block';
            
            // Set clicked element as active
            if (clickedElement) {
                clickedElement.classList.add('active');
            }
            
            // Trigger tab-specific initialization
            onTabActivated(tabName);
            
            console.log('Tab activated:', tabName);
        } else {
            console.error('Tab not found:', tabName);
            showNotification('Tab not found: ' + tabName, 'error');
        }
    } catch (error) {
        console.error('Error switching tabs:', error);
        showNotification('Error switching tabs', 'error');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Common.js initialized');

    if (window.authService && window.authService.isAuthenticated()) {
        loadUserSettings();
        loadDataFromServer();
    } else {
        console.warn('⚠️ No valid token — skipping data load');
    }
});


function onTabActivated(tabName) {
    switch (tabName) {
        case 'overview':
            if (typeof updateDashboard === 'function') updateDashboard();
            break;
        case 'project-management':
            if (typeof populateProjectsGrid === 'function') populateProjectsGrid();
            if (typeof updateProjectOverview === 'function') updateProjectOverview();
            break;
        case 'financial':
            if (typeof populateContractsTable === 'function') populateContractsTable();
            if (typeof updateFinancialMetrics === 'function') updateFinancialMetrics();
            break;
        case 'assets-infrastructure':
            if (typeof updateAssetsMetrics === 'function') updateAssetsMetrics();
            if (typeof populateDevicesTable === 'function') populateDevicesTable();
            break;
        case 'settings':
            if (typeof loadSettingsUI === 'function') loadSettingsUI();
            break;
    }
}

// Page Transition Overlay
function showPageTransition() {
    let overlay = document.getElementById('pageTransitionOverlay');
    
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'pageTransitionOverlay';
        overlay.innerHTML = `
            <div class="transition-content">
                <div class="transition-spinner"></div>
                <p class="transition-text">Loading...</p>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function hidePageTransition() {
    const overlay = document.getElementById('pageTransitionOverlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
            overlay.style.opacity = '1';
            document.body.style.overflow = '';
        }, 300);
    }
}

// Auto-hide on page load
window.addEventListener('load', () => {
    hidePageTransition();
});

// Show on page navigation
window.addEventListener('beforeunload', () => {
    showPageTransition();
});


console.log('✨ Page transition system loaded!');

// 🚀 Sayfa geçiş fonksiyonu
// ============================================================
// PAGE TRANSITION WITH UNIVERSAL LOADER
// ============================================================

function pageTransition(targetPage) {
    console.log('🚀 Starting transition to:', targetPage);
    
    // Detect page type from URL
    const pageType = detectPageType(targetPage);
    
    // Show universal loader with appropriate messages
    if (typeof showPageLoader === 'function') {
        showPageLoader(pageType);
    }
    
    // Loading durumunu kaydet
    sessionStorage.setItem('pageLoading', 'true');
    sessionStorage.setItem('loadingStartTime', Date.now());
    
    // Sayfa değiştir
    setTimeout(() => {
        window.location.href = targetPage;
    }, 300);
}

// ============================================================
// DETECT PAGE TYPE FOR APPROPRIATE MESSAGES
// ============================================================

function detectPageType(url) {
    if (!url) return 'default';
    
    const filename = url.split('/').pop().replace('.html', '');
    
    const typeMap = {
        'assets': 'assets',
        'projects': 'projects',
        'contracts': 'contracts',
        'financial': 'financial',
        'team': 'team',
        'locations': 'locations',
        'country-detail': 'comparison',
        'live-comparison': 'comparison',
        'dashboard': 'default',
        'index': 'default'
    };
    
    return typeMap[filename] || 'default';
}

// ============================================================
// HIDE PAGE LOADING AFTER PAGE LOADS
// ============================================================

function hidePageLoading() {
    const isLoading = sessionStorage.getItem('pageLoading');
    
    if (isLoading === 'true') {
        console.log('📦 Page loaded, hiding loading screen...');
        
        // Minimum loading süresi (çok hızlı geçmesin)
        const startTime = parseInt(sessionStorage.getItem('loadingStartTime') || '0');
        const elapsed = Date.now() - startTime;
        const minLoadingTime = 800; // Minimum 800ms göster
        
        const remainingTime = Math.max(0, minLoadingTime - elapsed);
        
        setTimeout(() => {
            // Hide universal loader
            if (typeof hidePageLoader === 'function') {
                hidePageLoader();
            }
            
            sessionStorage.removeItem('pageLoading');
            sessionStorage.removeItem('loadingStartTime');
            console.log('✅ Loading screen removed');
        }, remainingTime);
    }
}

// ============================================================
// NAVIGATION SETUP
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Setting up navigation...');
    
    // Loading'i kontrol et ve kaldır
    hidePageLoading();
    
    // ✅ SADECE <a> tag'i olan nav-tab'lara listener ekle (dropdown'ları dahil etme)
    const navLinks = document.querySelectorAll('a.nav-tab');
    console.log('📍 Found nav tabs:', navLinks.length);
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetPage = this.getAttribute('href');
            console.log('🖱️ Clicked:', targetPage);
            pageTransition(targetPage);
        });
    });
    
    // Logo setup - Smart navigation
    const logo = document.querySelector('.logo-section');
    if (logo) {
        logo.removeAttribute('onclick'); // Eski onclick'i temizle
        logo.style.cursor = 'pointer';
        logo.addEventListener('click', function(e) {
            e.preventDefault();
            
            const currentPath = window.location.pathname;
            
            // Eğer index.html'deyse reload yap
            if (currentPath.endsWith('index.html') || 
                currentPath.endsWith('/Horizon/') || 
                currentPath.endsWith('/Horizon')) {
                console.log('🔄 Reloading index page');
                window.location.reload();
            }
            // Eğer /pages/ klasöründeyse
            else if (currentPath.includes('/pages/')) {
                console.log('🏠 Going to home from pages');
                pageTransition('../index.html');
            }
            // Diğer durumlar
            else {
                console.log('🏠 Going to home');
                pageTransition('/Horizon/index.html');
            }
        });
    }
});

// ============================================================
// OS NORMALIZATION HELPERS
// ============================================================

/**
 * Sadece Windows 11 ve Windows 10’u tek isimde toplar.
 * Örnek:
 *  - "Windows 11"               -> "Windows 11"
 *  - "Windows 11 Enterprise"    -> "Windows 11"
 *  - "Windows 11 Pro"           -> "Windows 11"
 *  - "Windows 10 Enterprise"    -> "Windows 10"
 *  - "Windows 10 Enterprise LTSC" -> "Windows 10"
 *  - "Windows 10 Iot Enterprise Ltsc" -> "Windows 10"
 * Diğerlerine DOKUNMAZ.
 */
function normalizeOS(rawOs) {
    if (!rawOs) return 'Unknown';

    const os = String(rawOs).trim();

    // Case-insensitive kıyas için
    const lower = os.toLowerCase();

    // Windows 11 ailesi
    if (lower.startsWith('windows 11')) {
        return 'Windows 11';
    }

    // Windows 10 ailesi
    if (lower.startsWith('windows 10')) {
        return 'Windows 10';
    }

    // Diğerlerini aynen döndür
    return os;
}

/**
 * İstersen “Windows” mu değil mi diye bakmak için
 * örn: grafiklerde kullanılır.
 */
function getWindowsFamily(rawOs) {
    if (!rawOs) return null;
    const normalized = normalizeOS(rawOs);
    if (normalized === 'Windows 11' || normalized === 'Windows 10') {
        return 'Windows';
    }
    return null;
}

// Global export
window.normalizeOS = normalizeOS;
window.getWindowsFamily = getWindowsFamily;


// ============================================================
// WINDOW LOAD EVENT
// ============================================================

window.addEventListener('load', function() {
    console.log('🎉 Window fully loaded');
    hidePageLoading();
});

function animateNumbers(scope = document) {
    try {
        const container = scope.querySelector('.tab-content.active') || scope;
        
        const numberElements = container.querySelectorAll(
            '.metric-value, .stat-number, .flow-count, .stat-value, .overview-count'
        );
        
        numberElements.forEach((element, index) => {
            if (element.dataset.animated === 'true') return;
            
            const rawText = element.textContent || '0';
            const numericPart = rawText.replace(/[^\d]/g, '');
            const finalNumber = parseInt(numericPart, 10) || 0;
            
            if (finalNumber === 0) {
                element.dataset.animated = 'true';
                return;
            }
            
            let current = 0;
            const steps = 50;
            const increment = Math.max(1, Math.ceil(finalNumber / steps));
            const delay = index * 50;
            
            element.textContent = rawText.replace(numericPart, '0');
            element.dataset.animated = 'true';
            
            setTimeout(() => {
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= finalNumber) {
                        current = finalNumber;
                        clearInterval(timer);
                    }
                    
                    const formattedNumber = current.toLocaleString();
                    element.textContent = rawText.replace(numericPart, formattedNumber);
                }, 30);
            }, delay);
        });
        
    } catch (error) {
        console.error('Error animating numbers:', error);
    }
}

// ========== TEAM MODAL FUNCTIONS ========== //
function showTeamModal() {
    const modal = document.getElementById('teamModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeTeamModal() {
    const modal = document.getElementById('teamModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// Make functions globally available
window.showTeamModal = showTeamModal;
window.closeTeamModal = closeTeamModal;

window.getCountryColor = getCountryColor;

// ============================================================
// AUTO-HIGHLIGHT ACTIVE TAB ON PAGE LOAD
// ============================================================
(function() {
    'use strict';
    
    function highlightActiveTab() {
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split('/').pop() || 'index.html';
        
        console.log('🎯 Highlighting active tab for:', currentPage);
        console.log('🎯 Full path:', currentPath);
        
        // Tüm tablardan active class'ı kaldır (sadece link olanlardan)
        document.querySelectorAll('a.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Tüm dropdown'lardan active class'ı kaldır
        document.querySelectorAll('.nav-tab-dropdown').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
        
        // Doğru tab'ı bul ve aktif yap (sadece <a> elementleri)
        document.querySelectorAll('a.nav-tab').forEach(tab => {
            const href = tab.getAttribute('href');
            
            // Index.html için özel kontrol
            if (currentPage === '' || currentPage === 'index.html' || currentPath.endsWith('/Horizon/') || currentPath.endsWith('/Horizon')) {
                if (href === 'index.html' || href === '../index.html' || href.endsWith('index.html')) {
                    tab.classList.add('active');
                    console.log('✅ Overview tab activated');
                }
            }
            // Diğer sayfalar için
            else if (href && (href.includes(currentPage) || currentPage.includes(href.split('/').pop()))) {
                tab.classList.add('active');
                console.log('✅ Tab activated:', href);
            }
        });
        
        // Dropdown içindeki aktif sayfa için parent dropdown'ı aktif yap
        document.querySelectorAll('.dropdown-item.active').forEach(item => {
            const parentDropdown = item.closest('.nav-tab-dropdown');
            if (parentDropdown) {
                parentDropdown.classList.add('active');
                console.log('✅ Parent dropdown activated');
            }
        });
    }
    
    // Sayfa yüklendiğinde çalıştır
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', highlightActiveTab);
    } else {
        highlightActiveTab();
    }
})();

/* ============================================
   GLOBAL SESSION TIME TRACKING
   ============================================ */

let globalSessionStart = Date.now();
let globalTrackingInterval = null;

function startGlobalSessionTracking() {
    if (globalTrackingInterval) return;
    if (!window.authService || !window.authService.isAuthenticated()) return;
    
    const user = window.authService.getCurrentUser();
    if (!user) return;
    
    console.log('⏱️ Global session tracking started');
    globalSessionStart = Date.now();
    
    // Track every 2 minutes
    globalTrackingInterval = setInterval(async () => {
        const duration = Math.floor((Date.now() - globalSessionStart) / 1000);
        
        if (duration < 30) return; // Don't track less than 30 seconds
        
        globalSessionStart = Date.now();
        
        try {
            await window.authService.authorizedFetch('/Horizon/api/users/update-time-spent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fedexId: user.fedexId,
                    secondsToAdd: duration
                })
            });
            console.log(`⏱️ Global time tracked: ${duration}s`);
        } catch (error) {
            console.warn('⚠️ Failed to track time:', error);
        }
    }, 2 * 60 * 1000);
}

// Start tracking if authenticated
if (window.authService && window.authService.isAuthenticated()) {
    startGlobalSessionTracking();
}

// Track on page unload
window.addEventListener('beforeunload', () => {
    const user = window.authService?.getCurrentUser();
    if (!user) return;
    
    const duration = Math.floor((Date.now() - globalSessionStart) / 1000);
    if (duration < 30) return;
    
    const data = JSON.stringify({
        fedexId: user.fedexId,
        secondsToAdd: duration
    });
    
    const blob = new Blob([data], { type: 'application/json' });
    navigator.sendBeacon('/Horizon/api/users/update-time-spent', blob);
});

/* ============================================================
   USER MENU DROPDOWN
   ============================================================ */

(function initializeUserMenu() {
    const userMenu = document.querySelector('.user-menu-dropdown');
    const userAvatar = document.querySelector('.user-avatar');
    
    if (!userMenu || !userAvatar) {
        console.warn('⚠️ User menu elements not found');
        return;
    }
    
    // Toggle user menu on avatar click
    userAvatar.addEventListener('click', (e) => {
        e.stopPropagation();
        closeTimezoneDropdown();
        toggleUserMenu();
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-menu-dropdown') && !e.target.closest('.user-avatar')) {
            closeUserMenu();
        }
    });
    
    // Close on dropdown item click
    const dropdownPanel = document.querySelector('.user-dropdown-panel');
    if (dropdownPanel) {
        dropdownPanel.addEventListener('click', (e) => {
            if (e.target.closest('.user-dropdown-item')) {
                closeUserMenu();
            }
        });
    }
    
    // Populate user info after authentication
    populateUserMenuInfo();
    
    console.log('✅ User menu initialized');
})();

// ============================================================
// USER MENU HELPER FUNCTIONS
// ============================================================

function toggleUserMenu() {
    const userMenu = document.querySelector('.user-menu-dropdown');
    if (userMenu) {
        userMenu.classList.toggle('open');
    }
}

function closeUserMenu() {
    const userMenu = document.querySelector('.user-menu-dropdown');
    if (userMenu) {
        userMenu.classList.remove('open');
    }
}

function closeTimezoneDropdown() {
    const timezoneDropdown = document.getElementById('timezoneDropdown');
    if (timezoneDropdown) {
        timezoneDropdown.style.display = 'none';
    }
}

function populateUserMenuInfo() {
    setTimeout(() => {
        if (!window.authService || !window.authService.isAuthenticated()) {
            console.warn('⚠️ User not authenticated');
            return;
        }
        
        const user = window.authService.getCurrentUser();
        if (!user) {
            console.warn('⚠️ User data not available');
            return;
        }
        
        // Update dropdown name
        const nameEl = document.getElementById('userDropdownName');
        if (nameEl) {
            nameEl.textContent = user.name;
        }
        
        // Update dropdown email
        const emailEl = document.getElementById('userDropdownEmail');
        if (emailEl) {
            emailEl.textContent = user.email || `${user.fedexId}@fedex.com`;
        }
        
        // Update dropdown initials
        const initialsDropdown = document.getElementById('userInitialsDropdown');
        if (initialsDropdown) {
            const initials = user.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
            initialsDropdown.textContent = initials;
        }
        
        console.log('✅ User menu info populated');
    }, 500);
}

// ============================================================
// UNIVERSAL PAGE LOADER SYSTEM
// ============================================================
// Usage: showPageLoader('assets'), hidePageLoader()
// Works with navigation and manual calls
// ============================================================

const LOADER_MESSAGES = {
    // Generic messages for all pages
    default: [
        "Loading data...",
        "Connecting to server...",
        "Fetching information...",
        "Processing request...",
        "Preparing dashboard...",
        "Almost ready...",
        "Finalizing..."
    ],
    
    // Asset-specific messages
    assets: [
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
    ],
    
    // Projects page
    projects: [
        "Loading projects...",
        "Fetching project details...",
        "Calculating budgets...",
        "Loading timelines...",
        "Processing milestones...",
        "Organizing by status...",
        "Almost ready..."
    ],
    
    // Contracts page
    contracts: [
        "Loading contracts...",
        "Fetching vendor data...",
        "Calculating values...",
        "Processing renewals...",
        "Loading terms...",
        "Almost ready..."
    ],
    
    // Financial page
    financial: [
        "Loading financial data...",
        "Calculating budgets...",
        "Processing expenses...",
        "Fetching forecasts...",
        "Analyzing trends...",
        "Almost ready..."
    ],
    
    // Team page
    team: [
        "Loading team members...",
        "Fetching profiles...",
        "Processing roles...",
        "Loading assignments...",
        "Almost ready..."
    ],
    
    // Locations page
    locations: [
        "Loading locations...",
        "Fetching coordinates...",
        "Processing addresses...",
        "Loading regional data...",
        "Almost ready..."
    ],
    
    // Comparison pages
    comparison: [
        "Loading comparison data...",
        "Fetching country statistics...",
        "Calculating metrics...",
        "Processing charts...",
        "Almost ready..."
    ]
};

let loaderMessageInterval = null;
let loaderProgressInterval = null;
let currentLoaderProgress = 0;
let currentLoaderType = 'default';

// ============================================================
// SHOW PAGE LOADER
// ============================================================
function showPageLoader(pageType = 'default') {
    console.log(`▶️ Showing ${pageType} loader...`);
    
    currentLoaderType = pageType;
    const loader = document.getElementById('universalPageLoader');
    
    if (!loader) {
        console.error('❌ Universal loader not found in DOM!');
        return;
    }
    
    // Show loader
    loader.classList.add('active');
    loader.classList.remove('fade-out');
    
    // Reset progress
    currentLoaderProgress = 0;
    updateLoaderProgress(0);
    
    // Start animations
    setTimeout(() => {
        startLoaderMessages(pageType);
        startLoaderProgress();
    }, 100);
}

// ============================================================
// HIDE PAGE LOADER
// ============================================================
function hidePageLoader() {
    console.log('🛑 Hiding loader...');
    
    // Stop intervals
    if (loaderMessageInterval) {
        clearInterval(loaderMessageInterval);
        loaderMessageInterval = null;
    }
    if (loaderProgressInterval) {
        clearInterval(loaderProgressInterval);
        loaderProgressInterval = null;
    }
    
    // Complete progress
    updateLoaderProgress(100);
    
    // Fade out
    setTimeout(() => {
        const loader = document.getElementById('universalPageLoader');
        if (loader) {
            loader.classList.add('fade-out');
            setTimeout(() => {
                loader.classList.remove('active');
            }, 600);
        }
    }, 300);
}

// ============================================================
// MESSAGE ROTATION
// ============================================================
function startLoaderMessages(pageType = 'default') {
    const textElement = document.querySelector('.loader-text');
    if (!textElement) return;
    
    const messages = LOADER_MESSAGES[pageType] || LOADER_MESSAGES.default;
    let lastIndex = -1;
    
    // Set first message
    let currentIndex = Math.floor(Math.random() * messages.length);
    textElement.textContent = messages[currentIndex];
    textElement.style.opacity = '1';
    lastIndex = currentIndex;
    
    // Rotate messages every 2 seconds
    loaderMessageInterval = setInterval(() => {
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * messages.length);
        } while (newIndex === lastIndex && messages.length > 1);
        
        lastIndex = newIndex;
        
        // Fade out
        textElement.style.opacity = '0';
        
        setTimeout(() => {
            textElement.textContent = messages[newIndex];
            textElement.style.opacity = '1';
        }, 300);
    }, 2000);
}

// ============================================================
// PROGRESS ANIMATION
// ============================================================
function startLoaderProgress() {
    const progressBar = document.querySelector('.loader-progress-fill');
    if (!progressBar) return;
    
    currentLoaderProgress = 0;
    updateLoaderProgress(0);
    
    loaderProgressInterval = setInterval(() => {
        if (currentLoaderProgress < 85) {
            const increment = Math.max(0.5, (85 - currentLoaderProgress) / 30);
            currentLoaderProgress += increment;
            updateLoaderProgress(currentLoaderProgress);
        }
    }, 100);
}

function updateLoaderProgress(percent) {
    const progressBar = document.querySelector('.loader-progress-fill');
    const progressText = document.querySelector('.loader-progress-text');
    
    if (progressBar) {
        progressBar.style.width = `${Math.min(percent, 100)}%`;
    }
    
    if (progressText) {
        progressText.textContent = `${Math.round(Math.min(percent, 100))}%`;
    }
}

// ============================================================
// AUTO LOADER FOR NAVIGATION
// ============================================================
function enableAutoLoader() {
    console.log('🔄 Auto-loader enabled for navigation');
    
    // Listen to all navigation links
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.href && !link.target && !link.classList.contains('no-loader')) {
            const href = link.getAttribute('href');
            
            // Only for internal navigation (HTML pages)
            if (href && href.endsWith('.html') && !href.startsWith('http')) {
                // Detect page type from URL
                const pageType = detectPageType(href);
                showPageLoader(pageType);
            }
        }
    });
}

function detectPageType(url) {
    const filename = url.split('/').pop().replace('.html', '');
    
    const typeMap = {
        'assets': 'assets',
        'projects': 'projects',
        'contracts': 'contracts',
        'financial': 'financial',
        'team': 'team',
        'locations': 'locations',
        'country-detail': 'comparison',
        'live-comparison': 'comparison',
        'dashboard': 'default'
    };
    
    return typeMap[filename] || 'default';
}

// ============================================================
// INITIALIZE ON DOM READY
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    enableAutoLoader();
    console.log('✅ Universal Page Loader initialized');
});

// ============================================================
// EXPORT TO WINDOW
// ============================================================
window.showPageLoader = showPageLoader;
window.hidePageLoader = hidePageLoader;

console.log('✅ Universal Page Loader script loaded');
console.log('✅ Active tab highlighter loaded');