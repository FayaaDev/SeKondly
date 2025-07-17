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

// Step 2: Create a new user with a real email
async function createRealTestUser() {
  console.log('\n👤 Step 2: Creating a new test user with real email...');
  
  const userData = {
    firstName: 'Test',
    lastName: 'Rejection',
    email: 'amd.fayaa@gmail.com', // Real email for testing
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
      console.log('📧 Email:', userData.email);
      console.log('👤 User ID:', data.user?.id);
      console.log('📝 User should receive welcome email');
      return {
        userId: data.user?.id,
        email: userData.email,
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

// Step 3: Reject the user with a detailed reason
async function rejectUserWithReason(userId, reason) {
  console.log('\n🚫 Step 3: Rejecting user with detailed reason...');
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
    
    console.log('📊 Full response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ User rejected successfully');
      console.log('📧 Rejection email sent:', data.rejectionEmailSent ? 'YES' : 'NO');
      if (data.user) {
        console.log('👤 Rejected user info:');
        console.log('   - ID:', data.user.id);
        console.log('   - Email:', data.user.email);
        console.log('   - Name:', data.user.firstName, data.user.lastName);
      }
      return data;
    }
    
    console.log('❌ User rejection failed:', data);
    return null;
  } catch (error) {
    console.error('❌ Error rejecting user:', error);
    return null;
  }
}

// Main test function
async function testRealEmailRejection() {
  console.log('🧪 Testing Real Email Rejection Flow');
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Login as admin
    const loginSuccess = await loginAsAdmin();
    if (!loginSuccess) {
      console.log('❌ Cannot proceed without admin login');
      return;
    }
    
    // Step 2: Create test user with real email
    const newUser = await createRealTestUser();
    if (!newUser) {
      console.log('❌ Cannot proceed without creating test user');
      return;
    }
    
    // Wait a moment for user to be saved
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Reject user with detailed reason
    const rejectionReason = `Dear applicant,

After careful review of your application, we regret to inform you that we cannot approve your SeKondly account at this time due to the following issues:

1. Medical License Verification: The medical license number provided could not be verified in our database. Please ensure the license number is correct and currently active.

2. Document Quality: The uploaded credential documents are not clear enough for proper verification. Please ensure all text is legible and the document is in high resolution.

3. Specialty Verification: Your listed specialty requires additional verification that was not provided in your application.

If you believe this decision was made in error or if you have additional documentation to provide, please contact our support team through the SeKondly website.

Thank you for your understanding.`;
    
    const rejectionResult = await rejectUserWithReason(newUser.userId, rejectionReason);
    if (!rejectionResult) {
      console.log('❌ User rejection failed');
      return;
    }
    
    // Final summary
    console.log('\n' + '=' .repeat(50));
    console.log('🎯 REAL EMAIL REJECTION TEST RESULTS');
    console.log('=' .repeat(50));
    console.log('✅ Admin login: SUCCESS');
    console.log('✅ User creation: SUCCESS');
    console.log('✅ User rejection: SUCCESS');
    console.log('📧 Rejection email sent:', rejectionResult.rejectionEmailSent ? 'YES' : 'NO');
    
    console.log('\n📧 EMAIL VERIFICATION INSTRUCTIONS:');
    console.log('1. Check amd.fayaa@gmail.com inbox');
    console.log('2. Look for email with subject: "SeKondly Account Application Status"');
    console.log('3. Verify email contains:');
    console.log('   - Professional SeKondly branding');
    console.log('   - Personalized greeting: "Dear Dr. Test Rejection"');
    console.log('   - Clear rejection message');
    console.log('   - Detailed rejection reason');
    console.log('   - Contact support information');
    console.log('4. Email should be well-formatted with HTML styling');
    
    console.log('\n🔧 DEBUG INFORMATION:');
    console.log('- User ID:', newUser.userId);
    console.log('- Email:', newUser.email);
    console.log('- Check server logs for email sending details');
    
  } catch (error) {
    console.error('❌ Error during real email rejection test:', error);
  }
}

// Run the test
testRealEmailRejection();
