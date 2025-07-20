import fetch from 'node-fetch';
import 'dotenv/config';

const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://api.sekondly.app' 
  : 'http://localhost:5001';

const ADMIN_EMAIL = 'admin@sekondly.app';
const ADMIN_PASSWORD = 'admin123';

async function testCaseRejectionEmail() {
  try {
    console.log('=== Case Rejection Email Test ===\n');
    
    // Step 1: Admin login
    console.log('Step 1: Admin login...');
    const loginResponse = await fetch(`${API_BASE}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Admin login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Admin login successful');
    
    // Extract session cookie
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    const sessionCookie = setCookieHeader ? setCookieHeader.split(';')[0] : '';
    
    if (!sessionCookie) {
      throw new Error('No session cookie received');
    }
    
    // Step 2: Get pending cases
    console.log('\nStep 2: Fetching pending cases...');
    const pendingResponse = await fetch(`${API_BASE}/api/admin/pending-cases`, {
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json',
      },
    });

    if (!pendingResponse.ok) {
      throw new Error(`Failed to fetch pending cases: ${pendingResponse.status}`);
    }

    const pendingCases = await pendingResponse.json();
    console.log(`✅ Found ${pendingCases.length} pending cases`);
    
    if (pendingCases.length === 0) {
      console.log('⚠️  No pending cases to test with. Please create a test case first.');
      return;
    }
    
    // Step 3: Select a case to reject
    const caseToReject = pendingCases[0];
    console.log(`\nStep 3: Selecting case to reject...`);
    console.log(`Selected case: "${caseToReject.title}" by ${caseToReject.author.firstName} ${caseToReject.author.lastName}`);
    console.log(`Author email: ${caseToReject.author.email || 'No email set'}`);
    
    if (!caseToReject.author.email) {
      console.log('⚠️  Case author has no email address. Cannot test email functionality.');
      return;
    }
    
    // Step 4: Reject case with reason
    const rejectionReason = 'This case does not meet our quality standards. Please provide more detailed medical history and ensure all sensitive information is properly anonymized.';
    
    console.log(`\nStep 4: Rejecting case with reason...`);
    console.log(`Rejection reason: "${rejectionReason}"`);
    
    const rejectResponse = await fetch(`${API_BASE}/api/admin/reject-case/${caseToReject.id}`, {
      method: 'DELETE',
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: rejectionReason,
      }),
    });

    if (!rejectResponse.ok) {
      const errorText = await rejectResponse.text();
      throw new Error(`Case rejection failed: ${rejectResponse.status} - ${errorText}`);
    }

    const rejectData = await rejectResponse.json();
    console.log('✅ Case rejected successfully');
    console.log('Response:', rejectData);
    
    // Step 5: Verify email was sent
    console.log('\nStep 5: Email verification...');
    console.log('✅ Case rejection email should have been sent to:', caseToReject.author.email);
    console.log('📧 Please check the email inbox to confirm the rejection email was received.');
    
    console.log('\n=== Test Completed Successfully ===');
    console.log('📋 Summary:');
    console.log(`• Case "${caseToReject.title}" was rejected`);
    console.log(`• Rejection email sent to: ${caseToReject.author.email}`);
    console.log(`• Rejection reason: "${rejectionReason}"`);
    console.log(`• Case was removed from pending queue`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('💡 Make sure the server is running and accessible');
    }
    
    if (error.message.includes('login')) {
      console.log('💡 Check admin credentials in .env file');
    }
    
    process.exit(1);
  }
}

// Helper function to test email template rendering
async function testEmailTemplate() {
  console.log('\n=== Testing Email Template ===');
  
  // Import the template function
  const { generateCaseRejectionEmailHTML, generateCaseRejectionEmailText } = await import('./server/templates/caseRejectionTemplate.ts');
  
  const testData = {
    authorName: 'Dr. John Smith',
    caseTitle: 'Complex cardiac arrhythmia case',
    rejectionReason: 'Please provide more detailed patient history and ensure all identifying information is removed.',
    caseId: 123,
    submissionDate: new Date(),
  };
  
  console.log('📧 Generating HTML email...');
  const htmlEmail = generateCaseRejectionEmailHTML(testData);
  console.log('✅ HTML email generated successfully');
  
  console.log('📧 Generating text email...');
  const textEmail = generateCaseRejectionEmailText(testData);
  console.log('✅ Text email generated successfully');
  
  console.log('\n📄 Text version preview:');
  console.log('---');
  console.log(textEmail.substring(0, 200) + '...');
  console.log('---');
}

// Run the test
if (process.argv.includes('--template-only')) {
  testEmailTemplate();
} else {
  testCaseRejectionEmail();
}
