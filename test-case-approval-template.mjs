#!/usr/bin/env node

// Test script for the Case Approval Email Template
import { generateCaseApprovalEmail } from './server/templates/caseApprovalTemplate.ts';
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

async function sendCaseApprovalEmailWithTemplate(userEmail, caseData) {
  try {
    console.log(`📧 Sending case approval email using template...`);
    console.log(`📋 Case: "${caseData.caseTitle}" (ID: ${caseData.caseId})`);
    console.log(`👨‍⚕️ Recipient: Dr. ${caseData.firstName} ${caseData.lastName}`);
    
    // Verify SMTP connection
    await emailTransporter.verify();
    console.log('✅ SMTP connection verified');
    
    // Generate email content using template
    const emailContent = generateCaseApprovalEmail(caseData);
    
    const mailOptions = {
      from: '"SeKondly Team" <admin@sekondly.app>',
      to: userEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    };

    const result = await emailTransporter.sendMail(mailOptions);
    console.log('✅ Case approval email sent successfully using template!');
    console.log('📧 Message ID:', result.messageId);
    console.log('📬 Email delivered to:', userEmail);
    return true;
  } catch (error) {
    console.error('❌ Failed to send case approval email:', error);
    console.error('Error details:', error.message);
    return false;
  }
}

// Test with sample case data
const testCaseData = {
  firstName: 'Rasha',
  lastName: 'AlBaz',
  caseTitle: 'Test2',
  caseId: 553,
  approvalDate: new Date().toLocaleDateString()
};

const testEmail = 'freeland90@protonmail.ch';

console.log('🚀 Testing Case Approval Email Template...');
console.log('📝 Template data:', testCaseData);
console.log('📧 Sending to:', testEmail);

sendCaseApprovalEmailWithTemplate(testEmail, testCaseData).then(success => {
  if (success) {
    console.log('\n🎉 SUCCESS: Case approval email template works perfectly!');
    console.log('📧 Professional email sent with SeKondly branding');
    console.log('✅ Template is ready for production use!');
  } else {
    console.log('\n❌ FAILED: Could not send email using template');
    console.log('🔧 Please check the template or SMTP configuration');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('\n💥 TEMPLATE TEST ERROR:', error);
  process.exit(1);
});
