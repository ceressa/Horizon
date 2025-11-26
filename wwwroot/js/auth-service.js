// ========== AUTHENTICATION SERVICE ========== //
// HORIZON - Secure JWT Authentication System
// Version: 3.1.0

'use strict';

class AuthService {
    constructor() {
        this.currentUser = null;
        this.API_BASE = '/Horizon/api/users'; // 🔥 Absolute API path
    }

    // ---------- PASSWORD HASH ----------
    async hashPassword(password) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error) {
            console.error('❌ Hash error:', error);
            throw new Error('Password hashing failed');
        }
    }

    // ---------- LOGIN ----------
async login(fedexId, password) {
    try {
        console.log('🔐 Attempting JWT login for:', fedexId);

        const passwordHash = await this.hashPassword(password);

        const response = await fetch(`${this.API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fedexId, passwordHash })
        });

        if (!response.ok) {
            let apiErrMsg = `Login failed: HTTP ${response.status}`;
            try {
                const errBody = await response.json();
                if (errBody?.message) apiErrMsg = errBody.message;
            } catch (_) { }

            if (window.horizonLogger) {
                window.horizonLogger.logLoginFailed(fedexId, apiErrMsg);
            }

            throw new Error(apiErrMsg);
        }

        const result = await response.json();

        if (!result.success || !result.token) {
            const apiErrMsg = result?.message || 'Invalid credentials';
            if (window.horizonLogger) {
                window.horizonLogger.logLoginFailed(fedexId, apiErrMsg);
            }
            throw new Error(apiErrMsg);
        }

        // Store token
        this.storeToken(result.token);
        this.currentUser = this.decodeToken(result.token);

        // LOG: Login Success
        if (window.horizonLogger) {
            window.horizonLogger.logLogin(fedexId);
        }

        // ✅ RETURN mustChangePassword
        return {
            success: true,
            requirePasswordChange: result.mustChangePassword || false,  // ✅ EKLE
            user: this.currentUser
        };

    } catch (error) {
        console.error('❌ Login error:', error);
        throw error;
    }
}


    // ---------- TOKEN MANAGEMENT ----------
    storeToken(token) {
        localStorage.setItem('horizonToken', token);
        console.log('🔐 Token stored in localStorage');
    }

    getToken() {
        return localStorage.getItem('horizonToken');
    }

    decodeToken(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            
            // Parse countries from comma-separated string
            let countries = [];
            if (payload.countries) {
                countries = payload.countries.split(',').filter(c => c.trim());
            }
            
            return {
                fedexId: payload.fedexId,
                name: payload.unique_name || payload.name || payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"],
                role: payload.role || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
                countries: countries,
                exp: payload.exp
            };
        } catch (error) {
            console.error('❌ Error decoding token:', error);
            return null;
        }
    }

    isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiry = payload.exp * 1000;
        const isValid = Date.now() < expiry;
        
        if (!isValid) {
            console.warn('⚠️ Token expired');
            
            // ✅ LOG: Session Expired
            if (window.horizonLogger) {
                const user = this.getCurrentUser();
                if (user) {
                    window.horizonLogger.logSessionExpired(user.name || user.fedexId);
                }
            }
            
            this.logout();
        }
        
        return isValid;
    } catch (error) {
        console.error('❌ Invalid token:', error);
        this.logout();
        return false;
    }
}

    getCurrentUser() {
        if (this.currentUser) return this.currentUser;
        
        const token = this.getToken();
        if (!token) return null;
        
        this.currentUser = this.decodeToken(token);
        return this.currentUser;
    }

    async logout() {
    console.log('🚪 Logging out...');
    
    // ✅ LOG: Logout (ÖNCE log gönder, SONRA redirect)
    if (window.horizonLogger) {
        const user = this.getCurrentUser();
        if (user) {
            try {
                await window.horizonLogger.logLogout(user.name || user.fedexId);
                // Log gönderildi, biraz bekle
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.warn('⚠️ Logout log failed:', error);
            }
        }
    }
    
    // Clear all storage
    localStorage.removeItem('horizonToken');
    localStorage.removeItem('horizon_user');
    sessionStorage.clear();
    
    // Redirect to login
    window.location.href = `${window.location.origin}/Horizon/pages/login.html`;
    
    return true;
}

    // ---------- PASSWORD CHANGE ----------
    async changePassword(fedexId, newPassword) {
    try {
        console.log('🔒 Changing password for:', fedexId);

        const validation = this.validatePasswordStrength(newPassword);
        if (!validation.isValid) throw new Error(validation.message);

        const newHash = await this.hashPassword(newPassword);
        
        const response = await fetch(`${this.API_BASE}/change-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fedexId,
                newPasswordHash: newHash
            })
        });

        if (!response.ok) {
            throw new Error(`Password change failed: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Password change failed');
        }

        // ✅ LOG: Password Changed
        if (window.horizonLogger) {
            window.horizonLogger.logPasswordChange(fedexId, 'user_initiated');
        }

        console.log('✅ Password changed successfully');
        return { success: true, message: 'Password updated successfully' };

    } catch (error) {
        console.error('❌ Password change error:', error);
        
        // ✅ LOG: Password Change Failed
        if (window.horizonLogger) {
            window.horizonLogger.logError('PASSWORD_CHANGE_FAILED', error.message, {
                fedexId: fedexId
            });
        }
        
        throw error;
    }
}

    // ---------- LOCKOUT MANAGEMENT ----------
    async getLockInfo(fedexId) {
        try {
            const response = await fetch(`${this.API_BASE}/check-lockout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fedexId })
            });
            
            if (response.ok) return await response.json();
            return { isLocked: false, remainingTime: 0 };
        } catch (error) {
            console.error('❌ Error checking lockout:', error);
            return { isLocked: false, remainingTime: 0 };
        }
    }

    async recordFailedAttempt(fedexId) {
        try {
            const response = await fetch(`${this.API_BASE}/record-failed-attempt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fedexId })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('📝 Failed attempt recorded:', result);
                return result;
            }

            return { remainingAttempts: 0, isLocked: false };
        } catch (error) {
            console.error('❌ Error recording failed attempt:', error);
            return { remainingAttempts: 0, isLocked: false };
        }
    }

    async clearFailedAttempts(fedexId) {
        try {
            const response = await fetch(`${this.API_BASE}/clear-failed-attempts`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({ fedexId })
            });
            
            if (response.ok) console.log('✅ Failed attempts cleared for:', fedexId);
        } catch (error) {
            console.error('❌ Error clearing failed attempts:', error);
        }
    }

    // ---------- PASSWORD VALIDATION ----------
validatePasswordStrength(password) {
    const minLength = 8;
    const hasNumber = /\d/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);

    if (password.length < minLength) {
        return {
            isValid: false,
            message: `Password must be at least ${minLength} characters`,
            strength: 'weak'
        };
    }

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (hasNumber) score++;
    if (hasUpperCase) score++;
    if (hasLowerCase) score++;

    const isValid = password.length >= 8 && hasNumber;

    return {
        isValid: isValid,
        message: isValid ? 'Password is acceptable' : 'Password must include at least one number',
        strength: score >= 4 ? 'strong' : score >= 3 ? 'medium' : 'weak'
    };
}

    // ---------- AUTHORIZED FETCH ----------
    async authorizedFetch(url, options = {}) {
        const token = this.getToken();
        const headers = {
            ...(options.headers || {}),
            'Authorization': token ? `Bearer ${token}` : ''
        };
        return fetch(url, { ...options, headers });
    }
}

// Initialize global auth service
window.authService = new AuthService();
console.log('✅ Horizon AuthService initialized');