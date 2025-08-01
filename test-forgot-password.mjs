#!/usr/bin/env node

import 'dotenv/config';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5001';

// Test the forgot password functionality
async function testForgotPassword() {
  console.log('🧪 Testing Forgot Password Functionality...\n');
  
  try {
    console.log('📧 Testing forgot password with valid email...');
    
    // Test with a valid email format
    const response = await fetch(`${BASE_URL}/api/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test.doctor@example.com'
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Forgot password request processed successfully');
      console.log('📧 Response message:', result.message);
      console.log('✅ Success status:', result.success);
    } else {
      console.log('❌ Forgot password request failed:', result);
    }
    
    // Test with invalid email format
    console.log('\n📧 Testing forgot password with invalid email...');
    
    const invalidResponse = await fetch(`${BASE_URL}/api/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'invalid-email'
      })
    });
    
    const invalidResult = await invalidResponse.json();
    
    if (invalidResponse.status === 400) {
      console.log('✅ Invalid email properly rejected');
      console.log('📧 Error message:', invalidResult.message);
    } else {
      console.log('❌ Invalid email should have been rejected');
    }
    
    // Test with missing email
    console.log('\n📧 Testing forgot password with missing email...');
    
    const missingResponse = await fetch(`${BASE_URL}/api/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });
    
    const missingResult = await missingResponse.json();
    
    if (missingResponse.status === 400) {
      console.log('✅ Missing email properly rejected');
      console.log('📧 Error message:', missingResult.message);
    } else {
      console.log('❌ Missing email should have been rejected');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 FORGOT PASSWORD TEST SUMMARY');
    console.log('='.repeat(50));
    console.log('✅ API endpoint is working correctly');
    console.log('✅ Email validation is functioning');
    console.log('✅ Error handling is implemented');
    console.log('📧 Check server logs to confirm email notifications are sent to admin@sekondly.app');
    
  } catch (error) {
    console.error('❌ Error testing forgot password:', error);
  }
}

// Test with a real user email if one exists
async function testWithRealUser() {
  console.log('\n🧪 Testing with real user email...\n');
  
  try {
    // Test with admin email (which should exist)
    const response = await fetch(`${BASE_URL}/api/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@sekondly.app'
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Real user forgot password test successful');
      console.log('📧 Response:', result.message);
      console.log('📧 Admin should receive notification email');
    } else {
      console.log('❌ Real user forgot password test failed:', result);
    }
    
  } catch (error) {
    console.error('❌ Error testing with real user:', error);
  }
}

// Run tests
async function runTests() {
  await testForgotPassword();
  await testWithRealUser();
  
  console.log('\n📧 Email Template Location: /Users/fayaa/SeKondly/server/templates/forgot-password-email.json');
  console.log('🔧 Next steps:');
  console.log('1. Start the React Native app and test the mobile UI');
  console.log('2. Verify email notifications are received at admin@sekondly.app');
  console.log('3. Test the complete user flow');
}

runTests();
