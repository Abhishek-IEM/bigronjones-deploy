# Production Deployment Guide

## Architecture Overview

```
┌─────────────────────────┐
│   Vercel Frontend       │
│  (React + Vite)         │
│  bigronjones.vercel.app │
└────────────┬────────────┘
             │
             │ API Calls
             │ /api/*
             ▼
┌─────────────────────────┐
│   Render Backend        │
│  (Node.js + Express)    │
│ bigronjones-backend     │
│  .onrender.com          │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Supabase Database      │
│  (PostgreSQL)           │
│  + Auth                 │
└─────────────────────────┘
```

## Deployment Steps

### 1. Backend Deployment (Render)

#### Prerequisites

- GitHub repo is up to date with latest code
- All environment variables are set locally

#### Deploy to Render

1. Go to [render.com](https://render.com)
2. Click **New** → **Web Service**
3. **Connect GitHub** and select your repository
4. Configure:
   - **Name**: `bigronjones-backend`
   - **Environment**: `Node`
   - **Region**: `Ohio` (or your preference)
   - **Branch**: `main`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `npm start --workspace=backend`
   - **Plan**: `Starter` (free tier)

5. Add **Environment Variables** (Settings → Environment):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_CHECKOUT_LINK=https://buy.stripe.com/...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Big Ron Jones <ron@bigronjones.com>
GOOGLE_API_KEY=...
CRON_SECRET=789d823513cccf77866c6629345fcb4d07d2b43dd559ba22ab77f934c3d3f0d5
CALENDLY_WEBHOOK_SECRET=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=manishsinghchouhan13@gmail.com
SMTP_PASS=wqrgafdzzjvgdjjo
SMTP_FROM_NAME=Big Ron Jones
CONTACT_INBOX_EMAIL=hello@bigronjones.com
ADMIN_EMAILS=manishsinghchouhan13@gmail.com
FRONTEND_ORIGIN=https://bigronjones.vercel.app
NODE_ENV=production
```

6. Click **Deploy**
7. Wait for deployment to complete
8. Copy the backend URL (e.g., `https://bigronjones-backend.onrender.com`)

#### Verify Backend is Working

```bash
curl https://bigronjones-backend.onrender.com/api/blogs
```

### 2. Frontend Deployment (Vercel)

#### Update Environment Variables

Update `.env` with your Render backend URL:

```
VITE_API_URL=https://bigronjones-backend.onrender.com
```

Then commit and push:

```bash
git add .env vercel.json
git commit -m "Deploy: Configure Render backend URL for Vercel"
git push origin main
```

#### Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New** → **Project**
3. **Import Git Repository** and select your `bigronjones` repo
4. Configure:
   - **Project Name**: `bigronjones` (or your choice)
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./frontend`
   - **Build Command**: `npm run build:frontend`
   - **Output Directory**: `frontend/dist`

5. Add **Environment Variables** (Settings → Environment Variables):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Big Ron Jones <ron@bigronjones.com>
GOOGLE_API_KEY=...
CRON_SECRET=789d823513cccf77866c6629345fcb4d07d2b43dd559ba22ab77f934c3d3f0d5
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=manishsinghchouhan13@gmail.com
SMTP_PASS=wqrgafdzzjvgdjjo
SMTP_FROM_NAME=Big Ron Jones
CONTACT_INBOX_EMAIL=hello@bigronjones.com
ADMIN_EMAILS=manishsinghchouhan13@gmail.com
VITE_ADMIN_EMAILS=manishsinghchouhan13@gmail.com
SUPER_ADMIN_EMAILS=manishsinghchouhan13@gmail.com
VITE_API_URL=https://bigronjones-backend.onrender.com
SITE_URL=https://www.bigronjones.com
```

6. Click **Deploy**
7. Wait for deployment to complete

#### Verify Frontend is Working

```
https://bigronjones.vercel.app
```

### 3. Verify Full Integration

Test all features:

- ✅ Homepage loads: `https://bigronjones.vercel.app`
- ✅ Blog list loads: `https://bigronjones.vercel.app/blog`
- ✅ Blog API works: `curl https://bigronjones-backend.onrender.com/api/blogs`
- ✅ Checkout works: Try purchasing a trial
- ✅ Auth works: Try signing in with Google/email
- ✅ Admin panel works: Go to `/admin` with admin email

## Local Development

### Run Both Servers

```bash
npm run dev
```

This starts:

- Frontend on `http://localhost:3000` (Vite)
- Backend on `http://localhost:8081` (Node.js)

### Frontend Only

```bash
npm run dev:frontend
```

### Backend Only

```bash
npm run dev:backend
```

## Project Structure

```
bigronjones/
├── frontend/               → React + Vite (Vercel)
│   ├── src/
│   ├── vite.config.ts
│   └── package.json        → Frontend-only dependencies
├── backend/                → Node.js API (Render)
│   ├── api/               → API endpoint handlers
│   ├── lib/               → Utilities
│   ├── dev-server.ts      → Local dev server
│   └── package.json       → Backend-only dependencies
├── shared/
│   ├── lib/               → Browser-safe utilities
│   │   ├── blogClient.ts  → Browser-only blog fetcher
│   │   └── blogStore.ts   → (Deprecated, keep for reference)
│   └── data/              → Shared data
├── .env                   → Environment variables
├── render.yaml            → Render deployment config
├── vercel.json            → Vercel deployment config
└── package.json           → Root workspace config

```

## Troubleshooting

### Backend Not Starting on Render

- Check Render logs: Dashboard → Service → Logs
- Verify all environment variables are set
- Confirm `npm start --workspace=backend` works locally

### Frontend Build Fails

- Check Vercel logs: Dashboard → Deployments → Failed deployment
- Ensure `npm run build:frontend` works locally
- Verify no Node.js modules imported in frontend code

### Blog API Returns Empty

- Check backend is running
- Verify `seedBlogs` data is available
- Test with: `curl https://backend-url/api/blogs`

### CORS Errors

- Backend CORS headers are set in `/api/blogs`
- Frontend uses `VITE_API_URL` environment variable
- Verify `FRONTEND_ORIGIN` is set on backend

## Performance Optimization

### Frontend (Vercel)

- Vite automatically code-splits components
- Images are optimized via Vercel's Image Optimization
- Edge caching is automatic
- Enable analytics: Settings → Analytics

### Backend (Render)

- Render cold-starts take ~30s on free tier
- Use Render's auto-scaling for production
- Database queries are cached with Supabase indexing
- API responses are compressed by default

## Monitoring

### Vercel Analytics

- Dashboard → Analytics → Real Experience Scores
- Monitor Core Web Vitals
- Check error logs

### Render Monitoring

- Dashboard → Metrics → CPU, Memory, Requests
- Logs → view real-time logs
- Alerts → set up email notifications

## Next Steps

1. Set up custom domain
2. Configure CI/CD for automatic deployments
3. Add error tracking (Sentry, Rollbar)
4. Set up monitoring and alerts
5. Configure automatic backups for Supabase
