// ========== TEAM MANAGEMENT WITH JWT ACCESS CONTROL ========== //

// Twemoji Configuration
function initializeTwemoji() {
    if (typeof twemoji !== 'undefined') {
        twemoji.parse(document.body, {
            folder: 'svg',
            ext: '.svg',
            base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/'
        });
        console.log('✅ Twemoji initialized');
    } else {
        console.warn('⚠️ Twemoji not loaded');
    }
}

// Country Information with Flags
const countryInfo = {
    'TR': { 
        name: 'Türkiye', 
        flag: '🇹🇷', 
        flagHtml: '<img class="emoji" draggable="false" alt="🇹🇷" src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1f9-1f1f7.svg" style="height: 1em; width: 1em; margin: 0 .05em 0 .1em; vertical-align: -0.1em;">', 
        code: 'TR' 
    },
    'GR': { 
        name: 'Greece', 
        flag: '🇬🇷', 
        flagHtml: '<img class="emoji" draggable="false" alt="🇬🇷" src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1ec-1f1f7.svg" style="height: 1em; width: 1em; margin: 0 .05em 0 .1em; vertical-align: -0.1em;">', 
        code: 'GR' 
    },
    'CY': { 
        name: 'Cyprus', 
        flag: '🇨🇾', 
        flagHtml: '<img class="emoji" draggable="false" alt="🇨🇾" src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1e8-1f1fe.svg" style="height: 1em; width: 1em; margin: 0 .05em 0 .1em; vertical-align: -0.1em;">', 
        code: 'CY' 
    },
    'SI': { 
        name: 'Slovenia', 
        flag: '🇸🇮', 
        flagHtml: '<img class="emoji" draggable="false" alt="🇸🇮" src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1f8-1f1ee.svg" style="height: 1em; width: 1em; margin: 0 .05em 0 .1em; vertical-align: -0.1em;">', 
        code: 'SI' 
    },
    'BG': { 
        name: 'Bulgaria', 
        flag: '🇧🇬', 
        flagHtml: '<img class="emoji" draggable="false" alt="🇧🇬" src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1e7-1f1ec.svg" style="height: 1em; width: 1em; margin: 0 .05em 0 .1em; vertical-align: -0.1em;">', 
        code: 'BG' 
    },
    'AT': { 
        name: 'Austria', 
        flag: '🇦🇹', 
        flagHtml: '<img class="emoji" draggable="false" alt="🇦🇹" src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1e6-1f1f9.svg" style="height: 1em; width: 1em; margin: 0 .05em 0 .1em; vertical-align: -0.1em;">', 
        code: 'AT' 
    },
    'CZ': { 
        name: 'Czechia', 
        flag: '🇨🇿', 
        flagHtml: '<img class="emoji" draggable="false" alt="🇨🇿" src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1e8-1f1ff.svg" style="height: 1em; width: 1em; margin: 0 .05em 0 .1em; vertical-align: -0.1em;">', 
        code: 'CZ' 
    },
    'HU': { 
        name: 'Hungary', 
        flag: '🇭🇺', 
        flagHtml: '<img class="emoji" draggable="false" alt="🇭🇺" src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1ed-1f1fa.svg" style="height: 1em; width: 1em; margin: 0 .05em 0 .1em; vertical-align: -0.1em;">', 
        code: 'HU' 
    },
    'PT': { 
        name: 'Portugal', 
        flag: '🇵🇹', 
        flagHtml: '<img class="emoji" draggable="false" alt="🇵🇹" src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1f5-1f1f9.svg" style="height: 1em; width: 1em; margin: 0 .05em 0 .1em; vertical-align: -0.1em;">', 
        code: 'PT' 
    },
    'SK': { 
        name: 'Slovakia', 
        flag: '🇸🇰', 
        flagHtml: '<img class="emoji" draggable="false" alt="🇸🇰" src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1f8-1f1f0.svg" style="height: 1em; width: 1em; margin: 0 .05em 0 .1em; vertical-align: -0.1em;">', 
        code: 'SK' 
    },
    'ES': { 
        name: 'Spain', 
        flag: '🇪🇸', 
        flagHtml: '<img class="emoji" draggable="false" alt="🇪🇸" src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1ea-1f1f8.svg" style="height: 1em; width: 1em; margin: 0 .05em 0 .1em; vertical-align: -0.1em;">', 
        code: 'ES' 
    },
    'CH': { 
        name: 'Switzerland', 
        flag: '🇨🇭', 
        flagHtml: '<img class="emoji" draggable="false" alt="🇨🇭" src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1e8-1f1ed.svg" style="height: 1em; width: 1em; margin: 0 .05em 0 .1em; vertical-align: -0.1em;">', 
        code: 'CH' 
    },
    'RO': { 
        name: 'Romania', 
        flag: '🇷🇴', 
        flagHtml: '<img class="emoji" draggable="false" alt="🇷🇴" src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1f7-1f1f4.svg" style="height: 1em; width: 1em; margin: 0 .05em 0 .1em; vertical-align: -0.1em;">', 
        code: 'RO' 
    },
    'GSP': { 
        name: 'GSP Hub', 
        flag: '🌐', 
        flagHtml: '<img class="emoji" draggable="false" alt="🌐" src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f310.svg" style="height: 1em; width: 1em; margin: 0 .05em 0 .1em; vertical-align: -0.1em;">', 
        code: 'GSP' 
    }
};

// Global Variables
let teamMembers = [];
let authorizedCountries = [];
let currentUser = null;
let currentCountry = '';
let currentFilters = {
    search: '',
    role: ''
};

// Initialize Team Page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Team Management loading...');
    checkAccessAndLoadTeam();
});

// Check Access and Load Team Data
async function checkAccessAndLoadTeam() {
    try {
        // ✅ Get current user from JWT token (AuthService already handles auth check)
        currentUser = window.authService.getCurrentUser();
        
        if (!currentUser) {
            console.error('❌ No user found in token');
            showAccessDenied();
            return;
        }
        
        // ✅ Get authorized countries from JWT token
        authorizedCountries = currentUser.countries || [];
        
        if (!authorizedCountries || authorizedCountries.length === 0) {
            showAccessDenied();
            console.warn('⚠️ User has no authorized countries');
            return;
        }
        
        console.log('✅ User authorized for countries:', authorizedCountries);
        console.log('👤 User:', currentUser.name, '| Role:', currentUser.role);
        
        // Load team data
        await loadTeamData();
        
        // Show main content
        showMainContent();
        
    } catch (error) {
        console.error('❌ Error checking access:', error);
        showAccessDenied();
    }
}

// Show Access Denied Message
function showAccessDenied() {
    const accessDenied = document.getElementById('accessDenied');
    const mainContent = document.getElementById('mainContent');
    
    if (accessDenied) {
        accessDenied.style.display = 'flex';
    }
    if (mainContent) {
        mainContent.style.display = 'none';
    }
    
    console.log('🚫 Access denied - showing restricted message');
}

// Show Main Content
function showMainContent() {
    const accessDenied = document.getElementById('accessDenied');
    const mainContent = document.getElementById('mainContent');
    
    if (accessDenied) {
        accessDenied.style.display = 'none';
    }
    if (mainContent) {
        mainContent.style.display = 'block';
        mainContent.style.animation = 'fadeInUp 0.6s ease-out';
    }
    
    console.log('✅ Main content displayed');
}

// Load Team Data from JSON (Filtered by User's Countries)
async function loadTeamData() {
    try {
        const response = await fetch('/Horizon/api/data/team-members.json');
        const data = await response.json();
        
        // Filter members by user's authorized countries
        teamMembers = data.teamMembers.filter(member => 
            authorizedCountries.includes(member.country)
        );
        
        if (teamMembers.length === 0) {
            console.warn('⚠️ No team members found for authorized countries:', authorizedCountries);
            showAccessDenied();
            return;
        }
        
        // ✅ Set default country to the one with MOST members
        const memberCounts = {};
        teamMembers.forEach(m => {
            memberCounts[m.country] = (memberCounts[m.country] || 0) + 1;
        });
        
        currentCountry = authorizedCountries.reduce((max, country) => 
            (memberCounts[country] || 0) > (memberCounts[max] || 0) ? country : max
        , authorizedCountries[0]);
        
        console.log(`✅ Default country: ${countryInfo[currentCountry].name} (${memberCounts[currentCountry]} members)`);
        
        populateTeamOverview();
        renderCountryTabs();
        setupTeamEventListeners();
        
        console.log('✅ Team data loaded:', teamMembers.length, 'members');
        console.log('📊 Distribution:', getCountryDistribution());
        
    } catch (error) {
        console.error('❌ Error loading team data:', error);
        showAccessDenied();
    }
}

// Get Country Distribution (for debugging)
function getCountryDistribution() {
    const distribution = {};
    teamMembers.forEach(member => {
        distribution[member.country] = (distribution[member.country] || 0) + 1;
    });
    return distribution;
}

// Populate Team Overview Stats
function populateTeamOverview() {
    const totalMembers = teamMembers.length;
    const countries = authorizedCountries.length;
    const seniorCount = teamMembers.filter(m => m.role === 'Senior').length;
    const techCount = teamMembers.filter(m => 
        m.jobTitle.includes('Technology') || m.jobTitle.includes('Specialist')
    ).length;
    
    // Animate numbers with smooth transitions
    animateCounter('totalMembers', totalMembers);
    animateCounter('countryCount', countries);
    animateCounter('seniorCount', seniorCount);
    animateCounter('techCount', techCount);
    
    console.log('📈 Overview stats updated:', {totalMembers, countries, seniorCount, techCount});
}

// Animate Counter Numbers
function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let current = 0;
    const increment = targetValue / 25;
    const duration = 1200;
    const stepTime = duration / 25;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= targetValue) {
            element.textContent = targetValue;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, stepTime);
}

// Render Country Tabs (Only Authorized Countries)
function renderCountryTabs() {
    const teamContent = document.getElementById('teamContent');
    if (!teamContent) return;
    
    // Group members by country
    const membersByCountry = teamMembers.reduce((groups, member) => {
        const country = member.country;
        if (!groups[country]) {
            groups[country] = [];
        }
        groups[country].push(member);
        return groups;
    }, {});
    
    // Sort authorized countries by member count (descending)
    const sortedCountries = authorizedCountries
        .filter(code => membersByCountry[code]) // Only show countries with members
        .sort((a, b) => 
            membersByCountry[b].length - membersByCountry[a].length
        );
    
    let tabsHtml = `
        <div class="country-tabs-container">
            <div class="country-tabs">
    `;
    
    // Create country tabs (only authorized)
    sortedCountries.forEach(countryCode => {
        const members = membersByCountry[countryCode];
        const country = countryInfo[countryCode];
        
        if (!country) {
            console.warn('⚠️ Country info not found for:', countryCode);
            return;
        }
        
        const isActive = countryCode === currentCountry;
        
        tabsHtml += `
            <div class="country-tab ${isActive ? 'active' : ''}" 
                 onclick="switchCountryTab('${countryCode}')" 
                 data-country="${countryCode}">
                <div class="tab-flag">${country.flagHtml}</div>
                <div class="tab-info">
                    <h3>${country.name}</h3>
                    <p>Technology Team</p>
                </div>
                <div class="tab-count">${members.length}</div>
            </div>
        `;
    });
    
    tabsHtml += `
            </div>
        </div>
        <div class="team-content">
    `;
    
    // Create tab panels
    sortedCountries.forEach(countryCode => {
        const members = membersByCountry[countryCode];
        const isActive = countryCode === currentCountry;
        
        tabsHtml += `
            <div class="team-tab-panel ${isActive ? 'active' : ''}" 
                 id="panel-${countryCode}"
                 data-member-count="${members.length}">
                <div class="team-grid" id="grid-${countryCode}">
                    ${members.map(member => createMemberCard(member)).join('')}
                </div>
            </div>
        `;
    });
    
    tabsHtml += '</div>';
    teamContent.innerHTML = tabsHtml;
    
    // Re-initialize twemoji after DOM update
    setTimeout(initializeTwemoji, 100);
}

async function loadUserData(fedexId) {
    try {
        const response = await fetch('../api/data/users.json');
        const data = await response.json();
        
        // Find user by fedexId
        const user = data.users.find(u => u.fedexId === fedexId);
        
        if (!user) {
            console.error('❌ User not found in users.json:', fedexId);
            return null;
        }
        
        console.log('✅ User data loaded from users.json:', user);
        return user;
        
    } catch (error) {
        console.error('❌ Error loading users.json:', error);
        return null;
    }
}

// Switch Country Tab
function switchCountryTab(countryCode) {
    // Update current country
    currentCountry = countryCode;
    
    // Update tab active states with smooth transition
    document.querySelectorAll('.country-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    const activeTab = document.querySelector(`[data-country="${countryCode}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Update panel active states
    document.querySelectorAll('.team-tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    const activePanel = document.getElementById(`panel-${countryCode}`);
    if (activePanel) {
        activePanel.classList.add('active');
    }
    
    // Apply current filters to the active country
    applyFiltersToCurrentCountry();
    
    console.log(`✅ Switched to ${countryInfo[countryCode].name} tab`);
}

// Create Member Card HTML
function createMemberCard(member) {
    const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase();
    const country = countryInfo[member.country];
    
    // Check if photoUrl exists and is not placeholder
    const hasPhoto = member.photoUrl && !member.photoUrl.includes('placeholder');
    
    return `
        <div class="member-card glass-morphism premium-hover interactive-card" 
             data-role="${member.role}" 
             onclick="showMemberDetails(${member.id})">
            
            <div class="member-header">
                <div class="member-avatar">
                    ${hasPhoto 
                        ? `<img src="${member.photoUrl}" alt="${member.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                           <div class="avatar-fallback" style="display:none;">${initials}</div>` 
                        : `<div class="avatar-fallback">${initials}</div>`
                    }
                </div>
                <div class="member-info">
                    <h3>${member.name}</h3>
                    <p>${country.flagHtml} <span>${member.location}</span></p>
                </div>
            </div>
            
            <div class="member-details">
                <div class="detail-row">
                    <div class="detail-icon">
                        <i class="fas fa-briefcase"></i>
                    </div>
                    <div class="detail-text">${member.jobTitle}</div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-icon">
                        <i class="fas fa-envelope"></i>
                    </div>
                    <div class="detail-text">${member.email}</div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-icon">
                        <i class="fas fa-phone"></i>
                    </div>
                    <div class="detail-text">${member.phone || 'N/A'}</div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-icon">
                        <i class="fas fa-id-badge"></i>
                    </div>
                    <div class="detail-text">ID: ${member.id}</div>
                    <div class="detail-badge">${member.role}</div>
                </div>
            </div>
            
            <div class="member-actions">
                <button class="action-btn" onclick="event.stopPropagation(); sendEmail('${member.email}')">
                    <i class="fas fa-envelope"></i> Email
                </button>
                <button class="action-btn" onclick="event.stopPropagation(); callMember('${member.phone}')">
                    <i class="fas fa-phone"></i> Call
                </button>
            </div>
        </div>
    `;
}

// Setup Event Listeners
function setupTeamEventListeners() {
    // Search input
    const searchInput = document.getElementById('teamSearch');
    if (searchInput) {
        searchInput.addEventListener('input', handleTeamSearch);
    }
    
    // Role filter
    const roleFilter = document.getElementById('roleFilter');
    if (roleFilter) {
        roleFilter.addEventListener('change', handleRoleFilter);
    }
    
    // Close modal on overlay click
    const modalOverlay = document.getElementById('memberModal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                closeMemberModal();
            }
        });
    }
    
    // ESC key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeMemberModal();
        }
    });
    
    console.log('✅ Team event listeners setup complete');
}

// Handle Search
// Handle Search - Smart Search (searches across all countries)
function handleTeamSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    currentFilters.search = searchTerm;
    
    if (!searchTerm) {
        // Empty search - show current country
        applyFiltersToCurrentCountry();
        return;
    }
    
    // ✅ Search across ALL authorized countries
    const foundMember = teamMembers.find(member => {
        const searchableText = `${member.name} ${member.email} ${member.jobTitle} ${member.location} ${member.id}`.toLowerCase();
        return searchableText.includes(searchTerm);
    });
    
    if (foundMember && foundMember.country !== currentCountry) {
        // ✅ Found in different country - switch to that country
        console.log(`🔍 Member found in ${countryInfo[foundMember.country].name}, switching...`);
        switchCountryTab(foundMember.country);
        
        // ✅ Highlight the found member
        setTimeout(() => {
            const memberCard = document.querySelector(`[onclick="showMemberDetails(${foundMember.id})"]`);
            if (memberCard) {
                memberCard.style.animation = 'pulse 0.6s ease';
                memberCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 300);
    } else {
        // ✅ Found in current country or not found - just filter
        applyFiltersToCurrentCountry();
    }
}

// Handle Role Filter
function handleRoleFilter(event) {
    currentFilters.role = event.target.value;
    applyFiltersToCurrentCountry();
}

// Apply Filters to Current Country Only
function applyFiltersToCurrentCountry() {
    const currentCountryMembers = teamMembers.filter(member => member.country === currentCountry);
    
    let filtered = currentCountryMembers.filter(member => {
        // Search filter
        if (currentFilters.search) {
            const searchTerm = currentFilters.search;
            const searchableText = `${member.name} ${member.email} ${member.jobTitle} ${member.location} ${member.id}`.toLowerCase();
            if (!searchableText.includes(searchTerm)) return false;
        }
        
        // Role filter
        if (currentFilters.role && member.role !== currentFilters.role) return false;
        
        return true;
    });
    
    const grid = document.getElementById(`grid-${currentCountry}`);
    if (grid) {
        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <h3>No team members found</h3>
                    <p>Try adjusting your search or filter criteria</p>
                </div>
            `;
        } else {
            grid.innerHTML = filtered.map(member => createMemberCard(member)).join('');
            setTimeout(initializeTwemoji, 100);
        }
    }
    
    console.log(`Filtered: ${filtered.length}/${currentCountryMembers.length} members in ${countryInfo[currentCountry].name}`);
}

// Clear All Filters
function clearTeamFilters() {
    currentFilters = { search: '', role: '' };
    
    const searchInput = document.getElementById('teamSearch');
    const roleFilter = document.getElementById('roleFilter');
    
    if (searchInput) searchInput.value = '';
    if (roleFilter) roleFilter.value = '';
    
    applyFiltersToCurrentCountry();
    
    console.log('✅ Filters cleared');
}

// Show Member Details Modal
function showMemberDetails(memberId) {
    const member = teamMembers.find(m => m.id === memberId);
    if (!member) return;
    
    const modal = document.getElementById('memberModal');
    const title = document.getElementById('memberDetailTitle');
    const content = document.getElementById('memberDetailContent');
    
    if (!modal || !title || !content) return;
    
    const country = countryInfo[member.country];
    const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase();
    const hasPhoto = member.photoUrl && !member.photoUrl.includes('placeholder');
    
    title.textContent = member.name;
    
    content.innerHTML = `
        <div class="modal-profile-layout">
            <div class="profile-left">
                <h2 class="member-name">${member.name}</h2>
                <p class="member-title">${member.jobTitle}</p>
                <p class="member-location">${country.flagHtml} ${country.name}, ${member.location}</p>
                <span class="member-role-badge">${member.role}</span>
                
                <div class="details-section">
                    <div class="detail-group">
                        <h4>Employee Information</h4>
                        <div class="info-list">
                            <div class="info-item">
                                <span class="info-label">Employee ID</span>
                                <span class="info-value">${member.id}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Department</span>
                                <span class="info-value">${member.department}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Role Level</span>
                                <span class="info-value">${member.role}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-group">
                        <h4>Contact Information</h4>
                        <div class="contact-actions">
                            <button class="contact-btn" onclick="sendEmail('${member.email}')">
                                <i class="fas fa-envelope"></i>
                                <div class="btn-content">
                                    <span class="btn-label">Email</span>
                                    <span class="btn-value">${member.email}</span>
                                </div>
                            </button>
                            ${member.phone ? `
                            <button class="contact-btn" onclick="callMember('${member.phone}')">
                                <i class="fas fa-phone"></i>
                                <div class="btn-content">
                                    <span class="btn-label">Phone</span>
                                    <span class="btn-value">${member.phone}</span>
                                </div>
                            </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="profile-right">
                <div class="large-avatar">
                    ${hasPhoto 
                        ? `<img src="${member.photoUrl}" alt="${member.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                           <div class="large-avatar-fallback" style="display:none;">${initials}</div>` 
                        : `<div class="large-avatar-fallback">${initials}</div>`
                    }
                </div>
            </div>
        </div>
    `;
    
    // Show modal with smooth animation
    modal.classList.add('modal-active');
    setTimeout(initializeTwemoji, 100);
    
    console.log('✅ Modal opened for:', member.name);
}

// Close Member Detail Modal
function closeMemberModal() {
    const modal = document.getElementById('memberModal');
    if (modal) {
        modal.classList.remove('modal-active');
        console.log('✅ Modal closed');
    }
}

// Send Email to Member
function sendEmail(email) {
    window.location.href = `mailto:${email}`;
    console.log('📧 Opening email client for:', email);
}

// Call Member
function callMember(phone) {
    if (phone && phone !== 'N/A') {
        window.location.href = `tel:${phone}`;
        console.log('📞 Calling:', phone);
    } else {
        alert('Phone number not available');
    }
}

// Export Team Data (Current Country Only)
function exportTeamData() {
    const currentCountryMembers = teamMembers.filter(member => member.country === currentCountry);
    
    const dataStr = JSON.stringify(currentCountryMembers, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `team-${countryInfo[currentCountry].name.toLowerCase()}-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    console.log(`✅ ${countryInfo[currentCountry].name} team data exported`);
}

// Console Welcome Message
console.log(`
%c
╔═══════════════════════════════════════════╗
║   🚀 HORIZON Team Management System      ║
║   🔒 Access Control Enabled              ║
║   ✨ Premium UI with Smooth Animations   ║
╚═══════════════════════════════════════════╝
`, 'color: #84cc16; font-weight: bold; font-size: 12px;');