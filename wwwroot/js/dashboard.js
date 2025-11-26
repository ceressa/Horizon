'use strict';

// ========== GLOBAL VARIABLES ========== //
// Declare globals on window object to avoid conflicts
window.currentUser = window.currentUser || null;
window.currentTimezone = window.currentTimezone || 'Europe/Istanbul';
window.currentTimezoneCode = window.currentTimezoneCode || 'TR';

// System data storage
window.systemData = window.systemData || {
    users: {},
    devices: {},
    networkDevicesByCountry: {},
    projects: [],
    locationCoordinates: {},
    locations: {}
};

// ========== SINGLE INITIALIZATION ========== //
let dashboardInitialized = false;

document.addEventListener('DOMContentLoaded', async () => {
    if (dashboardInitialized) {
        console.warn('⚠️ Dashboard already initialized!');
        return;
    }
    dashboardInitialized = true;
    
    console.log('🎯 Dashboard initialization started...');
    
    // Check authentication
    if (!window.authService.isAuthenticated()) {
        console.warn('❌ Token invalid or expired');
        window.authService.logout();
        window.location.href = `${window.location.origin}/Horizon/pages/login.html`;
        return;
    }

    // Set current user
    window.currentUser = window.authService.getCurrentUser();
    console.log('👤 User authenticated:', window.currentUser.name);
    
    // Set initials fallback
    setTimeout(() => {
        const userInitials = document.getElementById('userInitials');
        if (userInitials && window.currentUser && window.currentUser.name) {
            if (userInitials.textContent === '--') {
                const initials = window.currentUser.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2);
                userInitials.textContent = initials;
            }
        }
    }, 300);
    
    // Load data ONCE
    await loadDashboardData();
    
    // Initialize features
    initializeAssetCardClicks();
    startPeriodicUpdates();
    
    // Animations
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.6s ease';
        document.body.style.opacity = '1';
    }, 100);
    
    // Parse emojis
    if (typeof parseEmojis === 'function') {
        parseEmojis();
    }
    
    console.log('✅ Dashboard fully initialized!');
});

// ========== LOAD DASHBOARD DATA ========== //
async function loadDashboardData() {
    console.log('📊 Loading dashboard data...');
    
    try {
        await loadDataFromServer();
        updateDashboard();
    } catch (error) {
        if (typeof showNotification === 'function') {
            showNotification('Failed to load dashboard data', 'error');
        }
    }
}


// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' :
                 type === 'error' ? 'fa-exclamation-circle' :
                 type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
    
    toast.innerHTML = `
        <div><i class="fas ${icon}"></i> ${message}</div>
        <div class="toast-close" onclick="this.parentElement.remove()">✖</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastFadeOut 0.4s forwards';
        setTimeout(() => toast.remove(), 400);
    }, 5000);
}


// ========== AUTHENTICATION CHECK ========== //
function checkAuthentication() {
    if (!window.authService || !window.authService.isAuthenticated()) {
        console.warn('❌ User not authenticated');
        return false;
    }
    return true;
}

function getAllowedCountries() {
    const user = window.authService?.getCurrentUser();
    if (!user || !user.countries) {
        console.error('❌ No user countries found');
        return [];
    }
    console.log('🔒 Allowed countries for', user.name, ':', user.countries);
    return user.countries;
}




window.loadDataFromServer = async function loadDataFromServer() {
    try {
        
        const response = await fetch('/Horizon/api/data/inventory');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const inventoryData = await response.json();
        console.log('📥 Raw inventory data received:', inventoryData);
        
        // ✅ processInventoryData fonksiyonunu çağır
        if (typeof processInventoryData === 'function') {
            processInventoryData(inventoryData);
        } else {
            console.error('❌ processInventoryData function not found!');
        }
        
        console.log('✅ Data loaded and processed');
        return inventoryData;
        
    } catch (error) {
        showNotification('Failed to load data from server', 'error');
        return null;
    }
}

// ===== TIMEZONE FUNCTIONS ===== //
function updateLiveClock() {
    const now = new Date();
    
    let tz = window.currentTimezone || 'Europe/Istanbul';
    
    // ✅ "auto" ise browser'ın timezone'unu kullan
    if (tz === 'auto' || tz === 'Auto') {
        tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    
    const tzCode = window.currentTimezoneCode || 'TR';
    
    // ✅ SANİYESİZ SAAT - NO JITTER
    const timeStr = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false,
        timeZone: tz
    });
    
    const dateStr = now.toLocaleDateString('en-US', { 
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: tz
    });
    
    const clockElement = document.getElementById('liveClock');
    const dateElement = document.getElementById('liveDate');
    const codeSpan = document.getElementById('timezoneCode');
    
    if (clockElement) clockElement.textContent = timeStr;
    if (dateElement) dateElement.textContent = dateStr;
    if (codeSpan) codeSpan.textContent = tzCode;
}

function toggleTimezoneDropdown(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('timezoneDropdown');
    if (dropdown.style.display === 'none' || !dropdown.style.display) {
        dropdown.style.display = 'block';
    } else {
        dropdown.style.display = 'none';
    }
}

// ===== TIMEZONE FUNCTIONS ===== //
async function changeTimezone(timezone, code, flagCode) {
    event.stopPropagation();
    
    // ✅ Hemen UI'ı güncelle
    window.currentTimezone = timezone;
    window.currentTimezoneCode = code;
    
    const flagImg = document.getElementById('timezoneFlag');
    const codeSpan = document.getElementById('timezoneCode');
    
    if (flagImg) {
        flagImg.src = `https://flagcdn.com/w20/${flagCode}.png`;
    }
    if (codeSpan) codeSpan.textContent = code;
    
    updateLiveClock();
    document.getElementById('timezoneDropdown').style.display = 'none';
    
    // ✅ localStorage'a kaydet (fallback)
    localStorage.setItem('preferredTimezone', timezone);
    localStorage.setItem('preferredTimezoneCode', code);
    localStorage.setItem('preferredFlagCode', flagCode);
    
    // ✅ Backend'e kaydet
    try {
        const currentUser = window.authService?.getCurrentUser();
        if (!currentUser) {
            console.warn('⚠️ User not found, timezone saved to localStorage only');
            return;
        }

        console.log('💾 Saving timezone to backend...', timezone);
        
        const response = await window.authService.authorizedFetch('/Horizon/api/users/update-timezone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fedexId: currentUser.fedexId,
                timezone: timezone,
                timezoneCode: code,
                flagCode: flagCode
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Timezone saved to backend:', result);
            
            if (typeof showToast === 'function') {
                showToast(`Timezone changed to ${code}`, 'success');
            }
        } else {
            console.warn('⚠️ Backend save failed, using localStorage');
        }
    } catch (error) {
        console.error('❌ Error saving timezone:', error);
        console.warn('⚠️ Timezone saved to localStorage only');
    }
}

// ✅ Export to global scope
window.updateLiveClock = updateLiveClock;
window.toggleTimezoneDropdown = toggleTimezoneDropdown;
window.changeTimezone = changeTimezone;


// Dropdown dışına tıklayınca kapat
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('timezoneDropdown');
    const clock = document.querySelector('.live-clock');
    
    if (dropdown && clock && !clock.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});




function updateDashboard() {
    console.log('📄 Updating dashboard metrics...');

    // Get allowed countries
    const allowedCountries = getAllowedCountries();
    
    if (allowedCountries.length === 0) {
        console.warn('⚠️ No countries to display');
        return;
    }

    const users = window.systemData.users || {};
    const devices = window.systemData.devices || {};
    const networkDevices = window.systemData.networkDevicesByCountry || {};
    const projects = window.systemData.projects || [];

    console.log('📊 Processing countries:', allowedCountries);

    let totalUsers = 0, totalDevices = 0, totalNetworkDevices = 0;

    // ✅ SADECE İZİN VERİLEN ÜLKELERİ HESAPLA
    allowedCountries.forEach(country => {
        const userCount = users[country] || 0;
        const deviceCount = devices[country] || 0;
        const nd = networkDevices[country] || {};
        const networkCount = (nd.router || 0) + (nd.switch || 0) + (nd.ap || 0) + (nd.firewall || 0) + (nd.uds || 0);
        
        totalUsers += userCount;
        totalDevices += deviceCount;
        totalNetworkDevices += networkCount;
        
        console.log(`📍 ${country}: ${userCount} users, ${deviceCount} devices, ${networkCount} network`);
    });

    console.log(`📈 TOTALS: ${totalUsers} users, ${totalDevices} devices, ${totalNetworkDevices} network devices`);

    // Update metric cards
    const elements = {
        totalUsers: document.getElementById('totalUsers'),
        totalDevices: document.getElementById('totalDevices'),
        totalNetworkDevices: document.getElementById('totalNetworkDevices'),
        activeProjects: document.getElementById('activeProjects')
    };

    if (elements.totalUsers) {
        elements.totalUsers.textContent = totalUsers.toLocaleString();
    }
    
    if (elements.totalDevices) {
        elements.totalDevices.textContent = totalDevices.toLocaleString();
    }
    
    if (elements.totalNetworkDevices) {
        elements.totalNetworkDevices.textContent = totalNetworkDevices.toLocaleString();
    }
    
    // Filter projects by allowed countries
    const filteredProjects = projects.filter(p => allowedCountries.includes(p.country));
    if (elements.activeProjects) {
        elements.activeProjects.textContent = filteredProjects.length.toLocaleString();
    }

    // Country grid güncelle
    const grid = document.getElementById('countriesGrid');
    if (grid) {
        console.log('🌍 Updating countries grid...');
        populateCountriesGrid();
    }

    console.log('✅ Dashboard update completed');
}

function populateCountriesGrid() {
    const grid = document.getElementById('countriesGrid');
    if (!grid) {
        console.error('❌ countriesGrid element not found');
        return;
    }

    console.log('🌍 Populating countries grid...');
    grid.innerHTML = '';

    const allowedCountries = getAllowedCountries();
    
    if (allowedCountries.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <i class="fas fa-lock" style="font-size: 3rem; color: #ccc; margin-bottom: 16px;"></i>
                <p style="color: #666;">No countries assigned to your account.</p>
            </div>
        `;
        return;
    }

    const users = window.systemData.users || {};
    const devices = window.systemData.devices || {};
    const locationCoords = window.systemData.locationCoordinates || {};

    console.log('📊 Available data for countries:', Object.keys(users));
    console.log('🔒 User allowed countries:', allowedCountries);

    allowedCountries.forEach(countryCode => {
        if (!users[countryCode] && !devices[countryCode]) {
            console.warn(`⚠️ No data for country: ${countryCode}`);
            return;
        }
        
        const userCount = users[countryCode] || 0;
        const deviceCount = devices[countryCode] || 0;
        const locations = (locationCoords[countryCode] || []).length;
        const projects = ((window.systemData.projects || []).filter(p => p.country === countryCode)).length;

        console.log(`✅ Creating card for ${countryCode}: ${userCount} users, ${deviceCount} devices`);

        // 🔥 Absolute URL for country detail
        const targetUrl = `${window.location.origin}/Horizon/pages/country-detail.html?country=${countryCode}`;
        
        // 🔥 Get flag emoji
        const flagEmoji = getCountryFlag(countryCode);
        console.log(`🚩 Flag for ${countryCode}:`, flagEmoji);

        const cardHTML = `
        <div class="country-card glass-morphism premium-hover interactive-card"
            data-country="${countryCode}"
            onclick="window.location.href='${targetUrl}'">
            <span class="country-flag micro-bounce">${flagEmoji}</span>
            <div class="country-name">${getCountryName(countryCode)}</div>
            <div class="country-stats">
                <div class="country-stat">
                    <div class="stat-number">${userCount.toLocaleString()}</div>
                    <div class="stat-label">Users</div>
                </div>
                <div class="country-stat">
                    <div class="stat-number">${deviceCount.toLocaleString()}</div>
                    <div class="stat-label">Devices</div>
                </div>
                <div class="country-stat">
                    <div class="stat-number">${locations}</div>
                    <div class="stat-label">Locations</div>
                </div>
                <div class="country-stat">
                    <div class="stat-number">${projects}</div>
                    <div class="stat-label">Projects</div>
                </div>
            </div>
        </div>`;
        
        grid.innerHTML += cardHTML;
    });
    
    // 🔥 Parse emojis with Twemoji
    console.log('🎨 Parsing emojis with Twemoji...');
    
    setTimeout(() => {
        if (typeof twemoji !== 'undefined') {
            twemoji.parse(grid, {
                folder: 'svg',
                ext: '.svg'
            });
            console.log('✅ Emojis parsed successfully');
        } else {
            console.warn('⚠️ Twemoji not loaded, using native emojis');
        }
    }, 200);
    
    console.log(`✅ Countries grid populated with ${allowedCountries.length} countries`);
}

// ========== ENHANCED COFFEE EASTER EGG SYSTEM ========== //
let typedText = '';
let coffeeMode = false;
let coffeeTimeout;
let pressTimer;
let coffeeCount = parseInt(localStorage.getItem('horizonCoffeeCount') || '0');
let lastResetDate = localStorage.getItem('lastCoffeeResetDate') || new Date().toDateString();

// Coffee icon variants
const COFFEE_ICONS = ['fa-coffee', 'fa-mug-hot'];
const COFFEE_COLORS = ['#8B4513', '#6F4E37', '#A0522D', '#D2691E', '#C19A6B'];
const COFFEE_ANIMATIONS = ['coffeeWiggle', 'coffeeFloat', 'coffeeRotate', 'coffeePulse'];

// ========== INITIALIZATION ========== //
document.addEventListener('DOMContentLoaded', () => {
    checkAndResetCoffeeCounter();
    updateCoffeeDisplay();
    setupCoffeeCounter();
    setupCoffeeKeyboard();
});

// ========== DAILY RESET CHECK ========== //
function checkAndResetCoffeeCounter() {
    const today = new Date().toDateString();
    
    if (lastResetDate !== today) {
        console.log('🌅 New day detected - resetting coffee counter');
        coffeeCount = 0;
        lastResetDate = today;
        localStorage.setItem('horizonCoffeeCount', '0');
        localStorage.setItem('lastCoffeeResetDate', today);
        updateCoffeeDisplay();
        showToast('☀️ New day, new coffee adventures!', 'info');
    }
}

// ========== COUNTER SETUP ========== //
function setupCoffeeCounter() {
    const counter = document.querySelector('.floating-coffee-counter');
    if (!counter) return;
    
    let isLongPress = false;
    
    counter.addEventListener('click', function(e) {
        e.stopPropagation();
        if (!isLongPress) {
            incrementCoffeeCount();
        }
    });
    
    counter.addEventListener('mousedown', function() {
        isLongPress = false;
        pressTimer = setTimeout(() => {
            isLongPress = true;
            if (confirm('Reset coffee counter for today?')) {
                resetCoffeeCounter();
            }
        }, 2000);
    });
    
    counter.addEventListener('mouseup', () => clearTimeout(pressTimer));
    counter.addEventListener('mouseleave', () => clearTimeout(pressTimer));
}

// ========== KEYBOARD ACTIVATION ========== //
function setupCoffeeKeyboard() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && coffeeMode) {
            clearCoffeeModeEarly();
            return;
        }
        
        if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
            typedText += e.key.toLowerCase();
            
            if (typedText.slice(-6) === 'coffee' || typedText.slice(-5) === 'kahve') {
                activateCoffeeMode();
                typedText = '';
            }
            
            if (typedText.length > 15) {
                typedText = typedText.slice(-10);
            }
        }
    });
}

async function incrementCoffeeCount() {
    coffeeCount++;
    updateCoffeeDisplay();
    localStorage.setItem('horizonCoffeeCount', coffeeCount);
    
    showCoffeeMessage();
    triggerMilestoneEffect(coffeeCount);
    
    // ✅ Backend'e kaydet
    try {
        const user = window.authService?.getCurrentUser();
        if (user) {
            await window.authService.authorizedFetch('/Horizon/api/users/update-coffee', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fedexId: user.fedexId,
                    coffeeCount: coffeeCount
                })
            });
            console.log('☕ Coffee count synced to backend');
        }
    } catch (error) {
        console.warn('⚠️ Failed to sync coffee:', error);
    }
}

function showCoffeeMessage() {
    const jokes = [
        "Your coffee fortune says: you're destined to drink... more coffee!",
        "You've officially earned 40 years of friendship — better start writing those birthday cards.",
        "This cup just promoted you to 'Chief Coffee Philosopher'.",
        "Careful! The cezve union is watching you closely.",
        "You're now 51% coffee, 49% human — legally considered 'espresso citizen'.",
        "Congratulations! You just unlocked the secret 'Ottoman Barista' achievement.",
        "Your kahve grounds just spelled out 'slow down' — but who listens?",
        "Legend says if you drink one more, Nasreddin Hodja will appear.",
        "Breaking news: your bloodstream is now a tiny Turkish coffee pot.",
        "Achievement unlocked: you can serve coffee on a flying carpet.",
        "Your future: endless coffee, eternal gossip, infinite friendship.",
        "You've reached 'Fortune Teller Level 99'.",
        "You're now qualified to teach 'Advanced Coffee Diplomacy 101'.",
        "This is no longer coffee — this is a personality trait.",
        "Warning: At this level, you may summon a whirling dervish."
    ];
    
    const warnings = [
        "Even the Coffee Oracle has retreated in fear",
        "You've achieved coffee enlightenment",
        "At this level, coffee shops pay YOU",
        "NASA wants to study your caffeine-powered blood",
        "Breaking: Local person keeping Colombian economy alive",
        "You've unlocked the secret coffee dimension",
        "Even espresso machines bow in your presence",
        "Your coffee intake is now a strategic resource",
        "Legend says you can brew coffee with your mind",
        "Scientists are baffled - you're 90% coffee"
    ];
    
    let message, type;
    if (coffeeCount <= 15) {
        message = jokes[Math.min(coffeeCount - 1, jokes.length - 1)];
        type = coffeeCount <= 4 ? 'success' : coffeeCount <= 7 ? 'info' : 'warning';
    } else {
        const random = warnings[Math.floor(Math.random() * warnings.length)];
        message = `${coffeeCount}. coffee! ${random}`;
        type = 'error';
    }
    
    showToast(message, type);
}

// ========== MILESTONE EFFECTS ========== //
function triggerMilestoneEffect(count) {
    switch(count) {
        case 3:
            createConfetti();
            showToast('🎉 Morning boost activated!', 'success');
            break;
        case 5:
            pulseScreen();
            showToast('⚡ Power mode activated!', 'warning');
            break;
        case 10:
            fireAnimation();
            showToast('🔥 Warning: Rocket fuel detected!', 'error');
            break;
        case 15:
            shakeScreen();
            showToast('💀 Danger zone reached!', 'error');
            break;
        case 20:
            cosmicEffect();
            showToast('🚀 You have transcended humanity!', 'error');
            break;
    }
}

// ========== CONFETTI EFFECT ========== //
function createConfetti() {
    const colors = ['#f59e0b', '#84cc16', '#22d3ee', '#a855f7', '#ef4444'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 5000);
    }
}

// ========== SCREEN EFFECTS ========== //
function pulseScreen() {
    document.body.style.animation = 'screenPulse 0.5s ease 2';
    setTimeout(() => document.body.style.animation = '', 1000);
}

function shakeScreen() {
    document.body.style.animation = 'screenShake 0.5s ease';
    setTimeout(() => document.body.style.animation = '', 500);
}

function fireAnimation() {
    document.body.classList.add('fire-mode');
    setTimeout(() => document.body.classList.remove('fire-mode'), 3000);
}

function cosmicEffect() {
    createStars();
    document.body.classList.add('cosmic-mode');
    setTimeout(() => document.body.classList.remove('cosmic-mode'), 5000);
}

function createStars() {
    for (let i = 0; i < 30; i++) {
        const star = document.createElement('div');
        star.className = 'cosmic-star';
        star.style.left = Math.random() * 100 + 'vw';
        star.style.top = Math.random() * 100 + 'vh';
        star.style.animationDelay = Math.random() * 2 + 's';
        document.body.appendChild(star);
        
        setTimeout(() => star.remove(), 5000);
    }
}

// ========== COFFEE MODE ========== //
function activateCoffeeMode() {
    if (coffeeMode) return;
    
    coffeeMode = true;
    document.body.classList.add('coffee-mode-active');
    showToast('☕ COFFEE MODE! (ESC to exit)', 'success');
    
    const allIcons = document.querySelectorAll('i[class*="fa"]');
    const originalData = [];
    
    allIcons.forEach((icon, index) => {
        originalData[index] = {
            element: icon,
            originalClass: icon.className,
            originalColor: icon.style.color
        };
        
        // Random coffee icon & color
        const randomIcon = COFFEE_ICONS[Math.floor(Math.random() * COFFEE_ICONS.length)];
        const randomColor = COFFEE_COLORS[Math.floor(Math.random() * COFFEE_COLORS.length)];
        const randomAnim = COFFEE_ANIMATIONS[Math.floor(Math.random() * COFFEE_ANIMATIONS.length)];
        
        icon.className = `fas ${randomIcon}`;
        icon.style.color = randomColor;
        icon.style.transition = 'all 0.3s ease';
        
        const delay = Math.random() * 500;
        setTimeout(() => {
            icon.style.animation = `${randomAnim} ${0.6 + Math.random() * 0.4}s ease-in-out infinite alternate`;
        }, delay);
    });
    
    coffeeTimeout = setTimeout(() => restoreIcons(originalData), 30000);
}

function clearCoffeeModeEarly() {
    if (!coffeeMode) return;
    
    clearTimeout(coffeeTimeout);
    const allIcons = document.querySelectorAll('i.fa-coffee, i.fa-mug-hot');
    
    allIcons.forEach(icon => {
        icon.style.animation = '';
        icon.style.color = '';
        
        // ✅ LOGOUT BUTTON CHECK
        const logoutBtn = icon.closest('.logout-btn');
        if (logoutBtn) {
            icon.className = 'fas fa-sign-out-alt';
            return;
        }
        
        const parent = icon.closest('.metric-icon, .nav-tab, .stat-icon');
        if (parent) {
            if (parent.classList.contains('metric-icon')) {
                const card = parent.closest('.metric-card');
                if (card?.dataset.type === 'users') icon.className = 'fas fa-users';
                else if (card?.dataset.type === 'devices') icon.className = 'fas fa-laptop';
                else if (card?.dataset.type === 'network') icon.className = 'fas fa-network-wired';
                else if (card?.dataset.type === 'projects') icon.className = 'fas fa-project-diagram';
            } else if (parent.closest('.nav-tab')) {
                const navTab = parent.closest('.nav-tab');
                const href = navTab?.getAttribute('href') || '';
                if (href.includes('team')) icon.className = 'fas fa-users';
                else if (href.includes('locations')) icon.className = 'fas fa-map-marked';
                else if (href.includes('assets')) icon.className = 'fas fa-server';
                else if (href.includes('apps')) icon.className = 'fas fa-cubes';
                else if (href.includes('projects')) icon.className = 'fas fa-project-diagram';
                else if (href.includes('settings')) icon.className = 'fas fa-cog';
                else icon.className = 'fas fa-chart-line';
            }
        }
    });
    
    document.body.classList.remove('coffee-mode-active');
    coffeeMode = false;
    showToast('Coffee mode closed', 'info');
}

function restoreIcons(originalData) {
    originalData.forEach(data => {
        if (data.element) {
            data.element.className = data.originalClass;
            data.element.style.color = data.originalColor;
            data.element.style.animation = '';
        }
    });
    
    document.body.classList.remove('coffee-mode-active');
    coffeeMode = false;
    showToast('Coffee break is over!', 'info');
}

// ========== UTILITIES ========== //
function updateCoffeeDisplay() {
    const countElement = document.getElementById('coffeeCount');
    if (countElement) {
        countElement.textContent = coffeeCount;
    }
}

function resetCoffeeCounter() {
    coffeeCount = 0;
    updateCoffeeDisplay();
    localStorage.setItem('horizonCoffeeCount', '0');
    showToast('Coffee counter reset!', 'info');
}

async function initializeDashboard() {
    console.log('🚀 Dashboard initialization started...');
    
    if (!checkAuthentication()) {
        return;
    }

    // 🔥 GLOBAL currentUser'a ata (var/let/const kullanma!)
    window.currentUser = window.authService.getCurrentUser();
    console.log('✅ Authenticated as:', window.currentUser.name);
    console.log('🌍 Allowed countries:', window.currentUser.countries);
    
    try {
        await loadDataFromServer();
        updateDashboard();
        setupMetricCards();
        
        setTimeout(() => {
            if (typeof animateNumbers === 'function') {
                animateNumbers();
            }
        }, 500);
        
        console.log('✅ Dashboard initialization completed');
    } catch (error) {
        console.error('❌ Dashboard initialization failed:', error);
        if (typeof showNotification === 'function') {
            showNotification('Dashboard initialization failed', 'error');
        }
    }
}

/* ============================================
   SESSION TIME TRACKING (SAFE INITIALIZATION)
   ============================================ */

let sessionStartTime = Date.now();
let sessionTrackingInterval = null;
let hasTrackedSession = false;

function startSessionTracking() {
    if (sessionTrackingInterval) return;

    const user = window.authService?.getCurrentUser();
    if (!user) {
        console.warn('⚠️ No user found for session tracking');
        return;
    }

    console.log('⏱️ Session tracking started');
    sessionStartTime = Date.now();
    hasTrackedSession = false;

    sessionTrackingInterval = setInterval(async () => {
        await trackSessionTime();
    }, 2 * 60 * 1000);
}

async function trackSessionTime() {
    const user = window.authService?.getCurrentUser();
    if (!user) return;

    const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
    if (sessionDuration < 30) return;

    sessionStartTime = Date.now();

    try {
        const response = await window.authService.authorizedFetch('/Horizon/api/users/update-time-spent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fedexId: user.fedexId,
                secondsToAdd: sessionDuration
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`⏱️ Time tracked: ${sessionDuration}s (Total: ${data.totalTimeSpent}s)`);
            hasTrackedSession = true;
        }
    } catch (error) {
        console.warn('⚠️ Failed to track time:', error);
    }
}

window.addEventListener('beforeunload', async () => {
    const user = window.authService?.getCurrentUser();
    if (!user) return;

    const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
    if (sessionDuration < 30) return;

    try {
        const data = JSON.stringify({
            fedexId: user.fedexId,
            secondsToAdd: sessionDuration
        });

        const blob = new Blob([data], { type: 'application/json' });
        navigator.sendBeacon('/Horizon/api/users/update-time-spent', blob);
        console.log(`⏱️ Final time tracked on unload: ${sessionDuration}s`);
    } catch (error) {
        console.warn('⚠️ Failed to track final time:', error);
    }
});

document.addEventListener('visibilitychange', async () => {
    if (document.hidden) {
        await trackSessionTime();
    } else {
        sessionStartTime = Date.now();
        console.log('⏱️ Session timer reset (tab visible)');
    }
});

// ✅ SAFE INITIALIZATION
function safeStartSessionTracking() {
    if (window.authService && typeof window.authService.isAuthenticated === 'function') {
        if (window.authService.isAuthenticated()) {
            console.log('✅ User authenticated, starting session tracking...');
            startSessionTracking();
            setTimeout(() => trackSessionTime(), 60 * 1000);
        } else {
            console.warn('⚠️ User not authenticated, retrying in 500ms...');
            setTimeout(safeStartSessionTracking, 500);
        }
    } else {
        console.warn('⚠️ authService not ready, retrying in 500ms...');
        setTimeout(safeStartSessionTracking, 500);
    }
}

document.addEventListener('DOMContentLoaded', safeStartSessionTracking);


// ✅ METRIC CARDS SETUP
function setupMetricCards() {
    const metricCards = document.querySelectorAll('.metric-card.interactive-card');
    console.log(`🎯 Setting up ${metricCards.length} metric cards`);
    
    metricCards.forEach(card => {
        card.addEventListener('click', () => {
            const type = card.dataset.type;
            if (type) {
                console.log(`📊 Clicked metric card: ${type}`);
                showDetailModal(type);
            }
        });
    });
}

function showDetailModal(type) {
    const modal = document.getElementById('detailModal');
    if (!modal) return;

    const title = document.getElementById('detailModalTitle');
    const table = document.getElementById('detailTable');
    const chartCanvas = document.getElementById('detailChart');

    if (!title || !table || !chartCanvas) return;

    // ✅ Get allowed countries
    const allowedCountries = getAllowedCountries();
    
    let dataArray = [];
    let modalTitle = '';

    const users = window.systemData.users || {};
    const devices = window.systemData.devices || {};
    const networkDevices = window.systemData.networkDevicesByCountry || {};
    const projects = window.systemData.projects || [];

    switch (type) {
        case 'users':
            modalTitle = 'Users by Country';
            // ✅ SADECE İZİN VERİLEN ÜLKELERİ GÖSTER
            dataArray = allowedCountries
                .filter(country => users[country])
                .map(country => ({
                    country,
                    name: getCountryName(country),
                    value: users[country] || 0,
                    color: getCountryColor(country)
                }));
            break;
            
        case 'devices':
            modalTitle = 'Devices by Country';
            dataArray = allowedCountries
                .filter(country => devices[country])
                .map(country => ({
                    country,
                    name: getCountryName(country),
                    value: devices[country] || 0,
                    color: getCountryColor(country)
                }));
            break;
            
        case 'network':
            modalTitle = 'Network Devices by Country';
            dataArray = allowedCountries
                .filter(country => networkDevices[country])
                .map(country => {
                    const nd = networkDevices[country] || {};
                    const total = (nd.router || 0) + (nd.switch || 0) + (nd.ap || 0) + (nd.firewall || 0) + (nd.uds || 0);
                    return {
                        country,
                        name: getCountryName(country),
                        value: total,
                        color: getCountryColor(country)
                    };
                });
            break;
            
        case 'projects':
            modalTitle = 'Projects by Country';
            const projectsByCountry = {};
            // ✅ SADECE İZİN VERİLEN ÜLKELERDEKİ PROJELERİ SAY
            projects.forEach(p => {
                if (p.country && allowedCountries.includes(p.country)) {
                    projectsByCountry[p.country] = (projectsByCountry[p.country] || 0) + 1;
                }
            });
            dataArray = Object.keys(projectsByCountry).map(country => ({
                country,
                name: getCountryName(country),
                value: projectsByCountry[country],
                color: getCountryColor(country)
            }));
            break;
    }

    title.textContent = modalTitle;
    dataArray.sort((a, b) => b.value - a.value);

    // Create table with flags
    let rows = '';
    dataArray.forEach(item => {
        const flag = getCountryFlag(item.country);
        rows += `
        <tr>
            <td class="country-cell" style="text-align: center; font-size: 32px; padding: 16px;">
                ${flag}
            </td>
            <td class="value-cell" style="text-align: center; font-size: 18px; font-weight: bold; color: #84cc16;">
                ${item.value.toLocaleString()}
            </td>
        </tr>`;
    });

    table.innerHTML = `
        <table class="data-table" style="width: 100%;">
            <thead>
                <tr>
                    <th style="text-align: center; color: #84cc16; font-weight: bold; padding: 16px; border-bottom: 2px solid rgba(132, 204, 22, 0.3);">Flag</th>
                    <th style="text-align: center; color: #84cc16; font-weight: bold; padding: 16px; border-bottom: 2px solid rgba(132, 204, 22, 0.3);">Count</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;

    createChart_ExplodingPie(chartCanvas, dataArray, modalTitle);
    modal.classList.add('active');
}

function createChart_ExplodingPie(canvas, data, title) {
    const ctx = canvas.getContext('2d');
    
    if (window.currentDetailChart) {
        window.currentDetailChart.destroy();
    }
    
    canvas.style.display = 'block';
    canvas.style.maxHeight = '600px';
    canvas.style.maxWidth = '600px';
    
    // Gradient renkler oluştur
    const gradientColors = data.map((item) => {
        const gradient = ctx.createRadialGradient(200, 200, 50, 200, 200, 150);
        
        switch(item.name) {
    case 'Türkiye': // Kırmızı + Altın

        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(1, '#CC0000');
        break;
    case 'Greece': // Mavi + Turkuaz
        gradient.addColorStop(0, '#00E5FF');
        gradient.addColorStop(1, '#0033A0');
        break;
    case 'Bulgaria': // Yeşil + Mor
        gradient.addColorStop(0, '#8E44AD');
        gradient.addColorStop(1, '#27AE60');
        break;
    case 'Slovenia': // Lacivert + Açık kırmızı
        gradient.addColorStop(0, '#1A237E');
        gradient.addColorStop(1, '#FF5252');
        break;
    case 'Cyprus': // Turuncu + Açık yeşil
        gradient.addColorStop(0, '#FF9800');
        gradient.addColorStop(1, '#A5D6A7');
        break;
    case 'Austria': // Kırmızı + Gri
        gradient.addColorStop(0, '#D32F2F');
        gradient.addColorStop(1, '#90A4AE');
        break;
    case 'Switzerland': // Kırmızı + Beyaz parlayan
        gradient.addColorStop(0, '#F44336');
        gradient.addColorStop(1, '#FFCDD2');
        break;
    case 'Czechia': // Mavi + Açık sarı
        gradient.addColorStop(0, '#1565C0');
        gradient.addColorStop(1, '#FFEB3B');
        break;
    case 'Hungary': // Yeşil + Açık pembe
        gradient.addColorStop(0, '#2E7D32');
        gradient.addColorStop(1, '#FF8A80');
        break;
    case 'Slovakia': // Mavi + Lila
        gradient.addColorStop(0, '#1976D2');
        gradient.addColorStop(1, '#CE93D8');
        break;
    case 'Romania': // Sarı + Koyu mavi
        gradient.addColorStop(0, '#FFEB3B');
        gradient.addColorStop(1, '#0D47A1');
        break;
    case 'Spain': // Kırmızı + Turuncu
        gradient.addColorStop(0, '#FF7043');
        gradient.addColorStop(1, '#C62828');
        break;
    case 'Portugal': // Yeşil + Altın
        gradient.addColorStop(0, '#43A047');
        gradient.addColorStop(1, '#FFD700');
        break;
    case 'GSP': // Gri + Açık yeşil
        gradient.addColorStop(0, '#9E9E9E');
        gradient.addColorStop(1, '#84CC16');
        break;
    default:
        gradient.addColorStop(0, '#888888');
        gradient.addColorStop(1, '#444444');
}

        
        return gradient;
    });
    
    window.currentDetailChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: data.map(item => item.name),
            datasets: [{
                data: data.map(item => item.value),
                backgroundColor: gradientColors, // Gradient renkler kullan
                borderColor: '#fff',
                borderWidth: 4,
                offset: data.map(() => 10),
                hoverOffset: 30,
                hoverBorderWidth: 5,
                hoverBorderColor: '#ffd700'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: 60 },
            plugins: {
                legend: {
                    position: 'right',
                    align: 'center',
                    labels: {
                        color: '#ffd700',
                        font: { size: 18, weight: 'bold' },
                        usePointStyle: true,
                        pointStyle: 'rectRounded',
                        padding: 25,
                        boxWidth: 25,
                        boxHeight: 25,
                        generateLabels: function(chart) {
                            const dataset = chart.data.datasets[0];
                            return chart.data.labels.map((label, index) => ({
                                text: `${label}: ${dataset.data[index]}`,
                                fillStyle: gradientColors[index],
                                strokeStyle: gradientColors[index],
                                fontColor: '#ffd700',
                                hidden: false,
                                index: index
                            }));
                        }
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeOutBounce'
            }
        }
    });
}



// ✅ CLOSE MODAL
function closeDetailModal() {
    const modal = document.getElementById('detailModal');
    if (modal) {
        modal.classList.remove('active');
        
        // Chart'ı temizle
        if (window.currentDetailChart) {
            window.currentDetailChart.destroy();
            window.currentDetailChart = null;
        }
    }
}

function setupCountryCardHovers() {
    const countryCards = document.querySelectorAll('.country-card');
    
    countryCards.forEach(card => {
        card.addEventListener('mouseenter', (e) => {
            const countryCode = card.getAttribute('data-country') || 
                               card.querySelector('[data-country]')?.getAttribute('data-country');
            
            if (countryCode) {
                document.body.setAttribute('data-hover-country', countryCode);
            }
        });
        
        card.addEventListener('mouseleave', () => {
            document.body.removeAttribute('data-hover-country');
        });
    });
}

// Asset kartlarına click event ekleyen fonksiyon
function initializeAssetCardClicks() {
    console.log('🎯 Initializing asset card clicks...');
    
    // Asset kartlarını seç (data-type attribute'u olanlar)
    const assetCards = document.querySelectorAll('.metric-card[data-type]');
    
    assetCards.forEach(card => {
        const dataType = card.getAttribute('data-type');
        
        if (dataType) {
            // Cursor'u pointer yap
            card.style.cursor = 'pointer';
            
            // Hover efekti ekle
            card.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
            
            // Click event ekle
            card.addEventListener('click', () => {
                console.log(`📊 Asset card clicked: ${dataType}`);
                showDetailModal(dataType);
            });
            
            // Hover efektleri
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-2px)';
                card.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
            });
            
            console.log(`✅ Event listener added to ${dataType} card`);
        }
    });
    
    console.log(`🎯 ${assetCards.length} asset cards initialized`);
}

// Alternative: Manuel olarak her kart için event ekle
function initializeAssetCardClicksManual() {
    console.log('🎯 Initializing asset cards manually...');
    
    const cardMappings = [
        { selector: '.metric-card[data-type="users"]', type: 'users' },
        { selector: '.metric-card[data-type="devices"]', type: 'devices' },
        { selector: '.metric-card[data-type="network"]', type: 'network' },
        { selector: '.metric-card[data-type="projects"]', type: 'projects' }
    ];
    
    cardMappings.forEach(mapping => {
        const card = document.querySelector(mapping.selector);
        if (card) {
            card.style.cursor = 'pointer';
            card.onclick = () => {
                console.log(`📊 Opening modal for: ${mapping.type}`);
                showDetailModal(mapping.type);
            };
            console.log(`✅ ${mapping.type} card initialized`);
        } else {
            console.warn(`❌ Card not found: ${mapping.selector}`);
        }
    });
}


// Sayfa tamamen yüklendiğinde de çalıştır (emin olmak için)
window.addEventListener('load', () => {
    initializeAssetCardClicks();
});

// Manuel test fonksiyonu
function testAssetCards() {
    console.log('🧪 Testing asset cards...');
    
    // Her asset kartını test et
    ['users', 'devices', 'network', 'projects'].forEach(type => {
        const card = document.querySelector(`.metric-card[data-type="${type}"]`);
        if (card) {
            console.log(`✅ ${type} card found:`, card);
            console.log(`   Has click handler:`, !!card.onclick);
        } else {
            console.log(`❌ ${type} card not found`);
        }
    });
}

// Console'dan çalıştırılabilecek fonksiyonlar
window.initializeAssetCardClicks = initializeAssetCardClicks;
window.initializeAssetCardClicksManual = initializeAssetCardClicksManual;
window.testAssetCards = testAssetCards;

// ✅ PERIODIC UPDATES
function startPeriodicUpdates() {
    console.log('⏰ Starting periodic updates...');
    
    // Her 5 dakikada veri yenile
    setInterval(async () => {
        console.log('🔄 Periodic data refresh...');
        await loadDataFromServer();
        updateDashboard();
    }, 5 * 60 * 1000);
}



// ========== TEAM MODAL FUNCTIONS ========== //

function showTeamModal() {
    const modal = document.getElementById('teamModal');
    if (!modal) return;
    
    // Önce görünür yap
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Kısa gecikme sonra animasyon
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function closeTeamModal() {
    const modal = document.getElementById('teamModal');
    if (!modal) return;
    
    // Animasyon başlat
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    
    // Animasyon bitince gizle
    setTimeout(() => {
        modal.style.display = 'none';
    }, 400);
}

// Escape tuşu ile kapatma
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('teamModal');
        if (modal && modal.classList.contains('show')) {
            closeTeamModal();
        }
    }
});

// Modal backdrop'a tıklayınca kapatma
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('teamModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeTeamModal();
            }
        });
    }
});





// Track time on page unload
window.addEventListener('beforeunload', async () => {
    const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
    const user = window.authService?.getCurrentUser();
    
    if (user && sessionDuration > 0) {
        try {
            // Use sendBeacon for reliable delivery
            const data = JSON.stringify({
                fedexId: user.fedexId,
                secondsToAdd: sessionDuration
            });
            
            navigator.sendBeacon('/Horizon/api/users/update-time-spent', data);
            console.log(`⏱️ Final time tracked: ${sessionDuration}s`);
        } catch (error) {
            console.warn('⚠️ Failed to track final time:', error);
        }
    }
});

// Global scope'a export et
window.showTeamModal = showTeamModal;
window.closeTeamModal = closeTeamModal;

// Export functions for global access
window.updateDashboard = updateDashboard;
window.showDetailModal = showDetailModal;
window.closeDetailModal = closeDetailModal;