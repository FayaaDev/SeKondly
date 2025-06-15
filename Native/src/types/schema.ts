// Re-export types from shared schema to maintain compatibility
export * from './shared';

// Legacy type aliases for backward compatibility
export type { 
  User,
  Case,
  CaseComment,
  CaseLike,
  CaseFavorite,
  Notification,
  Document,
  UserFollow,
  HiddenSpecialty,
  CaseWithAuthor,
  CommentWithAuthor,
  NotificationWithRelated,
  UserWithFollowStats,
  SearchFilters,
  Tab,
  Specialty,
  MEDICAL_SPECIALTIES
} from './shared';
