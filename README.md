# H4K3R Tools Server 🔥

Advanced Cybersecurity Toolkit with Real-time Firebase Integration

## 🚀 Features

- **Real-time Updates**: Firebase Realtime Database integration for instant synchronization
- **Device Management**: Track and control connected Android/Web clients
- **Admin Dashboard**: Comprehensive control panel for tools and device management
- **Icon Management**: Dynamic icon upload and caching system
- **Command System**: Send real-time commands to connected devices
- **Modern UI**: Cyberpunk-themed responsive interface
- **PWA Support**: Progressive Web App with offline capabilities
- **Security**: Device blocking, rate limiting, and secure authentication

## 📋 Requirements

- Node.js 18+ 
- Firebase Project (configured with the provided config)
- Modern web browser

## 🔧 Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create a `.env` file with the following variables:
   ```env
   NODE_ENV=production
   PORT=3000
   
   # Optional Firebase Service Account (for enhanced admin features)
   # FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
   # GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
   
   # Security (Optional)
   ADMIN_SECRET=your_admin_secret
   JWT_SECRET=your_jwt_secret
   
   # Upload Configuration
   MAX_FILE_SIZE=2097152
   UPLOAD_DIR=public/uploads
   ```

3. **Start the Server**
   ```bash
   # Production
   npm start
   
   # Development
   npm run dev
   ```

## 🌐 Deployment

### Deploy to Render (Recommended)

1. **Connect Repository**
   - Fork this repository
   - Connect to Render
   - Select the `H4K3R-API-Server` directory as root

2. **Environment Variables**
   Set in Render dashboard:
   ```
   NODE_ENV=production
   PORT=10000
   ```

3. **Build & Deploy**
   - Render will automatically build and deploy
   - Access your app at: `https://your-app-name.onrender.com`

### Deploy to Other Platforms

**Heroku:**
```bash
heroku create your-app-name
git subtree push --prefix H4K3R-API-Server heroku main
```

**Vercel:**
```bash
cd H4K3R-API-Server
vercel --prod
```

**Netlify:**
- Deploy `H4K3R-API-Server` folder
- Set build command: `npm run build`
- Set publish directory: `public`

## 📱 Android App Integration

The server is designed to work with the H4K3R Tools Android application:

1. **Update Android App URL**
   In `ToolsDashboardActivity.kt`, update:
   ```kotlin
   const val API_BASE_URL = "https://your-deployed-url.onrender.com"
   const val DASHBOARD_URL = "https://your-deployed-url.onrender.com"
   ```

2. **Firebase Configuration**
   The Android app uses the same Firebase project for real-time synchronization.

## 🔥 Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create new project: `h4k3rtools-693b7` (or use existing)

2. **Enable Realtime Database**
   - Go to Realtime Database
   - Create database in test mode
   - Note the database URL

3. **Web App Configuration**
   - Add web app to Firebase project
   - Copy configuration to `firebase-init.js`

4. **Database Rules (Optional)**
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true,
       "tools": {
         ".read": true,
         ".write": true
       },
       "devices": {
         ".read": true,
         ".write": true
       },
       "commands": {
         ".read": true,
         ".write": true
       }
     }
   }
   ```

## 📊 API Endpoints

### Public Endpoints
- `GET /` - Main application
- `GET /dashboard` - Tools dashboard
- `GET /api/status` - Server status
- `GET /api/tools` - Get tools list
- `POST /api/tools` - Add new tool
- `POST /api/upload-icon` - Upload tool icon

### Admin Endpoints
- `GET /admin` - Admin dashboard
- `GET /api/admin/devices` - Get connected devices
- `POST /api/admin/devices/:id/block` - Block/unblock device
- `POST /api/admin/commands` - Send command to devices

## 🎨 Icon Management

The server includes a sophisticated icon management system:

1. **Upload Icons**
   - Icons are stored in `public/uploads/icons/`
   - Supports PNG, JPEG, GIF, WebP
   - Maximum size: 2MB
   - Auto-optimization

2. **Default Icons**
   - Fallback icons for each category
   - Font Awesome integration
   - Responsive sizing

3. **Cache System**
   - Client-side caching
   - Server-side optimization
   - Real-time updates

## 🔐 Security Features

- **Rate Limiting**: Prevent abuse
- **Device Tracking**: Monitor connected clients
- **Device Blocking**: Block malicious devices
- **CORS Protection**: Secure cross-origin requests
- **Content Security**: Prevent XSS attacks
- **Input Validation**: Sanitize user input

## 🛠️ Development

### Project Structure
```
H4K3R-API-Server/
├── server.js              # Main server file
├── firebase-config.js     # Firebase configuration
├── package.json           # Dependencies
├── public/                # Static files
│   ├── index.html        # Main application
│   ├── admin.html        # Admin dashboard
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript files
│   ├── uploads/          # Uploaded files
│   └── assets/           # Static assets
└── README.md             # This file
```

### Adding New Tools

1. **Via Admin Dashboard**
   - Go to `/admin`
   - Navigate to "Tools" section
   - Click "Add Tool"
   - Fill form and upload icon

2. **Via API**
   ```javascript
   fetch('/api/tools', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       name: 'Tool Name',
       url: 'https://tool-url.com',
       category: 'Network',
       description: 'Tool description',
       icon: '/uploads/icons/tool-icon.png'
     })
   })
   ```

3. **Via Firebase**
   - Add directly to Firebase Realtime Database
   - Structure: `/tools/{toolId}`

## 📞 Device Commands

Send real-time commands to connected devices:

- `refresh_tools` - Reload tools list
- `update_icons` - Clear icon cache
- `restart_app` - Restart application
- `block_device` - Block device access
- `clear_cache` - Clear all caches

## 🐛 Troubleshooting

### Common Issues

1. **Firebase Connection Failed**
   - Check Firebase configuration
   - Verify database rules
   - Check internet connectivity

2. **Icons Not Loading**
   - Check upload directory permissions
   - Verify file paths
   - Clear browser cache

3. **Android App Not Connecting**
   - Update API_BASE_URL in Android code
   - Check server URL
   - Verify CORS settings

4. **Commands Not Working**
   - Check Firebase Realtime Database
   - Verify device connectivity
   - Check command format

### Debugging

Enable debug mode:
```env
DEBUG=true
LOG_LEVEL=debug
```

Check logs:
```bash
# View logs
tail -f logs/server.log

# View real-time logs
npm run dev
```

## 📈 Monitoring

- **Admin Dashboard**: Real-time device monitoring
- **Server Status**: Health checks and statistics
- **Firebase Console**: Database activity
- **Browser DevTools**: Client-side debugging

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Links

- **Firebase Console**: https://console.firebase.google.com
- **Render Dashboard**: https://dashboard.render.com
- **GitHub Repository**: https://github.com/your-username/h4k3r-tools

## 📞 Support

For issues and support:
- Open GitHub issue
- Check troubleshooting guide
- Review server logs

---

**⚠️ Disclaimer**: This tool is for educational and authorized security testing purposes only. Users are responsible for ensuring they have proper authorization before using these tools on any system they do not own or have explicit permission to test.
