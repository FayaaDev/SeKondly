import { pgTable, serial, integer, varchar, text, timestamp, boolean, index, jsonb, unique } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const caseComments = pgTable("case_comments", {
	id: serial().primaryKey().notNull(),
	caseId: integer("case_id").notNull(),
	userId: varchar("user_id").notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const caseFavorites = pgTable("case_favorites", {
	id: serial().primaryKey().notNull(),
	caseId: integer("case_id").notNull(),
	userId: varchar("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const caseLikes = pgTable("case_likes", {
	id: serial().primaryKey().notNull(),
	caseId: integer("case_id").notNull(),
	userId: varchar("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const documents = pgTable("documents", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	fileName: varchar("file_name").notNull(),
	fileUrl: varchar("file_url").notNull(),
	fileType: varchar("file_type").notNull(),
	isApproved: boolean("is_approved").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	approvedBy: varchar("approved_by"),
	rejectedAt: timestamp("rejected_at", { mode: 'string' }),
	rejectedBy: varchar("rejected_by"),
	rejectionReason: text("rejection_reason"),
});

export const hiddenSpecialties = pgTable("hidden_specialties", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	specialty: varchar().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const notifications = pgTable("notifications", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	type: varchar().notNull(),
	title: varchar().notNull(),
	message: text().notNull(),
	isRead: boolean("is_read").default(false),
	relatedId: integer("related_id"),
	fromUserId: varchar("from_user_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const sessions = pgTable("sessions", {
	sid: varchar().primaryKey().notNull(),
	sess: jsonb().notNull(),
	expire: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	index("IDX_session_expire").using("btree", table.expire.asc().nullsLast().op("timestamp_ops")),
]);

export const cases = pgTable("cases", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	history: text().notNull(),
	specialty: varchar().notNull(),
	authorId: varchar("author_id").notNull(),
	isApproved: boolean("is_approved").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	approvedBy: varchar("approved_by"),
	imageUrls: text("image_urls").array(),
	likesCount: integer("likes_count").default(0),
	commentsCount: integer("comments_count").default(0),
	viewsCount: integer("views_count").default(0),
	format: varchar().default('short').notNull(),
	chiefComplaint: text("chief_complaint"),
	historyOfPresentIllness: text("history_of_present_illness"),
	pastMedicalHistory: text("past_medical_history"),
	familyHistory: text("family_history"),
	drugHistory: text("drug_history"),
	systemicReview: text("systemic_review"),
	examination: text(),
	management: text(),
});

export const userFollows = pgTable("user_follows", {
	id: serial().primaryKey().notNull(),
	followerId: varchar("follower_id").notNull(),
	followingId: varchar("following_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const users = pgTable("users", {
	id: varchar().primaryKey().notNull(),
	email: varchar(),
	firstName: varchar("first_name"),
	lastName: varchar("last_name"),
	profileImageUrl: varchar("profile_image_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	phone: varchar(),
	medicalBoard: varchar("medical_board"),
	fellowship: varchar(),
	experience: varchar(),
	institution: varchar(),
	specialty: varchar(),
	isApproved: boolean("is_approved").default(false),
	isAdmin: boolean("is_admin").default(false),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	approvedBy: varchar("approved_by"),
	username: varchar(),
	password: varchar().notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
	unique("users_username_unique").on(table.username),
]);
