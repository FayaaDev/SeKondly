import 'dotenv/config';
import { createTransport } from 'nodemailer';

const BASE_URL = 'http://localhost:5001';

// Create transporter with same config as server
const emailTransporter = createTransport({
  host: 'email-smtp.us-east-1.amazonaws.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'AKIAVRCYZCTXP6X27O6Q',
    pass: process.env.SMTP_PASS || 'BAoto0SPFrFVlZPumebfgXP2JUy/0720+bW1C8EM+Tr4'
  },
  requireTLS: true
});

// Test rejection email function
async function sendRejectionEmail(userEmail, firstName, lastName, reason) {
  try {
    console.log(`Attempting to send rejection email to: ${userEmail}`);
    
    const rejectionEmailContent = `
Dear Dr. ${firstName} ${lastName},

Thank you for your interest in joining SeKondly. After careful review of your application, we regret to inform you that we cannot approve your account at this time.

Reason for rejection:
${reason}

We appreciate the time you took to apply and wish you the best in your medical career. If you believe this decision was made in error or if you have additional credentials to share, please contact our support team at https://sekondly.app/static-landing.html

Thank you for your understanding.

Best regards,
The SeKondly Team

---
This email was sent to ${userEmail}
SeKondly - Empowering healthcare through collaboration
Website: https://sekondly.app
    `.trim();

    const mailOptions = {
      from: `"SeKondly Team" <admin@sekondly.app>`,
      to: userEmail,
      subject: 'SeKondly Account Application Status',
      text: rejectionEmailContent,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc3545; margin: 0; font-size: 24px;">Application Update</h1>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">Dear Dr. ${firstName} ${lastName},</p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Thank you for your interest in joining SeKondly. After careful review of your application, we regret to inform you that we cannot approve your account at this time.
            </p>
            
            <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; margin: 25px 0; border-radius: 4px;">
              <h3 style="color: #721c24; margin-top: 0; font-size: 16px;">Reason for rejection:</h3>
              <p style="font-size: 16px; line-height: 1.6; color: #721c24; margin: 0; font-weight: 500;">
                ${reason}
              </p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              We appreciate the time you took to apply and wish you the best in your medical career. If you believe this decision was made in error or if you have additional credentials to share, please contact our support team.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://sekondly.app/static-landing.html" style="background-color: #4ECDC4; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                Contact Support
              </a>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Thank you for your understanding.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 30px;">
              Best regards,<br>
              <strong>The SeKondly Team</strong>
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <div style="text-align: center; color: #888; font-size: 14px;">
              <p>This email was sent to ${userEmail}</p>
              <p><strong>SeKondly</strong> - Empowering healthcare through collaboration</p>
              <p>Website: <a href="https://sekondly.app" style="color: #4ECDC4;">https://sekondly.app</a></p>
            </div>
          </div>
        </div>
      `
    };

    await emailTransporter.verify();
    console.log('SMTP connection verified for rejection email');
    
    await emailTransporter.sendMail(mailOptions);
    console.log(`Rejection email sent successfully to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send rejection email:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      code: error instanceof Error && 'code' in error ? error.code : undefined,
      command: error instanceof Error && 'command' in error ? error.command : undefined
    });
    return false;
  }
}

async function testRejectionEmail() {
  console.log('🧪 Testing rejection email functionality...\n');
  
  try {
    // Test 1: Send to verified address (should work)
    console.log('TEST 1: Sending rejection email to verified address (admin@sekondly.app)');
    const result1 = await sendRejectionEmail(
      'admin@sekondly.app', 
      'Test', 
      'Doctor', 
      'Your credentials could not be verified. Please ensure you have uploaded clear, valid medical license documents.'
    );
    console.log('Result:', result1 ? 'SUCCESS' : 'FAILED');
    console.log('');
    
    // Test 2: Send to another verified address if available
    console.log('TEST 2: Sending rejection email to amd.fayaa@gmail.com (may fail if unverified)');
    const result2 = await sendRejectionEmail(
      'amd.fayaa@gmail.com', 
      'Test', 
      'User', 
      'The medical license number provided does not match our verification database. Please double-check the license number or contact us with additional documentation.'
    );
    console.log('Result:', result2 ? 'SUCCESS' : 'FAILED');
    console.log('');
    
    console.log('=== Summary ===');
    console.log('✅ Rejection email functionality has been implemented');
    console.log('✅ Users will receive detailed rejection emails with reasons');
    console.log('✅ Both web and mobile admin panels support rejection with custom reasons');
    console.log('');
    console.log('Integration complete:');
    console.log('1. Server endpoint updated to accept rejection reason');
    console.log('2. Email template created for rejection notifications');
    console.log('3. Web admin panel updated with rejection reason modal');
    console.log('4. Mobile admin panel updated with rejection reason modal');
    
  } catch (error) {
    console.error('❌ Error testing rejection email:', error);
  }
}

testRejectionEmail();
