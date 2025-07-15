// Test notifications via API instead of direct database connection
async function testNotificationsViaAPI() {
  try {
    console.log('🔍 Testing Notifications via API...\n');

    const baseUrl = 'http://192.168.0.205:5001';

    // Test 1: Check if server is running
    console.log('1. 🏥 Server Health Check:');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log(`   ✅ Server is healthy: ${health.status}`);
    } else {
      console.log(`   ❌ Server health check failed: ${healthResponse.status}`);
      return;
    }

    // Test 2: Try to get notifications without auth (should get 401)
    console.log('\n2. 🔔 Notifications Endpoint (No Auth):');
    const noAuthResponse = await fetch(`${baseUrl}/api/notifications`);
    console.log(`   Status: ${noAuthResponse.status} (${noAuthResponse.status === 401 ? 'Expected - needs auth' : 'Unexpected'})`);

    // Test 3: Try to get unread count without auth
    console.log('\n3. 📊 Unread Count Endpoint (No Auth):');
    const unreadResponse = await fetch(`${baseUrl}/api/notifications/unread-count`);
    console.log(`   Status: ${unreadResponse.status} (${unreadResponse.status === 401 ? 'Expected - needs auth' : 'Unexpected'})`);

    // Test 4: Check other endpoints that might indicate data exists
    console.log('\n4. 📋 Cases Endpoint (Check for activity):');
    const casesResponse = await fetch(`${baseUrl}/api/cases`);
    if (casesResponse.ok) {
      const cases = await casesResponse.json();
      console.log(`   ✅ Found ${cases.length} cases`);
      if (cases.length > 0) {
        console.log(`   📝 Latest case: "${cases[0].title}" by ${cases[0].authorId}`);
        console.log(`   👍 Likes: ${cases[0].likesCount || 0}, 💬 Comments: ${cases[0].commentsCount || 0}`);
      }
    } else {
      console.log(`   ❌ Cases request failed: ${casesResponse.status}`);
    }

    console.log('\n🎯 ANALYSIS:');
    console.log('The notification screen is empty because:');
    console.log('1. User needs to be authenticated to see notifications');
    console.log('2. Notifications are only created when there are interactions (likes, comments)');
    console.log('3. Users need to be approved to receive notifications');
    console.log('\n💡 NEXT STEPS:');
    console.log('1. Build and install the app with updated API configuration');
    console.log('2. Login with an approved user account');
    console.log('3. Create some test interactions (like cases, add comments)');
    console.log('4. Check if notifications appear for those interactions');

  } catch (error) {
    console.error('❌ API test failed:', error);
    console.log('\n💡 Make sure:');
    console.log('- Server is running on port 5001');
    console.log('- Your machine IP is accessible');
    console.log('- No firewall blocking the connection');
  }
}

testNotificationsViaAPI();
