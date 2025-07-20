# Case Email Debugging - Route Loading Issue

## Current Problem
- Case approval/rejection returns 200 status but no custom logs appear
- Only seeing basic express logs, not our detailed debugging
- Emails are not being sent

## Root Cause Analysis
The issue appears to be that our detailed routes in `routes.ts` are **NOT** being used. Instead, either:

1. **Basic routes in `index.ts`** (which we removed) are still active
2. **Routes from `routes.ts`** are not being loaded properly
3. **Authentication middleware** is failing silently

## Current Route Situation

### In `index.ts`:
- ✅ **Removed** basic case approval/rejection routes
- ✅ **Added** debugging to route registration process
- ✅ **Added** debug route to test if routes.ts is loaded

### In `routes.ts`:
- ✅ **Detailed** case approval/rejection routes with email functionality
- ✅ **Comprehensive** debugging with console.error
- ✅ **Professional** email templates
- ✅ **Added** debug routes to test loading

## Debugging Steps

### 1. Deploy Updated Code
Make sure the latest changes are deployed:
- `index.ts` - Route registration debugging
- `routes.ts` - Debug routes and email functionality

### 2. Check Route Loading
After deployment, test these endpoints:

```bash
# Test if routes.ts is loaded
curl https://api.sekondly.app/api/debug-routes

# Expected: {"message":"routes.ts is loaded and working","routesRegistered":true}
# If this fails: routes.ts is not being loaded
```

### 3. Check Server Startup Logs
Look for these logs in PM2:
```
=== ATTEMPTING TO REGISTER ROUTES FROM routes.ts ===
=== ROUTES FROM routes.ts REGISTERED SUCCESSFULLY ===
```

If you see:
```
=== COMPLEX ROUTES FAILED ===
```
Then `routes.ts` has errors and isn't loading.

### 4. Test Authentication Bypass
Try the test route without authentication:
```bash
curl -X POST https://api.sekondly.app/api/admin/test-approve-case/999
```

If this works, the issue is authentication middleware.

### 5. Check PM2 Logs During Startup
```bash
pm2 logs sekondly-api --lines 50
```

Look for:
- Route registration messages
- Any errors during startup
- Template import errors

## Possible Solutions

### If routes.ts is not loading:
1. **Check for syntax errors** in routes.ts
2. **Check template imports** - missing files cause import failures
3. **Check middleware imports** - auth middleware might be missing

### If authentication is failing:
1. **Temporarily remove auth middleware** from case routes
2. **Check session handling** in live environment
3. **Verify admin authentication** is working

### If templates are missing:
1. **Check template files exist** on live server
2. **Verify import paths** are correct
3. **Check file permissions** on template files

## Expected Behavior After Fix

When routes.ts is properly loaded, you should see:

### During case approval:
```
=== CASE APPROVAL DEBUG START ===
Request ID: 558
Case approval request - ID: 558, Admin: admin_id
Fetching case details for ID: 558
=== ABOUT TO SEND APPROVAL EMAIL ===
=== CASE APPROVAL EMAIL START ===
✅ Case approval email sent successfully
```

### During case rejection:
```
=== CASE REJECTION DEBUG START ===
Request ID: 557
Request body: {"reason":"rejection reason"}
=== ABOUT TO SEND EMAIL ===
=== CASE REJECTION EMAIL START ===
✅ Case rejection email sent successfully
```

## Quick Test Commands

```bash
# Test if routes.ts is loaded
curl https://api.sekondly.app/api/debug-routes

# Test approval without auth
curl -X POST https://api.sekondly.app/api/admin/test-approve-case/999

# Check server logs
pm2 logs sekondly-api --lines 20

# Run debugging script
node debug-active-routes.mjs
```

## Next Steps
1. **Deploy** the updated code with debugging
2. **Run** debug-active-routes.mjs to test route loading
3. **Check** PM2 logs for route registration messages
4. **Identify** which routes are actually being used
5. **Fix** the route loading issue based on results
