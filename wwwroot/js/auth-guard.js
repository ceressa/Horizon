// ========== AUTHENTICATION GUARD & UI MANAGER ========== //
// Version: 6.0 - Fixed & Clean
// Author: Ufuk Celikeloglu

'use strict';

// ============================================================
// GLOBAL LOGOUT HANDLER - DEFINED FIRST FOR INLINE ONCLICK
// ============================================================
window.handleLogout = function(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    console.log('🚪 Logout handler called');
    
    const modal = document.getElementById('logoutModal');
    if (!modal) {
        console.error('❌ Logout modal not found!');
        // Fallback to browser confirm
        if (confirm('Are you sure you want to logout?')) {
            performLogout();
        }
        return;
    }
    
    // Show modal
    modal.classList.add('active');
    
    // Setup event listeners (only once)
    if (!modal.hasAttribute('data-initialized')) {
        const confirmBtn = document.getElementById('confirmLogout');
        const cancelBtn = document.getElementById('cancelLogout');
        
        if (confirmBtn) {
            confirmBtn.addEventListener('click', function() {
                console.log('✅ Logout confirmed');
                performLogout();
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                console.log('❌ Logout cancelled');
                modal.classList.remove('active');
            });
        }
        
        // Close on overlay click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
        
        // ESC key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                modal.classList.remove('active');
            }
        });
        
        modal.setAttribute('data-initialized', 'true');
        console.log('✅ Logout modal initialized');
    }
};

async function performLogout() {
    console.log('🔄 Performing logout...');
    
    // ✅ LOG: Logout BEFORE clearing anything
    if (window.authService && typeof window.authService.logout === 'function') {
        await window.authService.logout(); // Bu zaten async oldu, log da içinde
    } else {
        // Fallback
        localStorage.removeItem('horizonToken');
        sessionStorage.clear();
        window.location.href = `${window.location.origin}/Horizon/pages/login.html`;
    }
}

console.log('✅ Global handleLogout defined');

// ============================================================
// MAIN AUTH GUARD - IIFE
// ============================================================
(function() {
    console.log('🔒 Auth Guard initializing...');

    // ============================================================
    // 1. LOGIN PAGE CHECK
    // ============================================================
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath.includes('login.html');

    if (isLoginPage) {
        console.log('📝 Login page detected - auth guard skipped');
        return;
    }

    // ============================================================
    // 2. AUTHENTICATION CHECK
    // ============================================================
    if (!window.authService) {
        console.error('❌ authService not loaded!');
        window.location.href = `${window.location.origin}/Horizon/pages/login.html`;
        return;
    }

    if (!window.authService.isAuthenticated()) {
    console.warn('❌ Not authenticated - redirecting to login');

    // (OPSİYONEL) LOG: Unauthorized page access
    if (window.horizonLogger) {
    window.horizonLogger.logUnauthorized('anonymous', window.location.pathname);
}

    window.location.href = `${window.location.origin}/Horizon/pages/login.html`;
    return;
}


    console.log('✅ User authenticated');

    // ============================================================
    // 3. GET CURRENT USER
    // ============================================================
    const currentUser = window.authService.getCurrentUser();
    
    if (!currentUser) {
        console.error('❌ Session corrupted - no user data');
        window.location.href = `${window.location.origin}/Horizon/pages/login.html`;
        return;
    }

    console.log('👤 User:', currentUser.name, `(${currentUser.role})`);
    console.log('🌍 Countries:', currentUser.countries);

    // Make globally available
    window.currentUser = currentUser;

    // ============================================================
    // 4. GLOBAL DATA FILTER
    // ============================================================
    window.filterByAuthorizedCountries = function(data, countryField = 'country') {
        if (!Array.isArray(data)) return data;
        return data.filter(item => currentUser.countries.includes(item[countryField]));
    };

    console.log('✅ Global data filter created');

    // ============================================================
    // 5. CONFIGURATION
    // ============================================================
    const COUNTRY_TIMEZONES = {
        'TR': { timezone: 'Europe/Istanbul', abbr: 'TRT', flag: 'tr' },
        'BG': { timezone: 'Europe/Sofia', abbr: 'EET', flag: 'bg' },
        'GR': { timezone: 'Europe/Athens', abbr: 'EET', flag: 'gr' },
        'SI': { timezone: 'Europe/Ljubljana', abbr: 'CET', flag: 'si' },
        'CY': { timezone: 'Asia/Nicosia', abbr: 'EET', flag: 'cy' },
        'GSP': { timezone: 'Europe/Istanbul', abbr: 'GSP', flag: 'tr' },
        'ES': { timezone: 'Europe/Madrid', abbr: 'CET', flag: 'es' },
        'PT': { timezone: 'Europe/Lisbon', abbr: 'WET', flag: 'pt' },
        'AT': { timezone: 'Europe/Vienna', abbr: 'CET', flag: 'at' },
        'CH': { timezone: 'Europe/Zurich', abbr: 'CET', flag: 'ch' },
        'CZ': { timezone: 'Europe/Prague', abbr: 'CET', flag: 'cz' },
        'HU': { timezone: 'Europe/Budapest', abbr: 'CET', flag: 'hu' },
        'RO': { timezone: 'Europe/Bucharest', abbr: 'EET', flag: 'ro' },
        'SK': { timezone: 'Europe/Bratislava', abbr: 'CET', flag: 'sk' }
    };

    const PAGE_NAV_MAP = {
        'index.html': 'Overview',
        'team.html': 'Teams',
        'locations.html': 'Locations',
        'assets.html': 'Assets',
        'apps.html': 'Apps',
        'projects.html': 'Projects',
        'settings.html': 'Settings',
        'country-detail.html': 'Locations'
    };

    // Global timezone state
    let currentTimezone = COUNTRY_TIMEZONES[currentUser.countries[0]] || COUNTRY_TIMEZONES['TR'];
    let clockInterval = null;

    // ============================================================
    // 6. INITIALIZE UI ON DOM READY
    // ============================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeUI);
    } else {
        initializeUI();
    }

    function initializeUI() {
        console.log('🎨 Initializing UI...');
        
        setupActiveNavigation();
        setupLiveClock();
        setupTimezoneDropdown();
        setupUserInterface();
        
        // Retry setup after short delay (for dynamic elements)
        setTimeout(() => {
            console.log('⏰ Retry - Setting up user interface...');
            setupUserInterface();
        }, 200);
        
        console.log('✅ Auth Guard UI initialized');
    }

    // ============================================================
    // 7. ACTIVE NAVIGATION
    // ============================================================
    function setupActiveNavigation() {
        const currentPage = getCurrentPageName();
        const navTabs = document.querySelectorAll('.nav-tab');
        
        if (navTabs.length === 0) {
            console.warn('⚠️ No navigation tabs found');
            return;
        }

        navTabs.forEach(tab => {
            const tabText = tab.querySelector('.nav-tab-text')?.textContent.trim();
            
            if (tabText === PAGE_NAV_MAP[currentPage]) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        console.log('✅ Navigation setup:', currentPage);
    }

    function getCurrentPageName() {
        const path = window.location.pathname;
        const segments = path.split('/');
        return segments[segments.length - 1] || 'index.html';
    }

    // ============================================================
// 8. USER INTERFACE SETUP
// ============================================================
function setupUserInterface() {
    console.log('🔧 Setting up user interface...');
    
    const userInitials = document.getElementById('userInitials');
    const logoutBtn = document.getElementById('logoutBtn');
    
    console.log('🔍 Elements found:', { 
        userInitials: !!userInitials, 
        logoutBtn: !!logoutBtn 
    });
    
    // Set user initials
    if (userInitials && currentUser && currentUser.name) {
        const currentText = userInitials.textContent.trim();
        if (currentText === '--' || currentText === '') {
            const initials = getInitials(currentUser.name);
            userInitials.textContent = initials;
            console.log('✅ Initials set to:', initials);
        }
    }
    
    // Setup logout button - SADECE BİR YÖNTEM!
    if (logoutBtn) {
        // Check if already setup
        if (!logoutBtn.hasAttribute('data-logout-ready')) {
            
            // Remove any existing onclick attribute from HTML
            logoutBtn.removeAttribute('onclick');
            
            // Clone button to remove ALL event listeners
            const newBtn = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newBtn, logoutBtn);
            
            // ✅ SADECE addEventListener kullan
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ Logout button clicked');
                window.handleLogout(e);
            });
            
            newBtn.setAttribute('data-logout-ready', 'true');
            console.log('✅ Logout button ready');
        }
    } else {
        console.warn('⚠️ Logout button #logoutBtn not found');
    }
}

    function getInitials(name) {
        if (!name) return '--';
        
        const parts = name.trim().split(' ').filter(p => p.length > 0);
        
        if (parts.length >= 2) {
            // First and last name initials
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        } else if (parts.length === 1) {
            // Single name - first 2 letters
            return name.substring(0, 2).toUpperCase();
        }
        
        return '--';
    }

    // ============================================================
    // 9. LIVE CLOCK SETUP
    // ============================================================
    function setupLiveClock() {
        // Clear existing interval
        if (clockInterval) {
            clearInterval(clockInterval);
        }
        
        // Update immediately
        updateClock();
        
        // Update every second
        clockInterval = setInterval(updateClock, 1000);
        
        console.log('⏰ Live clock started:', currentTimezone.abbr);
    }

    function updateClock() {
        const timeElement = document.getElementById('liveClock');
        const dateElement = document.getElementById('liveDate');
        const timezoneElement = document.getElementById('clockTimezone');
        
        if (!timeElement || !dateElement || !timezoneElement) return;

        const now = new Date();
        
        try {
            // Format time (HH:MM:SS)
            const timeOptions = {
                timeZone: currentTimezone.timezone,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            };
            const timeString = now.toLocaleTimeString('en-GB', timeOptions);
            
            // Format date (WED, OCT 10, 2025)
            const dateOptions = {
                timeZone: currentTimezone.timezone,
                weekday: 'short',
                month: 'short',
                day: '2-digit',
                year: 'numeric'
            };
            const dateString = now.toLocaleDateString('en-GB', dateOptions).toUpperCase();
            
            // Update DOM
            timeElement.textContent = timeString;
            dateElement.textContent = dateString;
            
            // Update timezone with flag
            timezoneElement.innerHTML = `
                <img src="https://flagcdn.com/16x12/${currentTimezone.flag}.png" 
                     alt="${currentTimezone.abbr}" 
                     class="tz-flag-small" 
                     onerror="this.style.display='none'">
                <span id="timezoneCode">${currentTimezone.abbr}</span>
            `;
            
        } catch (error) {
            console.error('❌ Clock update error:', error);
            timeElement.textContent = '--:--:--';
            dateElement.textContent = 'ERROR';
        }
    }

    // ============================================================
    // 10. TIMEZONE DROPDOWN
    // ============================================================
    function setupTimezoneDropdown() {
        const liveClock = document.querySelector('.live-clock');
        const dropdown = document.getElementById('timezoneDropdown');
        
        if (!liveClock || !dropdown) {
            console.warn('⚠️ Clock or dropdown not found');
            return;
        }
        
        // Toggle dropdown on clock click
        liveClock.addEventListener('click', function(e) {
            e.stopPropagation();
            const isVisible = dropdown.style.display === 'block';
            dropdown.style.display = isVisible ? 'none' : 'block';
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!dropdown.contains(e.target) && !liveClock.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
        
        // Make changeTimezone global for HTML onclick handlers
        window.changeTimezone = changeTimezone;
        
        console.log('✅ Timezone dropdown setup complete');
    }

    function changeTimezone(timezone, code, flagCode) {
        console.log('🌍 Changing timezone to:', code);
        
        // Update global state
        currentTimezone = {
            timezone: timezone,
            abbr: code,
            flag: flagCode
        };
        
        // Update clock immediately
        updateClock();
        
        // Close dropdown
        const dropdown = document.getElementById('timezoneDropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
        
        // Save preference to backend
        saveTimezonePreference(timezone, code, flagCode);
        
        console.log('✅ Timezone changed to:', code);
    }

    async function saveTimezonePreference(timezone, code, flagCode) {
        try {
            const token = localStorage.getItem('horizonToken');
            
            const response = await fetch('/Horizon/api/users/update-timezone', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fedexId: currentUser.fedexId,
                    timezone: timezone,
                    timezoneCode: code,
                    flagCode: flagCode
                })
            });
            
            if (response.ok) {
                console.log('✅ Timezone preference saved');
            } else {
                console.warn('⚠️ Could not save timezone preference');
            }
        } catch (error) {
            console.warn('⚠️ Timezone save error:', error.message);
        }
    }

    // ============================================================
    // 11. GLOBAL EXPORTS
    // ============================================================
    window.authGuard = {
        currentUser: currentUser,
        currentTimezone: currentTimezone,
        changeTimezone: changeTimezone,
        updateClock: updateClock,
        getInitials: getInitials,
        setupUserInterface: setupUserInterface
    };

    console.log('✅ Auth Guard exports created');

})(); // IIFE END

// ============================================================
// FINAL VERIFICATION
// ============================================================
console.log('✅ Auth Guard fully loaded');
console.log('✅ window.handleLogout type:', typeof window.handleLogout);
console.log('✅ window.currentUser:', window.currentUser?.name || 'Not set');
console.log('✅ window.authGuard:', window.authGuard ? 'Available' : 'Not available');