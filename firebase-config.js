const admin = require('firebase-admin');

// Firebase configuration with the provided config
const firebaseConfig = {
  apiKey: "AIzaSyD0GTQIMIP02xWbGDCcw1o8qfIP-sn2oOM",
  authDomain: "h4k3rtools-693b7.firebaseapp.com",
  databaseURL: "https://h4k3rtools-693b7-default-rtdb.firebaseio.com",
  projectId: "h4k3rtools-693b7",
  storageBucket: "h4k3rtools-693b7.firebasestorage.app",
  messagingSenderId: "778185449378",
  appId: "1:778185449378:web:57e256fd10c7f50b9bdcfb",
  measurementId: "G-GEBD4GSRQ5"
};

let db = null;
let isInitialized = false;

/**
 * Initialize Firebase Admin SDK
 */
async function initializeFirebase() {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length === 0) {
      console.log('🔥 Initializing Firebase Admin SDK...');
      
      // For production on Render, we'll use environment variables or service account
      // For development, we'll initialize without service account (limited functionality)
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // Production with service account
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: firebaseConfig.databaseURL,
          projectId: firebaseConfig.projectId
        });
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // Production with service account file
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          databaseURL: firebaseConfig.databaseURL,
          projectId: firebaseConfig.projectId
        });
      } else {
        // Production mode without service account - client-side only
        console.log('⚠️  No service account found, running in client-side mode');
        console.log('🔄 Firebase Admin SDK disabled, using client-side Firebase only');
        isInitialized = false;
        return initializeMockFirebase();
      }
    }
    
    // Get database reference
    db = admin.database();
    
    // Test connection
    await testConnection();
    
    isInitialized = true;
    console.log('✅ Firebase Admin SDK initialized successfully');
    
    // Initialize default data structure
    await initializeDefaultData();
    
    return { db, admin };
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    
    // Fall back to mock implementation for development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Falling back to mock Firebase implementation');
      return initializeMockFirebase();
    }
    
    throw error;
  }
}

/**
 * Test Firebase connection
 */
async function testConnection() {
  try {
    const testRef = db.ref('.info/connected');
    const snapshot = await testRef.once('value');
    console.log('📡 Firebase connection test successful');
    return true;
  } catch (error) {
    console.warn('⚠️  Firebase connection test failed:', error.message);
    return false;
  }
}

/**
 * Initialize default data structure in Firebase
 */
async function initializeDefaultData() {
  try {
    // Check if tools collection exists
    const toolsRef = db.ref('tools');
    const toolsSnapshot = await toolsRef.once('value');
    
    if (!toolsSnapshot.exists()) {
      console.log('🔧 Setting up default tools in Firebase...');
      
      const defaultTools = {
        'wifi-cracker': {
          name: "WiFi Password Cracker",
          url: "https://wifipassword.h4k3r.tools",
          icon: "wifi-crack.png",
          category: "Network",
          description: "Advanced WiFi security assessment tool"
        },
        'port-scanner': {
          name: "Port Scanner Pro",
          url: "https://portscan.h4k3r.tools", 
          icon: "port-scanner.png",
          category: "Network",
          description: "Professional network port scanning"
        },
        'sql-injection': {
          name: "SQL Injection Tester",
          url: "https://sqlinjection.h4k3r.tools",
          icon: "sql-inject.png",
          category: "Web",
          description: "Comprehensive SQL injection testing"
        },
        'hash-cracker': {
          name: "Hash Cracker Elite",
          url: "https://hashcrack.h4k3r.tools",
          icon: "hash-crack.png",
          category: "Crypto", 
          description: "Multi-algorithm hash cracking tool"
        }
      };
      
      await toolsRef.set(defaultTools);
      console.log('✅ Default tools initialized in Firebase');
    }
    
    // Initialize server stats
    const statsRef = db.ref('server_stats');
    await statsRef.update({
      last_startup: Date.now(),
      version: '2.0.0',
      status: 'online'
    });
    
    console.log('📊 Server stats updated in Firebase');
  } catch (error) {
    console.error('❌ Error initializing default data:', error);
  }
}

/**
 * Mock Firebase implementation for development without credentials
 */
function initializeMockFirebase() {
  console.log('🔄 Initializing mock Firebase implementation...');
  
  const mockData = new Map();
  
  const mockRef = {
    set: async (data) => {
      mockData.set('current', data);
      return Promise.resolve();
    },
    update: async (data) => {
      const current = mockData.get('current') || {};
      mockData.set('current', { ...current, ...data });
      return Promise.resolve();
    },
    once: async (eventType) => {
      return {
        exists: () => mockData.has('current'),
        val: () => mockData.get('current') || null
      };
    },
    on: (eventType, callback) => {
      // Mock listener
      setTimeout(() => callback({ val: () => mockData.get('current') }), 100);
    },
    child: (path) => mockRef,
    ref: (path) => mockRef
  };
  
  db = { ref: (path) => mockRef };
  isInitialized = true;
  
  console.log('✅ Mock Firebase initialized');
  return { db, admin: null };
}

/**
 * Update device information in Firebase
 */
async function updateDeviceInfo(deviceId, deviceData) {
  if (!isInitialized) {
    console.warn('⚠️  Firebase not initialized, skipping device update');
    return;
  }
  
  try {
    const deviceRef = db.ref(`connected_devices/${deviceId}`);
    await deviceRef.update({
      ...deviceData,
      lastUpdate: Date.now(),
      serverTimestamp: admin.database.ServerValue.TIMESTAMP
    });
    console.log(`📱 Device info updated: ${deviceId}`);
  } catch (error) {
    console.error('❌ Error updating device info:', error);
  }
}

/**
 * Send command to specific device or all devices
 */
async function sendCommandToDevice(deviceId, command, data = {}) {
  if (!isInitialized) {
    console.warn('⚠️  Firebase not initialized, cannot send command');
    return;
  }
  
  try {
    const commandRef = deviceId === 'all' 
      ? db.ref('commands/broadcast') 
      : db.ref(`commands/${deviceId}`);
      
    await commandRef.set({
      type: command,
      data: data,
      targetDeviceId: deviceId,
      timestamp: Date.now(),
      serverTimestamp: admin.database.ServerValue.TIMESTAMP
    });
    
    console.log(`📨 Command sent to ${deviceId}: ${command}`);
  } catch (error) {
    console.error('❌ Error sending command:', error);
  }
}

/**
 * Get all connected devices
 */
async function getConnectedDevices() {
  if (!isInitialized) {
    console.warn('⚠️  Firebase not initialized, returning empty list');
    return [];
  }
  
  try {
    const devicesRef = db.ref('connected_devices');
    const snapshot = await devicesRef.once('value');
    const devices = snapshot.val() || {};
    
    return Object.entries(devices).map(([id, data]) => ({
      id,
      ...data
    }));
  } catch (error) {
    console.error('❌ Error fetching devices:', error);
    return [];
  }
}

/**
 * Update tool in Firebase
 */
async function updateTool(toolId, toolData) {
  if (!isInitialized) {
    console.warn('⚠️  Firebase not initialized, skipping tool update');
    return;
  }
  
  try {
    const toolRef = db.ref(`tools/${toolId}`);
    await toolRef.update({
      ...toolData,
      lastUpdate: Date.now(),
      serverTimestamp: admin.database.ServerValue.TIMESTAMP
    });
    console.log(`🧰 Tool updated: ${toolId}`);
  } catch (error) {
    console.error('❌ Error updating tool:', error);
  }
}

/**
 * Get server statistics
 */
async function getServerStats() {
  if (!isInitialized) {
    return {
      devices: 0,
      tools: 0,
      uptime: Date.now(),
      firebase: false
    };
  }
  
  try {
    const devicesSnapshot = await db.ref('connected_devices').once('value');
    const toolsSnapshot = await db.ref('tools').once('value');
    const statsSnapshot = await db.ref('server_stats').once('value');
    
    const devices = devicesSnapshot.val() || {};
    const tools = toolsSnapshot.val() || {};
    const stats = statsSnapshot.val() || {};
    
    return {
      devices: Object.keys(devices).length,
      tools: Object.keys(tools).length,
      uptime: stats.last_startup || Date.now(),
      firebase: true,
      ...stats
    };
  } catch (error) {
    console.error('❌ Error getting server stats:', error);
    return {
      devices: 0,
      tools: 0,
      uptime: Date.now(),
      firebase: false
    };
  }
}

/**
 * Cleanup function
 */
function cleanup() {
  if (isInitialized) {
    console.log('🔄 Cleaning up Firebase connections...');
    // Add any cleanup logic here
  }
}

// Export functions and objects
module.exports = {
  initializeFirebase,
  db: () => db,
  admin: () => admin,
  isInitialized: () => isInitialized,
  updateDeviceInfo,
  sendCommandToDevice,
  getConnectedDevices,
  updateTool,
  getServerStats,
  cleanup,
  // Direct access for backwards compatibility
  get db() { return db; },
  get admin() { return admin; }
};

// Graceful shutdown
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
