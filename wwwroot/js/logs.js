// ========== HORIZON LOGGING SYSTEM ========== //
// Version: 4.0.0 - ASP.NET Core Compatible

'use strict';

const LOG_CONFIG = {
    API_ENDPOINT: '/Horizon/api/logs',
    ENABLED: true,
    LEVELS: {
        AUTH: 'AUTH',
        ERROR: 'ERROR',
        SECURITY: 'SECURITY'
    }
};

class HorizonLogger {
    
    // ========== CORE LOG METHOD ========== //
    async log(level, event, details = {}) {
        if (!LOG_CONFIG.ENABLED) return;

        const logEntry = {
            timestamp: new Date().toISOString(),
            level: level,
            event: event,
            user: details.username || this.getCurrentUser(),
            success: details.success !== undefined ? details.success : null,
            message: details.message || '',
            data: details.data || null,
            
            // ✅ BROWSER & DEVICE INFO
            userAgent: navigator.userAgent,
            browserLanguage: navigator.language,
            platform: navigator.platform,
            screenResolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            referrer: document.referrer || 'direct',
            pageUrl: window.location.pathname,
            
            // ✅ SESSION INFO
            sessionId: this.getSessionId(),
            sessionDuration: details.sessionDuration || null
        };

        // Console'da göster
        this.consoleOutput(logEntry);

        // Server'a gönder
        await this.sendLog(logEntry);

        return logEntry;
    }

    // ========== SEND TO SERVER ========== //
    async sendLog(logEntry) {
        try {
            const response = await fetch(LOG_CONFIG.API_ENDPOINT, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify(logEntry)
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`✅ Log saved to ${result.file}`);
            }
        } catch (error) {
            console.warn('⚠️ Log send error:', error.message);
        }
    }

    // ========== AUTH LOGS ========== //
    
    logLogin(username) {
        // Login başarısında session başlangıç zamanını kaydet
        sessionStorage.setItem('sessionStartTime', Date.now());
        
        return this.log(LOG_CONFIG.LEVELS.AUTH, 'LOGIN_SUCCESS', {
            username: username,
            success: true,
            message: `User ${username} logged in successfully`
        });
    }

    logLoginFailed(username, reason = 'Invalid credentials') {
        return this.log(LOG_CONFIG.LEVELS.AUTH, 'LOGIN_FAILED', {
            username: username,
            success: false,
            message: `Failed login attempt for ${username}`,
            data: { reason: reason }
        });
    }
	
	logAccountLocked(username) {
    return this.log(LOG_CONFIG.LEVELS.SECURITY, 'ACCOUNT_LOCKED', {
        username: username,
        success: false,
        message: `Account locked due to too many failed attempts: ${username}`
    });
}

    logLogout(username) {
        // Session süresini hesapla
        const startTime = sessionStorage.getItem('sessionStartTime');
        let sessionDuration = null;
        
        if (startTime) {
            const duration = Date.now() - parseInt(startTime);
            sessionDuration = Math.round(duration / 1000); // saniye cinsinden
        }
        
        return this.log(LOG_CONFIG.LEVELS.AUTH, 'LOGOUT', {
            username: username,
            success: true,
            message: `User ${username} logged out`,
            sessionDuration: sessionDuration
        });
    }

    logSessionExpired(username) {
        const startTime = sessionStorage.getItem('sessionStartTime');
        let sessionDuration = null;
        
        if (startTime) {
            const duration = Date.now() - parseInt(startTime);
            sessionDuration = Math.round(duration / 1000);
        }
        
        return this.log(LOG_CONFIG.LEVELS.AUTH, 'SESSION_EXPIRED', {
            username: username,
            success: false,
            message: `Session expired for user ${username}`,
            sessionDuration: sessionDuration
        });
    }

    logPasswordChange(username, changeType = 'user_initiated') {
        return this.log(LOG_CONFIG.LEVELS.SECURITY, 'PASSWORD_CHANGED', {
            username: username,
            success: true,
            message: `Password changed for ${username}`,
            data: { changeType: changeType } // 'user_initiated', 'forced', 'reset'
        });
    }

    logPasswordReset(username, requestedBy = 'self') {
        return this.log(LOG_CONFIG.LEVELS.SECURITY, 'PASSWORD_RESET_REQUESTED', {
            username: username,
            success: true,
            message: `Password reset requested for ${username}`,
            data: { requestedBy: requestedBy } // 'self', 'admin', 'system'
        });
    }

    logUnauthorized(username, attemptedResource) {
        return this.log(LOG_CONFIG.LEVELS.SECURITY, 'UNAUTHORIZED_ACCESS', {
            username: username || 'anonymous',
            success: false,
            message: `Unauthorized access attempt to ${attemptedResource}`,
            data: { 
                attemptedResource: attemptedResource,
                userRole: this.getCurrentUserRole()
            }
        });
    }

    // ========== ERROR LOGS ========== //
    
    logError(errorType, message, errorData = null) {
        return this.log(LOG_CONFIG.LEVELS.ERROR, errorType, {
            success: false,
            message: message,
            data: errorData
        });
    }

    logServerError(endpoint, error) {
        return this.log(LOG_CONFIG.LEVELS.ERROR, 'SERVER_ERROR', {
            success: false,
            message: `Server error at ${endpoint}`,
            data: { 
                endpoint: endpoint, 
                error: error.message || error.toString() 
            }
        });
    }

    // ========== HELPERS ========== //
    
    getCurrentUser() {
        try {
            if (window.authService?.getCurrentUser) {
                const user = window.authService.getCurrentUser();
                return user ? (user.name || user.fedexId) : 'anonymous';
            }
        } catch (error) {
            // Silent fail
        }
        return 'anonymous';
    }

    getCurrentUserRole() {
        try {
            if (window.authService?.getCurrentUser) {
                const user = window.authService.getCurrentUser();
                return user?.role || 'unknown';
            }
        } catch (error) {
            // Silent fail
        }
        return 'unknown';
    }

    getToken() {
        try {
            if (window.authService?.getToken) {
                return window.authService.getToken();
            }
        } catch (error) {
            // Silent fail
        }
        return null;
    }

    getSessionId() {
        // Session ID oluştur veya mevcut olanı al
        let sessionId = sessionStorage.getItem('horizonSessionId');
        
        if (!sessionId) {
            sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('horizonSessionId', sessionId);
        }
        
        return sessionId;
    }

    consoleOutput(logEntry) {
        const emoji = {
            'AUTH': '🔐',
            'ERROR': '❌',
            'SECURITY': '🚨'
        };

        const color = {
            'AUTH': logEntry.success ? 'color: #10b981' : 'color: #ef4444',
            'ERROR': 'color: #ef4444; font-weight: bold',
            'SECURITY': 'color: #f59e0b; font-weight: bold'
        };

        console.log(
            `%c${emoji[logEntry.level] || '📝'} [${logEntry.level}] ${logEntry.event}`,
            color[logEntry.level] || '',
            `\n  User: ${logEntry.user}`,
            `\n  Time: ${new Date(logEntry.timestamp).toLocaleString()}`,
            `\n  Message: ${logEntry.message}`,
            logEntry.sessionDuration ? `\n  Session: ${logEntry.sessionDuration}s` : '',
            logEntry.data ? `\n  Data:` : '',
            logEntry.data || ''
        );
    }
}

// ========== GLOBAL INSTANCE ========== //
const horizonLogger = new HorizonLogger();
window.horizonLogger = horizonLogger;

console.log('✅ HORIZON Logger Initialized');
console.log('📡 Endpoint:', LOG_CONFIG.API_ENDPOINT);
console.log('📅 Daily log files: logs_YYYY-MM-DD.json');