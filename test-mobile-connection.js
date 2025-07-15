// Simple test to check if mobile app can reach the server
async function testMobileAppConnection() {
  try {
    console.log('🔍 Testing mobile app connection to server...\n');

    // Test health endpoint first
    const healthResponse = await fetch('http://192.168.0.205:5001/api/health');
    console.log(`🏥 Health check: ${healthResponse.status}`);
    
    if (healthResponse.ok) {
      const health = await healthResponse.text();
      console.log(`✅ Server is healthy: ${health}`);
    }

    // Test if we can reach the notifications endpoint (should get 401 without auth)
    const notificationsResponse = await fetch('http://192.168.0.205:5001/api/notifications');
    console.log(`📱 Notifications endpoint: ${notificationsResponse.status}`);
    
    if (notificationsResponse.status === 401) {
      console.log('✅ Notifications endpoint is reachable (401 expected without auth)');
    } else if (notificationsResponse.status === 404) {
      console.log('❌ Notifications endpoint not found - route may not be set up');
    } else {
      console.log(`⚠️  Unexpected response: ${notificationsResponse.status}`);
    }

    // Test unread count endpoint
    const unreadResponse = await fetch('http://192.168.0.205:5001/api/notifications/unread-count');
    console.log(`🔔 Unread count endpoint: ${unreadResponse.status}`);

    console.log('\n🎯 Summary:');
    console.log('- Mobile app should now be able to connect to the local server');
    console.log('- The empty notification screen was likely due to API pointing to production');
    console.log('- After rebuilding the app, notifications should appear for logged-in users');

  } catch (error) {
    console.error('❌ Connection test failed:', error);
    console.log('\n💡 Make sure:');
    console.log('1. Server is running on port 5001');
    console.log('2. Your mobile device/simulator is on the same network');
    console.log('3. IP address 192.168.0.205 is correct for your machine');
  }
}

testMobileAppConnection();
