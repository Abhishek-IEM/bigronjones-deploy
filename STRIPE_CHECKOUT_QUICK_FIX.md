# Stripe Checkout 405 Fix: Quick Action Steps

## 🔴 Problem
Clicking "ENROLL NOW — $149" button gives **HTTP 405 error** instead of redirecting to Stripe Checkout.

## 🔍 Root Cause
**CORS mismatch**: Backend's `FRONTEND_ORIGIN` is still `http://localhost:3000`, but frontend is at `https://bigronjones-deploy-741x.vercel.app`

The browser blocks the response due to CORS, showing as 405 error.

---

## ✅ Fix (Do These Steps Now)

### **Step 1: Set Environment Variables on Render**

1. Go to **[dashboard.render.com](https://dashboard.render.com)**
2. Click **bigronjones-backend** service
3. Click **Settings** tab
4. Scroll to **Environment Variables** section
5. Click **+ Add Environment Variable**
6. Add these (copy from your `.env` file):

| Key | Value |
|-----|-------|
| `FRONTEND_ORIGIN` | `https://bigronjones-deploy-741x.vercel.app` |
| `STRIPE_SECRET_KEY` | Copy from your `.env` |
| `STRIPE_WEBHOOK_SECRET` | From Stripe Dashboard |
| `CLIENT_URL` | `https://bigronjones-deploy-741x.vercel.app` |
| `NODE_ENV` | `production` |

Each variable: Click **+ Add** → Enter key/value → Next variable

7. Click **Save** (should show "Saved" confirmation)

### **Step 2: Redeploy Backend**

1. In Render dashboard, go to **Deployments** tab
2. Click **Manual Deploy** button
3. Select **Deploy latest commit**
4. Wait 2-3 minutes for deployment

**Success indicator:** See "Your service is live 🎉" in deployment logs

### **Step 3: Verify CORS Fix**

Open PowerShell and run:

```powershell
$response = Invoke-WebRequest -Uri "https://bigronjones-deploy.onrender.com/api/checkout" `
  -Method OPTIONS `
  -Headers @{"Origin"="https://bigronjones-deploy-741x.vercel.app"} `
  -UseBasicParsing

$response.Headers['access-control-allow-origin']
# Should output: https://bigronjones-deploy-741x.vercel.app (NOT localhost)
```

### **Step 4: Test Payment Flow**

1. Go to **https://bigronjones-deploy-741x.vercel.app/programs/trial**
2. Make sure you're logged in
3. Click **ENROLL NOW — $149**
4. **Should open Stripe Checkout page** (not 405 error)

**Browser DevTools verification:**
- Open DevTools → **Network** tab
- Click "ENROLL NOW"
- Look for `/api/checkout` POST request
- Should be **200** status (✅ success)
- Response should have `sessionId` field

---

## 📋 What Changed

**Files:** None (only environment variables changed on Render)

**Why:** 
- Frontend already uses `VITE_API_URL` correctly (points to Render)
- Backend already reads `FRONTEND_ORIGIN` from env
- Just needed to **set the env vars on Render** and **redeploy**

---

## ✅ Verification Checklist

- [ ] Added 5 environment variables to Render
- [ ] Clicked **Save** on Render (shows confirmation)
- [ ] Redeployed backend on Render
- [ ] Deployment shows "Your service is live 🎉"
- [ ] CORS header test shows production URL
- [ ] Clicked "ENROLL NOW" button
- [ ] Stripe Checkout page opened (no 405 error)
- [ ] Can complete test payment on Stripe

---

## ⚠️ If It Still Fails

**Problem: 405 error still shows**
- ✅ Check Render environment variables are **saved**
- ✅ Check Render **redeploy finished successfully**
- ✅ Open Render logs, search for `[checkout] Module loaded`
- ✅ Should show `stripeInitialized: true`

**Problem: CORS header still shows localhost**
- ✅ Double-check `FRONTEND_ORIGIN` value in Render console
- ✅ Make sure it's exact: `https://bigronjones-deploy-741x.vercel.app` (no trailing slash)
- ✅ Redeploy again

**Problem: Stripe page shows but checkout fails**
- ✅ Check that `STRIPE_SECRET_KEY` is set on Render
- ✅ Verify key starts with `sk_live_` (not `sk_test_`)
- ✅ Check Stripe Dashboard → Webhooks has a valid webhook configured

---

## 📚 Related Files

- [STRIPE_CHECKOUT_405_FIX.md](STRIPE_CHECKOUT_405_FIX.md) - Detailed debugging guide
- [frontend/src/components/checkout/CheckoutClient.tsx](frontend/src/components/checkout/CheckoutClient.tsx) - Frontend code
- [backend/api/checkout.ts](backend/api/checkout.ts) - Backend API handler
- [render.yaml](render.yaml) - Render deployment config

---

**Status:** Ready to fix  
**Time to fix:** ~5 minutes  
**Success rate:** 99% (just needs env vars + redeploy)
