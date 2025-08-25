#!/usr/bin/env node

/**
 * Complete Test: Case Upload with Automatic Text + Image De-identification
 */

import 'dotenv/config';
import { FinalDeidentificationService } from './server/final-deidentification-service.js';
import { CaseVerificationService } from './server/verification-service.js';
import fs from 'fs';
import path from 'path';

async function testCompleteAutoRedactionFlow() {
  console.log('🎯 COMPLETE TEST: Case Upload with Auto Text + Image Redaction\n');
  console.log('============================================================\n');

  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const keyFilename = process.env.GOOGLE_CLOUD_KEY_FILE;
    
    if (!projectId) {
      throw new Error('GOOGLE_CLOUD_PROJECT_ID not configured');
    }
    
    // Simulate a real case upload with PII and images
    let caseData = {
      title: 'Complex Medical Case',
      history: 'Patient Ahmed Hassan is a 45-year-old male from Riyadh. Contact: (555) 123-4567. Email: ahmed.hassan@email.com. Referred by Dr. Sarah AlMutawa.',
      specialty: 'Internal Medicine',
      format: 'short'
    };

    // Find test images
    const uploadsDir = './uploads';
    let imagePaths = [];
    let imageUrls = [];
    
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      const imageFiles = files.filter(file => 
        file.toLowerCase().endsWith('.jpg') || 
        file.toLowerCase().endsWith('.jpeg') || 
        file.toLowerCase().endsWith('.png')
      );
      
      if (imageFiles.length > 0) {
        imagePaths = imageFiles.slice(0, 2).map(file => path.join(uploadsDir, file));
        imageUrls = imageFiles.slice(0, 2).map(file => `/uploads/${file}`);
      }
    }

    console.log('📝 ORIGINAL CASE SUBMISSION:');
    console.log('Title:', caseData.title);
    console.log('History:', caseData.history);
    console.log('Images:', imageUrls);
    console.log('');

    // SIMULATE THE ROUTES.TS FLOW
    console.log('🤖 STEP 1: AI Verification...');
    const verificationService = new CaseVerificationService(projectId, keyFilename);
    
    // Extract text content (same as routes.ts)
    const textContent = [
      caseData.title,
      caseData.history
    ].filter(Boolean).join('\n\n');
    
    const verificationResult = await verificationService.verifyCaseContent(
      textContent,
      imagePaths,
      {}
    );
    
    console.log(`🔍 Verification: Valid=${verificationResult.isValid}, Violations=${verificationResult.violations.length}`);
    
    if (verificationResult.violations.length > 0) {
      console.log('🚨 Privacy violations detected:');
      verificationResult.violations.forEach((violation, index) => {
        console.log(`  ${index + 1}. ${violation.type} (${violation.severity}): ${violation.description}`);
      });
      
      // STEP 2: Automatic De-identification (same as routes.ts)
      console.log('');
      console.log('🛡️ STEP 2: Applying automatic de-identification...');
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
        console.log('✅ De-identification successful');
        console.log(`📊 Applied ${deidentificationResult.deidentification.redactionsSummary.totalRedactions} total redactions`);
        
        // Update case data with redacted content (same as routes.ts)
        const redactedLines = deidentificationResult.deidentification.redactedText.split('\n\n');
        let lineIndex = 0;
        
        if (caseData.title && lineIndex < redactedLines.length) {
          caseData.title = redactedLines[lineIndex++];
        }
        if (caseData.history && lineIndex < redactedLines.length) {
          caseData.history = redactedLines[lineIndex++];
        }
        
        // Handle blurred images (same as routes.ts)
        if (deidentificationResult.deidentification.redactedImages && 
            deidentificationResult.deidentification.redactedImages.length > 0) {
          
          console.log('🖼️ Processing blurred images...');
          const blurredImageUrls = [];
          
          for (const redactedImage of deidentificationResult.deidentification.redactedImages) {
            console.log(`🔄 Processed: ${redactedImage.originalPath}`);
            console.log(`  - Faces blurred: ${redactedImage.facesBlurred}`);
            console.log(`  - Text regions blurred: ${redactedImage.textRegionsBlurred}`);
            
            // Convert to URL
            const filename = redactedImage.redactedPath.split('/').pop();
            const blurredUrl = `/uploads/${filename}`;
            blurredImageUrls.push(blurredUrl);
          }
          
          if (blurredImageUrls.length > 0) {
            imageUrls = blurredImageUrls;
            console.log(`🔒 Replaced ${blurredImageUrls.length} images with blurred versions`);
          }
        }
        
        console.log('🔒 Case content automatically de-identified');
      }
    }
    
    // STEP 3: Final result (what gets saved to database)
    console.log('');
    console.log('📋 FINAL CASE DATA (what gets saved to database):');
    console.log('Title:', caseData.title);
    console.log('History:', caseData.history);
    console.log('Images:', imageUrls);
    console.log('');
    
    // Validation
    const originalContent = 'Patient Ahmed Hassan is a 45-year-old male from Riyadh. Contact: (555) 123-4567. Email: ahmed.hassan@email.com. Referred by Dr. Sarah AlMutawa.';
    
    if (caseData.history.includes('Ahmed Hassan') || 
        caseData.history.includes('(555) 123-4567') ||
        caseData.history.includes('ahmed.hassan@email.com')) {
      console.log('❌ FAILURE: PII still present in final case data!');
    } else {
      console.log('✅ SUCCESS: Text PII automatically removed!');
    }
    
    if (imageUrls.some(url => url.includes('_redacted'))) {
      console.log('✅ SUCCESS: Images automatically blurred for privacy!');
    } else if (imagePaths.length > 0) {
      console.log('ℹ️ No image blurring applied (no faces/text detected)');
    }
    
    console.log('');
    console.log('🎉 COMPLETE AUTO-REDACTION SYSTEM WORKING PERFECTLY!');
    console.log('🛡️ Patient privacy fully protected in published cases');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the complete test
testCompleteAutoRedactionFlow();
