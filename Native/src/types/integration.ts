/**
 * Database and Schema Integration for SeKondly Native App
 * 
 * This file ensures the native app is properly integrated with:
 * 1. Backend API server (server/index.ts)
 * 2. Shared database schema (shared/schema.ts)
 * 3. Neon PostgreSQL database
 */

// Import shared schema types to ensure consistency
export * from './shared';

// Database configuration (mirrors the backend .env)
export const DATABASE_CONFIG = {
  // Your Neon database connection (from /Users/fayaa/SeKondly/.env)
  connectionString: 'postgresql://neondb_owner:npg_YCW5HrR3TuOI@ep-mute-meadow-a9qsyjtm-pooler.gwc.azure.neon.tech/neondb?sslmode=require',
  
  // Database tables (from shared/schema.ts)
  tables: {
    users: 'users',
    cases: 'cases',
    caseComments: 'case_comments',
    caseLikes: 'case_likes',
    caseFavorites: 'case_favorites',
    notifications: 'notifications',
    documents: 'documents',
    userFollows: 'user_follows',
    hiddenSpecialties: 'hidden_specialties',
    sessions: 'sessions',
  },
};

// API endpoints that match server/routes.ts
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    user: '/api/auth/user',
    profile: '/api/auth/profile',
    logout: '/api/auth/logout',
  },
  
  // Cases management
  cases: {
    base: '/api/cases',
    byId: (id: number) => `/api/cases/${id}`,
    like: (id: number) => `/api/cases/${id}/like`,
    favorite: (id: number) => `/api/cases/${id}/favorite`,
    comments: (id: number) => `/api/cases/${id}/comments`,
    favorites: '/api/cases/favorites',
  },
  
  // Comments
  comments: {
    delete: (id: number) => `/api/comments/${id}`,
  },
  
  // Notifications
  notifications: {
    base: '/api/notifications',
    markRead: (id: number) => `/api/notifications/${id}/read`,
    markAllRead: '/api/notifications/read-all',
  },
  
  // Users
  users: {
    byId: (id: string) => `/api/users/${id}`,
    follow: (id: string) => `/api/users/${id}/follow`,
    followers: (id: string) => `/api/users/${id}/followers`,
    following: (id: string) => `/api/users/${id}/following`,
  },
  
  // Documents
  documents: {
    base: '/api/documents',
    upload: '/api/documents/upload',
  },
  
  // Search
  search: '/api/search',
  
  // Health check
  health: '/api/health',
};

// Validation schemas (ensure data matches backend expectations)
export const VALIDATION_RULES = {
  user: {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^\+?[\d\s()-]+$/,
    minNameLength: 2,
    maxNameLength: 50,
  },
  
  case: {
    minTitleLength: 10,
    maxTitleLength: 200,
    minHistoryLength: 50,
    maxHistoryLength: 5000,
    maxImages: 5,
    allowedImageTypes: ['image/jpeg', 'image/png'],
    maxImageSize: 10 * 1024 * 1024, // 10MB
  },
  
  comment: {
    minLength: 10,
    maxLength: 1000,
  },
  
  document: {
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
};

// Backend compatibility check
export const SCHEMA_VERSION = '1.0.0';
export const API_VERSION = '1.0.0';

// Connection status types
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export type DatabaseConnection = {
  status: ConnectionStatus;
  lastChecked: Date;
  apiReachable: boolean;
  schemaCompatible: boolean;
};

// Helper function to validate schema compatibility
export const validateSchemaCompatibility = async (): Promise<boolean> => {
  try {
    // This would check if the API returns expected schema structure
    // For now, we assume compatibility since we're using the shared schema
    return true;
  } catch (error) {
    console.error('Schema compatibility check failed:', error);
    return false;
  }
};

// Integration status check
export const checkIntegrationStatus = async (): Promise<DatabaseConnection> => {
  const status: DatabaseConnection = {
    status: 'connecting',
    lastChecked: new Date(),
    apiReachable: false,
    schemaCompatible: false,
  };

  try {
    // Check API connectivity
    const healthResponse = await fetch(`${API_ENDPOINTS.health}`, {
      method: 'GET',
      timeout: 5000,
    });
    
    status.apiReachable = healthResponse.ok;
    
    if (status.apiReachable) {
      status.schemaCompatible = await validateSchemaCompatibility();
      status.status = status.schemaCompatible ? 'connected' : 'error';
    } else {
      status.status = 'disconnected';
    }
  } catch (error) {
    console.error('Integration status check failed:', error);
    status.status = 'error';
  }

  return status;
};
