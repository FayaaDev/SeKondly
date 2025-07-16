import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5001';

async function testDirectApprovalToFreeland() {
  console.log('🧪 Testing direct approval email to Freeland90@protonmail.ch...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/test-approval-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'Freeland90@protonmail.ch',
        firstName: 'Test',
        lastName: 'User'
      })
    });
    
    const result = await response.json();
    console.log('✅ Direct approval email test result:', result);
    
  } catch (error) {
    console.error('❌ Error testing direct approval email:', error);
  }
}

await testDirectApprovalToFreeland();
