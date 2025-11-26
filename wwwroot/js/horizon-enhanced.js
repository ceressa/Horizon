/* ========== HORIZON ENHANCED FEATURES ========== */

// Enhanced Global Variables
let enhancedSystemData = {
    notifications: [],
    userPreferences: {},
    searchHistory: [],
    dashboardWidgets: [],
    quickActions: [],
    systemHealth: {},
    performanceMetrics: {}
};

// Theme Management
class ThemeManager {
    constructor() {
        this.themes = ['light', 'dark', 'auto'];
        this.currentTheme = localStorage.getItem('horizon-theme') || 'dark';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupThemeToggle();
    }

    applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('horizon-theme', theme);
        this.currentTheme = theme;
        
        // Broadcast theme change event
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    }

    setupThemeToggle() {
        const themeButtons = document.querySelectorAll('[data-theme-toggle]');
        themeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const theme = button.dataset.themeToggle;
                this.applyTheme(theme);
            });
        });
    }

    getNextTheme() {
        const currentIndex = this.themes.indexOf(this.currentTheme);
        return this.themes[(currentIndex + 1) % this.themes.length];
    }

    toggle() {
        this.applyTheme(this.getNextTheme());
    }
}

// Enhanced Notification System
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.container = this.createContainer();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadStoredNotifications();
    }

    createContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
        return container;
    }

    show(message, type = 'info', options = {}) {
        const notification = this.createNotification(message, type, options);
        this.notifications.push(notification);
        this.container.appendChild(notification.element);
        
        // Animate in
        setTimeout(() => {
            notification.element.classList.add('show');
        }, 100);

        // Auto remove
        if (options.autoRemove !== false) {
            setTimeout(() => {
                this.remove(notification.id);
            }, options.duration || 5000);
        }

        return notification.id;
    }

    createNotification(message, type, options) {
        const id = 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-triangle',
            warning: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };

        const element = document.createElement('div');
        element.className = `notification notification-${type}`;
        element.style.cssText = `
            background: linear-gradient(135deg, 
                rgba(255, 255, 255, 0.15) 0%, 
                rgba(255, 255, 255, 0.08) 100%);
            backdrop-filter: blur(25px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 16px;
            margin-bottom: 16px;
            padding: 0;
            overflow: hidden;
            opacity: 0;
            transform: translateX(100%) scale(0.9);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
            pointer-events: auto;
            position: relative;
        `;

        // Add top border based on type
        const borderColors = {
            success: 'rgba(34, 197, 94, 0.8)',
            error: 'rgba(239, 68, 68, 0.8)',
            warning: 'rgba(234, 179, 8, 0.8)',
            info: 'rgba(59, 130, 246, 0.8)'
        };

        element.innerHTML = `
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: ${borderColors[type] || borderColors.info};
            "></div>
            <div style="
                display: flex;
                align-items: flex-start;
                padding: 20px;
                gap: 16px;
            ">
                <div style="
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    flex-shrink: 0;
                    background: ${borderColors[type]}20;
                    color: ${borderColors[type]};
                    border: 1px solid ${borderColors[type]}40;
                ">
                    <i class="fas ${icons[type] || icons.info}"></i>
                </div>
                <div style="
                    flex: 1;
                    color: rgba(255, 255, 255, 0.95);
                    font-size: 15px;
                    font-weight: 500;
                    line-height: 1.5;
                ">
                    ${message}
                    ${options.subtitle ? `<div style="font-size: 13px; color: rgba(255, 255, 255, 0.7); margin-top: 4px;">${options.subtitle}</div>` : ''}
                </div>
                <button style="
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.6);
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                " onmouseover="this.style.background='rgba(255,255,255,0.1)'; this.style.color='rgba(255,255,255,0.9)'"
                   onmouseout="this.style.background='none'; this.style.color='rgba(255,255,255,0.6)'"
                   onclick="notificationManager.remove('${id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        return {
            id,
            element,
            type,
            message,
            timestamp: new Date(),
            options
        };
    }

    remove(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.element.style.opacity = '0';
            notification.element.style.transform = 'translateX(100%) scale(0.8)';
            
            setTimeout(() => {
                if (notification.element.parentNode) {
                    notification.element.remove();
                }
                this.notifications = this.notifications.filter(n => n.id !== id);
            }, 300);
        }
    }

    setupEventListeners() {
        // Listen for global notification events
        window.addEventListener('showNotification', (e) => {
            this.show(e.detail.message, e.detail.type, e.detail.options);
        });
    }

    loadStoredNotifications() {
        // Load persistent notifications from localStorage if needed
        const stored = localStorage.getItem('horizon-notifications');
        if (stored) {
            try {
                const notifications = JSON.parse(stored);
                notifications.forEach(notif => {
                    if (notif.persistent) {
                        this.show(notif.message, notif.type, { autoRemove: false });
                    }
                });
            } catch (e) {
                console.warn('Failed to load stored notifications:', e);
            }
        }
    }

    clear() {
        this.notifications.forEach(notif => this.remove(notif.id));
    }
}

// Enhanced Search System
class SearchManager {
    constructor() {
        this.searchHistory = JSON.parse(localStorage.getItem('horizon-search-history') || '[]');
        this.searchResults = [];
        this.init();
    }

    init() {
        this.setupGlobalSearch();
        this.setupKeyboardShortcuts();
    }

    setupGlobalSearch() {
        // Create global search overlay
        const searchOverlay = document.createElement('div');
        searchOverlay.id = 'global-search-overlay';
        searchOverlay.className = 'search-overlay';
        searchOverlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(20px);
            z-index: 9999;
            display: none;
            align-items: flex-start;
            justify-content: center;
            padding-top: 10vh;
        `;

        searchOverlay.innerHTML = `
            <div style="
                background: linear-gradient(145deg, 
                    rgba(255, 255, 255, 0.12) 0%, 
                    rgba(255, 255, 255, 0.08) 100%);
                backdrop-filter: blur(40px) saturate(180%);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 24px;
                padding: 32px;
                width: 90%;
                max-width: 600px;
                box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
            ">
                <div style="
                    position: relative;
                    margin-bottom: 24px;
                ">
                    <i class="fas fa-search" style="
                        position: absolute;
                        left: 20px;
                        top: 50%;
                        transform: translateY(-50%);
                        color: rgba(255, 255, 255, 0.6);
                        font-size: 18px;
                    "></i>
                    <input type="text" id="global-search-input" placeholder="Search across all data..." style="
                        width: 100%;
                        padding: 18px 24px 18px 56px;
                        background: rgba(255, 255, 255, 0.06);
                        border: 2px solid rgba(255, 255, 255, 0.1);
                        border-radius: 50px;
                        color: rgba(255, 255, 255, 0.95);
                        font-size: 16px;
                        font-weight: 500;
                        outline: none;
                        transition: all 0.3s ease;
                    ">
                </div>
                <div id="search-results" style="
                    max-height: 400px;
                    overflow-y: auto;
                "></div>
                <div style="
                    margin-top: 16px;
                    padding-top: 16px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.6);
                    text-align: center;
                ">
                    Press <kbd style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">ESC</kbd> to close
                </div>
            </div>
        `;

        document.body.appendChild(searchOverlay);

        // Setup search input
        const searchInput = document.getElementById('global-search-input');
        searchInput.addEventListener('input', (e) => {
            this.performSearch(e.target.value);
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSearch();
            }
        });

        // Close on overlay click
        searchOverlay.addEventListener('click', (e) => {
            if (e.target === searchOverlay) {
                this.closeSearch();
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K to open search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.openSearch();
            }
            
            // Escape to close search
            if (e.key === 'Escape') {
                this.closeSearch();
            }
        });
    }

    openSearch() {
        const overlay = document.getElementById('global-search-overlay');
        const input = document.getElementById('global-search-input');
        
        overlay.style.display = 'flex';
        setTimeout(() => {
            input.focus();
        }, 100);
    }

    closeSearch() {
        const overlay = document.getElementById('global-search-overlay');
        overlay.style.display = 'none';
        
        // Clear search
        document.getElementById('global-search-input').value = '';
        document.getElementById('search-results').innerHTML = '';
    }

    async performSearch(query) {
        if (!query || query.length < 2) {
            document.getElementById('search-results').innerHTML = '';
            return;
        }

        // Add to search history
        if (!this.searchHistory.includes(query)) {
            this.searchHistory.unshift(query);
            this.searchHistory = this.searchHistory.slice(0, 10); // Keep last 10
            localStorage.setItem('horizon-search-history', JSON.stringify(this.searchHistory));
        }

        // Simulate search results (in real implementation, this would query your data)
        const results = await this.searchData(query);
        this.displayResults(results);
    }

    async searchData(query) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 200));

        const mockResults = [
            {
                type: 'project',
                title: 'Network Infrastructure Upgrade',
                description: 'Comprehensive upgrade of network infrastructure across all Turkish facilities',
                url: 'pages/projects.html',
                relevance: 0.95
            },
            {
                type: 'country',
                title: 'Türkiye Operations',
                description: '859 users, 632 devices, 20 locations',
                url: 'pages/country-detail.html?country=TR',
                relevance: 0.88
            },
            {
                type: 'asset',
                title: 'Server Infrastructure',
                description: '156 total servers across all regions',
                url: 'pages/assets.html',
                relevance: 0.75
            }
        ];

        // Filter based on query
        return mockResults.filter(result => 
            result.title.toLowerCase().includes(query.toLowerCase()) ||
            result.description.toLowerCase().includes(query.toLowerCase())
        );
    }

    displayResults(results) {
        const container = document.getElementById('search-results');
        
        if (results.length === 0) {
            container.innerHTML = `
                <div style="
                    text-align: center;
                    padding: 40px 20px;
                    color: rgba(255, 255, 255, 0.6);
                ">
                    <i class="fas fa-search" style="font-size: 48px; margin-bottom: 16px; opacity: 0.4;"></i>
                    <div>No results found</div>
                </div>
            `;
            return;
        }

        container.innerHTML = results.map(result => `
            <div style="
                padding: 16px;
                margin-bottom: 8px;
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
            " onmouseover="this.style.background='rgba(255,255,255,0.08)'; this.style.borderColor='rgba(132,204,22,0.3)'"
               onmouseout="this.style.background='rgba(255,255,255,0.04)'; this.style.borderColor='rgba(255,255,255,0.08)'"
               onclick="window.location.href='${result.url}'">
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 8px;
                ">
                    <span style="
                        background: rgba(132, 204, 22, 0.2);
                        color: #84cc16;
                        padding: 4px 8px;
                        border-radius: 6px;
                        font-size: 10px;
                        text-transform: uppercase;
                        font-weight: 600;
                    ">${result.type}</span>
                    <div style="
                        font-size: 16px;
                        font-weight: 600;
                        color: rgba(255, 255, 255, 0.95);
                    ">${result.title}</div>
                </div>
                <div style="
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.7);
                    line-height: 1.4;
                ">${result.description}</div>
            </div>
        `).join('');
    }
}

// Performance Monitor
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            pageLoad: 0,
            apiCalls: [],
            memoryUsage: 0,
            renderTime: 0
        };
        this.init();
    }

    init() {
        this.measurePageLoad();
        this.startMemoryMonitoring();
        this.setupPerformanceObserver();
    }

    measurePageLoad() {
        window.addEventListener('load', () => {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            this.metrics.pageLoad = loadTime;
            
            console.log(`Page loaded in ${loadTime}ms`);
            
            // Show performance notification for slow loads
            if (loadTime > 3000) {
                notificationManager.show(
                    'Page loaded slower than expected',
                    'warning',
                    { subtitle: `Load time: ${(loadTime/1000).toFixed(1)}s` }
                );
            }
        });
    }

    startMemoryMonitoring() {
        if (performance.memory) {
            setInterval(() => {
                const memory = performance.memory;
                this.metrics.memoryUsage = {
                    used: Math.round(memory.usedJSHeapSize / 1048576), // MB
                    total: Math.round(memory.totalJSHeapSize / 1048576),
                    limit: Math.round(memory.jsHeapSizeLimit / 1048576)
                };
                
                // Warn if memory usage is high
                const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
                if (usagePercent > 80) {
                    console.warn(`High memory usage: ${usagePercent.toFixed(1)}%`);
                }
            }, 10000); // Check every 10 seconds
        }
    }

    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.entryType === 'navigation') {
                        this.metrics.renderTime = entry.loadEventEnd - entry.loadEventStart;
                    }
                });
            });
            
            observer.observe({ entryTypes: ['navigation'] });
        }
    }

    trackApiCall(url, duration, status) {
        this.metrics.apiCalls.push({
            url,
            duration,
            status,
            timestamp: new Date()
        });
        
        // Keep only last 50 API calls
        if (this.metrics.apiCalls.length > 50) {
            this.metrics.apiCalls = this.metrics.apiCalls.slice(-50);
        }
        
        // Log slow API calls
        if (duration > 2000) {
            console.warn(`Slow API call: ${url} took ${duration}ms`);
        }
    }

    getMetrics() {
        return {
            ...this.metrics,
            timestamp: new Date()
        };
    }
}

// Initialize Enhanced Features
let themeManager, notificationManager, searchManager, performanceMonitor;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize enhanced features
    themeManager = new ThemeManager();
    notificationManager = new NotificationManager();
    searchManager = new SearchManager();
    performanceMonitor = new PerformanceMonitor();
    
    console.log('🚀 HORIZON Enhanced Features Initialized');
    
    // Show welcome notification
    setTimeout(() => {
        notificationManager.show(
            'Welcome to HORIZON Dashboard',
            'success',
            { 
                subtitle: 'Press Ctrl+K to search across all data',
                duration: 6000
            }
        );
    }, 1000);
    
    // Setup global search trigger
    const searchButtons = document.querySelectorAll('[title="Search"]');
    searchButtons.forEach(button => {
        button.addEventListener('click', () => {
            searchManager.openSearch();
        });
    });
});

// Global helper functions
function showNotification(message, type = 'info', options = {}) {
    if (notificationManager) {
        return notificationManager.show(message, type, options);
    }
}

function toggleTheme() {
    if (themeManager) {
        themeManager.toggle();
    }
}

function openGlobalSearch() {
    if (searchManager) {
        searchManager.openSearch();
    }
}

// Export for global use
window.HorizonEnhanced = {
    themeManager,
    notificationManager,
    searchManager,
    performanceMonitor,
    showNotification,
    toggleTheme,
    openGlobalSearch
};