/**
 * Welcome Email Template for SeKondly
 * Professional email template with SeKondly branding and styling
 * Uses the same design as the Case Approval template
 */

interface WelcomeEmailData {
  firstName: string;
  lastName: string;
  userEmail: string;
  registrationDate?: string;
}

export function generateWelcomeEmailHTML(data: WelcomeEmailData): string {
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
          background: #fff3cd;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #ffc107;
        }
        .next-steps h3 {
          margin-top: 0;
          color: #856404;
        }
        .next-steps ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        .next-steps li {
          margin: 8px 0;
          color: #856404;
        }
        .features {
          background: #e8f5e8;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #28a745;
        }
        .features h3 {
          margin-top: 0;
          color: #155724;
        }
        .features ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        .features li {
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
          
          <center>
            <a href="https://sekondly.app/static-landing.html" class="button">Visit Support Page</a>
          </center>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          
          <p>Welcome to the future of medical collaboration!</p>
          
          <p>Best regards,<br>
          <strong>The <span class="sekondly-branding">SeKondly</span> Team</strong></p>
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

export function generateWelcomeEmailText(data: WelcomeEmailData): string {
  const { firstName, lastName, userEmail, registrationDate } = data;
  const regDate = registrationDate || new Date().toLocaleDateString();

  return `
Dear Dr. ${firstName} ${lastName},

🎉 WELCOME TO SEKONDLY! 🎉

Thank you for joining our community of medical professionals! We're excited to have you as part of SeKondly, where healthcare experts collaborate, share knowledge, and discuss complex medical cases.

ACCOUNT DETAILS:
- Name: Dr. ${firstName} ${lastName}
- Email: ${userEmail}
- Registration Date: ${regDate}
- Status: ⏳ Under Review

WHAT HAPPENS NEXT:
✅ Your account has been created successfully
⏳ Our medical verification team is currently reviewing your credentials
📧 You'll receive an email notification once your account is approved (typically 1-2 business days)
🔐 Once approved, you can sign in and start contributing to our medical community

WHAT YOU CAN DO ONCE APPROVED:
📱 Share and discuss interesting medical cases
👥 Get second opinions from specialists across different fields
🤝 Connect with fellow medical professionals
📚 Access our growing library of educational cases
💬 Participate in professional medical discussions

Support: https://sekondly.app/static-landing.html

If you have any questions or need assistance, please don't hesitate to contact our support team.

Welcome to the future of medical collaboration!

Best regards,
The SeKondly Team

---
📧 Questions? Contact us at admin@sekondly.app
🌐 Website: https://sekondly.app

This email was sent to ${userEmail} because you registered for SeKondly.
  `.trim();
}

export function generateWelcomeEmail(data: WelcomeEmailData) {
  return {
    subject: "Welcome to SeKondly - Your Account is Being Reviewed",
    html: generateWelcomeEmailHTML(data),
    text: generateWelcomeEmailText(data)
  };
}
