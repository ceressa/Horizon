// ========== COUNTRIES DATA & UTILITIES ========== //
'use strict';

// Country order for geographic grouping
window.COUNTRY_ORDER = [
    'TR', 'GR', 'CY', 'BG', 'SI', 'RS', 'HR', 'AL', 'BA', 'ME', 'MK',
    'ES', 'PT', 'AT', 'CH', 'CZ', 'HU', 'RO', 'SK', 'PL', 'UA',
    'LT', 'LV', 'EE', 'NO', 'SE', 'FI', 'IS', 'DK', 'DE', 'FR',
    'IT', 'NL', 'BE', 'LU', 'GB', 'IE', 'MT', 'GSP'
];

// Countries configuration
if (!window.COUNTRY_CONFIG) {
    window.COUNTRY_CONFIG = {
        'TR': { name: 'Turkey', flag: '🇹🇷', center: [39.9334, 32.8597], zoom: 6, color: '#E30A17', secondaryColor: '#FFFFFF', gradient: ['#E30A17', '#FFFFFF'] },
        'GR': { name: 'Greece', flag: '🇬🇷', center: [39.0742, 21.8243], zoom: 6, color: '#0D5EAF', secondaryColor: '#FFFFFF', gradient: ['#0D5EAF', '#FFFFFF'] },
        'CY': { name: 'Cyprus', flag: '🇨🇾', center: [35.1264, 33.4299], zoom: 9, color: '#D57800', secondaryColor: '#4E5B31', gradient: ['#FFFFFF', '#D57800'] },
        'BG': { name: 'Bulgaria', flag: '🇧🇬', center: [42.7339, 25.4858], zoom: 7, color: '#00966E', secondaryColor: '#D62612', gradient: ['#FFFFFF', '#00966E', '#D62612'] },
        'SI': { name: 'Slovenia', flag: '🇸🇮', center: [46.1512, 14.9955], zoom: 8, color: '#005DA4', secondaryColor: '#FF0000', gradient: ['#FFFFFF', '#005DA4', '#FF0000'] },
        'RS': { name: 'Serbia', flag: '🇷🇸', center: [44.0165, 21.0059], zoom: 7, color: '#C6363C', secondaryColor: '#0C4076', gradient: ['#C6363C', '#0C4076', '#FFFFFF'] },
        'HR': { name: 'Croatia', flag: '🇭🇷', center: [45.1, 15.2], zoom: 7, color: '#FF0000', secondaryColor: '#171796', gradient: ['#FF0000', '#FFFFFF', '#171796'] },
        'AL': { name: 'Albania', flag: '🇦🇱', center: [41.1533, 20.1683], zoom: 7, color: '#E41E20', secondaryColor: '#000000', gradient: ['#E41E20', '#000000'] },
        'BA': { name: 'Bosnia and Herzegovina', flag: '🇧🇦', center: [43.9159, 17.6791], zoom: 7, color: '#002395', secondaryColor: '#FECB00', gradient: ['#002395', '#FECB00'] },
        'ME': { name: 'Montenegro', flag: '🇲🇪', center: [42.7087, 19.3744], zoom: 8, color: '#C40308', secondaryColor: '#D4AF37', gradient: ['#C40308', '#D4AF37'] },
        'MK': { name: 'North Macedonia', flag: '🇲🇰', center: [41.6086, 21.7453], zoom: 8, color: '#D20000', secondaryColor: '#FFE600', gradient: ['#D20000', '#FFE600'] },
        'ES': { name: 'Spain', flag: '🇪🇸', center: [40.4168, -3.7038], zoom: 6, color: '#AA151B', secondaryColor: '#F1BF00', gradient: ['#AA151B', '#F1BF00'] },
        'PT': { name: 'Portugal', flag: '🇵🇹', center: [38.7169, -9.1390], zoom: 7, color: '#006600', secondaryColor: '#FF0000', gradient: ['#006600', '#FF0000'] },
        'AT': { name: 'Austria', flag: '🇦🇹', center: [48.2100, 16.3738], zoom: 7, color: '#ED2939', secondaryColor: '#FFFFFF', gradient: ['#ED2939', '#FFFFFF'] },
        'CH': { name: 'Switzerland', flag: '🇨🇭', center: [46.8182, 8.2275], zoom: 7, color: '#FF0000', secondaryColor: '#FFFFFF', gradient: ['#FF0000', '#FFFFFF'] },
        'CZ': { name: 'Czech Republic', flag: '🇨🇿', center: [50.0755, 14.4378], zoom: 7, color: '#11457E', secondaryColor: '#D7141A', gradient: ['#11457E', '#FFFFFF', '#D7141A'] },
        'HU': { name: 'Hungary', flag: '🇭🇺', center: [47.1625, 19.5033], zoom: 7, color: '#CD2A3E', secondaryColor: '#436F4D', gradient: ['#CD2A3E', '#FFFFFF'] },
        'RO': { name: 'Romania', flag: '🇷🇴', center: [44.4268, 26.1025], zoom: 7, color: '#002B7F', secondaryColor: '#CE1126', gradient: ['#002B7F', '#FCD116', '#CE1126'] },
        'SK': { name: 'Slovakia', flag: '🇸🇰', center: [48.6690, 19.6990], zoom: 7, color: '#0B4EA2', secondaryColor: '#EE1C25', gradient: ['#FFFFFF', '#0B4EA2', '#EE1C25'] },
        'PL': { name: 'Poland', flag: '🇵🇱', center: [51.9194, 19.1451], zoom: 6, color: '#DC143C', secondaryColor: '#FFFFFF', gradient: ['#FFFFFF', '#DC143C'] },
        'UA': { name: 'Ukraine', flag: '🇺🇦', center: [48.3794, 31.1656], zoom: 6, color: '#0057B7', secondaryColor: '#FFD700', gradient: ['#0057B7', '#FFD700'] },
        'LT': { name: 'Lithuania', flag: '🇱🇹', center: [55.1694, 23.8813], zoom: 7, color: '#FDB913', secondaryColor: '#006A44', gradient: ['#FDB913', '#006A44', '#C1272D'] },
        'LV': { name: 'Latvia', flag: '🇱🇻', center: [56.8796, 24.6032], zoom: 7, color: '#9E3039', secondaryColor: '#FFFFFF', gradient: ['#9E3039', '#FFFFFF'] },
        'EE': { name: 'Estonia', flag: '🇪🇪', center: [58.5953, 25.0136], zoom: 7, color: '#0072CE', secondaryColor: '#000000', gradient: ['#0072CE', '#000000', '#FFFFFF'] },
        'NO': { name: 'Norway', flag: '🇳🇴', center: [60.4720, 8.4689], zoom: 5, color: '#BA0C2F', secondaryColor: '#00205B', gradient: ['#EF2B2D', '#FFFFFF', '#002868'] },
        'SE': { name: 'Sweden', flag: '🇸🇪', center: [60.1282, 18.6435], zoom: 5, color: '#006AA7', secondaryColor: '#FECC00', gradient: ['#006AA7', '#FECC00'] },
        'FI': { name: 'Finland', flag: '🇫🇮', center: [61.9241, 25.7482], zoom: 5, color: '#003580', secondaryColor: '#FFFFFF', gradient: ['#003580', '#FFFFFF'] },
        'IS': { name: 'Iceland', flag: '🇮🇸', center: [64.9631, -19.0208], zoom: 6, color: '#003897', secondaryColor: '#DC1E35', gradient: ['#003897', '#DC1E35', '#FFFFFF'] },
        'DK': { name: 'Denmark', flag: '🇩🇰', center: [56.2639, 9.5018], zoom: 7, color: '#C60C30', secondaryColor: '#FFFFFF', gradient: ['#C60C30', '#FFFFFF'] },
        'DE': { name: 'Germany', flag: '🇩🇪', center: [51.1657, 10.4515], zoom: 6, color: '#000000', secondaryColor: '#FFCE00', gradient: ['#000000', '#DD0000', '#FFCE00'] },
        'FR': { name: 'France', flag: '🇫🇷', center: [46.2276, 2.2137], zoom: 6, color: '#0055A4', secondaryColor: '#EF4135', gradient: ['#0055A4', '#FFFFFF', '#EF4135'] },
        'IT': { name: 'Italy', flag: '🇮🇹', center: [41.8719, 12.5674], zoom: 6, color: '#009246', secondaryColor: '#CE2B37', gradient: ['#009246', '#FFFFFF', '#CE2B37'] },
        'NL': { name: 'Netherlands', flag: '🇳🇱', center: [52.1326, 5.2913], zoom: 7, color: '#AE1C28', secondaryColor: '#21468B', gradient: ['#AE1C28', '#FFFFFF', '#21468B'] },
        'BE': { name: 'Belgium', flag: '🇧🇪', center: [50.5039, 4.4699], zoom: 7, color: '#000000', secondaryColor: '#EF3340', gradient: ['#000000', '#FDDA24', '#EF3340'] },
        'LU': { name: 'Luxembourg', flag: '🇱🇺', center: [49.8153, 6.1296], zoom: 9, color: '#00A1DE', secondaryColor: '#ED2939', gradient: ['#ED2939', '#FFFFFF', '#00A1DE'] },
        'GB': { name: 'United Kingdom', flag: '🇬🇧', center: [55.3781, -3.4360], zoom: 6, color: '#00247D', secondaryColor: '#CF142B', gradient: ['#00247D', '#CF142B', '#FFFFFF'] },
        'IE': { name: 'Ireland', flag: '🇮🇪', center: [53.4129, -8.2439], zoom: 7, color: '#169B62', secondaryColor: '#FF883E', gradient: ['#169B62', '#FFFFFF', '#FF883E'] },
        'MT': { name: 'Malta', flag: '🇲🇹', center: [35.9375, 14.3754], zoom: 10, color: '#CF142B', secondaryColor: '#FFFFFF', gradient: ['#FFFFFF', '#CF142B'] },
        'GSP': { name: 'GSP', flag: '🌐', center: [40.0, 28.0], zoom: 5, color: '#6C757D', secondaryColor: '#84cc16', gradient: ['#6C757D', '#84cc16'] }
    };
}

// Name to code mapping (supports Turkey/Türkiye)
if (!window.COUNTRY_NAME_TO_CODE) {
    window.COUNTRY_NAME_TO_CODE = {
        'Turkey': 'TR', 'Türkiye': 'TR', 'Türkiye': 'TR',
        'Greece': 'GR', 'Cyprus': 'CY', 'Bulgaria': 'BG', 'Slovenia': 'SI',
        'Serbia': 'RS', 'Croatia': 'HR', 'Albania': 'AL',
        'Bosnia and Herzegovina': 'BA', 'Bosnia': 'BA',
        'Montenegro': 'ME', 'North Macedonia': 'MK', 'Macedonia': 'MK',
        'Spain': 'ES', 'Portugal': 'PT', 'Austria': 'AT', 'Switzerland': 'CH',
        'Czech Republic': 'CZ', 'Hungary': 'HU', 'Romania': 'RO', 'Slovakia': 'SK',
        'Poland': 'PL', 'Ukraine': 'UA', 'Lithuania': 'LT', 'Latvia': 'LV', 'Estonia': 'EE',
        'Norway': 'NO', 'Sweden': 'SE', 'Finland': 'FI', 'Iceland': 'IS', 'Denmark': 'DK',
        'Germany': 'DE', 'France': 'FR', 'Italy': 'IT', 'Netherlands': 'NL',
        'Belgium': 'BE', 'Luxembourg': 'LU', 'United Kingdom': 'GB', 'UK': 'GB',
        'Ireland': 'IE', 'Malta': 'MT'
    };
}

// Reverse mapping for UI display
if (!window.COUNTRY_CODE_TO_NAME) {
    window.COUNTRY_CODE_TO_NAME = Object.fromEntries(
        Object.entries(window.COUNTRY_NAME_TO_CODE).map(([name, code]) => [code, name])
    );
}

// Override for UI label only
window.COUNTRY_CODE_TO_NAME['TR'] = 'Türkiye';



// Helper functions
function getCountryCode(name) { return window.COUNTRY_NAME_TO_CODE[name] || null; }
function getCountryName(code) { return (window.COUNTRY_CONFIG[code] || {}).name || code; }
function getCountryFlag(code) { return (window.COUNTRY_CONFIG[code] || {}).flag || '🏳️'; }
function getCountryColor(code) { return (window.COUNTRY_CONFIG[code] || {}).color || '#95A5A6'; }
function getCountrySecondaryColor(code) { return (window.COUNTRY_CONFIG[code] || {}).secondaryColor || '#FFFFFF'; }
function getCountryColors(code) { return { primary: getCountryColor(code), secondary: getCountrySecondaryColor(code) }; }
function getCountryGradient(code) { return (window.COUNTRY_CONFIG[code] || {}).gradient || [getCountryColor(code), '#FFFFFF']; }
function getCountryCenter(code) { return (window.COUNTRY_CONFIG[code] || {}).center || [0, 0]; }
function getCountryZoom(code) { return (window.COUNTRY_CONFIG[code] || {}).zoom || 6; }

// Export to global
window.getCountryCode = getCountryCode;
window.getCountryName = getCountryName;
window.getCountryFlag = getCountryFlag;
window.getCountryColor = getCountryColor;
window.getCountrySecondaryColor = getCountrySecondaryColor;
window.getCountryColors = getCountryColors;
window.getCountryGradient = getCountryGradient;
window.getCountryCenter = getCountryCenter;
window.getCountryZoom = getCountryZoom;

window.addEventListener('DOMContentLoaded', () => {
    if (typeof twemoji !== 'undefined') {
        twemoji.parse(document.body, { folder: 'svg', ext: '.svg' });
    }
});

console.log('✅ Countries loaded: 39 countries + GSP');