/**
 * Case Rejection Email Template for SeKondly
 * Professional email template with SeKondly branding and styling
 * Uses the same design as the User Approval and Welcome templates
 */

interface CaseRejectionEmailData {
  firstName: string;
  lastName: string;
  caseTitle: string;
  caseId: number;
  rejectionReason: string;
  rejectionDate?: string;
}

export function generateCaseRejectionEmailHTML(data: CaseRejectionEmailData): string {
  const { firstName, lastName, caseTitle, caseId, rejectionReason, rejectionDate } = data;
  const rejDate = rejectionDate || new Date().toLocaleDateString();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Case Review Status - SeKondly</title>
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
        .rejection-announcement {
          background: #f8d7da;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #dc3545;
          text-align: center;
        }
        .rejection-announcement h3 {
          margin-top: 0;
          color: #721c24;
          font-size: 20px;
        }
        .rejection-announcement p {
          margin: 10px 0;
          color: #721c24;
          font-size: 16px;
        }
        .rejection-reason {
          background: #fff3cd;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #ffc107;
        }
        .rejection-reason h3 {
          margin-top: 0;
          color: #856404;
          font-size: 18px;
        }
        .rejection-reason p {
          margin: 10px 0;
          color: #856404;
          font-size: 14px;
          line-height: 1.6;
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
          <h1>📋 Case Review Update</h1>
          <p>Your case submission has been reviewed by our moderation team</p>
        </div>
        
        <div class="content">
          <h2>Dear Dr. ${firstName} ${lastName},</h2>
          
          <p>Thank you for submitting your medical case to <span class="sekondly-branding">SeKondly</span>. After careful review by our moderation team, we need to provide you with an update regarding your case submission.</p>
          
          <div class="rejection-announcement">
            <h3>⚠️ Case Requires Revision</h3>
            <p>Your case submission needs some adjustments before it can be published on our platform.</p>
          </div>
          
          <div class="case-info">
            <h3>📋 Case Details:</h3>
            <p><strong>Case Title:</strong> ${caseTitle}</p>
            <p><strong>Case ID:</strong> #${caseId}</p>
            <p><strong>Status:</strong> ❌ Requires Revision</p>
            <p><strong>Review Date:</strong> ${rejDate}</p>
          </div>
          
          <div class="rejection-reason">
            <h3><strong>📝 Feedback for Improvement:</strong></h3>
            <p>${rejectionReason}</p>
          </div>
          
          <div class="next-steps">
            <h3><strong>What you can do next:</strong></h3>
            <ul>
              <li>📝 Review the feedback provided above</li>
              <li>✏️ Make the necessary adjustments to your case</li>
              <li>🔄 Submit an updated version of your case</li>
              <li>💬 Contact our support team if you need clarification</li>
              <li>📚 Review our case submission guidelines for best practices</li>
            </ul>
          </div>
          
          <center>
            <a href="https://sekondly.app" class="button">Submit Revised Case</a>
          </center>
          
          <p>We appreciate your contribution to the medical community and encourage you to resubmit your case after addressing the feedback. Our goal is to maintain the highest quality of medical content for educational purposes.</p>
          
          <p>If you have any questions about the feedback or need assistance with revisions, please don't hesitate to contact our support team.</p>
          
          <p>Best regards,<br>
          <strong>The <span class="sekondly-branding">SeKondly</span> Moderation Team</strong></p>
        </div>
        
        <div class="footer">
          <p>📧 Questions? Contact us at <a href="mailto:admin@sekondly.app">admin@sekondly.app</a></p>
          <p>🌐 Website: <a href="https://sekondly.app">https://sekondly.app</a></p>
          <p style="font-size: 12px; color: #666;">This email was sent because your case was reviewed on SeKondly.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateCaseRejectionEmailText(data: CaseRejectionEmailData): string {
  const { firstName, lastName, caseTitle, caseId, rejectionReason, rejectionDate } = data;
  const rejDate = rejectionDate || new Date().toLocaleDateString();

  return `
Dear Dr. ${firstName} ${lastName},

📋 CASE REVIEW UPDATE

Thank you for submitting your medical case to SeKondly. After careful review by our moderation team, we need to provide you with an update regarding your case submission.

⚠️ CASE REQUIRES REVISION ⚠️

Your case submission needs some adjustments before it can be published on our platform.

CASE DETAILS:
- Case Title: ${caseTitle}
- Case ID: #${caseId}
- Status: ❌ Requires Revision
- Review Date: ${rejDate}

📝 FEEDBACK FOR IMPROVEMENT:
${rejectionReason}

WHAT YOU CAN DO NEXT:
📝 Review the feedback provided above
✏️ Make the necessary adjustments to your case
🔄 Submit an updated version of your case
💬 Contact our support team if you need clarification
📚 Review our case submission guidelines for best practices

Submit Revised Case: https://sekondly.app

We appreciate your contribution to the medical community and encourage you to resubmit your case after addressing the feedback. Our goal is to maintain the highest quality of medical content for educational purposes.

If you have any questions about the feedback or need assistance with revisions, please don't hesitate to contact our support team.

Best regards,
The SeKondly Moderation Team

---
📧 Questions? Contact us at admin@sekondly.app
🌐 Website: https://sekondly.app

This email was sent because your case was reviewed on SeKondly.
  `.trim();
}

export function generateCaseRejectionEmail(data: CaseRejectionEmailData) {
  return {
    subject: `📋 Case Review Update: "${data.caseTitle}" Requires Revision`,
    html: generateCaseRejectionEmailHTML(data),
    text: generateCaseRejectionEmailText(data)
  };
}
