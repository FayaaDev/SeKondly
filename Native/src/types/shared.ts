// Integration with shared schema from /Users/fayaa/SeKondly/shared/schema.ts
// This file ensures the native app uses the exact same types as the backend

// Import the shared schema types
import type { 
  users, 
  cases, 
  caseComments, 
  caseLikes, 
  caseFavorites, 
  notifications, 
  documents, 
  userFollows, 
  hiddenSpecialties 
} from '../../../shared/schema';

// Re-export the inferred types from the shared schema
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Case = typeof cases.$inferSelect;
export type InsertCase = typeof cases.$inferInsert;

export type CaseComment = typeof caseComments.$inferSelect;
export type InsertCaseComment = typeof caseComments.$inferInsert;

export type CaseLike = typeof caseLikes.$inferSelect;
export type InsertCaseLike = typeof caseLikes.$inferInsert;

export type CaseFavorite = typeof caseFavorites.$inferSelect;
export type InsertCaseFavorite = typeof caseFavorites.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

export type UserFollow = typeof userFollows.$inferSelect;
export type InsertUserFollow = typeof userFollows.$inferInsert;

export type HiddenSpecialty = typeof hiddenSpecialties.$inferSelect;
export type InsertHiddenSpecialty = typeof hiddenSpecialties.$inferInsert;

// Enhanced types with relations for the native app
export type CaseWithAuthor = Case & {
  author: User;
  isLikedByUser?: boolean;
  userLikeId?: number;
  isFavoritedByUser?: boolean;
};

export type CommentWithAuthor = CaseComment & {
  author: User;
};

export type NotificationWithRelated = Notification & {
  fromUser?: User;
  relatedCase?: Case;
};

export type UserWithFollowStats = User & {
  followersCount?: number;
  followingCount?: number;
  isFollowedByUser?: boolean;
};

// Medical specialties from the backend
export const MEDICAL_SPECIALTIES = [
  "Cardiology",
  "Dermatology", 
  "Emergency Medicine",
  "Endocrinology",
  "Gastroenterology",
  "General Practice",
  "Hematology",
  "Infectious Disease",
  "Internal Medicine",
  "Nephrology",
  "Neurology",
  "Obstetrics & Gynecology",
  "Oncology",
  "Ophthalmology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
  "Radiology",
  "Rheumatology",
  "Surgery",
  "Urology",
  "Other"
] as const;

export type Specialty = typeof MEDICAL_SPECIALTIES[number];

// Additional native-specific types
export type SearchFilters = {
  query: string;
  specialty: string;
  dateRange: string;
};

export type Tab = "feed" | "mycases" | "favorites" | "notifications" | "profile";

export type ApiResponse<T = any> = {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};
