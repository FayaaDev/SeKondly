# Deploy Landing Page - Troubleshooting Guide

## Current Issue
Production server at `sekondly.app` is still serving the React app instead of the landing page.

## Required Steps on Production Server

### 1. Verify NODE_ENV
```bash
echo $NODE_ENV
# Should output: production
```

If not set:
```bash
export NODE_ENV=production
# Or add to ~/.bashrc or ~/.profile for permanent setting
```

### 2. Build and Deploy
```bash
cd /path/to/SeKondly
git pull origin main
npm run build
```

### 3. Verify Files
Check that these files exist:
```bash
ls -la dist/
# Should show:
# - index.js
# - static-landing.html
# - public/ (directory)
```

### 4. Restart Server
```bash
# Kill existing process
pkill -f "node dist/index.js"
# Or if using PM2:
pm2 restart sekondly

# Start new process
NODE_ENV=production node dist/index.js
# Or with PM2:
NODE_ENV=production pm2 start dist/index.js --name sekondly
```

### 5. Test Endpoints
```bash
# Should serve landing page
curl -I https://sekondly.app/

# Should serve React app
curl -I https://sekondly.app/app

# Should work
curl -I https://sekondly.app/api/health
```

## Expected Responses

### Landing Page (/)
- Content-Type: text/html
- Content-Length: ~7852 bytes
- Should contain "SeKondly - Medical Case Consultation App" in title

### Web App (/app)
- Content-Type: text/html  
- Should contain React app with div id="root"

## Common Issues

### Issue 1: NODE_ENV not set
**Symptom:** Server runs in development mode
**Fix:** Set `NODE_ENV=production` before starting server

### Issue 2: Old process still running
**Symptom:** Changes not reflected
**Fix:** Kill old process completely before restarting

### Issue 3: Build not complete
**Symptom:** Missing files in dist/
**Fix:** Run `npm run build` again and verify all files copied

### Issue 4: File permissions
**Symptom:** 404 errors for static files
**Fix:** Check file permissions on dist/ directory

## Quick Fix Script
Create this script on your production server:

```bash
#!/bin/bash
# deploy-landing.sh

echo "Stopping existing server..."
pkill -f "node dist/index.js" || true

echo "Pulling latest changes..."
git pull origin main

echo "Building application..."
NODE_ENV=production npm run build

echo "Verifying files..."
ls -la dist/static-landing.html

echo "Starting server..."
NODE_ENV=production nohup node dist/index.js > server.log 2>&1 &

echo "Waiting for server to start..."
sleep 3

echo "Testing endpoints..."
curl -I http://localhost:5001/ | grep "Content-Length"
curl -I http://localhost:5001/app | grep "Content-Length"

echo "Deployment complete!"
```

Make it executable and run:
```bash
chmod +x deploy-landing.sh
./deploy-landing.sh
```
