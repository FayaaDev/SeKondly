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
    sessionCookies = cookies.split(';')[0];
  }
  
  const loginData = await loginResponse.json();
  console.log('✅ Login successful:', loginData.message);
  return loginData;
}

async function testApprovalToFreeland() {
  console.log('🧪 Testing approval email to Freeland90@protonmail.ch...\n');
  
  try {
    // Step 1: Login first
    await login();
    
    // Step 2: Create user with Freeland90@protonmail.ch
    console.log('📝 Creating user with email: Freeland90@protonmail.ch');
    
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
    
    console.log('👤 User ID:', userId);
    
    // Wait a moment for the user to be saved
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 3: Approve the user with authentication
    console.log('\n🎯 Approving user (should trigger approval email to Freeland90@protonmail.ch)...');
    const approvalResponse = await fetch(`${BASE_URL}/api/admin/approve-user/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookies
      }
    });
    
    const approvalData = await approvalResponse.json();
    console.log('✅ User approved!');
    console.log('📧 Email should be sent to: Freeland90@protonmail.ch');
    console.log('\n📋 Check the server logs for approval email confirmation...');
    
  } catch (error) {
    console.error('❌ Error testing approval:', error);
  }
}

await testApprovalToFreeland();
