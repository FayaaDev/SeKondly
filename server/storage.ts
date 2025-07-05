import {
  users,
  cases,
  caseLikes,
  caseComments,
  caseFavorites,
  documents,
  notifications,
  userFollows,
  hiddenSpecialties,
  type User,
  type UpsertUser,
  type Case,
  type InsertCase,
  type CaseWithAuthor,
  type CaseLike,
  type CaseComment,
  type InsertComment,
  type CommentWithAuthor,
  type CaseFavorite,
  type Document,
  type InsertDocument,
  type Notification,
  type InsertNotification,
  type UserFollow,
  type HiddenSpecialty,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, sql, or, notInArray } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmailOrUsername(emailOrUsername: string): Promise<User | undefined>;
  upsertUser(user: User): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  
  // Case operations
  getCases(userId?: string, approvedOnly?: boolean): Promise<CaseWithAuthor[]>;
  getCase(id: number): Promise<CaseWithAuthor | undefined>;
  getUserCases(userId: string): Promise<CaseWithAuthor[]>;
  createCase(caseData: InsertCase): Promise<CaseWithAuthor>;
  updateCase(id: number, updates: Partial<Case>): Promise<Case>;
  deleteCase(id: number): Promise<void>;
  incrementCaseViews(id: number): Promise<void>;
  
  // Case interaction operations
  likeCase(caseId: number, userId: string): Promise<CaseLike>;
  unlikeCase(caseId: number, userId: string): Promise<void>;
  getCaseLike(caseId: number, userId: string): Promise<CaseLike | undefined>;
  addComment(commentData: InsertComment): Promise<CommentWithAuthor>;
  getCaseComments(caseId: number): Promise<CommentWithAuthor[]>;
  
  // Favorites operations
  favoriteCase(caseId: number, userId: string): Promise<CaseFavorite>;
  unfavoriteCase(caseId: number, userId: string): Promise<void>;
  getCaseFavorite(caseId: number, userId: string): Promise<CaseFavorite | undefined>;
  getUserFavorites(userId: string): Promise<CaseWithAuthor[]>;
  
  // Document operations
  uploadDocument(documentData: InsertDocument): Promise<Document>;
  getUserDocuments(userId: string): Promise<Document[]>;
  getPendingDocuments(): Promise<Document[]>;
  approveDocument(id: number, approvedBy: string): Promise<Document>;
  rejectDocument(id: number, rejectedBy: string, reason: string): Promise<Document>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  getPendingUsers(): Promise<User[]>;
  approveUser(id: string, approvedBy: string): Promise<User>;
  rejectUser(id: string): Promise<void>;
  getPendingCases(): Promise<CaseWithAuthor[]>;
  approveCase(id: number, approvedBy: string): Promise<Case>;
  rejectCase(id: number): Promise<void>;
  getAdminStats(): Promise<{
    totalUsers: number;
    pendingUsers: number;
    totalCases: number;
    pendingCases: number;
    totalDocuments: number;
    pendingDocuments: number;
  }>;
  
  // Notification operations
  createNotification(notificationData: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string, limit?: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  
  // Follow operations
  followUser(followerId: string, followingId: string): Promise<UserFollow>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getUserFollowers(userId: string): Promise<User[]>;
  getUserFollowing(userId: string): Promise<User[]>;
  getFollowersCount(userId: string): Promise<number>;
  getFollowingCount(userId: string): Promise<number>;
  
  // Hidden specialties operations
  hideSpecialty(userId: string, specialty: string): Promise<HiddenSpecialty>;
  getUserHiddenSpecialties(userId: string): Promise<string[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmailOrUsername(emailOrUsername: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(or(
        eq(users.email, emailOrUsername),
        eq(users.username, emailOrUsername)
      ));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (!userData.email) {
      throw new Error('Email is required for user registration');
    }

    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        username: userData.email.split('@')[0],
        password: userData.password || '', // Ensure password is not null
        isApproved: false, // New users are not approved by default
        isAdmin: false, // New users are not admins by default
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          username: userData.email.split('@')[0],
          password: userData.password || '',
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Case operations
  async getCases(userId?: string, approvedOnly = true): Promise<CaseWithAuthor[]> {
    let conditions = [];
    
    if (approvedOnly) {
      conditions.push(eq(cases.isApproved, true));
    }

    // Filter out hidden specialties for the user
    if (userId) {
      const hiddenSpecialtiesList = await this.getUserHiddenSpecialties(userId);
      if (hiddenSpecialtiesList.length > 0) {
        conditions.push(notInArray(cases.specialty, hiddenSpecialtiesList));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const query = db
      .select({
        id: cases.id,
        title: cases.title,
        history: cases.history,
        format: sql<'short' | 'long'>`COALESCE(${cases.format}, 'short')`.as('format'),
        specialty: cases.specialty,
        authorId: cases.authorId,
        isApproved: cases.isApproved,
        createdAt: cases.createdAt,
        updatedAt: cases.updatedAt,
        approvedAt: cases.approvedAt,
        approvedBy: cases.approvedBy,
        imageUrls: cases.imageUrls,
        likesCount: cases.likesCount,
        commentsCount: cases.commentsCount,
        viewsCount: cases.viewsCount,
        chiefComplaint: cases.chiefComplaint,
        historyOfPresentIllness: cases.historyOfPresentIllness,
        pastMedicalHistory: cases.pastMedicalHistory,
        familyHistory: cases.familyHistory,
        drugHistory: cases.drugHistory,
        systemicReview: cases.systemicReview,
        examination: cases.examination,
        management: cases.management,
        author: users,
        isLikedByUser: userId ? sql<boolean>`EXISTS(SELECT 1 FROM ${caseLikes} WHERE ${caseLikes.caseId} = ${cases.id} AND ${caseLikes.userId} = ${userId})` : sql<boolean>`false`,
        isFavoritedByUser: userId ? sql<boolean>`EXISTS(SELECT 1 FROM ${caseFavorites} WHERE ${caseFavorites.caseId} = ${cases.id} AND ${caseFavorites.userId} = ${userId})` : sql<boolean>`false`,
      })
      .from(cases)
      .innerJoin(users, eq(cases.authorId, users.id))
      .orderBy(desc(cases.createdAt));

    if (whereClause) {
      query.where(whereClause);
    }

    return await query;
  }

  async getCase(id: number): Promise<CaseWithAuthor | undefined> {
    const [result] = await db
      .select({
        id: cases.id,
        title: cases.title,
        history: cases.history,
        format: sql<'short' | 'long'>`COALESCE(${cases.format}, 'short')`.as('format'),
        specialty: cases.specialty,
        authorId: cases.authorId,
        isApproved: cases.isApproved,
        createdAt: cases.createdAt,
        updatedAt: cases.updatedAt,
        approvedAt: cases.approvedAt,
        approvedBy: cases.approvedBy,
        imageUrls: cases.imageUrls,
        likesCount: cases.likesCount,
        commentsCount: cases.commentsCount,
        viewsCount: cases.viewsCount,
        chiefComplaint: cases.chiefComplaint,
        historyOfPresentIllness: cases.historyOfPresentIllness,
        pastMedicalHistory: cases.pastMedicalHistory,
        familyHistory: cases.familyHistory,
        drugHistory: cases.drugHistory,
        systemicReview: cases.systemicReview,
        examination: cases.examination,
        management: cases.management,
        author: users,
      })
      .from(cases)
      .innerJoin(users, eq(cases.authorId, users.id))
      .where(eq(cases.id, id));

    return result;
  }

  async getUserCases(userId: string): Promise<CaseWithAuthor[]> {
    try {
      // Use join query to get cases with author data
      const results = await db
        .select({
          id: cases.id,
          title: cases.title,
          history: cases.history,
          format: sql<'short' | 'long'>`COALESCE(${cases.format}, 'short')`.as('format'),
          specialty: cases.specialty,
          authorId: cases.authorId,
          isApproved: cases.isApproved,
          createdAt: cases.createdAt,
          updatedAt: cases.updatedAt,
          approvedAt: cases.approvedAt,
          approvedBy: cases.approvedBy,
          imageUrls: cases.imageUrls,
          likesCount: cases.likesCount,
          commentsCount: cases.commentsCount,
          viewsCount: cases.viewsCount,
          chiefComplaint: cases.chiefComplaint,
          historyOfPresentIllness: cases.historyOfPresentIllness,
          pastMedicalHistory: cases.pastMedicalHistory,
          familyHistory: cases.familyHistory,
          drugHistory: cases.drugHistory,
          systemicReview: cases.systemicReview,
          examination: cases.examination,
          management: cases.management,
          author: users,
        })
        .from(cases)
        .innerJoin(users, eq(cases.authorId, users.id))
        .where(eq(cases.authorId, userId))
        .orderBy(desc(cases.createdAt));

      return results as CaseWithAuthor[];
    } catch (error) {
      console.error("Error in getUserCases:", error);
      throw error;
    }
  }

  async createCase(caseData: InsertCase): Promise<CaseWithAuthor> {
    console.log('storage.createCase - Input data:', caseData);
    
    // Insert the case with all fields specified
    // Ensure format is set to a valid literal type
    const format = caseData.format === 'long' ? 'long' as const : 'short' as const;
    console.log('storage.createCase - Format:', format);
    
    const [newCase] = await db
      .insert(cases)
      .values({
        ...caseData,
        format, // Use the validated format
        chiefComplaint: caseData.chiefComplaint || null,
        historyOfPresentIllness: caseData.historyOfPresentIllness || null,
        pastMedicalHistory: caseData.pastMedicalHistory || null,
        familyHistory: caseData.familyHistory || null,
        drugHistory: caseData.drugHistory || null,
        systemicReview: caseData.systemicReview || null,
        examination: caseData.examination || null,
        management: caseData.management || null,
      })
      .returning();
    
    console.log('storage.createCase - Created case:', newCase);
    
    // Fetch full case with author info using an explicit SELECT
    const fullCase = await db
      .select({
        id: cases.id,
        title: cases.title,
        format: sql<'short' | 'long'>`COALESCE(${cases.format}, 'short')`.as('format'),
        history: cases.history,
        specialty: cases.specialty,
        authorId: cases.authorId,
        isApproved: cases.isApproved,
        createdAt: cases.createdAt,
        updatedAt: cases.updatedAt,
        approvedAt: cases.approvedAt,
        approvedBy: cases.approvedBy,
        imageUrls: cases.imageUrls,
        likesCount: cases.likesCount,
        commentsCount: cases.commentsCount,
        viewsCount: cases.viewsCount,
        chiefComplaint: cases.chiefComplaint,
        historyOfPresentIllness: cases.historyOfPresentIllness,
        pastMedicalHistory: cases.pastMedicalHistory,
        familyHistory: cases.familyHistory,
        drugHistory: cases.drugHistory,
        systemicReview: cases.systemicReview,
        examination: cases.examination,
        management: cases.management,
        author: users,
      })
      .from(cases)
      .innerJoin(users, eq(cases.authorId, users.id))
      .where(eq(cases.id, newCase.id))
      .limit(1);
      
    const case_data = fullCase[0];
    if (!case_data) {
      throw new Error('Failed to fetch created case with author info');
    }
    
    console.log('storage.createCase - Fetched full case:', case_data);
    return case_data;
  }

  async updateCase(id: number, updates: Partial<Case>): Promise<Case> {
    const [updatedCase] = await db
      .update(cases)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(cases.id, id))
      .returning();
    return updatedCase;
  }

  async deleteCase(id: number): Promise<void> {
    await db.delete(cases).where(eq(cases.id, id));
  }

  async incrementCaseViews(id: number): Promise<void> {
    await db
      .update(cases)
      .set({ viewsCount: sql`${cases.viewsCount} + 1` })
      .where(eq(cases.id, id));
  }

  // Case interaction operations
  async likeCase(caseId: number, userId: string): Promise<CaseLike> {
    const [like] = await db
      .insert(caseLikes)
      .values({ caseId, userId })
      .returning();

    // Update like count
    await db
      .update(cases)
      .set({ likesCount: sql`${cases.likesCount} + 1` })
      .where(eq(cases.id, caseId));

    return like;
  }

  async unlikeCase(caseId: number, userId: string): Promise<void> {
    await db
      .delete(caseLikes)
      .where(and(eq(caseLikes.caseId, caseId), eq(caseLikes.userId, userId)));

    // Update like count
    await db
      .update(cases)
      .set({ likesCount: sql`${cases.likesCount} - 1` })
      .where(eq(cases.id, caseId));
  }

  async getCaseLike(caseId: number, userId: string): Promise<CaseLike | undefined> {
    const [like] = await db
      .select()
      .from(caseLikes)
      .where(and(eq(caseLikes.caseId, caseId), eq(caseLikes.userId, userId)));
    return like;
  }

  async addComment(commentData: InsertComment): Promise<CommentWithAuthor> {
    const [comment] = await db
      .insert(caseComments)
      .values(commentData)
      .returning();

    // Update comment count
    await db
      .update(cases)
      .set({ commentsCount: sql`${cases.commentsCount} + 1` })
      .where(eq(cases.id, commentData.caseId));

    // Get comment with author
    const [commentWithAuthor] = await db
      .select({
        id: caseComments.id,
        caseId: caseComments.caseId,
        userId: caseComments.userId,
        content: caseComments.content,
        createdAt: caseComments.createdAt,
        updatedAt: caseComments.updatedAt,
        author: users,
      })
      .from(caseComments)
      .innerJoin(users, eq(caseComments.userId, users.id))
      .where(eq(caseComments.id, comment.id));

    return commentWithAuthor;
  }

  async getCaseComments(caseId: number): Promise<CommentWithAuthor[]> {
    return await db
      .select({
        id: caseComments.id,
        caseId: caseComments.caseId,
        userId: caseComments.userId,
        content: caseComments.content,
        createdAt: caseComments.createdAt,
        updatedAt: caseComments.updatedAt,
        author: users,
      })
      .from(caseComments)
      .innerJoin(users, eq(caseComments.userId, users.id))
      .where(eq(caseComments.caseId, caseId))
      .orderBy(desc(caseComments.createdAt));
  }

  // Favorites operations
  async favoriteCase(caseId: number, userId: string): Promise<CaseFavorite> {
    const [favorite] = await db
      .insert(caseFavorites)
      .values({ caseId, userId })
      .returning();
    return favorite;
  }

  async unfavoriteCase(caseId: number, userId: string): Promise<void> {
    await db
      .delete(caseFavorites)
      .where(and(eq(caseFavorites.caseId, caseId), eq(caseFavorites.userId, userId)));
  }

  async getCaseFavorite(caseId: number, userId: string): Promise<CaseFavorite | undefined> {
    const [favorite] = await db
      .select()
      .from(caseFavorites)
      .where(and(eq(caseFavorites.caseId, caseId), eq(caseFavorites.userId, userId)));
    return favorite;
  }

  async getUserFavorites(userId: string): Promise<CaseWithAuthor[]> {
    const favoriteCases = await db
      .select({
        id: cases.id,
        title: cases.title,
        history: cases.history,
        format: sql<'short' | 'long'>`COALESCE(${cases.format}, 'short')`.as('format'),
        specialty: cases.specialty,
        authorId: cases.authorId,
        isApproved: cases.isApproved,
        createdAt: cases.createdAt,
        updatedAt: cases.updatedAt,
        approvedAt: cases.approvedAt,
        approvedBy: cases.approvedBy,
        imageUrls: cases.imageUrls,
        likesCount: cases.likesCount,
        commentsCount: cases.commentsCount,
        viewsCount: cases.viewsCount,
        chiefComplaint: cases.chiefComplaint,
        historyOfPresentIllness: cases.historyOfPresentIllness,
        pastMedicalHistory: cases.pastMedicalHistory,
        familyHistory: cases.familyHistory,
        drugHistory: cases.drugHistory,
        systemicReview: cases.systemicReview,
        examination: cases.examination,
        management: cases.management,
        author: users,
      })
      .from(caseFavorites)
      .innerJoin(cases, eq(caseFavorites.caseId, cases.id))
      .innerJoin(users, eq(cases.authorId, users.id))
      .where(eq(caseFavorites.userId, userId))
      .orderBy(desc(caseFavorites.createdAt));

    return favoriteCases as CaseWithAuthor[];
  }

  // Document operations
  async uploadDocument(documentData: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(documentData)
      .returning();
    return document;
  }

  async getUserDocuments(userId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt));
  }

  async getPendingDocuments(): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.isApproved, false))
      .orderBy(desc(documents.createdAt));
  }

  async approveDocument(id: number, approvedBy: string): Promise<Document> {
    const [document] = await db
      .update(documents)
      .set({
        isApproved: true,
        approvedAt: new Date(),
        approvedBy,
      })
      .where(eq(documents.id, id))
      .returning();
    return document;
  }

  async rejectDocument(id: number, rejectedBy: string, reason: string): Promise<Document> {
    const [document] = await db
      .update(documents)
      .set({
        rejectedAt: new Date(),
        rejectedBy,
        rejectionReason: reason,
      })
      .where(eq(documents.id, id))
      .returning();
    return document;
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        password: users.password,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        specialty: users.specialty,
        experience: users.experience,
        institution: users.institution,
        isApproved: users.isApproved,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        phone: users.phone,
        medicalBoard: users.medicalBoard,
        fellowship: users.fellowship,
        approvedAt: users.approvedAt,
        approvedBy: users.approvedBy,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async getPendingUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.isApproved, false))
      .orderBy(desc(users.createdAt));
  }

  async approveUser(id: string, approvedBy: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        isApproved: true,
        approvedAt: new Date(),
        approvedBy,
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async rejectUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getPendingCases(): Promise<CaseWithAuthor[]> {
    return await db
      .select({
        id: cases.id,
        title: cases.title,
        history: cases.history,
        format: sql<'short' | 'long'>`COALESCE(${cases.format}, 'short')`.as('format'),
        specialty: cases.specialty,
        authorId: cases.authorId,
        isApproved: cases.isApproved,
        createdAt: cases.createdAt,
        updatedAt: cases.updatedAt,
        approvedAt: cases.approvedAt,
        approvedBy: cases.approvedBy,
        imageUrls: cases.imageUrls,
        likesCount: cases.likesCount,
        commentsCount: cases.commentsCount,
        viewsCount: cases.viewsCount,
        chiefComplaint: cases.chiefComplaint,
        historyOfPresentIllness: cases.historyOfPresentIllness,
        pastMedicalHistory: cases.pastMedicalHistory,
        familyHistory: cases.familyHistory,
        drugHistory: cases.drugHistory,
        systemicReview: cases.systemicReview,
        examination: cases.examination,
        management: cases.management,
        author: users,
      })
      .from(cases)
      .innerJoin(users, eq(cases.authorId, users.id))
      .where(eq(cases.isApproved, false))
      .orderBy(desc(cases.createdAt));
  }

  async approveCase(id: number, approvedBy: string): Promise<Case> {
    const [caseRecord] = await db
      .update(cases)
      .set({
        isApproved: true,
        approvedAt: new Date(),
        approvedBy,
      })
      .where(eq(cases.id, id))
      .returning();
    return caseRecord;
  }

  async rejectCase(id: number): Promise<void> {
    await db.delete(cases).where(eq(cases.id, id));
  }

  // Notification operations
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(notificationData)
      .returning();
    return notification;
  }

  async getUserNotifications(userId: string, limit = 50): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result.count;
  }

  // Follow operations
  async followUser(followerId: string, followingId: string): Promise<UserFollow> {
    const [follow] = await db
      .insert(userFollows)
      .values({ followerId, followingId })
      .returning();
    
    // Create notification for followed user
    await this.createNotification({
      userId: followingId,
      type: 'follow',
      title: 'New Follower',
      message: 'Someone started following you',
      fromUserId: followerId,
    });
    
    return follow;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await db
      .delete(userFollows)
      .where(and(
        eq(userFollows.followerId, followerId),
        eq(userFollows.followingId, followingId)
      ));
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(userFollows)
      .where(and(
        eq(userFollows.followerId, followerId),
        eq(userFollows.followingId, followingId)
      ))
      .limit(1);
    return !!follow;
  }

  async getUserFollowers(userId: string): Promise<User[]> {
    const followers = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        password: users.password,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        specialty: users.specialty,
        experience: users.experience,
        institution: users.institution,
        isApproved: users.isApproved,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        phone: users.phone,
        medicalBoard: users.medicalBoard,
        fellowship: users.fellowship,
        approvedAt: users.approvedAt,
        approvedBy: users.approvedBy,
      })
      .from(userFollows)
      .innerJoin(users, eq(userFollows.followerId, users.id))
      .where(eq(userFollows.followingId, userId));
    return followers;
  }

  async getUserFollowing(userId: string): Promise<User[]> {
    const following = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        password: users.password,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        specialty: users.specialty,
        experience: users.experience,
        institution: users.institution,
        isApproved: users.isApproved,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        phone: users.phone,
        medicalBoard: users.medicalBoard,
        fellowship: users.fellowship,
        approvedAt: users.approvedAt,
        approvedBy: users.approvedBy,
      })
      .from(userFollows)
      .innerJoin(users, eq(userFollows.followingId, users.id))
      .where(eq(userFollows.followerId, userId));
    return following;
  }

  async getFollowersCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(userFollows)
      .where(eq(userFollows.followingId, userId));
    return result.count;
  }

  async getFollowingCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(userFollows)
      .where(eq(userFollows.followerId, userId));
    return result.count;
  }

  async hideSpecialty(userId: string, specialty: string): Promise<HiddenSpecialty> {
    const [hiddenSpecialty] = await db
      .insert(hiddenSpecialties)
      .values({
        userId,
        specialty,
      })
      .onConflictDoNothing()
      .returning();
    return hiddenSpecialty;
  }

  async getUserHiddenSpecialties(userId: string): Promise<string[]> {
    const results = await db
      .select({ specialty: hiddenSpecialties.specialty })
      .from(hiddenSpecialties)
      .where(eq(hiddenSpecialties.userId, userId));
    return results.map(r => r.specialty);
  }

  async getAdminStats(): Promise<{
    totalUsers: number;
    pendingUsers: number;
    totalCases: number;
    pendingCases: number;
    totalDocuments: number;
    pendingDocuments: number;
  }> {
    const [totalUsersResult] = await db
      .select({ count: count() })
      .from(users);

    const [pendingUsersResult] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.isApproved, false));

    const [totalCasesResult] = await db
      .select({ count: count() })
      .from(cases);

    const [pendingCasesResult] = await db
      .select({ count: count() })
      .from(cases)
      .where(eq(cases.isApproved, false));

    const [totalDocumentsResult] = await db
      .select({ count: count() })
      .from(documents);

    const [pendingDocumentsResult] = await db
      .select({ count: count() })
      .from(documents)
      .where(eq(documents.isApproved, false));

    return {
      totalUsers: totalUsersResult.count,
      pendingUsers: pendingUsersResult.count,
      totalCases: totalCasesResult.count,
      pendingCases: pendingCasesResult.count,
      totalDocuments: totalDocumentsResult.count,
      pendingDocuments: pendingDocumentsResult.count,
    };
  }
}

export const storage = new DatabaseStorage();
