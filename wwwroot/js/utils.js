/* ========== HORIZON UTILITY FUNCTIONS ========== */

// Date & Time Utilities
const DateUtils = {
    /**
     * Format date to readable string
     * @param {Date|string} date - Date to format
     * @param {string} format - Format type ('short', 'long', 'iso')
     * @returns {string} Formatted date string
     */
    formatDate(date, format = 'short') {
        const d = new Date(date);
        const options = {
            short: { year: 'numeric', month: 'short', day: 'numeric' },
            long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
            iso: { year: 'numeric', month: '2-digit', day: '2-digit' }
        };
        
        if (format === 'iso') {
            return d.toISOString().split('T')[0];
        }
        
        return d.toLocaleDateString('en-US', options[format] || options.short);
    },

    /**
     * Calculate time difference
     * @param {Date|string} startDate - Start date
     * @param {Date|string} endDate - End date
     * @returns {object} Difference object with days, hours, minutes
     */
    timeDifference(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diff = Math.abs(end - start);
        
        return {
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
            total: diff
        };
    },

    /**
     * Check if date is today
     * @param {Date|string} date - Date to check
     * @returns {boolean} True if date is today
     */
    isToday(date) {
        const today = new Date();
        const checkDate = new Date(date);
        return today.toDateString() === checkDate.toDateString();
    },

    /**
     * Get relative time string (e.g., "2 hours ago")
     * @param {Date|string} date - Date to compare
     * @returns {string} Relative time string
     */
    getRelativeTime(date) {
        const now = new Date();
        const past = new Date(date);
        const diff = now - past;
        
        const minute = 60 * 1000;
        const hour = minute * 60;
        const day = hour * 24;
        const week = day * 7;
        const month = day * 30;
        const year = day * 365;
        
        if (diff < minute) return 'just now';
        if (diff < hour) return `${Math.floor(diff / minute)} minutes ago`;
        if (diff < day) return `${Math.floor(diff / hour)} hours ago`;
        if (diff < week) return `${Math.floor(diff / day)} days ago`;
        if (diff < month) return `${Math.floor(diff / week)} weeks ago`;
        if (diff < year) return `${Math.floor(diff / month)} months ago`;
        return `${Math.floor(diff / year)} years ago`;
    }
};

// Number & Currency Utilities
const NumberUtils = {
    /**
     * Format number with localization
     * @param {number} num - Number to format
     * @param {object} options - Formatting options
     * @returns {string} Formatted number
     */
    formatNumber(num, options = {}) {
        const defaults = {
            locale: 'en-US',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        };
        
        return new Intl.NumberFormat(options.locale || defaults.locale, {
            ...defaults,
            ...options
        }).format(num);
    },

    /**
     * Format currency with multiple currency support
     * @param {number} amount - Amount to format
     * @param {string} currency - Currency code (EUR, USD, TRY)
     * @param {string} locale - Locale for formatting
     * @returns {string} Formatted currency string
     */
    formatCurrency(amount, currency = 'EUR', locale = 'en-US') {
        const exchangeRates = {
            EUR: 1,
            USD: 1.1,
            TRY: 30.5
        };
        
        const convertedAmount = amount * (exchangeRates[currency] || 1);
        
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(convertedAmount);
    },

    /**
     * Convert number to short format (1K, 1M, 1B)
     * @param {number} num - Number to convert
     * @returns {string} Short format string
     */
    toShortFormat(num) {
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return num.toString();
    },

    /**
     * Calculate percentage
     * @param {number} value - Current value
     * @param {number} total - Total value
     * @returns {number} Percentage value
     */
    calculatePercentage(value, total) {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
    },

    /**
     * Generate random number within range
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random number
     */
    randomInRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
};

// String Utilities
const StringUtils = {
    /**
     * Capitalize first letter of each word
     * @param {string} str - String to capitalize
     * @returns {string} Capitalized string
     */
    toTitleCase(str) {
        return str.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    },

    /**
     * Convert string to kebab-case
     * @param {string} str - String to convert
     * @returns {string} Kebab-case string
     */
    toKebabCase(str) {
        return str
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/[\s_]+/g, '-')
            .toLowerCase();
    },

    /**
     * Truncate string with ellipsis
     * @param {string} str - String to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated string
     */
    truncate(str, maxLength = 50) {
        if (str.length <= maxLength) return str;
        return str.substr(0, maxLength - 3) + '...';
    },

    /**
     * Generate random ID
     * @param {number} length - ID length
     * @returns {string} Random ID
     */
    generateId(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    /**
     * Clean and validate email
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Extract initials from name
     * @param {string} name - Full name
     * @returns {string} Initials
     */
    getInitials(name) {
        return name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .join('')
            .substr(0, 2);
    }
};

// DOM Utilities
const DOMUtils = {
    /**
     * Create element with attributes and children
     * @param {string} tag - Element tag name
     * @param {object} attributes - Element attributes
     * @param {Array|string} children - Child elements or text
     * @returns {HTMLElement} Created element
     */
    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        // Set attributes
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else {
                element.setAttribute(key, value);
            }
        });
        
        // Add children
        if (typeof children === 'string') {
            element.textContent = children;
        } else if (Array.isArray(children)) {
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else if (child instanceof HTMLElement) {
                    element.appendChild(child);
                }
            });
        }
        
        return element;
    },

    /**
     * Find element with retry mechanism
     * @param {string} selector - CSS selector
     * @param {number} timeout - Timeout in milliseconds
     * @returns {Promise<HTMLElement>} Found element
     */
    waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }
            
            const observer = new MutationObserver((mutations, obs) => {
                const element = document.querySelector(selector);
                if (element) {
                    obs.disconnect();
                    resolve(element);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            }, timeout);
        });
    },

    /**
     * Smooth scroll to element
     * @param {string|HTMLElement} target - Target element or selector
     * @param {object} options - Scroll options
     */
    scrollTo(target, options = {}) {
        const element = typeof target === 'string' 
            ? document.querySelector(target) 
            : target;
            
        if (!element) return;
        
        const defaults = {
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
        };
        
        element.scrollIntoView({ ...defaults, ...options });
    },

    /**
     * Check if element is in viewport
     * @param {HTMLElement} element - Element to check
     * @returns {boolean} True if in viewport
     */
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth
        );
    },

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} Success status
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                document.execCommand('copy');
                return true;
            } catch (err) {
                return false;
            } finally {
                document.body.removeChild(textArea);
            }
        }
    }
};

// Storage Utilities
const StorageUtils = {
    /**
     * Get item from localStorage with JSON parsing
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if not found
     * @returns {*} Stored value or default
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn(`Error reading from localStorage: ${key}`, error);
            return defaultValue;
        }
    },

    /**
     * Set item in localStorage with JSON stringification
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @returns {boolean} Success status
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn(`Error writing to localStorage: ${key}`, error);
            return false;
        }
    },

    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn(`Error removing from localStorage: ${key}`, error);
        }
    },

    /**
     * Clear all localStorage
     */
    clear() {
        try {
            localStorage.clear();
        } catch (error) {
            console.warn('Error clearing localStorage', error);
        }
    },

    /**
     * Get storage usage information
     * @returns {object} Storage usage stats
     */
    getUsage() {
        let total = 0;
        const items = {};
        
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                const size = localStorage[key].length;
                items[key] = size;
                total += size;
            }
        }
        
        return {
            total: total,
            items: items,
            totalMB: (total / 1024 / 1024).toFixed(2)
        };
    }
};

// API Utilities
const APIUtils = {
    /**
     * Make HTTP request with timeout and error handling
     * @param {string} url - Request URL
     * @param {object} options - Request options
     * @returns {Promise<object>} Response data
     */
    async request(url, options = {}) {
        const defaults = {
            method: 'GET',
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const config = { ...defaults, ...options };
        
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);
        
        try {
            const response = await fetch(url, {
                ...config,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return await response.text();
            }
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            
            throw error;
        }
    },

    /**
     * GET request
     * @param {string} url - Request URL
     * @param {object} options - Request options
     * @returns {Promise<object>} Response data
     */
    get(url, options = {}) {
        return this.request(url, { ...options, method: 'GET' });
    },

    /**
     * POST request
     * @param {string} url - Request URL
     * @param {object} data - Request data
     * @param {object} options - Request options
     * @returns {Promise<object>} Response data
     */
    post(url, data = {}, options = {}) {
        return this.request(url, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    /**
     * PUT request
     * @param {string} url - Request URL
     * @param {object} data - Request data
     * @param {object} options - Request options
     * @returns {Promise<object>} Response data
     */
    put(url, data = {}, options = {}) {
        return this.request(url, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    /**
     * DELETE request
     * @param {string} url - Request URL
     * @param {object} options - Request options
     * @returns {Promise<object>} Response data
     */
    delete(url, options = {}) {
        return this.request(url, { ...options, method: 'DELETE' });
    }
};

// Validation Utilities
const ValidationUtils = {
    /**
     * Validate required fields
     * @param {object} data - Data to validate
     * @param {Array} requiredFields - Required field names
     * @returns {object} Validation result
     */
    validateRequired(data, requiredFields) {
        const errors = [];
        
        requiredFields.forEach(field => {
            if (!data[field] || data[field].toString().trim() === '') {
                errors.push(`${field} is required`);
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Validate URL format
     * @param {string} url - URL to validate
     * @returns {boolean} True if valid
     */
    isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Validate phone number
     * @param {string} phone - Phone number to validate
     * @returns {boolean} True if valid
     */
    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    },

    /**
     * Validate date range
     * @param {string} startDate - Start date
     * @param {string} endDate - End date
     * @returns {object} Validation result
     */
    validateDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        const errors = [];
        
        if (isNaN(start.getTime())) {
            errors.push('Invalid start date');
        }
        
        if (isNaN(end.getTime())) {
            errors.push('Invalid end date');
        }
        
        if (start >= end) {
            errors.push('End date must be after start date');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
};

// Export utilities for global use
window.HorizonUtils = {
    DateUtils,
    NumberUtils,
    StringUtils,
    DOMUtils,
    StorageUtils,
    APIUtils,
    ValidationUtils
};

// Convenient global shortcuts
window.formatCurrency = NumberUtils.formatCurrency;
window.formatDate = DateUtils.formatDate;
window.showNotification = window.showNotification || function(msg, type) {
    console.log(`${type}: ${msg}`);
};