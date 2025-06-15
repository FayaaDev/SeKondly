# AsyncStorage Implementation Guide

This document outlines the comprehensive AsyncStorage implementation for the MedConnect React Native app, providing persistent data storage and offline capabilities.

## Overview

AsyncStorage has been integrated throughout the app to provide:
- **Authentication persistence** - Keep users logged in
- **Data caching** - Offline access to favorites and notifications
- **Search history** - Remember user searches for better UX
- **App settings** - Persist user preferences
- **Draft saving** - Auto-save work in progress
- **Performance optimization** - Reduce API calls with intelligent caching

## Core Implementation

### StorageService (`src/lib/storage.ts`)

A centralized service class that handles all AsyncStorage operations with type safety and error handling.

```typescript
// Key features:
- Type-safe storage operations
- Error handling with fallbacks
- JSON serialization/deserialization
- Consistent key prefixing (@MedConnect:)
- Batch operations for performance
```

#### Storage Keys Structure
```typescript
const STORAGE_KEYS = {
  AUTH_TOKEN: '@MedConnect:auth_token',
  USER_DATA: '@MedConnect:user_data',
  APP_SETTINGS: '@MedConnect:app_settings',
  SEARCH_HISTORY: '@MedConnect:search_history',
  FAVORITES_CACHE: '@MedConnect:favorites_cache',
  NOTIFICATIONS_CACHE: '@MedConnect:notifications_cache',
  DRAFT_CASE: '@MedConnect:draft_case',
  ONBOARDING_COMPLETED: '@MedConnect:onboarding_completed',
}
```

### Enhanced Query Client (`src/lib/queryClient.ts`)

The TanStack Query client has been enhanced with AsyncStorage integration:

```typescript
// Features:
- Automatic auth token injection
- Cache management utilities
- Search history management
- Offline data fallbacks
```

### Enhanced Authentication (`src/hooks/useAuth.ts`)

The auth hook now includes persistent authentication:

```typescript
// Features:
- Token persistence across app restarts
- User data caching
- Automatic cleanup on sign out
- Offline auth state preservation
```

## Feature-Specific Implementations

### 1. Authentication Persistence

**Files Modified:**
- `src/hooks/useAuth.ts`
- `src/lib/queryClient.ts`

**Features:**
- Auth tokens stored securely
- User data cached for offline access
- Automatic token injection in API requests
- Clean logout with data removal

**Usage:**
```typescript
// Automatic - handled by useAuth hook
const { user, signOut } = useAuth();

// Manual token management
await StorageService.setAuthToken(token);
const token = await StorageService.getAuthToken();
```

### 2. Data Caching

**Files Modified:**
- `src/screens/FavoritesScreen.tsx`
- `src/screens/NotificationsScreen.tsx`
- `src/lib/queryClient.ts`

**Features:**
- Cache favorites and notifications
- Timestamp-based cache validation
- Offline data access
- Background refresh

**Usage:**
```typescript
// In screens - automatic caching
const { data: favorites } = useQuery({
  queryKey: ["/api/favorites"],
  queryFn: async () => {
    const data = await apiRequest("GET", "/api/favorites");
    await CacheManager.cacheFavorites(data);
    return data;
  },
  placeholderData: cachedFavorites, // Use cached data while loading
});
```

### 3. Search History

**Files Modified:**
- `src/screens/FeedScreen.tsx`
- `src/lib/queryClient.ts`

**Features:**
- Save successful searches
- Provide search suggestions
- Limit history to last 10 searches
- Clear history option

**Usage:**
```typescript
// Save search to history
await SearchManager.addToHistory(query, specialty);

// Get search suggestions
const suggestions = await SearchManager.getSearchSuggestions(input);
```

### 4. App Settings

**Files Created:**
- `src/screens/SettingsScreen.tsx`

**Features:**
- Notification preferences
- Privacy settings
- Theme preferences
- Settings persistence

**Usage:**
```typescript
// Load settings with defaults
const settings = await StorageService.getAppSettings();

// Update settings
await StorageService.setAppSettings(newSettings);
```

### 5. Draft Case Saving

**Files Modified:**
- `src/components/NewCaseModal.tsx`

**Features:**
- Auto-save draft on exit
- Load draft on modal open
- Clear draft after submission
- Draft indicator in UI

**Usage:**
```typescript
// Save draft
await StorageService.setDraftCase({
  title,
  description,
  specialty,
  images: [],
  timestamp: Date.now(),
});

// Load draft
const draft = await StorageService.getDraftCase();
```

## Storage Management

### Cache Validation

Cached data includes timestamps for validation:

```typescript
// Example cache structure
{
  data: [...items],
  timestamp: 1672531200000
}

// Validation logic
const isValid = Date.now() - cache.timestamp < maxAge;
```

### Cache Expiration Times

- **Favorites**: 1 hour
- **Notifications**: 30 minutes
- **User data**: 5 minutes (via TanStack Query)
- **Search history**: No expiration (manual clear only)

### Storage Optimization

1. **Batch Operations**: Use `multiSet` and `multiGet` for performance
2. **Data Compression**: Store only essential data
3. **Cleanup**: Remove expired data automatically
4. **Size Monitoring**: Track storage usage

## Error Handling

All storage operations include comprehensive error handling:

```typescript
try {
  await StorageService.setItem(key, value);
} catch (error) {
  console.error(`Storage error:`, error);
  // Fallback to in-memory storage or show user error
}
```

## Privacy & Security

### Data Protection
- No sensitive data stored (passwords, payment info)
- Auth tokens are the only sensitive data
- Data is stored locally only
- Clear data on sign out

### User Control
- Settings screen for cache management
- Clear search history option
- Clear all data option
- Storage usage information

## Usage Guidelines

### Best Practices

1. **Always handle errors** - Storage operations can fail
2. **Use appropriate cache durations** - Balance freshness with performance
3. **Provide offline fallbacks** - Show cached data when network fails
4. **Clear sensitive data** - Remove on logout/uninstall
5. **Monitor storage size** - Prevent excessive storage usage

### Performance Tips

1. **Batch operations** when possible
2. **Cache frequently accessed data**
3. **Use placeholderData** in queries for instant loading
4. **Lazy load** non-critical cached data

## Testing AsyncStorage

### Development Testing

```typescript
// Check storage contents
const info = await StorageService.getStorageInfo();
console.log('Storage keys:', info.keys);
console.log('Storage size:', info.size);

// Clear all data for testing
await StorageService.clearAllData();
```

### Production Monitoring

Monitor storage usage and errors:
- Track storage size growth
- Log storage operation failures
- Monitor cache hit rates

## Migration & Updates

When updating storage schema:

1. **Version your data** - Include version numbers
2. **Migrate gracefully** - Handle old data formats
3. **Provide fallbacks** - Default values for missing data
4. **Test thoroughly** - Ensure backward compatibility

## Troubleshooting

### Common Issues

1. **Storage quota exceeded**
   - Clear old cached data
   - Implement data rotation
   - Reduce cached data size

2. **Data corruption**
   - Validate JSON before parsing
   - Provide default values
   - Clear and refetch if needed

3. **Performance issues**
   - Use batch operations
   - Avoid frequent storage operations
   - Cache in memory for session

### Debug Commands

```typescript
// Check storage usage
const info = await StorageService.getStorageInfo();

// Clear specific cache
await CacheManager.clearCache();

// Reset all storage
await StorageService.clearAllData();
```

## Future Enhancements

Potential improvements:
- **Data encryption** for sensitive information
- **Compression** for large cached datasets
- **Background sync** for cache updates
- **Storage analytics** for usage insights
- **Smart cache eviction** based on usage patterns

This implementation provides a robust foundation for persistent data storage while maintaining excellent user experience and performance.
