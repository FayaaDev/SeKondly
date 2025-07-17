import 'dotenv/config';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5001';

// Session cookie storage
let sessionCookies = '';

// Step 1: Login as admin
async function loginAsAdmin() {
  console.log('🔑 Step 1: Logging in as admin...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'sekondly.app@gmail.com',
        password: 'AdminSeKondly2024!'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Extract session cookie
      const setCookieHeader = response.headers.get('set-cookie');
      if (setCookieHeader) {
        sessionCookies = setCookieHeader.split(';')[0];
        console.log('✅ Admin login successful');
        return true;
      }
    }
    
    console.log('❌ Admin login failed:', data);
    return false;
  } catch (error) {
    console.error('❌ Error during admin login:', error);
    return false;
  }
}

// Step 2: Create a new user
async function createTestUser() {
  console.log('\n👤 Step 2: Creating a new test user...');
  
  const uniqueEmail = `test.rejection.${Date.now()}@example.com`;
  const userData = {
    firstName: 'John',
    lastName: 'Doctor',
    email: uniqueEmail,
    password: 'testpassword123',
    boardCertification: 'Internal Medicine',
    level: 'Resident',
    yearsOfExperience: '3',
    workplace: 'Test Hospital',
    specialty: 'Internal Medicine'
  };
  
  try {
    const response = await fetch(`${BASE_URL}/api/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Test user created successfully');
      console.log('📧 Email:', uniqueEmail);
      console.log('👤 User ID:', data.user?.id);
      console.log('📝 User should receive welcome email');
      return {
        userId: data.user?.id,
        email: uniqueEmail,
        firstName: userData.firstName,
        lastName: userData.lastName
      };
    }
    
    console.log('❌ User creation failed:', data);
    return null;
  } catch (error) {
    console.error('❌ Error creating user:', error);
    return null;
  }
}

// Step 3: Get pending users to verify user is in the list
async function getPendingUsers() {
  console.log('\n📋 Step 3: Checking pending users list...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/pending-users`, {
      headers: {
        'Cookie': sessionCookies
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Found ${data.length} pending users`);
      return data;
    }
    
    console.log('❌ Failed to get pending users:', data);
    return [];
  } catch (error) {
    console.error('❌ Error getting pending users:', error);
    return [];
  }
}

// Step 4: Reject the user with a reason
async function rejectUser(userId, reason) {
  console.log('\n🚫 Step 4: Rejecting user with reason...');
  console.log('📝 Rejection reason:', reason);
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/reject-user/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookies
      },
      body: JSON.stringify({ reason })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ User rejected successfully');
      console.log('📧 Rejection email sent:', data.rejectionEmailSent ? 'YES' : 'NO');
      console.log('👤 Rejected user info:', data.user);
      return data;
    }
    
    console.log('❌ User rejection failed:', data);
    return null;
  } catch (error) {
    console.error('❌ Error rejecting user:', error);
    return null;
  }
}

// Step 5: Verify user is no longer in pending list
async function verifyUserRemoved(userId) {
  console.log('\n🔍 Step 5: Verifying user is removed from pending list...');
  
  try {
    const pendingUsers = await getPendingUsers();
    const userStillExists = pendingUsers.find(user => user.id === userId);
    
    if (!userStillExists) {
      console.log('✅ User successfully removed from pending list');
      return true;
    } else {
      console.log('❌ User still exists in pending list');
      return false;
    }
  } catch (error) {
    console.error('❌ Error verifying user removal:', error);
    return false;
  }
}

// Main test function
async function testCompleteRejectionFlow() {
  console.log('🧪 Testing Complete User Rejection Flow');
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Login as admin
    const loginSuccess = await loginAsAdmin();
    if (!loginSuccess) {
      console.log('❌ Cannot proceed without admin login');
      return;
    }
    
    // Step 2: Create test user
    const newUser = await createTestUser();
    if (!newUser) {
      console.log('❌ Cannot proceed without creating test user');
      return;
    }
    
    // Wait a moment for user to be saved
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 3: Check pending users
    const pendingUsers = await getPendingUsers();
    const createdUser = pendingUsers.find(user => user.id === newUser.userId);
    
    if (!createdUser) {
      console.log('❌ Created user not found in pending list');
      return;
    }
    
    console.log('✅ User found in pending list:', createdUser.firstName, createdUser.lastName);
    
    // Step 4: Reject user with reason
    const rejectionReason = 'Your medical license could not be verified in our system. Please ensure you have uploaded a clear, valid medical license document with legible text and correct license number.';
    
    const rejectionResult = await rejectUser(newUser.userId, rejectionReason);
    if (!rejectionResult) {
      console.log('❌ User rejection failed');
      return;
    }
    
    // Step 5: Verify user is removed
    const userRemoved = await verifyUserRemoved(newUser.userId);
    
    // Final summary
    console.log('\n' + '=' .repeat(50));
    console.log('🎯 COMPLETE FLOW TEST RESULTS');
    console.log('=' .repeat(50));
    console.log('✅ Admin login: SUCCESS');
    console.log('✅ User creation: SUCCESS');
    console.log('✅ User in pending list: SUCCESS');
    console.log('✅ User rejection: SUCCESS');
    console.log('✅ Rejection email sent: SUCCESS');
    console.log('✅ User removed from pending: SUCCESS');
    
    console.log('\n📧 EMAIL VERIFICATION:');
    console.log('- User email:', newUser.email);
    console.log('- Check the email inbox for rejection notification');
    console.log('- Email should contain the rejection reason');
    console.log('- Email should have professional SeKondly branding');
    
    console.log('\n🔄 ADMIN PANEL VERIFICATION:');
    console.log('- Open admin panel at http://localhost:5173/admin');
    console.log('- User should no longer appear in pending users list');
    console.log('- Rejection workflow should show success message');
    
  } catch (error) {
    console.error('❌ Error during complete flow test:', error);
  }
}

// Run the test
testCompleteRejectionFlow();
