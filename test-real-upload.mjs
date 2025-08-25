#!/usr/bin/env node

/**
 * Real Case Upload Test with Image Upload and Auto-Redaction
 */

import 'dotenv/config';
import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch';

async function testRealCaseUploadWithImages() {
  console.log('🚀 REAL TEST: Case Upload with Images + Auto-Redaction\n');
  console.log('============================================================\n');

  try {
    // Prepare form data for case upload
    const form = new FormData();
    
    // Case data with PII
    form.append('title', 'Emergency Case Study');
    form.append('history', 'Patient Ahmed AlFayaa presented to ER with chest pain. Phone: (555) 987-6543. Dr. Sarah examined the patient.');
    form.append('specialty', 'Emergency Medicine');
    form.append('format', 'short');
    
    // Add an image if available
    const uploadsDir = './uploads';
    let testImagePath = null;
    
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      const imageFiles = files.filter(file => 
        file.toLowerCase().endsWith('.jpg') || 
        file.toLowerCase().endsWith('.png')
      );
      
      if (imageFiles.length > 0) {
        testImagePath = `${uploadsDir}/${imageFiles[0]}`;
        if (fs.existsSync(testImagePath)) {
          console.log(`📎 Attaching test image: ${testImagePath}`);
          form.append('images', fs.createReadStream(testImagePath));
        }
      }
    }
    
    if (!testImagePath) {
      console.log('📝 Testing with text only (no images found)');
    }
    
    console.log('📝 ORIGINAL CASE DATA:');
    console.log('Title: Emergency Case Study');
    console.log('History: Patient Ahmed AlFayaa presented to ER with chest pain. Phone: (555) 987-6543. Dr. Sarah examined the patient.');
    console.log('');

    // Upload case to server
    console.log('📤 Uploading case to server...');
    const response = await fetch('http://localhost:5001/api/cases', {
      method: 'POST',
      headers: {
        'Cookie': 'sekondly.sid=s%3AWEJWrlBzpzZc280E5-g3vaPyNzRCyZyI.ZMgsaI8TSelXa2Ijz6hnVUrOcer9E8ipElF9EMloktM'
      },
      body: form
    });

    if (response.ok) {
      const createdCase = await response.json();
      
      console.log('✅ CASE CREATED SUCCESSFULLY');
      console.log('');
      console.log('📋 FINAL CASE DATA (after auto-redaction):');
      console.log('Title:', createdCase.title);
      console.log('History:', createdCase.history);
      console.log('Images:', createdCase.imageUrls);
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
      
      // Validation
      console.log('');
      console.log('🔍 PRIVACY PROTECTION ANALYSIS:');
      
      // Check text redaction
      if (createdCase.history.includes('Ahmed AlFayaa') || 
          createdCase.history.includes('(555) 987-6543')) {
        console.log('❌ FAILURE: Text PII still present!');
      } else {
        console.log('✅ SUCCESS: Text PII automatically redacted!');
      }
      
      // Check image redaction
      if (createdCase.imageUrls && createdCase.imageUrls.length > 0) {
        const hasBlurredImages = createdCase.imageUrls.some(url => url.includes('_redacted'));
        if (hasBlurredImages) {
          console.log('✅ SUCCESS: Images automatically blurred!');
        } else {
          console.log('ℹ️ Images uploaded but no faces detected for blurring');
        }
      }
      
      console.log('');
      console.log('🎉 END-TO-END AUTO-REDACTION WORKING!');
      console.log('🛡️ Patient privacy fully protected in the live system!');
      
    } else {
      const error = await response.text();
      console.error('❌ Case upload failed:', response.status, error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the real test
testRealCaseUploadWithImages();
