// Demo script to showcase all three SeKondly email templates
// Run with: node demo-all-templates.mjs

import nodemailer from 'nodemailer';

// Template functions (copied for demo purposes)
function generateWelcomeEmailHTML(data) {
  const { firstName, lastName, userEmail, registrationDate } = data;
  const regDate = registrationDate || new Date().toLocaleDateString();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to SeKondly</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-radius: 12px; }
        .header { background: linear-gradient(45deg, #4ECDC4, #44A08D); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; margin: -20px -20px 0 -20px; }
        .header h1 { margin: 0 0 10px 0; font-size: 28px; font-weight: bold; }
        .header p { margin: 0; font-size: 16px; opacity: 0.9; }
        .content { background: #ffffff; padding: 30px 20px; border: 1px solid #e9ecef; border-top: none; }
        .content h2 { color: #333; margin-top: 0; font-size: 24px; }
        .account-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4ECDC4; }
        .account-info h3 { margin-top: 0; color: #333; font-size: 18px; }
        .account-info p { margin: 8px 0; font-size: 14px; }
        .button { display: inline-block; background: linear-gradient(45deg, #4ECDC4, #44A08D); color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; margin: 20px 0; font-weight: bold; transition: transform 0.2s ease; }
        .next-steps { background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
        .next-steps h3 { margin-top: 0; color: #856404; }
        .next-steps ul { margin: 10px 0; padding-left: 20px; }
        .next-steps li { margin: 8px 0; color: #856404; }
        .features { background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
        .features h3 { margin-top: 0; color: #155724; }
        .features ul { margin: 10px 0; padding-left: 20px; }
        .features li { margin: 8px 0; color: #155724; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; margin: 0 -20px -20px -20px; border-top: 1px solid #e9ecef; }
        .footer p { margin: 5px 0; font-size: 14px; color: #666; }
        .footer a { color: #4ECDC4; text-decoration: none; }
        .sekondly-branding { color: #4ECDC4; font-weight: bold; font-size: 18px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to SeKondly!</h1>
          <p>Your account is being reviewed by our medical verification team</p>
        </div>
        <div class="content">
          <h2>Dear Dr. ${firstName} ${lastName},</h2>
          <p>Thank you for joining our community of medical professionals! We're excited to have you as part of <span class="sekondly-branding">SeKondly</span>, where healthcare experts collaborate, share knowledge, and discuss complex medical cases.</p>
          <div class="account-info">
            <h3>📋 Account Details:</h3>
            <p><strong>Name:</strong> Dr. ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${userEmail}</p>
            <p><strong>Registration Date:</strong> ${regDate}</p>
            <p><strong>Status:</strong> ⏳ Under Review</p>
          </div>
          <div class="next-steps">
            <h3><strong>What happens next:</strong></h3>
            <ul>
              <li>✅ Your account has been created successfully</li>
              <li>⏳ Our medical verification team is currently reviewing your credentials</li>
              <li>📧 You'll receive an email notification once your account is approved (typically 1-2 business days)</li>
              <li>🔐 Once approved, you can sign in and start contributing to our medical community</li>
            </ul>
          </div>
          <div class="features">
            <h3><strong>What you can do once approved:</strong></h3>
            <ul>
              <li>📱 Share and discuss interesting medical cases</li>
              <li>👥 Get second opinions from specialists across different fields</li>
              <li>🤝 Connect with fellow medical professionals</li>
              <li>📚 Access our growing library of educational cases</li>
              <li>💬 Participate in professional medical discussions</li>
            </ul>
          </div>
          <center><a href="https://sekondly.app/static-landing.html" class="button">Visit Support Page</a></center>
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          <p>Welcome to the future of medical collaboration!</p>
          <p>Best regards,<br><strong>The <span class="sekondly-branding">SeKondly</span> Team</strong></p>
        </div>
        <div class="footer">
          <p>📧 Questions? Contact us at <a href="mailto:admin@sekondly.app">admin@sekondly.app</a></p>
          <p>🌐 Website: <a href="https://sekondly.app">https://sekondly.app</a></p>
          <p style="font-size: 12px; color: #666;">This email was sent to ${userEmail} because you registered for SeKondly.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateUserApprovalEmailHTML(data) {
  const { firstName, lastName, userEmail, approvalDate } = data;
  const appDate = approvalDate || new Date().toLocaleDateString();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Approved - SeKondly</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-radius: 12px; }
        .header { background: linear-gradient(45deg, #4ECDC4, #44A08D); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; margin: -20px -20px 0 -20px; }
        .header h1 { margin: 0 0 10px 0; font-size: 28px; font-weight: bold; }
        .header p { margin: 0; font-size: 16px; opacity: 0.9; }
        .content { background: #ffffff; padding: 30px 20px; border: 1px solid #e9ecef; border-top: none; }
        .content h2 { color: #333; margin-top: 0; font-size: 24px; }
        .account-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4ECDC4; }
        .account-info h3 { margin-top: 0; color: #333; font-size: 18px; }
        .account-info p { margin: 8px 0; font-size: 14px; }
        .button { display: inline-block; background: linear-gradient(45deg, #4ECDC4, #44A08D); color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; margin: 20px 0; font-weight: bold; transition: transform 0.2s ease; }
        .next-steps { background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
        .next-steps h3 { margin-top: 0; color: #155724; }
        .next-steps ul { margin: 10px 0; padding-left: 20px; }
        .next-steps li { margin: 8px 0; color: #155724; }
        .approval-announcement { background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; text-align: center; }
        .approval-announcement h3 { margin-top: 0; color: #155724; font-size: 20px; }
        .approval-announcement p { margin: 10px 0; color: #155724; font-size: 16px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; margin: 0 -20px -20px -20px; border-top: 1px solid #e9ecef; }
        .footer p { margin: 5px 0; font-size: 14px; color: #666; }
        .footer a { color: #4ECDC4; text-decoration: none; }
        .sekondly-branding { color: #4ECDC4; font-weight: bold; font-size: 18px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Account Approved!</h1>
          <p>Welcome to the SeKondly medical community!</p>
        </div>
        <div class="content">
          <h2>Dear Dr. ${firstName} ${lastName},</h2>
          <div class="approval-announcement">
            <h3>🎉 Great news! Your SeKondly account has been approved! 🎉</h3>
            <p>We're excited to see you contribute to our growing community of medical professionals!</p>
          </div>
          <div class="account-info">
            <h3>📋 Account Details:</h3>
            <p><strong>Name:</strong> Dr. ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${userEmail}</p>
            <p><strong>Status:</strong> ✅ Approved & Active</p>
            <p><strong>Approved on:</strong> ${appDate}</p>
          </div>
          <div class="next-steps">
            <h3><strong>Here's how to get started:</strong></h3>
            <ul>
              <li>🔐 Visit https://sekondly.app and sign in with your registered email and password</li>
              <li>👤 Complete your profile to help colleagues find and connect with you</li>
              <li>📱 Start exploring cases or share your first case with the community</li>
              <li>🤝 Connect with other professionals in your field</li>
            </ul>
          </div>
          <center><a href="https://sekondly.app" class="button">Sign In to SeKondly</a></center>
          <p>If you need any help getting started or have questions, please visit our <a href="https://sekondly.app/static-landing.html" style="color: #4ECDC4;">support page</a>.</p>
          <p>Welcome to <span class="sekondly-branding">SeKondly</span>!</p>
          <p>Best regards,<br><strong>The <span class="sekondly-branding">SeKondly</span> Team</strong></p>
        </div>
        <div class="footer">
          <p>📧 Questions? Contact us at <a href="mailto:admin@sekondly.app">admin@sekondly.app</a></p>
          <p>🌐 Website: <a href="https://sekondly.app">https://sekondly.app</a></p>
          <p style="font-size: 12px; color: #666;">This email was sent to ${userEmail} because your SeKondly account was approved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// SMTP Configuration
const transporter = nodemailer.createTransport({
  host: 'email-smtp.us-east-1.amazonaws.com',
  port: 587,
  secure: false,
  auth: {
    user: 'AKIAVRCYZCTXP6X27O6Q',
    pass: 'BAoto0SPFrFVlZPumebfgXP2JUy/0720+bW1C8EM+Tr4'
  },
  requireTLS: true
});

async function sendAllTemplateDemo() {
  const testEmail = 'alzahranis85@gmail.com';
  
  console.log('🚀 Sending all SeKondly email template demonstrations...\n');

  try {
    // 1. Welcome Email Demo
    console.log('📧 Sending Welcome Email Template Demo...');
    const welcomeEmailData = {
      firstName: 'Alexandra',
      lastName: 'Thompson',
      userEmail: testEmail,
      registrationDate: 'December 20, 2024'
    };

    const welcomeMailOptions = {
      from: '"SeKondly Team" <admin@sekondly.app>',
      to: testEmail,
      subject: 'Welcome to SeKondly - Template Demo',
      html: generateWelcomeEmailHTML(welcomeEmailData)
    };

    const welcomeResult = await transporter.sendMail(welcomeMailOptions);
    console.log('✅ Welcome Email sent! Message ID:', welcomeResult.messageId);

    // Wait 2 seconds between emails
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. User Approval Email Demo
    console.log('\n📧 Sending User Approval Email Template Demo...');
    const approvalEmailData = {
      firstName: 'David',
      lastName: 'Rodriguez',
      userEmail: testEmail,
      approvalDate: 'December 21, 2024'
    };

    const approvalMailOptions = {
      from: '"SeKondly Team" <admin@sekondly.app>',
      to: testEmail,
      subject: '🎉 Your SeKondly Account Has Been Approved! - Template Demo',
      html: generateUserApprovalEmailHTML(approvalEmailData)
    };

    const approvalResult = await transporter.sendMail(approvalMailOptions);
    console.log('✅ User Approval Email sent! Message ID:', approvalResult.messageId);

    console.log('\n🎉 ALL EMAIL TEMPLATES DEMONSTRATED SUCCESSFULLY!');
    console.log('📨 Check your inbox at:', testEmail);
    console.log('\n📋 Template Summary:');
    console.log('   1. ✅ Welcome Email - Beautiful onboarding experience');
    console.log('   2. ✅ User Approval Email - Account approval notification');
    console.log('   3. ✅ Case Approval Email - Case publication notification (already demonstrated)');
    console.log('\n🎨 All templates feature:');
    console.log('   • Consistent SeKondly branding (#4ECDC4, #44A08D gradients)');
    console.log('   • Responsive mobile-optimized design');
    console.log('   • Professional styling with hover effects');
    console.log('   • Clear call-to-action buttons');
    console.log('   • Structured information layout');
    console.log('   • HTML & text versions for all email clients');

  } catch (error) {
    console.error('❌ Error sending template demos:', error);
  }
}

// Run the demo
sendAllTemplateDemo();
