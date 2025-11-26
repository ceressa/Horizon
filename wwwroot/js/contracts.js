/* ============================================
   CONTRACTS & FINANCIAL PAGE SCRIPT
   ============================================ */

// Global Variables
let contractsData = [];
let filteredData = [];
let currentFilter = 'all';

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

// Initialize Page
async function initializePage() {
    showLoading();
    await loadContractsData();
    setupEventListeners();
    renderPage();
    hideLoading();
    
    // Initialize Twemoji for flags
    if (typeof twemoji !== 'undefined') {
        twemoji.parse(document.body);
    }
}

// Load Contracts Data from API
async function loadContractsData() {
    console.log('📥 Loading contracts data...');
    
    try {
        const response = await fetch('/Horizon/api/data/contracts');
        
        console.log(`📡 Response status: ${response.status}`);
        console.log(`📡 Response ok: ${response.ok}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ JSON parsed successfully!');
        console.log('📊 Total countries in file:', data.countries?.length || 0);
        
        contractsData = data.countries || [];
        filteredData = [...contractsData];
        
        console.log(`✅ Loaded ${contractsData.length} countries with contracts`);
        
    } catch (error) {
        console.error('❌ Failed to load contracts:', error);
        showError('Failed to load contracts data. Please check if the API is running and contracts.json exists in Data folder.');
        
        if (window.horizonLogger) {
            window.horizonLogger.logError('CONTRACTS_LOAD_FAILED', 'Failed to load contracts', {
                error: error.message
            });
        }
        
        contractsData = [];
        filteredData = [];
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-button');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            applyFilter(filter);
            
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

// Apply Filter
function applyFilter(filter) {
    currentFilter = filter;
    
    if (filter === 'all') {
        filteredData = [...contractsData];
    } else if (filter === 'active') {
        filteredData = contractsData.filter(country => 
            country.providers && country.providers.length > 0
        );
    }
    
    renderPage();
}

// Render Page
function renderPage() {
    updateStats();
    renderCountries();
}

// Update Statistics
function updateStats() {
    let totalProviders = 0;
    let activeContracts = 0;
    let monthlyCost = 0;
    let annualCost = 0;

    filteredData.forEach(country => {
        if (country.providers) {
            country.providers.forEach(provider => {
                totalProviders++;
                activeContracts++;
                
                // Calculate costs
                if (provider.monthlyCost) {
                    monthlyCost += parseFloat(provider.monthlyCost);
                }
                if (provider.annualCost) {
                    annualCost += parseFloat(provider.annualCost);
                } else if (provider.monthlyCost) {
                    // If annual cost not provided, calculate from monthly
                    annualCost += parseFloat(provider.monthlyCost) * 12;
                }
            });
        }
    });

    // Update DOM
    document.getElementById('totalProviders').textContent = totalProviders;
    document.getElementById('activeContracts').textContent = activeContracts;
    document.getElementById('monthlyCost').textContent = formatCurrency(monthlyCost);
    document.getElementById('annualCost').textContent = formatCurrency(annualCost);
}

// Render Countries
function renderCountries() {
    const container = document.getElementById('countriesGrid');
    
    if (filteredData.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-inbox"></i>
                <h3>No Contracts Found</h3>
                <p>There are no contracts matching your current filter.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredData.map(country => createCountryCard(country)).join('');
    
    // Parse Twemoji after rendering
    if (typeof twemoji !== 'undefined') {
        twemoji.parse(container);
    }
}

// Create Country Card
function createCountryCard(country) {
    const totalCost = calculateCountryTotal(country);
    const providers = country.providers || [];
    
    return `
        <div class="country-card" data-country="${country.code}">
            <div class="country-header">
                <div class="country-flag">${country.flag || getCountryFlag(country.code)}</div>
                <div class="country-info">
                    <div class="country-name">${country.name}</div>
                    <div class="country-code">${country.code}</div>
                </div>
                <div class="country-total">
                    <div class="country-total-label">Monthly Total</div>
                    <div class="country-total-value">${formatCurrency(totalCost)}</div>
                </div>
            </div>
            
            <div class="providers-list">
                ${providers.length > 0 ? providers.map(provider => createProviderItem(provider)).join('') : 
                    '<div style="text-align: center; padding: 1rem; color: var(--text-secondary); opacity: 0.6;">No providers configured</div>'
                }
            </div>
        </div>
    `;
}

// Create Provider Item
function createProviderItem(provider) {
    return `
        <div class="provider-item">
            <div class="provider-header">
                <div class="provider-name">
                    <i class="fas ${getProviderIcon(provider.type)}"></i>
                    ${provider.name}
                </div>
                <span class="provider-type ${provider.type.toLowerCase()}">${provider.type}</span>
            </div>
            
            <div class="provider-details">
                <div class="provider-detail">
                    <span class="detail-label">Service</span>
                    <span class="detail-value">${provider.service || 'N/A'}</span>
                </div>
                <div class="provider-detail">
                    <span class="detail-label">Bandwidth</span>
                    <span class="detail-value">${provider.bandwidth || 'N/A'}</span>
                </div>
                <div class="provider-detail">
                    <span class="detail-label">Monthly Cost</span>
                    <span class="detail-value">${formatCurrency(provider.monthlyCost || 0)}</span>
                </div>
                <div class="provider-detail">
                    <span class="detail-label">Annual Cost</span>
                    <span class="detail-value">${formatCurrency(provider.annualCost || (provider.monthlyCost * 12) || 0)}</span>
                </div>
            </div>
        </div>
    `;
}

// Calculate Country Total
function calculateCountryTotal(country) {
    if (!country.providers) return 0;
    
    return country.providers.reduce((total, provider) => {
        return total + (parseFloat(provider.monthlyCost) || 0);
    }, 0);
}

// Get Provider Icon
function getProviderIcon(type) {
    const icons = {
        'ISP': 'fa-wifi',
        'Telecom': 'fa-phone',
        'Mobile': 'fa-mobile-alt',
        'Data': 'fa-database',
        'PSTN': 'fa-phone-volume',
        'ADSL': 'fa-ethernet',
        'Fiber': 'fa-network-wired'
    };
    
    return icons[type] || 'fa-building';
}

// Get Country Flag Emoji
function getCountryFlag(countryCode) {
    // Convert country code to flag emoji
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    
    return String.fromCodePoint(...codePoints);
}

// Format Currency
function formatCurrency(amount) {
    if (!amount || amount === 0) return '$0';
    
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Toggle Theme
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update icon
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        icon.className = newTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// Show Loading
function showLoading() {
    const container = document.getElementById('countriesGrid');
    if (container) {
        container.innerHTML = `
            <div class="loading-spinner" style="grid-column: 1/-1;">
                <div class="spinner"></div>
            </div>
        `;
    }
}

// Hide Loading
function hideLoading() {
    // Loading will be replaced by actual content
}

// Show Error
function showError(message) {
    const container = document.getElementById('countriesGrid');
    if (container) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Data</h3>
                <p>${message}</p>
            </div>
        `;
    }
}

// Export for global use
window.ContractsManager = {
    loadContractsData,
    applyFilter,
    renderPage
};