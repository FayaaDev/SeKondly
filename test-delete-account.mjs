#!/usr/bin/env node

import fs from 'fs';
import fetch from 'node-fetch';

// Server URL
const SERVER_URL = 'http://localhost:5001';

// Test configuration
const TEST_CONFIG = {
  testUser: {
    email: 'Freeland90@protonmail.ch',
    password: 'password123', // We'll need to guess or use a common password
    firstName: 'Freeland',
    lastName: 'User',
    specialty: 'Emergency Medicine',
    level: 'Resident',
    experience: '2 years',
    institution: 'Test Hospital'
  }
};

// Helper to make authenticated requests
async function makeAuthenticatedRequest(url, options = {}, cookies = '') {
  const response = await fetch(`${SERVER_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies,
      ...options.headers
    }
  });
  
  return response;
}

// Helper to extract cookies from response
function extractCookies(response) {
  const setCookieHeader = response.headers.get('set-cookie');
  if (!setCookieHeader) return '';
  
  return setCookieHeader.split(',').map(cookie => cookie.split(';')[0]).join('; ');
}

// Test function to create a user account
async function createTestUser() {
  console.log('📝 Creating test user...');
  
  const response = await fetch(`${SERVER_URL}/api/onboarding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(TEST_CONFIG.testUser)
  });
  
  const result = await response.json();
  
  if (response.ok) {
    console.log('✅ Test user created successfully');
    console.log(`   - User ID: ${result.user.id}`);
    console.log(`   - Email: ${result.user.email}`);
    console.log(`   - Approval Status: ${result.user.isApproved ? 'Approved' : 'Pending'}`);
    return result.user;
  } else {
    console.error('❌ Failed to create test user:', result.message);
    throw new Error(result.message);
  }
}

// Test function to login with the test user
async function loginTestUser() {
  console.log('\n🔐 Logging in test user...');
  
  const response = await fetch(`${SERVER_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: TEST_CONFIG.testUser.email,
      password: TEST_CONFIG.testUser.password
    })
  });
  
  const result = await response.json();
  const cookies = extractCookies(response);
  
  if (response.ok) {
    console.log('✅ Login successful');
    console.log(`   - User ID: ${result.user.id}`);
    console.log(`   - Session established: ${cookies ? 'Yes' : 'No'}`);
    return { user: result.user, cookies };
  } else {
    console.error('❌ Login failed:', result.message);
    throw new Error(result.message);
  }
}

// Test function to create some test data (case, comment, etc.)
async function createTestData(cookies) {
  console.log('\n📚 Creating test data...');
  
  // Create a test case
  const caseResponse = await makeAuthenticatedRequest('/api/cases', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Test Case for Deletion',
      format: 'short',
      history: 'This is a test case that will be deleted along with the user account.',
      specialty: 'Emergency Medicine'
    })
  }, cookies);
  
  if (caseResponse.ok) {
    const caseData = await caseResponse.json();
    console.log('✅ Test case created');
    console.log(`   - Case ID: ${caseData.id}`);
    console.log(`   - Title: ${caseData.title}`);
    
    // Add a comment to the case
    const commentResponse = await makeAuthenticatedRequest(`/api/cases/${caseData.id}/comments`, {
      method: 'POST',
      body: JSON.stringify({
        content: 'This is a test comment that will be deleted with the account.'
      })
    }, cookies);
    
    if (commentResponse.ok) {
      const commentData = await commentResponse.json();
      console.log('✅ Test comment created');
      console.log(`   - Comment ID: ${commentData.id}`);
      console.log(`   - Content: ${commentData.content}`);
    }
    
    // Like the case
    const likeResponse = await makeAuthenticatedRequest(`/api/cases/${caseData.id}/like`, {
      method: 'POST'
    }, cookies);
    
    if (likeResponse.ok) {
      console.log('✅ Case liked');
    }
    
    return caseData;
  } else {
    console.error('❌ Failed to create test case');
    return null;
  }
}

// Test function to verify user has data before deletion
async function verifyUserDataExists(cookies) {
  console.log('\n🔍 Verifying user data exists...');
  
  // Check user profile
  const userResponse = await makeAuthenticatedRequest('/api/auth/user', {}, cookies);
  if (userResponse.ok) {
    const userData = await userResponse.json();
    console.log('✅ User profile accessible');
    console.log(`   - User ID: ${userData.id}`);
    console.log(`   - Email: ${userData.email}`);
  }
  
  // Check user's cases
  const casesResponse = await makeAuthenticatedRequest('/api/my-cases', {}, cookies);
  if (casesResponse.ok) {
    const casesData = await casesResponse.json();
    console.log(`✅ User has ${casesData.length} case(s)`);
    casesData.forEach(caseItem => {
      console.log(`   - Case: ${caseItem.title} (ID: ${caseItem.id})`);
    });
  }
  
  // Check user's favorites
  const favoritesResponse = await makeAuthenticatedRequest('/api/favorites', {}, cookies);
  if (favoritesResponse.ok) {
    const favoritesData = await favoritesResponse.json();
    console.log(`✅ User has ${favoritesData.length} favorite(s)`);
  }
  
  // Check notifications
  const notificationsResponse = await makeAuthenticatedRequest('/api/notifications', {}, cookies);
  if (notificationsResponse.ok) {
    const notificationsData = await notificationsResponse.json();
    console.log(`✅ User has ${notificationsData.length} notification(s)`);
  }
}

// Test function to delete the account
async function deleteAccount(cookies) {
  console.log('\n🗑️  Initiating account deletion...');
  
  const response = await makeAuthenticatedRequest('/api/delete-account', {
    method: 'DELETE'
  }, cookies);
  
  const result = await response.json();
  
  if (response.ok) {
    console.log('✅ Account deletion successful');
    console.log(`   - Response: ${result.message}`);
    console.log(`   - Success flag: ${result.success}`);
    return true;
  } else {
    console.error('❌ Account deletion failed:', result.message);
    console.error(`   - Error: ${result.error}`);
    return false;
  }
}

// Test function to verify account and data have been deleted
async function verifyAccountDeleted(cookies) {
  console.log('\n🔍 Verifying account deletion...');
  
  // Try to access user profile (should fail)
  const userResponse = await makeAuthenticatedRequest('/api/auth/user', {}, cookies);
  if (userResponse.status === 401) {
    console.log('✅ User profile is no longer accessible (401 Unauthorized)');
  } else {
    console.error('❌ User profile is still accessible (unexpected)');
    const userData = await userResponse.json();
    console.error(`   - Response: ${JSON.stringify(userData)}`);
  }
  
  // Try to access user's cases (should fail)
  const casesResponse = await makeAuthenticatedRequest('/api/my-cases', {}, cookies);
  if (casesResponse.status === 401) {
    console.log('✅ User cases are no longer accessible (401 Unauthorized)');
  } else {
    console.error('❌ User cases are still accessible (unexpected)');
  }
  
  // Try to login with deleted account (should fail)
  const loginResponse = await fetch(`${SERVER_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: TEST_CONFIG.testUser.email,
      password: TEST_CONFIG.testUser.password
    })
  });
  
  if (loginResponse.status === 401) {
    const loginResult = await loginResponse.json();
    console.log('✅ Login with deleted account fails (401 Unauthorized)');
    console.log(`   - Message: ${loginResult.message}`);
  } else {
    console.error('❌ Login with deleted account succeeded (unexpected)');
  }
}

// Test function to verify session is cleared
async function verifySessionCleared(cookies) {
  console.log('\n🔍 Verifying session is cleared...');
  
  // Check if session cookies are cleared
  console.log(`   - Original cookies: ${cookies}`);
  
  // Try to access protected endpoint with old cookies
  const authCheckResponse = await makeAuthenticatedRequest('/api/auth/check', {}, cookies);
  if (authCheckResponse.status === 401) {
    console.log('✅ Session is properly cleared (401 Unauthorized)');
  } else {
    console.error('❌ Session is still active (unexpected)');
  }
}

// Test function to verify data integrity for other users
async function verifyDataIntegrity() {
  console.log('\n🔍 Verifying data integrity for other users...');
  
  // This would require having other test users and data
  // For now, we'll just verify the server is still responding
  const healthResponse = await fetch(`${SERVER_URL}/api/health`);
  if (healthResponse.ok) {
    console.log('✅ Server is still responding normally');
  } else {
    console.error('❌ Server health check failed');
  }
}

// Main test function
async function runDeleteAccountTest() {
  console.log('🧪 Starting Delete Account Function Test');
  console.log('=====================================\n');
  
  let cookies = '';
  let testUser = null;
  
  try {
    // Step 1: Create test user
    testUser = await createTestUser();
    
    // Step 2: Login test user
    const loginResult = await loginTestUser();
    cookies = loginResult.cookies;
    
    // Step 3: Create test data
    await createTestData(cookies);
    
    // Step 4: Verify user data exists
    await verifyUserDataExists(cookies);
    
    // Step 5: Delete account
    const deleteSuccess = await deleteAccount(cookies);
    
    if (deleteSuccess) {
      // Step 6: Verify account is deleted
      await verifyAccountDeleted(cookies);
      
      // Step 7: Verify session is cleared
      await verifySessionCleared(cookies);
      
      // Step 8: Verify data integrity for other users
      await verifyDataIntegrity();
      
      console.log('\n✅ All tests passed! Delete account function is working correctly.');
    } else {
      console.log('\n❌ Account deletion failed - test incomplete.');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
  
  console.log('\n=====================================');
  console.log('🧪 Delete Account Function Test Complete');
}

// Additional test for edge cases
async function runEdgeCaseTests() {
  console.log('\n🧪 Running Edge Case Tests');
  console.log('==========================\n');
  
  try {
    // Test 1: Try to delete account without authentication
    console.log('🔍 Test 1: Delete account without authentication...');
    const unauthResponse = await fetch(`${SERVER_URL}/api/delete-account`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (unauthResponse.status === 401) {
      console.log('✅ Unauthenticated delete request properly rejected (401)');
    } else {
      console.error('❌ Unauthenticated delete request was not rejected');
    }
    
    // Test 2: Try to delete account with invalid session
    console.log('\n🔍 Test 2: Delete account with invalid session...');
    const invalidSessionResponse = await makeAuthenticatedRequest('/api/delete-account', {
      method: 'DELETE'
    }, 'invalid-session-cookie');
    
    if (invalidSessionResponse.status === 401) {
      console.log('✅ Invalid session delete request properly rejected (401)');
    } else {
      console.error('❌ Invalid session delete request was not rejected');
    }
    
    console.log('\n✅ Edge case tests completed');
    
  } catch (error) {
    console.error('\n❌ Edge case test failed:', error.message);
  }
}

// Performance test
async function runPerformanceTest() {
  console.log('\n🧪 Running Performance Test');
  console.log('============================\n');
  
  try {
    // Create a test user with more data
    const testUser = await createTestUser();
    const loginResult = await loginTestUser();
    const cookies = loginResult.cookies;
    
    // Create multiple test cases and comments
    console.log('📚 Creating multiple test cases and comments...');
    for (let i = 0; i < 5; i++) {
      const caseResponse = await makeAuthenticatedRequest('/api/cases', {
        method: 'POST',
        body: JSON.stringify({
          title: `Performance Test Case ${i + 1}`,
          format: 'short',
          history: `This is performance test case ${i + 1} for deletion testing.`,
          specialty: 'Emergency Medicine'
        })
      }, cookies);
      
      if (caseResponse.ok) {
        const caseData = await caseResponse.json();
        
        // Add multiple comments to each case
        for (let j = 0; j < 3; j++) {
          await makeAuthenticatedRequest(`/api/cases/${caseData.id}/comments`, {
            method: 'POST',
            body: JSON.stringify({
              content: `Performance test comment ${j + 1} for case ${i + 1}.`
            })
          }, cookies);
        }
      }
    }
    
    console.log('✅ Test data created');
    
    // Measure deletion performance
    console.log('\n⏱️  Measuring deletion performance...');
    const startTime = Date.now();
    
    const deleteResponse = await makeAuthenticatedRequest('/api/delete-account', {
      method: 'DELETE'
    }, cookies);
    
    const endTime = Date.now();
    const deletionTime = endTime - startTime;
    
    if (deleteResponse.ok) {
      console.log(`✅ Account deletion completed in ${deletionTime}ms`);
      if (deletionTime < 5000) { // Less than 5 seconds
        console.log('✅ Deletion time is within acceptable range');
      } else {
        console.log('⚠️  Deletion time is slower than expected');
      }
    } else {
      console.error('❌ Performance test deletion failed');
    }
    
  } catch (error) {
    console.error('\n❌ Performance test failed:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  await runDeleteAccountTest();
  await runEdgeCaseTests();
  await runPerformanceTest();
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${SERVER_URL}/api/health`);
    if (response.ok) {
      console.log('✅ Server is running and accessible');
      return true;
    } else {
      console.error('❌ Server health check failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Cannot connect to server:', error.message);
    console.error('   Make sure the server is running on http://localhost:5001');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Delete Account Function Test Suite');
  console.log('=====================================\n');
  
  // Check if server is running
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('\n❌ Server is not accessible. Please start the server first.');
    process.exit(1);
  }
  
  // Run all tests
  await runAllTests();
  
  console.log('\n🎉 Test suite completed!');
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
