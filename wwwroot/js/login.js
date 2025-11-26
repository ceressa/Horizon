'use strict';

/* ============================================
   LOGIN PAGE JAVASCRIPT
   ============================================ */

let pendingFedexId = null;
let pendingPassword = null; // Store current password for verification

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Login page initialized');
    initializeLoginPage();
});

function initializeLoginPage() {
    if (window.authService && window.authService.isAuthenticated()) {
        console.log('✅ User already authenticated, redirecting...');
        window.location.href = `${window.location.origin}/Horizon/index.html`;
        return;
    }
    
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    loginForm.addEventListener('submit', handleLogin);
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            togglePassword.innerHTML = `<i class="fas fa-eye${type === 'password' ? '' : '-slash'}"></i>`;
        });
    }
    
    const fedexIdInput = document.getElementById('fedexId');
    if (fedexIdInput) fedexIdInput.addEventListener('input', hideMessage);
    if (passwordInput) passwordInput.addEventListener('input', hideMessage);
    
    // ✅ PASSWORD CHANGE MODAL SETUP
    setupPasswordChangeModal();
    
    console.log('✅ Login page ready');
}

/* ============================================
   LOGIN HANDLER
   ============================================ */

async function handleLogin(event) {
    event.preventDefault();
    
    const fedexId = document.getElementById('fedexId').value.trim();
    const password = document.getElementById('password').value;
    const loginButton = document.getElementById('loginButton');
    
    if (!fedexId || !password) {
        showError('Please enter both FedEx ID and password');
        return;
    }
    
    loginButton.disabled = true;
    loginButton.innerHTML = '<span class="spinner"></span> Signing in...';
    
    try {
        console.log('🔐 Attempting login...');
        const result = await window.authService.login(fedexId, password);
        
        if (result.success) {
            const currentUser = window.authService.getCurrentUser();
            const firstName = currentUser?.name.split(' ')[0] || 'User';
            
            // ✅ CHECK IF PASSWORD CHANGE REQUIRED
            if (result.requirePasswordChange) {
                console.log('🔑 Password change required!');
                pendingFedexId = fedexId;
                pendingPassword = password; // Store for verification
                
                // ✅ GET PASSWORD CHANGE INFO
                await showPasswordChangeInfo(fedexId);
                
                showPasswordChangeModal();
                
                loginButton.disabled = false;
                loginButton.innerHTML = 'SIGN IN';
                return;
            }
            
            // ✅ NORMAL LOGIN - GO TO DASHBOARD
            showSuccess(`Welcome back, ${firstName}!`);
            
            setTimeout(() => {
                window.location.href = `${window.location.origin}/Horizon/index.html`;
            }, 1500);
        }
        
    } catch (error) {
        console.error('❌ Login failed:', error);
        handleLoginError(error, fedexId, loginButton);
    }
}

/* ============================================
   PASSWORD CHANGE INFO
   ============================================ */

async function showPasswordChangeInfo(fedexId) {
    try {
        const response = await window.authService.authorizedFetch(`/Horizon/api/users/profile/${fedexId}`);
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.profile) {
                const passwordChangedAt = data.profile.passwordChangedAt;
                const infoDiv = document.getElementById('passwordChangeInfo');
                const infoText = document.getElementById('passwordChangeText');
                
                if (infoDiv && infoText) {
                    if (passwordChangedAt) {
                        const changeDate = new Date(passwordChangedAt);
                        const formattedDate = changeDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                        infoText.textContent = `Password last changed: ${formattedDate}`;
                    } else {
                        infoText.textContent = 'Password last changed: Never (First login)';
                    }
                    
                    infoDiv.style.display = 'block';
                }
            }
        }
    } catch (error) {
        console.warn('⚠️ Could not fetch password change info:', error);
    }
}

/* ============================================
   PASSWORD CHANGE MODAL
   ============================================ */

function setupPasswordChangeModal() {
    const form = document.getElementById('passwordChangeForm');
    const newPasswordInput = document.getElementById('newPassword');
    const toggleCurrent = document.getElementById('toggleCurrentPassword');
    const toggleNew = document.getElementById('toggleNewPassword');
    const toggleConfirm = document.getElementById('toggleConfirmPassword');
    
    if (form) {
        form.addEventListener('submit', handlePasswordChangeSubmit);
    }
    
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', updatePasswordStrength);
    }
    
    if (toggleCurrent) {
        toggleCurrent.addEventListener('click', () => togglePasswordVisibility('currentPassword', 'toggleCurrentPassword'));
    }
    
    if (toggleNew) {
        toggleNew.addEventListener('click', () => togglePasswordVisibility('newPassword', 'toggleNewPassword'));
    }
    
    if (toggleConfirm) {
        toggleConfirm.addEventListener('click', () => togglePasswordVisibility('confirmPassword', 'toggleConfirmPassword'));
    }
}

function showPasswordChangeModal() {
    const modal = document.getElementById('passwordChangeModal');
    if (modal) {
        modal.style.display = 'flex';
        
        // Clear inputs
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        
        // Reset strength indicator
        const strengthIndicator = document.getElementById('strengthIndicator');
        const strengthText = document.getElementById('strengthText');
        if (strengthIndicator) strengthIndicator.className = 'strength-fill';
        if (strengthText) strengthText.textContent = 'Enter password';
        
        // Focus first input
        setTimeout(() => {
            document.getElementById('currentPassword').focus();
        }, 300);
    }
}

function hidePasswordChangeModal() {
    const modal = document.getElementById('passwordChangeModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Hide password change info
    const infoDiv = document.getElementById('passwordChangeInfo');
    if (infoDiv) {
        infoDiv.style.display = 'none';
    }
}

async function handlePasswordChangeSubmit(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const submitBtn = document.getElementById('modalSubmitBtn');
    
    // ✅ VERIFY CURRENT PASSWORD
    if (currentPassword !== pendingPassword) {
        showError('Current password is incorrect!');
        return;
    }
    
    // Validation
    if (newPassword !== confirmPassword) {
        showError('Passwords do not match!');
        return;
    }
    
    if (newPassword.length < 8) {
        showError('Password must be at least 8 characters!');
        return;
    }
    
    // ✅ CHECK IF NEW PASSWORD HAS A NUMBER
    if (!/\d/.test(newPassword)) {
        showError('Password must include at least one number!');
        return;
    }
    
    const validation = window.authService.validatePasswordStrength(newPassword);
    if (!validation.isValid) {
        showError(validation.message);
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Updating...';
    
    try {
        await window.authService.changePassword(pendingFedexId, newPassword);
        
        hidePasswordChangeModal();
        showSuccess('Password updated successfully! Redirecting...');
        
        setTimeout(() => {
            window.location.href = `${window.location.origin}/Horizon/index.html`;
        }, 1500);
        
    } catch (error) {
        console.error('❌ Password change failed:', error);
        showError(error.message || 'Failed to update password');
        
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Update Password';
    }
}

function togglePasswordVisibility(inputId, buttonId) {
    const input = document.getElementById(inputId);
    const button = document.getElementById(buttonId);
    
    if (input && button) {
        const type = input.type === 'password' ? 'text' : 'password';
        input.type = type;
        button.innerHTML = `<i class="fas fa-eye${type === 'password' ? '' : '-slash'}"></i>`;
    }
}

function updatePasswordStrength() {
    const password = document.getElementById('newPassword').value;
    const strengthIndicator = document.getElementById('strengthIndicator');
    const strengthText = document.getElementById('strengthText');
    
    if (!password) {
        strengthIndicator.className = 'strength-fill';
        strengthText.textContent = 'Enter password';
        strengthIndicator.parentElement.parentElement.style.display = 'none';
        return;
    }
    
    strengthIndicator.parentElement.parentElement.style.display = 'block';
    
    const validation = window.authService.validatePasswordStrength(password);
    
    strengthIndicator.className = `strength-fill strength-${validation.strength}`;
    
    if (validation.strength === 'weak') {
        strengthText.textContent = '⚠️ Weak Password';
        strengthText.style.color = '#ef4444';
    } else if (validation.strength === 'medium') {
        strengthText.textContent = '⚡ Medium Strength';
        strengthText.style.color = '#f59e0b';
    } else {
        strengthText.textContent = '✅ Strong Password';
        strengthText.style.color = '#22c55e';
    }
}

/* ============================================
   ERROR HANDLING
   ============================================ */

async function handleLoginError(error, fedexId, loginButton) {
    const errorMsg = error.message || 'Login failed';
    const hasLockInfo = window.authService && typeof window.authService.getLockInfo === 'function';
    
    // Check lockout first
    if (hasLockInfo) {
        const lockInfo = await window.authService.getLockInfo(fedexId);
        
        if (lockInfo && lockInfo.isLocked) {
            if (window.horizonLogger) {
                window.horizonLogger.logAccountLocked(fedexId);
            }
            
            if (lockInfo.remainingTime > 0) {
                const minutes = lockInfo.remainingTime;
                showError(`
                    <div class="error-icon">🔒</div>
                    <div class="error-title">Account Locked</div>
                    <div class="error-details">
                        Too many failed login attempts.<br>
                        Please wait <strong>${minutes} minute${minutes > 1 ? 's' : ''}</strong> before trying again.
                    </div>
                    <div class="error-help">
                        Need immediate access? Contact the developer:<br>
                        <a href="https://teams.microsoft.com/l/chat/0/0?users=ufuk.celikeloglu@fedex.com" 
                           class="help-link" target="_blank" rel="noopener noreferrer">
                            <i class="fab fa-microsoft"></i> Teams Chat with Ufuk
                        </a>
                        <a href="mailto:ufuk.celikeloglu@fedex.com" class="help-link">
                            <i class="fas fa-envelope"></i> Email
                        </a>
                    </div>
                `, true);
            } else {
                showError(`
                    <div class="error-icon">🔒</div>
                    <div class="error-title">Account Locked</div>
                    <div class="error-details">
                        Too many failed login attempts. Please try again later.
                    </div>
                    <div class="error-help">
                        Contact developer:<br>
                        <a href="https://teams.microsoft.com/l/chat/0/0?users=ufuk.celikeloglu@fedex.com" 
                           class="help-link" target="_blank" rel="noopener noreferrer">
                            <i class="fab fa-microsoft"></i> Teams Chat
                        </a>
                    </div>
                `, true);
            }
            
            loginButton.disabled = true;
            startLockoutCountdown(fedexId, loginButton);
            return;
        }
    }
    
    // Account locked (backend message - fallback)
    if (errorMsg.includes('Account locked') || errorMsg.includes('locked') || errorMsg.includes('Account is locked')) {
        if (window.horizonLogger) {
            window.horizonLogger.logAccountLocked(fedexId);
        }
        
        if (hasLockInfo) {
            const lockInfo = await window.authService.getLockInfo(fedexId);
            
            if (lockInfo && lockInfo.isLocked && lockInfo.remainingTime > 0) {
                const minutes = lockInfo.remainingTime;
                showError(`
                    <div class="error-icon">🔒</div>
                    <div class="error-title">Account Locked</div>
                    <div class="error-details">
                        Too many failed login attempts.<br>
                        Please wait <strong>${minutes} minute${minutes > 1 ? 's' : ''}</strong> before trying again.
                    </div>
                    <div class="error-help">
                        Need immediate access? Contact the developer:<br>
                        <a href="https://teams.microsoft.com/l/chat/0/0?users=ufuk.celikeloglu@fedex.com" 
                           class="help-link" target="_blank" rel="noopener noreferrer">
                            <i class="fab fa-microsoft"></i> Teams Chat with Ufuk
                        </a>
                        <a href="mailto:ufuk.celikeloglu@fedex.com" class="help-link">
                            <i class="fas fa-envelope"></i> Email
                        </a>
                    </div>
                `, true);
                
                loginButton.disabled = true;
                startLockoutCountdown(fedexId, loginButton);
                return;
            }
        }
        
        showError(`
            <div class="error-icon">🔒</div>
            <div class="error-title">Account Locked</div>
            <div class="error-details">
                Too many failed login attempts. Please try again later.
            </div>
            <div class="error-help">
                Contact developer:<br>
                <a href="https://teams.microsoft.com/l/chat/0/0?users=ufuk.celikeloglu@fedex.com" 
                   class="help-link" target="_blank" rel="noopener noreferrer">
                    <i class="fab fa-microsoft"></i> Teams Chat
                </a>
            </div>
        `, true);
        loginButton.disabled = true;
        return;
    }
    
    // Invalid credentials
    if (errorMsg.includes('Invalid credentials') || errorMsg.includes('Invalid')) {
        if (hasLockInfo) {
            const lockInfo = await window.authService.getLockInfo(fedexId);
            
            if (lockInfo && lockInfo.remainingAttempts !== undefined) {
                const remaining = lockInfo.remainingAttempts;
                
                if (remaining > 1) {
                    showError(`
                        <div class="error-icon">❌</div>
                        <div class="error-title">Invalid Credentials</div>
                        <div class="error-details">
                            Incorrect FedEx ID or password.<br>
                            <strong>${remaining} attempt${remaining > 1 ? 's' : ''} remaining</strong> before account lock.
                        </div>
                        <div class="error-help">
                            <a href="#" onclick="showPasswordHelp(); return false;" class="help-link">
                                <i class="fas fa-question-circle"></i> Forgot your password?
                            </a>
                        </div>
                    `, true);
                } else if (remaining === 1) {
                    showError(`
                        <div class="error-icon">⚠️</div>
                        <div class="error-title">Last Attempt Warning</div>
                        <div class="error-details">
                            This is your <strong>final attempt</strong>.<br>
                            Your account will be locked for 30 minutes if this fails.
                        </div>
                        <div class="error-help">
                            <a href="#" onclick="showPasswordHelp(); return false;" class="help-link">
                                <i class="fas fa-question-circle"></i> Need help?
                            </a>
                        </div>
                    `, true);
                } else {
                    showError(`
                        <div class="error-icon">❌</div>
                        <div class="error-title">Invalid Credentials</div>
                        <div class="error-details">
                            Incorrect FedEx ID or password.
                        </div>
                        <div class="error-help">
                            <a href="#" onclick="showPasswordHelp(); return false;" class="help-link">
                                <i class="fas fa-question-circle"></i> Forgot your password?
                            </a>
                        </div>
                    `, true);
                }
            } else {
                showError('Invalid FedEx ID or password');
            }
        } else {
            showError(`
                <div class="error-icon">❌</div>
                <div class="error-title">Invalid Credentials</div>
                <div class="error-details">
                    Incorrect FedEx ID or password.
                </div>
                <div class="error-help">
                    <a href="#" onclick="showPasswordHelp(); return false;" class="help-link">
                        <i class="fas fa-question-circle"></i> Forgot your password?
                    </a>
                </div>
            `, true);
        }
        
        loginButton.disabled = false;
        loginButton.innerHTML = 'SIGN IN';
        return;
    }
    
    // Password expired
    if (errorMsg.includes('password expired') || errorMsg.includes('expired')) {
        showWarning(`
            <div class="error-icon">⏰</div>
            <div class="error-title">Password Expired</div>
            <div class="error-details">
                Your password has expired and needs to be reset.
            </div>
            <div class="error-help">
                Contact developer to reset:<br>
                <a href="https://teams.microsoft.com/l/chat/0/0?users=ufuk.celikeloglu@fedex.com" 
                   class="help-link" target="_blank" rel="noopener noreferrer">
                    <i class="fab fa-microsoft"></i> Teams Chat with Ufuk
                </a>
            </div>
        `, true);
        
        loginButton.disabled = false;
        loginButton.innerHTML = 'SIGN IN';
        return;
    }
    
    // Generic error
    showError(`
        <div class="error-icon">⚠️</div>
        <div class="error-title">Login Failed</div>
        <div class="error-details">${errorMsg}</div>
        <div class="error-help">
            Need help? Contact developer:<br>
            <a href="https://teams.microsoft.com/l/chat/0/0?users=ufuk.celikeloglu@fedex.com" 
               class="help-link" target="_blank" rel="noopener noreferrer">
                <i class="fab fa-microsoft"></i> Teams Chat
            </a>
        </div>
    `, true);
    
    loginButton.disabled = false;
    loginButton.innerHTML = 'SIGN IN';
}

async function startLockoutCountdown(fedexId, loginButton) {
    if (!window.authService || typeof window.authService.getLockInfo !== 'function') {
        console.warn('⚠️ getLockInfo not available');
        return;
    }
    
    const countdownInterval = setInterval(async () => {
        const lockInfo = await window.authService.getLockInfo(fedexId);
        
        if (!lockInfo || !lockInfo.isLocked || lockInfo.remainingTime <= 0) {
            clearInterval(countdownInterval);
            loginButton.disabled = false;
            loginButton.innerHTML = 'SIGN IN';
            showSuccess('Account unlocked. You may try again.');
            return;
        }
        
        const minutes = lockInfo.remainingTime;
        loginButton.innerHTML = `<i class="fas fa-lock"></i> Locked (${minutes} min)`;
    }, 10000);
}

function showPasswordHelp() {
    showInfo(`
        <div class="error-icon">💡</div>
        <div class="error-title">Need Help with Your Password?</div>
        <div class="error-details">
            Contact the developer for password reset assistance:
        </div>
        <div class="error-help">
            <a href="https://teams.microsoft.com/l/chat/0/0?users=ufuk.celikeloglu@fedex.com" 
               class="help-link primary-link" 
               target="_blank"
               rel="noopener noreferrer">
                <i class="fab fa-microsoft"></i> Start Teams Chat with Ufuk
            </a>
            <br>
            <a href="mailto:ufuk.celikeloglu@fedex.com" class="help-link secondary-link">
                <i class="fas fa-envelope"></i> Or send email
            </a>
        </div>
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.85rem; color: rgba(255,255,255,0.6); text-align: center;">
            <i class="fas fa-clock"></i> Available: Mon-Fri, 9AM-6PM (Istanbul Time)
        </div>
    `, true);
}

/* ============================================
   MESSAGE FUNCTIONS
   ============================================ */

function showError(message, isHTML = false) {
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    if (errorMessage && errorText) {
        errorMessage.className = 'message-box error-message show';
        
        if (isHTML) {
            errorText.innerHTML = message;
        } else {
            errorText.textContent = message;
        }
    }
}

function showWarning(message, isHTML = false) {
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    if (errorMessage && errorText) {
        errorMessage.className = 'message-box warning-message show';
        
        if (isHTML) {
            errorText.innerHTML = message;
        } else {
            errorText.textContent = message;
        }
    }
}

function showInfo(message, isHTML = false) {
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    if (errorMessage && errorText) {
        errorMessage.className = 'message-box info-message show';
        
        if (isHTML) {
            errorText.innerHTML = message;
        } else {
            errorText.textContent = message;
        }
    }
}

function hideMessage() {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.classList.remove('show');
    }
}

function showSuccess(message) {
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    if (errorMessage && errorText) {
        errorMessage.className = 'message-box success-message show';
        errorText.textContent = message;
    }
}

/* ============================================
   AUTO FOCUS & REMEMBER LAST ID
   ============================================ */

window.addEventListener('load', () => {
    const fedexIdInput = document.getElementById('fedexId');
    
    if (fedexIdInput) {
        // Load last FedEx ID
        const lastFedexId = localStorage.getItem('lastFedexId');
        
        if (lastFedexId) {
            fedexIdInput.value = lastFedexId;
            
            // Focus password if ID pre-filled
            const passwordInput = document.getElementById('password');
            if (passwordInput) {
                setTimeout(() => {
                    passwordInput.focus();
                }, 300);
            }
        } else {
            // Focus FedEx ID input
            setTimeout(() => {
                fedexIdInput.focus();
            }, 300);
        }
    }
    
    // Check if already authenticated
    if (window.authService && window.authService.isAuthenticated()) {
        window.location.href = `${window.location.origin}/Horizon/index.html`;
    }
});

// Save FedEx ID on form submit
document.addEventListener('DOMContentLoaded', () => {
    const fedexIdInput = document.getElementById('fedexId');
    if (fedexIdInput) {
        fedexIdInput.addEventListener('change', () => {
            const fedexId = fedexIdInput.value.trim();
            if (fedexId) {
                localStorage.setItem('lastFedexId', fedexId);
            }
        });
    }
});

// Export for inline calls
window.showPasswordHelp = showPasswordHelp;