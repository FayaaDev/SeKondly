/**
 * Case Approval Email Template Usage Example
 * How to integrate the template into existing SeKondly email system
 */

// Example integration into server/routes.ts or email service

import { generateCaseApprovalEmail } from './caseApprovalTemplate';
import nodemailer from 'nodemailer';

// Your existing email transporter
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

/**
 * Send case approval email using the template
 * @param {string} userEmail - Recipient email address
 * @param {string} firstName - User's first name
 * @param {string} lastName - User's last name
 * @param {string} caseTitle - Title of the approved case
 * @param {number} caseId - ID of the approved case
 * @param {string} approvalDate - Optional custom approval date
 * @returns {Promise<boolean>} - Success status
 */
export async function sendCaseApprovalEmail(
  userEmail: string, 
  firstName: string, 
  lastName: string, 
  caseTitle: string, 
  caseId: number, 
  approvalDate?: string
): Promise<boolean> {
  try {
    console.log(`📧 Sending case approval email to: ${userEmail}`);
    console.log(`📋 Case: "${caseTitle}" (ID: ${caseId})`);
    
    // Verify SMTP connection
    await emailTransporter.verify();
    console.log('✅ SMTP connection verified');
    
    // Prepare template data
    const templateData = {
      firstName,
      lastName,
      caseTitle,
      caseId,
      approvalDate
    };
    
    // Generate email content using the template
    const emailContent = generateCaseApprovalEmail(templateData);
    
    // Mail options
    const mailOptions = {
      from: '"SeKondly Team" <admin@sekondly.app>',
      to: userEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    };

    // Send the email
    const result = await emailTransporter.sendMail(mailOptions);
    console.log('✅ Case approval email sent successfully!');
    console.log('📧 Message ID:', result.messageId);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to send case approval email:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

// Usage in case approval endpoint:
/*
app.post("/api/admin/approve-case/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const caseId = parseInt(req.params.id);
    const adminId = req.session?.user?.id || 'system';
    
    // Approve the case
    const approvedCase = await storage.approveCase(caseId, adminId);
    
    // Get case author details
    if (approvedCase && approvedCase.authorId) {
      const caseAuthor = await storage.getUser(approvedCase.authorId);
      
      if (caseAuthor && caseAuthor.email && caseAuthor.firstName && caseAuthor.lastName) {
        try {
          // Send case approval email using template
          const emailSent = await sendCaseApprovalEmail(
            caseAuthor.email,
            caseAuthor.firstName,
            caseAuthor.lastName,
            approvedCase.title,
            approvedCase.id,
            new Date().toLocaleDateString()
          );
          
          console.log(`Case approval email ${emailSent ? 'sent' : 'failed'} for case: ${approvedCase.title}`);
        } catch (emailError) {
          console.error('Error sending case approval email:', emailError);
          // Don't fail the approval if email fails
        }
      }
    }
    
    res.json(approvedCase);
  } catch (error) {
    console.error("Error approving case:", error);
    res.status(500).json({ message: "Failed to approve case" });
  }
});
*/

// Template Features:
console.log(`
📧 Case Approval Email Template Features:

✅ Professional SeKondly branding and styling
✅ Responsive design for mobile and desktop
✅ Enhanced visual hierarchy with gradients and colors
✅ Clear case information display
✅ Action-oriented "What happens next?" section
✅ Prominent call-to-action button
✅ Contact information and support links
✅ Both HTML and plain text versions
✅ Customizable approval date
✅ Consistent with SeKondly design system

🎨 Styling Features:
- SeKondly brand colors (#4ECDC4, #44A08D)
- Professional gradient headers
- Card-based layout with shadows
- Mobile-responsive design
- Hover effects on buttons
- Clear typography hierarchy
- Branded footer with contact info

🔧 Integration Ready:
- TypeScript interfaces for type safety
- Modular template functions
- Easy to customize and extend
- Compatible with existing email system
- Error handling included
- Production-ready code
`);

export default { sendCaseApprovalEmail };
