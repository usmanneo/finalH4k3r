// ==================== GLOBAL VARIABLES ====================
let currentTools = [];
let filteredTools = [];
let currentCategory = 'all';
let isLoading = false;
let loadingProgress = 0;

// API Configuration
const API_BASE_URL = window.location.origin;
const ENDPOINTS = {
  tools: '/api/tools',
  status: '/api/status',
  uploadIcon: '/api/upload-icon'
};

// UI Elements
let toolsGrid, toolsLoading, progressFill, loadingStatus, loadingScreen, mainApp;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 H4K3R Tools Web Application Starting...');
  
  initializeUI();
  startLoadingSequence();
  setupEventListeners();
  
  // Wait for Firebase to be ready
  if (window.H4K3RFirebase) {
    window.H4K3RFirebase.onConnectionChange(handleConnectionChange);
    window.H4K3RFirebase.onToolsUpdate(handleToolsUpdate);
  }
});

// ==================== UI INITIALIZATION ====================
function initializeUI() {
  // Get DOM elements
  toolsGrid = document.getElementById('toolsGrid');
  toolsLoading = document.getElementById('toolsLoading');
  progressFill = document.getElementById('progressFill');
  loadingStatus = document.getElementById('loadingStatus');
  loadingScreen = document.getElementById('loadingScreen');
  mainApp = document.getElementById('mainApp');
  
  // Validate required elements
  const requiredElements = [toolsGrid, toolsLoading, loadingScreen, mainApp];
  const missingElements = requiredElements.filter(el => !el);
  
  if (missingElements.length > 0) {
    console.error('❌ Missing required DOM elements');
    return;
  }
  
  console.log('✅ UI elements initialized');
}

// ==================== LOADING SEQUENCE ====================
async function startLoadingSequence() {
  const loadingSteps = [
    { message: 'Initializing security protocols...', duration: 800 },
    { message: 'Establishing encrypted connection...', duration: 1000 },
    { message: 'Authenticating with server...', duration: 600 },
    { message: 'Loading cybersecurity toolkit...', duration: 1200 },
    { message: 'Synchronizing with Firebase...', duration: 800 },
    { message: 'Finalizing setup...', duration: 400 }
  ];
  
  let currentStep = 0;
  let totalProgress = 0;
  
  for (const step of loadingSteps) {
    updateLoadingStatus(step.message);
    
    const stepProgress = (100 / loadingSteps.length);
    await animateProgress(totalProgress, totalProgress + stepProgress, step.duration);
    totalProgress += stepProgress;
    currentStep++;
  }
  
  // Load tools while finishing loading animation
  loadToolsFromServer();
  
  // Complete loading
  setTimeout(() => {
    completeLoading();
  }, 500);
}

function updateLoadingStatus(message) {
  if (loadingStatus) {
    loadingStatus.textContent = message;
  }
  console.log(`📢 ${message}`);
}

async function animateProgress(from, to, duration) {
  return new Promise(resolve => {
    const steps = 30;
    const stepDuration = duration / steps;
    const stepSize = (to - from) / steps;
    let currentProgress = from;
    let step = 0;
    
    const interval = setInterval(() => {
      step++;
      currentProgress += stepSize;
      
      if (progressFill) {
        progressFill.style.width = `${Math.min(currentProgress, 100)}%`;
      }
      
      if (step >= steps) {
        clearInterval(interval);
        resolve();
      }
    }, stepDuration);
  });
}

function completeLoading() {
  updateLoadingStatus('Welcome to H4K3R Tools!');
  
  setTimeout(() => {
    if (loadingScreen && mainApp) {
      loadingScreen.style.opacity = '0';
      loadingScreen.style.transform = 'scale(0.95)';
      
      setTimeout(() => {
        loadingScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        
        // Trigger entrance animations
        setTimeout(() => {
          document.body.style.overflow = 'auto';
          startMainAppAnimations();
        }, 100);
      }, 500);
    }
  }, 1000);
}

function startMainAppAnimations() {
  // Animate stats cards
  const statCards = document.querySelectorAll('.stat-card');
  statCards.forEach((card, index) => {
    setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, index * 100);
  });
  
  // Animate section headers
  const sectionHeaders = document.querySelectorAll('.section-header');
  sectionHeaders.forEach((header, index) => {
    setTimeout(() => {
      header.style.opacity = '1';
      header.style.transform = 'translateY(0)';
    }, (index + 2) * 150);
  });
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
  // Refresh button
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', handleRefresh);
  }
  
  // Settings button
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      window.open('/settings', '_blank');
    });
  }
  
  // Admin button
  const adminBtn = document.getElementById('adminBtn');
  if (adminBtn) {
    adminBtn.addEventListener('click', () => {
      window.open('/admin', '_blank');
    });
  }
  
  // Category filter buttons
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      handleCategoryFilter(e.target.dataset.category);
    });
  });
  
  // Modal close handlers
  const modalClose = document.getElementById('modalClose');
  const modalCancel = document.getElementById('modalCancel');
  const modalOverlay = document.querySelector('.modal-overlay');
  
  [modalClose, modalCancel, modalOverlay].forEach(element => {
    if (element) {
      element.addEventListener('click', closeToolModal);
    }
  });
  
  // Modal open handler
  const modalOpen = document.getElementById('modalOpen');
  if (modalOpen) {
    modalOpen.addEventListener('click', openCurrentTool);
  }
  
  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts);
  
  console.log('✅ Event listeners initialized');
}

function handleKeyboardShortcuts(e) {
  // ESC to close modal
  if (e.key === 'Escape') {
    closeToolModal();
  }
  
  // F5 or Ctrl+R to refresh
  if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
    e.preventDefault();
    handleRefresh();
  }
  
  // Ctrl+Shift+A for admin panel
  if (e.ctrlKey && e.shiftKey && e.key === 'A') {
    e.preventDefault();
    window.open('/admin', '_blank');
  }
}

// ==================== TOOLS LOADING ====================
async function loadToolsFromServer() {
  if (isLoading) {
    console.log('⏳ Already loading tools...');
    return;
  }
  
  isLoading = true;
  showToolsLoading(true);
  
  try {
    console.log('🔄 Loading tools from server...');
    
    const response = await fetch(ENDPOINTS.tools, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Device-ID': window.H4K3RFirebase ? window.H4K3RFirebase.getDeviceId() : 'unknown'
      }
    });
    
    if (!response.ok) {
      if (response.status === 403) {
        const errorData = await response.json();
        if (errorData.code === 'DEVICE_BLOCKED') {
          showDeviceBlockedMessage(errorData.adminMessage);
          return;
        }
      }
      throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success && Array.isArray(data.data)) {
      currentTools = data.data;
      console.log(`✅ Loaded ${currentTools.length} tools from server`);
      
      // Update stats
      updateToolsCount(currentTools.length);
      
      // Display tools
      displayTools(currentTools);
      
      // Show success notification
      if (window.H4K3RFirebase) {
        window.H4K3RFirebase.showNotification(
          `Loaded ${currentTools.length} tools successfully!`,
          'success'
        );
      }
    } else {
      throw new Error('Invalid response format from server');
    }
    
  } catch (error) {
    console.error('❌ Error loading tools:', error);
    
    // Try to load from Firebase as fallback
    if (window.H4K3RFirebase && window.H4K3RFirebase.isReady()) {
      console.log('🔄 Trying to load from Firebase...');
      try {
        const firebaseTools = await window.H4K3RFirebase.getToolsFromFirebase();
        if (firebaseTools.length > 0) {
          currentTools = firebaseTools;
          displayTools(currentTools);
          updateToolsCount(currentTools.length);
          
          if (window.H4K3RFirebase) {
            window.H4K3RFirebase.showNotification(
              'Loaded tools from Firebase backup',
              'warning'
            );
          }
        } else {
          showToolsError('No tools available');
        }
      } catch (fbError) {
        console.error('❌ Firebase fallback failed:', fbError);
        showToolsError('Unable to load tools');
      }
    } else {
      showToolsError('Unable to connect to server');
    }
    
    if (window.H4K3RFirebase) {
      window.H4K3RFirebase.showNotification(
        'Failed to load tools from server',
        'error'
      );
    }
  } finally {
    isLoading = false;
    showToolsLoading(false);
  }
}

function showToolsLoading(show) {
  if (toolsLoading && toolsGrid) {
    if (show) {
      toolsLoading.classList.remove('hidden');
      toolsGrid.style.opacity = '0.5';
    } else {
      toolsLoading.classList.add('hidden');
      toolsGrid.style.opacity = '1';
    }
  }
}

function showToolsError(message) {
  if (toolsGrid) {
    toolsGrid.innerHTML = `
      <div style="
        grid-column: 1 / -1;
        text-align: center;
        padding: 3rem;
        background: rgba(255, 51, 102, 0.1);
        border: 1px solid rgba(255, 51, 102, 0.3);
        border-radius: 12px;
        color: #ff3366;
      ">
        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
        <h3>${message}</h3>
        <p>Please check your connection and try again.</p>
        <button onclick="handleRefresh()" style="
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background: #ff3366;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        ">Retry</button>
      </div>
    `;
  }
}

// ==================== TOOLS DISPLAY ====================
function displayTools(tools) {
  if (!toolsGrid) {
    console.error('❌ Tools grid element not found');
    return;
  }
  
  if (!tools || tools.length === 0) {
    toolsGrid.innerHTML = `
      <div style="
        grid-column: 1 / -1;
        text-align: center;
        padding: 3rem;
        color: #666666;
      ">
        <i class="fas fa-tools" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
        <h3>No tools available</h3>
        <p>Check back later for updates.</p>
      </div>
    `;
    return;
  }
  
  const toolsHTML = tools.map(tool => createToolCard(tool)).join('');
  toolsGrid.innerHTML = toolsHTML;
  
  // Add click events to tool cards
  const toolCards = toolsGrid.querySelectorAll('.tool-card');
  toolCards.forEach(card => {
    card.addEventListener('click', () => {
      const toolId = card.dataset.toolId;
      const tool = tools.find(t => t.id === toolId);
      if (tool) {
        openToolModal(tool);
      }
    });
    
    // Add hover animations
    addToolCardAnimations(card);
  });
  
  console.log(`✅ Displayed ${tools.length} tools`);
}

function createToolCard(tool) {
  const iconUrl = getToolIconUrl(tool);
  const categoryColor = getCategoryColor(tool.category);
  
  return `
    <div class="tool-card" data-tool-id="${tool.id}" data-category="${tool.category || 'General'}">
      <div class="tool-header">
        <div class="tool-icon" style="background: ${categoryColor};">
          ${iconUrl.startsWith('http') || iconUrl.startsWith('/') ? 
            `<img src="${iconUrl}" alt="${tool.name}" onerror="this.parentElement.innerHTML='<i class=\\"fas fa-tools\\"></i>'">` :
            `<i class="${getDefaultIcon(tool.category)}"></i>`
          }
        </div>
        <div class="tool-info">
          <h3 class="tool-name">${escapeHtml(tool.name)}</h3>
          <span class="tool-category" style="background: ${categoryColor};">
            ${escapeHtml(tool.category || 'General')}
          </span>
        </div>
      </div>
      
      <p class="tool-description">
        ${escapeHtml(tool.description || 'Professional cybersecurity tool for ethical hacking and security research.')}
      </p>
      
      <div class="tool-footer">
        <div class="tool-status">
          <i class="fas fa-check-circle"></i>
          <span>Ready</span>
        </div>
        <button class="tool-launch" onclick="event.stopPropagation(); launchTool('${tool.id}')">
          <i class="fas fa-rocket"></i>
          Launch
        </button>
      </div>
    </div>
  `;
}

function getToolIconUrl(tool) {
  if (tool.iconPath && tool.iconPath.startsWith('/uploads/')) {
    return tool.iconPath;
  }
  if (tool.icon && tool.icon !== 'default.png') {
    return `/uploads/icons/${tool.icon}`;
  }
  return getDefaultIcon(tool.category);
}

function getCategoryColor(category) {
  const colors = {
    'Network': 'linear-gradient(45deg, #00ffff, #0080ff)',
    'Web': 'linear-gradient(45deg, #ff0080, #ff4080)',
    'Crypto': 'linear-gradient(45deg, #00ff41, #80ff41)',
    'OSINT': 'linear-gradient(45deg, #ffff00, #ffff80)',
    'Mobile': 'linear-gradient(45deg, #ff8000, #ffb366)',
    'Exploit': 'linear-gradient(45deg, #ff3366, #ff6699)',
    'Security': 'linear-gradient(45deg, #8000ff, #b366ff)',
    'Analysis': 'linear-gradient(45deg, #ff0040, #ff4080)'
  };
  
  return colors[category] || 'linear-gradient(45deg, #00ffff, #0080ff)';
}

function getDefaultIcon(category) {
  const icons = {
    'Network': 'fas fa-network-wired',
    'Web': 'fas fa-globe',
    'Crypto': 'fas fa-key',
    'OSINT': 'fas fa-search',
    'Mobile': 'fas fa-mobile-alt',
    'Exploit': 'fas fa-bug',
    'Security': 'fas fa-shield-alt',
    'Analysis': 'fas fa-microscope'
  };
  
  return icons[category] || 'fas fa-tools';
}

function addToolCardAnimations(card) {
  card.addEventListener('mouseenter', () => {
    card.style.transform = 'translateY(-10px) scale(1.02)';
    card.style.boxShadow = '0 20px 40px rgba(0, 255, 255, 0.3)';
  });
  
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'translateY(0) scale(1)';
    card.style.boxShadow = '';
  });
}

// ==================== CATEGORY FILTERING ====================
function handleCategoryFilter(category) {
  currentCategory = category;
  
  // Update filter buttons
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.classList.remove('active');
  });
  
  const activeBtn = document.querySelector(`[data-category="${category}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // Filter tools
  if (category === 'all') {
    filteredTools = currentTools;
  } else {
    filteredTools = currentTools.filter(tool => 
      tool.category && tool.category.toLowerCase() === category.toLowerCase()
    );
  }
  
  // Display filtered tools with animation
  animateToolsChange(filteredTools);
  
  console.log(`🔍 Filtered to ${filteredTools.length} tools in category: ${category}`);
}

function animateToolsChange(tools) {
  if (!toolsGrid) return;
  
  // Fade out current tools
  toolsGrid.style.opacity = '0.3';
  toolsGrid.style.transform = 'scale(0.95)';
  
  setTimeout(() => {
    displayTools(tools);
    
    // Fade in new tools
    toolsGrid.style.opacity = '1';
    toolsGrid.style.transform = 'scale(1)';
  }, 200);
}

// ==================== TOOL MODAL ====================
let currentModalTool = null;

function openToolModal(tool) {
  currentModalTool = tool;
  const modal = document.getElementById('toolModal');
  const modalTitle = document.getElementById('modalTitle');
  const toolFrame = document.getElementById('toolFrame');
  
  if (!modal || !modalTitle || !toolFrame) {
    console.error('❌ Modal elements not found');
    return;
  }
  
  modalTitle.textContent = tool.name;
  toolFrame.src = tool.url || tool.id;
  
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  
  console.log(`📱 Opened modal for tool: ${tool.name}`);
}

function closeToolModal() {
  const modal = document.getElementById('toolModal');
  const toolFrame = document.getElementById('toolFrame');
  
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }
  
  if (toolFrame) {
    toolFrame.src = '';
  }
  
  currentModalTool = null;
  console.log('📱 Closed tool modal');
}

function openCurrentTool() {
  if (currentModalTool) {
    window.open(currentModalTool.url || currentModalTool.id, '_blank');
    closeToolModal();
  }
}

// ==================== TOOL LAUNCH ====================
function launchTool(toolId) {
  const tool = currentTools.find(t => t.id === toolId);
  if (!tool) {
    console.error('❌ Tool not found:', toolId);
    return;
  }
  
  console.log(`🚀 Launching tool: ${tool.name}`);
  
  // Show launch animation
  const card = document.querySelector(`[data-tool-id="${toolId}"]`);
  if (card) {
    card.style.transform = 'scale(1.05)';
    card.style.boxShadow = '0 0 30px rgba(0, 255, 255, 0.6)';
    
    setTimeout(() => {
      card.style.transform = '';
      card.style.boxShadow = '';
    }, 300);
  }
  
  // Open tool in new tab
  window.open(tool.url || tool.id, '_blank');
  
  // Track tool usage
  if (window.H4K3RFirebase && window.H4K3RFirebase.isReady()) {
    trackToolUsage(tool);
  }
  
  if (window.H4K3RFirebase) {
    window.H4K3RFirebase.showNotification(
      `Launched ${tool.name}`,
      'success'
    );
  }
}

async function trackToolUsage(tool) {
  // This would track tool usage analytics in Firebase
  console.log(`📊 Tracking usage for: ${tool.name}`);
}

// ==================== CONNECTION HANDLING ====================
function handleConnectionChange(connected) {
  console.log(`📡 Connection status changed: ${connected ? 'Connected' : 'Disconnected'}`);
  
  if (connected) {
    // Reload tools when reconnected
    setTimeout(() => {
      loadToolsFromServer();
    }, 1000);
  }
}

function handleToolsUpdate(tools) {
  console.log(`📡 Real-time tools update received: ${tools.length} tools`);
  currentTools = tools;
  
  // Re-apply current filter
  if (currentCategory === 'all') {
    displayTools(currentTools);
  } else {
    handleCategoryFilter(currentCategory);
  }
  
  updateToolsCount(tools.length);
}

// ==================== UI UPDATES ====================
function updateToolsCount(count) {
  const toolsCountElement = document.getElementById('toolsCount');
  if (toolsCountElement) {
    toolsCountElement.textContent = count.toString();
  }
}

function updateLastUpdate() {
  const lastUpdateElement = document.getElementById('lastUpdate');
  if (lastUpdateElement) {
    lastUpdateElement.textContent = 'Now';
  }
}

// ==================== REFRESH HANDLER ====================
async function handleRefresh() {
  console.log('🔄 Refreshing application...');
  
  if (window.H4K3RFirebase) {
    window.H4K3RFirebase.showNotification('Refreshing tools...', 'info');
  }
  
  // Animate refresh button
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.style.transform = 'rotate(360deg)';
    setTimeout(() => {
      refreshBtn.style.transform = '';
    }, 500);
  }
  
  // Reload tools
  await loadToolsFromServer();
  updateLastUpdate();
  
  console.log('✅ Application refreshed');
}

// ==================== UTILITY FUNCTIONS ====================
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showDeviceBlockedMessage(message) {
  if (window.H4K3RFirebase && window.H4K3RFirebase.showDeviceBlockedMessage) {
    window.H4K3RFirebase.showDeviceBlockedMessage(message);
  } else {
    alert(`Device Blocked: ${message}`);
    window.location.href = '/blocked';
  }
}

// ==================== ERROR HANDLING ====================
window.addEventListener('error', (event) => {
  console.error('❌ Global error:', event.error);
  
  if (window.H4K3RFirebase) {
    window.H4K3RFirebase.showNotification(
      'An error occurred. Please refresh the page.',
      'error'
    );
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection:', event.reason);
  
  if (window.H4K3RFirebase) {
    window.H4K3RFirebase.showNotification(
      'Connection error. Please check your internet.',
      'error'
    );
  }
});

// ==================== EXPORTS ====================
// Make functions available globally for inline event handlers
window.launchTool = launchTool;
window.handleRefresh = handleRefresh;
window.openToolModal = openToolModal;
window.closeToolModal = closeToolModal;

console.log('✅ H4K3R Tools Web Application Initialized');
