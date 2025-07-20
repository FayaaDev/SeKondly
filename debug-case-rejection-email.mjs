#!/usr/bin/env node

/**
 * Debug script to test case rejection email on live server
 * This will help identify why emails aren't being sent
 */

import fetch from 'node-fetch';

const API_BASE = 'https://api.sekondly.app';

async function debugCaseRejection() {
  console.log('🔍 Debugging Case Rejection Email Issue...\n');

  // Test 1: Check if API is responding
  console.log('📡 Test 1: API Health Check');
  try {
    const healthResponse = await fetch(`${API_BASE}/api/health`);
    const healthData = await healthResponse.json();
    console.log(`✅ API Status: ${healthData.status}`);
    console.log(`   Environment: ${healthData.environment || 'production'}`);
  } catch (error) {
    console.error(`❌ API Health Check failed: ${error.message}`);
    return;
  }

  // Test 2: Check case rejection endpoint structure
  console.log('\n🧪 Test 2: Case Rejection Endpoint Analysis');
  
  console.log('Expected request format:');
  console.log('  Method: DELETE');
  console.log('  URL: /api/admin/reject-case/[caseId]');
  console.log('  Body: { reason: "rejection reason text" }');
  console.log('  Headers: Content-Type: application/json');

  console.log('\nExpected server logs (should appear in PM2):');
  console.log('  1. "Case rejection request - ID: [id], Reason provided: true"');
  console.log('  2. "Fetching case details for ID: [id]"');
  console.log('  3. "Case found: [title] by author [authorId]"');
  console.log('  4. "Fetching author details for ID: [authorId]"');
  console.log('  5. "Author details: { found: true, hasEmail: true, ... }"');
  console.log('  6. "Attempting to send case rejection email to: [email]"');
  console.log('  7. Email function logs from sendCaseRejectionEmail');

  // Test 3: Potential Issues Analysis
  console.log('\n⚠️  Test 3: Potential Issues Analysis');
  
  console.log('Possible reasons for missing logs:');
  console.log('  1. Console.log statements not appearing in PM2 output');
  console.log('  2. Request body missing rejection reason');
  console.log('  3. Early return due to validation failure');
  console.log('  4. Error in endpoint before email function is called');
  console.log('  5. Admin authentication/authorization issues');

  // Test 4: Debug Request Body
  console.log('\n📝 Test 4: Request Body Debug');
  
  console.log('Admin panel should send:');
  console.log(`{
    "reason": "Actual rejection reason text from modal"
  }`);
  
  console.log('\nIf reason is missing or empty:');
  console.log('  - Server returns 400 "Rejection reason is required"');
  console.log('  - No email function is called');
  console.log('  - Only basic express log appears');

  // Test 5: Logging Configuration
  console.log('\n📊 Test 5: Logging Configuration Check');
  
  console.log('PM2 should show ALL console.log statements from the server.');
  console.log('If custom console.log statements are missing:');
  console.log('  1. Check PM2 log level configuration');
  console.log('  2. Verify console.log is not overridden');
  console.log('  3. Check if logs are being filtered');
  console.log('  4. Try console.error instead of console.log');

  // Test 6: Manual Testing Steps
  console.log('\n🛠️  Test 6: Manual Testing Steps');
  
  console.log('To debug on live server:');
  console.log('1. Open admin panel');
  console.log('2. Find a pending case');
  console.log('3. Click reject button');
  console.log('4. Enter rejection reason in modal');
  console.log('5. Submit rejection');
  console.log('6. Check PM2 logs immediately: pm2 logs sekondly-api');
  console.log('7. Look for custom log messages starting with "Case rejection request"');

  // Test 7: Debugging Suggestions
  console.log('\n🔧 Test 7: Debugging Suggestions');
  
  console.log('Add temporary debugging to routes.ts:');
  console.log('  1. Add console.error at start of rejection endpoint');
  console.log('  2. Add console.error for request body content');
  console.log('  3. Add console.error before email function call');
  console.log('  4. Use console.error instead of console.log (more visible)');

  console.log('\nTemporary debug code to add:');
  console.log(`
  app.delete("/api/admin/reject-case/:id", isAuthenticated, isAdmin, async (req, res) => {
    console.error("=== CASE REJECTION DEBUG START ===");
    console.error("Request params:", req.params);
    console.error("Request body:", req.body);
    console.error("Request headers:", req.headers);
    
    try {
      const caseId = parseInt(req.params.id);
      const { reason } = req.body;
      
      console.error("Parsed caseId:", caseId);
      console.error("Parsed reason:", reason);
      console.error("Reason provided?", !!reason);
      
      // ... rest of function
    } catch (error) {
      console.error("=== CASE REJECTION ERROR ===", error);
    }
  });
  `);

  console.log('\n🎯 Next Steps:');
  console.log('1. Check if rejection reason is being sent from admin panel');
  console.log('2. Add temporary console.error statements for visibility');
  console.log('3. Monitor PM2 logs during case rejection');
  console.log('4. Verify admin authentication is working');
  console.log('5. Check if early validation is failing silently');
}

// Run the debug analysis
debugCaseRejection().catch(console.error);
