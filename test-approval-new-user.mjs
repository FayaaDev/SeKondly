import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5001';

async function testApprovalWithNewUser() {
  console.log('🧪 Testing approval with a new user...\n');
  
  try {
    // Create a new user with a unique email
    const uniqueEmail = `test${Date.now()}@example.com`;
    console.log('1. Creating new user with email:', uniqueEmail);
    
    const userResponse = await fetch(`${BASE_URL}/api/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        email: uniqueEmail,
        password: 'testpass123',
        boardCertification: 'Cardiology',
        level: 'Resident',
        yearsOfExperience: '3',
        workplace: 'Test Hospital'
      })
    });
    
    const userData = await userResponse.json();
    console.log('✅ User created:', userData.message);
    const userId = userData.user?.id;
    
    if (!userId) {
      console.error('❌ No user ID returned from registration');
      return;
    }
    
    console.log('📧 User ID:', userId);
    
    // Wait a moment for the user to be saved
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Now approve the user (this should trigger the approval email)
    console.log('\n2. Approving user (should trigger approval email)...');
    const approvalResponse = await fetch(`${BASE_URL}/api/admin/approve-user/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const approvalData = await approvalResponse.json();
    console.log('✅ User approved response:', approvalData);
    
    console.log('\n📧 Check the server logs for approval email status...');
    
  } catch (error) {
    console.error('❌ Error testing approval:', error);
  }
}

await testApprovalWithNewUser();
