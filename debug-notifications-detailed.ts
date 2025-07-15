import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import { desc, eq } from 'drizzle-orm';
import * as schema from './shared/schema.js';

// Setup database connection
const pool = new Pool({
  connectionString: 'postgresql://user:password@localhost:5432/rest-express'
});

const db = drizzle(pool, { schema });

async function debugNotificationsDetailed() {
  try {
    console.log('🔍 Detailed Notifications Debug Report\n');

    // 1. Check users and their approval status
    console.log('👥 USERS:');
    const users = await db.query.users.findMany({
      columns: { id: true, email: true, approvedAt: true, createdAt: true }
    });
    users.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user.id}) - ${user.approvedAt ? '✅ Approved' : '❌ Not approved'}`);
    });

    // 2. Check cases and interactions
    console.log('\n📋 CASES:');
    const cases = await db.query.cases.findMany({
      columns: { id: true, title: true, authorId: true, createdAt: true },
      orderBy: desc(schema.cases.createdAt),
      limit: 5
    });
    cases.forEach(caseItem => {
      console.log(`  - "${caseItem.title}" by user ${caseItem.authorId} (Case ID: ${caseItem.id})`);
    });

    // 3. Check comments (likes/interactions)
    console.log('\n💬 COMMENTS:');
    const comments = await db.query.caseComments.findMany({
      columns: { id: true, caseId: true, userId: true, content: true, createdAt: true },
      orderBy: desc(schema.caseComments.createdAt),
      limit: 5
    });
    comments.forEach(comment => {
      console.log(`  - Comment ${comment.id} on case ${comment.caseId} by user ${comment.userId}`);
      console.log(`    Content: "${comment.content.slice(0, 50)}..."`);
    });

    // 4. Check comment likes/agrees
    console.log('\n👍 COMMENT LIKES/AGREES:');
    const commentAgrees = await db.query.commentAgrees.findMany({
      columns: { id: true, commentId: true, userId: true, createdAt: true },
      orderBy: desc(schema.commentAgrees.createdAt),
      limit: 10
    });
    commentAgrees.forEach(agree => {
      console.log(`  - User ${agree.userId} agreed with comment ${agree.commentId}`);
    });

    // 5. Check case likes
    console.log('\n❤️ CASE LIKES:');
    const caseLikes = await db.query.caseLikes.findMany({
      columns: { id: true, caseId: true, userId: true, createdAt: true },
      orderBy: desc(schema.caseLikes.createdAt),
      limit: 10
    });
    caseLikes.forEach(like => {
      console.log(`  - User ${like.userId} liked case ${like.caseId}`);
    });

    // 6. Check notifications
    console.log('\n🔔 NOTIFICATIONS:');
    const notifications = await db.query.notifications.findMany({
      columns: { id: true, userId: true, type: true, title: true, message: true, createdAt: true },
      orderBy: desc(schema.notifications.createdAt),
      limit: 10
    });
    console.log(`Found ${notifications.length} notifications:`);
    notifications.forEach(notification => {
      console.log(`  - ${notification.type} for user ${notification.userId}: "${notification.title}"`);
      console.log(`    Message: "${notification.message}"`);
      console.log(`    Created: ${notification.createdAt}`);
    });

    // 7. Check notification tokens
    console.log('\n📱 NOTIFICATION TOKENS:');
    const tokens = await db.query.notificationTokens.findMany({
      columns: { id: true, userId: true, token: true, createdAt: true }
    });
    tokens.forEach(token => {
      console.log(`  - User ${token.userId} has token: ${token.token.slice(0, 20)}...`);
    });

    // 8. Analyze the gap - find interactions that should have created notifications
    console.log('\n🔍 ANALYSIS - Missing Notifications:');
    
    // Check if case likes should have created notifications
    for (const like of caseLikes) {
      const caseItem = cases.find(c => c.id === like.caseId);
      if (caseItem && caseItem.authorId !== like.userId) {
        const existingNotification = notifications.find(n => 
          n.type === 'case_like' && 
          n.userId === caseItem.authorId
        );
        if (!existingNotification) {
          console.log(`  ❌ Missing notification: Case "${caseItem.title}" liked by user ${like.userId}, but no notification sent to case owner ${caseItem.authorId}`);
        }
      }
    }

    // Check if comment agrees should have created notifications
    for (const agree of commentAgrees) {
      const comment = comments.find(c => c.id === agree.commentId);
      if (comment && comment.userId !== agree.userId) {
        const existingNotification = notifications.find(n => 
          n.type === 'comment_agree' && 
          n.userId === comment.userId
        );
        if (!existingNotification) {
          console.log(`  ❌ Missing notification: Comment ${agree.commentId} agreed by user ${agree.userId}, but no notification sent to comment owner ${comment.userId}`);
        }
      }
    }

    console.log('\n🎯 SUMMARY:');
    console.log(`- Users: ${users.length} (${users.filter(u => u.approvedAt).length} approved)`);
    console.log(`- Cases: ${cases.length}`);
    console.log(`- Comments: ${comments.length}`);
    console.log(`- Case Likes: ${caseLikes.length}`);
    console.log(`- Comment Agrees: ${commentAgrees.length}`);
    console.log(`- Notifications: ${notifications.length}`);
    console.log(`- Push Tokens: ${tokens.length}`);

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await pool.end();
  }
}

debugNotificationsDetailed();
