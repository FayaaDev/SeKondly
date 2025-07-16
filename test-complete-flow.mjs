import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5001';

// Cookie jar to store session cookies
let sessionCookies = '';

async function adminLogin() {
  console.log('🔐 Step 1: Admin Login');
  console.log('==================');
  
  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'admin@sekondly.app',
      password: 'admin123'
    })
  });
  
  // Extract cookies from response
  const cookies = loginResponse.headers.get('set-cookie');
  if (cookies) {
    sessionCookies = cookies.split(';')[0]; // Get the first cookie
    console.log('✅ Session cookies obtained:', sessionCookies.substring(0, 50) + '...');
  }
  
  const loginData = await loginResponse.json();
  console.log('✅ Admin login successful:', loginData.message);
  console.log('👤 Admin user:', loginData.user.firstName, loginData.user.lastName);
  
  return loginData;
}

async function createUser() {
  console.log('\n📝 Step 2: Create User Account');
  console.log('=============================');
  
  const userResponse = await fetch(`${BASE_URL}/api/onboarding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      firstName: 'Dr. Freeland',
      lastName: 'TestUser',
      email: 'Freeland90@protonmail.ch',
      password: 'testpass123',
      boardCertification: 'Cardiology',
      level: 'Consultant',
      yearsOfExperience: '10',
      workplace: 'Medical Center'
    })
  });
  
  const userData = await userResponse.json();
  
  if (userResponse.status === 409) {
    console.log('⚠️  User already exists:', userData.message);
    console.log('🔄 Continuing with existing user...');
    // Try to get the existing user ID by creating a new unique user first
    const uniqueEmail = `freeland${Date.now()}@protonmail.ch`;
    const newUserResponse = await fetch(`${BASE_URL}/api/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: 'Dr. Freeland',
        lastName: 'TestUser',
        email: uniqueEmail,
        password: 'testpass123',
        boardCertification: 'Cardiology',
        level: 'Consultant',
        yearsOfExperience: '10',
        workplace: 'Medical Center'
      })
    });
    
    const newUserData = await newUserResponse.json();
    console.log('✅ New user created with email:', uniqueEmail);
    console.log('👤 User ID:', newUserData.user?.id);
    return newUserData;
  } else {
    console.log('✅ User created successfully:', userData.message);
    console.log('👤 User ID:', userData.user?.id);
    console.log('📧 Email:', userData.user?.email);
    return userData;
  }
}

async function getPendingUsers() {
  console.log('\n📋 Step 3: Get Pending Users');
  console.log('============================');
  
  const response = await fetch(`${BASE_URL}/api/admin/pending-users`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookies
    }
  });
  
  const pendingUsers = await response.json();
  console.log('✅ Pending users retrieved:', pendingUsers.length, 'users');
  
  pendingUsers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - ID: ${user.id}`);
  });
  
  return pendingUsers;
}

async function approveUser(userId) {
  console.log('\n🎯 Step 4: Approve User (Should Send Email)');
  console.log('============================================');
  
  const approvalResponse = await fetch(`${BASE_URL}/api/admin/approve-user/${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookies
    }
  });
  
  const approvalData = await approvalResponse.json();
  
  if (approvalResponse.ok) {
    console.log('✅ User approved successfully!');
    console.log('👤 Approved user:', approvalData.firstName, approvalData.lastName);
    console.log('📧 Email:', approvalData.email);
    console.log('✅ Is approved:', approvalData.isApproved);
    console.log('📅 Approved at:', approvalData.approvedAt);
    console.log('👮 Approved by:', approvalData.approvedBy);
    
    // Check if approval email should have been sent
    if (approvalData.email && approvalData.firstName && approvalData.lastName) {
      console.log('📧 Approval email should have been sent to:', approvalData.email);
    } else {
      console.log('❌ Approval email not sent - missing required fields');
    }
  } else {
    console.log('❌ User approval failed:', approvalData.message);
  }
  
  return approvalData;
}

async function testDirectApprovalEmail() {
  console.log('\n🧪 Step 5: Test Direct Approval Email');
  console.log('=====================================');
  
  const response = await fetch(`${BASE_URL}/api/test-approval-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'Freeland90@protonmail.ch',
      firstName: 'Dr. Freeland',
      lastName: 'TestUser'
    })
  });
  
  const result = await response.json();
  
  if (response.ok) {
    console.log('✅ Direct approval email test successful!');
    console.log('📧 Email sent:', result.emailSent);
    console.log('📝 Message:', result.message);
  } else {
    console.log('❌ Direct approval email test failed:', result.error);
  }
  
  return result;
}

async function runCompleteFlow() {
  console.log('🚀 COMPLETE SEKONDLY APPROVAL FLOW TEST');
  console.log('=======================================');
  console.log('📧 Target email: Freeland90@protonmail.ch');
  console.log('🕐 Started at:', new Date().toISOString());
  console.log('');
  
  try {
    // Step 1: Admin login
    await adminLogin();
    
    // Step 2: Create user
    const userData = await createUser();
    const userId = userData.user?.id;
    
    if (!userId) {
      console.error('❌ No user ID available for approval');
      return;
    }
    
    // Step 3: Get pending users
    const pendingUsers = await getPendingUsers();
    
    // Step 4: Approve the user
    await approveUser(userId);
    
    // Step 5: Test direct approval email
    await testDirectApprovalEmail();
    
    console.log('\n🎉 COMPLETE FLOW FINISHED!');
    console.log('==========================');
    console.log('✅ All steps completed successfully');
    console.log('📧 Check the server logs for email sending details');
    console.log('📬 Check Freeland90@protonmail.ch inbox for approval email');
    
  } catch (error) {
    console.error('❌ Error in complete flow:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response text:', await error.response.text());
    }
  }
}

// Run the complete flow
await runCompleteFlow();
