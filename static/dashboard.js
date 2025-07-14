// Dashboard JavaScript for WhatsApp Bot Admin Panel
// Handles real-time updates, charts, and interactive features

let messageChart = null;
let typeChart = null;
let refreshInterval = null;

/**
 * Initialize the dashboard with stats data
 */
function initializeDashboard(statsData) {
    console.log('Initializing dashboard with data:', statsData);
    
    // Initialize charts
    initializeMessageChart(statsData.daily_messages || []);
    initializeTypeChart(statsData.message_types || {});
    
    // Setup auto-refresh
    setupAutoRefresh();
    
    // Initialize tooltips
    initializeTooltips();
    
    // Setup live updates
    setupLiveUpdates();
}

/**
 * Initialize message activity chart
 */
function initializeMessageChart(dailyMessages) {
    const ctx = document.getElementById('messageChart');
    if (!ctx) return;
    
    // Prepare data for last 7 days
    const labels = [];
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
        
        // Find data for this date
        const dayData = dailyMessages.find(d => d.date === dateStr);
        data.push(dayData ? dayData.count : 0);
    }
    
    // Destroy existing chart if it exists
    if (messageChart) {
        messageChart.destroy();
    }
    
    messageChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Messages',
                data: data,
                borderColor: 'rgb(13, 110, 253)',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgb(13, 110, 253)',
                pointBorderColor: 'rgb(13, 110, 253)',
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: 'rgb(13, 110, 253)',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    }
                },
                y: {
                    display: true,
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        stepSize: 1
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

/**
 * Initialize message type pie chart
 */
function initializeTypeChart(messageTypes) {
    const ctx = document.getElementById('typeChart');
    if (!ctx) return;
    
    // Prepare data
    const labels = Object.keys(messageTypes);
    const data = Object.values(messageTypes);
    const colors = [
        'rgb(13, 110, 253)',   // Primary blue
        'rgb(25, 135, 84)',    // Success green
        'rgb(255, 193, 7)',    // Warning yellow
        'rgb(220, 53, 69)',    // Danger red
        'rgb(13, 202, 240)',   // Info cyan
        'rgb(108, 117, 125)',  // Secondary gray
        'rgb(102, 16, 242)',   // Purple
        'rgb(255, 112, 67)'    // Orange
    ];
    
    // Destroy existing chart if it exists
    if (typeChart) {
        typeChart.destroy();
    }
    
    if (labels.length === 0) {
        // Show empty state
        ctx.parentElement.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-chart-pie fa-2x mb-2"></i>
                <p class="mb-0">No message data available</p>
            </div>
        `;
        return;
    }
    
    typeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.map(label => label.charAt(0).toUpperCase() + label.slice(1)),
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: 'rgba(33, 37, 41, 1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        padding: 15,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: 'rgb(13, 110, 253)',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed * 100) / total).toFixed(1);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

/**
 * Refresh dashboard statistics
 */
async function refreshStats() {
    try {
        showLoadingState();
        
        const response = await fetch('/api/stats');
        if (!response.ok) {
            throw new Error('Failed to fetch stats');
        }
        
        const statsData = await response.json();
        
        // Update stat cards
        updateStatCards(statsData);
        
        // Update charts
        initializeMessageChart(statsData.daily_messages || []);
        initializeTypeChart(statsData.message_types || {});
        
        // Update popular commands
        updatePopularCommands(statsData.popular_commands || []);
        
        // Update user stats
        updateUserStats(statsData.user_stats || {});
        
        // Update timestamp
        updateLastUpdated(statsData.last_updated);
        
        hideLoadingState();
        showSuccessMessage('Dashboard updated successfully');
        
    } catch (error) {
        console.error('Error refreshing stats:', error);
        hideLoadingState();
        showErrorMessage('Failed to refresh dashboard data');
    }
}

/**
 * Update stat cards with new data
 */
function updateStatCards(stats) {
    const cards = {
        'total_users': stats.total_users || 0,
        'total_messages': stats.total_messages || 0,
        'ai_requests': stats.ai_requests || 0,
        'active_groups': stats.active_groups || 0
    };
    
    Object.entries(cards).forEach(([key, value]) => {
        const element = document.querySelector(`[data-stat="${key}"]`);
        if (element) {
            animateNumber(element, value);
        }
    });
    
    // Update secondary stats
    updateSecondaryStats(stats);
}

/**
 * Update secondary statistics
 */
function updateSecondaryStats(stats) {
    const secondaryStats = {
        'active_users_7d': stats.active_users_7d || 0,
        'commands_used': stats.commands_used || 0,
        'files_processed': stats.files_processed || 0,
        'uptime': stats.uptime || '0:00:00'
    };
    
    Object.entries(secondaryStats).forEach(([key, value]) => {
        const element = document.querySelector(`[data-secondary-stat="${key}"]`);
        if (element) {
            element.textContent = value;
        }
    });
}

/**
 * Update popular commands list
 */
function updatePopularCommands(commands) {
    const container = document.querySelector('#popular-commands-list');
    if (!container) return;
    
    if (commands.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-inbox fa-2x mb-2"></i>
                <p class="mb-0">No commands used yet</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = commands.map(cmd => `
        <div class="list-group-item d-flex justify-content-between align-items-center">
            <div>
                <i class="fas fa-terminal text-muted me-2"></i>
                <code>/${cmd.command}</code>
            </div>
            <span class="badge bg-primary rounded-pill">${cmd.count}</span>
        </div>
    `).join('');
}

/**
 * Update user statistics
 */
function updateUserStats(userStats) {
    const stats = {
        'user-total': userStats.total || 0,
        'user-active': userStats.active_7d || 0,
        'user-admins': userStats.admins || 0,
        'user-banned': userStats.banned || 0
    };
    
    Object.entries(stats).forEach(([key, value]) => {
        const element = document.querySelector(`[data-user-stat="${key}"]`);
        if (element) {
            animateNumber(element, value);
        }
    });
}

/**
 * Animate number changes
 */
function animateNumber(element, targetValue) {
    const currentValue = parseInt(element.textContent) || 0;
    const increment = (targetValue - currentValue) / 20;
    let current = currentValue;
    
    const animation = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= targetValue) || (increment < 0 && current <= targetValue)) {
            current = targetValue;
            clearInterval(animation);
        }
        element.textContent = Math.round(current);
    }, 50);
}

/**
 * Setup auto-refresh functionality
 */
function setupAutoRefresh() {
    // Clear existing interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    // Auto-refresh every 30 seconds
    refreshInterval = setInterval(refreshStats, 30000);
}

/**
 * Initialize Bootstrap tooltips
 */
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

/**
 * Setup live updates and real-time features
 */
function setupLiveUpdates() {
    // Add pulse animation to online status
    const onlineStatus = document.querySelector('.status-online');
    if (onlineStatus) {
        setInterval(() => {
            onlineStatus.style.opacity = '0.5';
            setTimeout(() => {
                onlineStatus.style.opacity = '1';
            }, 500);
        }, 2000);
    }
    
    // Update timestamp every minute
    setInterval(updateCurrentTime, 60000);
}

/**
 * Show loading state
 */
function showLoadingState() {
    const refreshBtn = document.querySelector('[onclick="refreshStats()"]');
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Refreshing...';
    }
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    const refreshBtn = document.querySelector('[onclick="refreshStats()"]');
    if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt me-1"></i>Refresh';
    }
}

/**
 * Show success message
 */
function showSuccessMessage(message) {
    showToast(message, 'success');
}

/**
 * Show error message
 */
function showErrorMessage(message) {
    showToast(message, 'danger');
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0 position-fixed top-0 end-0 m-3`;
    toast.style.zIndex = '9999';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'danger' ? 'exclamation-triangle' : 'info'} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Show toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove from DOM after hiding
    toast.addEventListener('hidden.bs.toast', () => {
        document.body.removeChild(toast);
    });
}

/**
 * Update last updated timestamp
 */
function updateLastUpdated(timestamp) {
    const element = document.getElementById('lastUpdated');
    if (element && timestamp) {
        element.textContent = timestamp;
    }
}

/**
 * Update current time display
 */
function updateCurrentTime() {
    const now = new Date();
    const timestamp = now.toLocaleString();
    updateLastUpdated(timestamp);
}

/**
 * Export chart data as image
 */
function exportChart(chartType) {
    const chart = chartType === 'message' ? messageChart : typeChart;
    if (!chart) return;
    
    const url = chart.toBase64Image();
    const link = document.createElement('a');
    link.download = `${chartType}-chart.png`;
    link.href = url;
    link.click();
}

/**
 * Toggle chart type
 */
function toggleChartType(chartElement, newType) {
    // This would allow switching between line/bar charts
    // Implementation depends on specific requirements
    console.log(`Toggling chart type to: ${newType}`);
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add data attributes to elements for easier updates
    addDataAttributes();
    
    // Setup event listeners
    setupEventListeners();
});

/**
 * Add data attributes to stat elements
 */
function addDataAttributes() {
    // Add data attributes to stat cards for easier updates
    const statMappings = {
        'total_users': 'h3:contains("{{ stats.total_users or 0 }}")',
        'total_messages': 'h3:contains("{{ stats.total_messages or 0 }}")',
        'ai_requests': 'h3:contains("{{ stats.ai_requests or 0 }}")',
        'active_groups': 'h3:contains("{{ stats.active_groups or 0 }}")'
    };
    
    // This would be handled server-side in the template
}

/**
 * Setup additional event listeners
 */
function setupEventListeners() {
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            refreshStats();
        }
    });
    
    // Visibility change handling
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            // Refresh when tab becomes visible
            refreshStats();
        }
    });
}

// Export functions for global access
window.initializeDashboard = initializeDashboard;
window.refreshStats = refreshStats;
window.exportChart = exportChart;
