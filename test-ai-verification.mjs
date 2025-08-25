#!/usr/bin/env node

/**
 * Test script to verify the full AI verification system with Google Cloud
 */

const API_BASE = 'http://localhost:5001';

async function testAIVerification() {
  console.log('🧪 Testing Full AI Verification System with Google Cloud\n');
  console.log('============================================================\n');

  // Test case with potential privacy violations
  const testCase = {
    title: "Complex Medical Case with Privacy Issues",
    history: "Patient Dr. John Smith, MRN: 123456, DOB: 01/15/1980, called from phone 555-123-4567",
    chiefComplaint: "Chest pain and difficulty breathing",
    examination: "Patient lives at 123 Main Street, Springfield, IL. Email: john.smith@email.com",
    specialty: "cardiology",
    userId: "test-user"
  };

  try {
    console.log('📋 Submitting test case with privacy violations...');
    console.log('Expected: Should be flagged by AI verification\n');

    const response = await fetch(`${API_BASE}/api/cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCase)
    });

    const data = await response.json();

    console.log('✅ Response received:');
    console.log(`Status: ${response.status}`);
    console.log(`Case ID: ${data?.id || 'Not provided'}`);
    console.log(`Verification Status: ${data?.verification_status || 'Not provided'}`);
    console.log(`Verification Confidence: ${data?.verification_confidence || 'Not provided'}%`);
    console.log(`Requires Manual Review: ${data?.requires_manual_review || 'Not provided'}`);
    
    if (data?.verification_violations) {
      console.log(`Violations Found: ${data.verification_violations}`);
    }

  } catch (error) {
    console.log('❌ Error making request:', error.message);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Message: ${error.response.data?.error || error.response.data}`);
    }
  }

  console.log('\n============================================================');
  console.log('🏁 AI Verification Test Complete!');
  console.log('\nNote: Check your server logs for detailed verification output');
}

// Run the test
testAIVerification().catch(console.error);
