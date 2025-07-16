import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5001';

// Cookie jar to store session cookies
let sessionCookies = '';

async function login() {
  console.log('🔐 Logging in as admin...');
  
  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'admin@example.com',
      password: 'admin123'
    })
  });
  
  // Extract cookies from response
  const cookies = loginResponse.headers.get('set-cookie');
  if (cookies) {
    sessionCookies = cookies.split(';')[0]; // Get the first cookie
  }
  
  const loginData = await loginResponse.json();
  console.log('✅ Login successful:', loginData.message);
  return loginData;
}

async function testApprovalWithAuth() {
  console.log('🧪 Testing approval with proper authentication...\n');
  
  try {
    // Step 1: Login first
    await login();
    
    // Step 2: Create a new user with a unique email
    const uniqueEmail = `test${Date.now()}@example.com`;
    console.log('📝 Creating new user with email:', uniqueEmail);
    
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
    
    console.log('👤 User ID:', userId);
    
    // Wait a moment for the user to be saved
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 3: Approve the user with authentication
    console.log('\n🎯 Approving user with authentication (should trigger approval email)...');
    const approvalResponse = await fetch(`${BASE_URL}/api/admin/approve-user/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookies // Include session cookies
      }
    });
    
    const approvalData = await approvalResponse.json();
    console.log('✅ User approved response:', approvalData);
    
    console.log('\n📧 Check the server logs for approval email status...');
    
  } catch (error) {
    console.error('❌ Error testing approval:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response text:', await error.response.text());
    }
  }
}

await testApprovalWithAuth();
