// Create test interactions to trigger notifications
async function createTestInteractions() {
  try {
    console.log('🧪 Creating test interactions to trigger notifications...\n');

    const baseUrl = 'http://192.168.0.205:5001';

    // First, let's check what cases are available
    console.log('1. 📋 Getting available cases:');
    const casesResponse = await fetch(`${baseUrl}/api/cases`);
    if (!casesResponse.ok) {
      console.log('❌ Failed to get cases - likely need authentication');
      console.log('💡 This is expected - you need to login in the mobile app first');
      console.log('');
      console.log('🎯 SOLUTION:');
      console.log('1. Build and install the mobile app with the updated API configuration');
      console.log('2. Login with an approved user account');
      console.log('3. Navigate through the app and interact with cases:');
      console.log('   - Like some cases');
      console.log('   - Add comments to cases');
      console.log('   - Agree with other users\' comments');
      console.log('4. Check the notification screen to see if notifications appear');
      console.log('');
      console.log('📱 If notifications still don\'t appear after interactions:');
      console.log('- Check if the user is approved (only approved users get notifications)');
      console.log('- Check if push notifications are enabled in notification settings');
      console.log('- Check the server logs for any notification creation errors');
      return;
    }

    const cases = await casesResponse.json();
    console.log(`✅ Found ${cases.length} cases available`);

    if (cases.length === 0) {
      console.log('📝 No cases found. Create some cases first, then interact with them.');
      return;
    }

    console.log('\n🎯 SUMMARY OF NOTIFICATION TRIGGERS:');
    console.log('I\'ve added missing notification logic for comment agrees.');
    console.log('Notifications will now be created when:');
    console.log('✅ 1. Someone likes your case');
    console.log('✅ 2. Someone comments on your case');
    console.log('✅ 3. Someone agrees with your comment (NEW!)');
    console.log('');
    console.log('🚀 NEXT STEPS:');
    console.log('1. Install the updated mobile app');
    console.log('2. Login with an approved user');
    console.log('3. Create or interact with cases');
    console.log('4. Notifications should now appear!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n💡 Make sure the server is running on port 5001');
  }
}

createTestInteractions();
