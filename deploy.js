#!/usr/bin/env node

/**
 * H4K3R Tools Server Deployment Script
 * 
 * This script helps deploy the H4K3R Tools server to various platforms
 * and update the Android app with the correct server URLs.
 */

const fs = require('fs').promises;
const path = require('path');

const CONFIG = {
  // Default deployment URL (will be updated during deployment)
  defaultUrl: 'https://h4k3rtools.onrender.com',
  
  // Android files to update
  androidFiles: [
    '../app/src/main/java/com/h4k3r/tool/ToolsDashboardActivity.kt'
  ],
  
  // Server files that might need URL updates
  serverFiles: [
    'public/js/app.js',
    'public/js/firebase-init.js'
  ]
};

class DeploymentManager {
  constructor() {
    this.deploymentUrl = CONFIG.defaultUrl;
  }

  async start() {
    console.log('🚀 H4K3R Tools Deployment Manager');
    console.log('=====================================');
    
    try {
      // Check if we're in the correct directory
      await this.validateEnvironment();
      
      // Get deployment URL from user
      this.deploymentUrl = await this.getDeploymentUrl();
      
      // Update Android app
      await this.updateAndroidApp();
      
      // Validate server configuration
      await this.validateServerConfig();
      
      // Create deployment summary
      await this.createDeploymentSummary();
      
      console.log('\n✅ Deployment preparation complete!');
      console.log('\n📋 Next steps:');
      console.log('   1. Deploy this server to your chosen platform');
      console.log('   2. Build and install the updated Android app');
      console.log('   3. Test the connection between app and server');
      
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      process.exit(1);
    }
  }

  async validateEnvironment() {
    console.log('🔍 Validating environment...');
    
    // Check if we're in the H4K3R-API-Server directory
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    try {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      if (packageJson.name !== 'h4k3r-tools-server') {
        throw new Error('Please run this script from the H4K3R-API-Server directory');
      }
    } catch (error) {
      throw new Error('Invalid directory. Please run from H4K3R-API-Server folder.');
    }
    
    console.log('✅ Environment validated');
  }

  async getDeploymentUrl() {
    // For now, use readline to get input
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      readline.question(`🌐 Enter your deployment URL (default: ${CONFIG.defaultUrl}): `, (answer) => {
        readline.close();
        resolve(answer.trim() || CONFIG.defaultUrl);
      });
    });
  }

  async updateAndroidApp() {
    console.log('📱 Updating Android app configuration...');
    
    for (const filePath of CONFIG.androidFiles) {
      try {
        const fullPath = path.resolve(filePath);
        let content = await fs.readFile(fullPath, 'utf8');
        
        // Update API URLs in ToolsDashboardActivity.kt
        content = content.replace(
          /const val API_BASE_URL = ".*"/g,
          `const val API_BASE_URL = "${this.deploymentUrl}"`
        );
        
        content = content.replace(
          /const val DASHBOARD_URL = ".*"/g,
          `const val DASHBOARD_URL = "${this.deploymentUrl}"`
        );
        
        content = content.replace(
          /const val SETTINGS_URL = ".*"/g,
          `const val SETTINGS_URL = "${this.deploymentUrl}/settings"`
        );
        
        await fs.writeFile(fullPath, content, 'utf8');
        console.log(`✅ Updated: ${filePath}`);
        
      } catch (error) {
        console.warn(`⚠️  Could not update ${filePath}: ${error.message}`);
      }
    }
  }

  async validateServerConfig() {
    console.log('⚙️  Validating server configuration...');
    
    // Check if Firebase config is present
    try {
      const firebaseConfig = await fs.readFile('firebase-config.js', 'utf8');
      if (firebaseConfig.includes('h4k3rtools-693b7')) {
        console.log('✅ Firebase configuration found');
      }
    } catch (error) {
      console.warn('⚠️  Firebase configuration not found');
    }
    
    // Check if default tools are configured
    try {
      const serverJs = await fs.readFile('server.js', 'utf8');
      if (serverJs.includes('defaultTools')) {
        console.log('✅ Default tools configuration found');
      }
    } catch (error) {
      console.warn('⚠️  Server configuration issues');
    }
    
    // Check public directory
    try {
      await fs.access('public/index.html');
      console.log('✅ Public files present');
    } catch (error) {
      console.error('❌ Public files missing');
      throw new Error('Public directory incomplete');
    }
  }

  async createDeploymentSummary() {
    console.log('📄 Creating deployment summary...');
    
    const summary = {
      timestamp: new Date().toISOString(),
      deploymentUrl: this.deploymentUrl,
      version: '2.0.0',
      platform: process.platform,
      node: process.version,
      features: [
        'Firebase Realtime Database',
        'Device Management',
        'Icon Upload System',
        'Admin Dashboard',
        'Real-time Commands',
        'PWA Support'
      ],
      endpoints: [
        'GET /',
        'GET /dashboard', 
        'GET /admin',
        'GET /api/tools',
        'GET /api/status',
        'POST /api/tools',
        'POST /api/upload-icon',
        'GET /api/admin/devices',
        'POST /api/admin/commands'
      ],
      androidUpdates: CONFIG.androidFiles.map(file => path.resolve(file)),
      nextSteps: [
        'Deploy server to hosting platform',
        'Set environment variables',
        'Test server endpoints',
        'Build Android app with updated URLs',
        'Test Android-server connection',
        'Configure Firebase database rules',
        'Upload custom tool icons'
      ]
    };
    
    await fs.writeFile('deployment-summary.json', JSON.stringify(summary, null, 2));
    console.log('✅ Deployment summary saved to deployment-summary.json');
    
    // Create simple deployment guide
    const guide = `
# H4K3R Tools Deployment Guide

## Server Information
- **URL**: ${this.deploymentUrl}
- **Version**: 2.0.0
- **Generated**: ${new Date().toLocaleString()}

## Quick Deploy Commands

### Render.com
1. Connect your GitHub repository
2. Set root directory to: \`H4K3R-API-Server\`
3. Build command: \`npm install\`
4. Start command: \`npm start\`

### Heroku
\`\`\`bash
heroku create your-app-name
git subtree push --prefix H4K3R-API-Server heroku main
\`\`\`

### Vercel
\`\`\`bash
cd H4K3R-API-Server
vercel --prod
\`\`\`

## Environment Variables
\`\`\`
NODE_ENV=production
PORT=3000
\`\`\`

## Testing
After deployment, test these URLs:
- ${this.deploymentUrl}/
- ${this.deploymentUrl}/api/status
- ${this.deploymentUrl}/admin

## Android App
The following files have been updated with your server URL:
${CONFIG.androidFiles.map(file => `- ${file}`).join('\n')}

Build and install the updated Android app to connect to your server.

## Firebase Setup
1. Go to Firebase Console
2. Create/select project: h4k3rtools-693b7
3. Enable Realtime Database
4. Set appropriate database rules

## Support
For issues, check:
- Server logs
- Firebase console
- Browser developer tools
- Network connectivity

Happy hacking! 🔥
`;

    await fs.writeFile('DEPLOYMENT_GUIDE.md', guide);
    console.log('✅ Deployment guide saved to DEPLOYMENT_GUIDE.md');
  }
}

// Run if called directly
if (require.main === module) {
  const manager = new DeploymentManager();
  manager.start().catch(console.error);
}

module.exports = DeploymentManager;
