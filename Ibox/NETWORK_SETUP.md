# Network Setup & Automatic Backend Discovery

## Overview
The iBox app includes automatic backend discovery, which means **you don't need to manually configure IP addresses** when developing. The app will automatically find your backend server on the network.

## How It Works

### Automatic Discovery Process
1. **Environment Variable Check**: First checks if `EXPO_PUBLIC_API_URL` is set
2. **Platform Detection**: Identifies if running on Android/iOS, emulator/simulator/device
3. **Network Scanning**: Tests common network IPs to find the backend
4. **Health Check**: Validates the backend is running by testing `/health` endpoint
5. **Caching**: Caches the discovered URL for 1 minute to avoid repeated scans

### Supported Scenarios
- ✅ **Android Emulator**: Automatically uses `10.0.2.2` (Android's host IP)
- ✅ **iOS Simulator**: Scans network to find backend (since localhost often doesn't work with WSL/Docker)
- ✅ **Physical Devices**: Scans local network to find backend server
- ✅ **Team Development**: Works on any developer's machine without configuration
- ✅ **Network Changes**: Automatically adapts when switching networks

## Quick Start

### 1. Start the Backend
```bash
cd backend
npm run dev
# Server will start on port 5000
```

### 2. Start the Mobile App
```bash
cd Ibox
npm start
# Press 'i' for iOS or 'a' for Android
```

That's it! The app will automatically find and connect to your backend.

## Network Ranges Scanned

The app scans these common network ranges:
- `192.168.1.x` (Most common home networks)
- `192.168.0.x` (Alternative home networks)
- `192.168.100.x` (Some ISP routers)
- `10.0.0.x` (Some home/office networks)
- `10.0.1.x` (Alternative)
- `172.16.0.x` (Less common)

For each range, it tests common host IPs: 1-5, 10, 14, 20, 25, 30, 50, 100, 150, 200

## Manual Configuration (Optional)

If automatic discovery doesn't work or you want to use a specific backend:

### Option 1: Environment Variable
Create a `.env` file in the Ibox folder:
```bash
cp .env.example .env
```

Then set the backend URL:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.25:5000/api/v1
```

### Option 2: Force Re-discovery
If the network changes or discovery fails, you can force a re-scan:
```javascript
// In your app code
await apiService.rediscoverBackend();
```

## Troubleshooting

### Discovery Failed?
1. **Check Backend is Running**: Ensure `npm run dev` is running in the backend folder
2. **Check Firewall**: Make sure port 5000 is not blocked by Windows/Mac firewall
3. **Check Network**: Ensure device and computer are on the same network
4. **Check IP Range**: Your network might use an uncommon IP range

### View Discovery Logs
The app logs the discovery process. Look for these messages:
```
🔍 Starting automatic backend discovery...
🔍 Testing X possible URLs...
✅ Backend discovered at: http://192.168.1.25:5000/api/v1
```

### Common Issues

#### iOS Simulator Can't Connect
- iOS Simulator often can't connect to `localhost` when backend runs on Windows/WSL
- The app automatically scans network IPs to work around this
- If it still fails, set `EXPO_PUBLIC_API_URL` in `.env`

#### Physical Device Can't Connect
- Ensure device is on the same WiFi network as your computer
- Check your computer's firewall isn't blocking port 5000
- Try disabling VPN if you're using one

#### Backend on Different Port
If your backend runs on a different port, update `BACKEND_PORT` in `/src/config/network.ts`:
```typescript
const BACKEND_PORT = 5000; // Change this to your port
```

## Team Development

### For Team Members
Just clone the repo and run - no configuration needed! The app will find the backend automatically.

### Different Network Setups
The discovery works across different network setups:
- Home networks (192.168.x.x)
- Office networks (10.x.x.x)
- Coffee shop networks
- Mobile hotspots

### Sharing a Backend
Team members can share a backend by setting the environment variable:
```env
# Point to John's machine
EXPO_PUBLIC_API_URL=http://192.168.1.50:5000/api/v1
```

## Performance

- **First Discovery**: Takes 2-5 seconds to scan and find backend
- **Subsequent Connections**: Instant (uses cached URL)
- **Cache Duration**: 1 minute (then re-validates)
- **Network Change**: Automatically re-discovers on connection errors

## Security Note

The network scanning only happens in development mode (`__DEV__`). In production builds, the app uses the configured production API URL.