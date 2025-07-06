# Landing Page Configuration Update

## Changes Made

The application has been configured so that `sekondly.app` now serves the static landing page (`static-landing.html`) instead of the web application.

### What Changed:

1. **Production serving** (`server/vite.ts`):
   - Root domain (`sekondly.app`) now serves `static-landing.html`
   - Web app is accessible at `sekondly.app/app`
   - Static assets and uploads are still served properly

2. **Development serving** (`server/index.ts`):
   - Root domain serves static landing page in development
   - Web app development at `localhost:5001/app`
   - Vite dev server still works for app development

3. **Build process** (`package.json`):
   - Static landing page is copied to dist folder during build

4. **Landing page updates**:
   - Fixed logo styling (removed broken image reference)
   - Added "Access Web App" button linking to `/app`
   - Improved responsive design

## Deployment Instructions

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Deploy to production:**
   - Deploy the entire `dist/` folder to your production server
   - Ensure `static-landing.html` is in the dist folder
   - Point `sekondly.app` domain to serve from this folder

3. **Verify deployment:**
   - `https://sekondly.app` → Should show landing page
   - `https://sekondly.app/app` → Should show web application
   - `https://api.sekondly.app/api/health` → Should show API health

## URL Structure After Deployment

- **Landing Page**: `https://sekondly.app`
- **Web Application**: `https://sekondly.app/app`
- **API**: `https://api.sekondly.app/api/*` (or `https://sekondly.app/api/*` if same server)
- **Mobile App**: Uses API endpoints

## Benefits

- Professional landing page for marketing and downloads
- Web app still accessible for existing users
- Better SEO and user experience for new visitors
- Clear separation between marketing and application
