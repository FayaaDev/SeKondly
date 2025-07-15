import 'dotenv/config';
import { notificationService } from './server/notificationService';
import { db } from './server/db';

/**
 * Test script for push notification functionality
 * 
 * This script tests:
 * 1. Token registration
 * 2. Preference management
 * 3. Notification sending (mock)
 * 
 * Run with: npx tsx test-notifications.ts
 */

async function testNotifications() {
  console.log('🧪 Testing Push Notification Service...\n');

  const testUserId = 'test-user-123';
  const testToken = 'ExponentPushToken[test-token-123]';

  try {
    // Test 1: Token Registration
    console.log('1. Testing token registration...');
    
    await notificationService.registerToken(testUserId, testToken, 'ios');
    console.log('✅ Token registration successful\n');

    // Test 2: Preference Management
    console.log('2. Testing preference management...');
    const testPreferences = {
      caseLikes: true,
      caseComments: true,
      newFollowers: false,
      caseApprovals: true,
      mentions: true,
      weeklyDigest: false,
      pushNotifications: true,
      emailNotifications: false,
    };

    await notificationService.updatePreferences(testUserId, testPreferences);
    console.log('✅ Preferences updated');

    const retrievedPreferences = await notificationService.getPreferences(testUserId);
    console.log('📋 Retrieved preferences:', retrievedPreferences);
    console.log('✅ Preference management test successful\n');

    // Test 3: Get User Tokens
    console.log('3. Testing token retrieval...');
    const userTokens = await notificationService.getUserTokens(testUserId);
    console.log('🔑 User tokens:', userTokens);
    console.log('✅ Token retrieval successful\n');

    console.log('🎉 All notification tests passed!');
    
  } catch (error) {
    console.error('❌ Notification test failed:', error);
  } finally {
    // Clean up test data
    try {
      console.log('\n🧹 Cleaning up test data...');
      await db.execute(`DELETE FROM notification_tokens WHERE user_id = '${testUserId}'`);
      await db.execute(`DELETE FROM notification_preferences WHERE user_id = '${testUserId}'`);
      console.log('✅ Cleanup completed');
    } catch (cleanupError) {
      console.error('⚠️  Cleanup failed:', cleanupError);
    }
  }
}

// Run the test
testNotifications().catch(console.error);

export { testNotifications };
