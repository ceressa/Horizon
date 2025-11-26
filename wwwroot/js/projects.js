/* ============================================
   PROJECTS.JS - COMPLETELY REDESIGNED
   Status-Based System | Quick Add Flow | Enhanced Features
   ============================================ */

'use strict';
const COUNTRY_CONFIG = window.COUNTRY_CONFIG;
const countryNames   = window.countryNames;
const COUNTRY_ORDER  = window.COUNTRY_ORDER;
// ========== CONFIGURATION ==========
const CONFIG = {
    API_BASE_URL: '../api/projects',
    ANIMATION_DURATION: 800,
    NOTIFICATION_DURATION: 3000,
    AUTO_SAVE_DELAY: 500,
    MAX_DESCRIPTION_LENGTH: 200
};

// ========== STATUS CONFIGURATION (Icon animations in modal) ==========
const STATUS_CONFIG = {
    'completed': { 
        icon: 'fa-check-circle', 
        color: '#10b981', 
        label: 'Completed',
        animation: 'prjBounce'
    },
    'in-progress': { 
        icon: 'fa-spinner', 
        color: '#3b82f6', 
        label: 'In Progress',
        animation: 'prjSpin'
    },
    'not-started': { 
        icon: 'fa-circle', 
        color: '#6b7280', 
        label: 'Not Started',
        animation: 'prjPulse'
    },
    'on-hold': { 
        icon: 'fa-pause-circle', 
        color: '#f59e0b', 
        label: 'On Hold',
        animation: 'prjPulse'
    },
    'cancelled': { 
        icon: 'fa-times-circle', 
        color: '#ef4444', 
        label: 'Cancelled',
        animation: 'prjPulse'
    }
};

let state = {
    allProjects: [],
    filteredProjects: [],
    currentFilters: {
        status: 'all',
        country: 'all',
        scale: 'all',
        search: ''
    },
    currentSort: 'priority', // ✅ DEFAULT: Priority
    selectedProjectId: null,
    isLoading: false,
    filtersVisible: false,
    createFlowStep: 0,
    createFlowData: {}
};

// ========== PRIORITY MAPPING ==========
const PRIORITY_ORDER = {
    'high': 1,
    'medium': 2,
    'normal': 3,
    'low': 4,
    '': 5
};

// ========== SCALE CONFIGURATION ==========
const SCALE_OPTIONS = [
    { value: 'small', label: 'Small', icon: 'fa-dot-circle' },
    { value: 'medium', label: 'Medium', icon: 'fa-circle' },
    { value: 'large', label: 'Large', icon: 'fa-circle-notch' },
    { value: 'enterprise', label: 'Enterprise', icon: 'fa-globe' }
];


// ========== DOM CACHE ==========
const DOM = {
    loadingScreen: null,
    projectsList: null,
    searchInput: null,
    filterToggle: null,
    filtersPanel: null,
    statusFilter: null,
    countryFilter: null,
    scaleFilter: null,
    projectModal: null,
    editModal: null,
    createModal: null,
    modalContent: null,
    editForm: null,
    stats: { active: null, completed: null, queue: null }
};

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    // Auth-guard'ın set etmesi için bekle
    setTimeout(initializeApp, 200);
});

function initializeApp() {
    console.log('🚀 Initializing HORIZON Projects System...');
    
    // Debug: User bilgisini göster
    const currentUser = window.currentUser || window.authService?.getCurrentUser();
    console.log('👤 Current User:', currentUser);
    console.log('🌍 Countries:', currentUser?.countries);
    
    if (!currentUser || !currentUser.countries || currentUser.countries.length === 0) {
        console.warn('⚠️ No user or countries found - waiting...');
        // 1 saniye daha bekle ve tekrar dene
        setTimeout(initializeApp, 1000);
        return;
    }
    
    cacheDOMElements();
    initializeEventListeners();
    loadProjectsFromAPI();
    
    console.log('✅ Projects system initialized');
}

function cacheDOMElements() {
    DOM.loadingScreen = document.getElementById('prjLoadingScreen');
    DOM.projectsList = document.getElementById('prjProjectsList');
    DOM.searchInput = document.getElementById('prjSearchInput');
    DOM.filterToggle = document.getElementById('prjFilterToggle');
    DOM.filtersPanel = document.getElementById('prjFiltersPanel');
    DOM.statusFilter = document.getElementById('prjStatusFilter');
    DOM.countryFilter = document.getElementById('prjCountryFilter');
    DOM.scaleFilter = document.getElementById('prjScaleFilter');
    DOM.projectModal = document.getElementById('prjProjectModal');
    DOM.editModal = document.getElementById('prjEditModal');
    DOM.createModal = document.getElementById('prjCreateModal');
    DOM.modalContent = document.getElementById('prjModalContent');
    DOM.editForm = document.getElementById('prjEditForm');
    DOM.stats.active = document.getElementById('prjStatActive');
    DOM.stats.completed = document.getElementById('prjStatCompleted');
    DOM.stats.queue = document.getElementById('prjStatQueue');
}

// ========== API FUNCTIONS ==========
async function loadProjectsFromAPI() {
    if (state.isLoading) return;
    state.isLoading = true;
    showLoadingScreen();
    
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/load`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        const allProjects = Array.isArray(data.projects) ? data.projects : [];

        // Get user - if null, show empty (auth-guard will redirect anyway)
        const currentUser = window.currentUser || window.authService?.getCurrentUser();
        const authorizedCountries = currentUser?.countries || [];
        
        console.log('🔐 Authorized countries:', authorizedCountries);

        // Filter by authorized countries
        state.allProjects = allProjects.filter(p => 
            authorizedCountries.includes(p.country)
        );

        // Ensure all projects have required fields
        state.allProjects = state.allProjects.map(p => ({
            ...p,
            scale: p.scale || 'medium',
            planviewNumber: p.planviewNumber || '',
            startDate: p.startDate || '',
            modifiedBy: p.modifiedBy || 'System',
            initials: p.initials || 'SYS',
            lastModified: p.lastModified || new Date().toISOString()
        }));
        
        state.filteredProjects = [...state.allProjects];
        
        populateFilters();
        updateStatistics();
        displayProjects();
        
        console.log(`📊 Loaded ${state.allProjects.length} projects`);
    } catch (error) {
        console.error('❌ Error loading projects:', error);
        showErrorState(error.message);
    } finally {
        state.isLoading = false;
        hideLoadingScreen();
    }
}

async function saveProjectsToAPI() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projects: state.allProjects,
                lastUpdated: new Date().toISOString(),
                version: '2.0'
            })
        });
        
        const result = await response.json();
        if (result.success) {
            console.log('✅ Projects saved successfully');
            showNotification('Changes saved successfully', 'success');
            return true;
        }
        throw new Error(result.message);
    } catch (error) {
        console.error('❌ Save error:', error);
        showNotification('Failed to save changes', 'error');
        return false;
    }
}

function showLoadingScreen() {
    if (DOM.loadingScreen) {
        DOM.loadingScreen.classList.remove('prj-hidden');
        DOM.loadingScreen.style.display = 'flex';
    }
}

function hideLoadingScreen() {
    if (DOM.loadingScreen) {
        setTimeout(() => {
            DOM.loadingScreen.classList.add('prj-hidden');
            setTimeout(() => { 
                DOM.loadingScreen.style.display = 'none'; 
            }, 300);
        }, CONFIG.ANIMATION_DURATION);
    }
}

function showErrorState(message) {
    if (DOM.loadingScreen) {
        DOM.loadingScreen.innerHTML = `
            <div style="text-align: center; color: #ef4444;">
                <i class="fas fa-exclamation-triangle" style="font-size: 4rem; margin-bottom: 1.5rem;"></i>
                <h3 style="font-size: 1.5rem; margin-bottom: 1rem; color: #fff;">Failed to Load Projects</h3>
                <p style="color: #94a3b8; margin-bottom: 2rem;">${message || 'Please try again'}</p>
                <button onclick="location.reload()" class="prj-btn prj-btn-primary">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `prj-notification prj-notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: #fff;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        z-index: 99999;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-weight: 600;
        animation: prjSlideIn 0.3s ease-out;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'prjFadeOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, CONFIG.NOTIFICATION_DURATION);
}

// ========== EVENT LISTENERS ==========
function initializeEventListeners() {
    // Search input
    if (DOM.searchInput) {
        let timeout;
        DOM.searchInput.addEventListener('input', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                state.currentFilters.search = e.target.value.toLowerCase().trim();
                applyFilters();
            }, 300);
        });
    }
    
    // Filter toggle
    if (DOM.filterToggle) {
        DOM.filterToggle.addEventListener('click', toggleFilters);
    }
    
    // Status filter
    if (DOM.statusFilter) {
        DOM.statusFilter.addEventListener('change', (e) => {
            state.currentFilters.status = e.target.value;
            applyFilters();
        });
    }
    
    // Country filter
    if (DOM.countryFilter) {
        DOM.countryFilter.addEventListener('change', (e) => {
            state.currentFilters.country = e.target.value;
            applyFilters();
        });
    }
    
    // Scale filter
    if (DOM.scaleFilter) {
        DOM.scaleFilter.addEventListener('change', (e) => {
            state.currentFilters.scale = e.target.value;
            applyFilters();
        });
    }
    
    // Edit form submit
    if (DOM.editForm) {
        DOM.editForm.addEventListener('submit', handleEditFormSubmit);
    }
    
    // Add new project buttons - FIX: Use querySelectorAll for multiple buttons
    document.querySelectorAll('#prjAddBtn, #prjAddBtnHeader').forEach(btn => {
        if (btn) {
            console.log('✅ Adding click listener to:', btn.id || btn.className);
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🎯 Button clicked!');
                openCreateModal();
            });
        }
    });
    
    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAllModals();
    });
    
    console.log('✅ All event listeners initialized');
const sortSelect = document.getElementById('prjSortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            state.currentSort = e.target.value;
            applySorting();
        });
    }
    
    // ✅ Clear filters button
    const clearFiltersBtn = document.getElementById('prjClearFilters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearAllFilters);
    }
}

function toggleFilters() {
    state.filtersVisible = !state.filtersVisible;
    
    if (DOM.filtersPanel) {
        DOM.filtersPanel.classList.toggle('active');
    }
    
    if (DOM.filterToggle) {
        DOM.filterToggle.classList.toggle('active');
    }
}

function applySorting() {
    switch(state.currentSort) {
        case 'priority':
            state.filteredProjects.sort((a, b) => {
                const priorityA = PRIORITY_ORDER[a.priority || ''] || 99;
                const priorityB = PRIORITY_ORDER[b.priority || ''] || 99;
                return priorityA - priorityB;
            });
            break;
            
        case 'country':
            state.filteredProjects.sort((a, b) => 
                (a.countryName || '').localeCompare(b.countryName || '')
            );
            break;
            
        case 'status':
            state.filteredProjects.sort((a, b) => 
                (a.status || '').localeCompare(b.status || '')
            );
            break;
            
        case 'scale':
            const scaleOrder = { 'small': 1, 'medium': 2, 'large': 3, 'enterprise': 4 };
            state.filteredProjects.sort((a, b) => 
                (scaleOrder[a.scale] || 0) - (scaleOrder[b.scale] || 0)
            );
            break;
            
        case 'progress':
            state.filteredProjects.sort((a, b) => (b.progress || 0) - (a.progress || 0));
            break;
            
        case 'name':
            state.filteredProjects.sort((a, b) => 
                (a.name || '').localeCompare(b.name || '')
            );
            break;
            
        case 'date':
            state.filteredProjects.sort((a, b) => 
                new Date(b.lastModified || 0) - new Date(a.lastModified || 0)
            );
            break;
    }
    
    displayProjects();
}

// ========== CLEAR FILTERS ==========
function clearAllFilters() {
    state.currentFilters = {
        status: 'all',
        country: 'all',
        scale: 'all',
        search: ''
    };
    
    // Reset UI
    if (DOM.statusFilter) DOM.statusFilter.value = 'all';
    if (DOM.countryFilter) DOM.countryFilter.value = 'all';
    if (DOM.scaleFilter) DOM.scaleFilter.value = 'all';
    if (DOM.searchInput) DOM.searchInput.value = '';
    
    applyFilters();
    showNotification('Filters cleared', 'info');
}

function applyFilters() {
    state.filteredProjects = state.allProjects.filter(project => {
        const matchesSearch = !state.currentFilters.search || 
            project.name?.toLowerCase().includes(state.currentFilters.search) ||
            project.description?.toLowerCase().includes(state.currentFilters.search) ||
            project.countryName?.toLowerCase().includes(state.currentFilters.search);
        
        const matchesStatus = state.currentFilters.status === 'all' || 
            project.status === state.currentFilters.status;
        
        const matchesCountry = state.currentFilters.country === 'all' || 
            project.country === state.currentFilters.country;
        
        const matchesScale = state.currentFilters.scale === 'all' || 
            project.scale === state.currentFilters.scale;
        
        return matchesSearch && matchesStatus && matchesCountry && matchesScale;
    });
    
    applySorting(); // ✅ Filtrelemeden sonra sırala
}

function populateFilters() {
    // Populate country filter
    if (DOM.countryFilter) {
        const countries = new Map();
        state.allProjects.forEach(p => {
            if (p.country && p.countryName && p.flag) {
                countries.set(p.country, {
                    code: p.country,
                    name: p.countryName,
                    flag: p.flag
                });
            }
        });
        
        const sortedCountries = Array.from(countries.values())
            .sort((a, b) => a.name.localeCompare(b.name));
        
        DOM.countryFilter.innerHTML = '<option value="all">All Countries</option>';
        sortedCountries.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.code;
            opt.textContent = `${c.flag} ${c.name}`;
            DOM.countryFilter.appendChild(opt);
        });
    }
    
    // Populate scale filter
    if (DOM.scaleFilter) {
        DOM.scaleFilter.innerHTML = '<option value="all">All Scales</option>';
        SCALE_OPTIONS.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.value;
            opt.textContent = s.label;
            DOM.scaleFilter.appendChild(opt);
        });
    }
    
    // Populate status filter
    if (DOM.statusFilter) {
        DOM.statusFilter.innerHTML = '<option value="all">All Statuses</option>';
        Object.entries(STATUS_CONFIG).forEach(([key, config]) => {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = config.label;
            DOM.statusFilter.appendChild(opt);
        });
    }
}

function updateStatistics() {
    const stats = {
        active: state.allProjects.filter(p => p.status === 'in-progress').length,
        completed: state.allProjects.filter(p => p.status === 'completed').length,
        queue: state.allProjects.filter(p => p.status === 'not-started').length
    };
    
    animateCounter(DOM.stats.active, 0, stats.active, 1000);
    animateCounter(DOM.stats.completed, 0, stats.completed, 1000);
    animateCounter(DOM.stats.queue, 0, stats.queue, 1000);
}

function animateCounter(el, start, end, duration) {
    if (!el) return;
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        el.textContent = Math.round(current);
    }, 16);
}

// ========== DISPLAY PROJECTS ==========
function displayProjects() {
    if (!DOM.projectsList) return;
    
    if (state.filteredProjects.length === 0) {
        DOM.projectsList.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 5rem 2rem; color: #64748b;">
                <i class="fas fa-folder-open" style="font-size: 5rem; margin-bottom: 1.5rem; opacity: 0.4;"></i>
                <h3 style="font-size: 1.75rem; margin-bottom: 0.75rem; color: #94a3b8;">No projects found</h3>
                <p style="font-size: 1rem;">Try adjusting your filters or search criteria</p>
            </div>
        `;
        return;
    }
    
    DOM.projectsList.innerHTML = state.filteredProjects
        .map((project, index) => createProjectCardHTML(project, index))
        .join('');
    
    attachProjectCardListeners();
}

function createProjectCardHTML(project, index) {
    const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG['not-started'];
    const scaleInfo = SCALE_OPTIONS.find(s => s.value === project.scale) || SCALE_OPTIONS[1];
    const decodedFlag = decodeUnicodeFlag(project.flag); // ✅ DECODE ET
    
    return `
        <div class="prj-project-card" 
             data-project-id="${project.id}" 
             data-status="${project.status}"
             style="animation-delay: ${index * 0.05}s;">
            
            <div class="prj-card-header">
                <div class="prj-card-flag">${decodedFlag}</div> <!-- ✅ DECODE EDİLMİŞ FLAG -->
                <div class="prj-card-info">
                    <div class="prj-card-country">${escapeHTML(project.countryName || 'Unknown')}</div>
                    <div class="prj-card-status" data-status="${project.status}">
                        <i class="fas ${statusConfig.icon}"></i>
                        ${statusConfig.label}
                    </div>
                </div>
            </div>
            
            <!-- BODY -->
            <div class="prj-card-body">
                <h3 class="prj-card-title">${escapeHTML(project.name || 'Untitled Project')}</h3>
                <p class="prj-card-description">${escapeHTML(truncateText(project.description || 'No description', 120))}</p>
                
                <!-- PROGRESS -->
                <div class="prj-card-progress">
                    <div class="prj-progress-header">
                        <span class="prj-progress-label">Progress</span>
                        <span class="prj-progress-value" data-status="${project.status}">${project.progress || 0}%</span>
                    </div>
                    <div class="prj-progress-bar">
                        <div class="prj-progress-fill" 
                             data-status="${project.status}"
                             style="width: ${project.progress || 0}%;"></div>
                    </div>
                </div>
                
                <!-- FOOTER META -->
                <div class="prj-card-footer">
                    <div class="prj-card-meta">
                        <span class="prj-meta-label">Scale</span>
                        <span class="prj-meta-value">
                            <i class="fas ${scaleInfo.icon}"></i>
                            ${scaleInfo.label}
                        </span>
                    </div>
                    <div class="prj-card-meta">
                        <span class="prj-meta-label">Delivery</span>
                        <span class="prj-meta-value">
                            <i class="far fa-calendar"></i>
                            ${project.endDate ? formatDate(project.endDate) : 'Not set'}
                        </span>
                    </div>
                    <div class="prj-card-meta">
                        <span class="prj-meta-label">Modified</span>
                        <span class="prj-meta-value">
                            <i class="far fa-clock"></i>
                            ${formatDateRelative(project.lastModified)} by ${project.initials || 'N/A'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function attachProjectCardListeners() {
    document.querySelectorAll('.prj-project-card').forEach(card => {
        card.addEventListener('click', () => {
            openProjectModal(card.dataset.projectId);
        });
    });
}

// ========== MODAL FUNCTIONS ==========
function openProjectModal(projectId) {
    const project = state.allProjects.find(p => p.id == projectId);
    if (!project) {
        console.error('Project not found');
        return;
    }
    
    state.selectedProjectId = projectId;  // ✅ BURADA SET EDİLİYOR
    console.log('📌 Selected project ID set to:', state.selectedProjectId);
    
    const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG['not-started'];
    const scaleInfo = SCALE_OPTIONS.find(s => s.value === project.scale) || SCALE_OPTIONS[1];
	const decodedFlag = decodeUnicodeFlag(project.flag);
    
    const modalContainer = DOM.projectModal?.querySelector('.prj-modal-container');
    if (modalContainer) {
        modalContainer.setAttribute('data-status', project.status);
    }
    
    DOM.modalContent.innerHTML = `
        <!-- MODAL ACTIONS -->
        <div class="prj-modal-actions">
            <button class="prj-action-btn prj-edit-btn" id="prjModalEditBtn" title="Edit Project">
                <i class="fas fa-edit"></i>
            </button>
            <button class="prj-action-btn prj-delete-btn" id="prjModalDeleteBtn" title="Delete Project">
                <i class="fas fa-trash-alt"></i>
            </button>
            <button class="prj-action-btn prj-close-btn" id="prjModalCloseBtn">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <!-- REST OF MODAL CONTENT... -->
        <div class="prj-modal-header">
            <div class="prj-modal-flag">${decodedFlag}</div>
            <div class="prj-modal-header-info">
                <div class="prj-modal-country">${escapeHTML(project.countryName || 'Unknown')}</div>
                <div class="prj-modal-status" data-status="${project.status}">
                    <i class="fas ${statusConfig.icon}"></i>
                    ${statusConfig.label}
                </div>
            </div>
        </div>
        
        <h2 class="prj-modal-title">${escapeHTML(project.name || 'Untitled')}</h2>
        <p class="prj-modal-description">${escapeHTML(project.description || 'No description available')}</p>
        
        <div class="prj-modal-details">
            <div class="prj-detail-card">
                <div class="prj-detail-label"><i class="fas fa-tasks"></i> Progress</div>
                <div class="prj-detail-value prj-highlight">${project.progress || 0}%</div>
            </div>
            
            <div class="prj-detail-card">
                <div class="prj-detail-label"><i class="fas ${scaleInfo.icon}"></i> Scale</div>
                <div class="prj-detail-value">${scaleInfo.label}</div>
            </div>
            
            <div class="prj-detail-card">
                <div class="prj-detail-label"><i class="fas fa-flag"></i> Status</div>
                <div class="prj-detail-value prj-small">${statusConfig.label}</div>
            </div>
            
            ${project.planviewNumber ? `
                <div class="prj-detail-card">
                    <div class="prj-detail-label"><i class="fas fa-hashtag"></i> Planview Number</div>
                    <div class="prj-detail-value">${escapeHTML(project.planviewNumber)}</div>
                </div>
            ` : ''}
            
            <div class="prj-detail-card">
                <div class="prj-detail-label"><i class="far fa-calendar-plus"></i> Start Date</div>
                <div class="prj-detail-value prj-small">${project.startDate ? formatDate(project.startDate) : 'Not set'}</div>
            </div>
            
            <div class="prj-detail-card">
                <div class="prj-detail-label"><i class="far fa-calendar-check"></i> Delivery Date</div>
                <div class="prj-detail-value prj-small">${project.endDate ? formatDate(project.endDate) : 'Not set'}</div>
            </div>
            
            <div class="prj-detail-card prj-full-width">
                <div class="prj-detail-label"><i class="far fa-clock"></i> Last Modified</div>
                <div class="prj-detail-value prj-small">
                    ${formatDate(project.lastModified)}
                    <div class="prj-modified-info">
                        <div class="prj-initials-badge">${project.initials || 'N/A'}</div>
                        <div class="prj-modified-text">
                            Modified by <strong>${escapeHTML(project.modifiedBy || 'Unknown')}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    DOM.projectModal.style.display = 'flex';
    setTimeout(() => DOM.projectModal.classList.add('prj-active'), 10);
    
    // ✅ EVENT LISTENERS - AFTER CONTENT IS ADDED
    document.getElementById('prjModalEditBtn')?.addEventListener('click', () => {
        console.log('Edit button clicked, projectId:', projectId);
        openEditModal(projectId);
    });
    
    document.getElementById('prjModalDeleteBtn')?.addEventListener('click', () => {
        confirmDeleteProject(projectId);
    });
    
    document.getElementById('prjModalCloseBtn')?.addEventListener('click', closeProjectModal);
    
    DOM.projectModal.onclick = (e) => {
        if (e.target === DOM.projectModal) closeProjectModal();
    };
}

function closeProjectModal() {
    if (!DOM.projectModal) return;
    DOM.projectModal.classList.remove('prj-active');
    setTimeout(() => {
        DOM.projectModal.style.display = 'none';
        // ✅ selectedProjectId'yi sadece edit modal açık değilse null yap
        if (!DOM.editModal?.classList.contains('prj-active')) {
            state.selectedProjectId = null;
            console.log('🔒 Project modal closed - selectedProjectId cleared');
        }
    }, 300);
}

function openEditModal(projectId) {
    const project = state.allProjects.find(p => p.id == projectId);
    if (!project) {
        console.error('Project not found for edit');
        return;
    }
    
    // ✅ KRITIK: ProjectId'yi tekrar set et çünkü closeProjectModal null yapmış olabilir
    state.selectedProjectId = projectId;
    console.log('🔧 Edit modal - selectedProjectId set to:', state.selectedProjectId);
    
    // Form alanlarını doldur
    document.getElementById('prjEditName').value = project.name || '';
    document.getElementById('prjEditDescription').value = project.description || '';
    document.getElementById('prjEditProgress').value = project.progress || 0;
    document.getElementById('prjEditStatus').value = project.status || 'not-started';
    document.getElementById('prjEditScale').value = project.scale || 'medium';
    document.getElementById('prjEditPlanview').value = project.planviewNumber || '';
    document.getElementById('prjEditStartDate').value = project.startDate || '';
    document.getElementById('prjEditDeliveryDate').value = project.endDate || '';
    
    // Project modal'ı kapat
    closeProjectModal();
    
    // ✅ KRITIK: Modal kapatıldıktan sonra TEKRAR set et
    setTimeout(() => {
        state.selectedProjectId = projectId;
        console.log('🔧 After close - selectedProjectId reset to:', state.selectedProjectId);
    }, 100);
    
    // Edit modal'ı aç
    DOM.editModal.style.display = 'flex';
    setTimeout(() => DOM.editModal.classList.add('prj-active'), 10);
    
    DOM.editModal.onclick = (e) => {
        if (e.target === DOM.editModal) closeEditModal();
    };
    
    document.getElementById('prjCloseEditBtn')?.addEventListener('click', closeEditModal);
    document.getElementById('prjCancelEditBtn')?.addEventListener('click', closeEditModal);
}

function decodeUnicodeFlag(flag) {
    if (!flag) return '🏳️';
    
    // Unicode escape sequence'i decode et
    try {
        return flag.replace(/\\u[\dA-F]{4}/gi, (match) => {
            return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
        });
    } catch {
        return flag;
    }
}

function closeEditModal() {
    if (!DOM.editModal) return;
    DOM.editModal.classList.remove('prj-active');
    setTimeout(() => {
        DOM.editModal.style.display = 'none';
        DOM.editForm?.reset();
    }, 300);
}

async function handleEditFormSubmit(e) {
    e.preventDefault();
    console.log('🔍 EDIT FORM SUBMIT TRIGGERED');
    console.log('Selected project ID:', state.selectedProjectId);
    console.log('All projects count:', state.allProjects.length);
    
    if (!state.selectedProjectId) {
        console.error('❌ No project selected!');
        // ✅ Son çare: URL'den veya form'dan ID'yi bul
        console.error('This should not happen. Check openEditModal logic.');
        alert('Error: No project selected. Please close and try again.');
        return;
    }
    
    const projectIndex = state.allProjects.findIndex(p => p.id === state.selectedProjectId);
    console.log('Found project at index:', projectIndex);
    
    if (projectIndex === -1) {
        console.error('❌ Project not found!');
        alert('Project not found in array!');
        return;
    }
    
    // Get form values
    const name = document.getElementById('prjEditName')?.value.trim();
    const description = document.getElementById('prjEditDescription')?.value.trim();
    const progress = parseInt(document.getElementById('prjEditProgress')?.value) || 0;
    const status = document.getElementById('prjEditStatus')?.value;
    const scale = document.getElementById('prjEditScale')?.value;
    const planviewNumber = document.getElementById('prjEditPlanview')?.value.trim();
    const startDate = document.getElementById('prjEditStartDate')?.value;
    const endDate = document.getElementById('prjEditDeliveryDate')?.value;
    
    console.log('Form values:', { name, description, progress, status, scale, planviewNumber, startDate, endDate });
    
    const currentUser = 'Guliz Ketenci';
    const initials = generateInitials(currentUser);
    
    // Update project
    state.allProjects[projectIndex] = {
        ...state.allProjects[projectIndex],
        name,
        description,
        progress,
        status,
        scale,
        planviewNumber,
        startDate,
        endDate,
        modifiedBy: currentUser,
        initials: initials,
        lastModified: new Date().toISOString()
    };
    
    console.log('Updated project:', state.allProjects[projectIndex]);
    console.log('Attempting to save...');
    
    const saved = await saveProjectsToAPI();
    console.log('Save result:', saved);
    
    if (saved) {
        console.log('✅ Save successful');
        applyFilters();
        updateStatistics();
        closeEditModal();
        showNotification('Project updated successfully', 'success');
    } else {
        console.error('❌ Save failed');
        showNotification('Failed to save changes', 'error');
    }
}

async function confirmDeleteProject(projectId) {
    const project = state.allProjects.find(p => p.id == projectId);
    if (!project) return;
    
    if (!confirm(`Delete "${project.name}"?\n\nThis action cannot be undone.`)) return;
    
    state.allProjects = state.allProjects.filter(p => p.id !== projectId);
    
    if (await saveProjectsToAPI()) {
        applyFilters();
        updateStatistics();
        closeProjectModal();
        showNotification('Project deleted successfully', 'success');
    } else {
        loadProjectsFromAPI();
    }
}

function closeAllModals() {
    closeProjectModal();
    closeEditModal();
    closeCreateModal();
}

// ========== CREATE PROJECT FLOW (Progress-based Quick Add) ==========
function openCreateModal() {
    state.createFlowStep = 0;
    state.createFlowData = {};
    
    if (!DOM.createModal) return;
    
    DOM.createModal.style.display = 'flex';
    setTimeout(() => DOM.createModal.classList.add('prj-active'), 10);
    
    renderCreateFlowStep();
    
    DOM.createModal.onclick = (e) => {
        if (e.target === DOM.createModal) closeCreateModal();
    };
}

function closeCreateModal() {
    if (!DOM.createModal) return;
    DOM.createModal.classList.remove('prj-active');
    setTimeout(() => {
        DOM.createModal.style.display = 'none';
        state.createFlowStep = 0;
        state.createFlowData = {};
    }, 300);
}

function renderCreateFlowStep() {
    const flowContainer = document.getElementById('prjCreateFlowContainer');
    if (!flowContainer) return;
    
    const steps = [
        { id: 'basics', label: 'Basics', fields: ['name', 'description', 'country'] },
        { id: 'details', label: 'Details', fields: ['scale', 'planviewNumber', 'status'] },
        { id: 'dates', label: 'Timeline', fields: ['startDate', 'endDate', 'progress'] }
    ];
    
    const currentStep = steps[state.createFlowStep];
    
    flowContainer.innerHTML = `
        <!-- Progress Indicator -->
        <div class="prj-flow-progress">
            ${steps.map((step, index) => `
                <div class="prj-flow-step ${index === state.createFlowStep ? 'active' : index < state.createFlowStep ? 'completed' : ''}">
                    <div class="prj-step-circle">${index < state.createFlowStep ? '<i class="fas fa-check"></i>' : index + 1}</div>
                    <div class="prj-step-label">${step.label}</div>
                </div>
            `).join('')}
        </div>
        
        <!-- Step Content -->
        <div class="prj-flow-card">
            <h3>${currentStep.label}</h3>
            ${renderFlowStepContent(currentStep.id)}
        </div>
        
        <!-- Navigation -->
        <div class="prj-form-actions">
            ${state.createFlowStep > 0 ? `
                <button type="button" class="prj-btn prj-btn-secondary" onclick="previousCreateStep()">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
            ` : ''}
            <button type="button" class="prj-btn prj-btn-primary" onclick="nextCreateStep()">
                ${state.createFlowStep === steps.length - 1 ? '<i class="fas fa-check"></i> Create Project' : 'Next <i class="fas fa-arrow-right"></i>'}
            </button>
        </div>
    `;
}

function renderFlowStepContent(stepId) {
    switch(stepId) {
        case 'basics':
            return `
                <div class="prj-form-group">
                    <label for="createName"><i class="fas fa-heading"></i> Project Name *</label>
                    <input type="text" id="createName" placeholder="Enter project name" 
                           value="${state.createFlowData.name || ''}" required />
                </div>
                <div class="prj-form-group">
                    <label for="createDescription"><i class="fas fa-align-left"></i> Description</label>
                    <textarea id="createDescription" rows="4" placeholder="Describe the project...">${state.createFlowData.description || ''}</textarea>
                </div>
                <div class="prj-form-group">
                    <label for="createCountry"><i class="fas fa-flag"></i> Country *</label>
                    <select id="createCountry" required>
                        <option value="">Select Country</option>
                        ${generateCountryOptions()}
                    </select>
                </div>
            `;
        
        case 'details':
            return `
                <div class="prj-form-row">
                    <div class="prj-form-group">
                        <label for="createScale"><i class="fas fa-ruler"></i> Scale *</label>
                        <select id="createScale" required>
                            ${SCALE_OPTIONS.map(s => `
                                <option value="${s.value}" ${state.createFlowData.scale === s.value ? 'selected' : ''}>
                                    ${s.label}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="prj-form-group">
                        <label for="createStatus"><i class="fas fa-flag"></i> Status *</label>
                        <select id="createStatus" required>
                            ${Object.entries(STATUS_CONFIG).map(([key, config]) => `
                                <option value="${key}" ${state.createFlowData.status === key ? 'selected' : ''}>
                                    ${config.label}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                <div class="prj-form-group">
                    <label for="createPlanview"><i class="fas fa-hashtag"></i> Planview Number</label>
                    <input type="text" id="createPlanview" placeholder="Optional" 
                           value="${state.createFlowData.planviewNumber || ''}" />
                </div>
            `;
        
        case 'dates':
            return `
                <div class="prj-form-row">
                    <div class="prj-form-group">
                        <label for="createStartDate"><i class="far fa-calendar-plus"></i> Start Date</label>
                        <input type="date" id="createStartDate" 
                               value="${state.createFlowData.startDate || ''}" />
                    </div>
                    <div class="prj-form-group">
                        <label for="createEndDate"><i class="far fa-calendar-check"></i> Delivery Date</label>
                        <input type="date" id="createEndDate" 
                               value="${state.createFlowData.endDate || ''}" />
                    </div>
                </div>
                <div class="prj-form-group">
                    <label for="createProgress"><i class="fas fa-tasks"></i> Progress (%)</label>
                    <input type="number" id="createProgress" min="0" max="100" 
                           value="${state.createFlowData.progress || 0}" placeholder="0-100" />
                </div>
            `;
    }
}

function nextCreateStep() {
    // Save current step data
    const stepData = collectCurrentStepData();
    if (!stepData) return; // Validation failed
    
    Object.assign(state.createFlowData, stepData);
    
    // If last step, create project
    if (state.createFlowStep === 2) {
        createNewProject();
        return;
    }
    
    // Move to next step
    state.createFlowStep++;
    renderCreateFlowStep();
}

function previousCreateStep() {
    if (state.createFlowStep > 0) {
        state.createFlowStep--;
        renderCreateFlowStep();
    }
}

function collectCurrentStepData() {
    const step = state.createFlowStep;
    
    if (step === 0) {
        const name = document.getElementById('createName')?.value.trim();
        const description = document.getElementById('createDescription')?.value.trim();
        const countrySelect = document.getElementById('createCountry');
        const country = countrySelect?.value;
        
        if (!name) {
            showNotification('Project name is required', 'error');
            return null;
        }
        if (!country) {
            showNotification('Country is required', 'error');
            return null;
        }
        
        const selectedOption = countrySelect.options[countrySelect.selectedIndex];
        return {
            name,
            description,
            country,
            countryName: selectedOption.dataset.name,
            flag: selectedOption.dataset.flag
        };
    }
    
    if (step === 1) {
        return {
            scale: document.getElementById('createScale')?.value || 'medium',
            status: document.getElementById('createStatus')?.value || 'not-started',
            planviewNumber: document.getElementById('createPlanview')?.value.trim() || ''
        };
    }
    
    if (step === 2) {
        return {
            startDate: document.getElementById('createStartDate')?.value || '',
            endDate: document.getElementById('createEndDate')?.value || '',
            progress: parseInt(document.getElementById('createProgress')?.value) || 0
        };
    }
}

async function createNewProject() {
    const currentUser = 'Guliz Ketenci'; // Should come from auth
    const initials = generateInitials(currentUser);
    
    const newProject = {
        id: generateUniqueId(),
        ...state.createFlowData,
        teamSize: 1,
        manager: currentUser,
        department: 'IT Infrastructure',
        createdDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        modifiedBy: currentUser,
        initials: initials
    };
    
    state.allProjects.unshift(newProject);
    
    if (await saveProjectsToAPI()) {
        applyFilters();
        updateStatistics();
        closeCreateModal();
        showNotification('Project created successfully', 'success');
    }
}

// ========== UTILITY FUNCTIONS ==========
function generateUniqueId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function generateInitials(name) {
    if (!name) return 'N/A';
    return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .substr(0, 3);
}

function formatDate(dateString) {
    if (!dateString) return 'Not set';
    try {
        const date = new Date(dateString);
        if (isNaN(date)) return 'Invalid';
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    } catch {
        return 'Invalid';
    }
}

function formatDateRelative(dateString) {
    if (!dateString) return 'Unknown';
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return formatDate(dateString);
    } catch {
        return 'Unknown';
    }
}

function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength).trim() + '...';
}

function escapeHTML(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== GLOBAL EXPORTS ==========
window.reloadProjects = loadProjectsFromAPI;
window.openProjectModal = openProjectModal;
window.closeProjectModal = closeProjectModal;
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.openCreateModal = openCreateModal;
window.closeCreateModal = closeCreateModal;
window.confirmDeleteProject = confirmDeleteProject;
window.nextCreateStep = nextCreateStep;
window.previousCreateStep = previousCreateStep;
window.showTeamModal = showTeamModal;      // ← EKLE
window.closeTeamModal = closeTeamModal;    // ← EKLE

console.log('%c🚀 HORIZON Projects System Loaded', 'color: #84cc16; font-size: 16px; font-weight: bold;');