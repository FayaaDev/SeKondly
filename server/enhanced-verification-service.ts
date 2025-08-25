/**
 * Enhanced Case Verification Service with De-identification
 * 
 * This enhanced service not only detects privacy violations but also
 * automatically redacts/de-identifies sensitive information.
 * 
 * Features:
 * - Text PII redaction with smart replacements
 * - Image face blurring and text redaction
 * - Configurable redaction levels
 * - Preserve medical context while protecting privacy
 */

import { ImageAnnotatorClient } from '@google-cloud/vision';
import { DlpServiceClient } from '@google-cloud/dlp';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

// Enhanced types for de-identification
export interface DeidentificationOptions {
  enabled: boolean;
  textRedaction: {
    enabled: boolean;
    preserveContext: boolean; // Keep medical terms, redact personal info
    replacementStyle: 'brackets' | 'asterisks' | 'generic'; // [REDACTED], ****, Generic Patient
  };
  imageRedaction: {
    enabled: boolean;
    blurFaces: boolean;
    blurText: boolean;
    blurIntensity: number; // 1-10
  };
  outputOriginal: boolean; // Keep original versions alongside redacted
}

export interface DeidentificationResult {
  originalText: string;
  redactedText: string;
  redactedImages: RedactedImageResult[];
  redactionsSummary: RedactionSummary;
}

export interface RedactedImageResult {
  originalPath: string;
  redactedPath: string;
  redactionsApplied: string[];
  facesBlurred: number;
  textRegionsBlurred: number;
}

export interface RedactionSummary {
  totalRedactions: number;
  textRedactions: number;
  imageRedactions: number;
  categoriesRedacted: string[];
}

// Import existing types from verification service
import { 
  VerificationResult, 
  Violation, 
  ImageAnalysisResult, 
  TextAnalysisResult 
} from './verification-service.js';

export class EnhancedCaseVerificationService {
  private visionClient: ImageAnnotatorClient;
  private dlpClient: DlpServiceClient;
  private projectId: string;

  constructor(projectId: string, keyFilename?: string) {
    this.projectId = projectId;
    
    const clientConfig = keyFilename 
      ? { keyFilename } 
      : {}; // Uses default credentials

    this.visionClient = new ImageAnnotatorClient(clientConfig);
    this.dlpClient = new DlpServiceClient(clientConfig);
  }

  /**
   * Enhanced verification with automatic de-identification
   */
  async verifyAndDeidentifyCase(
    textContent: string,
    imageFiles: string[],
    options: DeidentificationOptions
  ): Promise<VerificationResult & { deidentification: DeidentificationResult }> {
    
    console.log('🛡️ Starting enhanced verification with de-identification...');
    
    // First, run standard verification
    const verificationResult = await this.verifyCaseContent(textContent, imageFiles, {});
    
    // Then apply de-identification if enabled
    let deidentificationResult: DeidentificationResult | null = null;
    
    if (options.enabled) {
      deidentificationResult = await this.deidentifyContent(
        textContent, 
        imageFiles, 
        verificationResult.violations,
        options
      );
    }

    return {
      ...verificationResult,
      deidentification: deidentificationResult || {
        originalText: textContent,
        redactedText: textContent,
        redactedImages: [],
        redactionsSummary: { totalRedactions: 0, textRedactions: 0, imageRedactions: 0, categoriesRedacted: [] }
      }
    };
  }

  /**
   * De-identify content based on detected violations
   */
  private async deidentifyContent(
    text: string,
    imageFiles: string[],
    violations: Violation[],
    options: DeidentificationOptions
  ): Promise<DeidentificationResult> {
    
    console.log('🔒 Starting de-identification process...');
    
    let redactedText = text;
    const redactedImages: RedactedImageResult[] = [];
    let totalRedactions = 0;
    const categoriesRedacted = new Set<string>();

    // Text de-identification
    if (options.textRedaction.enabled) {
      const textResult = await this.deidentifyText(text, violations, options.textRedaction);
      redactedText = textResult.redactedText;
      totalRedactions += textResult.redactionCount;
      textResult.categories.forEach(cat => categoriesRedacted.add(cat));
    }

    // Image de-identification  
    if (options.imageRedaction.enabled && imageFiles.length > 0) {
      for (const imagePath of imageFiles) {
        const imageResult = await this.deidentifyImage(imagePath, options.imageRedaction);
        redactedImages.push(imageResult);
        totalRedactions += imageResult.facesBlurred + imageResult.textRegionsBlurred;
        if (imageResult.facesBlurred > 0) categoriesRedacted.add('FACES');
        if (imageResult.textRegionsBlurred > 0) categoriesRedacted.add('IMAGE_TEXT');
      }
    }

    const redactionsSummary: RedactionSummary = {
      totalRedactions,
      textRedactions: redactedText !== text ? 1 : 0,
      imageRedactions: redactedImages.length,
      categoriesRedacted: Array.from(categoriesRedacted)
    };

    console.log(`✅ De-identification complete: ${totalRedactions} redactions applied`);

    return {
      originalText: text,
      redactedText,
      redactedImages,
      redactionsSummary
    };
  }

  /**
   * De-identify text using Google Cloud DLP
   */
  private async deidentifyText(
    text: string, 
    violations: Violation[],
    options: any
  ): Promise<{ redactedText: string; redactionCount: number; categories: string[] }> {
    
    console.log('📝 De-identifying text content...');
    
    try {
      // Get unique info types from violations (remove duplicates)
      const uniqueInfoTypes = Array.from(new Set(
        violations.map(v => this.mapViolationToDlpType(v.type))
      )).map(name => ({ name }));
      
      if (uniqueInfoTypes.length === 0) {
        console.log('⚠️ No valid info types found for de-identification');
        return {
          redactedText: text,
          redactionCount: 0,
          categories: []
        };
      }

      const deidentifyConfig = {
        infoTypeTransformations: {
          transformations: [
            {
              infoTypes: uniqueInfoTypes,
              primitiveTransformation: this.getTransformationConfig(options.replacementStyle)
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
      
      // Count redactions by comparing original vs redacted
      const redactionCount = this.countRedactions(text, redactedText);
      const categories = violations.map(v => v.type);

      console.log(`📊 Applied ${redactionCount} text redactions`);
      
      return {
        redactedText,
        redactionCount,
        categories
      };

    } catch (error) {
      console.error('❌ Text de-identification failed:', error);
      // Return original text if de-identification fails
      return {
        redactedText: text,
        redactionCount: 0,
        categories: []
      };
    }
  }

  /**
   * De-identify images by blurring faces and text
   */
  private async deidentifyImage(
    imagePath: string,
    options: any
  ): Promise<RedactedImageResult> {
    
    console.log(`🖼️ De-identifying image: ${path.basename(imagePath)}`);
    
    const redactedPath = this.generateRedactedImagePath(imagePath);
    let facesBlurred = 0;
    let textRegionsBlurred = 0;
    const redactionsApplied: string[] = [];

    try {
      // Load image with Sharp
      let image = sharp(imagePath);
      const metadata = await image.metadata();
      
      if (!metadata.width || !metadata.height) {
        throw new Error('Could not determine image dimensions');
      }

      // Detect faces for blurring
      if (options.blurFaces) {
        const faceRegions = await this.detectFaces(imagePath);
        if (faceRegions.length > 0) {
          image = await this.blurRegions(image, faceRegions, options.blurIntensity);
          facesBlurred = faceRegions.length;
          redactionsApplied.push('Face blurring');
        }
      }

      // Detect and blur text regions
      if (options.blurText) {
        const textRegions = await this.detectTextRegions(imagePath);
        if (textRegions.length > 0) {
          image = await this.blurRegions(image, textRegions, options.blurIntensity);
          textRegionsBlurred = textRegions.length;
          redactionsApplied.push('Text blurring');
        }
      }

      // Save redacted image
      await image.jpeg({ quality: 90 }).toFile(redactedPath);
      
      console.log(`✅ Image redacted: ${facesBlurred} faces, ${textRegionsBlurred} text regions`);

    } catch (error) {
      console.error(`❌ Image de-identification failed for ${imagePath}:`, error);
      // Copy original if redaction fails
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

  /**
   * Helper method to use original verification service
   */
  async verifyCaseContent(
    textContent: string,
    imageFiles: string[],
    options: any
  ): Promise<VerificationResult> {
    // Import and use original verification service
    const { CaseVerificationService } = await import('./verification-service.js');
    const originalService = new CaseVerificationService(this.projectId, process.env.GOOGLE_CLOUD_KEY_FILE);
    return originalService.verifyCaseContent(textContent, imageFiles, options);
  }

  // Helper methods for de-identification

  private mapViolationToDlpType(violationType: string): string {
    const typeMap: Record<string, string> = {
      'PATIENT_NAME': 'PERSON_NAME',
      'PHONE': 'PHONE_NUMBER',
      'EMAIL': 'EMAIL_ADDRESS',
      'DATE_OF_BIRTH': 'DATE_OF_BIRTH',
      'SSN': 'US_SOCIAL_SECURITY_NUMBER',
      'MEDICAL_RECORD_NUMBER': 'MEDICAL_RECORD_NUMBER',
      'ADDRESS': 'STREET_ADDRESS',
      'MEDICAL_ID': 'GENERIC_ID'
    };
    return typeMap[violationType] || 'GENERIC_ID';
  }

  private getTransformationConfig(style: string) {
    switch (style) {
      case 'brackets':
        return {
          replaceWithInfoTypeConfig: {
            infoType: { name: 'REDACTED' }
          }
        };
      case 'asterisks':
        return {
          characterMaskConfig: {
            maskingCharacter: '*'
          }
        };
      case 'generic':
        return {
          replaceConfig: {
            newValue: { stringValue: '[REDACTED]' }
          }
        };
      default:
        return {
          replaceConfig: {
            newValue: { stringValue: '[REDACTED]' }
          }
        };
    }
  }

  private countRedactions(original: string, redacted: string): number {
    // Simple count of [REDACTED] or similar patterns
    const redactionPattern = /\[REDACTED\]|\*+|XXX+/g;
    const matches = redacted.match(redactionPattern);
    return matches ? matches.length : 0;
  }

  private async detectFaces(imagePath: string): Promise<Array<{x: number, y: number, width: number, height: number}>> {
    try {
      const [result] = await this.visionClient.faceDetection(imagePath);
      const faces = result.faceAnnotations || [];
      
      return faces.map(face => {
        const vertices = face.boundingPoly?.vertices || [];
        if (vertices.length >= 2) {
          const x = Math.min(...vertices.map(v => v.x || 0));
          const y = Math.min(...vertices.map(v => v.y || 0));
          const maxX = Math.max(...vertices.map(v => v.x || 0));
          const maxY = Math.max(...vertices.map(v => v.y || 0));
          
          return {
            x,
            y,
            width: maxX - x,
            height: maxY - y
          };
        }
        return { x: 0, y: 0, width: 0, height: 0 };
      }).filter(region => region.width > 0 && region.height > 0);
      
    } catch (error) {
      console.error('Face detection failed:', error);
      return [];
    }
  }

  private async detectTextRegions(imagePath: string): Promise<Array<{x: number, y: number, width: number, height: number}>> {
    try {
      const [result] = await this.visionClient.textDetection(imagePath);
      const textAnnotations = result.textAnnotations || [];
      
      // Skip the first annotation (full text) and process individual words/lines
      return textAnnotations.slice(1).map(annotation => {
        const vertices = annotation.boundingPoly?.vertices || [];
        if (vertices.length >= 2) {
          const x = Math.min(...vertices.map(v => v.x || 0));
          const y = Math.min(...vertices.map(v => v.y || 0));
          const maxX = Math.max(...vertices.map(v => v.x || 0));
          const maxY = Math.max(...vertices.map(v => v.y || 0));
          
          return {
            x,
            y,
            width: maxX - x,
            height: maxY - y
          };
        }
        return { x: 0, y: 0, width: 0, height: 0 };
      }).filter(region => region.width > 0 && region.height > 0);
      
    } catch (error) {
      console.error('Text detection failed:', error);
      return [];
    }
  }

  private async blurRegions(
    image: sharp.Sharp,
    regions: Array<{x: number, y: number, width: number, height: number}>,
    intensity: number
  ): Promise<sharp.Sharp> {
    
    // Apply blur to each region
    for (const region of regions) {
      // Extract region, blur it, then composite back
      const blurredRegion = await image
        .extract({ 
          left: Math.max(0, region.x), 
          top: Math.max(0, region.y), 
          width: region.width, 
          height: region.height 
        })
        .blur(intensity)
        .toBuffer();
      
      // Composite the blurred region back onto the image
      image = image.composite([{
        input: blurredRegion,
        left: region.x,
        top: region.y
      }]);
    }
    
    return image;
  }

  private generateRedactedImagePath(originalPath: string): string {
    const ext = path.extname(originalPath);
    const name = path.basename(originalPath, ext);
    const dir = path.dirname(originalPath);
    return path.join(dir, `${name}_redacted${ext}`);
  }
}
