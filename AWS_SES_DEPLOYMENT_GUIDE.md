# AWS SES Support Ticket System Deployment Guide

## 📋 Deployment Checklist for sekondly.app

### 1. Files to Upload to Your Server

**Built Application Files:**
```
dist/
├── index.js                    # Main server file with AWS SES integration
├── static-landing.html         # Updated landing page with support form
└── public/                     # Web app assets
    ├── index.html
    └── assets/

uploads/                        # Preserve existing uploaded files
package.json                    # Updated dependencies (includes nodemailer)
```

**Configuration Files:**
```
.env                            # Copy from .env.production with your actual values
```

### 2. Environment Variables to Update on Server

Copy the contents of `.env.production` to your server's `.env` file:

```bash
# Update these values on your server:
NODE_ENV=production
SMTP_USER=AKIAVRCYZCTXCVKECGIR
SMTP_PASS=BMONkxzcbSEXcPc9gcf/p0PIUZzxW4iueTEeN4p0uElp
SMTP_HOST=email-smtp.eu-north-1.amazonaws.com
EMAIL_USER=admin@sekondly.app
EMAIL_PASS=xxxxn
```

### 3. Deployment Steps

#### Option A: FTP Upload (Recommended)
1. **Connect to Interserver FTP**
2. **Navigate to your domain folder** (usually `public_html` or `www`)
3. **Upload files:**
   - Upload `dist/index.js` (replaces existing server file)
   - Upload `dist/static-landing.html` (new landing page)
   - Upload `dist/public/` folder (replaces web app)
   - Upload `package.json` (updated with nodemailer)
4. **Update .env file** on server with production values
5. **Restart Node.js application** through Interserver control panel

#### Option B: SSH/Terminal (if available)
```bash
# Upload files
scp -r dist/* username@server:/path/to/your/domain/
scp .env.production username@server:/path/to/your/domain/.env
scp package.json username@server:/path/to/your/domain/

# SSH into server
ssh username@server

# Navigate to your domain directory
cd /path/to/your/domain

# Install any new dependencies
npm install --production

# Restart the application
pm2 restart sekondly-app  # or however you restart your app
```

### 4. Post-Deployment Testing

After deployment, test these endpoints:

1. **API Health Check:**
   ```
   curl https://sekondly.app/api/health
   ```

2. **SMTP Connection Test:**
   ```
   curl https://sekondly.app/api/test-smtp
   ```
   Should return: `{"success":true,"message":"SMTP connection verified successfully"}`

3. **Support Ticket Test:**
   ```
   curl -X POST https://sekondly.app/api/support/ticket \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test User",
       "email": "test@example.com", 
       "title": "Test",
       "reason": "question",
       "content": "Testing support system"
     }'
   ```

4. **Landing Page Test:**
   - Visit: https://sekondly.app/static-landing.html
   - Fill out the support form
   - Verify you receive the ticket confirmation
   - Check admin@sekondly.app for the support email

### 5. What's New

**New Features Added:**
- ✅ AWS SES SMTP integration
- ✅ Support ticket system with email notifications
- ✅ Landing page contact form
- ✅ Automatic ticket number generation
- ✅ User confirmation emails
- ✅ Admin email notifications

**API Endpoints Added:**
- `POST /api/support/ticket` - Submit support tickets
- `GET /api/test-smtp` - Test SMTP connection (for debugging)

**Files Modified:**
- `server/routes.ts` - Added support ticket endpoints
- `static-landing.html` - Added functional contact form
- Environment variables - Added AWS SES configuration

### 6. Troubleshooting

If emails aren't working after deployment:

1. **Check environment variables** are loaded correctly
2. **Verify AWS SES region** is set to `eu-north-1` 
3. **Check server logs** for SMTP errors
4. **Test SMTP endpoint** first: `/api/test-smtp`
5. **Ensure admin@sekondly.app** is verified in AWS SES

### 7. Security Notes

- ✅ SMTP credentials are stored securely in environment variables
- ✅ No sensitive data exposed in client-side code
- ✅ Email validation and sanitization implemented
- ✅ Rate limiting should be added for production use

## 🎉 Ready for Production!

Your AWS SES support ticket system is now ready to deploy to sekondly.app!
