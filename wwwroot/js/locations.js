// ========== LOCATIONS.JS - LOCATIONS PAGE ========== //
// Version: 1.0.0
// Author: IT Infrastructure System

'use strict';
const COUNTRY_CONFIG = window.COUNTRY_CONFIG;
const countryNames   = window.countryNames;
const COUNTRY_ORDER  = window.COUNTRY_ORDER;
// Global variables
let locationsData = [];
let filteredData = [];
let currentSortField = 'name';
let currentSortDirection = 'asc';


// Location type configuration
const LOCATION_TYPE_CONFIG = {
    'Station': { icon: 'fas fa-building', color: '#2196F3' },
    'HQ Office': { icon: 'fas fa-landmark', color: '#FF9800' },
    'Air Gateway': { icon: 'fas fa-plane', color: '#4CAF50' },
    'Ramp': { icon: 'fas fa-truck-loading', color: '#9C27B0' },
    'Call Center': { icon: 'fas fa-headset', color: '#F44336' },
    'Clearance Center': { icon: 'fas fa-clipboard-check', color: '#00BCD4' },
    'Customer Dock': { icon: 'fas fa-dolly', color: '#795548' }
};




// DOM element references
let elements = {};

// ========== INITIALIZATION ========== //
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Locations page...');
    initializeLocationsPage();
});

async function initializeLocationsPage() {
    try {
        // Show loading state
        showLoadingState();
        
        // Load data FIRST
        await loadLocationsData();
        
        // Cache DOM elements AFTER data loads
        cacheElements();
        
        // Setup event listeners
        setupEventListeners();
        
        // Initial render
        renderPage();
        
        // Hide loading state
        hideLoadingState();
        
        // Update last updated timestamp
        updateLastUpdated();
        
        console.log('✅ Locations page initialized successfully');
        showNotification('Location data loaded successfully', 'success');
        
    } catch (error) {
        console.error('❌ Error initializing locations page:', error);
        hideLoadingState();
        showNotification('Failed to load location data', 'error');
        showErrorState();
    }
}

function cacheElements() {
    elements = {
        loadingState: document.getElementById('loadingState'),
        stationSummary: document.getElementById('stationSummary'),
        locationFilters: document.getElementById('locationFilters'),
        locationsTableBody: document.getElementById('locationsTableBody'),
        tableInfo: document.getElementById('tableInfo'),
        totalCountries: document.getElementById('totalCountries'),
        totalCities: document.getElementById('totalCities'),
        totalTypes: document.getElementById('totalTypes'),
        lastUpdated: document.getElementById('lastUpdated'),
        modalContainer: document.getElementById('modalContainer'),
        notificationContainer: document.getElementById('notificationContainer')
    };
}

function showLoadingState() {
    if (elements.loadingState) {
        elements.loadingState.classList.remove('hidden');
        elements.loadingState.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Loading location data...</p>
        `;
    }
}

function hideLoadingState() {
    if (elements.loadingState) {
        elements.loadingState.classList.add('hidden');
    }
}

function showErrorState() {
    if (elements.stationSummary) {
        elements.stationSummary.innerHTML = `
            <div class="error-state" style="text-align: center; padding: 2rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>
                <h3 style="color: #ef4444; margin-bottom: 0.5rem;">Unable to Load Location Data</h3>
                <p style="color: rgba(255,255,255,0.7); margin-bottom: 1rem;">Please check your connection and try refreshing the page.</p>
                <button class="btn btn-primary" onclick="initializeLocationsPage()">
                    <i class="fas fa-refresh"></i> Retry
                </button>
            </div>
        `;
    }
}

// ========== DATA LOADING ========== //
async function loadLocationsData() {
    console.log('📊 Loading locations data...');
    
    try {
        // Try to load from API first
        const response = await fetch('/Horizon/api/data/inventory');
        
        if (response.ok) {
            const data = await response.json();
            processLocationData(data);
            console.log('✅ Location data loaded from API');
        } else {
            throw new Error(`API request failed: ${response.status}`);
        }
        
    } catch (error) {
        console.warn('⚠️ API failed, loading sample data:', error);
    }
}

function processLocationData(data) {
    locationsData = [];
    
    // Get user's authorized countries
    const authorizedCountries = window.currentUser?.countries || [];
    
    if (data && data.countries) {
        // ONLY iterate authorized countries
        authorizedCountries.forEach(countryCode => {
            const countryData = data.countries[countryCode];
            if (!countryData) return; // Skip if country not in data
            
            const locations = countryData.locationCoordinates || [];
            
            locations.forEach(location => {
                locationsData.push({
                    ...location,
                    country: countryCode,
                    countryName: getCountryName(countryCode),
                    flag: getCountryFlag(countryCode),
                    typeIcon: getLocationTypeIcon(location.type),
                    typeColor: getLocationTypeColor(location.type)
                });
            });
        });
    }
    
    // Sort by country order and then by name
    sortLocationsByDefault();
    
    // Initialize filtered data
    filteredData = [...locationsData];
    
    console.log(`📍 Processed ${locationsData.length} locations across ${getUniqueCountries().length} countries`);
}




function sortLocationsByDefault() {
    locationsData.sort((a, b) => {
        // First sort by country order
        const countryOrderA = COUNTRY_ORDER.indexOf(a.country);
        const countryOrderB = COUNTRY_ORDER.indexOf(b.country);
        
        if (countryOrderA !== countryOrderB) {
            return countryOrderA - countryOrderB;
        }
        
        // Then sort by name
        return a.name.localeCompare(b.name);
    });
}



function getLocationTypeIcon(type) {
    return LOCATION_TYPE_CONFIG[type]?.icon || 'fas fa-map-marker-alt';
}

function getLocationTypeColor(type) {
    return LOCATION_TYPE_CONFIG[type]?.color || '#6B7280';
}

function getUniqueCountries() {
    return [...new Set(locationsData.map(loc => loc.country))];
}

function getUniqueCities() {
    return [...new Set(locationsData.map(loc => loc.city))].sort();
}

function getUniqueTypes() {
    return [...new Set(locationsData.map(loc => loc.type))];
}

// ========== RENDERING FUNCTIONS ========== //
function renderPage() {
    renderStationSummary();
    renderLocationFilters();
    renderLocationsTable();
    renderQuickStats();
    updateTableInfo();
}

function renderStationSummary() {
    if (!elements.stationSummary) return;
    
    const typeStats = {};
    locationsData.forEach(location => {
        typeStats[location.type] = (typeStats[location.type] || 0) + 1;
    });
    
    const typeItems = Object.entries(typeStats).map(([type, count]) => `
        <div class="summary-item">
            <div class="summary-count">${count}</div>
            <div class="summary-label">${type}</div>
        </div>
    `).join('');
    
    elements.stationSummary.innerHTML = `
        <div class="station-summary">
            <h4><i class="fas fa-chart-bar"></i> Station Summary</h4>
            <div class="summary-grid">
                <div class="summary-item total">
                    <div class="summary-count">${locationsData.length}</div>
                    <div class="summary-label">Total Stations</div>
                </div>
                ${typeItems}
            </div>
        </div>
    `;
}

function renderLocationFilters() {
    if (!elements.locationFilters) return;
    
    const countries = getUniqueCountries();
    const cities = getUniqueCities();
    const types = getUniqueTypes();
    
    elements.locationFilters.innerHTML = `
        <div class="location-filters">
            <div class="filters-grid">
                <div class="form-group">
                    <label>Station Name Search</label>
                    <div class="search-input-wrapper">
                        <i class="fas fa-search"></i>
                        <input type="text" 
                               id="searchInput" 
                               class="form-control" 
                               placeholder="Search stations or codes..."
                               oninput="handleSearch()">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Country</label>
                    <select id="countryFilter" class="form-control" onchange="handleFilters()">
                        <option value="">All Countries</option>
                        ${countries.map(country => 
                            `<option value="${country}">${getCountryFlag(country)} ${getCountryName(country)}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Type</label>
                    <select id="typeFilter" class="form-control" onchange="handleFilters()">
                        <option value="">All Types</option>
                        ${types.map(type => 
                            `<option value="${type}">${type}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label>City</label>
                    <select id="cityFilter" class="form-control" onchange="handleFilters()">
                        <option value="">All Cities</option>
                        ${cities.map(city => 
                            `<option value="${city}">${city}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div>
                    <button class="btn btn-secondary" onclick="clearFilters()">
                        <i class="fas fa-times"></i> Clear
                    </button>
                </div>
            </div>
            
            <div id="filterResults" class="filter-results">
                Showing ${filteredData.length} of ${locationsData.length} locations
            </div>
        </div>
    `;
}

function renderLocationsTable() {
    if (!elements.locationsTableBody) return;
    
    if (filteredData.length === 0) {
        elements.locationsTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center" style="padding: 3rem; color: var(--text-muted);">
                    <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                    No locations found matching the current filters
                </td>
            </tr>
        `;
        return;
    }
    
    let rows = '';
    
    filteredData.forEach((location, index) => {
        rows += `
            <tr onclick="showLocationDetails('${location.code}')" style="cursor: pointer;">
                <td>
                    <div class="station-info">
                        <div class="station-name">${location.name}</div>
                        <div class="station-code">${location.code}</div>
                    </div>
                </td>
                <td>
                    <div class="country-cell">
                        <span class="country-flag">${location.flag}</span>
                        <span>${location.countryName}</span>
                    </div>
                </td>
                <td>${location.city}</td>
                <td>
                    <div class="location-type">
                        <i class="${location.typeIcon}"></i>
                        <span>${location.type}</span>
                    </div>
                </td>
                <td>
                    <div style="display: flex; gap: 0.5rem; justify-content: center;">
                        ${location.lat && location.lng ? `
                            <button class="action-btn" 
                                    onclick="event.stopPropagation(); openLocationOnMap('${location.lat}', '${location.lng}', '${location.name}')" 
                                    title="View on Google Maps">
                                <i class="fas fa-map-marker-alt"></i>
                            </button>
                        ` : ''}
                        <button class="action-btn" 
                                onclick="event.stopPropagation(); showLocationDetails('${location.code}')" 
                                title="View Details"
                                style="background: rgba(76, 175, 80, 0.15); color: #4CAF50; border: 1px solid rgba(76, 175, 80, 0.3);">
                            <i class="fas fa-info-circle"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    elements.locationsTableBody.innerHTML = rows;
    
    // Parse twemoji for flags
    setTimeout(() => {
        if (typeof twemoji !== 'undefined') {
            twemoji.parse(elements.locationsTableBody, {
                folder: 'svg',
                ext: '.svg',
                attributes: () => ({ width: '18px', height: '18px' })
            });
        }
    }, 100);
}

function renderQuickStats() {
    if (elements.totalCountries) {
        elements.totalCountries.textContent = getUniqueCountries().length;
    }
    if (elements.totalCities) {
        elements.totalCities.textContent = getUniqueCities().length;
    }
    if (elements.totalTypes) {
        elements.totalTypes.textContent = getUniqueTypes().length;
    }
}

function updateTableInfo() {
    if (elements.tableInfo) {
        elements.tableInfo.textContent = `Showing ${filteredData.length} of ${locationsData.length} locations`;
    }
    
    // Update filter results
    const filterResults = document.getElementById('filterResults');
    if (filterResults) {
        filterResults.textContent = `Showing ${filteredData.length} of ${locationsData.length} locations`;
    }
}

// ========== EVENT HANDLERS ========== //
function setupEventListeners() {
    // Global error handler
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        showNotification('An unexpected error occurred', 'error');
    });
    
    // Prevent default form submissions
    document.addEventListener('submit', (e) => {
        e.preventDefault();
    });
    
    // Handle escape key for modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
    
    console.log('📡 Event listeners setup complete');
}

function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    debounce(() => {
        applyFilters();
    }, 300)();
}

function handleFilters() {
    applyFilters();
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const countryFilter = document.getElementById('countryFilter')?.value || '';
    const typeFilter = document.getElementById('typeFilter')?.value || '';
    const cityFilter = document.getElementById('cityFilter')?.value || '';
    
    filteredData = locationsData.filter(location => {
        const matchesSearch = location.name.toLowerCase().includes(searchTerm) || 
                             location.code.toLowerCase().includes(searchTerm) ||
                             location.city.toLowerCase().includes(searchTerm);
        const matchesCountry = !countryFilter || location.country === countryFilter;
        const matchesType = !typeFilter || location.type === typeFilter;
        const matchesCity = !cityFilter || location.city === cityFilter;
        
        return matchesSearch && matchesCountry && matchesType && matchesCity;
    });
    
    renderLocationsTable();
    updateTableInfo();
    
    console.log(`🔍 Filtered to ${filteredData.length} locations`);
}

function clearFilters() {
    // Clear all filter inputs
    const inputs = ['searchInput', 'countryFilter', 'typeFilter', 'cityFilter'];
    inputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) {
            element.value = '';
        }
    });
    
    // Reset filtered data
    filteredData = [...locationsData];
    
    // Re-render
    renderLocationsTable();
    updateTableInfo();
    
    showNotification('Filters cleared', 'info');
    console.log('🔄 Filters cleared');
}

// ========== UTILITY FUNCTIONS ========== //
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

function updateLastUpdated() {
    if (elements.lastUpdated) {
        const now = new Date();
        elements.lastUpdated.textContent = now.toLocaleString();
    }
}

// ========== MODAL FUNCTIONS ========== //
function showLocationDetails(locationCode) {
    const location = locationsData.find(loc => loc.code === locationCode);
    
    if (!location) {
        showNotification('Location not found', 'error');
        return;
    }
    
    const modal = createModal('location-details', 'Location Details');
    
    modal.body.innerHTML = `
        <div class="location-details">
            <div class="location-header">
                <div class="location-title">
                    <span class="location-flag" style="font-size: 2rem; margin-right: 1rem;">${location.flag}</span>
                    <div>
                        <h2 style="margin: 0; color: var(--text-primary);">${location.name}</h2>
                        <p style="margin: 0.5rem 0; color: var(--text-secondary); font-family: monospace; font-size: 1.1rem;">${location.code}</p>
                    </div>
                </div>
                <div class="location-type-badge">
                    <i class="${location.typeIcon}" style="color: ${location.typeColor}; margin-right: 0.5rem;"></i>
                    <span style="color: ${location.typeColor}; font-weight: 600;">${location.type}</span>
                </div>
            </div>
            
            <div class="location-info-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin: 2rem 0;">
                <div class="info-card">
                    <h4><i class="fas fa-map-marker-alt" style="color: var(--error-color);"></i> Location</h4>
                    <p><strong>Country:</strong> ${location.countryName}</p>
                    <p><strong>City:</strong> ${location.city}</p>
                    ${location.lat && location.lng ? `<p><strong>Coordinates:</strong> ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}</p>` : ''}
                </div>
                
                <div class="info-card">
                    <h4><i class="fas fa-info-circle" style="color: var(--primary-color);"></i> Details</h4>
                    <p><strong>Type:</strong> ${location.type}</p>
                    <p><strong>Code:</strong> ${location.code}</p>
                    <p><strong>Status:</strong> <span style="color: var(--success-color);">Active</span></p>
                </div>
            </div>
            
            <div class="location-actions" style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border-color);">
                ${location.lat && location.lng ? `
                    <button class="btn btn-primary" onclick="openLocationOnMap('${location.lat}', '${location.lng}', '${location.name}')">
                        <i class="fas fa-external-link-alt"></i> Open in Google Maps
                    </button>
                ` : ''}
                <button class="btn btn-secondary" onclick="closeAllModals()">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        </div>
        
        <style>
            .location-details .location-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 2rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid var(--border-color);
            }
            
            .location-details .location-title {
                display: flex;
                align-items: center;
            }
            
            .location-details .location-type-badge {
                display: flex;
                align-items: center;
                background: var(--glass-bg);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                padding: 0.75rem 1rem;
            }
            
            .location-details .info-card {
                background: var(--glass-bg);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                padding: 1.5rem;
            }
            
            .location-details .info-card h4 {
                margin: 0 0 1rem 0;
                color: var(--text-primary);
                font-size: 1.1rem;
            }
            
            .location-details .info-card p {
                margin: 0.5rem 0;
                color: var(--text-secondary);
            }
        </style>
    `;
    
    // Parse twemoji for flags
    setTimeout(() => {
        if (typeof twemoji !== 'undefined') {
            twemoji.parse(modal.element, {
                folder: 'svg',
                ext: '.svg',
                attributes: () => ({ width: '32px', height: '32px' })
            });
        }
    }, 100);
    
    showModal(modal.element);
    console.log(`📍 Showing details for ${location.name} (${location.code})`);
}

function createModal(id, title) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = id;
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close" onclick="closeModal('${id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <!-- Content will be inserted here -->
            </div>
        </div>
    `;
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(id);
        }
    });
    
    return {
        element: modal,
        body: modal.querySelector('.modal-body'),
        header: modal.querySelector('.modal-header h3')
    };
}

function showModal(modalElement) {
    elements.modalContainer.appendChild(modalElement);
    
    // Animate in
    requestAnimationFrame(() => {
        modalElement.classList.add('active');
    });
    
    // Focus trap
    const focusableElements = modalElement.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusableElements.length > 0) {
        focusableElements[0].focus();
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

function closeAllModals() {
    const modals = elements.modalContainer.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    });
}

// ========== MAP INTEGRATION ========== //
function openLocationOnMap(lat, lng, name) {
    if (!lat || !lng) {
        showNotification('Location coordinates not available', 'warning');
        return;
    }
    
    const googleMapsUrl = `https://maps.google.com/?q=${lat},${lng}&z=15&t=m`;
    window.open(googleMapsUrl, '_blank');
    
    console.log(`🗺️ Opening ${name} on Google Maps: ${lat}, ${lng}`);
    showNotification(`Opening ${name} on Google Maps`, 'info');
}

function openInfrastructureMap() {
    console.log('🗺️ Opening infrastructure map...');
    
    const modal = createModal('infrastructure-map', 'Infrastructure Map - All Locations');
    modal.element.style.cssText = 'z-index: 1001;';
    modal.element.querySelector('.modal-content').style.cssText = 'max-width: 1200px; height: 85vh;';
    
    modal.body.innerHTML = `
        <div id="infrastructureMapContainer" style="width: 100%; height: calc(85vh - 120px); border-radius: 8px; overflow: hidden; position: relative;">
            <div id="infrastructureMap" style="width: 100%; height: 100%;"></div>
        </div>
    `;
    
    showModal(modal.element);
    
    // Initialize map after modal is shown
    setTimeout(() => {
        initializeInfrastructureMap();
    }, 300);
}

// ========== EXPORT FUNCTIONALITY ========== //
function exportLocationsReport() {
    console.log('📊 Exporting locations report...');
    
    try {
        // Prepare data for export
        const exportData = filteredData.map(location => ({
            'Station Name': location.name,
            'Station Code': location.code,
            'Country': location.countryName,
            'City': location.city,
            'Type': location.type,
            'Latitude': location.lat || 'N/A',
            'Longitude': location.lng || 'N/A'
        }));
        
        // Convert to CSV
        const csvContent = convertToCSV(exportData);
        
        // Download file
        downloadFile(csvContent, `locations-report-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
        
        showNotification(`Exported ${exportData.length} locations successfully`, 'success');
        console.log(`✅ Exported ${exportData.length} locations to CSV`);
        
    } catch (error) {
        console.error('❌ Error exporting locations:', error);
        showNotification('Failed to export locations report', 'error');
    }
}

function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.map(header => `"${header}"`).join(','));
    
    // Add data rows
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header] || '';
            return `"${String(value).replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
}

function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

// ========== INFRASTRUCTURE MAP INITIALIZATION ========== //
function initializeInfrastructureMap() {
    if (typeof L === 'undefined') {
        showNotification('Map library not loaded. Please refresh the page.', 'error');
        return;
    }
    
    console.log('🗺️ Initializing infrastructure map...');
    
    // Create map
    const map = L.map('infrastructureMap', {
        attributionControl: false
    }).setView([42.0, 25.0], 5);
    
    // Add attribution
    L.control.attribution({
        prefix: false,
        position: 'bottomright'
    }).addAttribution('© OpenStreetMap').addTo(map);
    
    // Add tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
    }).addTo(map);
    
    // Country colors
    const countryColors = {
        'TR': '#E30A17',
        'GR': '#0D5EAF',
        'BG': '#00966E',
        'SI': '#FF0000',
        'CY': '#D57800',
        'GSP': '#6C757D'
    };
    
    // Add location markers
    const markerGroups = {};
    
    locationsData.forEach(location => {
        if (location.lat && location.lng) {
            const typeColor = location.typeColor;
            const countryColor = countryColors[location.country] || '#757575';
            
            const customIcon = L.divIcon({
                className: 'custom-map-marker',
                html: `<div style="
                    background: ${typeColor}; 
                    width: 20px; 
                    height: 20px; 
                    border-radius: 50%; 
                    border: 3px solid ${countryColor}; 
                    box-shadow: 0 3px 8px rgba(0,0,0,0.4);
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    color: white;
                    font-size: 9px;
                    font-weight: bold;
                    z-index: 1000;
                ">${location.flag}</div>`,
                iconSize: [26, 26],
                iconAnchor: [13, 13],
                popupAnchor: [0, -13]
            });
            
            const marker = L.marker([location.lat, location.lng], { icon: customIcon });
            
            marker.bindPopup(`
                <div style="min-width: 200px;">
                    <h4 style="margin: 0 0 8px 0; color: #333;">
                        ${location.flag} ${location.name}
                    </h4>
                    <p style="margin: 4px 0;"><strong>Code:</strong> ${location.code}</p>
                    <p style="margin: 4px 0;"><strong>Country:</strong> ${location.countryName}</p>
                    <p style="margin: 4px 0;"><strong>City:</strong> ${location.city}</p>
                    <p style="margin: 4px 0;"><strong>Type:</strong> 
                        <span style="background: ${typeColor}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px;">
                            ${location.type}
                        </span>
                    </p>
                    <div style="margin-top: 12px; text-align: center;">
                        <button onclick="window.open('https://maps.google.com/?q=${location.lat},${location.lng}', '_blank')" 
                                style="background: #4285f4; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 11px; cursor: pointer;">
                            <i class="fas fa-external-link-alt"></i> Google Maps
                        </button>
                    </div>
                </div>
            `);
            
            if (!markerGroups[location.country]) {
                markerGroups[location.country] = L.layerGroup();
            }
            markerGroups[location.country].addLayer(marker);
        }
    });
    
    // Add all markers to map
    Object.values(markerGroups).forEach(group => {
        group.addTo(map);
    });
    
    // Add layer control
    const overlays = {};
    Object.entries(markerGroups).forEach(([country, group]) => {
        const color = countryColors[country] || '#757575';
        const flag = getCountryFlag(country);
        const name = getCountryName(country);
        const count = locationsData.filter(loc => loc.country === country).length;
        overlays[`<span style="color: ${color}; font-weight: bold;">${flag} ${name}</span> <small>(${count})</small>`] = group;
    });
    
    L.control.layers(null, overlays, { 
        position: 'topright',
        collapsed: false
    }).addTo(map);
    
    // Add legend
    const legend = L.control({position: 'topleft'});
    legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'map-legend');
    div.style.cssText = `
        background: rgba(255,255,255,0.95); 
        padding: 12px 16px; 
        border-radius: 8px; 
        font-size: 12px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        max-width: 200px;
        border: 1px solid rgba(0,0,0,0.1);
        margin-bottom: 20px; /* alt köşeden biraz yukarı al */
    `;
        
        let legendHtml = '<h4 style="margin: 0 0 8px 0; font-size: 14px; color: #333;">Location Types</h4>';
        
        Object.entries(LOCATION_TYPE_CONFIG).forEach(([type, config]) => {
            const count = locationsData.filter(loc => loc.type === type).length;
            if (count > 0) {
                legendHtml += `
                    <div style="margin: 4px 0; display: flex; align-items: center;">
                        <span style="background: ${config.color}; width: 12px; height: 12px; border-radius: 50%; display: inline-block; margin-right: 8px; border: 1px solid rgba(0,0,0,0.2);"></span>
                        <span style="color: #333; font-weight: 500;">${type} (${count})</span>
                    </div>
                `;
            }
        });
        
        div.innerHTML = legendHtml;
        return div;
    };
    legend.addTo(map);
    
    // Fit map to show all markers
    if (locationsData.length > 0) {
        const group = new L.featureGroup();
        locationsData.forEach(location => {
            if (location.lat && location.lng) {
                L.marker([location.lat, location.lng]).addTo(group);
            }
        });
        map.fitBounds(group.getBounds().pad(0.1));
    }
    
    console.log(`✅ Infrastructure map initialized with ${locationsData.length} locations`);
}

// ========== NOTIFICATION SYSTEM ========== //
function showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    notification.innerHTML = `
        <i class="${icons[type] || icons.info}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; margin-left: auto; cursor: pointer;">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    elements.notificationContainer.appendChild(notification);
    
    // Auto remove
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }
    }, duration);
    
    console.log(`📢 Notification: ${type.toUpperCase()} - ${message}`);
}

// ========== GLOBAL FUNCTIONS ========== //
// Make functions available globally for onclick handlers
window.handleSearch = handleSearch;
window.handleFilters = handleFilters;
window.clearFilters = clearFilters;
window.showLocationDetails = showLocationDetails;
window.openLocationOnMap = openLocationOnMap;
window.openInfrastructureMap = openInfrastructureMap;
window.exportLocationsReport = exportLocationsReport;
window.closeModal = closeModal;
window.closeAllModals = closeAllModals;

// ========== PAGE READY ========== //
console.log('📋 Locations.js loaded successfully');