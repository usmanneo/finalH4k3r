const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const compression = require('compression');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

// Import Firebase configuration
const { initializeFirebase, db, admin } = require('./firebase-config');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARE SETUP ====================

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline styles/scripts for admin dashboard
  crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'https://h4k3rtools.onrender.com', 'https://hackertoolkit.netlify.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-ID'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// ==================== STORAGE CONFIGURATION ====================

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'public/uploads/icons');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `icon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PNG, JPEG, GIF, and WebP are allowed.'));
    }
  }
});

// ==================== FIREBASE INITIALIZATION ====================
let firebaseInitialized = false;
let devicesCollection = new Map();
let blockedDevices = new Set();

async function initializeServer() {
  try {
    await initializeFirebase();
    firebaseInitialized = true;
    console.log('🔥 Firebase initialized successfully');
    
    // Load blocked devices from Firebase
    loadBlockedDevices();
  } catch (error) {
    console.warn('⚠️  Firebase initialization failed, running in API-only mode:', error.message);
    firebaseInitialized = false;
  }
}

async function loadBlockedDevices() {
  if (!firebaseInitialized) return;
  
  try {
    const devicesRef = db.ref('devices');
    devicesRef.on('value', (snapshot) => {
      const devices = snapshot.val();
      blockedDevices.clear();
      
      if (devices) {
        Object.entries(devices).forEach(([deviceId, deviceData]) => {
          if (deviceData.status === 'blocked') {
            blockedDevices.add(deviceId);
          }
        });
      }
      console.log('🔄 Updated blocked devices:', blockedDevices.size);
    });
  } catch (error) {
    console.error('❌ Error loading blocked devices:', error);
  }
}

// ==================== DEVICE MANAGEMENT MIDDLEWARE ====================

function checkDeviceBlocked(req, res, next) {
  const deviceId = req.headers['x-device-id'];
  
  if (deviceId && blockedDevices.has(deviceId)) {
    return res.status(403).json({
      success: false,
      code: 'DEVICE_BLOCKED',
      error: 'Device access denied',
      adminMessage: 'Your device has been blocked by administrator for security reasons.',
      deviceId: deviceId.substring(0, 8) + '...'
    });
  }
  
  // Track device access
  if (deviceId && firebaseInitialized) {
    trackDeviceAccess(deviceId, req);
  }
  
  next();
}

async function trackDeviceAccess(deviceId, req) {
  try {
    const deviceRef = db.ref(`connected_devices/${deviceId}`);
    await deviceRef.update({
      lastAccess: Date.now(),
      endpoint: req.path,
      userAgent: req.headers['user-agent'] || 'Unknown',
      ipAddress: req.ip || req.connection.remoteAddress || 'Unknown'
    });
  } catch (error) {
    console.error('❌ Error tracking device access:', error);
  }
}

// ==================== TOOLS DATA MANAGEMENT ====================

// Default tools configuration
const defaultTools = [
  {
    id: uuidv4(),
    name: "WiFi Password Cracker",
    url: "https://wifipassword.h4k3r.tools",
    icon: "wifi-crack.png",
    category: "Network",
    description: "Advanced WiFi security assessment tool"
  },
  {
    id: uuidv4(),
    name: "Port Scanner Pro",
    url: "https://portscan.h4k3r.tools",
    icon: "port-scanner.png",
    category: "Network",
    description: "Professional network port scanning"
  },
  {
    id: uuidv4(),
    name: "SQL Injection Tester",
    url: "https://sqlinjection.h4k3r.tools",
    icon: "sql-inject.png",
    category: "Web",
    description: "Comprehensive SQL injection testing"
  },
  {
    id: uuidv4(),
    name: "Hash Cracker Elite",
    url: "https://hashcrack.h4k3r.tools",
    icon: "hash-crack.png",
    category: "Crypto",
    description: "Multi-algorithm hash cracking tool"
  },
  {
    id: uuidv4(),
    name: "Phishing Kit Builder",
    url: "https://phishing.h4k3r.tools",
    icon: "phishing.png",
    category: "Social",
    description: "Advanced phishing campaign builder"
  },
  {
    id: uuidv4(),
    name: "Steganography Studio",
    url: "https://stego.h4k3r.tools",
    icon: "steganography.png",
    category: "Crypto",
    description: "Hide data in images and files"
  },
  {
    id: uuidv4(),
    name: "Payload Generator",
    url: "https://payloads.h4k3r.tools",
    icon: "payload.png",
    category: "Exploit",
    description: "Custom payload generation tool"
  },
  {
    id: uuidv4(),
    name: "OSINT Framework",
    url: "https://osint.h4k3r.tools",
    icon: "osint.png",
    category: "Intel",
    description: "Open source intelligence gathering"
  },
  {
    id: uuidv4(),
    name: "Vulnerability Scanner",
    url: "https://vulnscan.h4k3r.tools",
    icon: "vuln-scan.png",
    category: "Security",
    description: "Automated vulnerability detection"
  },
  {
    id: uuidv4(),
    name: "Malware Analyzer",
    url: "https://malware.h4k3r.tools",
    icon: "malware.png",
    category: "Analysis",
    description: "Advanced malware analysis suite"
  },
  {
    id: uuidv4(),
    name: "Social Media Harvester",
    url: "https://social.h4k3r.tools",
    icon: "social-harvest.png",
    category: "OSINT",
    description: "Social media intelligence tool"
  },
  {
    id: uuidv4(),
    name: "DNS Enumeration",
    url: "https://dnsenum.h4k3r.tools",
    icon: "dns-enum.png",
    category: "Network",
    description: "Advanced DNS reconnaissance"
  },
  {
    id: uuidv4(),
    name: "Web Shell Generator",
    url: "https://webshell.h4k3r.tools",
    icon: "webshell.png",
    category: "Exploit",
    description: "Dynamic web shell creation"
  },
  {
    id: uuidv4(),
    name: "Keylogger Builder",
    url: "https://keylogger.h4k3r.tools",
    icon: "keylogger.png",
    category: "Malware",
    description: "Stealth keylogger generation"
  },
  {
    id: uuidv4(),
    name: "Bluetooth Hacking",
    url: "https://bluetooth.h4k3r.tools",
    icon: "bluetooth.png",
    category: "Mobile",
    description: "Bluetooth security assessment"
  },
  {
    id: uuidv4(),
    name: "Email Harvester",
    url: "https://emailharvest.h4k3r.tools",
    icon: "email-harvest.png",
    category: "OSINT",
    description: "Email address collection tool"
  }
];

// ==================== API ENDPOINTS ====================

// Health check endpoint
app.get('/api/status', checkDeviceBlocked, (req, res) => {
  res.json({
    success: true,
    status: 'online',
    version: '2.0.0',
    timestamp: Date.now(),
    firebase: firebaseInitialized,
    tools: defaultTools.length,
    message: 'H4K3R Tools Server Running'
  });
});

// Get tools endpoint
app.get('/api/tools', checkDeviceBlocked, async (req, res) => {
  try {
    let tools = [...defaultTools];
    
    // Try to get tools from Firebase if available
    if (firebaseInitialized) {
      try {
        const toolsRef = db.ref('tools');
        const snapshot = await toolsRef.once('value');
        const firebaseTools = snapshot.val();
        
        if (firebaseTools) {
          const fbToolsArray = Object.entries(firebaseTools).map(([key, tool]) => ({
            id: key,
            ...tool
          }));
          tools = fbToolsArray.length > 0 ? fbToolsArray : tools;
          console.log(`📡 Loaded ${fbToolsArray.length} tools from Firebase`);
        }
      } catch (fbError) {
        console.warn('⚠️  Firebase tools load failed, using defaults:', fbError.message);
      }
    }
    
    res.json({
      success: true,
      data: tools,
      count: tools.length,
      timestamp: Date.now()
    });
    
    console.log(`🚀 Tools served to device: ${req.headers['x-device-id']?.substring(0, 8) || 'Unknown'}`);
  } catch (error) {
    console.error('❌ Error serving tools:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Upload icon endpoint
app.post('/api/upload-icon', upload.single('icon'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    const iconPath = `/uploads/icons/${req.file.filename}`;
    const iconUrl = `${req.protocol}://${req.get('host')}${iconPath}`;
    
    console.log(`🎨 Icon uploaded: ${req.file.filename}`);
    
    res.json({
      success: true,
      iconPath: iconPath,
      iconUrl: iconUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (error) {
    console.error('❌ Error uploading icon:', error);
    res.status(500).json({
      success: false,
      error: 'Upload failed',
      message: error.message
    });
  }
});

// Add/Update tool endpoint
app.post('/api/tools', express.json(), async (req, res) => {
  try {
    const { name, url, icon, category, description } = req.body;
    
    if (!name || !url) {
      return res.status(400).json({
        success: false,
        error: 'Name and URL are required'
      });
    }
    
    const newTool = {
      id: uuidv4(),
      name,
      url,
      icon: icon || 'default.png',
      category: category || 'General',
      description: description || '',
      timestamp: Date.now()
    };
    
    // Save to Firebase if available
    if (firebaseInitialized) {
      try {
        const toolRef = db.ref(`tools/${newTool.id}`);
        await toolRef.set(newTool);
        console.log(`✅ Tool saved to Firebase: ${name}`);
      } catch (fbError) {
        console.warn('⚠️  Firebase save failed:', fbError.message);
      }
    }
    
    res.json({
      success: true,
      tool: newTool,
      message: 'Tool added successfully'
    });
  } catch (error) {
    console.error('❌ Error adding tool:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add tool',
      message: error.message
    });
  }
});

// Delete tool endpoint
app.delete('/api/tools/:id', async (req, res) => {
  try {
    const toolId = req.params.id;
    
    if (firebaseInitialized) {
      try {
        const toolRef = db.ref(`tools/${toolId}`);
        await toolRef.remove();
        console.log(`🗑️  Tool deleted from Firebase: ${toolId}`);
      } catch (fbError) {
        console.warn('⚠️  Firebase delete failed:', fbError.message);
      }
    }
    
    res.json({
      success: true,
      message: 'Tool deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting tool:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete tool',
      message: error.message
    });
  }
});

// ==================== ADMIN ENDPOINTS ====================

// Get connected devices
app.get('/api/admin/devices', async (req, res) => {
  if (!firebaseInitialized) {
    return res.status(503).json({
      success: false,
      error: 'Firebase not available'
    });
  }
  
  try {
    const devicesRef = db.ref('connected_devices');
    const snapshot = await devicesRef.once('value');
    const devices = snapshot.val() || {};
    
    const deviceList = Object.entries(devices).map(([id, data]) => ({
      id,
      ...data,
      status: blockedDevices.has(id) ? 'blocked' : 'active'
    }));
    
    res.json({
      success: true,
      devices: deviceList,
      count: deviceList.length
    });
  } catch (error) {
    console.error('❌ Error fetching devices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch devices',
      message: error.message
    });
  }
});

// Block/Unblock device
app.post('/api/admin/devices/:deviceId/block', express.json(), async (req, res) => {
  if (!firebaseInitialized) {
    return res.status(503).json({
      success: false,
      error: 'Firebase not available'
    });
  }
  
  try {
    const deviceId = req.params.deviceId;
    const { blocked, reason } = req.body;
    
    if (blocked) {
      blockedDevices.add(deviceId);
    } else {
      blockedDevices.delete(deviceId);
    }
    
    // Update Firebase
    const deviceRef = db.ref(`devices/${deviceId}`);
    await deviceRef.update({
      status: blocked ? 'blocked' : 'active',
      blockReason: reason || 'Admin action',
      timestamp: Date.now()
    });
    
    // Send command to device
    const commandRef = db.ref(`commands/${deviceId}`);
    await commandRef.set({
      type: blocked ? 'block_device' : 'unblock_device',
      data: reason || 'Admin action',
      timestamp: Date.now()
    });
    
    console.log(`🔒 Device ${blocked ? 'blocked' : 'unblocked'}: ${deviceId}`);
    
    res.json({
      success: true,
      message: `Device ${blocked ? 'blocked' : 'unblocked'} successfully`
    });
  } catch (error) {
    console.error('❌ Error updating device status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update device status',
      message: error.message
    });
  }
});

// Send command to device
app.post('/api/admin/commands', express.json(), async (req, res) => {
  if (!firebaseInitialized) {
    return res.status(503).json({
      success: false,
      error: 'Firebase not available'
    });
  }
  
  try {
    const { deviceId, command, data } = req.body;
    
    if (!deviceId || !command) {
      return res.status(400).json({
        success: false,
        error: 'Device ID and command are required'
      });
    }
    
    const targetDevices = deviceId === 'all' ? 'all' : [deviceId];
    
    if (targetDevices === 'all') {
      // Send to all devices
      const commandRef = db.ref('commands/broadcast');
      await commandRef.set({
        type: command,
        data: data || '',
        targetDeviceId: 'all',
        timestamp: Date.now()
      });
    } else {
      // Send to specific device
      const commandRef = db.ref(`commands/${deviceId}`);
      await commandRef.set({
        type: command,
        data: data || '',
        timestamp: Date.now()
      });
    }
    
    console.log(`📨 Command sent to ${deviceId}: ${command}`);
    
    res.json({
      success: true,
      message: 'Command sent successfully'
    });
  } catch (error) {
    console.error('❌ Error sending command:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send command',
      message: error.message
    });
  }
});

// ==================== FRONTEND ROUTES ====================

// Admin dashboard
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Tools dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Settings page
app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

// Main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Catch-all route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    available_endpoints: [
      '/api/status',
      '/api/tools',
      '/api/upload-icon',
      '/admin',
      '/dashboard'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Global error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 2MB.'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// ==================== SERVER STARTUP ====================

async function startServer() {
  try {
    await initializeServer();
    
    app.listen(PORT, () => {
      console.log('🚀 =========================================');
      console.log('🎯 H4K3R Tools Server Started Successfully');
      console.log('🚀 =========================================');
      console.log(`📡 Server running on: http://localhost:${PORT}`);
      console.log(`🔥 Firebase: ${firebaseInitialized ? 'Connected' : 'Disabled'}`);
      console.log(`🛡️  Blocked devices: ${blockedDevices.size}`);
      console.log(`🧰 Default tools: ${defaultTools.length}`);
      console.log('🚀 =========================================');
      console.log('📊 Available endpoints:');
      console.log('   GET  /api/status      - Server status');
      console.log('   GET  /api/tools       - Get tools list');
      console.log('   POST /api/tools       - Add new tool');
      console.log('   POST /api/upload-icon - Upload icon');
      console.log('   GET  /admin           - Admin dashboard');
      console.log('   GET  /dashboard       - Tools dashboard');
      console.log('🚀 =========================================');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 Shutting down gracefully...');
  process.exit(0);
});

startServer();
