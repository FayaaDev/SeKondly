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

async function findExistingFreelandUser() {
  console.log('🧪 Finding existing Freeland user and approving...\n');
  
  try {
    // Step 1: Login first
    await login();
    
    // Step 2: Get pending users to find the Freeland user
    console.log('📋 Fetching pending users...');
    const pendingResponse = await fetch(`${BASE_URL}/api/admin/pending-users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookies
      }
    });
    
    const pendingUsers = await pendingResponse.json();
    console.log('📊 Found', pendingUsers.length, 'pending users');
    
    // Find the Freeland user
    const freelandUser = pendingUsers.find(user => user.email === 'Freeland90@protonmail.ch');
    
    if (!freelandUser) {
      console.log('❌ No pending user found with email: Freeland90@protonmail.ch');
      console.log('📋 Pending users:', pendingUsers.map(u => u.email));
      return;
    }
    
    console.log('✅ Found Freeland user:', freelandUser.id);
    
    // Step 3: Approve the user
    console.log('\n🎯 Approving Freeland user (should trigger approval email)...');
    const approvalResponse = await fetch(`${BASE_URL}/api/admin/approve-user/${freelandUser.id}`, {
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

await findExistingFreelandUser();
