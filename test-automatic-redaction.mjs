#!/usr/bin/env node

/**
 * Test Automatic Redaction in Case Upload Flow
 */

import 'dotenv/config';

async function testAutomaticRedaction() {
  console.log('🧪 TESTING: Automatic De-identification in Case Upload\n');
  console.log('============================================================\n');

  try {
    // Test case with PII that should be automatically redacted
    const testCaseData = {
      title: 'Chest Pain Case',
      history: 'Ahmed is a 35 year old male living in Dammam. Patient presented with severe chest pain at 2 AM. Contact number: (555) 123-4567. Email: ahmed.patient@email.com',
      specialty: 'Internal Medicine',
      authorId: 'user_1750031685799_rm4cf8xer', // Your user ID
      format: 'short'
    };

    console.log('📝 ORIGINAL CASE DATA:');
    console.log('Title:', testCaseData.title);
    console.log('History:', testCaseData.history);
    console.log('');

    // Simulate case upload via API call
    const response = await fetch('http://localhost:5001/api/cases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'sekondly.sid=s%3AWEJWrlBzpzZc280E5-g3vaPyNzRCyZyI.ZMgsaI8TSelXa2Ijz6hnVUrOcer9E8ipElF9EMloktM'
      },
      body: JSON.stringify(testCaseData)
    });

    if (response.ok) {
      const createdCase = await response.json();
      
      console.log('✅ CASE CREATED SUCCESSFULLY');
      console.log('🔍 FINAL CASE DATA (after auto-redaction):');
      console.log('Title:', createdCase.title);
      console.log('History:', createdCase.history);
      console.log('');
      console.log('🛡️ VERIFICATION STATUS:');
      console.log('Status:', createdCase.verificationStatus);
      console.log('Confidence:', createdCase.verificationConfidence);
      console.log('Violations:', createdCase.verificationViolations);
      console.log('Requires Manual Review:', createdCase.requiresManualReview);
      
      if (createdCase.verificationSummary) {
        console.log('');
        console.log('📊 VIOLATIONS DETECTED:');
        createdCase.verificationSummary.forEach((violation, index) => {
          console.log(`  ${index + 1}. ${violation.type} (${violation.severity})`);
        });
      }
      
      // Check if redaction occurred
      const originalText = testCaseData.history;
      const finalText = createdCase.history;
      
      if (originalText !== finalText) {
        console.log('');
        console.log('🎉 SUCCESS: Automatic redaction applied!');
        console.log('Original contained PII, final text is de-identified');
      } else {
        console.log('');
        console.log('⚠️ WARNING: No redaction applied - original text unchanged');
      }
      
    } else {
      const error = await response.text();
      console.error('❌ Case creation failed:', response.status, error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAutomaticRedaction();
