import { Platform } from 'react-native';

/**
 * API Configuration for connecting to SeKondly backend
 * 
 * Backend runs on port 5001 (as defined in server/index.ts)
 * Database: Neon PostgreSQL (matches shared/schema.ts)
 * 
 * Network setup:
 * - For web: use localhost
 * - For iOS/Android: use your machine's IP address
 * 
 * To find your IP address:
 * - macOS/Linux: `ifconfig | grep "inet " | grep -v 127.0.0.1`
 * - Windows: `ipconfig | findstr "IPv4"`
 */

const getApiBaseUrl = (): string => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5001';
  }
  
  // For iOS/Android - connect to InterServer deployment
  // Using your deployed server instead of local development
  return 'http://174.138.183.153:5001';
};

export const API_BASE_URL = getApiBaseUrl();

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
};
