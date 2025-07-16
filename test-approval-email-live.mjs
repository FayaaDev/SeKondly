import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5001';

async function testApprovalEmail() {
  console.log('🧪 Testing approval email functionality...\n');
  
  try {
    // First, create a test user
    console.log('1. Creating test user...');
    const userResponse = await fetch(`${BASE_URL}/api/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'Doctor',
        email: 'Freeland90@protonmail.ch',
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
        'Cookie': 'sekondly.sid=s%3AmockSessionId.mock' // Mock session for admin
      }
    });
    
    const approvalData = await approvalResponse.json();
    console.log('✅ User approved:', approvalData.message || 'Success');
    
    console.log('\n📧 Check the server logs for approval email status...');
    
  } catch (error) {
    console.error('❌ Error testing approval email:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response text:', await error.response.text());
    }
  }
}

// Also test the direct email endpoint
async function testDirectApprovalEmail() {
  console.log('\n🧪 Testing direct approval email endpoint...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/test-approval-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'Freeland90@protonmail.ch',
        firstName: 'Test',
        lastName: 'Doctor'
      })
    });
    
    const result = await response.json();
    console.log('✅ Direct approval email test result:', result);
    
  } catch (error) {
    console.error('❌ Error testing direct approval email:', error);
  }
}

// Run both tests
console.log('🚀 Starting approval email tests...\n');
await testApprovalEmail();
await testDirectApprovalEmail();
console.log('\n✅ Tests completed!');
