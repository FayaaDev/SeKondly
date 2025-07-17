import 'dotenv/config';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5001';

async function testRejectEndpointDirectly() {
  console.log('🧪 Testing reject endpoint directly...\n');
  
  // First, let's create a user
  console.log('1. Creating test user...');
  const userData = {
    firstName: 'Direct',
    lastName: 'Test',
    email: 'admin@sekondly.app', // Using verified email
    password: 'testpassword123',
    boardCertification: 'Internal Medicine',
    level: 'Resident',
    yearsOfExperience: '3',
    workplace: 'Test Hospital',
    specialty: 'Internal Medicine'
  };
  
  const createResponse = await fetch(`${BASE_URL}/api/onboarding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData)
  });
  
  const createData = await createResponse.json();
  console.log('User creation response:', createData);
  
  if (!createResponse.ok) {
    console.log('❌ Failed to create user');
    return;
  }
  
  const userId = createData.user?.id;
  console.log('✅ User created with ID:', userId);
  
  // Now login as admin
  console.log('\n2. Logging in as admin...');
  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'sekondly.app@gmail.com',
      password: 'AdminSeKondly2024!'
    })
  });
  
  const loginData = await loginResponse.json();
  if (!loginResponse.ok) {
    console.log('❌ Admin login failed:', loginData);
    return;
  }
  
  const sessionCookie = loginResponse.headers.get('set-cookie')?.split(';')[0];
  console.log('✅ Admin login successful');
  
  // Now reject the user
  console.log('\n3. Rejecting user directly...');
  const rejectResponse = await fetch(`${BASE_URL}/api/admin/reject-user/${userId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie || ''
    },
    body: JSON.stringify({ 
      reason: 'Test rejection for direct endpoint verification. This is a test of the email functionality.' 
    })
  });
  
  const rejectData = await rejectResponse.json();
  console.log('✅ Rejection response status:', rejectResponse.status);
  console.log('📊 Full rejection response:', JSON.stringify(rejectData, null, 2));
  
  if (rejectResponse.ok) {
    console.log('\n✅ Success! Email should have been sent to admin@sekondly.app');
    console.log('📧 Check the email for rejection notification');
  } else {
    console.log('\n❌ Rejection failed:', rejectData);
  }
}

testRejectEndpointDirectly();
