// Main types export for SeKondly Native App
// Integrates with shared schema at /Users/fayaa/SeKondly/shared/schema.ts

// Export all shared schema types
export * from './shared';
export * from './schema';
export * from './navigation';
export * from './integration';

// Additional convenience exports
export type {
  User,
  Case,
  CaseComment,
  CaseWithAuthor,
  CommentWithAuthor,
  Notification,
  NotificationWithRelated,
  UserWithFollowStats,
  Document,
  SearchFilters,
  Tab,
  Specialty,
  ApiResponse,
  PaginatedResponse
} from './shared';

export type {
  ConnectionStatus,
  DatabaseConnection
} from './integration';
