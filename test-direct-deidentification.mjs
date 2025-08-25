#!/usr/bin/env node

/**
 * Direct Test of De-identification Service Integration
 */

import 'dotenv/config';
import { FinalDeidentificationService } from './server/final-deidentification-service.js';

async function testDirectDeidentification() {
  console.log('🧪 TESTING: Direct De-identification Service\n');
  console.log('============================================================\n');

  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const keyFilename = process.env.GOOGLE_CLOUD_KEY_FILE;
    
    if (!projectId) {
      throw new Error('GOOGLE_CLOUD_PROJECT_ID not configured');
    }
    
    const deidentificationService = new FinalDeidentificationService(projectId, keyFilename);
    
    // Test case with PII that should be automatically redacted
    const originalText = 'Ahmed is a 35 year old male living in Dammam. Patient presented with severe chest pain at 2 AM. Contact number: (555) 123-4567. Email: ahmed.patient@email.com';
    
    console.log('📝 ORIGINAL TEXT:');
    console.log(originalText);
    console.log('');

    // Test the de-identification process that would happen during case upload
    const result = await deidentificationService.processCase(
      originalText,
      [], // No images
      { 
        detectOnly: false,
        redactText: true,
        blurImages: false,
        redactionStyle: 'smart'
      }
    );

    console.log('🔍 DETECTION RESULTS:');
    console.log('Valid:', result.isValid);
    console.log('Confidence:', result.confidence);
    console.log('Violations:', result.violations.length);
    
    if (result.violations.length > 0) {
      console.log('');
      console.log('🚨 VIOLATIONS DETECTED:');
      result.violations.forEach((violation, index) => {
        console.log(`  ${index + 1}. ${violation.type} (${violation.severity}): ${violation.description}`);
      });
    }

    if ('deidentification' in result && result.deidentification) {
      console.log('');
      console.log('🛡️ DE-IDENTIFICATION APPLIED:');
      console.log('Redactions:', result.deidentification.redactionsSummary.totalRedactions);
      console.log('Categories:', result.deidentification.redactionsSummary.categoriesRedacted);
      console.log('');
      console.log('📝 REDACTED TEXT:');
      console.log(result.deidentification.redactedText);
      console.log('');
      
      // Compare original vs redacted
      if (originalText !== result.deidentification.redactedText) {
        console.log('✅ SUCCESS: Text was automatically de-identified!');
        console.log('🔒 Patient privacy protected');
      } else {
        console.log('⚠️ WARNING: No changes applied to text');
      }
    } else {
      console.log('');
      console.log('ℹ️ No de-identification needed (no violations found)');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDirectDeidentification();
