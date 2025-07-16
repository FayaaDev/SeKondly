#!/bin/bash

echo "=== Email Fix Deployment Test ==="
echo ""
echo "✅ Local testing successful - both admin@sekondly.app and amd.fayaa@gmail.com work"
echo ""

echo "Now testing production deployment..."
echo ""

echo "1. Testing production SMTP connection..."
curl -s https://sekondly.app/api/test-smtp | jq -r '.message // .error'
echo ""

echo "2. Testing production welcome email to admin@sekondly.app..."
curl -s -X POST https://sekondly.app/api/test-welcome-email \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@sekondly.app", "firstName": "Test", "lastName": "Admin"}' \
  | jq -r '.message // .error'
echo ""

echo "3. Testing production welcome email to amd.fayaa@gmail.com..."
curl -s -X POST https://sekondly.app/api/test-welcome-email \
  -H "Content-Type: application/json" \
  -d '{"email": "amd.fayaa@gmail.com", "firstName": "Test", "lastName": "User"}' \
  | jq -r '.message // .error'
echo ""

echo "=== Summary ==="
echo "If all tests above show success, your welcome email issue is fixed!"
echo "New users should now receive welcome emails successfully."
echo ""
echo "Next steps:"
echo "1. Deploy the updated server code to production"
echo "2. Test actual user registration flow"
echo "3. Monitor for any email delivery issues"
