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
  createCase(caseData: InsertCase): Promise<Case>;
  updateCase(id: number, updates: Partial<Case>): Promise<Case>;
  deleteCase(id: number): Promise<void>;
  incrementCaseViews(id: number): Promise<void>;
  searchCases(userId: string, filters: { query?: string; specialty?: string; dateRange?: string }): Promise<CaseWithAuthor[]>;
  
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
        author: {
          id: users.id,
          email: users.email,
          username: users.username,
          password: users.password,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          phone: users.phone,
          medicalBoard: users.medicalBoard,
          fellowship: users.fellowship,
          experience: users.experience,
          institution: users.institution,
          specialty: users.specialty,
          isApproved: users.isApproved,
          isAdmin: users.isAdmin,
          approvedAt: users.approvedAt,
          approvedBy: users.approvedBy,
        },
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
        .select()
        .from(cases)
        .innerJoin(users, eq(cases.authorId, users.id))
        .where(eq(cases.authorId, userId))
        .orderBy(desc(cases.createdAt));

      // Transform the results to match CaseWithAuthor structure
      const transformedResults = results.map((row: any) => {
        return {
          id: row.cases.id,
          title: row.cases.title,
          history: row.cases.history,
          specialty: row.cases.specialty,
          authorId: row.cases.authorId,
          isApproved: row.cases.isApproved,
          createdAt: row.cases.createdAt,
          updatedAt: row.cases.updatedAt,
          approvedAt: row.cases.approvedAt,
          approvedBy: row.cases.approvedBy,
          imageUrls: row.cases.imageUrls,
          likesCount: row.cases.likesCount,
          commentsCount: row.cases.commentsCount,
          viewsCount: row.cases.viewsCount,
          author: row.users,
        };
      });

      return transformedResults as CaseWithAuthor[];
    } catch (error) {
      console.error("Error in getUserCases:", error);
      throw error;
    }
  }

  async createCase(caseData: InsertCase): Promise<Case> {
    console.log('storage.createCase - Input data:', caseData);
    const [newCase] = await db.insert(cases).values(caseData).returning();
    console.log('storage.createCase - Created case:', newCase);
    return newCase;
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

  async searchCases(userId: string, filters: { query?: string; specialty?: string; dateRange?: string }): Promise<CaseWithAuthor[]> {
    // Start with basic approved cases query
    let whereConditions = and(eq(cases.isApproved, true));

    // Add search query filter
    if (filters.query) {
      const searchTerm = `%${filters.query.toLowerCase()}%`;
      whereConditions = and(
        whereConditions,
        sql`(LOWER(${cases.title}) LIKE ${searchTerm} OR LOWER(${cases.history}) LIKE ${searchTerm} OR LOWER(${cases.specialty}) LIKE ${searchTerm})`
      );
    }

    // Add specialty filter
    if (filters.specialty && filters.specialty !== 'all') {
      whereConditions = and(whereConditions, eq(cases.specialty, filters.specialty));
    }

    // Add date range filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      let dateThreshold: Date;

      switch (filters.dateRange) {
        case 'today':
          dateThreshold = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          dateThreshold = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case '3months':
          dateThreshold = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          break;
        case '6months':
          dateThreshold = new Date(now.getFullYear(), now.getMonth() - 6, 1);
          break;
        case 'year':
          dateThreshold = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          dateThreshold = new Date(0);
      }

      whereConditions = and(whereConditions, sql`${cases.createdAt} >= ${dateThreshold}`);
    }

    return await db
      .select({
        id: cases.id,
        title: cases.title,
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
        author: users,
        isLikedByUser: userId ? sql<boolean>`EXISTS(SELECT 1 FROM ${caseLikes} WHERE ${caseLikes.caseId} = ${cases.id} AND ${caseLikes.userId} = ${userId})` : sql<boolean>`false`,
        isFavoritedByUser: userId ? sql<boolean>`EXISTS(SELECT 1 FROM ${caseFavorites} WHERE ${caseFavorites.caseId} = ${cases.id} AND ${caseFavorites.userId} = ${userId})` : sql<boolean>`false`,
      })
      .from(cases)
      .innerJoin(users, eq(cases.authorId, users.id))
      .where(whereConditions)
      .orderBy(desc(cases.createdAt));
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
        author: {
          id: users.id,
          email: users.email,
          username: users.username,
          password: users.password,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          specialty: users.specialty,
          institution: users.institution,
          experience: users.experience,
          isApproved: users.isApproved,
          isAdmin: users.isAdmin,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          phone: users.phone,
          medicalBoard: users.medicalBoard,
          fellowship: users.fellowship,
          approvedAt: users.approvedAt,
          approvedBy: users.approvedBy,
        },
      })
      .from(caseFavorites)
      .innerJoin(cases, eq(caseFavorites.caseId, cases.id))
      .innerJoin(users, eq(cases.authorId, users.id))
      .where(eq(caseFavorites.userId, userId))
      .orderBy(desc(caseFavorites.createdAt));

    return favoriteCases;
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
      .select()
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
