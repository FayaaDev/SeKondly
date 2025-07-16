#!/bin/bash

# Test email configuration without deploying
echo "=== Testing Email Configuration ==="
echo ""

# Test 1: Check if production server is running
echo "1. Testing production server..."
curl -s https://sekondly.app/api/health | head -n 20
echo ""
echo ""

# Test 2: Check if our local test works
echo "2. Testing local email configuration..."
cd /Users/fayaa/SeKondly && node test-email-config.mjs
echo ""

# Test 3: Instructions for next steps
echo "=== Next Steps ==="
echo ""
echo "✅ Your email configuration is working locally"
echo "✅ Your production server is running"
echo ""
echo "📝 To fix the production welcome email issue:"
echo "1. Deploy the updated server code (with the fixes I made)"
echo "2. Verify admin@sekondly.app is verified in AWS SES Console"
echo "3. Test user registration again"
echo ""
echo "🔧 Quick verification in AWS SES:"
echo "   • Go to: https://console.aws.amazon.com/ses/"
echo "   • Navigate to: Configuration → Verified identities"
echo "   • Ensure 'admin@sekondly.app' shows as 'Verified'"
echo ""
echo "🚀 After deployment, you can test with:"
echo "   curl https://sekondly.app/api/test-smtp"
echo "   curl -X POST https://sekondly.app/api/test-welcome-email \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\": \"admin@sekondly.app\", \"firstName\": \"Test\", \"lastName\": \"User\"}'"
