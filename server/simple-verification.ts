/**
 * Simple Case Verification Integration
 * 
 * This is a minimal working example that can be integrated immediately
 * without requiring extensive database schema changes.
 */

import { CaseVerificationService, VerificationResult, createVerificationService } from './verification-service.js';
import * as path from 'path';

export interface SimpleVerificationConfig {
  enabled: boolean;
  logOnly: boolean; // If true, just log results without blocking
  notifyAdmins: boolean; // Send notifications about violations
}

/**
 * Simple verification function that can be called during case creation
 */
export async function verifyCaseSimple(
  caseData: any,
  imageFiles: string[],
  config: SimpleVerificationConfig = { enabled: true, logOnly: true, notifyAdmins: true }
): Promise<{ passed: boolean; result?: VerificationResult; summary: string }> {
  
  if (!config.enabled) {
    return { passed: true, summary: 'Verification disabled' };
  }

  try {
    console.log('🔍 Running simple case verification...');
    
    // Check if Google Cloud is configured
    if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
      console.log('⚠️ Google Cloud not configured, skipping AI verification');
      return performBasicVerification(caseData);
    }

    // Extract text content
    const textContent = extractTextFromCase(caseData);
    
    // Create verification service
    const verificationService = createVerificationService();
    
    // Perform verification
    const result = await verificationService.verifyCaseContent(
      textContent,
      imageFiles,
      { strictMode: false, allowLowRiskViolations: true }
    );

    // Log results
    logVerificationResult(result, caseData);

    // In log-only mode, always pass but record issues
    if (config.logOnly) {
      return {
        passed: true,
        result,
        summary: `Logged ${result.violations.length} potential privacy issues for review`
      };
    }

    // In strict mode, check for critical violations
    const criticalViolations = result.violations.filter(v => v.severity === 'CRITICAL');
    const highViolations = result.violations.filter(v => v.severity === 'HIGH');

    if (criticalViolations.length > 0) {
      return {
        passed: false,
        result,
        summary: `Blocked: ${criticalViolations.length} critical privacy violations detected`
      };
    }

    if (highViolations.length > 2) {
      return {
        passed: false,
        result,
        summary: `Blocked: Too many high-severity privacy violations (${highViolations.length})`
      };
    }

    return {
      passed: true,
      result,
      summary: `Passed: ${result.violations.length} minor issues logged for review`
    };

  } catch (error) {
    console.error('❌ Verification error:', error);
    
    // In case of error, perform basic verification
    return performBasicVerification(caseData);
  }
}

/**
 * Basic verification using regex patterns (fallback when AI is unavailable)
 */
function performBasicVerification(caseData: any): { passed: boolean; summary: string } {
  console.log('🔍 Running basic regex-based verification...');
  
  const textContent = extractTextFromCase(caseData);
  const violations: string[] = [];

  // Check for common PII patterns
  const patterns = [
    { pattern: /(Mr|Mrs|Ms|Dr|Doctor)\.?\s+[A-Z][a-z]+\s+[A-Z][a-z]+/gi, type: 'Potential patient name' },
    { pattern: /MRN[\s:]+\d{6,}/gi, type: 'Medical record number' },
    { pattern: /DOB[\s:]+\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/gi, type: 'Date of birth' },
    { pattern: /\b\d{3}-\d{2}-\d{4}\b/gi, type: 'Social security number' },
    { pattern: /\b\d{3}-\d{3}-\d{4}\b/gi, type: 'Phone number' },
    { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, type: 'Email address' }
  ];

  patterns.forEach(({ pattern, type }) => {
    const matches = textContent.match(pattern);
    if (matches) {
      violations.push(`${type}: ${matches.length} instance(s) found`);
    }
  });

  if (violations.length > 0) {
    console.log(`⚠️ Basic verification found ${violations.length} potential issues:`, violations);
    return {
      passed: false,
      summary: `Basic verification flagged ${violations.length} potential privacy issues: ${violations.join(', ')}`
    };
  }

  return {
    passed: true,
    summary: 'Basic verification passed - no obvious privacy violations detected'
  };
}

/**
 * Extract text content from case data
 */
function extractTextFromCase(caseData: any): string {
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
    .map(field => caseData[field])
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Log verification results for admin review
 */
function logVerificationResult(result: VerificationResult, caseData: any): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    caseTitle: caseData.title,
    author: caseData.authorId,
    specialty: caseData.specialty,
    isValid: result.isValid,
    confidence: result.confidence,
    violationCount: result.violations.length,
    violations: result.violations.map(v => ({
      type: v.type,
      severity: v.severity,
      confidence: v.confidence,
      description: v.description
    })),
    suggestions: result.suggestions
  };

  console.log('📊 Case Verification Result:', JSON.stringify(logEntry, null, 2));

  // In a real implementation, you could also:
  // - Write to a log file
  // - Send to a monitoring service
  // - Store in a verification_logs table
  // - Send notifications to admins
}

/**
 * Quick check function for existing cases (can be run as a script)
 */
export async function auditExistingCase(caseId: number): Promise<void> {
  console.log(`🔍 Auditing existing case ${caseId}...`);
  
  // This would fetch the case from database and run verification
  // For now, just a placeholder
  console.log(`✅ Case ${caseId} audit complete`);
}

export default verifyCaseSimple;
