import 'dotenv/config';
import { db } from './server/db';
import { notifications, users } from './shared/schema';

/**
 * Debug script to check notification functionality
 */

async function debugNotifications() {
  console.log('🔍 Debugging Notification System...\n');

  try {
    // 1. Check if notifications table exists and has data
    console.log('1. Checking notifications table...');
    const allNotifications = await db.select().from(notifications).limit(10);
    console.log(`📊 Found ${allNotifications.length} notifications in database`);
    
    if (allNotifications.length > 0) {
      console.log('📋 Sample notifications:');
      allNotifications.forEach((notif, i) => {
        console.log(`  ${i + 1}. ${notif.title} - User: ${notif.userId} - Read: ${notif.isRead}`);
      });
    }
    console.log('');

    // 2. Check if there are any users in the system
    console.log('2. Checking users table...');
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      isApproved: users.isApproved
    }).from(users).limit(5);
    
    console.log(`👥 Found ${allUsers.length} users in database`);
    if (allUsers.length > 0) {
      console.log('👤 Sample users:');
      allUsers.forEach((user, i) => {
        console.log(`  ${i + 1}. ${user.email} - ${user.firstName} ${user.lastName} - Approved: ${user.isApproved}`);
      });
    }
    console.log('');

    // 3. Create a test notification
    console.log('3. Creating test notification...');
    if (allUsers.length > 0) {
      const testUser = allUsers[0];
      const [testNotification] = await db.insert(notifications).values({
        userId: testUser.id,
        type: 'test',
        title: 'Test Notification',
        message: 'This is a test notification created by the debug script',
        isRead: false,
      }).returning();
      
      console.log('✅ Test notification created:', testNotification);
    } else {
      console.log('❌ No users found to create test notification');
    }

  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
}

// Run the debug
debugNotifications().catch(console.error);
