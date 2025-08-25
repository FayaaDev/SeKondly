#!/usr/bin/env node

/**
 * Direct test of the AI verification service (bypassing API authentication)
 */

import 'dotenv/config';
import { CaseVerificationService } from './server/verification-service.js';

async function testAIVerificationDirect() {
  console.log('🧪 Testing AI Verification Service Directly\n');
  console.log('============================================================\n');

  try {
    // Initialize verification service with Google Cloud credentials
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const keyFilename = process.env.GOOGLE_CLOUD_KEY_FILE;
    
    console.log(`🔧 Project ID: ${projectId}`);
    console.log(`🔧 Key File: ${keyFilename}`);
    
    if (!projectId) {
      throw new Error('GOOGLE_CLOUD_PROJECT_ID not configured');
    }
    
    const verificationService = new CaseVerificationService(projectId, keyFilename);
    
    // Test case with potential privacy violations
    const testContent = `
Patient Case: Complex Medical Presentation

Patient Dr. Ahmed AlFayaa, MRN: 1075123434, DOB: 01/15/1992, called from phone 562806022.
Chief Complaint: Chest pain and difficulty breathing for the past 2 hours.
History: Patient lives at 123 Main Street, Springfield, IL. Email: john.smith@email.com
Past Medical History: Diabetes, hypertension
Examination: Patient appears anxious, diaphoretic
Management: Started on oxygen, IV access established
`;
    
    console.log('📋 Testing content with privacy violations...');
    console.log('Expected: Should detect names, MRN, DOB, phone, email, address\n');

    const verificationResult = await verificationService.verifyCaseContent(
      testContent,
      [], // No images for this test
      {} // Default options
    );
    
    console.log('✅ AI Verification Results:');
    console.log(`📊 Valid: ${verificationResult.isValid}`);
    console.log(`📊 Confidence: ${verificationResult.confidence}%`);
    console.log(`⚠️ Violations Found: ${verificationResult.violations.length}`);
    
    if (verificationResult.violations.length > 0) {
      console.log('\n🚨 Privacy Violations Detected:');
      verificationResult.violations.forEach((violation, index) => {
        console.log(`  ${index + 1}. ${violation.type} (${violation.severity})`);
        console.log(`     Description: ${violation.description}`);
        console.log(`     Confidence: ${violation.confidence}%`);
        console.log(`     Suggestion: ${violation.suggestion}\n`);
      });
    }
    
    if (verificationResult.suggestions.length > 0) {
      console.log('💡 Suggestions:');
      verificationResult.suggestions.forEach((suggestion, index) => {
        console.log(`  ${index + 1}. ${suggestion}`);
      });
    }

  } catch (error) {
    console.error('❌ AI Verification Error:', error.message);
    console.error('🔍 Error Details:', error);
    
    if (error.message.includes('GOOGLE_CLOUD_PROJECT_ID')) {
      console.log('\n🔧 Setup Required:');
      console.log('1. Set GOOGLE_CLOUD_PROJECT_ID in your .env file');
      console.log('2. Set GOOGLE_CLOUD_KEY_FILE path in your .env file');
      console.log('3. Ensure Google Cloud APIs are enabled');
    }
  }

  console.log('\n============================================================');
  console.log('🏁 Direct AI Verification Test Complete!');
}

// Run the test
testAIVerificationDirect().catch(console.error);
