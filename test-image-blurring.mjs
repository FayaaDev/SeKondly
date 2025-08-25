#!/usr/bin/env node

/**
 * Test Automatic Image Blurring with Face Detection
 */

import 'dotenv/config';
import { FinalDeidentificationService } from './server/final-deidentification-service.js';
import fs from 'fs';
import path from 'path';

async function testAutomaticImageBlurring() {
  console.log('🖼️ TESTING: Automatic Image Blurring with Face Detection\n');
  console.log('============================================================\n');

  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const keyFilename = process.env.GOOGLE_CLOUD_KEY_FILE;
    
    if (!projectId) {
      throw new Error('GOOGLE_CLOUD_PROJECT_ID not configured');
    }
    
    const deidentificationService = new FinalDeidentificationService(projectId, keyFilename);
    
    // Create a simple test case with text + images
    const testText = 'Patient Ahmed presents with chest pain. Dr. Sarah examined the patient.';
    
    // Check if we have any test images in uploads folder
    const uploadsDir = './uploads';
    let testImagePaths = [];
    
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      const imageFiles = files.filter(file => 
        file.toLowerCase().endsWith('.jpg') || 
        file.toLowerCase().endsWith('.jpeg') || 
        file.toLowerCase().endsWith('.png')
      );
      
      if (imageFiles.length > 0) {
        testImagePaths = imageFiles.slice(0, 2).map(file => path.join(uploadsDir, file));
        console.log(`📁 Found ${testImagePaths.length} test images:`, testImagePaths);
      }
    }
    
    if (testImagePaths.length === 0) {
      console.log('⚠️ No test images found in uploads folder');
      console.log('📝 Testing text de-identification only...');
    } else {
      console.log('🖼️ Testing with images for face detection and blurring...');
    }
    
    console.log('📝 Original text:', testText);
    console.log('');
    
    // Run the complete de-identification process
    const result = await deidentificationService.processCase(
      testText,
      testImagePaths,
      { 
        detectOnly: false,
        redactText: true,
        blurImages: true,
        redactionStyle: 'smart'
      }
    );
    
    console.log('🔍 DETECTION RESULTS:');
    console.log('Valid:', result.isValid);
    console.log('Violations found:', result.violations.length);
    
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
      console.log('Total redactions:', result.deidentification.redactionsSummary.totalRedactions);
      console.log('Text redactions:', result.deidentification.redactionsSummary.textRedactions);
      console.log('Image redactions:', result.deidentification.redactionsSummary.imageRedactions);
      console.log('Categories:', result.deidentification.redactionsSummary.categoriesRedacted);
      
      console.log('');
      console.log('📝 REDACTED TEXT:');
      console.log(result.deidentification.redactedText);
      
      if (result.deidentification.redactedImages.length > 0) {
        console.log('');
        console.log('🖼️ IMAGE PROCESSING RESULTS:');
        result.deidentification.redactedImages.forEach((img, index) => {
          console.log(`  Image ${index + 1}: ${img.originalPath}`);
          console.log(`    → Faces blurred: ${img.facesBlurred}`);
          console.log(`    → Text regions blurred: ${img.textRegionsBlurred}`);
          console.log(`    → Saved as: ${img.redactedPath}`);
          console.log(`    → Redactions applied: ${img.redactionsApplied.join(', ')}`);
        });
        
        console.log('');
        console.log('✅ SUCCESS: Images automatically processed for privacy protection!');
      } else {
        console.log('');
        console.log('ℹ️ No image processing needed (no faces/text detected)');
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
testAutomaticImageBlurring();
