#!/usr/bin/env node

// Example email using the Case Approval Template
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

// Import the template functions directly (inline for demo)
function generateCaseApprovalEmailHTML(data) {
  const { firstName, lastName, caseTitle, caseId, approvalDate } = data;
  const publishedDate = approvalDate || new Date().toLocaleDateString();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Case Approved - SeKondly</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background-color: #f8f9fa;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
          background-color: #ffffff;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border-radius: 12px;
        }
        .header { 
          background: linear-gradient(45deg, #4ECDC4, #44A08D); 
          color: white; 
          padding: 30px; 
          text-align: center; 
          border-radius: 10px 10px 0 0;
          margin: -20px -20px 0 -20px;
        }
        .header h1 {
          margin: 0 0 10px 0;
          font-size: 28px;
          font-weight: bold;
        }
        .header p {
          margin: 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .content { 
          background: #ffffff; 
          padding: 30px 20px; 
          border: 1px solid #e9ecef;
          border-top: none;
        }
        .content h2 {
          color: #333;
          margin-top: 0;
          font-size: 24px;
        }
        .case-info { 
          background: #f8f9fa; 
          padding: 20px; 
          border-radius: 8px; 
          margin: 20px 0;
          border-left: 4px solid #4ECDC4;
        }
        .case-info h3 {
          margin-top: 0;
          color: #333;
          font-size: 18px;
        }
        .case-info p {
          margin: 8px 0;
          font-size: 14px;
        }
        .button { 
          display: inline-block; 
          background: linear-gradient(45deg, #4ECDC4, #44A08D); 
          color: white; 
          padding: 12px 25px; 
          text-decoration: none; 
          border-radius: 25px; 
          margin: 20px 0;
          font-weight: bold;
          transition: transform 0.2s ease;
        }
        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(78, 205, 196, 0.3);
        }
        .next-steps {
          background: #e8f5e8;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #28a745;
        }
        .next-steps h3 {
          margin-top: 0;
          color: #155724;
        }
        .next-steps ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        .next-steps li {
          margin: 8px 0;
          color: #155724;
        }
        .footer { 
          background: #f8f9fa; 
          padding: 20px; 
          text-align: center; 
          border-radius: 0 0 10px 10px;
          margin: 0 -20px -20px -20px;
          border-top: 1px solid #e9ecef;
        }
        .footer p {
          margin: 5px 0;
          font-size: 14px;
          color: #666;
        }
        .footer a {
          color: #4ECDC4;
          text-decoration: none;
        }
        .footer a:hover {
          text-decoration: underline;
        }
        .sekondly-branding {
          color: #4ECDC4;
          font-weight: bold;
          font-size: 18px;
        }
        @media only screen and (max-width: 600px) {
          .container {
            margin: 10px;
            padding: 15px;
          }
          .header {
            padding: 20px;
            margin: -15px -15px 0 -15px;
          }
          .content {
            padding: 20px 15px;
          }
          .footer {
            margin: 0 -15px -15px -15px;
          }
        }
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
          
          <p>Congratulations! We're excited to inform you that your medical case has been approved and is now live on <span class="sekondly-branding">SeKondly</span>!</p>
          
          <div class="case-info">
            <h3>📋 Case Details:</h3>
            <p><strong>Case Title:</strong> ${caseTitle}</p>
            <p><strong>Case ID:</strong> #${caseId}</p>
            <p><strong>Status:</strong> ✅ Approved & Published</p>
            <p><strong>Published on:</strong> ${publishedDate}</p>
          </div>
          
          <p>Your case is now visible to the SeKondly community and can start receiving valuable insights and discussions from fellow medical professionals.</p>
          
          <div class="next-steps">
            <h3><strong>What happens next?</strong></h3>
            <ul>
              <li>📱 Your case is now searchable in the SeKondly app</li>
              <li>👥 Other medical professionals can comment and share insights</li>
              <li>💬 You'll receive notifications when colleagues engage with your case</li>
              <li>📈 Track views, likes, and comments through your profile</li>
            </ul>
          </div>
          
          <center>
            <a href="https://sekondly.app" class="button">View Your Case on SeKondly</a>
          </center>
          
          <p>Thank you for contributing to our medical community. Your expertise and case sharing help advance medical knowledge and improve patient care.</p>
          
          <p>Best regards,<br>
          <strong>The <span class="sekondly-branding">SeKondly</span> Team</strong></p>
        </div>
        
        <div class="footer">
          <p>📧 Questions? Contact us at <a href="mailto:admin@sekondly.app">admin@sekondly.app</a></p>
          <p>🌐 Website: <a href="https://sekondly.app">https://sekondly.app</a></p>
          <p style="font-size: 12px; color: #666;">This email was sent because your case was approved on SeKondly.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateCaseApprovalEmailText(data) {
  const { firstName, lastName, caseTitle, caseId, approvalDate } = data;
  const publishedDate = approvalDate || new Date().toLocaleDateString();

  return `
Dear Dr. ${firstName} ${lastName},

🎉 CASE APPROVED! 🎉

Congratulations! Your medical case "${caseTitle}" (ID: #${caseId}) has been approved and is now live on SeKondly!

CASE DETAILS:
- Case Title: ${caseTitle}
- Case ID: #${caseId}
- Status: ✅ Approved & Published
- Published on: ${publishedDate}

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

This email was sent because your case was approved on SeKondly.
  `.trim();
}

function generateCaseApprovalEmail(data) {
  return {
    subject: `🎉 Your Case "${data.caseTitle}" Has Been Approved!`,
    html: generateCaseApprovalEmailHTML(data),
    text: generateCaseApprovalEmailText(data)
  };
}

async function sendCaseApprovalTemplateExample() {
  try {
    console.log('📧 Sending Case Approval Email Example using Template...');
    
    // Case data for the example
    const caseData = {
      firstName: 'Rasha',
      lastName: 'AlBaz',
      caseTitle: 'Test2',
      caseId: 553,
      approvalDate: 'July 20, 2025'
    };
    
    const recipientEmail = 'freeland90@protonmail.ch';
    
    console.log('📋 Case Information:');
    console.log(`   👨‍⚕️ Doctor: Dr. ${caseData.firstName} ${caseData.lastName}`);
    console.log(`   📝 Case: "${caseData.caseTitle}" (ID: ${caseData.caseId})`);
    console.log(`   📧 Email: ${recipientEmail}`);
    console.log(`   📅 Approval Date: ${caseData.approvalDate}`);
    
    // Verify SMTP connection
    await emailTransporter.verify();
    console.log('✅ SMTP connection verified');
    
    // Generate email using template
    const emailContent = generateCaseApprovalEmail(caseData);
    
    console.log('🎨 Template Features:');
    console.log('   ✅ Professional SeKondly branding');
    console.log('   ✅ Responsive design for mobile/desktop');
    console.log('   ✅ Enhanced visual hierarchy');
    console.log('   ✅ Interactive hover effects');
    console.log('   ✅ Clear case information display');
    console.log('   ✅ Action-oriented next steps');
    
    // Send the email
    const mailOptions = {
      from: '"SeKondly Team" <admin@sekondly.app>',
      to: recipientEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    };

    const result = await emailTransporter.sendMail(mailOptions);
    
    console.log('\n🎉 SUCCESS: Case Approval Email Template Example Sent!');
    console.log(`📧 Message ID: ${result.messageId}`);
    console.log(`📬 Delivered to: ${recipientEmail}`);
    console.log(`📋 Subject: ${emailContent.subject}`);
    
    console.log('\n📱 Email Content Preview:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Case Approved!');
    console.log('Your medical case has been successfully approved and published');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Dear Dr. ${caseData.firstName} ${caseData.lastName},`);
    console.log('');
    console.log('Congratulations! Your medical case has been approved and is now live on SeKondly!');
    console.log('');
    console.log('📋 Case Details:');
    console.log(`   Case Title: ${caseData.caseTitle}`);
    console.log(`   Case ID: #${caseData.caseId}`);
    console.log(`   Status: ✅ Approved & Published`);
    console.log(`   Published on: ${caseData.approvalDate}`);
    console.log('');
    console.log('What happens next?');
    console.log('📱 Your case is now searchable in the SeKondly app');
    console.log('👥 Other medical professionals can comment and share insights');
    console.log('💬 You\'ll receive notifications when colleagues engage');
    console.log('📈 Track views, likes, and comments through your profile');
    console.log('');
    console.log('🔗 [View Your Case on SeKondly] → https://sekondly.app');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n✨ Template Benefits:');
    console.log('   🎨 Professional SeKondly branding with gradients');
    console.log('   📱 Mobile-responsive design');
    console.log('   ⚡ Interactive hover effects on buttons');
    console.log('   📋 Clear case information hierarchy');
    console.log('   🎯 Action-oriented next steps section');
    console.log('   🔗 Prominent call-to-action button');
    console.log('   📞 Professional support contact info');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to send case approval template example:', error);
    console.error('Error details:', error.message);
    return false;
  }
}

console.log('🚀 Case Approval Email Template Example');
console.log('==========================================');

sendCaseApprovalTemplateExample().then(success => {
  if (success) {
    console.log('\n🎯 Template email sent successfully!');
    console.log('📧 Dr. Rasha AlBaz should receive the professional email');
    console.log('✅ Case approval template is working perfectly!');
  } else {
    console.log('\n❌ Failed to send template example');
    console.log('🔧 Please check SMTP configuration');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('\n💥 TEMPLATE EXAMPLE ERROR:', error);
  process.exit(1);
});
