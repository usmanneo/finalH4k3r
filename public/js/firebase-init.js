// ==================== FIREBASE CONFIGURATION ====================

// Firebase configuration with the provided credentials
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

// ==================== GLOBAL VARIABLES ====================
let app = null;
let database = null;
let isFirebaseConnected = false;
let connectionListeners = [];
let toolsListeners = [];
let deviceId = null;

// ==================== DEVICE ID GENERATION ====================
function generateDeviceId() {
  // Create a unique device ID based on browser fingerprint
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('Device fingerprint', 2, 2);
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|');
  
  // Simple hash function to create device ID
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  deviceId = 'web_' + Math.abs(hash).toString(16) + '_' + Date.now().toString(36);
  console.log('🔑 Device ID generated:', deviceId);
  
  // Store in localStorage for consistency
  localStorage.setItem('h4k3r_device_id', deviceId);
  
  return deviceId;
}

function getDeviceId() {
  if (deviceId) return deviceId;
  
  // Try to get from localStorage first
  const stored = localStorage.getItem('h4k3r_device_id');
  if (stored && stored.startsWith('web_')) {
    deviceId = stored;
    return deviceId;
  }
  
  return generateDeviceId();
}

// ==================== FIREBASE INITIALIZATION ====================
async function initializeFirebase() {
  try {
    console.log('🔥 Initializing Firebase...');
    
    // Check if Firebase is already loaded
    if (typeof firebase === 'undefined') {
      console.warn('⚠️  Firebase SDK not loaded, running in API-only mode');
      return false;
    }
    
    // Initialize Firebase app
    app = firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    
    // Test connection
    await testFirebaseConnection();
    
    console.log('✅ Firebase initialized successfully');
    isFirebaseConnected = true;
    
    // Set up connection monitoring
    setupConnectionMonitoring();
    
    // Send device info to server
    await updateDeviceInfo();
    
    // Start listening for real-time updates
    startRealtimeListeners();
    
    return true;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    isFirebaseConnected = false;
    return false;
  }
}

// ==================== CONNECTION TESTING ====================
async function testFirebaseConnection() {
  return new Promise((resolve, reject) => {
    const connectedRef = database.ref('.info/connected');
    connectedRef.on('value', (snapshot) => {
      const connected = snapshot.val();
      if (connected) {
        console.log('📡 Firebase connection test successful');
        resolve(true);
      } else {
        console.warn('⚠️  Firebase connection test failed');
        reject(new Error('Firebase connection failed'));
      }
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      reject(new Error('Firebase connection timeout'));
    }, 10000);
  });
}

// ==================== CONNECTION MONITORING ====================
function setupConnectionMonitoring() {
  const connectedRef = database.ref('.info/connected');
  
  connectedRef.on('value', (snapshot) => {
    const connected = snapshot.val();
    isFirebaseConnected = connected;
    
    console.log(`📡 Firebase connection: ${connected ? 'Connected' : 'Disconnected'}`);
    
    // Notify all connection listeners
    connectionListeners.forEach(callback => {
      try {
        callback(connected);
      } catch (error) {
        console.error('❌ Connection listener error:', error);
      }
    });
    
    // Update UI connection status
    updateConnectionStatus(connected);
    
    if (connected) {
      // Update device status when reconnected
      updateDeviceInfo();
    }
  });
}

function onConnectionChange(callback) {
  connectionListeners.push(callback);
  
  // Call immediately with current status
  if (isFirebaseConnected !== null) {
    callback(isFirebaseConnected);
  }
}

function updateConnectionStatus(connected) {
  const statusElement = document.getElementById('connectionStatus');
  const statusIcon = document.getElementById('statusIcon');
  const statusText = document.getElementById('statusText');
  
  if (!statusElement || !statusIcon || !statusText) return;
  
  if (connected) {
    statusElement.className = 'connection-status connected';
    statusIcon.className = 'fas fa-wifi';
    statusText.textContent = 'Connected';
  } else {
    statusElement.className = 'connection-status disconnected';
    statusIcon.className = 'fas fa-wifi-slash';
    statusText.textContent = 'Disconnected';
  }
}

// ==================== DEVICE INFO MANAGEMENT ====================
async function updateDeviceInfo() {
  if (!isFirebaseConnected || !database) {
    console.warn('⚠️  Firebase not connected, skipping device info update');
    return;
  }
  
  try {
    const deviceInfo = {
      deviceId: getDeviceId(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      lastAccess: Date.now(),
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      type: 'web',
      status: 'connected',
      url: window.location.href
    };
    
    const deviceRef = database.ref(`connected_devices/${getDeviceId()}`);
    await deviceRef.update(deviceInfo);
    
    console.log('📱 Device info updated in Firebase');
  } catch (error) {
    console.error('❌ Error updating device info:', error);
  }
}

// ==================== REAL-TIME LISTENERS ====================
function startRealtimeListeners() {
  if (!isFirebaseConnected || !database) {
    console.warn('⚠️  Firebase not connected, cannot start real-time listeners');
    return;
  }
  
  console.log('📡 Starting real-time listeners...');
  
  // Listen for tools updates
  listenForToolsUpdates();
  
  // Listen for commands
  listenForCommands();
  
  // Listen for server broadcasts
  listenForBroadcasts();
}

function listenForToolsUpdates() {
  try {
    const toolsRef = database.ref('tools');
    
    toolsRef.on('value', (snapshot) => {
      const toolsData = snapshot.val();
      
      if (toolsData) {
        const tools = Object.entries(toolsData).map(([id, tool]) => ({
          id,
          ...tool
        }));
        
        console.log(`📡 Tools updated via Firebase: ${tools.length} tools`);
        
        // Notify all tools listeners
        toolsListeners.forEach(callback => {
          try {
            callback(tools);
          } catch (error) {
            console.error('❌ Tools listener error:', error);
          }
        });
        
        // Show notification
        showNotification('Tools updated in real-time!', 'success');
      }
    });
    
    console.log('📡 Listening for tools updates');
  } catch (error) {
    console.error('❌ Error setting up tools listener:', error);
  }
}

function listenForCommands() {
  try {
    const commandsRef = database.ref(`commands/${getDeviceId()}`);
    
    commandsRef.on('value', (snapshot) => {
      const command = snapshot.val();
      
      if (command) {
        console.log('📨 Command received:', command.type);
        handleCommand(command);
        
        // Remove the command after processing
        commandsRef.remove();
      }
    });
    
    console.log('📨 Listening for commands');
  } catch (error) {
    console.error('❌ Error setting up command listener:', error);
  }
}

function listenForBroadcasts() {
  try {
    const broadcastRef = database.ref('commands/broadcast');
    
    broadcastRef.on('value', (snapshot) => {
      const command = snapshot.val();
      
      if (command && command.targetDeviceId === 'all') {
        console.log('📢 Broadcast command received:', command.type);
        handleCommand(command);
      }
    });
    
    console.log('📢 Listening for broadcast commands');
  } catch (error) {
    console.error('❌ Error setting up broadcast listener:', error);
  }
}

// ==================== COMMAND HANDLING ====================
function handleCommand(command) {
  console.log(`📨 Processing command: ${command.type}`);
  
  switch (command.type) {
    case 'refresh_tools':
      console.log('🔄 Refreshing tools...');
      window.location.reload();
      break;
      
    case 'block_device':
      console.log('🚫 Device blocked');
      showDeviceBlockedMessage(command.data || 'Device blocked by administrator');
      break;
      
    case 'unblock_device':
      console.log('✅ Device unblocked');
      showNotification('Device access restored', 'success');
      window.location.reload();
      break;
      
    case 'update_icons':
      console.log('🎨 Updating icons...');
      // Clear any cached icons and refresh
      if ('caches' in window) {
        caches.delete('h4k3r-icons');
      }
      window.location.reload();
      break;
      
    case 'restart_app':
      console.log('🔄 Restarting application...');
      showNotification('Application restarting...', 'warning');
      setTimeout(() => window.location.reload(), 2000);
      break;
      
    default:
      console.warn(`⚠️  Unknown command: ${command.type}`);
  }
  
  // Send command response
  sendCommandResponse(command);
}

async function sendCommandResponse(command) {
  if (!isFirebaseConnected || !database) return;
  
  try {
    const responseRef = database.ref('commands/responses').push();
    await responseRef.set({
      deviceId: getDeviceId(),
      commandType: command.type,
      status: 'executed',
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      response: 'Command executed successfully'
    });
    
    console.log(`📤 Command response sent: ${command.type}`);
  } catch (error) {
    console.error('❌ Error sending command response:', error);
  }
}

function showDeviceBlockedMessage(message) {
  document.body.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(145deg, #0a0a0a, #1a1a2e);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #00ffff;
      font-family: 'Orbitron', monospace;
      text-align: center;
      z-index: 10000;
    ">
      <div style="
        background: rgba(20, 20, 30, 0.8);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(0, 255, 255, 0.3);
        border-radius: 16px;
        padding: 3rem;
        box-shadow: 0 0 50px rgba(255, 0, 128, 0.3);
        max-width: 600px;
      ">
        <h1 style="
          font-size: 2.5rem;
          color: #ff3366;
          text-shadow: 0 0 20px #ff3366;
          margin-bottom: 1rem;
        ">🚫 ACCESS DENIED</h1>
        <p style="
          font-size: 1.2rem;
          margin-bottom: 2rem;
          color: #ffffff;
        ">${message}</p>
        <p style="
          font-size: 1rem;
          color: #b0b0b0;
          margin-bottom: 1rem;
        ">Your device has been blocked by the administrator.</p>
        <p style="
          font-size: 0.9rem;
          color: #666666;
        ">Device ID: ${getDeviceId().substring(0, 12)}...</p>
      </div>
    </div>
  `;
}

// ==================== TOOLS DATA MANAGEMENT ====================
function onToolsUpdate(callback) {
  toolsListeners.push(callback);
}

async function getToolsFromFirebase() {
  if (!isFirebaseConnected || !database) {
    console.warn('⚠️  Firebase not connected, cannot get tools');
    return [];
  }
  
  try {
    const snapshot = await database.ref('tools').once('value');
    const toolsData = snapshot.val();
    
    if (toolsData) {
      const tools = Object.entries(toolsData).map(([id, tool]) => ({
        id,
        ...tool
      }));
      
      console.log(`📡 Retrieved ${tools.length} tools from Firebase`);
      return tools;
    }
    
    return [];
  } catch (error) {
    console.error('❌ Error getting tools from Firebase:', error);
    return [];
  }
}

async function addToolToFirebase(tool) {
  if (!isFirebaseConnected || !database) {
    console.warn('⚠️  Firebase not connected, cannot add tool');
    return false;
  }
  
  try {
    const toolsRef = database.ref('tools');
    const newToolRef = toolsRef.push();
    await newToolRef.set({
      ...tool,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    
    console.log(`✅ Tool added to Firebase: ${tool.name}`);
    return newToolRef.key;
  } catch (error) {
    console.error('❌ Error adding tool to Firebase:', error);
    return false;
  }
}

// ==================== UTILITY FUNCTIONS ====================
function showNotification(message, type = 'info') {
  const container = document.getElementById('notifications');
  if (!container) return;
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  const icon = type === 'success' ? 'check-circle' : 
               type === 'error' ? 'exclamation-circle' :
               type === 'warning' ? 'exclamation-triangle' : 'info-circle';
  
  notification.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <span>${message}</span>
  `;
  
  container.appendChild(notification);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 5000);
  
  console.log(`📢 Notification: ${message} (${type})`);
}

function isFirebaseReady() {
  return isFirebaseConnected && database !== null;
}

// ==================== INITIALIZATION ====================
// Auto-initialize Firebase when the script loads
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Starting Firebase initialization...');
  
  try {
    await initializeFirebase();
    console.log('✅ Firebase initialization completed');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    showNotification('Running in offline mode', 'warning');
  }
});

// ==================== EXPORTS ====================
// Make functions available globally
window.H4K3RFirebase = {
  isReady: isFirebaseReady,
  isConnected: () => isFirebaseConnected,
  getDeviceId,
  getToolsFromFirebase,
  addToolToFirebase,
  onConnectionChange,
  onToolsUpdate,
  updateDeviceInfo,
  showNotification
};
