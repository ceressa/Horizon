// ========== PROJECTS.JS - PROJECT MANAGEMENT PAGE ========== //
// Version: 1.0.1
// Author: IT Playbook System

'use strict';

// ========== PROJECTS INITIALIZATION ========== //
document.addEventListener('DOMContentLoaded', function() {
    console.log('Projects page initializing...');
    
    try {
        setTimeout(() => {
            initializeProjects();
        }, 100);
        
    } catch (error) {
        console.error('Projects initialization error:', error);
        showNotification('Projects initialization failed', 'error');
    }
});

async function initializeProjects() {
    console.log('Initializing project management system...');
    
    try {
        await loadProjectsFromServer();
        populateProjectsGrid();
        updateProjectOverview();
        setupProjectEventListeners();
        
        console.log('Project management system initialized successfully');
        
    } catch (error) {
        console.error('Error initializing projects:', error);
        showNotification('Error initializing project system', 'error');
        
        allProjects = [];
        filteredProjects = [];
    }
}

// ========== PROJECT DATA LOADING ========== //
async function loadProjectsFromServer() {
    try {
        console.log('Loading projects from server...');
        
        const response = await fetch('/Horizon/api/projects/load', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.projects) {
            allProjects = data.projects;
            filteredProjects = [...allProjects];
            systemData.projects = allProjects;
            
            console.log(`Loaded ${allProjects.length} projects from server`);
            showNotification(`Loaded ${allProjects.length} projects`);
        } else {
            allProjects = [];
            filteredProjects = [];
            console.log('No projects found on server');
        }
        
    } catch (error) {
        console.error('Error loading projects from server:', error);
        showNotification(`Error loading projects: ${error.message}`, 'error');
        
        try {
            const localData = localStorage.getItem('projectsData');
            if (localData) {
                const parsed = JSON.parse(localData);
                allProjects = parsed.projects || [];
                filteredProjects = [...allProjects];
                console.log('Fallback: Loaded projects from localStorage');
            }
        } catch (localError) {
            console.error('LocalStorage fallback failed:', localError);
            allProjects = [];
            filteredProjects = [];
        }
    }
}

async function saveProjectsToServer() {
    try {
        const dataToSave = {
            projects: allProjects,
            lastUpdated: new Date().toISOString(),
            version: "1.0.1"
        };
        
        const response = await fetch('/Horizon/api/projects/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSave)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Projects saved to server:', result);
        
        localStorage.setItem('projectsData', JSON.stringify(dataToSave));
        return result;
        
    } catch (error) {
        console.error('Error saving projects to server:', error);
        showNotification(`Error saving projects: ${error.message}`, 'error');
        
        try {
            const dataToSave = {
                projects: allProjects,
                lastUpdated: new Date().toISOString(),
                version: "1.0.1"
            };
            localStorage.setItem('projectsData', JSON.stringify(dataToSave));
            console.log('Fallback: Projects saved to localStorage');
        } catch (localError) {
            console.error('LocalStorage fallback failed:', localError);
        }
        
        throw error;
    }
}

// ========== PROJECT OVERVIEW ========== //
function updateProjectOverview() {
    const stats = calculateProjectStats();
    
    const formattedBudget = stats.totalBudget > 1000000 ? 
        `${formatCurrency(stats.totalBudget, userSettings.currency).split(' ')[0]}${(stats.totalBudget / 1000000).toFixed(1)}M` :
        formatCurrency(stats.totalBudget, userSettings.currency);
    
    const elements = {
        'activeProjectsCount': stats.active,
        'planningProjectsCount': stats.planning,
        'criticalProjectsCount': stats.critical,
        'totalBudget': formattedBudget
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        updateElement(id, value);
    });
    
    setTimeout(() => {
        const overviewSection = document.querySelector('.project-overview');
        if (overviewSection) {
            animateNumbers(overviewSection);
        }
    }, 100);
}

function calculateProjectStats() {
    const stats = { 
        active: 0, planning: 0, critical: 0, totalBudget: 0 
    };
    
    filteredProjects.forEach(project => {
        if (project.status === 'active') stats.active++;
        if (project.status === 'planning') stats.planning++;
        if (project.priority === 'critical') stats.critical++;
        stats.totalBudget += project.budget || 0;
    });
    
    return stats;
}

// ========== PROJECT GRID RENDERING ========== //
function populateProjectsGrid() {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;
    
    try {
        grid.innerHTML = '';
        
        if (filteredProjects.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
                    <i class="fas fa-search" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i>
                    <h3 style="margin-bottom: 10px;">No projects found</h3>
                    <p>Try adjusting your search criteria or filters, or add a new project.</p>
                    <button class="btn btn-primary" onclick="showAddProjectModal()" style="margin-top: 20px;">
                        <i class="fas fa-plus"></i> Add New Project
                    </button>
                </div>
            `;
            return;
        }
        
        filteredProjects.forEach(project => {
            const projectCard = createProjectCard(project);
            grid.appendChild(projectCard);
        });
        
        grid.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', () => {
                const projectId = card.dataset.projectId;
                showProjectDetails(projectId);
            });
        });
        
        setTimeout(() => animateProgressBars(), 200);
        
        console.log(`Populated projects grid with ${filteredProjects.length} projects`);
        
    } catch (error) {
        console.error('Error populating projects grid:', error);
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--status-error);">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 20px;"></i>
                <h3>Error loading projects</h3>
                <p>Please try refreshing the page</p>
            </div>
        `;
    }
}

function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = `project-card glass-morphism premium-hover interactive-card`;
    card.dataset.projectId = project.id;
    card.dataset.status = project.status;
    card.dataset.priority = project.priority;
    card.dataset.country = project.country;
    
    const countryNames = {
        'TR': 'Türkiye', 'GR': 'Greece', 'BG': 'Bulgaria',
        'SI': 'Slovenia', 'CY': 'Cyprus', 'GSP': 'GSP'
    };
    
    const priorityLabels = {
        'critical': 'Critical', 'high': 'High', 'medium': 'Medium', 'low': 'Low'
    };
    
    const statusClasses = {
        'active': 'status-active', 'planning': 'status-planning',
        'maintenance': 'status-maintenance', 'completed': 'status-completed', 
        'on-hold': 'status-warning'
    };
    
    let budgetFormatted = 'No budget';
    if (project.budget && project.budget > 0) {
        const currentCurrency = userSettings.currency || 'EUR';
        const formatted = formatCurrency(project.budget, currentCurrency);
        budgetFormatted = `${formatted.split(' ')[0]}${(project.budget / 1000).toFixed(0)}K`;
    }
    
    card.innerHTML = `
        <div class="project-header">
            <div>
                <div class="project-title">${project.name}</div>
                <div class="project-id">${project.id}</div>
            </div>
            <span class="project-priority-badge priority-${project.priority}">
                ${priorityLabels[project.priority] || project.priority}
            </span>
        </div>
        
        <div class="project-meta">
            <div class="project-meta-item">
                <span>${getCountryFlag(project.country)} ${countryNames[project.country] || project.country}</span>
            </div>
            <div class="project-meta-item">
                <i class="fas fa-calendar"></i>
                <span>${formatDateRange(project.startDate, project.endDate)}</span>
            </div>
            <div class="project-meta-item">
                <i class="fas fa-euro-sign"></i>
                <span>${budgetFormatted}</span>
            </div>
        </div>
        
        <div class="project-description">
            ${project.description}
        </div>
        
        <div class="project-progress-section">
            <div class="progress-header">
                <span class="progress-label">Progress</span>
                <span class="progress-percentage">${project.progress}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" data-width="${project.progress}%"></div>
            </div>
        </div>
        
        <div class="project-footer">
            <div class="project-status">
                <div class="status-dot ${statusClasses[project.status] || 'status-info'}"></div>
                <span class="status-text">${project.status.charAt(0).toUpperCase() + project.status.slice(1)}</span>
            </div>
            <div class="project-team">
                <i class="fas fa-users"></i>
                <span>${project.teamSize || 1} members</span>
            </div>
        </div>
    `;
    
    return card;
}

// ========== PROJECT FILTERING ========== //
function setupProjectEventListeners() {
    const searchInput = document.getElementById('projectSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleProjectSearch, 300));
    }
    
    const filters = ['statusFilter', 'priorityFilter', 'countryFilter'];
    filters.forEach(filterId => {
        const filterElement = document.getElementById(filterId);
        if (filterElement) {
            filterElement.addEventListener('change', applyProjectFilters);
        }
    });
    
    console.log('Project event listeners setup complete');
}

function handleProjectSearch(event) {
    currentFilters.search = event.target.value.toLowerCase();
    applyProjectFilters();
}

function applyProjectFilters() {
    currentFilters.status = document.getElementById('statusFilter')?.value || '';
    currentFilters.priority = document.getElementById('priorityFilter')?.value || '';  
    currentFilters.country = document.getElementById('countryFilter')?.value || '';
    
    filteredProjects = allProjects.filter(project => {
        if (currentFilters.search) {
            const searchTerm = currentFilters.search.toLowerCase();
            const searchableText = `${project.name} ${project.description} ${project.id} ${project.manager || ''}`.toLowerCase();
            if (!searchableText.includes(searchTerm)) return false;
        }
        
        if (currentFilters.status && project.status !== currentFilters.status) return false;
        if (currentFilters.priority && project.priority !== currentFilters.priority) return false;
        if (currentFilters.country && project.country !== currentFilters.country) return false;
        
        return true;
    });
    
    populateProjectsGrid();
    updateProjectOverview();
    
    console.log(`Filtered ${filteredProjects.length} projects from ${allProjects.length} total`);
}

function clearAllFilters() {
    const inputs = ['projectSearch', 'statusFilter', 'priorityFilter', 'countryFilter'];
    inputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) element.value = '';
    });
    
    currentFilters = { search: '', status: '', priority: '', country: '' };
    filteredProjects = [...allProjects];
    
    populateProjectsGrid();
    updateProjectOverview();
    
    showNotification('Filters cleared');
}

function filterProjects(filterType) {
    switch (filterType) {
        case 'active':
            document.getElementById('statusFilter').value = 'active';
            currentFilters.status = 'active';
            break;
        case 'planning':
            document.getElementById('statusFilter').value = 'planning'; 
            currentFilters.status = 'planning';
            break;
        case 'critical':
            document.getElementById('priorityFilter').value = 'critical';
            currentFilters.priority = 'critical';
            break;
        default:
            console.log('Unknown filter type:', filterType);
            return;
    }
    
    applyProjectFilters();
    showNotification(`Showing ${filterType} projects`);
}

// ========== PROJECT MODAL FUNCTIONS ========== //
function showAddProjectModal() {
    console.log('Showing add project modal');
    
    try {
        const modal = createProjectModal();
        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
        const firstInput = modal.querySelector('input[type="text"]');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 300);
        }
        
    } catch (error) {
        console.error('Error showing add project modal:', error);
        showNotification('Error opening project form', 'error');
    }
}

function createProjectModal(project = null) {
    const isEditing = !!project;
    const modalId = isEditing ? 'editProjectModal' : 'addProjectModal';
    
    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
        <div class="modal-content project-modal-extended">
            <div class="modal-header">
                <h3>${isEditing ? 'Edit Project' : 'Add New Project'}</h3>
                <button class="modal-close" onclick="closeModal('${modalId}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <form class="modal-body" onsubmit="handleProjectSubmit(event, ${isEditing})">
                <div class="form-section">
                    <h4>Basic Information</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="projectName">Project Name *</label>
                            <input type="text" id="projectName" name="projectName" required 
                                   value="${project?.name || ''}" placeholder="Enter project name">
                        </div>
                        <div class="form-group">
                            <label for="projectId">Project ID *</label>
                            <input type="text" id="projectId" name="projectId" required 
                                   value="${project?.id || ''}" placeholder="e.g., PROJ-2024-001"
                                   ${isEditing ? 'readonly' : ''}>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="projectDescription">Description *</label>
                        <textarea id="projectDescription" name="projectDescription" rows="3" required 
                                  placeholder="Enter project description">${project?.description || ''}</textarea>
                    </div>
                </div>

                <div class="form-section">
                    <h4>Project Details</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="projectCountry">Country *</label>
                            <select id="projectCountry" name="projectCountry" required>
                                <option value="">Select Country</option>
                                <option value="TR" ${project?.country === 'TR' ? 'selected' : ''}>🇹🇷 Türkiye</option>
                                <option value="GR" ${project?.country === 'GR' ? 'selected' : ''}>🇬🇷 Greece</option>
                                <option value="BG" ${project?.country === 'BG' ? 'selected' : ''}>🇧🇬 Bulgaria</option>
                                <option value="SI" ${project?.country === 'SI' ? 'selected' : ''}>🇸🇮 Slovenia</option>
                                <option value="CY" ${project?.country === 'CY' ? 'selected' : ''}>🇨🇾 Cyprus</option>
                                <option value="GSP" ${project?.country === 'GSP' ? 'selected' : ''}>🛫 GSP</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="projectPriority">Priority *</label>
                            <select id="projectPriority" name="projectPriority" required>
                                <option value="">Select Priority</option>
                                <option value="low" ${project?.priority === 'low' ? 'selected' : ''}>Low</option>
                                <option value="medium" ${project?.priority === 'medium' ? 'selected' : ''}>Medium</option>
                                <option value="high" ${project?.priority === 'high' ? 'selected' : ''}>High</option>
                                <option value="critical" ${project?.priority === 'critical' ? 'selected' : ''}>Critical</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="projectStatus">Status *</label>
                            <select id="projectStatus" name="projectStatus" required>
                                <option value="">Select Status</option>
                                <option value="planning" ${project?.status === 'planning' ? 'selected' : ''}>Planning</option>
                                <option value="active" ${project?.status === 'active' ? 'selected' : ''}>Active</option>
                                <option value="on-hold" ${project?.status === 'on-hold' ? 'selected' : ''}>On Hold</option>
                                <option value="completed" ${project?.status === 'completed' ? 'selected' : ''}>Completed</option>
                                <option value="maintenance" ${project?.status === 'maintenance' ? 'selected' : ''}>Maintenance</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="projectProgress">Progress (%)</label>
                            <input type="number" id="projectProgress" name="projectProgress" 
                                   min="0" max="100" value="${project?.progress || 0}" placeholder="0">
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h4>Budget & Team</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="projectBudget">Budget (€)</label>
                            <input type="number" id="projectBudget" name="projectBudget" 
                                   min="0" step="1000" value="${project?.budget || ''}" placeholder="0">
                        </div>
                        <div class="form-group">
                            <label for="projectTeamSize">Team Size</label>
                            <input type="number" id="projectTeamSize" name="projectTeamSize" 
                                   min="1" value="${project?.teamSize || 1}" placeholder="1">
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h4>Timeline</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="projectStartDate">Start Date</label>
                            <input type="date" id="projectStartDate" name="projectStartDate" 
                                   value="${project?.startDate || ''}">
                        </div>
                        <div class="form-group">
                            <label for="projectEndDate">End Date</label>
                            <input type="date" id="projectEndDate" name="projectEndDate" 
                                   value="${project?.endDate || ''}">
                        </div>
                    </div>
                </div>

                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('${modalId}')">
                        Cancel
                    </button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas ${isEditing ? 'fa-save' : 'fa-plus'}"></i>
                        ${isEditing ? 'Update Project' : 'Add Project'}
                    </button>
                </div>
            </form>
        </div>
    `;
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modalId);
        }
    });
    
    return modal;
}

function handleProjectSubmit(event, isEditing = false) {
    event.preventDefault();
    
    try {
        const formData = new FormData(event.target);
        const projectData = {
            id: formData.get('projectId').trim(),
            name: formData.get('projectName').trim(),
            description: formData.get('projectDescription').trim(),
            country: formData.get('projectCountry'),
            priority: formData.get('projectPriority'),
            status: formData.get('projectStatus'),
            progress: parseInt(formData.get('projectProgress')) || 0,
            budget: parseInt(formData.get('projectBudget')) || 0,
            teamSize: parseInt(formData.get('projectTeamSize')) || 1,
            startDate: formData.get('projectStartDate') || null,
            endDate: formData.get('projectEndDate') || null,
            createdDate: new Date().toISOString().split('T')[0],
            lastUpdated: new Date().toISOString().split('T')[0]
        };
        
        if (!projectData.id || !projectData.name || !projectData.description || 
            !projectData.country || !projectData.priority || !projectData.status) {
            showNotification('Please fill in all required fields', 'warning');
            return;
        }
        
        if (isEditing) {
            updateProject(projectData);
        } else {
            addNewProject(projectData);
        }
        
    } catch (error) {
        console.error('Error handling project submit:', error);
        showNotification('Error processing project data', 'error');
    }
}

function addNewProject(projectData) {
    try {
        const existingProject = allProjects.find(p => p.id === projectData.id);
        if (existingProject) {
            showNotification('Project ID already exists', 'warning');
            return;
        }
        
        allProjects.push(projectData);
        filteredProjects = [...allProjects];
        systemData.projects = allProjects;
        
        saveProjectsToServer()
            .then(() => {
                showNotification(`Project "${projectData.name}" added successfully`);
                closeModal('addProjectModal');
                
                populateProjectsGrid();
                updateProjectOverview();
            })
            .catch(error => {
                console.error('Error saving project:', error);
                showNotification('Project added locally, but server sync failed', 'warning');
                closeModal('addProjectModal');
                
                populateProjectsGrid();
                updateProjectOverview();
            });
        
        console.log('Project added:', projectData);
        
    } catch (error) {
        console.error('Error adding project:', error);
        showNotification('Error adding project', 'error');
    }
}

// ========== UTILITY FUNCTIONS ========== //
function formatDateRange(startDate, endDate) {
    if (!startDate) return 'No dates set';
    
    try {
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : null;
        const options = { month: 'short', day: 'numeric' };
        
        if (end) {
            return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
        } else {
            return `Started ${start.toLocaleDateString('en-US', options)}`;
        }
    } catch (error) {
        return 'Invalid date';
    }
}

function animateProgressBars() {
    try {
        const progressBars = document.querySelectorAll('.progress-fill');
        
        progressBars.forEach((bar, index) => {
            bar.style.width = '0%';
            bar.style.transition = 'none';
            
            bar.offsetHeight;
            
            setTimeout(() => {
                bar.style.transition = 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
                
                const targetWidth = bar.dataset.width || bar.getAttribute('data-width');
                if (targetWidth) {
                    bar.style.width = targetWidth;
                }
            }, index * 100 + 50);
        });
        
        console.log(`Animated ${progressBars.length} progress bars`);
        
    } catch (error) {
        console.error('Error animating progress bars:', error);
    }
}

function generateNewProjectId() {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 9000) + 1000;
    return `PROJ-${year}-${randomNum}`;
}