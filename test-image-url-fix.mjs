#!/usr/bin/env node

/**
 * Test Image URL Update Fix
 */

import 'dotenv/config';
import { FinalDeidentificationService } from './server/final-deidentification-service.js';
import fs from 'fs';
import path from 'path';

async function testImageUrlUpdate() {
  console.log('🔧 TESTING: Image URL Update Fix\n');
  console.log('============================================================\n');

  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const keyFilename = process.env.GOOGLE_CLOUD_KEY_FILE;
    
    if (!projectId) {
      throw new Error('GOOGLE_CLOUD_PROJECT_ID not configured');
    }
    
    // Simulate the routes.ts flow exactly
    const files = [{ 
      path: './uploads/1756137419065_135277538.jpg',
      filename: '1756137419065_135277538.jpg'
    }];
    
    // Check if the test image exists
    if (!fs.existsSync(files[0].path)) {
      console.log('⚠️ Test image not found, using available image...');
      const uploadsDir = './uploads';
      if (fs.existsSync(uploadsDir)) {
        const availableFiles = fs.readdirSync(uploadsDir).filter(f => 
          f.endsWith('.jpg') || f.endsWith('.png')
        );
        if (availableFiles.length > 0) {
          files[0] = {
            path: path.join(uploadsDir, availableFiles[0]),
            filename: availableFiles[0]
          };
        }
      }
    }
    
    // Step 1: Initial URLs (like in routes.ts)
    let imageUrls = files.map(file => `/uploads/${file.filename}`);
    console.log('📁 ORIGINAL IMAGE URLs:', imageUrls);
    
    // Step 2: Simulate caseData creation (like in routes.ts)
    let caseData = {
      title: 'Test Case',
      history: 'Patient Ahmed has chest pain',
      imageUrls: [...imageUrls], // Copy of original URLs
      specialty: 'Cardiology'
    };
    
    console.log('📋 CASE DATA BEFORE:', {
      imageUrls: caseData.imageUrls
    });
    
    // Step 3: Run de-identification
    const deidentificationService = new FinalDeidentificationService(projectId, keyFilename);
    const imagePaths = files.map(file => file.path);
    
    const result = await deidentificationService.processCase(
      caseData.title + '\n\n' + caseData.history,
      imagePaths,
      { 
        detectOnly: false,
        redactText: true,
        blurImages: true,
        redactionStyle: 'smart'
      }
    );
    
    // Step 4: Apply the fix (same as in routes.ts now)
    if ('deidentification' in result && result.deidentification && 
        result.deidentification.redactedImages.length > 0) {
      
      console.log('');
      console.log('🖼️ PROCESSING BLURRED IMAGES...');
      const blurredImageUrls = [];
      
      for (const redactedImage of result.deidentification.redactedImages) {
        console.log(`🔄 Processed: ${redactedImage.originalPath}`);
        console.log(`  → Blurred: ${redactedImage.redactedPath}`);
        
        // Convert file path to URL for the blurred image
        const filename = redactedImage.redactedPath.split('/').pop();
        const blurredUrl = `/uploads/${filename}`;
        blurredImageUrls.push(blurredUrl);
      }
      
      // Apply the fix
      if (blurredImageUrls.length > 0) {
        imageUrls = blurredImageUrls;
        // ✅ THE CRITICAL FIX
        caseData.imageUrls = blurredImageUrls;
        console.log('');
        console.log(`🔒 APPLIED FIX: Updated ${blurredImageUrls.length} image URLs`);
        console.log('📝 New imageUrls variable:', imageUrls);
        console.log('📝 New caseData.imageUrls:', caseData.imageUrls);
      }
    }
    
    console.log('');
    console.log('📋 FINAL CASE DATA (what gets saved):');
    console.log('Title:', caseData.title);
    console.log('History:', caseData.history);
    console.log('Image URLs:', caseData.imageUrls);
    
    // Validation
    const hasBlurredUrls = caseData.imageUrls.some(url => url.includes('_redacted'));
    if (hasBlurredUrls) {
      console.log('');
      console.log('✅ SUCCESS: Case data contains blurred image URLs!');
      console.log('🔧 The fix is working correctly!');
    } else {
      console.log('');
      console.log('❌ ISSUE: Case data still has original URLs');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testImageUrlUpdate();
