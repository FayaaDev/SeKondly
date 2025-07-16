import nodemailer from 'nodemailer';

// Test email configuration
console.log('=== Testing Email Configuration ===');

// Check environment variables
console.log('Environment Variables:');
console.log('- SMTP_USER:', process.env.SMTP_USER ? 'SET' : 'NOT_SET');
console.log('- SMTP_PASS:', process.env.SMTP_PASS ? 'SET' : 'NOT_SET');
console.log('- EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'NOT_SET');
console.log('- EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'NOT_SET');

// Create transporter with same config as server
const emailTransporter = nodemailer.default.createTransporter({
  host: 'email-smtp.eu-north-1.amazonaws.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'AKIAVRCYZCTXCVKECGIR',
    pass: process.env.SMTP_PASS || 'BMONkxzcbSEXcPc9gcf/p0PIUZzxW4iueTEeN4p0uElp'
  },
  requireTLS: true
});

// Test SMTP connection
async function testConnection() {
  try {
    console.log('\n=== Testing SMTP Connection ===');
    await emailTransporter.verify();
    console.log('✅ SMTP connection successful!');
    
    // Test sending email to a verified address
    const testEmail = {
      from: '"SeKondly Team" <admin@sekondly.app>',
      to: 'admin@sekondly.app', // Send to verified address
      subject: 'Test Email - Configuration Check',
      text: 'This is a test email to verify the configuration is working correctly.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4ECDC4;">Email Configuration Test</h2>
          <p>This is a test email to verify the configuration is working correctly.</p>
          <p>If you receive this email, the AWS SES configuration is working properly.</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
      `
    };
    
    console.log('\n=== Sending Test Email ===');
    console.log('From:', testEmail.from);
    console.log('To:', testEmail.to);
    console.log('Subject:', testEmail.subject);
    
    const result = await emailTransporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error Code:', error.code);
    console.error('Error Response:', error.response);
  }
}

testConnection();
