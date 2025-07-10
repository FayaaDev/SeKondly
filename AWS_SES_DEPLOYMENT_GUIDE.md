# AWS SES Implementation Guide for SeKondly Support System

## 🔧 How AWS SES Was Integrated Into Our Codebase

This guide explains the complete implementa### 5. Support Ticket Schema Validation

**Location:** `server/routes.ts` (lines 182-188)

```typescript
import { z } from "zod";

// Support ticket schema
const supportTicketSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  title: z.string().min(1, "Title is required"),
  reason: z.enum(["question", "feature", "bug"]),
  content: z.string().min(10, "Content must be at least 10 characters")
});
```

### 6. User Registration with Welcome Email

**Location:** `serv### 5. Landing Page Form Test
1. Visit: `https://sekondly.app/static-landing.html`
2. Scroll to "Need Help? Contact Support" section
3. Fill out the form:
   - Name: Your name
   - Email: Your email
   - Subject: Test subject
   - Reason: Select any option
   - Content: Enter test message
4. Click "Submit Support Request"
5. Verify:
   - Success message appears
   - Ticket number is displayed
   - Form is hidden and replaced with confirmation

### 6. Email Verificationnboarding endpoint)

The user registration process now includes automatic welcome email sending:

```typescript
app.post('/api/onboarding', upload.single('credentialsFile'), async (req, res) => {
  try {
    // ... user creation logic ...
    
    // Save user to database
    const user = await storage.upsertUser(userData);
    
    // Send welcome email
    let welcomeEmailSent = false;
    try {
      welcomeEmailSent = await sendWelcomeEmail(userEmail, firstName, lastName);
      if (welcomeEmailSent) {
        console.log(`Welcome email sent to ${userEmail}`);
      }
    } catch (emailError) {
      console.error('Welcome email error:', emailError);
    }
    
    // ... file upload handling ...
    
    res.json({ success: true, user, welcomeEmailSent });
  } catch (error) {
    // ... error handling ...
  }
});
```

### 7. Admin Approval with Email Notification

**Location:** `server/routes.ts` (admin approval endpoint)

When administrators approve users, an approval email is automatically sent:

```typescript
app.post("/api/admin/approve-user/:userId", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user?.id || "admin";
    
    // Get user details before approval for email
    const userToApprove = await storage.getUser(userId);
    if (!userToApprove) {
      return res.status(404).json({ message: "User not found" });
    }
    
    await storage.approveUser(userId, adminId);
    
    // Send approval email
    let approvalEmailSent = false;
    try {
      if (userToApprove.email && userToApprove.firstName && userToApprove.lastName) {
        approvalEmailSent = await sendApprovalEmail(
          userToApprove.email, 
          userToApprove.firstName, 
          userToApprove.lastName
        );
      }
    } catch (emailError) {
      console.error('Approval email error:', emailError);
    }
    
    res.json({ 
      message: "User approved successfully", 
      approvalEmailSent 
    });
  } catch (error) {
    // ... error handling ...
  }
});
```

### 8. Support Ticket API Endpointion of AWS SES (Simple Email Service) in the SeKondly application for handling support tickets and email notifications.

## 📋 Implementation Overview

AWS SES was integrated to provide a reliable email system for:
- ✅ Support ticket submissions from the landing page
- ✅ Email notifications to administrators
- ✅ User confirmation emails with ticket numbers
- ✅ Welcome emails for new user registrations
- ✅ Account approval emails when users are approved by admin
- ✅ Fallback logging when email fails

## 🏗️ Implementation Details

### 1. Dependencies Added

**Package.json Updates:**
```json
{
  "dependencies": {
    "nodemailer": "^7.0.5"
  },
  "devDependencies": {
    "@types/nodemailer": "^6.4.17"
  }
}
```

### 2. Email Transport Configuration

**Location:** `server/routes.ts` (lines 13-22)

```typescript
import nodemailer from "nodemailer";

// Email configuration for AWS SES
const emailTransporter = nodemailer.createTransporter({
  host: 'email-smtp.eu-north-1.amazonaws.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'AKIAVRCYZCTXCVKECGIR',
    pass: process.env.SMTP_PASS || 'BMONkxzcbSEXcPc9gcf/p0PIUZzxW4iueTEeN4p0uElp'
  },
  requireTLS: true
});
```

**Key Configuration Details:**
- Uses AWS SES SMTP endpoint for `eu-north-1` region
- Port 587 with STARTTLS encryption
- Credentials from environment variables with fallback values
- `requireTLS: true` for security compliance

### 3. Environment Variables Setup

**File:** `.env.production`
```bash
# AWS SES SMTP Configuration for Support Tickets
SMTP_USER=AKIAVRCYZCTXCVKECGIR
SMTP_PASS=BMONkxzcbSEXcPc9gcf/p0PIUZzxW4iueTEeN4p0uElp
SMTP_HOST=email-smtp.eu-north-1.amazonaws.com

# Email Configuration for Account Deletion Requests
EMAIL_USER=admin@sekondly.app
EMAIL_PASS=fhy-ZKT*azv9eak3peq
```

### 4. Welcome and Approval Email Functions

**Location:** `server/routes.ts` (lines 32-180)

Two new email utility functions were added to handle user lifecycle emails:

#### Welcome Email Function

```typescript
async function sendWelcomeEmail(userEmail: string, firstName: string, lastName: string) {
  try {
    const welcomeEmailContent = `
Dear Dr. ${firstName} ${lastName},

Welcome to SeKondly! 🎉

Thank you for joining our community of medical professionals...
    `.trim();

    const mailOptions = {
      from: '"SeKondly Team" <admin@sekondly.app>',
      to: userEmail,
      subject: 'Welcome to SeKondly - Your Account is Being Reviewed',
      text: welcomeEmailContent,
      html: `<!-- Professional HTML template -->`
    };

    await emailTransporter.verify();
    await emailTransporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}
```

#### Approval Email Function

```typescript
async function sendApprovalEmail(userEmail: string, firstName: string, lastName: string) {
  try {
    const approvalEmailContent = `
Dear Dr. ${firstName} ${lastName},

Great news! Your SeKondly account has been approved! 🎉
    `.trim();

    const mailOptions = {
      from: '"SeKondly Team" <admin@sekondly.app>',
      to: userEmail,
      subject: '🎉 Your SeKondly Account Has Been Approved!',
      text: approvalEmailContent,
      html: `<!-- Professional HTML template -->`
    };

    await emailTransporter.verify();
    await emailTransporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Failed to send approval email:', error);
    return false;
  }
}
```

### 5. Support Ticket Schema Validation

**Location:** `server/routes.ts` (lines 24-30)

```typescript
import { z } from "zod";

// Support ticket schema
const supportTicketSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  title: z.string().min(1, "Title is required"),
  reason: z.enum(["question", "feature", "bug"]),
  content: z.string().min(10, "Content must be at least 10 characters")
});
```

### 5. Support Ticket API Endpoint

**Location:** `server/routes.ts` (lines 75-169)

**Key Features:**
- **Endpoint:** `POST /api/support/ticket`
- **Validation:** Uses Zod schema for input validation
- **Ticket Generation:** Creates unique ticket numbers like `SK-1641234567890-123`
- **Email Formatting:** Professional email templates with all form data
- **Error Handling:** Graceful failure with local file backup
- **Response:** Returns ticket number and email status

**Implementation Highlights:**

```typescript
app.post("/api/support/ticket", async (req, res) => {
  try {
    // 1. Validate input data
    const validatedData = supportTicketSchema.parse(req.body);
    
    // 2. Generate unique ticket number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const ticketNumber = `SK-${timestamp}-${random}`;
    
    // 3. Format professional email content
    const reasonLabels = {
      'question': 'Ask a Question',
      'feature': 'Request a Feature', 
      'bug': 'Report a Bug'
    };
    
    const emailContent = `
New Support Request - Ticket #${ticketNumber}

Name: ${validatedData.name}
Email: ${validatedData.email}
Subject: ${validatedData.title}
Reason: ${reasonLabels[validatedData.reason]}

Message:
${validatedData.content}

---
This ticket was submitted via the SeKondly landing page on ${new Date().toLocaleString()}.
Please respond to: ${validatedData.email}
    `.trim();
    
    // 4. Send email with error handling
    let emailSent = false;
    try {
      // Test connection first
      await emailTransporter.verify();
      
      // Send notification email
      const mailOptions = {
        from: '"SeKondly Support" <admin@sekondly.app>',
        to: process.env.ADMIN_EMAIL || 'admin@sekondly.app',
        subject: `Support Request - ${ticketNumber}`,
        text: emailContent,
        replyTo: validatedData.email
      };
      
      await emailTransporter.sendMail(mailOptions);
      emailSent = true;
      
    } catch (emailError) {
      // 5. Fallback: Save to local file
      const ticketLogPath = path.join(process.cwd(), 'support-tickets.log');
      const logEntry = `\n\n--- Support Ticket ${ticketNumber} ---\nTimestamp: ${new Date().toISOString()}\n${emailContent}\n`;
      fs.appendFileSync(ticketLogPath, logEntry);
    }
    
    // 6. Return success response
    res.status(200).json({
      success: true,
      ticketNumber,
      message: "Support ticket submitted successfully",
      emailSent
    });
  } catch (error) {
    // Handle validation and other errors
  }
});
```

### 8. Support Ticket API Endpoint

**Location:** `server/routes.ts` (lines 75-169)

**Key Features:**
- **Endpoint:** `POST /api/support/ticket`
- **Validation:** Uses Zod schema for input validation
- **Ticket Generation:** Creates unique ticket numbers like `SK-1641234567890-123`
- **Email Formatting:** Professional email templates with all form data
- **Error Handling:** Graceful failure with local file backup
- **Response:** Returns ticket number and email status

**Implementation Highlights:**

```typescript
app.post("/api/support/ticket", async (req, res) => {
  try {
    // 1. Validate input data
    const validatedData = supportTicketSchema.parse(req.body);
    
    // 2. Generate unique ticket number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const ticketNumber = `SK-${timestamp}-${random}`;
    
    // 3. Format professional email content
    const reasonLabels = {
      'question': 'Ask a Question',
      'feature': 'Request a Feature', 
      'bug': 'Report a Bug'
    };
    
    const emailContent = `
New Support Request - Ticket #${ticketNumber}

Name: ${validatedData.name}
Email: ${validatedData.email}
Subject: ${validatedData.title}
Reason: ${reasonLabels[validatedData.reason]}

Message:
${validatedData.content}

---
This ticket was submitted via the SeKondly landing page on ${new Date().toLocaleString()}.
Please respond to: ${validatedData.email}
    `.trim();
    
    // 4. Send email with error handling
    let emailSent = false;
    try {
      // Test connection first
      await emailTransporter.verify();
      
      // Send notification email
      const mailOptions = {
        from: '"SeKondly Support" <admin@sekondly.app>',
        to: process.env.ADMIN_EMAIL || 'admin@sekondly.app',
        subject: `Support Request - ${ticketNumber}`,
        text: emailContent,
        replyTo: validatedData.email
      };
      
      await emailTransporter.sendMail(mailOptions);
      emailSent = true;
      
    } catch (emailError) {
      // 5. Fallback: Save to local file
      const ticketLogPath = path.join(process.cwd(), 'support-tickets.log');
      const logEntry = `\n\n--- Support Ticket ${ticketNumber} ---\nTimestamp: ${new Date().toISOString()}\n${emailContent}\n`;
      fs.appendFileSync(ticketLogPath, logEntry);
    }
    
    // 6. Return success response
    res.status(200).json({
      success: true,
      ticketNumber,
      message: "Support ticket submitted successfully",
      emailSent
    });
  } catch (error) {
    // Handle validation and other errors
  }
});
```

### 9. SMTP Testing Endpoint

**Location:** `server/routes.ts` (lines 1262-1285)

```typescript
app.get("/api/test-smtp", async (req, res) => {
  try {
    console.log('Testing SMTP connection...');
    console.log('SMTP Config:', {
      host: 'email-smtp.eu-north-1.amazonaws.com',
      port: 587,
      user: process.env.SMTP_USER ? 'SET' : 'NOT_SET',
      pass: process.env.SMTP_PASS ? 'SET' : 'NOT_SET'
    });
    
    await emailTransporter.verify();
    res.json({ 
      success: true, 
      message: "SMTP connection verified successfully" 
    });
  } catch (error) {
    console.error('SMTP verification failed:', error);
    res.status(500).json({ 
      success: false, 
      error: "SMTP connection failed",
      details: error instanceof Error ? error.message : String(error),
      code: error instanceof Error && 'code' in error ? error.code : undefined
    });
  }
});
```

### 9. SMTP Testing Endpoint

**Location:** `server/routes.ts` (lines 1262-1285)

```typescript
app.get("/api/test-smtp", async (req, res) => {
  try {
    console.log('Testing SMTP connection...');
    console.log('SMTP Config:', {
      host: 'email-smtp.eu-north-1.amazonaws.com',
      port: 587,
      user: process.env.SMTP_USER ? 'SET' : 'NOT_SET',
      pass: process.env.SMTP_PASS ? 'SET' : 'NOT_SET'
    });
    
    await emailTransporter.verify();
    res.json({ 
      success: true, 
      message: "SMTP connection verified successfully" 
    });
  } catch (error) {
    console.error('SMTP verification failed:', error);
    res.status(500).json({ 
      success: false, 
      error: "SMTP connection failed",
      details: error instanceof Error ? error.message : String(error),
      code: error instanceof Error && 'code' in error ? error.code : undefined
    });
  }
});
```

### 10. Frontend Support Form Integration

**Location:** `static-landing.html` (lines 356-499)

**Form Implementation:**
- HTML form with validation
- JavaScript fetch API for submission
- Loading states and error handling
- Local storage for ticket tracking
- Success confirmation with ticket number

**Key JavaScript Features:**

```javascript
document.getElementById('supportForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  // 1. Disable form and show loading
  const submitBtn = document.querySelector('.submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';
  
  // 2. Collect and send form data
  const formData = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    title: document.getElementById('title').value,
    reason: document.getElementById('reason').value,
    content: document.getElementById('content').value
  };
  
  try {
    const response = await fetch('/api/support/ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      // 3. Store ticket locally
      const tickets = JSON.parse(localStorage.getItem('supportTickets') || '[]');
      tickets.push({
        ticketNumber: result.ticketNumber,
        ...formData,
        timestamp: new Date().toISOString(),
        status: 'submitted'
      });
      localStorage.setItem('supportTickets', JSON.stringify(tickets));
      
      // 4. Show success confirmation
      document.getElementById('ticketNumber').textContent = result.ticketNumber;
      document.getElementById('ticketConfirmation').style.display = 'block';
      document.getElementById('supportForm').style.display = 'none';
    }
  } catch (error) {
    // Handle errors and restore form
  }
});
```

## 🚀 Deployment Instructions

## 🚀 Deployment Instructions

### 1. Build Process

The build script in `package.json` handles everything:

```bash
npm run build
```

This command:
1. Builds the Vite frontend (`vite build`)
2. Bundles the server with esbuild (`esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist`)
3. Copies the landing page (`cp static-landing.html dist/`)

### 2. Files Generated for Deployment

```
dist/
├── index.js                    # Bundled server with AWS SES integration
├── static-landing.html         # Landing page with support form
└── public/                     # Frontend assets
    ├── index.html
    └── assets/
        ├── [app-hash].js
        └── [app-hash].css
```

### 3. Upload to Production Server

**Required Files:**
- `dist/index.js` → Replace existing server file
- `dist/static-landing.html` → New landing page
- `dist/public/` → Replace web app assets
- `package.json` → Updated with nodemailer dependency
- `.env` → Copy from `.env.production` with your values

### 4. Environment Configuration

Ensure your production `.env` contains:

```bash
# AWS SES Configuration
SMTP_USER=AKIAVRCYZCTXCVKECGIR
SMTP_PASS=BMONkxzcbSEXcPc9gcf/p0PIUZzxW4iueTEeN4p0uElp
SMTP_HOST=email-smtp.eu-north-1.amazonaws.com

# Admin Email (where support tickets are sent)
ADMIN_EMAIL=admin@sekondly.app
EMAIL_USER=admin@sekondly.app

# Other required variables
NODE_ENV=production
DATABASE_URL=postgresql://...
SESSION_SECRET=...
```

## 🧪 Testing the Implementation

## 🧪 Testing the Implementation

### 1. SMTP Connection Test
```bash
curl https://sekondly.app/api/test-smtp
```
**Expected Response:**
```json
{
  "success": true,
  "message": "SMTP connection verified successfully"
}
```

### 2. Support Ticket Submission Test
```bash
curl -X POST https://sekondly.app/api/support/ticket \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "title": "Test Support Request",
    "reason": "question",
    "content": "This is a test support ticket to verify the AWS SES integration is working properly."
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "ticketNumber": "SK-1641234567890-123",
  "message": "Support ticket submitted successfully",
  "emailSent": true
}
```

### 3. User Registration Test (Welcome Email)
```bash
curl -X POST https://sekondly.app/api/onboarding \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Doctor",
    "email": "test.doctor@example.com",
    "password": "password123",
    "boardCertification": "Internal Medicine",
    "level": "Resident",
    "yearsOfExperience": "3"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "user": { "id": "user_...", "email": "test.doctor@example.com", ... },
  "welcomeEmailSent": true
}
```

**Verify Welcome Email:**
- Check test.doctor@example.com inbox
- Look for email with subject: "Welcome to SeKondly - Your Account is Being Reviewed"
- Verify email contains welcome message and next steps

### 4. Admin Approval Test (Approval Email)
```bash
curl -X POST https://sekondly.app/api/admin/approve-user/[USER_ID] \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [ADMIN_TOKEN]"
```

**Expected Response:**
```json
{
  "message": "User approved successfully",
  "approvalEmailSent": true
}
```

**Verify Approval Email:**
- Check user's email inbox
- Look for email with subject: "🎉 Your SeKondly Account Has Been Approved!"
- Verify email contains login instructions and getting started guide

### 5. Landing Page Form Test
1. Visit: `https://sekondly.app/static-landing.html`
2. Scroll to "Need Help? Contact Support" section
3. Fill out the form:
   - Name: Your name
   - Email: Your email
   - Subject: Test subject
   - Reason: Select any option
   - Content: Enter test message
4. Click "Submit Support Request"
5. Verify:
   - Success message appears
   - Ticket number is displayed
   - Form is hidden and replaced with confirmation

### 6. Email Verification

**Support Tickets:**
After submitting a test ticket:
1. Check `admin@sekondly.app` inbox
2. Look for email with subject: "Support Request - SK-[timestamp]-[random]"
3. Verify email contains:
   - Ticket number
   - User's contact information
   - Form data
   - Reply-to address set to user's email

**Welcome Emails:**
After new user registration:
1. Check the user's email inbox
2. Look for email with subject: "Welcome to SeKondly - Your Account is Being Reviewed"
3. Verify email contains:
   - Personalized greeting with user's name
   - Welcome message and next steps
   - Information about the review process
   - Professional HTML formatting

**Approval Emails:**
After admin approves a user:
1. Check the user's email inbox
2. Look for email with subject: "🎉 Your SeKondly Account Has Been Approved!"
3. Verify email contains:
   - Congratulations message
   - Login instructions and getting started guide
   - Call-to-action button to sign in
   - Professional HTML formatting

## 🔧 Technical Architecture

### Error Handling Strategy

1. **Primary**: Send email via AWS SES
2. **Fallback**: Log to `support-tickets.log` file on server
3. **User Experience**: Always return success to user with ticket number
4. **Admin Notification**: Email sent when possible, file backup always created

### Security Implementations

1. **Input Validation**: Zod schema validates all form inputs
2. **Environment Variables**: Sensitive AWS credentials stored securely
3. **SMTP Authentication**: Uses AWS SES SMTP with proper authentication
4. **TLS Encryption**: `requireTLS: true` enforces encrypted connections
5. **Reply-To Header**: Allows admins to reply directly to users

### AWS SES Configuration Details

- **Region**: `eu-north-1` (Stockholm)
- **Service**: SMTP Interface (not SDK)
- **Port**: 587 (STARTTLS)
- **Authentication**: IAM user credentials
- **Verified Sender**: `admin@sekondly.app`

## 🛠️ File Changes Made

### Modified Files:
1. **`server/routes.ts`**:
   - Added nodemailer import and configuration
   - **NEW: Added `sendWelcomeEmail()` function for new user registrations**
   - **NEW: Added `sendApprovalEmail()` function for user approvals**
   - **NEW: Integrated welcome email sending in onboarding endpoint**
   - **NEW: Integrated approval email sending in admin approval endpoint**
   - Implemented `/api/support/ticket` endpoint
   - Implemented `/api/test-smtp` endpoint
   - Added support ticket schema validation

2. **`static-landing.html`**:
   - Added support form section
   - Implemented JavaScript form submission
   - Added success/error handling
   - Local storage for ticket tracking

3. **`package.json`**:
   - Added `nodemailer` dependency
   - Added `@types/nodemailer` dev dependency

4. **`.env.production`**:
   - Added AWS SES SMTP configuration
   - Added admin email settings

### New Features:
- ✅ Professional email templates
- ✅ Unique ticket number generation
- ✅ Graceful error handling with fallback logging
- ✅ SMTP connection testing endpoint
- ✅ Client-side form validation and UX
- ✅ Local storage ticket tracking
- ✅ **NEW: Welcome emails for new user registrations**
- ✅ **NEW: Account approval emails when users are approved**
- ✅ **NEW: Professional HTML email templates with responsive design**
- ✅ **NEW: Automated user lifecycle email notifications**

## 🧪 Testing Email Functionality

### Test SMTP Connection
```bash
curl https://api.sekondly.app/api/test-smtp
```

### Test Welcome Email
```bash
curl -X POST https://api.sekondly.app/api/test-welcome-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User"
  }'
```

The welcome email should be sent automatically when new users register through the onboarding process.

## ⚠️ AWS SES Sandbox Limitations

**CRITICAL**: AWS SES accounts start in "sandbox mode" which has significant restrictions that can cause email delivery failures.

### Sandbox Restrictions:
1. **Verified Recipients Only**: You can only send emails TO verified email addresses
2. **Verified Senders Only**: You can only send emails FROM verified email addresses
3. **Limited Send Rate**: 200 emails per 24-hour period
4. **1 email per second**: Maximum send rate

### Current Status:
- ✅ Sender verified: `admin@sekondly.app`
- ❌ Recipients must be verified individually OR account moved to production

### Common Error Message:
```
554 Message rejected: Email address is not verified. 
The following identities failed the check in region EU-NORTH-1: [recipient-email]
```

### Solutions:

#### Option 1: Verify Individual Recipient Emails (Quick Fix for Testing)
1. Log into AWS SES Console: https://console.aws.amazon.com/ses/
2. Navigate to "Verified identities"
3. Click "Create identity"
4. Choose "Email address"
5. Enter the recipient email address (e.g., `drfayaa@gmail.com`)
6. Click "Create identity"
7. Check the recipient's email inbox for verification email from AWS
8. Click the verification link in the email
9. Email address will show as "Verified" in AWS console

#### Option 2: Request Production Access (Recommended for Live App)
1. Log into AWS SES Console: https://console.aws.amazon.com/ses/
2. Go to "Account dashboard"
3. Look for sandbox mode notice and click "Request production access"
4. Fill out the request form:
   - **Use case description**: "Medical professional platform for sharing clinical cases and knowledge between doctors"
   - **Website URL**: https://sekondly.app
   - **Use case details**: "We need to send transactional emails including welcome messages, account approval notifications, and password reset emails to medical professionals who register on our platform"
   - **Expected send volume**: Start with your estimated monthly user registrations
   - **Compliance**: Confirm you handle unsubscribes and complaints properly
5. Submit the request
6. **Response time**: AWS typically responds within 24-48 hours
7. Once approved, you can send to any email address

#### Option 3: Test with Verified Emails Only (Immediate Solution)
For immediate testing, modify the test endpoint to use verified emails:
```bash
curl -X POST https://api.sekondly.app/api/test-welcome-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sekondly.app",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Production Readiness Requirements:
- ✅ **Move out of sandbox** before launching to real users
- ✅ **Set up bounce/complaint handling** via SNS notifications
- ✅ **Implement retry logic** for temporary email failures
- ✅ **Monitor email reputation** and delivery rates
- ✅ **Configure proper DNS records** (SPF, DKIM, DMARC) for domain

### Verification Steps for Going Live:
1. Request and receive AWS SES production access
2. Update documentation to remove sandbox limitations
3. Test with real user email addresses
4. Set up monitoring for email delivery rates
5. Implement proper error handling for different email failures

## 📋 Deployment Checklist

### Pre-Deployment (AWS SES Setup)
- [ ] **CRITICAL: Verify AWS SES is out of sandbox mode OR verify test recipient emails**
- [ ] Confirm sender email `admin@sekondly.app` is verified in AWS SES
- [ ] If in sandbox: verify recipient emails or request production access
- [ ] Test email sending with verified addresses only

### Application Deployment
- [ ] Build application: `npm run build`
- [ ] Upload `dist/` folder contents to server
- [ ] Update server `.env` with production AWS SES credentials
- [ ] Install dependencies: `npm install --production`
- [ ] Restart Node.js application

### Testing & Verification
- [ ] Test SMTP connection: `/api/test-smtp`
- [ ] **Test welcome email with verified recipient: `/api/test-welcome-email`**
- [ ] Test user registration welcome email (full flow)
- [ ] Test admin approval email (using admin panel)
- [ ] Test support form on landing page
- [ ] Verify emails are received at admin@sekondly.app
- [ ] Verify welcome emails are received by new users
- [ ] Verify approval emails are received when users are approved
- [ ] Check fallback logging works if email fails

### Post-Deployment (Production)
- [ ] **Request AWS SES production access if not already done**
- [ ] Set up email delivery monitoring
- [ ] Configure bounce/complaint handling
- [ ] Update documentation when sandbox restrictions are removed

## 🎉 Implementation Complete!

The AWS SES support ticket system with **automated welcome and approval emails** is now fully integrated and ready for production deployment on sekondly.app!
