'use strict';

/* ============================================
   PROFILE PAGE JAVASCRIPT
   ============================================ */

let currentUser = null;
let profileData = null;

// ============================================
// PAGE INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎯 Profile page initializing...');
    
    // Check authentication
    if (!window.authService || !window.authService.isAuthenticated()) {
        console.warn('❌ Not authenticated, redirecting to login');
        window.location.href = '../pages/login.html';
        return;
    }

    currentUser = window.authService.getCurrentUser();
    console.log('👤 Current user:', currentUser.name);

    // Start clock
    if (typeof updateLiveClock === 'function') {
        updateLiveClock();
        setInterval(updateLiveClock, 1000);
    }

    // Set user initials in header
    setUserInitials();

    // Load profile data
    await loadProfileData();

    console.log('✅ Profile page initialized');
});

// ============================================
// SET USER INITIALS
// ============================================

function setUserInitials() {
    if (!currentUser || !currentUser.name) return;

    const initials = currentUser.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

    // Header avatar
    const userInitials = document.getElementById('userInitials');
    if (userInitials) {
        userInitials.textContent = initials;
    }

    // Dropdown avatar
    const userInitialsDropdown = document.getElementById('userInitialsDropdown');
    if (userInitialsDropdown) {
        userInitialsDropdown.textContent = initials;
    }

    // Profile page large avatar
    const profileInitials = document.getElementById('profileInitials');
    if (profileInitials) {
        profileInitials.textContent = initials;
    }

    // Dropdown user info
    const userDropdownName = document.getElementById('userDropdownName');
    const userDropdownEmail = document.getElementById('userDropdownEmail');
    if (userDropdownName) userDropdownName.textContent = currentUser.name;
    if (userDropdownEmail) userDropdownEmail.textContent = currentUser.email || currentUser.fedexId + '@fedex.com';
}

// ============================================
// LOAD PROFILE DATA
// ============================================

async function loadProfileData() {
    try {
        console.log('📥 Loading profile data...');

        const response = await window.authService.authorizedFetch(
            `/Horizon/api/users/profile/${currentUser.fedexId}`
        );

        if (!response.ok) {
            throw new Error('Failed to load profile');
        }

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to load profile');
        }

        profileData = data.profile;
        console.log('✅ Profile data loaded:', profileData);

        displayProfileData();

    } catch (error) {
        console.error('❌ Error loading profile:', error);
        showNotification('Failed to load profile data', 'error');
    }
}

// ============================================
// DISPLAY PROFILE DATA
// ============================================

function displayProfileData() {
    if (!profileData) return;

    console.log('🎨 Displaying profile data...');

    // Profile Header
    updateElement('profileName', profileData.name);
    updateElement('profileEmail', `<i class="fas fa-envelope"></i> ${profileData.email}`);
    updateElement('profileId', `<i class="fas fa-id-badge"></i> ${profileData.fedexId}`);
    
    // Role badge
    const roleEl = document.getElementById('profileRole');
    if (roleEl) {
        const roleClass = profileData.role === 'ADMIN' ? 'admin' : 'it-manager';
        const roleText = profileData.role.replace('_', ' ');
        roleEl.innerHTML = `<i class="fas fa-shield-alt"></i> ${roleText}`;
    }

    // Stats
    updateElement('memberSince', profileData.stats.memberSince);
    updateElement('memberDays', `${profileData.stats.daysSinceMember} days`);
    updateElement('lastLogin', profileData.stats.lastLogin);
    updateElement('lastLoginRaw', profileData.stats.lastLoginRaw || '--');
    updateElement('loginCount', profileData.stats.loginCount.toLocaleString());
    updateElement('totalTime', profileData.stats.totalTimeSpent);
    updateElement('coffeeCount', profileData.stats.coffeeCount);

    // Access & Permissions
    const roleDisplay = document.getElementById('roleDisplay');
    if (roleDisplay) {
        const roleClass = profileData.role === 'ADMIN' ? 'admin' : 'it-manager';
        const roleText = profileData.role.replace('_', ' ');
        roleDisplay.innerHTML = `<span class="role-badge ${roleClass}">${roleText}</span>`;
    }

    updateElement('countriesCount', profileData.countries.length);
    
    // Countries list
    displayCountriesList(profileData.countries);

    // Preferences
    updateElement('timezoneDisplay', `${profileData.timezone} (${profileData.timezoneCode})`);

    console.log('✅ Profile data displayed');
}

// ============================================
// DISPLAY COUNTRIES LIST
// ============================================

function displayCountriesList(countries) {
    const countriesList = document.getElementById('countriesList');
    if (!countriesList) return;

    if (!countries || countries.length === 0) {
        countriesList.innerHTML = '<div class="loading-text">No countries assigned</div>';
        return;
    }

    const tagsHTML = countries.map(code => {
        const name = getCountryName(code);
        const flag = getCountryFlag(code);
        return `
            <div class="country-tag">
                <span>${flag}</span>
                <span>${name}</span>
            </div>
        `;
    }).join('');

    countriesList.innerHTML = `<div class="country-tags">${tagsHTML}</div>`;

    // Parse emojis if twemoji available
    if (typeof twemoji !== 'undefined') {
        setTimeout(() => {
            twemoji.parse(countriesList);
        }, 100);
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element && value !== undefined) {
        element.innerHTML = value;
    }
}

function getCountryName(code) {
    if (typeof window.countryNames !== 'undefined' && window.countryNames[code]) {
        return window.countryNames[code];
    }
    return code;
}

function getCountryFlag(code) {
    if (typeof window.COUNTRY_CONFIG !== 'undefined' && window.COUNTRY_CONFIG[code]) {
        return window.COUNTRY_CONFIG[code].flag;
    }
    return '🏳️';
}

function showNotification(message, type = 'info') {
    if (typeof showToast === 'function') {
        showToast(message, type);
    } else {
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

// Export functions for global access
window.loadProfileData = loadProfileData;