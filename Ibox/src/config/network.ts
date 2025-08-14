/**
 * Network Configuration with Automatic IP Detection
 * 
 * This module handles automatic detection of the backend server IP address
 * for development environments. It tries multiple strategies to find the
 * correct server endpoint without manual configuration.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Cache for discovered server URL
let cachedServerUrl: string | null = null;
let lastDiscoveryTime = 0;
const DISCOVERY_CACHE_DURATION = 60000; // 1 minute cache

// Clear cache on module load to force re-discovery
cachedServerUrl = null;
lastDiscoveryTime = 0;

// Common development ports to check
const BACKEND_PORT = 5000;
const API_PATH = '/api/v1';

// Health check endpoint - backend serves this at root, not under /api/v1
const HEALTH_ENDPOINT = '';

/**
 * Test if a URL is reachable
 */
async function testEndpoint(url: string, timeout = 2000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Extract base URL (remove /api/v1) and test /health endpoint
    const baseUrl = url.replace('/api/v1', '');
    const healthUrl = `${baseUrl}/health`;
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Generate a comprehensive list of IPs to scan based on common subnets
 */
function generateNetworkIPs(): string[] {
  const ips: string[] = [];
  
  // Common home/office network ranges
  const subnets = [
    '192.168.1',   // Most common home router range
    '192.168.0',   // Second most common
    '192.168.100', // Some ISP routers
    '10.0.0',      // Some home networks
    '10.0.1',      // Alternative
    '172.16.0',    // Less common but used
  ];
  
  // For each subnet, add common host IPs
  subnets.forEach(subnet => {
    // Add specific common IPs first (faster discovery)
    [1, 2, 3, 4, 5, 10, 14, 20, 25, 30, 50, 100, 150, 200].forEach(host => {
      ips.push(`${subnet}.${host}`);
    });
  });
  
  return ips;
}

/**
 * Get possible server URLs based on network configuration
 */
async function getPossibleUrls(): Promise<string[]> {
  const urls: string[] = [];
  
  try {
    // 1. Check environment variable first (highest priority)
    if (process.env.EXPO_PUBLIC_API_URL) {
      console.log('📍 Found API URL in environment variable');
      urls.push(process.env.EXPO_PUBLIC_API_URL);
      return urls; // If env var is set, only use that
    }

    // 2. Platform-specific defaults
    if (Platform.OS === 'android') {
      // Android emulator special IP to access host machine
      urls.push(`http://10.0.2.2:${BACKEND_PORT}${API_PATH}`);
      
      // Also scan network for physical Android devices
      if (Constants.isDevice) {
        const networkIPs = generateNetworkIPs();
        networkIPs.forEach(ip => {
          urls.push(`http://${ip}:${BACKEND_PORT}${API_PATH}`);
        });
      }
    } else if (Platform.OS === 'ios') {
      if (Constants.isDevice === false) {
        // iOS Simulator - scan network IPs since localhost often doesn't work
        const networkIPs = generateNetworkIPs();
        
        // Try these first for iOS Simulator
        urls.push(`http://localhost:${BACKEND_PORT}${API_PATH}`);
        urls.push(`http://127.0.0.1:${BACKEND_PORT}${API_PATH}`);
        
        // Then try all network IPs
        networkIPs.forEach(ip => {
          urls.push(`http://${ip}:${BACKEND_PORT}${API_PATH}`);
        });
      } else {
        // Physical iOS device - must use network IPs
        const networkIPs = generateNetworkIPs();
        networkIPs.forEach(ip => {
          urls.push(`http://${ip}:${BACKEND_PORT}${API_PATH}`);
        });
        
        // Try mDNS/Bonjour hostnames
        urls.push(`http://ibox-backend.local:${BACKEND_PORT}${API_PATH}`);
        urls.push(`http://ibox.local:${BACKEND_PORT}${API_PATH}`);
      }
    }

  } catch (error) {
    console.error('Error getting network info:', error);
  }

  // Remove duplicates and limit to reasonable number
  const uniqueUrls = [...new Set(urls)];
  
  // Limit to first 100 URLs to avoid too long discovery
  return uniqueUrls.slice(0, 100);
}

/**
 * Discover the backend server URL automatically
 */
export async function discoverBackendUrl(): Promise<string> {
  // Production environment
  if (!__DEV__) {
    return 'https://your-production-api.com/api/v1';
  }

  // Check cache
  const now = Date.now();
  if (cachedServerUrl && (now - lastDiscoveryTime) < DISCOVERY_CACHE_DURATION) {
    console.log('📍 Using cached server URL:', cachedServerUrl);
    return cachedServerUrl;
  }

  console.log('🔍 Starting automatic backend discovery...');
  
  const possibleUrls = await getPossibleUrls();
  console.log(`🔍 Testing ${possibleUrls.length} possible URLs...`);
  
  // Show first 5 URLs being tested for debugging
  console.log('🔍 Priority URLs:', possibleUrls.slice(0, 5));

  // Test URLs in parallel with a short timeout
  const tests = possibleUrls.map(async (url) => {
    const isReachable = await testEndpoint(url, 1500);
    if (isReachable) {
      console.log('✅ Found working URL:', url);
    }
    return { url, isReachable };
  });

  const results = await Promise.all(tests);
  
  // Find the first reachable URL
  const workingUrl = results.find(r => r.isReachable);
  
  if (workingUrl) {
    console.log('✅ Backend discovered at:', workingUrl.url);
    cachedServerUrl = workingUrl.url;
    lastDiscoveryTime = now;
    return workingUrl.url;
  }

  // If no URL works, try with longer timeout on priority URLs
  console.log('🔍 Retrying priority URLs with longer timeout...');
  const priorityUrls = possibleUrls.slice(0, 5);
  
  for (const url of priorityUrls) {
    const isReachable = await testEndpoint(url, 5000);
    if (isReachable) {
      console.log('✅ Backend discovered at:', url);
      cachedServerUrl = url;
      lastDiscoveryTime = now;
      return url;
    }
  }

  // Final fallback
  console.warn('⚠️ Could not discover backend automatically. Using fallback.');
  const fallbackUrl = Platform.OS === 'android' 
    ? `http://10.0.2.2:${BACKEND_PORT}${API_PATH}`
    : `http://localhost:${BACKEND_PORT}${API_PATH}`;
  
  cachedServerUrl = fallbackUrl;
  lastDiscoveryTime = now;
  return fallbackUrl;
}

/**
 * Clear the cached server URL (useful when network changes)
 */
export function clearServerCache() {
  cachedServerUrl = null;
  lastDiscoveryTime = 0;
}

/**
 * Get the current cached server URL without discovery
 */
export function getCachedServerUrl(): string | null {
  return cachedServerUrl;
}

/**
 * Manually set the server URL (for debugging)
 */
export function setServerUrl(url: string) {
  cachedServerUrl = url;
  lastDiscoveryTime = Date.now();
}