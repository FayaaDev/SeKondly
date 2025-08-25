#!/usr/bin/env node

/**
 * Test script to demonstrate the case verification system (Simple Version)
 */

// Simple verification without external dependencies
async function performBasicVerification(caseData) {
  console.log('🔍 Running basic regex-based verification...');
  
  const textContent = extractTextFromCase(caseData);
  const violations = [];

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
      violations.push({ type, matches: matches.length, examples: matches.slice(0, 2) });
    }
  });

  return {
    passed: violations.length === 0,
    violations,
    summary: violations.length === 0 
      ? 'No privacy violations detected' 
      : `Found ${violations.length} types of potential privacy violations`
  };
}

function extractTextFromCase(caseData) {
  const textFields = ['title', 'history', 'chiefComplaint', 'examination'];
  return textFields
    .map(field => caseData[field])
    .filter(Boolean)
    .join('\n\n');
}

async function verifyCaseSimple(caseData, imageFiles, config) {
  if (!config.enabled) {
    return { passed: true, summary: 'Verification disabled' };
  }

  return performBasicVerification(caseData);
}

// Test cases with various levels of privacy concerns
const testCases = [
  {
    title: "Safe Case Example",
    history: "A 45-year-old patient presents with chest pain. Patient has no known allergies. Physical examination reveals normal heart sounds.",
    specialty: "Cardiology",
    expectedResult: "Should pass - no privacy violations"
  },
  {
    title: "Case with Patient Name",
    history: "Dr. John Smith, a 52-year-old cardiologist, presents with atrial fibrillation. His medical record number is MRN: 123456.",
    specialty: "Cardiology", 
    expectedResult: "Should fail - contains patient name and MRN"
  },
  {
    title: "Case with Phone Number",
    history: "Patient contacted at 555-123-4567 regarding test results. DOB: 01/15/1980. Lives at 123 Main Street.",
    specialty: "Internal Medicine",
    expectedResult: "Should fail - contains phone, DOB, and address"
  },
  {
    title: "Borderline Case",
    history: "Patient ID 789123 shows signs of improvement. Follow-up in 2 weeks. Patient education provided.",
    specialty: "Family Medicine",
    expectedResult: "May be flagged - contains potential ID number"
  }
];

async function runVerificationTests() {
  console.log('🧪 Running Case Verification Tests\n');
  console.log('=' .repeat(60));

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n📋 Test Case ${i + 1}: ${testCase.title}`);
    console.log(`Expected: ${testCase.expectedResult}`);
    console.log('-'.repeat(40));
    
    try {
      const result = await verifyCaseSimple(
        testCase,
        [], // No images for this test
        { enabled: true, logOnly: false, notifyAdmins: false }
      );

      console.log(`Result: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`Summary: ${result.summary}`);
      
      if (result.result) {
        console.log(`Confidence: ${result.result.confidence}%`);
        console.log(`Violations: ${result.result.violations.length}`);
        
        if (result.result.violations.length > 0) {
          console.log('Issues found:');
          result.result.violations.forEach((violation, idx) => {
            console.log(`  ${idx + 1}. [${violation.severity}] ${violation.type}: ${violation.description}`);
          });
        }
        
        if (result.result.suggestions.length > 0) {
          console.log('Suggestions:');
          result.result.suggestions.forEach((suggestion, idx) => {
            console.log(`  ${idx + 1}. ${suggestion}`);
          });
        }
      }
      
    } catch (error) {
      console.log(`❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    console.log('-'.repeat(40));
  }

  console.log('\n🏁 Test complete!');
  console.log('\nTo enable verification in your application:');
  console.log('1. Set GOOGLE_CLOUD_PROJECT_ID in your .env file');
  console.log('2. Set up Google Cloud Vision and DLP APIs');
  console.log('3. Update useSimpleVerification to true in routes.ts');
  console.log('4. Monitor the logs for verification results');
}

// Run tests if this file is executed directly
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  runVerificationTests().catch(console.error);
}

export { runVerificationTests };
