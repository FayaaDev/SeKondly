#!/usr/bin/env node

/**
 * Debug script to test session management and authentication
 * Run this script to test login/logout cycles and see session behavior
 */

const API_BASE = 'https://sekondly.app';

async function testSessionFlow() {
  console.log('🔍 Testing Session Management...\n');
  
  // Store cookies manually since Node.js fetch doesn't handle them automatically
  let cookies = '';
  
  // Test 1: Try to access protected endpoint without auth
  console.log('1. Testing protected endpoint without auth...');
  try {
    const response = await fetch(`${API_BASE}/api/auth/user`, {
      credentials: 'include',
      headers: cookies ? { 'Cookie': cookies } : {}
    });
    console.log('   Status:', response.status);
    if (response.ok) {
      const user = await response.json();
      console.log('   ❌ User found (should be unauthorized):', { id: user.id, email: user.email });
    } else {
      console.log('   ✅ Not authenticated (expected)');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
  
  // Test 2: Login
  console.log('\n2. Testing login...');
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(cookies ? { 'Cookie': cookies } : {})
      },
      credentials: 'include',
      body: JSON.stringify({
        email: 'fayaa.a@example.com',
        password: 'fayaafayaa'
      })
    });
    
    console.log('   Login status:', response.status);
    
    // Extract cookies from response
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      cookies = setCookieHeader.split(',').map(cookie => cookie.split(';')[0]).join('; ');
      console.log('   Cookies received:', cookies);
    }
    
    if (response.ok) {
      const result = await response.json();
      console.log('   ✅ Login successful:', result.message);
    } else {
      const error = await response.json();
      console.log('   ❌ Login failed:', error.message);
      return;
    }
  } catch (error) {
    console.log('   ❌ Login error:', error.message);
    return;
  }
  
  // Test 3: Access protected endpoint after login
  console.log('\n3. Testing protected endpoint after login...');
  try {
    const response = await fetch(`${API_BASE}/api/auth/user`, {
      credentials: 'include',
      headers: cookies ? { 'Cookie': cookies } : {}
    });
    console.log('   Status:', response.status);
    if (response.ok) {
      const user = await response.json();
      console.log('   ✅ User authenticated:', { id: user.id, email: user.email, firstName: user.firstName });
    } else {
      console.log('   ❌ Still not authenticated');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
  
  // Test 4: Logout
  console.log('\n4. Testing logout...');
  try {
    const response = await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: cookies ? { 'Cookie': cookies } : {}
    });
    
    console.log('   Logout status:', response.status);
    
    // Check if logout clears cookies
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      console.log('   Logout cookies:', setCookieHeader);
    }
    
    if (response.ok) {
      const result = await response.json();
      console.log('   ✅ Logout successful:', result.message);
    } else {
      const error = await response.json();
      console.log('   ❌ Logout failed:', error.message);
    }
  } catch (error) {
    console.log('   ❌ Logout error:', error.message);
  }
  
  // Test 5: Try protected endpoint after logout (should fail)
  console.log('\n5. Testing protected endpoint after logout...');
  try {
    const response = await fetch(`${API_BASE}/api/auth/user`, {
      credentials: 'include',
      headers: cookies ? { 'Cookie': cookies } : {}
    });
    console.log('   Status:', response.status);
    if (response.ok) {
      const user = await response.json();
      console.log('   ❌ Still authenticated (this is the problem!):', { id: user.id, email: user.email });
    } else {
      console.log('   ✅ Correctly not authenticated after logout');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
  
  console.log('\n🏁 Session test completed!');
}

// Run the test
testSessionFlow().catch(console.error);
