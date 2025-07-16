import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5001';

async function testApprovalFlow() {
  console.log('🧪 Testing approval email flow...\n');
  
  try {
    // Step 1: Create a new user
    console.log('Step 1: Creating a new user...');
    const registrationData = {
      firstName: 'Test',
      lastName: 'Doctor',
      email: `test.doctor.${Date.now()}@gmail.com`,
      password: 'testpassword123',
      boardCertification: 'Internal Medicine',
      level: 'Resident',
      yearsOfExperience: '2',
      workplace: 'Test Hospital'
    };
    
    const registerResponse = await fetch(`${BASE_URL}/api/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationData)
    });
    
    const registerResult = await registerResponse.json();
    console.log('Registration response:', registerResult);
    
    if (!registerResponse.ok) {
      console.error('❌ Registration failed:', registerResult);
      return;
    }
    
    const newUserId = registerResult.user.id;
    console.log('✅ User created successfully:', newUserId);
    
    // Step 2: Login as admin
    console.log('\nStep 2: Logging in as admin...');
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
    
    const loginResult = await loginResponse.json();
    console.log('Login response:', loginResult);
    
    if (!loginResponse.ok) {
      console.error('❌ Admin login failed:', loginResult);
      return;
    }
    
    // Extract session cookie
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✅ Admin logged in successfully');
    
    // Step 3: Get pending users
    console.log('\nStep 3: Getting pending users...');
    const pendingResponse = await fetch(`${BASE_URL}/api/admin/pending-users`, {
      headers: {
        'Cookie': cookies || ''
      }
    });
    
    const pendingUsers = await pendingResponse.json();
    console.log('Pending users:', pendingUsers);
    
    if (!pendingResponse.ok) {
      console.error('❌ Failed to get pending users:', pendingUsers);
      return;
    }
    
    // Step 4: Approve the user
    console.log('\nStep 4: Approving the user...');
    const approveResponse = await fetch(`${BASE_URL}/api/admin/approve-user/${newUserId}`, {
      method: 'POST',
      headers: {
        'Cookie': cookies || '',
        'Content-Type': 'application/json'
      }
    });
    
    const approveResult = await approveResponse.json();
    console.log('Approval response:', approveResult);
    
    if (!approveResponse.ok) {
      console.error('❌ User approval failed:', approveResult);
      return;
    }
    
    console.log('✅ User approved successfully!');
    console.log('🎉 Test completed! Check server logs for approval email status.');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testApprovalFlow();
