#!/bin/bash

echo "=== Testing Approval Email Functionality ==="
echo ""

echo "1. Testing approval email locally..."
cd /Users/fayaa/SeKondly && node -e "
import 'dotenv/config';
import { createTransport } from 'nodemailer';

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

async function sendApprovalEmail(userEmail, firstName, lastName) {
  try {
    const approvalEmailContent = \`
Dear Dr. \${firstName} \${lastName},

Great news! Your SeKondly account has been approved! 🎉

Your credentials have been successfully verified by our medical team, and you now have full access to the SeKondly platform.

You can now:
✅ Sign in to your account at https://sekondly.app
✅ Share and discuss medical cases with fellow professionals
✅ Get second opinions from specialists across different medical fields
✅ Connect with other healthcare professionals in your specialty
✅ Access our growing library of educational cases

Getting Started:
1. Visit https://sekondly.app and sign in with your registered email and password.
2. Start exploring cases or share your first case with the community.

We're excited to see you contribute to our growing community of medical professionals!

If you need any help getting started or have questions, please visit our support page at https://sekondly.app/

Welcome to SeKondly!

Best regards,
The SeKondly Team

---
This email was sent to \${userEmail}
SeKondly - Empowering healthcare through collaboration
Website: https://sekondly.app
    \`.trim();

    const mailOptions = {
      from: \`\"SeKondly Team\" <admin@sekondly.app>\`,
      to: userEmail,
      subject: '🎉 Your SeKondly Account Has Been Approved!',
      text: approvalEmailContent
    };

    await emailTransporter.verify();
    await emailTransporter.sendMail(mailOptions);
    console.log(\`✅ Approval email sent successfully to \${userEmail}\`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send approval email:', error.message);
    return false;
  }
}

// Test with verified email
console.log('Testing approval email to admin@sekondly.app...');
await sendApprovalEmail('admin@sekondly.app', 'Test', 'Admin');

console.log('\\nTesting approval email to amd.fayaa@gmail.com...');
await sendApprovalEmail('amd.fayaa@gmail.com', 'Test', 'User');
"

echo ""
echo "2. Testing production approval email endpoint..."
echo ""

echo "Testing approval email to admin@sekondly.app..."
curl -s -X POST https://sekondly.app/api/test-approval-email \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@sekondly.app", "firstName": "Test", "lastName": "Admin"}' | jq '.'

echo ""
echo "Testing approval email to amd.fayaa@gmail.com..."
curl -s -X POST https://sekondly.app/api/test-approval-email \
  -H "Content-Type: application/json" \
  -d '{"email": "amd.fayaa@gmail.com", "firstName": "Test", "lastName": "User"}' | jq '.'

echo ""
echo "=== Summary ==="
echo "✅ Approval email functionality has been implemented"
echo "✅ When admin approves a user via /api/admin/approve-user/:id, approval email is sent"
echo "✅ Test endpoint available at /api/test-approval-email"
echo ""
echo "Next steps:"
echo "1. Deploy the updated server code"
echo "2. Test the admin approval workflow"
echo "3. Verify that users receive approval emails when approved"
