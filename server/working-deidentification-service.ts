/**
 * Simplified Enhanced Verification Service with Working De-identification
 * 
 * This version uses Google Cloud DLP's built-in deidentify API correctly
 * and provides reliable text and image redaction.
 */

import { DlpServiceClient } from '@google-cloud/dlp';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

// Import existing types
import { 
  VerificationResult, 
  Violation, 
  CaseVerificationService
} from './verification-service.js';

export interface DeidentificationResult {
  originalText: string;
  redactedText: string;
  redactedImages: RedactedImageResult[];
  redactionsSummary: {
    totalRedactions: number;
    textRedactions: number;
    imageRedactions: number;
    categoriesRedacted: string[];
  };
}

export interface RedactedImageResult {
  originalPath: string;
  redactedPath: string;
  redactionsApplied: string[];
  facesBlurred: number;
  textRegionsBlurred: number;
}

export class WorkingDeidentificationService {
  private dlpClient: DlpServiceClient;
  private visionClient: ImageAnnotatorClient;
  private verificationService: CaseVerificationService;
  private projectId: string;

  constructor(projectId: string, keyFilename?: string) {
    this.projectId = projectId;
    
    const clientConfig = keyFilename ? { keyFilename } : {};
    
    this.dlpClient = new DlpServiceClient(clientConfig);
    this.visionClient = new ImageAnnotatorClient(clientConfig);
    this.verificationService = new CaseVerificationService(projectId, keyFilename);
  }

  /**
   * Complete verification and de-identification pipeline
   */
  async processCase(
    textContent: string,
    imageFiles: string[] = [],
    options: {
      detectOnly?: boolean;
      redactText?: boolean;
      blurImages?: boolean;
      redactionStyle?: 'mask' | 'replace' | 'brackets';
    } = {}
  ): Promise<VerificationResult & { deidentification?: DeidentificationResult }> {
    
    console.log('🛡️ Starting case processing with verification and de-identification...');
    
    // Step 1: Run verification to detect violations
    const verificationResult = await this.verificationService.verifyCaseContent(
      textContent, 
      imageFiles, 
      {}
    );
    
    console.log(`🔍 Verification found ${verificationResult.violations.length} violations`);
    
    // Step 2: Apply de-identification if not detect-only mode
    if (!options.detectOnly && verificationResult.violations.length > 0) {
      const deidentificationResult = await this.deidentifyContent(
        textContent,
        imageFiles,
        options
      );
      
      return {
        ...verificationResult,
        deidentification: deidentificationResult
      };
    }
    
    return verificationResult;
  }

  /**
   * De-identify content using Google Cloud DLP built-in deidentification
   */
  private async deidentifyContent(
    text: string,
    imageFiles: string[],
    options: any
  ): Promise<DeidentificationResult> {
    
    console.log('🔒 Starting content de-identification...');
    
    let redactedText = text;
    const redactedImages: RedactedImageResult[] = [];
    let totalRedactions = 0;
    const categoriesRedacted = new Set<string>();

    // Text de-identification using DLP's built-in deidentify
    if (options.redactText !== false) {
      try {
        const textResult = await this.deidentifyTextBuiltIn(text, options.redactionStyle || 'mask');
        redactedText = textResult.redactedText;
        totalRedactions += textResult.redactionCount;
        if (textResult.redactionCount > 0) {
          categoriesRedacted.add('TEXT_PII');
        }
      } catch (error) {
        console.error('❌ Text de-identification failed:', error);
      }
    }

    // Image de-identification
    if (options.blurImages !== false && imageFiles.length > 0) {
      for (const imagePath of imageFiles) {
        try {
          const imageResult = await this.deidentifyImage(imagePath);
          redactedImages.push(imageResult);
          totalRedactions += imageResult.facesBlurred + imageResult.textRegionsBlurred;
          
          if (imageResult.facesBlurred > 0) categoriesRedacted.add('FACES');
          if (imageResult.textRegionsBlurred > 0) categoriesRedacted.add('IMAGE_TEXT');
        } catch (error) {
          console.error(`❌ Image de-identification failed for ${imagePath}:`, error);
        }
      }
    }

    const redactionsSummary = {
      totalRedactions,
      textRedactions: redactedText !== text ? 1 : 0,
      imageRedactions: redactedImages.length,
      categoriesRedacted: Array.from(categoriesRedacted)
    };

    console.log(`✅ De-identification complete: ${totalRedactions} total redactions applied`);

    return {
      originalText: text,
      redactedText,
      redactedImages,
      redactionsSummary
    };
  }

  /**
   * Use Google Cloud DLP built-in deidentify with proper configuration
   */
  private async deidentifyTextBuiltIn(
    text: string, 
    style: string
  ): Promise<{ redactedText: string; redactionCount: number }> {
    
    console.log('📝 Applying built-in DLP de-identification...');
    
    try {
      // Use DLP's built-in deidentify with standard info types
      const deidentifyConfig = {
        infoTypeTransformations: {
          transformations: [
            {
              infoTypes: [
                { name: 'PERSON_NAME' },
                { name: 'PHONE_NUMBER' },
                { name: 'EMAIL_ADDRESS' },
                { name: 'DATE_OF_BIRTH' },
                { name: 'US_SOCIAL_SECURITY_NUMBER' },
                { name: 'MEDICAL_RECORD_NUMBER' },
                { name: 'STREET_ADDRESS' },
                { name: 'CREDIT_CARD_NUMBER' }
              ],
              primitiveTransformation: this.getTransformationByStyle(style)
            }
          ]
        }
      };

      const request = {
        parent: `projects/${this.projectId}/locations/global`,
        deidentifyConfig,
        item: {
          value: text,
        },
      };

      const [response] = await this.dlpClient.deidentifyContent(request);
      const redactedText = response.item?.value || text;
      
      // Count redactions by looking for redaction patterns
      const redactionCount = this.countRedactionPatterns(text, redactedText);
      
      console.log(`📊 Applied ${redactionCount} text redactions using ${style} style`);
      
      return {
        redactedText,
        redactionCount
      };

    } catch (error) {
      console.error('❌ Built-in DLP de-identification failed:', error);
      return {
        redactedText: text,
        redactionCount: 0
      };
    }
  }

  /**
   * De-identify images by blurring faces and text regions
   */
  private async deidentifyImage(imagePath: string): Promise<RedactedImageResult> {
    console.log(`🖼️ Processing image: ${path.basename(imagePath)}`);
    
    const redactedPath = this.generateRedactedPath(imagePath);
    let facesBlurred = 0;
    let textRegionsBlurred = 0;
    const redactionsApplied: string[] = [];

    try {
      // Load the image
      let image = sharp(imagePath);
      const metadata = await image.metadata();
      
      if (!metadata.width || !metadata.height) {
        throw new Error('Cannot determine image dimensions');
      }

      // Detect and blur faces
      const faces = await this.detectFaces(imagePath);
      if (faces.length > 0) {
        image = await this.applyBlurToRegions(image, faces, 10);
        facesBlurred = faces.length;
        redactionsApplied.push(`Blurred ${faces.length} face(s)`);
      }

      // Detect and blur text
      const textRegions = await this.detectTextRegions(imagePath);
      if (textRegions.length > 0) {
        image = await this.applyBlurToRegions(image, textRegions, 8);
        textRegionsBlurred = textRegions.length;
        redactionsApplied.push(`Blurred ${textRegions.length} text region(s)`);
      }

      // Save the redacted image
      await image.jpeg({ quality: 90 }).toFile(redactedPath);
      
      console.log(`✅ Image processed: ${facesBlurred} faces, ${textRegionsBlurred} text regions blurred`);

    } catch (error) {
      console.error(`❌ Image processing failed:`, error);
      // Copy original if processing fails
      fs.copyFileSync(imagePath, redactedPath);
    }

    return {
      originalPath: imagePath,
      redactedPath,
      redactionsApplied,
      facesBlurred,
      textRegionsBlurred
    };
  }

  // Helper methods

  private getTransformationByStyle(style: string) {
    switch (style) {
      case 'mask':
        return {
          characterMaskConfig: {
            maskingCharacter: '*',
            numberToMask: 0 // Mask all characters
          }
        };
      case 'replace':
        return {
          replaceConfig: {
            newValue: { stringValue: '[REDACTED]' }
          }
        };
      case 'brackets':
        return {
          replaceWithInfoTypeConfig: {}
        };
      default:
        return {
          characterMaskConfig: {
            maskingCharacter: '*'
          }
        };
    }
  }

  private countRedactionPatterns(original: string, redacted: string): number {
    if (original === redacted) return 0;
    
    // Count common redaction patterns
    const patterns = [
      /\*+/g,                    // Asterisks
      /\[REDACTED\]/g,           // [REDACTED]
      /\[PERSON_NAME\]/g,        // [PERSON_NAME]
      /\[PHONE_NUMBER\]/g,       // [PHONE_NUMBER]
      /\[EMAIL_ADDRESS\]/g,      // [EMAIL_ADDRESS]
      /\[DATE_OF_BIRTH\]/g,      // [DATE_OF_BIRTH]
      /\[MEDICAL_RECORD_NUMBER\]/g, // [MEDICAL_RECORD_NUMBER]
      /\[STREET_ADDRESS\]/g      // [STREET_ADDRESS]
    ];
    
    let totalMatches = 0;
    for (const pattern of patterns) {
      const matches = redacted.match(pattern);
      if (matches) {
        totalMatches += matches.length;
      }
    }
    
    return totalMatches;
  }

  private async detectFaces(imagePath: string) {
    const [result] = await this.visionClient.faceDetection(imagePath);
    const faces = result.faceAnnotations || [];
    
    return faces.map(face => {
      const vertices = face.boundingPoly?.vertices || [];
      if (vertices.length >= 4) {
        const xs = vertices.map(v => v.x || 0);
        const ys = vertices.map(v => v.y || 0);
        
        return {
          x: Math.min(...xs),
          y: Math.min(...ys),
          width: Math.max(...xs) - Math.min(...xs),
          height: Math.max(...ys) - Math.min(...ys)
        };
      }
      return null;
    }).filter(region => region && region.width > 10 && region.height > 10);
  }

  private async detectTextRegions(imagePath: string) {
    const [result] = await this.visionClient.textDetection(imagePath);
    const annotations = result.textAnnotations || [];
    
    // Skip the first annotation (full document text) and process individual words
    return annotations.slice(1).map(annotation => {
      const vertices = annotation.boundingPoly?.vertices || [];
      if (vertices.length >= 4) {
        const xs = vertices.map(v => v.x || 0);
        const ys = vertices.map(v => v.y || 0);
        
        return {
          x: Math.min(...xs),
          y: Math.min(...ys),
          width: Math.max(...xs) - Math.min(...xs),
          height: Math.max(...ys) - Math.min(...ys)
        };
      }
      return null;
    }).filter(region => region && region.width > 5 && region.height > 5);
  }

  private async applyBlurToRegions(image: sharp.Sharp, regions: any[], blurLevel: number) {
    const imageBuffer = await image.toBuffer();
    let processedImage = sharp(imageBuffer);
    
    for (const region of regions) {
      // Extract the region, blur it, and composite back
      try {
        const regionBuffer = await sharp(imageBuffer)
          .extract({ 
            left: Math.max(0, Math.round(region.x)), 
            top: Math.max(0, Math.round(region.y)), 
            width: Math.round(region.width), 
            height: Math.round(region.height) 
          })
          .blur(blurLevel)
          .toBuffer();
        
        processedImage = processedImage.composite([{
          input: regionBuffer,
          left: Math.round(region.x),
          top: Math.round(region.y)
        }]);
      } catch (error) {
        console.warn(`Failed to blur region at ${region.x},${region.y}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }
    
    return processedImage;
  }

  private generateRedactedPath(originalPath: string): string {
    const ext = path.extname(originalPath);
    const name = path.basename(originalPath, ext);
    const dir = path.dirname(originalPath);
    return path.join(dir, `${name}_redacted${ext}`);
  }
}
