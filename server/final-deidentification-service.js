/**
 * Final Working De-identification Service
 *
 * This version uses Google Cloud DLP correctly by using the same inspect config
 * for both detection and de-identification, plus custom regex-based fallback.
 */
import { DlpServiceClient } from '@google-cloud/dlp';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { CaseVerificationService } from './verification-service.js';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
export class FinalDeidentificationService {
    dlpClient;
    visionClient;
    verificationService;
    projectId;
    constructor(projectId, keyFilename) {
        this.projectId = projectId;
        const clientConfig = keyFilename ? { keyFilename } : {};
        this.dlpClient = new DlpServiceClient(clientConfig);
        this.visionClient = new ImageAnnotatorClient(clientConfig);
        this.verificationService = new CaseVerificationService(projectId, keyFilename);
    }
    /**
     * Complete verification and de-identification pipeline
     */
    async processCase(textContent, imageFiles = [], options = {}) {
        console.log('🛡️ Starting case processing with verification and de-identification...');
        // Step 1: Run verification to detect violations
        const verificationResult = await this.verificationService.verifyCaseContent(textContent, imageFiles, {});
        console.log(`🔍 Verification found ${verificationResult.violations.length} violations`);
        // Step 2: Apply de-identification if violations found and not detect-only mode
        if (!options.detectOnly && verificationResult.violations.length > 0) {
            const deidentificationResult = await this.deidentifyContent(textContent, imageFiles, options);
            return {
                ...verificationResult,
                deidentification: deidentificationResult
            };
        }
        return verificationResult;
    }
    /**
     * De-identify content using combined Google Cloud DLP + custom methods
     */
    async deidentifyContent(text, imageFiles, options) {
        console.log('🔒 Starting content de-identification...');
        let redactedText = text;
        const redactedImages = [];
        let totalRedactions = 0;
        const categoriesRedacted = new Set();
        // Text de-identification
        if (options.redactText !== false) {
            try {
                const textResult = await this.deidentifyTextSmart(text, options.redactionStyle || 'smart');
                redactedText = textResult.redactedText;
                totalRedactions += textResult.redactionCount;
                if (textResult.redactionCount > 0) {
                    categoriesRedacted.add('TEXT_PII');
                }
            }
            catch (error) {
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
                    if (imageResult.facesBlurred > 0)
                        categoriesRedacted.add('FACES');
                    if (imageResult.textRegionsBlurred > 0)
                        categoriesRedacted.add('IMAGE_TEXT');
                }
                catch (error) {
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
     * Smart text de-identification using proper DLP configuration
     */
    async deidentifyTextSmart(text, style) {
        console.log('📝 Applying smart de-identification...');
        try {
            // Use DLP's deidentify with inspect and deidentify configs matching
            const inspectConfig = {
                infoTypes: [
                    { name: 'PERSON_NAME' },
                    { name: 'PHONE_NUMBER' },
                    { name: 'EMAIL_ADDRESS' },
                    { name: 'DATE_OF_BIRTH' },
                    { name: 'US_SOCIAL_SECURITY_NUMBER' },
                    { name: 'STREET_ADDRESS' },
                    { name: 'CREDIT_CARD_NUMBER' }
                ],
                includeQuote: true,
                minLikelihood: 'POSSIBLE',
            };
            const deidentifyConfig = {
                infoTypeTransformations: {
                    transformations: [
                        {
                            infoTypes: inspectConfig.infoTypes, // Use same info types as inspect
                            primitiveTransformation: this.getTransformationByStyle(style)
                        }
                    ]
                }
            };
            const request = {
                parent: `projects/${this.projectId}/locations/global`,
                inspectConfig, // Include inspect config
                deidentifyConfig,
                item: {
                    value: text,
                },
            };
            console.log('🔄 Calling Google Cloud DLP deidentify...');
            const [response] = await this.dlpClient.deidentifyContent(request);
            let redactedText = response.item?.value || text;
            // Apply additional custom redactions for medical-specific content
            const customResult = this.applyCustomMedicalRedactions(redactedText);
            redactedText = customResult.text;
            const totalRedactionCount = this.countRedactionPatterns(text, redactedText) + customResult.customRedactions;
            console.log(`📊 Applied ${totalRedactionCount} total redactions (DLP + custom)`);
            return {
                redactedText,
                redactionCount: totalRedactionCount
            };
        }
        catch (error) {
            console.error('❌ DLP de-identification failed, using fallback:', error);
            // Fallback to regex-based redaction
            const fallbackResult = this.applyRegexRedactions(text, style);
            return fallbackResult;
        }
    }
    /**
     * Apply custom redactions for medical content not covered by standard DLP
     */
    applyCustomMedicalRedactions(text) {
        let redactedText = text;
        let customRedactions = 0;
        // Medical-specific patterns
        const medicalPatterns = [
            { pattern: /MRN[\s:]+\d+/gi, replacement: 'MRN: [REDACTED]' },
            { pattern: /Medical Record Number[\s:]+\d+/gi, replacement: 'Medical Record Number: [REDACTED]' },
            { pattern: /NPI[\s:]+\d{10}/gi, replacement: 'NPI: [REDACTED]' },
            { pattern: /Patient ID[\s:]+\d+/gi, replacement: 'Patient ID: [REDACTED]' },
            { pattern: /Dr\.\s+[A-Z][a-z]+\s+[A-Z][a-z]+/gi, replacement: 'Dr. [PHYSICIAN NAME]' },
        ];
        for (const { pattern, replacement } of medicalPatterns) {
            const matches = redactedText.match(pattern);
            if (matches) {
                redactedText = redactedText.replace(pattern, replacement);
                customRedactions += matches.length;
            }
        }
        if (customRedactions > 0) {
            console.log(`📋 Applied ${customRedactions} custom medical redactions`);
        }
        return { text: redactedText, customRedactions };
    }
    /**
     * Fallback regex-based redaction
     */
    applyRegexRedactions(text, style) {
        console.log('🔄 Applying fallback regex redactions...');
        let redactedText = text;
        let redactionCount = 0;
        const patterns = [
            { pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/g, type: 'email' },
            { pattern: /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, type: 'phone' },
            { pattern: /\d{3}-\d{2}-\d{4}/g, type: 'ssn' },
            { pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, type: 'credit_card' },
            { pattern: /Dr\.\s+[A-Z][a-z]+\s+[A-Z][a-z]+/g, type: 'doctor_name' },
            { pattern: /MRN[\s:]+\d+/gi, type: 'mrn' },
        ];
        for (const { pattern, type } of patterns) {
            const matches = redactedText.match(pattern);
            if (matches) {
                const replacement = this.getReplacementByStyle(style, type);
                redactedText = redactedText.replace(pattern, replacement);
                redactionCount += matches.length;
            }
        }
        console.log(`📊 Applied ${redactionCount} regex-based redactions`);
        return { redactedText, redactionCount };
    }
    /**
     * Image de-identification
     */
    async deidentifyImage(imagePath) {
        console.log(`🖼️ Processing image: ${path.basename(imagePath)}`);
        const redactedPath = this.generateRedactedPath(imagePath);
        let facesBlurred = 0;
        let textRegionsBlurred = 0;
        const redactionsApplied = [];
        try {
            let image = sharp(imagePath);
            // Detect and blur faces
            const faces = await this.detectFaces(imagePath);
            if (faces.length > 0) {
                image = await this.applyBlurToRegions(image, faces, 12);
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
            await image.jpeg({ quality: 90 }).toFile(redactedPath);
            console.log(`✅ Image processed: ${facesBlurred} faces, ${textRegionsBlurred} text regions blurred`);
        }
        catch (error) {
            console.error(`❌ Image processing failed:`, error);
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
    // Helper methods (same as before)
    getTransformationByStyle(style) {
        switch (style) {
            case 'mask':
                return { characterMaskConfig: { maskingCharacter: '*' } };
            case 'replace':
                return { replaceConfig: { newValue: { stringValue: '[REDACTED]' } } };
            case 'smart':
                return { replaceWithInfoTypeConfig: {} };
            default:
                return { characterMaskConfig: { maskingCharacter: '*' } };
        }
    }
    getReplacementByStyle(style, type) {
        const replacements = {
            mask: { email: '****@****.***', phone: '***-***-****', ssn: '***-**-****', credit_card: '****-****-****-****', doctor_name: 'Dr. ********', mrn: 'MRN: ****' },
            replace: { email: '[EMAIL]', phone: '[PHONE]', ssn: '[SSN]', credit_card: '[CREDIT_CARD]', doctor_name: 'Dr. [NAME]', mrn: 'MRN: [REDACTED]' },
            smart: { email: '[EMAIL_ADDRESS]', phone: '[PHONE_NUMBER]', ssn: '[SSN]', credit_card: '[CREDIT_CARD]', doctor_name: 'Dr. [PERSON_NAME]', mrn: 'MRN: [MEDICAL_RECORD_NUMBER]' }
        };
        return replacements[style]?.[type] || '[REDACTED]';
    }
    countRedactionPatterns(original, redacted) {
        if (original === redacted)
            return 0;
        const patterns = [
            /\*+/g, /\[REDACTED\]/g, /\[EMAIL\]/g, /\[PHONE\]/g, /\[SSN\]/g,
            /\[PERSON_NAME\]/g, /\[PHONE_NUMBER\]/g, /\[EMAIL_ADDRESS\]/g,
            /\[DATE_OF_BIRTH\]/g, /\[STREET_ADDRESS\]/g, /\[CREDIT_CARD\]/g
        ];
        let totalMatches = 0;
        for (const pattern of patterns) {
            const matches = redacted.match(pattern);
            if (matches)
                totalMatches += matches.length;
        }
        return totalMatches;
    }
    async detectFaces(imagePath) {
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
    async detectTextRegions(imagePath) {
        const [result] = await this.visionClient.textDetection(imagePath);
        const annotations = result.textAnnotations || [];
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
    async applyBlurToRegions(image, regions, blurLevel) {
        const imageBuffer = await image.toBuffer();
        let processedImage = sharp(imageBuffer);
        for (const region of regions) {
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
            }
            catch (error) {
                console.warn(`Failed to blur region:`, error instanceof Error ? error.message : 'Unknown error');
            }
        }
        return processedImage;
    }
    generateRedactedPath(originalPath) {
        const ext = path.extname(originalPath);
        const name = path.basename(originalPath, ext);
        const dir = path.dirname(originalPath);
        return path.join(dir, `${name}_redacted${ext}`);
    }
}
