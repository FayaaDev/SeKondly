/**
 * User Approval Email Template for SeKondly
 * Professional email template with SeKondly branding and styling
 * Uses the same design as the Case Approval template
 */

interface UserApprovalEmailData {
  firstName: string;
  lastName: string;
  userEmail: string;
  approvalDate?: string;
}

export function generateUserApprovalEmailHTML(data: UserApprovalEmailData): string {
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
        .account-info { 
          background: #f8f9fa; 
          padding: 20px; 
          border-radius: 8px; 
          margin: 20px 0;
          border-left: 4px solid #4ECDC4;
        }
        .account-info h3 {
          margin-top: 0;
          color: #333;
          font-size: 18px;
        }
        .account-info p {
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
        .approval-announcement {
          background: #d4edda;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #28a745;
          text-align: center;
        }
        .approval-announcement h3 {
          margin-top: 0;
          color: #155724;
          font-size: 20px;
        }
        .approval-announcement p {
          margin: 10px 0;
          color: #155724;
          font-size: 16px;
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
          
          <center>
            <a href="https://sekondly.app" class="button">Sign In to SeKondly</a>
          </center>
          
          <p>If you need any help getting started or have questions, please visit our <a href="https://sekondly.app/static-landing.html" style="color: #4ECDC4;">support page</a>.</p>
          
          <p>Welcome to <span class="sekondly-branding">SeKondly</span>!</p>
          
          <p>Best regards,<br>
          <strong>The <span class="sekondly-branding">SeKondly</span> Team</strong></p>
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

export function generateUserApprovalEmailText(data: UserApprovalEmailData): string {
  const { firstName, lastName, userEmail, approvalDate } = data;
  const appDate = approvalDate || new Date().toLocaleDateString();

  return `
Dear Dr. ${firstName} ${lastName},

🎉 ACCOUNT APPROVED! 🎉

Great news! Your SeKondly account has been approved! 🎉

We're excited to see you contribute to our growing community of medical professionals!

ACCOUNT DETAILS:
- Name: Dr. ${firstName} ${lastName}
- Email: ${userEmail}
- Status: ✅ Approved & Active
- Approved on: ${appDate}

HERE'S HOW TO GET STARTED:
🔐 Visit https://sekondly.app and sign in with your registered email and password
👤 Complete your profile to help colleagues find and connect with you
📱 Start exploring cases or share your first case with the community
🤝 Connect with other professionals in your field

Sign In to SeKondly: https://sekondly.app

If you need any help getting started or have questions, please visit our support page: https://sekondly.app/static-landing.html

Welcome to SeKondly!

Best regards,
The SeKondly Team

---
📧 Questions? Contact us at admin@sekondly.app
🌐 Website: https://sekondly.app

This email was sent to ${userEmail} because your SeKondly account was approved.
  `.trim();
}

export function generateUserApprovalEmail(data: UserApprovalEmailData) {
  return {
    subject: "🎉 Your SeKondly Account Has Been Approved!",
    html: generateUserApprovalEmailHTML(data),
    text: generateUserApprovalEmailText(data)
  };
}
