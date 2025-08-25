/**
 * Google Cloud Vision + DLP Case Verification Service
 *
 * This service integrates Google Cloud Vision API and Sensitive Data Protection (DLP) API
 * to detect patient identifying information and images in medical ca      try {
      if (!this.visionClient) {
        throw new Error('Google Cloud Vision client not initialized');
      }

      const visionClient = this.visionClient;
      const violations: Violation[] = [];

      // Perform OCR to extract text
      const [textResult] = await visionClient.textDetection(imagePath);
      const ocrText = textResult.textAnnotations?.[0]?.description || '';

      // Detect faces
      const [faceResult] = await visionClient.faceDetection(imagePath);
      const faceDetected = (faceResult.faceAnnotations?.length || 0) > 0;

      // Detect objects to identify medical content
      const [objectResult] = await visionClient.objectLocalization(imagePath);R to extract text
      const [textResult] = await this.visionClient.textDetection(imagePath);
      const ocrText = textResult.textAnnotations?.[0]?.description || '';

      // Detect faces
      const [faceResult] = await this.visionClient.faceDetection(imagePath);
      const faceDetected = (faceResult.faceAnnotations?.length || 0) > 0;

      // Detect objects to identify medical content
      const [objectResult] = await this.visionClient.objectLocalization(imagePath);.
 *
 * Features:
 * - OCR text extraction from medical images
 * - PII detection using Google Cloud DLP
 * - Medical image content analysis
 * - Face detection in images
 * - Text analysis for patient identifiers
 * - Configurable sensitivity levels
 */
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { DlpServiceClient } from '@google-cloud/dlp';
import * as fs from 'fs';
import * as path from 'path';
export class CaseVerificationService {
    visionClient;
    dlpClient;
    projectId;
    constructor(projectId, keyFilename) {
        this.projectId = projectId;
        const clientConfig = keyFilename
            ? { keyFilename }
            : {}; // Uses default credentials (GOOGLE_APPLICATION_CREDENTIALS env var)
        this.visionClient = new ImageAnnotatorClient(clientConfig);
        this.dlpClient = new DlpServiceClient(clientConfig);
    }
    /**
     * Main verification method for medical cases
     */
    async verifyCaseContent(textContent, imageFiles, options = {}) {
        console.log('🔍 Starting case verification process...');
        try {
            // Analyze text content for PII
            const textAnalysis = await this.analyzeTextContent(textContent);
            // Analyze images
            const imageAnalyses = await Promise.all(imageFiles.map(imagePath => this.analyzeImage(imagePath)));
            // Compile all violations
            const allViolations = [
                ...textAnalysis.violations,
                ...imageAnalyses.flatMap(img => img.violations)
            ];
            // Generate suggestions
            const suggestions = this.generateSuggestions(allViolations);
            // Calculate overall confidence and validity
            const { isValid, confidence } = this.calculateValidityScore(allViolations, options);
            const result = {
                isValid,
                confidence,
                violations: allViolations,
                suggestions,
                processedImages: imageAnalyses,
                textAnalysis
            };
            console.log(`✅ Verification complete. Valid: ${isValid}, Confidence: ${confidence}%`);
            return result;
        }
        catch (error) {
            console.error('❌ Verification failed:', error);
            throw new Error(`Case verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Analyze text content using Google Cloud DLP
     */
    async analyzeTextContent(text) {
        console.log('📝 Analyzing text content for PII...');
        try {
            const request = {
                parent: `projects/${this.projectId}/locations/global`,
                inspectConfig: {
                    infoTypes: [
                        { name: 'PERSON_NAME' },
                        { name: 'PHONE_NUMBER' },
                        { name: 'EMAIL_ADDRESS' },
                        { name: 'DATE_OF_BIRTH' },
                        { name: 'US_SOCIAL_SECURITY_NUMBER' },
                        { name: 'MEDICAL_RECORD_NUMBER' },
                        { name: 'US_HEALTHCARE_NPI' },
                        { name: 'US_DEA_NUMBER' },
                        { name: 'STREET_ADDRESS' },
                        { name: 'CREDIT_CARD_NUMBER' },
                        { name: 'IBAN_CODE' },
                        { name: 'US_PASSPORT' },
                        { name: 'US_DRIVERS_LICENSE_NUMBER' },
                        // Custom medical identifiers
                        { name: 'GENERIC_ID' },
                    ],
                    includeQuote: true,
                    minLikelihood: 'POSSIBLE',
                    limits: {
                        maxFindingsPerRequest: 100,
                    },
                },
                item: {
                    value: text,
                },
            };
            const [response] = await this.dlpClient.inspectContent(request);
            const findings = response.result?.findings || [];
            console.log(`📊 Found ${findings.length} potential PII instances in text`);
            const violations = findings.map((finding) => ({
                type: this.mapInfoTypeToViolationType(finding.infoType?.name || ''),
                severity: this.mapLikelihoodToSeverity(finding.likelihood || 'UNKNOWN'),
                description: `Detected ${finding.infoType?.name}: "${finding.quote}"`,
                location: `Characters ${finding.location?.byteRange?.start}-${finding.location?.byteRange?.end}`,
                confidence: this.mapLikelihoodToConfidence(finding.likelihood || 'UNKNOWN'),
                suggestion: this.getSuggestionForInfoType(finding.infoType?.name || '')
            }));
            return {
                text,
                piiFindings: findings,
                violations
            };
        }
        catch (error) {
            console.error('❌ Text analysis failed:', error);
            return {
                text,
                piiFindings: [],
                violations: []
            };
        }
    }
    /**
     * Analyze image for faces, OCR text, and medical content
     */
    async analyzeImage(imagePath) {
        console.log(`🖼️ Analyzing image: ${path.basename(imagePath)}`);
        if (!fs.existsSync(imagePath)) {
            console.warn(`⚠️ Image file not found: ${imagePath}`);
            return {
                filename: path.basename(imagePath),
                ocrText: '',
                faceDetected: false,
                medicalContent: false,
                violations: []
            };
        }
        try {
            if (!this.visionClient) {
                throw new Error('Google Cloud Vision client not initialized');
            }
            const visionClient = this.visionClient;
            const violations = [];
            // Perform OCR to extract text
            const [textResult] = await visionClient.textDetection(imagePath);
            const ocrText = textResult.textAnnotations?.[0]?.description || '';
            // Detect faces
            const [faceResult] = await visionClient.faceDetection(imagePath);
            const faceDetected = (faceResult.faceAnnotations?.length || 0) > 0;
            // Detect objects to identify medical content  
            const [objectResult] = await visionClient.labelDetection(imagePath);
            const medicalContent = objectResult && objectResult.labelAnnotations
                ? this.isMedicalContent(objectResult.labelAnnotations)
                : false;
            // Add violations for faces
            if (faceDetected) {
                violations.push({
                    type: 'FACE',
                    severity: 'HIGH',
                    description: `Human face(s) detected in image ${path.basename(imagePath)}`,
                    location: path.basename(imagePath),
                    confidence: 90,
                    suggestion: 'Remove or blur any visible faces in medical images to protect patient privacy'
                });
            }
            // Analyze OCR text for PII if found
            if (ocrText.length > 10) {
                console.log(`📖 OCR extracted ${ocrText.length} characters from ${path.basename(imagePath)}`);
                const textAnalysis = await this.analyzeTextContent(ocrText);
                violations.push(...textAnalysis.violations);
            }
            // Check for common medical identifiers in OCR text
            const medicalIdViolations = this.detectMedicalIdentifiers(ocrText);
            violations.push(...medicalIdViolations);
            console.log(`🔍 Image analysis complete: ${violations.length} violations found`);
            return {
                filename: path.basename(imagePath),
                ocrText,
                faceDetected,
                medicalContent,
                violations
            };
        }
        catch (error) {
            console.error(`❌ Image analysis failed for ${imagePath}:`, error);
            return {
                filename: path.basename(imagePath),
                ocrText: '',
                faceDetected: false,
                medicalContent: false,
                violations: []
            };
        }
    }
    /**
     * Detect medical identifiers in text using pattern matching
     */
    detectMedicalIdentifiers(text) {
        const violations = [];
        // Medical Record Number patterns
        const mrnPatterns = [
            /MRN[\s:]+(\d{6,})/gi,
            /Medical Record Number[\s:]+(\d{6,})/gi,
            /Patient ID[\s:]+(\d{6,})/gi,
            /ID[\s:]+(\d{6,})/gi
        ];
        // Date patterns that might be DOB
        const datePatterns = [
            /DOB[\s:]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
            /Date of Birth[\s:]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
            /Born[\s:]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi
        ];
        // Name patterns (common titles + name structure)
        const namePatterns = [
            /(Mr|Mrs|Ms|Dr|Doctor)\.?\s+[A-Z][a-z]+\s+[A-Z][a-z]+/gi,
            /Patient[\s:]+[A-Z][a-z]+\s+[A-Z][a-z]+/gi
        ];
        // Check MRN patterns
        mrnPatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    violations.push({
                        type: 'MEDICAL_RECORD_NUMBER',
                        severity: 'CRITICAL',
                        description: `Medical record number detected: ${match}`,
                        confidence: 85,
                        suggestion: 'Replace medical record numbers with generic identifiers (e.g., "Patient MRN: XXXX")'
                    });
                });
            }
        });
        // Check date patterns
        datePatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    violations.push({
                        type: 'DATE_OF_BIRTH',
                        severity: 'HIGH',
                        description: `Potential date of birth detected: ${match}`,
                        confidence: 75,
                        suggestion: 'Replace specific dates with age or age ranges (e.g., "45-year-old patient")'
                    });
                });
            }
        });
        // Check name patterns
        namePatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    violations.push({
                        type: 'PATIENT_NAME',
                        severity: 'CRITICAL',
                        description: `Potential patient name detected: ${match}`,
                        confidence: 70,
                        suggestion: 'Replace patient names with generic terms (e.g., "the patient", "a 45-year-old male")'
                    });
                });
            }
        });
        return violations;
    }
    /**
     * Check if detected objects indicate medical content
     */
    isMedicalContent(objects) {
        const medicalKeywords = [
            'x-ray', 'mri', 'ct scan', 'ultrasound', 'ecg', 'ekg',
            'stethoscope', 'syringe', 'medical equipment', 'hospital bed',
            'medical chart', 'prescription', 'pill', 'medicine'
        ];
        return objects.some(obj => medicalKeywords.some(keyword => obj.name?.toLowerCase().includes(keyword)));
    }
    /**
     * Generate suggestions based on violations found
     */
    generateSuggestions(violations) {
        const suggestions = new Set();
        violations.forEach(violation => {
            suggestions.add(violation.suggestion);
        });
        // Add general suggestions
        if (violations.length > 0) {
            suggestions.add('Review all content to ensure patient privacy compliance');
            suggestions.add('Consider using generic terms instead of specific identifiers');
        }
        if (violations.some(v => v.type === 'FACE')) {
            suggestions.add('Use image editing tools to blur or remove faces from medical images');
        }
        if (violations.some(v => v.severity === 'CRITICAL')) {
            suggestions.add('Critical privacy violations detected - manual review required before publication');
        }
        return Array.from(suggestions);
    }
    /**
     * Calculate overall validity score based on violations
     */
    calculateValidityScore(violations, options) {
        const { strictMode = false, allowLowRiskViolations = true } = options;
        const criticalViolations = violations.filter(v => v.severity === 'CRITICAL');
        const highViolations = violations.filter(v => v.severity === 'HIGH');
        const mediumViolations = violations.filter(v => v.severity === 'MEDIUM');
        const lowViolations = violations.filter(v => v.severity === 'LOW');
        // Calculate penalty scores
        let penaltyScore = 0;
        penaltyScore += criticalViolations.length * 40;
        penaltyScore += highViolations.length * 25;
        penaltyScore += mediumViolations.length * 15;
        penaltyScore += lowViolations.length * 5;
        // Base confidence starts at 100
        const confidence = Math.max(0, 100 - penaltyScore);
        // Determine validity
        let isValid = true;
        if (strictMode) {
            // Strict mode: any medium or higher violation fails
            isValid = criticalViolations.length === 0 &&
                highViolations.length === 0 &&
                mediumViolations.length === 0;
        }
        else {
            // Standard mode: critical violations always fail
            isValid = criticalViolations.length === 0;
            // High violations fail unless explicitly allowed
            if (highViolations.length > 0) {
                isValid = false;
            }
            // Allow low-risk violations if configured
            if (!allowLowRiskViolations && (mediumViolations.length > 0 || lowViolations.length > 0)) {
                isValid = false;
            }
        }
        return { isValid, confidence };
    }
    /**
     * Helper methods for mapping DLP results to our types
     */
    mapInfoTypeToViolationType(infoType) {
        const mapping = {
            'PERSON_NAME': 'PATIENT_NAME',
            'PHONE_NUMBER': 'PHONE',
            'EMAIL_ADDRESS': 'EMAIL',
            'DATE_OF_BIRTH': 'DATE_OF_BIRTH',
            'US_SOCIAL_SECURITY_NUMBER': 'SSN',
            'MEDICAL_RECORD_NUMBER': 'MEDICAL_RECORD_NUMBER',
            'US_HEALTHCARE_NPI': 'MEDICAL_ID',
            'US_DEA_NUMBER': 'MEDICAL_ID',
            'STREET_ADDRESS': 'ADDRESS',
            'GENERIC_ID': 'MEDICAL_ID'
        };
        return mapping[infoType] || 'PII';
    }
    mapLikelihoodToSeverity(likelihood) {
        const mapping = {
            'VERY_LIKELY': 'CRITICAL',
            'LIKELY': 'HIGH',
            'POSSIBLE': 'MEDIUM',
            'UNLIKELY': 'LOW'
        };
        return mapping[likelihood] || 'MEDIUM';
    }
    mapLikelihoodToConfidence(likelihood) {
        const mapping = {
            'VERY_LIKELY': 95,
            'LIKELY': 80,
            'POSSIBLE': 60,
            'UNLIKELY': 30
        };
        return mapping[likelihood] || 50;
    }
    getSuggestionForInfoType(infoType) {
        const suggestions = {
            'PERSON_NAME': 'Replace with generic terms like "the patient" or age/gender descriptors',
            'PHONE_NUMBER': 'Remove phone numbers or replace with "XXX-XXX-XXXX"',
            'EMAIL_ADDRESS': 'Remove email addresses or use generic placeholders',
            'DATE_OF_BIRTH': 'Replace specific dates with age or age ranges',
            'US_SOCIAL_SECURITY_NUMBER': 'Remove social security numbers completely',
            'MEDICAL_RECORD_NUMBER': 'Replace with generic identifiers like "Patient MRN: XXXX"',
            'US_HEALTHCARE_NPI': 'Remove or anonymize healthcare provider identifiers',
            'STREET_ADDRESS': 'Remove specific addresses, use general location if relevant',
            'GENERIC_ID': 'Review and anonymize any identifying numbers'
        };
        return suggestions[infoType] || 'Review and anonymize this information';
    }
}
/**
 * Factory function to create verification service with environment-based config
 */
export function createVerificationService() {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const keyFilename = process.env.GOOGLE_CLOUD_KEY_FILE;
    if (!projectId) {
        throw new Error('GOOGLE_CLOUD_PROJECT_ID environment variable is required');
    }
    return new CaseVerificationService(projectId, keyFilename);
}
export default CaseVerificationService;
