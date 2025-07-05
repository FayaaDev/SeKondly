# Interserver Deployment Guide

## Files to Upload

### Required Files for Production:
```
dist/
├── index.js          # Main server file
└── public/           # Static assets
    ├── index.html
    └── assets/       # CSS, JS, images

package.json          # Dependencies list
.env                  # Environment variables (update for production)
uploads/              # User uploaded files (preserve existing)
```

### Environment Variables to Update:
- `NODE_ENV=production`
- `DATABASE_URL` (should already be correct)
- `SESSION_SECRET` (should already be set)
- `PORT` (Interserver will provide this)

## Deployment Steps:

### Option 1: FTP Upload
1. Connect to your Interserver FTP
2. Navigate to your domain's public_html or www folder
3. Upload the dist/ folder contents
4. Upload package.json
5. Update .env file for production settings

### Option 2: SSH/Terminal (if available)
1. SSH into your Interserver account
2. Navigate to your website directory
3. Upload files via rsync or scp
4. Run: `npm install --production`
5. Restart the Node.js application

### Option 3: Git Deployment (if set up)
1. Push changes to your git repository
2. Pull on the server: `git pull origin main`
3. Build on server: `npm run build`
4. Restart the application

## Post-Deployment:

1. Test the API endpoint: https://sekondly.app/api/health
2. Create a test long case in the mobile app
3. Verify the format field is now included in responses
4. Check that long cases display correctly

## Restart Commands (if you have SSH access):
```bash
# If using PM2
pm2 restart sekondly-app

# If using systemctl
sudo systemctl restart sekondly

# If using direct node
pkill node && nohup node dist/index.js &
```

## Verification:
After deployment, the server response should include the format field:
```json
{
  "id": 363,
  "title": "Test Case",
  "format": "long",  // ← This should now be present!
  "history": "...",
  "chiefComplaint": "...",
  ...
}
```
