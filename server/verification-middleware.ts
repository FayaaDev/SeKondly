/**
 * Case Verification Middleware
 * 
 * Integrates Google Cloud Vision + DLP verification into the case upload process.
 * This middleware can be used with Express routes to automatically verify
 * case content before saving to the database.
 */

import { Request, Response, NextFunction } from 'express';
import { CaseVerificationService, VerificationResult, VerificationOptions } from './verification-service.js';
import * as path from 'path';

// Extended request type to include verification results
export interface VerifiedRequest extends Request {
  verificationResult?: VerificationResult;
  skipVerification?: boolean;
}

/**
 * Configuration for the verification middleware
 */
export interface VerificationMiddlewareConfig {
  enabled: boolean;
  projectId?: string;
  keyFilename?: string;
  options?: VerificationOptions;
  onViolation?: 'reject' | 'flag' | 'manual_review';
  autoApproveThreshold?: number; // Confidence threshold for auto-approval
  requireManualReview?: boolean;
}

/**
 * Creates a verification middleware for case uploads
 */
export function createVerificationMiddleware(config: VerificationMiddlewareConfig) {
  return async (req: VerifiedRequest, res: Response, next: NextFunction) => {
    // Skip verification if disabled or explicitly skipped
    if (!config.enabled || req.skipVerification) {
      console.log('⏭️ Skipping case verification (disabled or skipped)');
      return next();
    }

    console.log('🔍 Starting case verification middleware...');

    try {
      // Initialize verification service
      const verificationService = new CaseVerificationService(
        config.projectId || process.env.GOOGLE_CLOUD_PROJECT_ID || '',
        config.keyFilename || process.env.GOOGLE_CLOUD_KEY_FILE
      );

      // Extract text content from case
      const textContent = extractTextFromCase(req.body);
      
      // Extract image paths from uploaded files
      const imagePaths = extractImagePaths(req.files as Express.Multer.File[]);

      console.log(`🔍 Verifying case with ${textContent.length} chars of text and ${imagePaths.length} images`);

      // Perform verification
      const verificationResult = await verificationService.verifyCaseContent(
        textContent,
        imagePaths,
        config.options || {}
      );

      // Store result in request for later use
      req.verificationResult = verificationResult;

      // Handle verification result based on configuration
      const response = handleVerificationResult(verificationResult, config);

      if (response.shouldProceed) {
        console.log('✅ Case verification passed, proceeding with upload');
        return next();
      } else {
        console.log('❌ Case verification failed, blocking upload');
        return res.status(400).json({
          success: false,
          message: response.message,
          verificationResult: {
            isValid: verificationResult.isValid,
            confidence: verificationResult.confidence,
            violations: verificationResult.violations.map(v => ({
              type: v.type,
              severity: v.severity,
              description: v.description,
              suggestion: v.suggestion
            })),
            suggestions: verificationResult.suggestions
          }
        });
      }

    } catch (error) {
      console.error('❌ Verification middleware error:', error);

      // In production, you might want to fail safely and allow the upload
      // but log the error for investigation
      if (process.env.NODE_ENV === 'production') {
        console.log('⚠️ Verification failed in production, allowing upload but flagging for review');
        req.verificationResult = {
          isValid: false,
          confidence: 0,
          violations: [{
            type: 'PII',
            severity: 'MEDIUM',
            description: 'Verification service unavailable - manual review required',
            confidence: 50,
            suggestion: 'Manual review required due to verification service error'
          }],
          suggestions: ['Manual review required due to verification service error'],
          processedImages: [],
          textAnalysis: {
            text: '',
            piiFindings: [],
            violations: []
          }
        };
        return next();
      } else {
        return res.status(500).json({
          success: false,
          message: 'Verification service temporarily unavailable',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  };
}

/**
 * Extract all text content from a case submission
 */
function extractTextFromCase(body: any): string {
  const textFields = [
    'title',
    'history',
    'chiefComplaint',
    'historyOfPresentIllness',
    'pastMedicalHistory',
    'familyHistory',
    'drugHistory',
    'systemicReview',
    'examination',
    'management'
  ];

  return textFields
    .map(field => body[field])
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Extract image file paths from multer files
 */
function extractImagePaths(files: Express.Multer.File[] | undefined): string[] {
  if (!files || !Array.isArray(files)) {
    return [];
  }

  return files.map(file => file.path);
}

/**
 * Handle verification result based on configuration
 */
function handleVerificationResult(
  result: VerificationResult,
  config: VerificationMiddlewareConfig
): { shouldProceed: boolean; message?: string } {
  const { onViolation = 'flag', autoApproveThreshold = 80, requireManualReview = false } = config;

  // Check for critical violations
  const criticalViolations = result.violations.filter(v => v.severity === 'CRITICAL');
  const highViolations = result.violations.filter(v => v.severity === 'HIGH');

  // Always reject critical violations
  if (criticalViolations.length > 0) {
    return {
      shouldProceed: false,
      message: `Critical privacy violations detected: ${criticalViolations.map(v => v.description).join(', ')}`
    };
  }

  // Handle based on configuration
  switch (onViolation) {
    case 'reject':
      if (!result.isValid) {
        return {
          shouldProceed: false,
          message: `Case contains privacy violations and cannot be published: ${result.violations.map(v => v.description).join(', ')}`
        };
      }
      break;

    case 'flag':
      // Allow upload but flag for review if violations exist
      if (result.violations.length > 0) {
        console.log(`⚠️ Case flagged for manual review: ${result.violations.length} violations found`);
        // The case will be uploaded but marked as requiring review
      }
      break;

    case 'manual_review':
      // Require manual review for any violations
      if (result.violations.length > 0 || requireManualReview) {
        return {
          shouldProceed: false,
          message: 'Case requires manual review before publication due to potential privacy concerns'
        };
      }
      break;
  }

  // Check auto-approval threshold
  if (result.confidence < autoApproveThreshold) {
    return {
      shouldProceed: false,
      message: `Case confidence score (${result.confidence}%) is below auto-approval threshold (${autoApproveThreshold}%)`
    };
  }

  return { shouldProceed: true };
}

/**
 * Utility function to add verification flags to case data
 */
export function addVerificationFlags(caseData: any, verificationResult: VerificationResult): any {
  return {
    ...caseData,
    verificationStatus: verificationResult.isValid ? 'verified' : 'flagged',
    verificationConfidence: verificationResult.confidence,
    requiresManualReview: verificationResult.violations.some(v => v.severity === 'HIGH' || v.severity === 'CRITICAL'),
    verificationViolations: verificationResult.violations.length,
    verificationTimestamp: new Date(),
    // Store simplified violation summary for database
    verificationSummary: verificationResult.violations.map(v => ({
      type: v.type,
      severity: v.severity,
      confidence: v.confidence
    }))
  };
}

/**
 * Admin route helper to get detailed verification results
 */
export function getDetailedVerificationResult(req: VerifiedRequest): VerificationResult | null {
  return req.verificationResult || null;
}

/**
 * Default configuration for development
 */
export const developmentConfig: VerificationMiddlewareConfig = {
  enabled: process.env.GOOGLE_CLOUD_PROJECT_ID ? true : false,
  onViolation: 'flag',
  autoApproveThreshold: 70,
  requireManualReview: false,
  options: {
    strictMode: false,
    allowLowRiskViolations: true,
    confidenceThreshold: 60
  }
};

/**
 * Default configuration for production
 */
export const productionConfig: VerificationMiddlewareConfig = {
  enabled: true,
  onViolation: 'reject',
  autoApproveThreshold: 85,
  requireManualReview: false,
  options: {
    strictMode: false,
    allowLowRiskViolations: false,
    confidenceThreshold: 80
  }
};

export default createVerificationMiddleware;
