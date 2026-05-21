# Production Deployment: Fix localhost Redirect Issues

**Status:** Backend: ✅ Render deployed | Frontend: ✅ Vercel deployed | Auth: ⚠️ Needs Supabase Configuration

---

## 🔴 Problem Summary

After logging in, the app redirects to `http://localhost:3001` instead of the production URL, causing **ERR_CONNECTION_REFUSED**.

### Root Cause

1. **Supabase Auth** is configured with `localhost` redirect URIs in the Supabase Console
2. **Frontend** is missing `VITE_SITE_URL` environment variable in Vercel
3. **Backend** `FRONTEND_ORIGIN` was pointing to wrong Vercel domain

---

## ✅ Fixes Applied

### 1. Updated `render.yaml`

```yaml
- key: FRONTEND_ORIGIN
  value: https://bigronjones-deploy-741x.vercel.app # ✅ Corrected
```

**Commit:** `191dc0c` - "fix: correct Vercel frontend URL in Render FRONTEND_ORIGIN"

### 2. Documentation Updates

- Clarified `VITE_SITE_URL` usage in `.env` comments

---

## 🚀 Required Manual Steps (⚠️ CRITICAL)

### **Step 1: Add Vercel Environment Variables**

**URL:** https://vercel.com/dashboard → Select **bigronjones-frontend** → **Settings** → **Environment Variables**

Add these for **Production** environment:

```
VITE_API_URL = https://bigronjones-deploy.onrender.com
VITE_SITE_URL = https://bigronjones-deploy-741x.vercel.app
VITE_STRIPE_PUBLISHABLE_KEY = pk_live_51Q5Vd7As1t7TJuCZb6Xc9YzY9iKykdWNMKdsnpEaCumFFMuwPgJAjR5N2T4vhMMWwVSskK2vsgC3A1NnasdZttfu00OMO3o9yl
VITE_SUPABASE_URL = https://atwdzfchknvsvdldhkug.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2R6ZmNoa252c3ZkbGRoa3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0Njc5NTAsImV4cCI6MjA5MzA0Mzk1MH0.-PSbaXb0itvoCoh3KkqOkUD7AzQgns9u2ygc-eIHiX8
```

**Then:** Click **Save** and wait for auto-redeploy.

---

### **Step 2: Configure Supabase Auth Redirect URIs** ⚠️ ESSENTIAL

**This is the main fix for the `localhost:3001` redirect issue!**

1. Go to **[app.supabase.com](https://app.supabase.com)**
2. Select your project
3. Left sidebar: **Authentication** → **URL Configuration**
4. In **Redirect URLs** section, replace `localhost` URLs with:
   ```
   https://bigronjones-deploy-741x.vercel.app/auth/callback
   ```
   (Remove or update any `http://localhost:*` entries)
5. Click **Save**

#### Also verify Google Provider:

1. **Authentication** → **Providers** → **Google**
2. In authorized redirect URIs, add:
   ```
   https://atwdzfchknvsvdldhkug.supabase.co/auth/v1/callback?provider=google
   https://bigronjones-deploy-741x.vercel.app/auth/callback
   ```

---

### **Step 3: Re-deploy Backend on Render**

The backend needs to pick up the corrected `FRONTEND_ORIGIN`:

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Select **bigronjones-backend** service
3. Click **Manual Deploy** → **Deploy latest commit**
4. Wait for deployment (2-3 minutes)

**Verify:** Backend should log:

```
Backend running on http://localhost:8080
CORS allowed origin: https://bigronjones-deploy-741x.vercel.app
```

---

### **Step 4: Trigger Vercel Redeploy**

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select **bigronjones-frontend**
3. Go to **Deployments** tab
4. Find the latest deployment, click **...** → **Redeploy**
5. Click **Redeploy** button

**Verify:** Deployment should succeed with:

```
Environment Variables:
  ✓ VITE_SITE_URL = https://bigronjones-deploy-741x.vercel.app
  ✓ VITE_API_URL = https://bigronjones-deploy.onrender.com
```

---

## 📋 Code Changes Summary

### Files Changed:

1. **render.yaml** - Updated FRONTEND_ORIGIN to correct Vercel URL
2. **.env** - Added documentation clarifying VITE_SITE_URL

### No frontend code changes needed:

The frontend already uses `VITE_SITE_URL` from environment via the `siteOrigin()` function in [frontend/src/hooks/useAuth.ts](frontend/src/hooks/useAuth.ts#L25).

### No backend code changes needed:

The backend already uses `FRONTEND_ORIGIN` from environment for CORS in [backend/dev-server.ts](backend/dev-server.ts#L10).

---

## 🔍 Key Environment Variables Explained

| Variable            | Frontend                    | Backend          | Production Value                             |
| ------------------- | --------------------------- | ---------------- | -------------------------------------------- |
| `VITE_SITE_URL`     | ✅ Uses for OAuth redirects | -                | `https://bigronjones-deploy-741x.vercel.app` |
| `VITE_API_URL`      | ✅ Uses for API calls       | -                | `https://bigronjones-deploy.onrender.com`    |
| `FRONTEND_ORIGIN`   | -                           | ✅ Uses for CORS | `https://bigronjones-deploy-741x.vercel.app` |
| `VITE_SUPABASE_URL` | ✅ Uses for auth            | -                | `https://atwdzfchknvsvdldhkug.supabase.co`   |

---

## 🧪 Testing After Deploy

### Test 1: Check Frontend Loads

```bash
curl https://bigronjones-deploy-741x.vercel.app
# Should return HTML (not error)
```

### Test 2: Check Backend API

```bash
curl https://bigronjones-deploy.onrender.com/api/blogs
# Should return JSON array of blogs
```

### Test 3: Test Google Login

1. Go to https://bigronjones-deploy-741x.vercel.app
2. Click "Sign in with Google"
3. Complete authentication
4. Should redirect to `/auth/callback?code=...` (NOT localhost)
5. After auth, should show dashboard

### Test 4: Check Browser Console

In Vercel deployment, open DevTools → Console:

```
[useAuth] Google OAuth: {
  supabaseUrl: "https://atwdzfchknvsvdldhkug.supabase.co",
  siteOrigin: "https://bigronjones-deploy-741x.vercel.app",
  redirectTo: "https://bigronjones-deploy-741x.vercel.app/auth/callback"
}
```

✅ Should show production URLs, NOT localhost

---

## ⚠️ If Auth Still Fails After These Steps

### Symptom 1: Redirect goes to `localhost:3001` again

- **Fix:** Supabase redirect URI not updated. Re-check [app.supabase.com](https://app.supabase.com) → Authentication → URL Configuration

### Symptom 2: CORS error from backend

- **Fix:** Render FRONTEND_ORIGIN might not have redeployed. Check Render dashboard → bigronjones-backend → Logs

### Symptom 3: `VITE_SITE_URL is undefined` in browser console

- **Fix:** Vercel environment variables not saved. Re-check vercel.com dashboard → Environment Variables, ensure Production environment is selected

---

## 📚 Related Files

- [.env](.env) - Local development environment variables
- [vercel.json](vercel.json) - Vercel build configuration
- [render.yaml](render.yaml) - Render backend deployment configuration
- [frontend/src/hooks/useAuth.ts](frontend/src/hooks/useAuth.ts#L25) - Auth hook with `siteOrigin()` function
- [backend/dev-server.ts](backend/dev-server.ts#L10) - Backend CORS configuration

---

## ✅ Checklist for Complete Production Fix

- [ ] Added `VITE_SITE_URL` to Vercel environment variables
- [ ] Added `VITE_API_URL` to Vercel environment variables
- [ ] Updated Supabase Redirect URIs to production URL
- [ ] Updated Supabase Google Provider redirect URIs
- [ ] Redeployed backend on Render
- [ ] Redeployed frontend on Vercel
- [ ] Tested Google login (should NOT redirect to localhost)
- [ ] Tested API calls (should reach bigronjones-deploy.onrender.com)
- [ ] Checked browser console for correct URLs

---

**Updated:** May 21, 2026  
**Status:** Ready for production deployment
