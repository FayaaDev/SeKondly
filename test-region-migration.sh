#!/bin/bash

echo "=== AWS SES Region Migration Test ==="
echo ""
echo "This script will help you test the new US East region configuration"
echo "Make sure you have updated your SMTP credentials in .env.production first!"
echo ""

echo "1. Testing local SMTP connection with new region..."
cd /Users/fayaa/SeKondly && node test-email-config.mjs
echo ""

echo "2. Testing welcome email to different recipients..."
cd /Users/fayaa/SeKondly && node test-specific-email.mjs
echo ""

echo "3. Testing production server..."
echo "Make sure to deploy your updated server code first!"
echo ""

echo "Testing production SMTP connection..."
curl -s https://sekondly.app/api/test-smtp | jq '.'
echo ""

echo "Testing production welcome email..."
curl -s -X POST https://sekondly.app/api/test-welcome-email \
  -H "Content-Type: application/json" \
  -d '{"email": "amd.fayaa@gmail.com", "firstName": "Test", "lastName": "User"}' | jq '.'
echo ""

echo "=== Next Steps ==="
echo "1. Create new SMTP credentials in AWS SES Console (US East region)"
echo "2. Update SMTP_USER and SMTP_PASS in .env.production"
echo "3. Deploy updated server code"
echo "4. Run this script again to test"
echo "5. Try actual user registration"
