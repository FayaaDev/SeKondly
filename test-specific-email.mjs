import 'dotenv/config';
import { createTransport } from 'nodemailer';

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

// Function to send welcome email (same as server)
async function sendWelcomeEmail(userEmail, firstName, lastName) {
  try {
    console.log(`Attempting to send welcome email to: ${userEmail}`);
    
    const welcomeEmailContent = `
Dear Dr. ${firstName} ${lastName},

Welcome to SeKondly! 🎉

Thank you for joining our community of medical professionals. We're excited to have you as part of our platform where healthcare experts collaborate, share knowledge, and discuss complex medical cases.

Here's what happens next:

✅ Your account has been created successfully
⏳ Our medical verification team is currently reviewing your credentials
📧 You'll receive an email notification once your account is approved (typically 1-2 business days)
🔐 Once approved, you can sign in and start contributing to our medical community

What you can do once approved:
• Share and discuss interesting medical cases
• Get second opinions from specialists across different fields
• Connect with fellow medical professionals
• Access our growing library of educational cases
• Participate in professional medical discussions

If you have any questions or need assistance, please don't hesitate to contact our support team by visiting https://sekondly.app/static-landing.html

Welcome to the future of medical collaboration!

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
      subject: 'Welcome to SeKondly - Your Account is Being Reviewed',
      text: welcomeEmailContent,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4ECDC4; margin: 0; font-size: 28px;">Welcome to SeKondly! 🎉</h1>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">Dear Dr. ${firstName} ${lastName},</p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Thank you for joining our community of medical professionals. We're excited to have you as part of our platform where healthcare experts collaborate, share knowledge, and discuss complex medical cases.
            </p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #4ECDC4; margin-top: 0;">What happens next:</h3>
              <ul style="line-height: 1.8; color: #333;">
                <li>✅ Your account has been created successfully</li>
                <li>⏳ Our medical verification team is currently reviewing your credentials</li>
                <li>📧 You'll receive an email notification once your account is approved (typically 1-2 business days)</li>
                <li>🔐 Once approved, you can sign in and start contributing to our medical community</li>
              </ul>
            </div>
            
            <div style="background-color: #e8f5f4; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #4ECDC4; margin-top: 0;">What you can do once approved:</h3>
              <ul style="line-height: 1.8; color: #333;">
                <li>Share and discuss interesting medical cases</li>
                <li>Get second opinions from specialists across different fields</li>
                <li>Connect with fellow medical professionals</li>
                <li>Access our growing library of educational cases</li>
                <li>Participate in professional medical discussions</li>
              </ul>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              If you have any questions or need assistance, please don't hesitate to contact our support team by visiting 
              <a href="https://sekondly.app/static-landing.html" style="color: #4ECDC4; text-decoration: none;">our support page</a>.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 30px;">
              Welcome to the future of medical collaboration!
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
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
    console.log('SMTP connection verified for welcome email');
    
    await emailTransporter.sendMail(mailOptions);
    console.log(`Welcome email sent successfully to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      code: error instanceof Error && 'code' in error ? error.code : undefined,
      command: error instanceof Error && 'command' in error ? error.command : undefined,
      response: error instanceof Error && 'response' in error ? error.response : undefined
    });
    return false;
  }
}

async function testEmails() {
  console.log('=== Testing Welcome Email to Different Recipients ===\n');
  
  // Test 1: Send to verified address (should work)
  console.log('TEST 1: Sending to verified address (admin@sekondly.app)');
  const result1 = await sendWelcomeEmail('admin@sekondly.app', 'Test', 'Admin');
  console.log('Result:', result1 ? 'SUCCESS' : 'FAILED');
  console.log('');
  
  // Test 2: Send to unverified address (will likely fail in sandbox)
  console.log('TEST 2: Sending to unverified address (amd.fayaa@gmail.com)');
  const result2 = await sendWelcomeEmail('amd.fayaa@gmail.com', 'Test', 'User');
  console.log('Result:', result2 ? 'SUCCESS' : 'FAILED');
  console.log('');
  
  console.log('=== Summary ===');
  console.log('If Test 1 succeeded but Test 2 failed, your AWS SES account is in sandbox mode.');
  console.log('You need to either:');
  console.log('1. Verify the recipient email address in AWS SES, OR');
  console.log('2. Request production access for your AWS SES account');
}

testEmails();
