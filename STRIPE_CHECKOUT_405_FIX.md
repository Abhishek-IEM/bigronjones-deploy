# Stripe Checkout 405 Error: Root Cause Analysis & Fix

## 🔴 Root Cause Identified

**HTTP 405 Error** = "Method Not Allowed"

### Why It's Happening:

1. **Frontend** sends POST to `/api/checkout` with production origin: `https://bigronjones-deploy-741x.vercel.app`
2. **Backend** CORS check fails because `FRONTEND_ORIGIN` is still `http://localhost:3000`
3. **Browser blocks** the response due to CORS mismatch
4. **Frontend sees** 405 error (the actual error is CORS)

### Why Backend Has Wrong Origin:

- ✅ `render.yaml` was updated with correct `FRONTEND_ORIGIN`
- ❌ **But backend wasn't redeployed** to pick up the env vars
- ❌ **Render environment variables** weren't manually synced

---

## ✅ Solutions

### **Step 1: Manually Set Environment Variables in Render Console**

⚠️ **This is the IMMEDIATE fix:**

1. Go to **[dashboard.render.com](https://dashboard.render.com)**
2. Click **bigronjones-backend** service
3. Go to **Settings** tab → **Environment Variables**
4. Add/Update these variables:

```
FRONTEND_ORIGIN = https://bigronjones-deploy-741x.vercel.app
STRIPE_SECRET_KEY = sk_live_... (your Stripe secret key from Dashboard)
STRIPE_WEBHOOK_SECRET = whsec_... (from Stripe Dashboard → Webhooks)
CLIENT_URL = https://bigronjones-deploy-741x.vercel.app
NODE_ENV = production
```

5. Click **Save**

### **Step 2: Manually Redeploy Backend**

1. Still in Render dashboard
2. Click **Manual Deploy** → **Deploy latest commit**
3. Wait 2-3 minutes for deployment

**Verify:** Backend logs should show:

```
Backend running on http://localhost:8080
[checkout] Module loaded {
  hasSecretKey: true,
  secretKeyPrefix: "sk_li...",
  stripeInitialized: true
}
```

### **Step 3: Verify CORS Headers Fixed**

```powershell
$response = Invoke-WebRequest -Uri "https://bigronjones-deploy.onrender.com/api/checkout" `
  -Method OPTIONS `
  -Headers @{"Origin"="https://bigronjones-deploy-741x.vercel.app"} `
  -UseBasicParsing

# Should see: access-control-allow-origin: https://bigronjones-deploy-741x.vercel.app
$response.Headers['access-control-allow-origin']
```

---

## 🧪 Test Stripe Checkout Flow

### Test 1: CORS Preflight

```powershell
$response = Invoke-WebRequest -Uri "https://bigronjones-deploy.onrender.com/api/checkout" `
  -Method OPTIONS `
  -Headers @{
    "Origin" = "https://bigronjones-deploy-741x.vercel.app"
    "Content-Type" = "application/json"
  } `
  -UseBasicParsing

Write-Host "Status: $($response.StatusCode)"
Write-Host "CORS Allow-Origin: $($response.Headers['access-control-allow-origin'])"
```

### Test 2: Actual Checkout POST Request

```powershell
$body = @{
  checkoutType = "trial"
  items = @()
  total = 149
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "https://bigronjones-deploy.onrender.com/api/checkout" `
  -Method POST `
  -Headers @{
    "Origin" = "https://bigronjones-deploy-741x.vercel.app"
    "Content-Type" = "application/json"
  } `
  -Body $body `
  -UseBasicParsing `
  -ErrorAction SilentlyContinue

Write-Host "Status: $($response.StatusCode)"
Write-Host "Response: $($response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3)"
```

### Test 3: Frontend Button Test

1. Go to **https://bigronjones-deploy-741x.vercel.app/programs/trial**
2. Make sure you're logged in
3. Click **ENROLL NOW — $149**
4. **Should redirect to Stripe Checkout** (not 405 error)

**Browser DevTools → Network:**

- Request to `/api/checkout` should be **200** or **301** (redirect to Stripe)
- Should NOT be **405**

---

## 📋 Environment Variables Required

### On Render (`render.yaml` or Render Console):

| Variable                    | Value                   | Example                                      |
| --------------------------- | ----------------------- | -------------------------------------------- |
| `PORT`                      | Backend port            | `8080`                                       |
| `FRONTEND_ORIGIN`           | Production frontend URL | `https://bigronjones-deploy-741x.vercel.app` |
| `NODE_ENV`                  | Environment             | `production`                                 |
| `STRIPE_SECRET_KEY`         | Stripe secret key       | `sk_live_...`                                |
| `STRIPE_WEBHOOK_SECRET`     | Stripe webhook secret   | `whsec_...`                                  |
| `CLIENT_URL`                | Client redirect URL     | `https://bigronjones-deploy-741x.vercel.app` |
| `SUPABASE_URL`              | Supabase URL            | From .env                                    |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase key            | From .env                                    |

### On Vercel (bigronjones-frontend):

| Variable                      | Value                                        |
| ----------------------------- | -------------------------------------------- |
| `VITE_API_URL`                | `https://bigronjones-deploy.onrender.com`    |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_...`                                |
| `VITE_SITE_URL`               | `https://bigronjones-deploy-741x.vercel.app` |
| `VITE_SUPABASE_URL`           | `https://atwdzfchknvsvdldhkug.supabase.co`   |
| `VITE_SUPABASE_ANON_KEY`      | From .env                                    |

---

## 🔍 Key Files Involved

### Frontend:

- **[frontend/src/components/checkout/CheckoutClient.tsx](frontend/src/components/checkout/CheckoutClient.tsx)** - Sends POST to `/api/checkout`
  - Uses `VITE_API_URL` (should be https://bigronjones-deploy.onrender.com)
  - Uses `VITE_STRIPE_PUBLISHABLE_KEY` for Stripe.js

### Backend:

- **[backend/api/checkout.ts](backend/api/checkout.ts)** - Handles POST /api/checkout
  - Checks if `process.env.STRIPE_SECRET_KEY` is set
  - Creates Stripe session
  - Returns `{ sessionId, ...}` to frontend

- **[backend/dev-server.ts](backend/dev-server.ts)** - Node.js dev server
  - Line 10: `const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000"`
  - Sets CORS headers based on `FRONTEND_ORIGIN`

---

## ✅ Checklist

- [ ] Set `FRONTEND_ORIGIN` in Render console/dashboard
- [ ] Set `STRIPE_SECRET_KEY` in Render console (from Stripe)
- [ ] Set `CLIENT_URL` in Render console
- [ ] Redeploy backend on Render
- [ ] Verify CORS headers return production URL
- [ ] Test CORS preflight (OPTIONS request)
- [ ] Test checkout POST request
- [ ] Click "ENROLL NOW" button on frontend
- [ ] Should redirect to Stripe Checkout (not 405 error)

---

## 🚀 Summary

The **405 error is actually a CORS issue** masked as a method error. The fix is:

1. **Set correct environment variables in Render**
2. **Redeploy backend**
3. **CORS headers will now allow production frontend**
4. **Stripe checkout will work**

---

## ⚠️ If Checkout Still Fails

**Error: Still 405 after redeployment**

- ✅ Verify Render console shows correct `FRONTEND_ORIGIN`
- ✅ Check Render backend logs for env var startup messages
- ✅ Manually redeploy again if env vars were just added

**Error: CORS blocks request (browser console)**

- ✅ Check CORS headers in network tab
- ✅ Should see `access-control-allow-origin: https://bigronjones-deploy-741x.vercel.app`

**Error: Stripe session creation fails**

- ✅ Verify `STRIPE_SECRET_KEY` is set on Render
- ✅ Check backend logs: `[checkout] Module loaded { hasSecretKey: true, ... }`

---

**Created:** May 21, 2026  
**Updated:** Stripe Checkout 405 Fix Guide
