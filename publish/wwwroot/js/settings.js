// ========== SETTINGS PAGE JAVASCRIPT ========== //
// Version: 1.0.1 - Path Fixed
// Manages user preferences with backend persistence

'use strict';

// API Base URL
const API_BASE = window.location.origin + '/Horizon/api';

// Current user data
let currentUser = null;
let userSettings = {};

// Initialize settings page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔧 Settings page initializing...');
    
    // Get current user
    currentUser = window.authService.getCurrentUser();
    
    if (!currentUser) {
        console.error('❌ No user session found');
        window.location.href = 'login.html';
        return;
    }
    
    console.log('👤 Current user:', currentUser.name);
    
    // Load user settings
    await loadSettings();
    
    // Display user info
    displayUserInfo();
    
    console.log('✅ Settings page initialized');
});

// Display user information
function displayUserInfo() {
    const userEmail = document.getElementById('userEmail');
    const lastLoginTime = document.getElementById('lastLoginTime');
    
    if (userEmail) {
        userEmail.textContent = currentUser.email || 'No email set';
    }
    
    if (lastLoginTime && currentUser.lastLogin) {
        const loginDate = new Date(currentUser.lastLogin);
        lastLoginTime.textContent = formatRelativeTime(loginDate);
    }
}

async function loadSettings() {
    try {
        const currentUser = window.authService?.getCurrentUser();
        if (!currentUser) {
            console.warn('⚠️ No current user');
            return;
        }

        console.log('📥 Loading user settings...');
        const apiUrl = `/Horizon/api/users/settings/${currentUser.fedexId}`;
        console.log('🔗 API URL:', apiUrl);
        
        // 🔥 TOKEN İLE REQUEST
        const response = await window.authService.authorizedFetch(apiUrl, {
            method: 'GET'
        });

        if (response.status === 401) {
            console.warn('⚠️ Settings not found (401), using defaults');
            applySettings({});
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        if (data.success && data.settings) {
            console.log('✅ Settings loaded:', data.settings);
            applySettings(data.settings);
        } else {
            console.warn('⚠️ No settings found, using defaults');
            applySettings({});
        }
        
    } catch (error) {
        console.error('❌ Error loading settings:', error);
        applySettings({});
    }
}

// Get default settings
function getDefaultSettings() {
    return {
        emailNotifications: true,
        projectNotifications: true,
        systemAlerts: true,
        timezone: 'auto',
        dateFormat: 'DD/MM/YYYY',
        compactMode: false
    };
}

// Apply loaded settings to UI
function applySettingsToUI() {
    // Notifications
    const emailNotif = document.getElementById('emailNotifications');
    const projectNotif = document.getElementById('projectNotifications');
    const systemAlerts = document.getElementById('systemAlerts');
    
    if (emailNotif) emailNotif.checked = userSettings.emailNotifications || false;
    if (projectNotif) projectNotif.checked = userSettings.projectNotifications || false;
    if (systemAlerts) systemAlerts.checked = userSettings.systemAlerts || false;
    
    // System preferences
    const timezone = document.getElementById('timezoneSelect');
    const dateFormat = document.getElementById('dateFormat');
    const compactMode = document.getElementById('compactMode');
    
    if (timezone) timezone.value = userSettings.timezone || 'auto';
    if (dateFormat) dateFormat.value = userSettings.dateFormat || 'DD/MM/YYYY';
    if (compactMode) compactMode.checked = userSettings.compactMode || false;
}

// Save settings to backend
async function saveSettings() {
    try {
        // Collect current settings from UI
        const settings = {
            fedexId: currentUser.fedexId,
            emailNotifications: document.getElementById('emailNotifications')?.checked || false,
            projectNotifications: document.getElementById('projectNotifications')?.checked || false,
            systemAlerts: document.getElementById('systemAlerts')?.checked || false,
            timezone: document.getElementById('timezoneSelect')?.value || 'auto',
            dateFormat: document.getElementById('dateFormat')?.value || 'DD/MM/YYYY',
            compactMode: document.getElementById('compactMode')?.checked || false
        };
        
        console.log('💾 Saving settings:', settings);
        console.log('🔗 API URL:', `${API_BASE}/users/settings`);
        
        const response = await fetch(`${API_BASE}/users/settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });
        
        if (response.ok) {
            console.log('✅ Settings saved successfully');
            showSaveStatus(true);
            userSettings = settings;
        } else {
            const errorText = await response.text();
            console.error('❌ Save failed:', response.status, errorText);
            throw new Error('Failed to save settings');
        }
        
    } catch (error) {
        console.error('❌ Error saving settings:', error);
        showSaveStatus(false);
    }
}

// Show save status notification
function showSaveStatus(success) {
    const statusEl = document.getElementById('saveStatus');
    
    if (!statusEl) return;
    
    if (success) {
        statusEl.innerHTML = '<i class="fas fa-check-circle"></i><span>Settings saved successfully</span>';
        statusEl.style.background = 'rgba(34, 197, 94, 0.15)';
        statusEl.style.borderColor = 'rgba(34, 197, 94, 0.3)';
        statusEl.style.color = '#22c55e';
    } else {
        statusEl.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>Failed to save settings</span>';
        statusEl.style.background = 'rgba(239, 68, 68, 0.15)';
        statusEl.style.borderColor = 'rgba(239, 68, 68, 0.3)';
        statusEl.style.color = '#ef4444';
    }
    
    statusEl.style.display = 'flex';
    
    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 3000);
}

// Password change modal
function showPasswordChangeModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closePasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.classList.remove('active');
        document.getElementById('passwordChangeForm').reset();
    }
}

// Handle password change
async function handlePasswordChange(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (newPassword !== confirmPassword) {
        alert('❌ New passwords do not match!');
        return;
    }
    
    if (newPassword.length < 8) {
        alert('❌ Password must be at least 8 characters!');
        return;
    }
    
    try {
        console.log('🔐 Changing password...');
        
        // Use auth service to change password
        await window.authService.changePassword(currentUser.fedexId, newPassword);
        
        alert('✅ Password changed successfully!');
        closePasswordModal();
        
    } catch (error) {
        console.error('❌ Password change error:', error);
        alert('❌ ' + (error.message || 'Failed to change password'));
    }
}

// View session history
function viewSessions() {
    const loginTime = currentUser.loginTime || currentUser.lastLogin || 'Unknown';
    alert(`📊 Session History\n\nCurrent Session:\nLogin: ${loginTime}\nDevice: Browser\n\nSession history feature coming soon!`);
}

// Export settings
function exportSettings() {
    const data = {
        user: currentUser.name,
        fedexId: currentUser.fedexId,
        settings: userSettings,
        exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `horizon-settings-${currentUser.fedexId}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    console.log('📥 Settings exported');
}

// Reset settings to defaults
async function resetSettings() {
    if (!confirm('⚠️ Are you sure you want to reset all settings to default?')) {
        return;
    }
    
    userSettings = getDefaultSettings();
    applySettingsToUI();
    await saveSettings();
    
    alert('✅ Settings reset to defaults');
}

// Format relative time
function formatRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
}

// Make functions globally available
window.saveSettings = saveSettings;
window.showPasswordChangeModal = showPasswordChangeModal;
window.closePasswordModal = closePasswordModal;
window.handlePasswordChange = handlePasswordChange;
window.viewSessions = viewSessions;
window.exportSettings = exportSettings;
window.resetSettings = resetSettings;

console.log('✅ Settings.js loaded');