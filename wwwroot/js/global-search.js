// Global Search System - Command Palette (Ctrl+K)
console.log('🔍 Command Palette loaded');

let searchDebounceTimer = null;

// Initialize Command Palette
function initGlobalSearch() {
    console.log('🔍 Initializing Command Palette...');
    
    const overlay = document.getElementById('commandPaletteOverlay');
    const input = document.getElementById('commandPaletteInput');
    
    if (!overlay || !input) {
        console.error('❌ Command Palette elements not found!');
        return;
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl+K or Cmd+K
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openCommandPalette();
        }
        
        // / key (when not in input)
        if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
            e.preventDefault();
            openCommandPalette();
        }
        
        // ESC to close
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            closeCommandPalette();
        }
    });
    
    // Click overlay to close
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeCommandPalette();
        }
    });
    
    // Search on input
    input.addEventListener('input', (e) => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            performCommandSearch(e.target.value);
        }, 300);
    });
    
    console.log('✅ Command Palette ready (Ctrl+K or /)');
}

function openCommandPalette() {
    const overlay = document.getElementById('commandPaletteOverlay');
    const input = document.getElementById('commandPaletteInput');
    
    overlay.classList.add('active');
    input.value = '';
    input.focus();
    
    // Reset to empty state
    showEmptyState();
}

function closeCommandPalette() {
    const overlay = document.getElementById('commandPaletteOverlay');
    overlay.classList.remove('active');
}

function showEmptyState() {
    const resultsDiv = document.getElementById('commandPaletteResults');
    resultsDiv.innerHTML = `
        <div class="command-palette-empty">
            <i class="fas fa-search"></i>
            <p>Type to search assets, users, team members...</p>
        </div>
    `;
}

async function performCommandSearch(query) {
    const resultsDiv = document.getElementById('commandPaletteResults');
    
    if (!query || query.length < 2) {
        showEmptyState();
        return;
    }
    
    // Show loading
    resultsDiv.innerHTML = `
        <div class="command-palette-empty">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Searching...</p>
        </div>
    `;
    
    try {
        const userCountries = window.currentUser && window.currentUser.countries 
            ? window.currentUser.countries.join(',') 
            : '';
        
        const response = await fetch(
            `/Horizon/api/data/global-search?query=${encodeURIComponent(query)}&userCountries=${encodeURIComponent(userCountries)}`
        );
        
        if (!response.ok) {
            throw new Error(`Search failed: ${response.status}`);
        }
        
        const data = await response.json();
        showCommandResults(data);
        
    } catch (error) {
        console.error('❌ Search failed:', error);
        resultsDiv.innerHTML = `
            <div class="command-palette-empty">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Search failed. Please try again.</p>
            </div>
        `;
    }
}

function showCommandResults(data) {
    const resultsDiv = document.getElementById('commandPaletteResults');
    const totalResults = 
        data.assets.length + 
        data.stockAssets.length + 
        data.appUsers.length + 
        data.teamMembers.length;
    
    if (totalResults === 0) {
        resultsDiv.innerHTML = `
            <div class="command-palette-empty">
                <i class="fas fa-search"></i>
                <p>No results found</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    // ============================================================
    // ASSETS - Active Devices
    // ============================================================
    if (data.assets.length > 0) {
        html += `
            <div class="command-palette-category">
                <i class="fas fa-laptop"></i>
                Assets
                <span class="command-palette-category-count">${data.assets.length}</span>
            </div>
        `;
        
        data.assets.forEach(asset => {
            const assetJson = JSON.stringify(asset.rawData || asset).replace(/'/g, "&#39;");
            html += `
                <div class="command-palette-item" onclick='openAssetDetailFromSearch(${assetJson})'>
                    <div class="command-palette-icon">
                        <i class="fas fa-laptop"></i>
                    </div>
                    <div class="command-palette-content">
                        <div class="command-palette-title">${escapeHtml(asset.hostname || asset.displayName || 'N/A')}</div>
                        <div class="command-palette-meta">
                            <span class="command-palette-badge">${escapeHtml(asset.category || 'Asset')}</span>
                            ${asset.model ? `<span><i class="fas fa-microchip"></i> ${escapeHtml(asset.model)}</span>` : ''}
                            ${asset.assignedTo ? `<span><i class="fas fa-user"></i> ${escapeHtml(asset.assignedTo)}</span>` : ''}
                            ${asset.country ? `<span><i class="fas fa-globe"></i> ${escapeHtml(asset.country)}</span>` : ''}
                        </div>
                    </div>
                    <i class="fas fa-arrow-right command-palette-arrow"></i>
                </div>
            `;
        });
    }
    
    // ============================================================
    // STOCK ASSETS - Inventory
    // ============================================================
    if (data.stockAssets.length > 0) {
        html += `
            <div class="command-palette-category">
                <i class="fas fa-warehouse"></i>
                Stock Assets
                <span class="command-palette-category-count">${data.stockAssets.length}</span>
            </div>
        `;
        
        data.stockAssets.forEach(asset => {
            const stockJson = JSON.stringify(asset.rawData || asset).replace(/'/g, "&#39;");
            html += `
                <div class="command-palette-item" onclick='openStockDetailFromSearch(${stockJson})'>
                    <div class="command-palette-icon">
                        <i class="fas fa-box"></i>
                    </div>
                    <div class="command-palette-content">
                        <div class="command-palette-title">${escapeHtml(asset.hostname || asset.model || 'N/A')}</div>
                        <div class="command-palette-meta">
                            <span class="command-palette-badge">${escapeHtml(asset.substate || asset.state || 'Stock')}</span>
                            ${asset.model ? `<span><i class="fas fa-microchip"></i> ${escapeHtml(asset.model)}</span>` : ''}
                            ${asset.reservedFor ? `<span><i class="fas fa-user-clock"></i> Reserved: ${escapeHtml(asset.reservedFor)}</span>` : ''}
                            ${asset.stockroom ? `<span><i class="fas fa-warehouse"></i> ${escapeHtml(asset.stockroom)}</span>` : ''}
                            ${asset.country ? `<span><i class="fas fa-globe"></i> ${escapeHtml(asset.country)}</span>` : ''}
                            ${asset.serial ? `<span><i class="fas fa-barcode"></i> ${escapeHtml(asset.serial)}</span>` : ''}
                        </div>
                    </div>
                    <i class="fas fa-arrow-right command-palette-arrow"></i>
                </div>
            `;
        });
    }
    
    // ============================================================
    // APPLICATION USERS - Read Only
    // ============================================================
    if (data.appUsers.length > 0) {
        html += `
            <div class="command-palette-category">
                <i class="fas fa-user-shield"></i>
                Application Users
                <span class="command-palette-category-count">${data.appUsers.length}</span>
            </div>
        `;
        
        data.appUsers.forEach(user => {
            html += `
                <div class="command-palette-item command-palette-item-readonly">
                    <div class="command-palette-icon">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="command-palette-content">
                        <div class="command-palette-title">${escapeHtml(user.name)}</div>
                        <div class="command-palette-meta">
                            <span class="command-palette-badge">${escapeHtml(user.role)}</span>
                            ${user.email ? `<span><i class="fas fa-envelope"></i> ${escapeHtml(user.email)}</span>` : ''}
                            ${user.fedexId ? `<span><i class="fas fa-id-badge"></i> ${escapeHtml(user.fedexId)}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    // ============================================================
    // TEAM MEMBERS
    // ============================================================
    if (data.teamMembers.length > 0) {
        html += `
            <div class="command-palette-category">
                <i class="fas fa-users"></i>
                Team Members
                <span class="command-palette-category-count">${data.teamMembers.length}</span>
            </div>
        `;
        
        data.teamMembers.forEach(member => {
            html += `
                <div class="command-palette-item" onclick="window.location.href='pages/team.html'">
                    <div class="command-palette-icon">
                        <i class="fas fa-user-tie"></i>
                    </div>
                    <div class="command-palette-content">
                        <div class="command-palette-title">${escapeHtml(member.name)}</div>
                        <div class="command-palette-meta">
                            ${member.jobTitle ? `<span class="command-palette-badge">${escapeHtml(member.jobTitle)}</span>` : ''}
                            ${member.department ? `<span><i class="fas fa-building"></i> ${escapeHtml(member.department)}</span>` : ''}
                            ${member.location ? `<span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(member.location)}</span>` : ''}
                            ${member.email ? `<span><i class="fas fa-envelope"></i> ${escapeHtml(member.email)}</span>` : ''}
                        </div>
                    </div>
                    <i class="fas fa-arrow-right command-palette-arrow"></i>
                </div>
            `;
        });
    }
    
    resultsDiv.innerHTML = html;
}


// Open asset detail from search - DON'T CLOSE SEARCH MODAL
function openAssetDetailFromSearch(asset) {
    console.log('📋 Opening asset detail:', asset);
    
    // DON'T close search modal - let it stay open
    // closeSearchModal();
    
    // Use the simple modal for assets
    showSimpleAssetDetail(asset);
}

// Open stock detail from search - DON'T CLOSE SEARCH MODAL
function openStockDetailFromSearch(stock) {
    console.log('📦 Opening stock detail:', stock);
    
    // DON'T close search modal - let it stay open
    // closeSearchModal();
    
    // Show stock detail modal
    showStockDetailModal(stock);
}

// Stock Detail Modal
function showStockDetailModal(stock) {
    console.log('🔍 Showing stock detail:', stock);
    
    const hostname = stock.configuration_item || 'N/A';
    const model = stock.model || 'N/A';
    const substate = stock.substate || stock.state || 'In Stock';
    
    const html = `
        <div class="assets-modal-overlay show" id="stockDetailModal" onclick="closeStockDetailModal(event)">
            <div class="assets-modal-dialog" onclick="event.stopPropagation()">
                <div class="assets-modal-header">
                    <h2 class="assets-modal-title">
                        <i class="fas fa-box" style="color: #84cc16;"></i>
                        ${escapeHtml(hostname)}
                    </h2>
                    <button class="assets-close-modal" onclick="closeStockDetailModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="assets-modal-body">
                    <div class="asset-detail-grid">
                        ${stock.configuration_item ? `
                        <div class="asset-detail-item">
                            <span class="asset-detail-label">Configuration Item:</span>
                            <span class="asset-detail-value">${escapeHtml(stock.configuration_item)}</span>
                        </div>` : ''}
                        
                        ${stock.model ? `
                        <div class="asset-detail-item">
                            <span class="asset-detail-label">Model:</span>
                            <span class="asset-detail-value">${escapeHtml(stock.model)}</span>
                        </div>` : ''}
                        
                        ${stock.serial_number ? `
                        <div class="asset-detail-item">
                            <span class="asset-detail-label">Serial Number:</span>
                            <span class="asset-detail-value">
                                <code style="background: rgba(132, 204, 22, 0.1); padding: 4px 8px; border-radius: 4px;">
                                    ${escapeHtml(stock.serial_number)}
                                </code>
                            </span>
                        </div>` : ''}
                        
                        ${stock.substate ? `
                        <div class="asset-detail-item">
                            <span class="asset-detail-label">Substate:</span>
                            <span class="asset-detail-value">
                                <span class="assets-type-badge" style="background: #84cc1620; border-color: #84cc1640; color: #84cc16;">
                                    <i class="fas fa-info-circle"></i>
                                    ${escapeHtml(stock.substate)}
                                </span>
                            </span>
                        </div>` : ''}
                        
                        ${stock.state ? `
                        <div class="asset-detail-item">
                            <span class="asset-detail-label">State:</span>
                            <span class="asset-detail-value">${escapeHtml(stock.state)}</span>
                        </div>` : ''}
                        
                        ${stock.stockroom ? `
                        <div class="asset-detail-item">
                            <span class="asset-detail-label">Stockroom:</span>
                            <span class="asset-detail-value">
                                <i class="fas fa-warehouse" style="color: #84cc16; margin-right: 4px;"></i>
                                ${escapeHtml(stock.stockroom)}
                            </span>
                        </div>` : ''}
                        
                        ${stock.country ? `
                        <div class="asset-detail-item">
                            <span class="asset-detail-label">Country:</span>
                            <span class="asset-detail-value">${escapeHtml(stock.country)}</span>
                        </div>` : ''}
                        
                        ${stock.reserved_for ? `
                        <div class="asset-detail-item">
                            <span class="asset-detail-label">Reserved For:</span>
                            <span class="asset-detail-value">
                                <i class="fas fa-user" style="color: #3b82f6; margin-right: 4px;"></i>
                                ${escapeHtml(stock.reserved_for)}
                            </span>
                        </div>` : ''}
                        
                        ${stock.assigned_to ? `
                        <div class="asset-detail-item">
                            <span class="asset-detail-label">Assigned To:</span>
                            <span class="asset-detail-value">${escapeHtml(stock.assigned_to)}</span>
                        </div>` : ''}
                        
                        ${stock.location ? `
                        <div class="asset-detail-item">
                            <span class="asset-detail-label">Location:</span>
                            <span class="asset-detail-value">${escapeHtml(stock.location)}</span>
                        </div>` : ''}
                        
                        ${stock.asset_tag ? `
                        <div class="asset-detail-item">
                            <span class="asset-detail-label">Asset Tag:</span>
                            <span class="asset-detail-value">
                                <code style="background: rgba(132, 204, 22, 0.1); padding: 4px 8px; border-radius: 4px;">
                                    ${escapeHtml(stock.asset_tag)}
                                </code>
                            </span>
                        </div>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
    console.log('✅ Stock detail modal created');
}

function closeStockDetailModal(event) {
    if (event && event.target.id !== 'stockDetailModal') return;
    
    const modal = document.getElementById('stockDetailModal');
    if (modal) {
        console.log('🔒 Closing stock detail modal');
        modal.remove();
    }
}

// Enhanced simple asset detail modal
function showSimpleAssetDetail(asset) {
    console.log('🔍 Showing simple asset detail:', asset);
    
    const hostname = asset.configuration_item || asset.display_name || 'N/A';
    const category = asset.model_category || 'Asset';
    const categoryIcon = getCategoryIcon(category);
    const categoryColor = getCategoryColor(category);
    
    const html = `
        <div class="assets-modal-overlay show" id="simpleAssetModal" onclick="closeSimpleAssetModal(event)">
            <div class="assets-modal-dialog" onclick="event.stopPropagation()">
                <div class="assets-modal-header">
                    <h2 class="assets-modal-title">
                        <i class="fas ${categoryIcon}" style="color: ${categoryColor};"></i>
                        ${escapeHtml(hostname)}
                    </h2>
                    <button class="assets-close-modal" onclick="closeSimpleAssetModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="assets-modal-body">
                    <div class="asset-detail-grid">
                        ${asset.configuration_item ? `
                        <div class="asset-detail-item">
                            <span class="asset-detail-label">Configuration Item:</span>
                            <span class="asset-detail-value">${escapeHtml(asset.configuration_item)}</span>
                        </div>` : ''}
                        
                        ${asset.display_name ? `
                        <div class="asset-detail-item">
                            <span class="asset-detail-label">Display Name:</span>
                            <span class="asset-detail-value">${escapeHtml(asset.display_name)}</span>
                        </div>` : ''}
                        
                        ${asset.model_category ? `
                        <div class="asset-detail-item">
                            <span class="asset-detail-label">Category:</span>
                            <span class="asset-detail-value">
                                <span class="assets-type-badge" style="background: ${categoryColor}20; border-color: ${categoryColor}40; color: ${categoryColor};">
                                    <i class="fas ${categoryIcon}"></i>
                                    ${escapeHtml(asset.model_category)}
                                </span>
                            </span>
                        </div>` : ''}
                        
                        ${asset.model ? `
                        <div class="asset-detail-item">
                            <span class="asset-detail-label">Model:</span>
                            <span class="asset-detail-value">${escapeHtml(asset.model)}</span>
                        </div>` : ''}
                        
                        ${asset.serial_number ? `
                        <div class="asset-detail-item">
                            <span class="asset-detail-label">Serial Number:</span>
                            <span class="asset-detail-value">
                                <code style="background: rgba(132, 204, 22, 0.1); padding: 4px 8px; border-radius: 4px;">
                                    ${escapeHtml(asset.serial_number)}
                                </code>
                            </span>
                        </div>` : ''}
                        
                        ${asset.mac_address ? `
                        <div class="asset-detail-item">
                            <span class="asset-detail-label">MAC Address:</span>
                            <span class="asset-detail-value">
                                <code style="background: rgba(132, 204, 22, 0.1); padding: 4px 8px; border-radius: 4px;">
                                    ${escapeHtml(asset.mac_address)}
                                </code>
                            </span>
                        </div>` : ''}
                        
                        ${asset.ip_address ? `
                        <div class="asset-detail-item">
                            <span class="asset-detail-label">IP Address:</span>
                            <span class="asset-detail-value">${escapeHtml(asset.ip_address)}</span>
                        </div>` : ''}
                        
                        ${asset.state ? `
                        <div class="asset-detail-item">
                            <span class="asset-detail-label">State:</span>
                            <span class="asset-detail-value">${escapeHtml(asset.state)}</span>
                        </div>` : ''}
                        
                        ${asset.assigned_to ? `
                        <div class="asset-detail-item">
                            <span class="asset-detail-label">Assigned To:</span>
                            <span class="asset-detail-value">${escapeHtml(asset.assigned_to)}</span>
                        </div>` : ''}
                        
                        ${asset.assigned ? `
                        <div class="asset-detail-item">
                            <span class="asset-detail-label">Assigned Date:</span>
                            <span class="asset-detail-value">${formatDate(asset.assigned)}</span>
                        </div>` : ''}
                        
                        ${asset.city ? `
                        <div class="asset-detail-item">
                            <span class="asset-detail-label">City:</span>
                            <span class="asset-detail-value">${escapeHtml(asset.city)}</span>
                        </div>` : ''}
                        
                        ${asset.location_code ? `
                        <div class="asset-detail-item">
                            <span class="asset-detail-label">Location Code:</span>
                            <span class="asset-detail-value">
                                <strong style="color: #84cc16;">${escapeHtml(asset.location_code)}</strong>
                            </span>
                        </div>` : ''}
                        
                        ${asset.country ? `
                        <div class="asset-detail-item">
                            <span class="asset-detail-label">Country:</span>
                            <span class="asset-detail-value">${escapeHtml(asset.country)}</span>
                        </div>` : ''}
                        
                        ${asset.hardware_support_group ? `
                        <div class="asset-detail-item">
                            <span class="asset-detail-label">Hardware Support Group:</span>
                            <span class="asset-detail-value">${escapeHtml(asset.hardware_support_group)}</span>
                        </div>` : ''}
                        
                        ${asset.warranty_expiration ? `
                        <div class="asset-detail-item">
                            <span class="asset-detail-label">Warranty Expiration:</span>
                            <span class="asset-detail-value">${formatDate(asset.warranty_expiration)}</span>
                        </div>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
    console.log('✅ Simple asset modal created');
}

// Helper functions
function getCategoryIcon(category) {
    const iconMap = {
        'Computers': 'fa-laptop',
        'Mobile Device': 'fa-mobile-screen-button',
        'Wireless Access Points': 'fa-wifi',
        'Hubs/Switches': 'fa-network-wired',
        'Routers': 'fa-router',
        'Network Equipment': 'fa-ethernet',
        'Printing Devices': 'fa-print',
        'Windows Server': 'fa-server',
        'Linux Server': 'fa-server',
        'Servers': 'fa-server',
        'Hardware': 'fa-clock',
        'Telephony Equipment': 'fa-phone',
        'UPS': 'fa-battery-full'
    };
    return iconMap[category] || 'fa-cube';
}

function getCategoryColor(category) {
    const colorMap = {
        'Computers': '#eab308',
        'Mobile Device': '#3b82f6',
        'Wireless Access Points': '#a855f7',
        'Hubs/Switches': '#a855f7',
        'Routers': '#a855f7',
        'Network Equipment': '#a855f7',
        'Printing Devices': '#06b6d4',
        'Windows Server': '#ef4444',
        'Linux Server': '#f97316',
        'Servers': '#ef4444',
        'Hardware': '#10b981',
        'Telephony Equipment': '#8b5cf6',
        'UPS': '#14b8a6'
    };
    return colorMap[category] || '#6b7280';
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return 'N/A';
    }
}

function closeSimpleAssetModal(event) {
    if (event && event.target.id !== 'simpleAssetModal') return;
    
    const modal = document.getElementById('simpleAssetModal');
    if (modal) {
        console.log('🔒 Closing simple asset modal');
        modal.remove();
    }
}

function closeSearchModal() {
    const modal = document.getElementById('globalSearchModal');
    if (modal) {
        modal.classList.add('closing');
        setTimeout(() => modal.remove(), 300);
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    // Simple notification (you can improve this)
    alert(message);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initGlobalSearch);

console.log('✅ Global search ready');