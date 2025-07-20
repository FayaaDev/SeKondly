#!/usr/bin/env node

/**
 * Debug script to test which routes are actually active on live server
 * This will help identify if routes.ts is being loaded properly
 */

import fetch from 'node-fetch';

const API_BASE = 'https://api.sekondly.app';

async function debugActiveRoutes() {
  console.log('🔍 Testing Which Routes Are Active on Live Server...\n');

  // Test 1: Debug route from routes.ts
  console.log('🎯 Test 1: Debug Route from routes.ts');
  try {
    const debugResponse = await fetch(`${API_BASE}/api/debug-routes`);
    const debugData = await debugResponse.json();
    
    if (debugResponse.ok) {
      console.log('✅ routes.ts is loaded and working!');
      console.log('   Response:', debugData);
    } else {
      console.log('❌ Debug route failed');
      console.log('   Status:', debugResponse.status);
      console.log('   Response:', debugData);
    }
  } catch (error) {
    console.error('❌ Debug route error:', error.message);
  }

  // Test 2: Health check (should work from routes.ts)
  console.log('\n🏥 Test 2: Health Check Route');
  try {
    const healthResponse = await fetch(`${API_BASE}/api/health`);
    const healthData = await healthResponse.json();
    
    if (healthResponse.ok) {
      console.log('✅ Health check working');
      console.log('   Environment:', healthData.environment);
      console.log('   Status:', healthData.status);
    } else {
      console.log('❌ Health check failed');
    }
  } catch (error) {
    console.error('❌ Health check error:', error.message);
  }

  // Test 3: Test approval route without auth
  console.log('\n🧪 Test 3: Test Approval Route (No Auth)');
  try {
    const testResponse = await fetch(`${API_BASE}/api/admin/test-approve-case/999`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const testData = await testResponse.json();
    
    if (testResponse.ok) {
      console.log('✅ Test approval route working!');
      console.log('   Response:', testData);
      console.log('   This means routes.ts is properly loaded');
    } else {
      console.log('❌ Test approval route failed');
      console.log('   Status:', testResponse.status);
    }
  } catch (error) {
    console.error('❌ Test approval route error:', error.message);
  }

  // Test 4: Pending cases (should exist in both files)
  console.log('\n📋 Test 4: Pending Cases Route');
  try {
    const pendingResponse = await fetch(`${API_BASE}/api/admin/pending-cases`);
    const pendingData = await pendingResponse.json();
    
    console.log('Status:', pendingResponse.status);
    if (pendingResponse.ok) {
      console.log('✅ Pending cases route working');
      console.log('   Found', Array.isArray(pendingData) ? pendingData.length : 'unknown', 'cases');
    } else {
      console.log('❌ Pending cases route failed');
    }
  } catch (error) {
    console.error('❌ Pending cases error:', error.message);
  }

  console.log('\n📊 Analysis:');
  console.log('If debug route works: routes.ts is loaded properly');
  console.log('If debug route fails: routes.ts is not being loaded or has errors');
  console.log('If test approval route works: Authentication might be the issue');
  console.log('If none work: There might be a server configuration issue');

  console.log('\n📝 Next Steps Based on Results:');
  console.log('✅ Debug route works → Check authentication middleware');
  console.log('❌ Debug route fails → Check server startup logs for routes.ts errors');
  console.log('✅ Test approval works → Remove auth temporarily to test emails');
  console.log('❌ All routes fail → Check if server is using correct code version');
}

// Run the debug test
debugActiveRoutes().catch(console.error);
