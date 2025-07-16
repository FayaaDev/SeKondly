#!/bin/bash

echo "=== Testing Email After AWS SES Fix ==="
echo ""

echo "1. Testing SMTP connection..."
curl -s https://sekondly.app/api/test-smtp | jq '.'
echo ""

echo "2. Testing welcome email to verified address..."
curl -s -X POST https://sekondly.app/api/test-welcome-email \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@sekondly.app", "firstName": "Test", "lastName": "Admin"}' | jq '.'
echo ""

echo "3. Testing welcome email to previously failing address..."
curl -s -X POST https://sekondly.app/api/test-welcome-email \
  -H "Content-Type: application/json" \
  -d '{"email": "amd.fayaa@gmail.com", "firstName": "Test", "lastName": "User"}' | jq '.'
echo ""

echo "4. Testing actual user registration..."
echo "Try registering a new user at https://sekondly.app and check if welcome email is received."
