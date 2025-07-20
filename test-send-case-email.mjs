#!/usr/bin/env node

// Direct test script to send case approval email
import nodemailer from 'nodemailer';

const emailTransporter = nodemailer.createTransport({
  host: 'email-smtp.us-east-1.amazonaws.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'AKIAVRCYZCTXP6X27O6Q',
    pass: process.env.SMTP_PASS || 'BAoto0SPFrFVlZPumebfgXP2JUy/0720+bW1C8EM+Tr4'
  },
  requireTLS: true
});

async function sendCaseApprovalEmail(userEmail, firstName, lastName, caseTitle, caseId) {
  try {
    console.log(`📧 Attempting to send case approval email to: ${userEmail}`);
    console.log(`📋 Case: "${caseTitle}" (ID: ${caseId})`);
    console.log(`👨‍⚕️ Recipient: Dr. ${firstName} ${lastName}`);
    
    // Verify SMTP connection
    await emailTransporter.verify();
    console.log('✅ SMTP connection verified');
    
    const mailOptions = {
      from: '"SeKondly Team" <admin@sekondly.app>',
      to: userEmail,
      subject: `🎉 Your Case "${caseTitle}" Has Been Approved!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(45deg, #4ECDC4, #44A08D); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #ddd; }
            .case-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .button { display: inline-block; background: linear-gradient(45deg, #4ECDC4, #44A08D); color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; margin: 10px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Case Approved!</h1>
              <p>Your medical case has been successfully approved and published</p>
            </div>
            
            <div class="content">
              <h2>Dear Dr. ${firstName} ${lastName},</h2>
              
              <p>Congratulations! We're excited to inform you that your medical case has been approved and is now live on SeKondly!</p>
              
              <div class="case-info">
                <h3>📋 Case Details:</h3>
                <p><strong>Case Title:</strong> ${caseTitle}</p>
                <p><strong>Case ID:</strong> #${caseId}</p>
                <p><strong>Status:</strong> ✅ Approved & Published</p>
                <p><strong>Published on:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <p>Your case is now visible to the SeKondly community and can start receiving valuable insights and discussions from fellow medical professionals.</p>
              
              <p><strong>What happens next?</strong></p>
              <ul>
                <li>📱 Your case is now searchable in the SeKondly app</li>
                <li>👥 Other medical professionals can comment and share insights</li>
                <li>💬 You'll receive notifications when colleagues engage with your case</li>
                <li>📈 Track views, likes, and comments through your profile</li>
              </ul>
              
              <a href="https://sekondly.app" class="button">View Your Case on SeKondly</a>
              
              <p>Thank you for contributing to our medical community. Your expertise and case sharing help advance medical knowledge and improve patient care.</p>
              
              <p>Best regards,<br>
              <strong>The SeKondly Team</strong></p>
            </div>
            
            <div class="footer">
              <p>📧 Questions? Contact us at <a href="mailto:admin@sekondly.app">admin@sekondly.app</a></p>
              <p>🌐 Website: <a href="https://sekondly.app">https://sekondly.app</a></p>
              <p style="font-size: 12px; color: #666;">This email was sent because your case was approved on SeKondly.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Dear Dr. ${firstName} ${lastName},

🎉 CASE APPROVED! 🎉

Congratulations! Your medical case "${caseTitle}" (ID: #${caseId}) has been approved and is now live on SeKondly!

CASE DETAILS:
- Case Title: ${caseTitle}
- Case ID: #${caseId}
- Status: ✅ Approved & Published
- Published on: ${new Date().toLocaleDateString()}

Your case is now visible to the SeKondly community and can start receiving valuable insights from fellow medical professionals.

WHAT HAPPENS NEXT:
📱 Your case is now searchable in the SeKondly app
👥 Other medical professionals can comment and share insights  
💬 You'll receive notifications when colleagues engage with your case
📈 Track views, likes, and comments through your profile

Visit SeKondly: https://sekondly.app

Thank you for contributing to our medical community. Your expertise helps advance medical knowledge and improve patient care.

Best regards,
The SeKondly Team

---
📧 Questions? Contact us at admin@sekondly.app
🌐 Website: https://sekondly.app
      `
    };

    const result = await emailTransporter.sendMail(mailOptions);
    console.log('✅ Case approval email sent successfully!');
    console.log('📧 Message ID:', result.messageId);
    console.log('📬 Email delivered to:', userEmail);
    return true;
  } catch (error) {
    console.error('❌ Failed to send case approval email:', error);
    console.error('Error details:', error.message);
    return false;
  }
}

// Test with the approved case data
const testData = {
  email: 'freeland90@protonmail.ch',
  firstName: 'Rasha',
  lastName: 'AlBaz',
  caseTitle: 'Test2',
  caseId: 553
};

console.log('🚀 Starting case approval email test...');
console.log('📝 Test data:', testData);

sendCaseApprovalEmail(
  testData.email,
  testData.firstName,
  testData.lastName,
  testData.caseTitle,
  testData.caseId
).then(success => {
  if (success) {
    console.log('\n🎉 SUCCESS: Case approval email sent successfully!');
    console.log(`📧 Email sent to: ${testData.email}`);
    console.log(`📋 For case: "${testData.caseTitle}" (ID: ${testData.caseId})`);
    console.log('✅ The functionality is working correctly!');
  } else {
    console.log('\n❌ FAILED: Could not send case approval email');
    console.log('🔧 Please check the SMTP configuration and network connection');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('\n💥 SCRIPT ERROR:', error);
  process.exit(1);
});
