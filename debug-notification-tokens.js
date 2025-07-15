// Debug notification tokens and database state
console.log('🔧 Debugging notification creation...\n');

async function debugNotificationIssue() {
  try {
    const baseUrl = 'http://192.168.0.205:5001';
    
    console.log('Testing with a simple curl command to see what happens...');
    
    // We can't make authenticated requests from here, but let's at least check if the server is responsive
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    
    if (healthResponse.ok) {
      console.log('✅ Server is responsive');
      
      console.log('\n🔍 ISSUES IDENTIFIED FROM LOGS:');
      console.log('1. "No valid tokens found for notification" - This is the key issue');
      console.log('2. The notification service can\'t find push tokens for target users');
      console.log('3. Tokens are being registered successfully for current user');
      console.log('4. But tokens may not be found when looking up OTHER users');
      
      console.log('\n💡 LIKELY CAUSES:');
      console.log('1. Token lookup query might be incorrect');
      console.log('2. Tokens might be stored with wrong user IDs');
      console.log('3. Tokens might be marked as inactive');
      console.log('4. Database query might be using wrong table/column names');
      
      console.log('\n🛠️ SOLUTION:');
      console.log('I need to add debug logging to the notification service');
      console.log('to see exactly what\'s happening in the token lookup.');
      
    } else {
      console.log('❌ Server not responsive');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugNotificationIssue();
