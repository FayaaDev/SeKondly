// Quick test to create some notifications via API
async function createTestInteractions() {
  const baseUrl = 'http://192.168.0.205:5001';
  
  console.log('🧪 Creating test interactions to trigger notifications...\n');

  try {
    // First, let's see what cases are available
    console.log('1. 📋 Checking available cases...');
    const casesResponse = await fetch(`${baseUrl}/api/cases`);
    
    if (casesResponse.ok) {
      const cases = await casesResponse.json();
      console.log(`   ✅ Found ${cases.length} cases`);
      
      if (cases.length > 0) {
        const firstCase = cases[0];
        console.log(`   📝 First case: "${firstCase.title}" by ${firstCase.authorId}`);
        console.log(`   👍 Current likes: ${firstCase.likesCount || 0}`);
        console.log(`   💬 Current comments: ${firstCase.commentsCount || 0}`);
        
        console.log('\n2. 🎯 To test notifications:');
        console.log('   a) Login to the mobile app with a DIFFERENT user than the case author');
        console.log(`   b) Like case ID ${firstCase.id} ("${firstCase.title}")`);
        console.log('   c) Add a comment to the case');
        console.log('   d) Check the notifications screen');
        
        console.log('\n3. 📱 Expected notifications:');
        console.log(`   - Case owner (${firstCase.authorId}) should receive notifications when others interact`);
        console.log('   - Notification types: "case_like", "case_comment"');
        
      } else {
        console.log('   ⚠️  No cases found - you may need to create some cases first');
      }
    } else {
      console.log(`   ❌ Cannot access cases: ${casesResponse.status}`);
      console.log('   💡 Make sure you have some cases in the database');
    }

    console.log('\n4. 🔧 Debug steps if notifications are still empty:');
    console.log('   a) Check the notification screen shows debug info (__DEV__ mode)');
    console.log('   b) Verify push registration status in the debug info');
    console.log('   c) Make sure you\'re logged in as an approved user');
    console.log('   d) Try refreshing the notifications screen (pull-to-refresh)');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n💡 Make sure:');
    console.log('- Backend server is running on port 5001');
    console.log('- Network connectivity is working');
  }
}

createTestInteractions();
