// ==================== ICON MANAGEMENT SYSTEM ====================

class IconManager {
  constructor() {
    this.cache = new Map();
    this.defaultIcons = new Map();
    this.loadingQueue = new Set();
    
    this.initializeDefaultIcons();
  }
  
  // ==================== DEFAULT ICONS ====================
  initializeDefaultIcons() {
    // Create SVG-based default icons for different categories
    this.defaultIcons.set('Network', this.createSVGIcon('🌐', '#00ffff'));
    this.defaultIcons.set('Web', this.createSVGIcon('🔗', '#ff0080'));
    this.defaultIcons.set('Crypto', this.createSVGIcon('🔐', '#00ff41'));
    this.defaultIcons.set('OSINT', this.createSVGIcon('🔍', '#ffff00'));
    this.defaultIcons.set('Mobile', this.createSVGIcon('📱', '#ff8000'));
    this.defaultIcons.set('Exploit', this.createSVGIcon('🐛', '#ff3366'));
    this.defaultIcons.set('Security', this.createSVGIcon('🛡️', '#8000ff'));
    this.defaultIcons.set('Analysis', this.createSVGIcon('🔬', '#ff0040'));
    this.defaultIcons.set('General', this.createSVGIcon('⚡', '#00ffff'));
    
    console.log('✅ Default icons initialized');
  }
  
  createSVGIcon(emoji, color) {
    const svg = `
      <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad-${color.replace('#', '')}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${this.lightenColor(color, 20)};stop-opacity:1" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
        </defs>
        <rect width="64" height="64" rx="12" fill="url(#grad-${color.replace('#', '')})" filter="url(#glow)" opacity="0.8"/>
        <text x="32" y="42" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="white" filter="url(#glow)">${emoji}</text>
      </svg>
    `;
    
    return 'data:image/svg+xml;base64,' + btoa(svg);
  }
  
  lightenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16).slice(1);
  }
  
  // ==================== ICON LOADING ====================
  async getIcon(iconPath, category = 'General', toolName = '') {
    // Return from cache if available
    if (this.cache.has(iconPath)) {
      return this.cache.get(iconPath);
    }
    
    // If already loading, wait for it
    if (this.loadingQueue.has(iconPath)) {
      return this.waitForLoading(iconPath);
    }
    
    // Mark as loading
    this.loadingQueue.add(iconPath);
    
    try {
      let iconUrl;
      
      // Check if it's a full URL
      if (iconPath.startsWith('http://') || iconPath.startsWith('https://')) {
        iconUrl = iconPath;
      }
      // Check if it's an upload path
      else if (iconPath.startsWith('/uploads/')) {
        iconUrl = iconPath;
      }
      // Check if it's a filename
      else if (iconPath && !iconPath.includes('default')) {
        iconUrl = `/uploads/icons/${iconPath}`;
      }
      // Generate default icon
      else {
        iconUrl = this.getDefaultIcon(category, toolName);
      }
      
      // Try to load the icon
      const loadedIcon = await this.loadAndValidateIcon(iconUrl);
      
      // Cache successful result
      this.cache.set(iconPath, loadedIcon);
      this.loadingQueue.delete(iconPath);
      
      return loadedIcon;
      
    } catch (error) {
      console.warn(`⚠️  Failed to load icon: ${iconPath}`, error);
      
      // Fallback to default icon
      const defaultIcon = this.getDefaultIcon(category, toolName);
      this.cache.set(iconPath, defaultIcon);
      this.loadingQueue.delete(iconPath);
      
      return defaultIcon;
    }
  }
  
  async loadAndValidateIcon(iconUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        // Icon loaded successfully
        resolve(iconUrl);
      };
      
      img.onerror = () => {
        // Failed to load
        reject(new Error(`Failed to load icon: ${iconUrl}`));
      };
      
      // Set timeout for loading
      setTimeout(() => {
        reject(new Error(`Icon loading timeout: ${iconUrl}`));
      }, 5000);
      
      img.src = iconUrl;
    });
  }
  
  async waitForLoading(iconPath) {
    // Poll until loading is complete
    while (this.loadingQueue.has(iconPath)) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return this.cache.get(iconPath);
  }
  
  getDefaultIcon(category = 'General', toolName = '') {
    // Try to get category-specific icon
    if (this.defaultIcons.has(category)) {
      return this.defaultIcons.get(category);
    }
    
    // Generate dynamic icon based on tool name
    if (toolName) {
      return this.generateDynamicIcon(toolName, category);
    }
    
    // Return general default
    return this.defaultIcons.get('General');
  }
  
  generateDynamicIcon(toolName, category = 'General') {
    // Get first letter of tool name
    const letter = toolName.charAt(0).toUpperCase();
    
    // Get color based on category
    const colors = {
      'Network': '#00ffff',
      'Web': '#ff0080', 
      'Crypto': '#00ff41',
      'OSINT': '#ffff00',
      'Mobile': '#ff8000',
      'Exploit': '#ff3366',
      'Security': '#8000ff',
      'Analysis': '#ff0040'
    };
    
    const color = colors[category] || '#00ffff';
    
    const svg = `
      <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad-${letter}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${this.lightenColor(color, 30)};stop-opacity:1" />
          </linearGradient>
          <filter id="glow-${letter}">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
        </defs>
        <rect width="64" height="64" rx="16" fill="url(#grad-${letter})" filter="url(#glow-${letter})" opacity="0.9"/>
        <text x="32" y="42" font-family="Orbitron, monospace" font-size="28" font-weight="bold" text-anchor="middle" fill="white" filter="url(#glow-${letter})">${letter}</text>
        <rect x="2" y="2" width="60" height="60" rx="14" fill="none" stroke="${color}" stroke-width="2" opacity="0.5"/>
      </svg>
    `;
    
    return 'data:image/svg+xml;base64,' + btoa(svg);
  }
  
  // ==================== CACHE MANAGEMENT ====================
  clearCache() {
    this.cache.clear();
    console.log('🧹 Icon cache cleared');
  }
  
  getCacheSize() {
    return this.cache.size;
  }
  
  getCacheStats() {
    return {
      size: this.cache.size,
      loading: this.loadingQueue.size,
      defaultIcons: this.defaultIcons.size
    };
  }
  
  // ==================== PRELOADING ====================
  async preloadIcons(iconPaths) {
    const promises = iconPaths.map(path => this.getIcon(path));
    
    try {
      await Promise.allSettled(promises);
      console.log(`📥 Preloaded ${iconPaths.length} icons`);
    } catch (error) {
      console.warn('⚠️  Some icons failed to preload:', error);
    }
  }
  
  // ==================== ICON UPLOAD ====================
  async uploadIcon(file, toolName = '') {
    if (!file) {
      throw new Error('No file provided');
    }
    
    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only PNG, JPEG, GIF, and WebP are allowed.');
    }
    
    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('File too large. Maximum size is 2MB.');
    }
    
    const formData = new FormData();
    formData.append('icon', file);
    
    try {
      const response = await fetch('/api/upload-icon', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }
      
      console.log('✅ Icon uploaded successfully:', result.iconPath);
      return result;
      
    } catch (error) {
      console.error('❌ Icon upload error:', error);
      throw error;
    }
  }
  
  // ==================== UTILITY METHODS ====================
  isValidIconPath(path) {
    if (!path) return false;
    
    // Check for valid URL or path
    return path.startsWith('http://') || 
           path.startsWith('https://') || 
           path.startsWith('/uploads/') ||
           path.startsWith('data:image/');
  }
  
  getIconElement(iconUrl, altText = 'Tool Icon', className = '') {
    const img = document.createElement('img');
    img.src = iconUrl;
    img.alt = altText;
    img.className = className;
    
    // Add error handling
    img.onerror = () => {
      img.src = this.getDefaultIcon();
    };
    
    return img;
  }
  
  // ==================== OPTIMIZATION ====================
  optimizeIcon(canvas, maxSize = 64) {
    // Create optimized version of canvas
    const optimizedCanvas = document.createElement('canvas');
    const ctx = optimizedCanvas.getContext('2d');
    
    optimizedCanvas.width = maxSize;
    optimizedCanvas.height = maxSize;
    
    ctx.drawImage(canvas, 0, 0, maxSize, maxSize);
    
    return optimizedCanvas.toDataURL('image/png', 0.8);
  }
}

// ==================== GLOBAL INSTANCE ====================
const iconManager = new IconManager();

// Make it available globally
window.H4K3RIconManager = iconManager;

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IconManager;
}

console.log('✅ Icon Manager initialized');
