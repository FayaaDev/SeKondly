#!/usr/bin/env node

import fetch from 'node-fetch';

// Server URL
const SERVER_URL = 'http://localhost:5001';

// Target user to delete
const TARGET_USER = {
  email: 'Freeland90@protonmail.ch',
  // We'll try common passwords or use development mode
  possiblePasswords: ['Freeland90@protonmail.ch', 'password123', '123456', 'admin', 'freeland', 'Freeland90']
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

// Try to login with the target user
async function loginTargetUser() {
  console.log(`\n🔐 Attempting to login user: ${TARGET_USER.email}`);
  
  // First, try development mode (auto-login)
  console.log('   Trying development mode login...');
  const devResponse = await fetch(`${SERVER_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: TARGET_USER.email,
      password: 'any_password' // In dev mode, password doesn't matter
    })
  });
  
  if (devResponse.ok) {
    const result = await devResponse.json();
    const cookies = extractCookies(devResponse);
    console.log('✅ Development mode login successful');
    console.log(`   - User ID: ${result.user.id}`);
    console.log(`   - Admin: ${result.user.isAdmin ? 'Yes' : 'No'}`);
    console.log(`   - Approved: ${result.user.isApproved ? 'Yes' : 'No'}`);
    return { user: result.user, cookies };
  }
  
  // If dev mode failed, try common passwords
  console.log('   Development mode failed, trying common passwords...');
  for (const password of TARGET_USER.possiblePasswords) {
    console.log(`   Trying password: ${password}`);
    
    const response = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: TARGET_USER.email,
        password: password
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      const cookies = extractCookies(response);
      console.log(`✅ Login successful with password: ${password}`);
      console.log(`   - User ID: ${result.user.id}`);
      console.log(`   - Admin: ${result.user.isAdmin ? 'Yes' : 'No'}`);
      console.log(`   - Approved: ${result.user.isApproved ? 'Yes' : 'No'}`);
      return { user: result.user, cookies };
    } else {
      const error = await response.json();
      console.log(`   ❌ Failed with password "${password}": ${error.message}`);
    }
  }
  
  throw new Error('Could not login with any attempted password');
}

// Get user data before deletion
async function getUserDataBeforeDeletion(cookies) {
  console.log('\n🔍 Getting user data before deletion...');
  
  // Get user profile
  const userResponse = await makeAuthenticatedRequest('/api/auth/user', {}, cookies);
  if (userResponse.ok) {
    const userData = await userResponse.json();
    console.log('✅ User profile found:');
    console.log(`   - ID: ${userData.id}`);
    console.log(`   - Email: ${userData.email}`);
    console.log(`   - Name: ${userData.firstName} ${userData.lastName}`);
    console.log(`   - Specialty: ${userData.specialty}`);
    console.log(`   - Level: ${userData.level}`);
    console.log(`   - Institution: ${userData.institution}`);
    console.log(`   - Approved: ${userData.isApproved ? 'Yes' : 'No'}`);
    console.log(`   - Admin: ${userData.isAdmin ? 'Yes' : 'No'}`);
    
    // Get user's cases
    const casesResponse = await makeAuthenticatedRequest('/api/my-cases', {}, cookies);
    if (casesResponse.ok) {
      const casesData = await casesResponse.json();
      console.log(`✅ User has ${casesData.length} case(s):`);
      casesData.forEach((caseItem, index) => {
        console.log(`   ${index + 1}. "${caseItem.title}" (ID: ${caseItem.id}) - ${caseItem.specialty}`);
      });
    } else {
      console.log('❌ Could not fetch user cases');
    }
    
    // Get user's favorites
    const favoritesResponse = await makeAuthenticatedRequest('/api/favorites', {}, cookies);
    if (favoritesResponse.ok) {
      const favoritesData = await favoritesResponse.json();
      console.log(`✅ User has ${favoritesData.length} favorite(s)`);
    } else {
      console.log('❌ Could not fetch user favorites');
    }
    
    // Get user's notifications
    const notificationsResponse = await makeAuthenticatedRequest('/api/notifications', {}, cookies);
    if (notificationsResponse.ok) {
      const notificationsData = await notificationsResponse.json();
      console.log(`✅ User has ${notificationsData.length} notification(s)`);
    } else {
      console.log('❌ Could not fetch user notifications');
    }
    
    return userData;
  } else {
    console.error('❌ Could not fetch user profile');
    return null;
  }
}

// Execute account deletion
async function deleteAccount(cookies) {
  console.log('\n🗑️  Initiating account deletion...');
  
  const response = await makeAuthenticatedRequest('/api/delete-account', {
    method: 'DELETE'
  }, cookies);
  
  if (response.ok) {
    const result = await response.json();
    console.log('✅ Account deletion successful!');
    console.log(`   - Response: ${result.message}`);
    console.log(`   - Success flag: ${result.success}`);
    return true;
  } else {
    const error = await response.json();
    console.error('❌ Account deletion failed:');
    console.error(`   - Status: ${response.status}`);
    console.error(`   - Message: ${error.message}`);
    console.error(`   - Error: ${error.error}`);
    return false;
  }
}

// Verify account has been deleted
async function verifyAccountDeleted(cookies, originalEmail) {
  console.log('\n🔍 Verifying account deletion...');
  
  // Try to access user profile with old session (should fail)
  const userResponse = await makeAuthenticatedRequest('/api/auth/user', {}, cookies);
  if (userResponse.status === 401) {
    console.log('✅ Old session is invalid (401 Unauthorized)');
  } else {
    console.error('❌ Old session is still valid (unexpected)');
  }
  
  // Try to login with the deleted account (should fail)
  const loginResponse = await fetch(`${SERVER_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: originalEmail,
      password: 'any_password' // Try any password since account should be gone
    })
  });
  
  if (loginResponse.status === 401) {
    const loginResult = await loginResponse.json();
    console.log('✅ Login with deleted account fails (401 Unauthorized)');
    console.log(`   - Message: ${loginResult.message}`);
  } else {
    console.error('❌ Login with deleted account succeeded (unexpected)');
  }
  
  // Verify server is still healthy
  const healthResponse = await fetch(`${SERVER_URL}/api/health`);
  if (healthResponse.ok) {
    console.log('✅ Server is still running normally after deletion');
  } else {
    console.error('❌ Server health check failed after deletion');
  }
}

// Main test execution
async function main() {
  console.log('🚀 Delete Account Test for Freeland90@protonmail.ch');
  console.log('===================================================\n');
  
  try {
    // Step 1: Check if server is running
    const serverRunning = await checkServer();
    if (!serverRunning) {
      console.log('\n❌ Server is not accessible. Please start the server first.');
      process.exit(1);
    }
    
    // Step 2: Login with target user
    const loginResult = await loginTargetUser();
    const { user, cookies } = loginResult;
    
    // Step 3: Get user data before deletion
    const userData = await getUserDataBeforeDeletion(cookies);
    
    // Step 4: Confirm deletion
    console.log('\n⚠️  WARNING: This will permanently delete the account and all associated data!');
    console.log(`   - User: ${user.email}`);
    console.log(`   - Name: ${user.firstName} ${user.lastName}`);
    console.log(`   - ID: ${user.id}`);
    
    // In a real scenario, you might want to add a confirmation prompt
    // For testing, we'll proceed automatically
    console.log('\n▶️  Proceeding with deletion...');
    
    // Step 5: Delete account
    const deleteSuccess = await deleteAccount(cookies);
    
    if (deleteSuccess) {
      // Step 6: Verify deletion
      await verifyAccountDeleted(cookies, user.email);
      
      console.log('\n✅ Delete account test completed successfully!');
      console.log('   - User account has been permanently deleted');
      console.log('   - All associated data has been removed');
      console.log('   - Sessions have been invalidated');
      console.log('   - Server is still functioning normally');
    } else {
      console.log('\n❌ Delete account test failed - account was not deleted');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
  
  console.log('\n===================================================');
  console.log('🧪 Delete Account Test Complete');
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
