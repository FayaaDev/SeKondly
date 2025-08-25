#!/usr/bin/env node

/**
 * Test Case Upload with Automatic Redaction (Direct Server Test)
 */

import 'dotenv/config';
import { CaseVerificationService } from './server/verification-service.js';
import { FinalDeidentificationService } from './server/final-deidentification-service.js';

async function simulateCaseUploadFlow() {
  console.log('🧪 SIMULATING: Case Upload Flow with Auto-Redaction\n');
  console.log('============================================================\n');

  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const keyFilename = process.env.GOOGLE_CLOUD_KEY_FILE;
    
    if (!projectId) {
      throw new Error('GOOGLE_CLOUD_PROJECT_ID not configured');
    }
    
    // Original case data (what user submits)
    let caseData = {
      title: 'Chest Pain Case',
      history: 'Ahmed is a 35 year old male living in Dammam. Patient presented with severe chest pain. Contact: (555) 123-4567. Email: ahmed.patient@email.com',
      specialty: 'Internal Medicine',
      format: 'short'
    };

    console.log('📝 ORIGINAL CASE SUBMISSION:');
    console.log('Title:', caseData.title);
    console.log('History:', caseData.history);
    console.log('');

    // STEP 1: AI Verification (this is what happens in your routes.ts)
    console.log('🤖 Running AI verification...');
    const verificationService = new CaseVerificationService(projectId, keyFilename);
    const imagePaths = []; // No images for this test
    
    // Extract text content (same logic as in routes.ts)
    const textContent = [
      caseData.title,
      caseData.history
    ].filter(Boolean).join('\n\n');
    
    const verificationResult = await verificationService.verifyCaseContent(
      textContent,
      imagePaths,
      {}
    );
    
    console.log(`🔍 AI Verification result: Valid=${verificationResult.isValid}`);
    console.log(`📊 Confidence: ${verificationResult.confidence}%`);
    console.log(`⚠️ Violations: ${verificationResult.violations.length}`);
    
    if (verificationResult.violations.length > 0) {
      console.log('🚨 Privacy violations detected:');
      verificationResult.violations.forEach((violation, index) => {
        console.log(`  ${index + 1}. ${violation.type} (${violation.severity}): ${violation.description}`);
      });
      
      // STEP 2: Automatic De-identification (your new integration)
      console.log('');
      console.log('🛡️ Applying automatic de-identification...');
      const deidentificationService = new FinalDeidentificationService(projectId, keyFilename);
      
      const deidentificationResult = await deidentificationService.processCase(
        textContent,
        imagePaths,
        { 
          detectOnly: false,
          redactText: true,
          blurImages: true,
          redactionStyle: 'smart'
        }
      );
      
      if ('deidentification' in deidentificationResult && deidentificationResult.deidentification) {
        console.log('✅ Text de-identification successful');
        console.log(`📊 Applied ${deidentificationResult.deidentification.redactionsSummary.totalRedactions} redactions`);
        
        // Update case data with redacted content (same logic as in routes.ts)
        const redactedLines = deidentificationResult.deidentification.redactedText.split('\n\n');
        let lineIndex = 0;
        
        if (caseData.title && lineIndex < redactedLines.length) {
          caseData.title = redactedLines[lineIndex++];
        }
        if (caseData.history && lineIndex < redactedLines.length) {
          caseData.history = redactedLines[lineIndex++];
        }
        
        console.log('🔒 Case content automatically de-identified');
      }
    }
    
    // STEP 3: Show final result
    console.log('');
    console.log('📋 FINAL CASE DATA (what gets saved to database):');
    console.log('Title:', caseData.title);
    console.log('History:', caseData.history);
    console.log('');
    
    // Validation
    if (caseData.history.includes('Ahmed') || caseData.history.includes('(555) 123-4567')) {
      console.log('❌ FAILURE: PII still present in final case data!');
    } else {
      console.log('✅ SUCCESS: PII automatically removed from case data!');
      console.log('🎉 Privacy protection working as expected!');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the simulation
simulateCaseUploadFlow();
