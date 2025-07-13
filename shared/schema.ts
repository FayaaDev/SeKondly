import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  username: varchar("username").unique(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Medical professional fields
  phone: varchar("phone"),
  experience: varchar("experience"),
  institution: varchar("institution"),
  specialty: varchar("specialty"),
  level: varchar("level"), // Resident, Specialist , Consultant
  isApproved: boolean("is_approved").default(false),
  isAdmin: boolean("is_admin").default(false),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by"),
});

// Medical cases table
export const cases = pgTable("cases", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  history: text("history").notNull(), // Made mandatory for all cases
  specialty: varchar("specialty").notNull(),
  authorId: varchar("author_id").notNull(),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by"),
  imageUrls: text("image_urls").array(),
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  viewsCount: integer("views_count").default(0),
  // Long case format fields
  format: varchar("format", { enum: ['short', 'long'] }).default('short').notNull(),
  chiefComplaint: text("chief_complaint"),
  historyOfPresentIllness: text("history_of_present_illness"),
  pastMedicalHistory: text("past_medical_history"),
  familyHistory: text("family_history"),
  drugHistory: text("drug_history"),
  systemicReview: text("systemic_review"),
  examination: text("examination"),
  management: text("management"),
  isHot: boolean("is_hot").default(false).notNull(),
});

// Case likes table
export const caseLikes = pgTable("case_likes", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull(),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Case comments table
export const caseComments = pgTable("case_comments", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull(),
  userId: varchar("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Comment agrees table
export const commentAgrees = pgTable("comment_agrees", {
  id: serial("id").primaryKey(),
  commentId: integer("comment_id").notNull(),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Case favorites table
export const caseFavorites = pgTable("case_favorites", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull(),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Documents table for medical licenses and certifications
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  fileName: varchar("file_name").notNull(),
  fileUrl: varchar("file_url").notNull(),
  fileType: varchar("file_type").notNull(),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by"),
  rejectedAt: timestamp("rejected_at"),
  rejectedBy: varchar("rejected_by"),
  rejectionReason: text("rejection_reason"),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  type: varchar("type").notNull(), // 'like', 'comment', 'approval', 'follow'
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  relatedId: integer("related_id"), // ID of related case, comment, etc.
  fromUserId: varchar("from_user_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User follows table
export const userFollows = pgTable("user_follows", {
  id: serial("id").primaryKey(),
  followerId: varchar("follower_id").notNull(), // User who is following
  followingId: varchar("following_id").notNull(), // User being followed
  createdAt: timestamp("created_at").defaultNow(),
});

// Hidden specialties table
export const hiddenSpecialties = pgTable("hidden_specialties", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  specialty: varchar("specialty").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  cases: many(cases),
  caseLikes: many(caseLikes),
  caseComments: many(caseComments),
  caseFavorites: many(caseFavorites),
  documents: many(documents),
  notifications: many(notifications),
  following: many(userFollows, { relationName: "following" }),
  followers: many(userFollows, { relationName: "followers" }),
  hiddenSpecialties: many(hiddenSpecialties),
}));

export const casesRelations = relations(cases, ({ one, many }) => ({
  author: one(users, {
    fields: [cases.authorId],
    references: [users.id],
  }),
  likes: many(caseLikes),
  comments: many(caseComments),
  favorites: many(caseFavorites),
}));

export const caseLikesRelations = relations(caseLikes, ({ one }) => ({
  case: one(cases, {
    fields: [caseLikes.caseId],
    references: [cases.id],
  }),
  user: one(users, {
    fields: [caseLikes.userId],
    references: [users.id],
  }),
}));

export const caseCommentsRelations = relations(caseComments, ({ one }) => ({
  case: one(cases, {
    fields: [caseComments.caseId],
    references: [cases.id],
  }),
  user: one(users, {
    fields: [caseComments.userId],
    references: [users.id],
  }),
}));

export const commentAgreesRelations = relations(commentAgrees, ({ one }) => ({
  comment: one(caseComments, {
    fields: [commentAgrees.commentId],
    references: [caseComments.id],
  }),
  user: one(users, {
    fields: [commentAgrees.userId],
    references: [users.id],
  }),
}));

export const caseFavoritesRelations = relations(caseFavorites, ({ one }) => ({
  case: one(cases, {
    fields: [caseFavorites.caseId],
    references: [cases.id],
  }),
  user: one(users, {
    fields: [caseFavorites.userId],
    references: [users.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  fromUser: one(users, {
    fields: [notifications.fromUserId],
    references: [users.id],
  }),
}));

export const userFollowsRelations = relations(userFollows, ({ one }) => ({
  follower: one(users, {
    fields: [userFollows.followerId],
    references: [users.id],
    relationName: "followers",
  }),
  following: one(users, {
    fields: [userFollows.followingId],
    references: [users.id],
    relationName: "following",
  }),
}));

export const hiddenSpecialtiesRelations = relations(hiddenSpecialties, ({ one }) => ({
  user: one(users, {
    fields: [hiddenSpecialties.userId],
    references: [users.id],
  }),
}));

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCaseSchema = z.discriminatedUnion('format', [
  // Short format schema
  z.object({
    format: z.literal('short'),
    title: z.string().min(1, "Title is required"),
    history: z.string().min(1, "History is required for short format cases"),
    specialty: z.string().min(1, "Specialty is required"),
    authorId: z.string(),
    imageUrls: z.array(z.string()).max(3, "Maximum of 3 images allowed").optional(),
    chiefComplaint: z.string().optional(),
    historyOfPresentIllness: z.string().optional(),
    pastMedicalHistory: z.string().optional(),
    familyHistory: z.string().optional(),
    drugHistory: z.string().optional(),
    systemicReview: z.string().optional(),
    examination: z.string().optional(),
    management: z.string().optional(),
  }),
  // Long format schema
  z.object({
    format: z.literal('long'),
    title: z.string().min(1, "Title is required"),
    specialty: z.string().min(1, "Specialty is required"),
    authorId: z.string(),
    history: z.string().min(1, "History is required"),  // Made mandatory for both formats
    chiefComplaint: z.string().min(1, "Chief complaint is required for long format cases"),
    historyOfPresentIllness: z.string().min(1, "History of present illness is required for long format cases"),
    pastMedicalHistory: z.string().optional(),
    familyHistory: z.string().optional(),
    drugHistory: z.string().optional(),
    systemicReview: z.string().optional(),
    examination: z.string().optional(),
    management: z.string().optional(),
    imageUrls: z.array(z.string()).max(3, "Maximum of 3 images allowed").optional(),
  })
]);

export const insertCommentSchema = createInsertSchema(caseComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  isApproved: true,
  approvedAt: true,
  approvedBy: true,
  rejectedAt: true,
  rejectedBy: true,
  rejectionReason: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Case = typeof cases.$inferSelect;
export type InsertCase = z.infer<typeof insertCaseSchema>;

export type CaseFormat = 'short' | 'long';

export type CaseLike = typeof caseLikes.$inferSelect;
export type CaseComment = typeof caseComments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type CommentAgree = typeof commentAgrees.$inferSelect;

export type CaseFavorite = typeof caseFavorites.$inferSelect;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type UserFollow = typeof userFollows.$inferSelect;

export type HiddenSpecialty = typeof hiddenSpecialties.$inferSelect;

// Extended types for API responses
export type CaseWithAuthor = Case & {
  author: User;
  isLikedByUser?: boolean;
  userLikeId?: number;
  isAuthorFollowedByUser?: boolean;
};

export type CommentWithAuthor = CaseComment & {
  author: User;
  isAgreedByUser?: boolean;
  agreesCount?: number;
};

export type UserWithFollowStats = User & {
  followersCount?: number;
  followingCount?: number;
  isFollowedByUser?: boolean;
  isFollowing?: boolean;
};
