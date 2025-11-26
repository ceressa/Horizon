// ========== COUNTRY DETAIL PAGE JAVASCRIPT ========== //
// Version: 1.0.1 - Cleaned & Optimized

'use strict';
const COUNTRY_CONFIG = window.COUNTRY_CONFIG;
const countryNames   = window.countryNames;
const COUNTRY_ORDER  = window.COUNTRY_ORDER;
// Global variables
let currentCountry = null;
let countryMap = null;
let countryDetailInitialized = false;

const __originalShowNotification = window.showNotification;



const LOCATION_TYPE_COLORS = {
    'Station': { 
        color: '#0D5EAF', 
        name: 'Station', 
        icon: 'fas fa-shipping-fast' 
    },
    'HQ Office': { 
        color: '#E30A17', 
        name: 'Headquarters', 
        icon: 'fas fa-building' 
    },
    'Ramp': { 
        color: '#00966E', 
        name: 'Airport Ramp', 
        icon: 'fas fa-plane' 
    },
    'Air Gateway': { 
        color: '#FF9933', 
        name: 'Air Gateway', 
        icon: 'fas fa-route' 
    },
    'Clearance Center': { 
        color: '#6C757D', 
        name: 'Clearance Center', 
        icon: 'fas fa-file-signature' 
    },
    'Call Center': { 
        color: '#8B5CF6', 
        name: 'Call Center', 
        icon: 'fas fa-headset' 
    },
    'Customer Dock': { 
        color: '#F59E0B', 
        name: 'Customer Dock', 
        icon: 'fas fa-truck-loading' 
    },
    'Air Hub': { 
        color: '#1E90FF',   // parlak mavi (hava taşımacılığı için)
        name: 'Air Hub', 
        icon: 'fas fa-plane-departure' 
    },
    'Road Hub': { 
        color: '#2ECC71',   // yeşil (kara yolu lojistiği için)
        name: 'Road Hub', 
        icon: 'fas fa-truck' 
    }
};


// ========== PAGE INITIALIZATION ========== //

function initializeCountryDetailPage() {
    console.log('Initializing Country Detail Page...');
    
    const urlParams = new URLSearchParams(window.location.search);
    const countryCode = urlParams.get('country')?.toUpperCase();

    currentCountry = countryCode;
    
    // TR için özel section'ları göster
    if (countryCode === 'TR') {
        const teamSection = document.getElementById('teamSection');
        if (teamSection) {
            teamSection.style.display = 'block';
        }
        
        const specialActionsSection = document.getElementById('specialActionsSection');
        if (specialActionsSection) {
            specialActionsSection.style.display = 'block';
        }
    }
	
	if (!currentCountry || !COUNTRY_CONFIG || !COUNTRY_CONFIG[currentCountry]) {
    console.error('❌ Invalid country parameter or missing config:', currentCountry);
    console.log('🔍 Available countries:', COUNTRY_CONFIG ? Object.keys(COUNTRY_CONFIG) : 'NONE');
    return; // Redirect yok, sadece burada duruyoruz
}


    
    //if (!currentCountry || !COUNTRY_CONFIG[currentCountry]) {
    //    console.error('Invalid country parameter');
    //    setTimeout(() => window.location.href = '../index.html', 2000);
    //    return;
    //}
    
    // Check if data is ready
    if (!window.systemData || Object.keys(window.systemData.users || {}).length === 0) {
        console.log('Waiting for data...');
        waitForDataAndInitialize();
    } else {
        initializePage();
    }
}

function waitForDataAndInitialize() {
    const checkInterval = setInterval(() => {
        if (window.systemData && Object.keys(window.systemData.users || {}).length > 0) {
            console.log('Data ready, initializing...');
            clearInterval(checkInterval);
            initializePage();
        }
    }, 500);
    
    // Timeout after 10 seconds
    setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.systemData || Object.keys(window.systemData.users || {}).length === 0) {
            console.error('Data load timeout');
            loadCountryDataManually();
        }
    }, 10000);
}

function initializePage() {
    initializeCountryHeader();
    loadCountryStatistics();
    loadNetworkTopology();
    initializeCountryMap();
    loadLocationsList();
    applyCountryTheme();
    
    console.log('Country Detail Page initialized successfully');
}

// ========== DATA LOADING ========== //

function loadCountryStatistics() {
    console.log('Loading statistics for:', currentCountry);
    
    const s = window.systemData || {};
    const users = (s.users || {})[currentCountry] || 0;
    const devices = (s.devices || {})[currentCountry] || 0;
    const locations = ((s.locationCoordinates || {})[currentCountry] || []).length;
    const projects = (s.projects || []).filter(p => p.country === currentCountry).length;
    
    const net = (s.networkDevicesByCountry || {})[currentCountry] || {};
    const totalNetwork = (net.router || 0) + (net.switch || 0) + (net.ap || 0) + (net.firewall || 0) + (net.UDS || 0);
    
    console.log(`Stats: ${users} users, ${devices} devices, ${locations} locations, ${projects} projects`);
    
    // Animate counters
    animateCounterTo('countryUsers', users);
    animateCounterTo('countryDevices', devices);
    animateCounterTo('countryLocations', locations);
    animateCounterTo('countryProjects', projects);
    animateCounterTo('countryNetworkDevices', totalNetwork);
}

function loadNetworkTopology() {
    console.log('Loading network topology for:', currentCountry);
    
    const net = (window.systemData?.networkDevicesByCountry || {})[currentCountry] || {};
    
    setTimeout(() => {
        animateCounterTo('countryRouters', net.router || 0);
        animateCounterTo('countrySwitches', net.switch || 0);
        animateCounterTo('countryAPs', net.ap || 0);
        animateCounterTo('countryFirewalls', net.firewall || 0);
    }, 300);
}

async function loadCountryDataManually() {
    try {
        console.log('Loading data manually...');
        
        const response = await fetch('/Horizon/api/data/inventory');
        const data = await response.json();
        
        if (data && typeof processInventoryData === 'function') {
            processInventoryData(data);
            setTimeout(() => initializePage(), 500);
        }
    } catch (error) {
        console.error('Manual data load failed:', error);
        showNotification('Failed to load country data', 'error');
    }
}

// ========== MAP FUNCTIONALITY ========== //

function initializeCountryMap(countryCode = currentCountry) {
    const mapContainer = document.getElementById('countryMap');
    if (!mapContainer) return;

    try {
        if (window.countryDetailMap) {
            window.countryDetailMap.remove();
        }

        // ✅ locationData yerine systemData.locationCoordinates kullanıyoruz
        const countryLocations = window.systemData?.locationCoordinates?.[countryCode] || [];

        if (!countryLocations.length) {
            console.warn('No location coordinates found for', countryCode);
            return;
        }

        // Ortalama koordinatları hesapla (ülke merkezine yakın bir başlangıç noktası olsun)
        const avgLat = countryLocations.reduce((sum, loc) => sum + loc.lat, 0) / countryLocations.length;
        const avgLng = countryLocations.reduce((sum, loc) => sum + loc.lng, 0) / countryLocations.length;

        window.countryDetailMap = L.map('countryMap', {
            center: [avgLat, avgLng],
            zoom: 6,
            zoomControl: true
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  maxZoom: 18
}).addTo(window.countryDetailMap);


        // ✅ İlk lokasyonu göstermek için marker ekliyoruz
        const firstLoc = countryLocations[0];
        if (firstLoc) {
            L.marker([firstLoc.lat, firstLoc.lng])
                .bindPopup(`<b>${firstLoc.name}</b>`)
                .addTo(window.countryDetailMap)
                .openPopup();
        }

        setTimeout(() => {
            window.countryDetailMap.invalidateSize();
        }, 200);

        // ✅ Harita referansını global değişkene atıyoruz ki updateMapMarkers çalışabilsin
        countryMap = window.countryDetailMap;

        // Marker’ları ekle
        updateMapMarkers();

    } catch (error) {
        console.error('Map error:', error);
    }
}


function updateMapMarkers() {
    if (!countryMap) return;
    
    // Mevcut marker'ları temizle
    countryMap.eachLayer(layer => {
        if (layer instanceof L.Marker) {
            countryMap.removeLayer(layer);
        }
    });
    
    const locations = window.systemData?.locationCoordinates?.[currentCountry] || [];
    console.log(`Adding ${locations.length} markers for ${currentCountry}`);
    
    if (locations.length === 0) return;
    
    // Marker'ları ekle
    locations.forEach(location => {
        const icon = getLocationIcon(location.type);
        const marker = L.marker([location.lat, location.lng], { icon }).addTo(countryMap);
        
        const typeConfig = LOCATION_TYPE_COLORS[location.type] || LOCATION_TYPE_COLORS['Station'];
        
        const popupContent = `
            <div class="location-popup">
                <div class="popup-header" style="border-left: 4px solid ${typeConfig.color};">
                    <h4 style="margin: 0; color: ${typeConfig.color};">${location.name}</h4>
                    <div style="margin-top: 8px;">
                        <i class="${typeConfig.icon}" style="color: ${typeConfig.color}; margin-right: 6px;"></i>
                        <span style="color: ${typeConfig.color}; font-weight: 600;">${typeConfig.name}</span>
                    </div>
                </div>
                <div style="padding: 12px 0; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <strong>Location Code:</strong>
                        <span style="color: #84cc16; font-weight: 600;">${location.code}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <strong>City:</strong>
                        <span>${location.city}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <strong>Coordinates:</strong>
                        <span style="font-family: monospace; font-size: 0.9em;">${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}</span>
                    </div>
                </div>
            </div>
        `;
        
        marker.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'custom-popup'
        });
    });
    
    // Haritayı marker'lara göre ayarla - sadece ilk seferde
    if (!countryMap._mapInitialized && locations.length > 0) {
        const group = L.featureGroup();
        locations.forEach(location => {
            L.marker([location.lat, location.lng]).addTo(group);
        });

        // ✅ Haritanın tamamen hazır olduğundan emin olmak için küçük gecikme ekle
        setTimeout(() => {
            if (countryMap && countryMap._loaded) {
                countryMap.fitBounds(group.getBounds().pad(0.1));
                countryMap._mapInitialized = true;
                countryMap.invalidateSize(); // görünürlük sorununu önler
            }
        }, 300);
    }
}


// ✅ DOĞRU - Location type'ının kendi rengini kullanıyor
function getLocationIcon(type) {
    const config = LOCATION_TYPE_COLORS[type] || LOCATION_TYPE_COLORS['Station'];
    
    // Location type'ın kendi rengini kullan, ülke rengi değil
    return L.divIcon({
        className: 'custom-location-marker',
        html: `<div style="
            background: ${config.color}; 
            width: 24px; 
            height: 24px; 
            border-radius: 50%; 
            border: 3px solid white; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 10px;
            color: white;
            box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        ">
            <i class="${config.icon}"></i>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
}

function createMapLegend() {
    const legend = L.control({ position: 'bottomright' });
    
    legend.onAdd = function() {
        const div = L.DomUtil.create('div', 'map-legend');
        
        const locations = window.systemData?.locationCoordinates?.[currentCountry] || [];
        
        // Type'ları say ve sırala
        const typeCount = {};
        locations.forEach(loc => {
            typeCount[loc.type] = (typeCount[loc.type] || 0) + 1;
        });
        
        // Count'a göre sırala (en çok olandan aza)
        const sortedTypes = Object.entries(typeCount)
            .sort(([,a], [,b]) => b - a);
        
        const legendItems = sortedTypes.map(([type, count]) => {
            const config = LOCATION_TYPE_COLORS[type] || LOCATION_TYPE_COLORS['Station'];
            return `
                <div class="legend-item">
                    <div class="legend-item-left">
                        <div class="legend-color" style="background: ${config.color};">
                            <i class="${config.icon}"></i>
                        </div>
                        <span class="legend-label">${config.name}</span>
                    </div>
                    <span class="legend-count">${count}</span>
                </div>
            `;
        }).join('');
        
        div.innerHTML = `
            <div class="legend-header">
                <h4>${getCountryName(currentCountry)} Locations</h4>
                <p class="legend-total">${locations.length} total locations</p>
            </div>
            <div class="legend-items">
                ${legendItems}
            </div>
        `;
        
        return div;
    };
    
    return legend;
}

// ========== LOCATIONS LIST ========== //

function loadLocationsList() {
    console.log('Loading locations list for:', currentCountry);
    
    const locationsList = document.getElementById('locationsList');
    const locations = window.systemData?.locationCoordinates?.[currentCountry] || [];
    
    if (!locationsList) {
        console.error('Locations list element not found');
        return;
    }
    
    locationsList.innerHTML = '';
    
    if (locations.length === 0) {
        locationsList.innerHTML = '<div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.6);">No locations found for this country.</div>';
        return;
    }

    // Harita container'ı görünür hale geldiyse boyutunu yeniden hesapla
    if (countryMap) {
        countryMap.invalidateSize();
    }
    
    locations.forEach((location, index) => {
        const typeConfig = LOCATION_TYPE_COLORS[location.type] || LOCATION_TYPE_COLORS['Station'];
        const locationCard = document.createElement('div');
        locationCard.className = 'location-card';
        
        locationCard.innerHTML = `
            <div class="location-header">
                <div class="location-icon" style="background: ${typeConfig.color};">
                    <i class="${typeConfig.icon}"></i>
                </div>
                <div class="location-details">
                    <div class="location-name">${location.name}</div>
                    <div class="location-code">${location.code}</div>
                </div>
            </div>
            <div class="location-stats">
                <div class="location-stat">
                    <span class="location-stat-label">Type:</span>
                    <span class="location-stat-value" style="color: ${typeConfig.color};">${typeConfig.name}</span>
                </div>
                <div class="location-stat">
                    <span class="location-stat-label">Status:</span>
                    <span class="location-stat-value" style="color: #22c55e;">Active</span>
                </div>
            </div>
        `;
        
        // Click to focus on map
        // Harita container'ını al
const mapElement = document.getElementById('countryMap'); // id'yi kendi koduna göre değiştir

locationCard.addEventListener('click', () => {
    if (countryMap) {
        countryMap.flyTo([location.lat, location.lng], 12, {
            animate: true,
            duration: 1.0
        });

        countryMap.eachLayer(layer => {
            if (layer instanceof L.Marker) {
                const pos = layer.getLatLng();
                if (Math.abs(pos.lat - location.lat) < 0.0001 &&
                    Math.abs(pos.lng - location.lng) < 0.0001) {
                    layer.openPopup();
                }
            }
        });

        // Harita görünür olsun diye scroll et
        if (mapElement) {
            mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        showNotification(`Focused on ${location.name}`, 'info');
    }
});

        
        locationsList.appendChild(locationCard);
    });
    
    console.log(`Loaded ${locations.length} locations`);
}


// ========== HEADER INITIALIZATION ========== //

function initializeCountryHeader() {
    const config = COUNTRY_CONFIG[currentCountry];
    const header = document.querySelector('.country-header');
    
    if (header) {
        header.setAttribute('data-country', currentCountry);
    }
    
    // Update flag
    const flagElement = document.getElementById('countryFlag');
    if (flagElement) {
        flagElement.textContent = config.flag;
        
        // Parse with Twemoji if available
        setTimeout(() => {
            if (typeof twemoji !== 'undefined') {
                twemoji.parse(flagElement, {
                    folder: 'svg',
                    ext: '.svg',
                    attributes: () => ({ width: '64px', height: '64px' })
                });
            }
        }, 100);
    }
    updateElement('countryName', config.name);
}


// ✅ CSS Filter ile logo renklendirme (CORS sorunu yok!)
function applyCountryTheme() {
    const config = COUNTRY_CONFIG[currentCountry];
    
    // Set body data attribute
    document.body.setAttribute('data-country', currentCountry);
    
    // Set header data attribute
    const header = document.querySelector('.country-header');
    if (header) {
        header.setAttribute('data-country', currentCountry);
    }
    
    // ✅ Logo'yu CSS filter ile renklendir (CORS-safe!)
    recolorLogoWithFilter(config.primaryColor);
    
    console.log(`✅ Applied ${currentCountry} theme with color: ${config.primaryColor}`);
}

function recolorLogoWithFilter(color) {
    const logoSection = document.querySelector('.logo-section');
    if (!logoSection || !color) return;
    
    // ✅ MEGA GLOW - Kesin görünür!
    logoSection.style.cssText = `
        padding: 12px !important;
        border-radius: 16px !important;
        background: linear-gradient(135deg, ${color}25, ${color}10) !important;
        border: 3px solid ${color} !important;
        box-shadow: 
            0 0 30px ${color},
            0 0 60px ${color}80,
            0 0 90px ${color}40,
            inset 0 0 30px ${color}20 !important;
        transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1) !important;
    `;
    
    const img = logoSection.querySelector('img');
    if (img) {
        img.style.filter = `brightness(1.2) drop-shadow(0 0 10px ${color})`;
    }
    
    console.log(`✨ MEGA GLOW applied with color: ${color}`);
}

// Dashboard'a dönerken logo'yu reset et
function resetLogo() {
    const img = document.querySelector('.logo-section img');
    if (img) {
        img.style.filter = 'none';
    }
}





// ========== UTILITY FUNCTIONS ========== //

function animateCounterTo(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const startValue = 0;
    const duration = 2000;
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.round(startValue + (targetValue - startValue) * easeProgress);
        
        element.textContent = currentValue.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }
    
    requestAnimationFrame(updateCounter);
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element && value !== undefined) {
        element.textContent = value;
    }
}

// Bu satır, bu dosyada showNotification'ı tanımlamadan ÖNCE çalışmalı


function showNotification(message, type = 'info') {
    if (typeof __originalShowNotification === 'function' &&
        __originalShowNotification !== showNotification) {
        return __originalShowNotification(message, type);
    }

    console.log(`${(type || 'info').toUpperCase()}: ${message}`);
}



function refreshCountryData() {
    console.log('Refreshing country data...');
    showNotification('Refreshing data...', 'info');
    
    loadCountryDataManually().then(() => {
        showNotification('Data refreshed successfully', 'success');
    }).catch(error => {
        console.error('Refresh failed:', error);
        showNotification('Failed to refresh data', 'error');
    });
}

// ========== EVENT HANDLERS ========== //

// Data load callback from common.js
window.onDataLoaded = function() {
    console.log('Data loaded callback received');
    if (currentCountry) {
        loadCountryStatistics();
        loadNetworkTopology();
        if (countryMap) {
            updateMapMarkers();
        }
        loadLocationsList();
    }
};

// Export functions for global access
window.refreshCountryData = refreshCountryData;
window.initializeCountryDetailPage = initializeCountryDetailPage;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Country Detail Page DOM loaded');
    initializeCountryDetailPage();
});

function openISTFlights() {
    pageTransition('IST_Flights.html');
}

// ========== PAGE LIFECYCLE ========== //

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 Country Detail Page DOM loaded');
    
    // ✅ Start clock immediately
    if (typeof updateLiveClock === 'function') {
        updateLiveClock();
        setInterval(updateLiveClock, 1000);
        console.log('⏰ Clock started');
    }
    
    // ✅ Set user initials
    setTimeout(() => {
        const userInitials = document.getElementById('userInitials');
        if (userInitials && window.authService && window.authService.isAuthenticated()) {
            const user = window.authService.getCurrentUser();
            if (user && user.name && userInitials.textContent === '--') {
                const initials = user.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2);
                userInitials.textContent = initials;
                console.log('👤 Initials set:', initials);
            }
        }
    }, 500);
    
    // Initialize page
    initializeCountryDetailPage();
});