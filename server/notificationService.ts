import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { db } from './db';
import { 
  notificationTokens, 
  notificationPreferences, 
  notifications as notificationsTable,
  users
} from '@shared/schema';
import { eq, and, inArray, or, isNull } from 'drizzle-orm';

/**
 * NotificationService - Backend service for handling push notifications
 * 
 * Features:
 * - Send push notifications using Expo Push Service
 * - Manage notification tokens
 * - Handle notification preferences
 * - Create notification records in database
 * - Send different types of notifications (likes, comments, follows, etc.)
 */
export class NotificationService {
  private expo: Expo;

  constructor() {
    this.expo = new Expo({
      accessToken: process.env.EXPO_ACCESS_TOKEN,
      useFcmV1: true, // Use FCM v1 API
    });
  }

  /**
   * Register a notification token for a user
   */
  async registerToken(userId: string, token: string, platform: 'ios' | 'android'): Promise<void> {
    try {
      // Validate the token
      if (!Expo.isExpoPushToken(token)) {
        throw new Error('Invalid Expo push token');
      }

      // First, deactivate any existing tokens for this user and token combination
      await db
        .update(notificationTokens)
        .set({ isActive: false })
        .where(and(
          eq(notificationTokens.userId, userId),
          eq(notificationTokens.token, token)
        ));

      // Insert the new token
      await db
        .insert(notificationTokens)
        .values({
          userId,
          token,
          platform,
          isActive: true,
        });

      console.log(`Registered token for user ${userId} on ${platform}`);
    } catch (error) {
      console.error('Error registering notification token:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences for a user
   */
  async updatePreferences(userId: string, preferences: any): Promise<void> {
    try {
      await db
        .insert(notificationPreferences)
        .values({
          userId,
          ...preferences,
        })
        .onConflictDoUpdate({
          target: notificationPreferences.userId,
          set: {
            ...preferences,
            updatedAt: new Date(),
          },
        });

      console.log(`Updated notification preferences for user ${userId}`);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Get notification preferences for a user
   */
  async getPreferences(userId: string): Promise<any> {
    try {
      const [preferences] = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId));

      return preferences || {
        caseLikes: true,
        caseComments: true,
        newFollowers: true,
        caseApprovals: true,
        mentions: true,
        weeklyDigest: false,
        pushNotifications: true,
        emailNotifications: false,
      };
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      throw error;
    }
  }

  /**
   * Get active tokens for a user
   */
  async getUserTokens(userId: string): Promise<string[]> {
    try {
      const tokens = await db
        .select({ token: notificationTokens.token })
        .from(notificationTokens)
        .where(and(
          eq(notificationTokens.userId, userId),
          eq(notificationTokens.isActive, true)
        ));

      return tokens.map(t => t.token).filter(token => Expo.isExpoPushToken(token));
    } catch (error) {
      console.error('Error fetching user tokens:', error);
      return [];
    }
  }

  /**
   * Send push notification to specific users
   */
  async sendNotification(
    userIds: string[],
    title: string,
    body: string,
    data: any = {},
    notificationType = 'general'
  ): Promise<ExpoPushTicket[]> {
    try {
      // Get active tokens for users who have push notifications enabled
      const tokensResult = await db
        .select({
          token: notificationTokens.token,
          userId: notificationTokens.userId,
        })
        .from(notificationTokens)
        .leftJoin(
          notificationPreferences,
          eq(notificationTokens.userId, notificationPreferences.userId)
        )
        .where(and(
          inArray(notificationTokens.userId, userIds),
          eq(notificationTokens.isActive, true)
          // For now, ignore notification preferences until they're properly set up
          // TODO: Add preference checking back once preferences are created for all users
        ));

      console.log(`🔍 Found ${tokensResult.length} token records for users:`, userIds);
      tokensResult.forEach(token => {
        console.log(`  - User ${token.userId}: ${token.token.slice(0, 20)}...`);
      });

      const validTokens = tokensResult
        .map(row => row.token)
        .filter(token => Expo.isExpoPushToken(token));

      console.log(`🎯 ${validTokens.length} valid Expo tokens out of ${tokensResult.length} records`);

      if (validTokens.length === 0) {
        console.log('No valid tokens found for notification');
        return [];
      }

      // Create push messages
      const messages: ExpoPushMessage[] = validTokens.map(token => ({
        to: token,
        sound: 'default',
        title,
        body,
        data: { ...data, type: notificationType },
      }));

      // Send notifications in chunks
      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending notification chunk:', error);
        }
      }

      // Create notification records in database
      for (const userId of userIds) {
        await this.createNotificationRecord(userId, notificationType, title, body, data);
      }

      console.log(`Sent ${tickets.length} notifications for type: ${notificationType}`);
      return tickets;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Create notification record in database
   */
  private async createNotificationRecord(
    userId: string,
    type: string,
    title: string,
    message: string,
    data: any
  ): Promise<void> {
    try {
      await db
        .insert(notificationsTable)
        .values({
          userId,
          type,
          title,
          message,
          isRead: false,
          relatedId: data.relatedId || null,
          fromUserId: data.fromUserId || null,
        });
    } catch (error) {
      console.error('Error creating notification record:', error);
    }
  }

  /**
   * Get preference condition for notification type
   */
  private getPreferenceCondition(notificationType: string) {
    switch (notificationType) {
      case 'case_like':
        return eq(notificationPreferences.caseLikes, true);
      case 'case_comment':
        return eq(notificationPreferences.caseComments, true);
      case 'new_follower':
        return eq(notificationPreferences.newFollowers, true);
      case 'case_approval':
        return eq(notificationPreferences.caseApprovals, true);
      case 'mention':
        return eq(notificationPreferences.mentions, true);
      case 'weekly_digest':
        return eq(notificationPreferences.weeklyDigest, true);
      default:
        return eq(notificationPreferences.pushNotifications, true);
    }
  }

  // Specific notification methods

  /**
   * Send case like notification
   */
  async sendCaseLikeNotification(caseOwnerId: string, likerName: string, caseTitle: string, caseId: number): Promise<void> {
    await this.sendNotification(
      [caseOwnerId],
      'Case Liked',
      `${likerName} liked your case "${caseTitle}"`,
      { caseId, relatedId: caseId },
      'case_like'
    );
  }

  /**
   * Send case comment notification
   */
  async sendCaseCommentNotification(caseOwnerId: string, commenterName: string, caseTitle: string, caseId: number): Promise<void> {
    console.log(`📩 sendCaseCommentNotification called:`);
    console.log(`  - Target user ID (case owner): ${caseOwnerId}`);
    console.log(`  - Commenter name: ${commenterName}`);
    console.log(`  - Case title: ${caseTitle}`);
    console.log(`  - Case ID: ${caseId}`);
    
    await this.sendNotification(
      [caseOwnerId],
      'New Comment',
      `${commenterName} commented on your case "${caseTitle}"`,
      { caseId, relatedId: caseId },
      'case_comment'
    );
  }

  /**
   * Send new follower notification
   */
  async sendNewFollowerNotification(followedUserId: string, followerName: string, followerId: string): Promise<void> {
    await this.sendNotification(
      [followedUserId],
      'New Follower',
      `${followerName} started following you`,
      { followerId, fromUserId: followerId },
      'new_follower'
    );
  }

  /**
   * Send case approval notification
   */
  async sendCaseApprovalNotification(authorId: string, caseTitle: string, caseId: number): Promise<void> {
    await this.sendNotification(
      [authorId],
      'Case Approved',
      `Your case "${caseTitle}" has been approved and is now visible to other users`,
      { caseId, relatedId: caseId },
      'case_approval'
    );
  }

  /**
   * Send mention notification
   */
  async sendMentionNotification(mentionedUserId: string, mentionerName: string, caseTitle: string, caseId: number): Promise<void> {
    await this.sendNotification(
      [mentionedUserId],
      'You were mentioned',
      `${mentionerName} mentioned you in "${caseTitle}"`,
      { caseId, relatedId: caseId },
      'mention'
    );
  }

  /**
   * Send comment agree notification
   */
  async sendCommentAgreeNotification(commentOwnerId: string, agreerName: string, commentPreview: string, commentId: number): Promise<void> {
    await this.sendNotification(
      [commentOwnerId],
      'Someone agreed with your comment',
      `${agreerName} agreed with your comment: "${commentPreview}"`,
      { commentId, relatedId: commentId },
      'comment_agree'
    );
  }
}

export const notificationService = new NotificationService();
