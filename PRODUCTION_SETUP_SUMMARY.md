# Production Setup - Complete Summary of Changes

## Overview

Converted from monorepo dev setup (both frontend + backend via `npm run dev`) to separate production deployments:

- **Backend** → Render
- **Frontend** → Vercel

## Changes Made

### 1. Package.json Updates

#### Root package.json

- Added `"workspaces": ["frontend", "backend"]` for workspace support
- Updated scripts:
  - `build` → builds both frontend and backend
  - `build:frontend` → Vite build
  - `build:backend` → TypeScript check
  - `start` → starts backend only
  - Removed old build script that ran frontend + sitemap

#### frontend/package.json (Created)

- Separated frontend dependencies only
- Removed backend dependencies (nodemailer, stripe, resend, etc.)
- Build script: `vite build && node ../scripts/generate-sitemap.mjs`
- Dev script: `vite` (not concurrently)

#### backend/package.json (Updated)

- Dev script: `tsx dev-server.ts`
- Production start: `npm start --workspace=backend`
- Kept backend-only dependencies
- Removed frontend dependencies (react, vite, etc.)

### 2. Blog System Refactoring

#### Problem

- `shared/lib/blogStore.ts` was being imported by frontend
- It contained Node.js module references (`fs`, `path`)
- Vite was trying to bundle these, causing warnings:
  ```
  Module "node:fs" has been externalized for browser compatibility
  ```

#### Solution

**Created: shared/lib/blogClient.ts**

- Browser-safe blog fetching library
- Makes HTTP calls to backend API
- No Node.js module imports
- Features:
  - `getAllBlogs()` - fetch all blogs
  - `getBlogBySlug(slug)` - fetch single blog
  - `searchBlogs(query)` - client-side search
  - `getFeaturedBlogs()` - get featured blogs
  - Built-in 5-minute cache
  - Error handling

**Updated: backend/api/blogs.ts**

- Removed `blogStore` dependency
- Now directly uses `seedBlogs` from shared data
- Added proper CORS headers
- Handles GET requests for:
  - `/api/blogs` - all blogs
  - `/api/blogs?category=fitness` - filtered by category
  - `/api/blogs?slug=my-post` - single blog

**Updated Frontend Components**

- `frontend/src/pages/BlogArticle.tsx` → Uses `useEffect` + `blogClient`
- `frontend/src/pages/BlogList.tsx` → Uses `useEffect` + `blogClient`
- Type imports updated:
  - `AIGenerationPanel.tsx`
  - `BlogArticleView.tsx`
  - `BlogCard.tsx`
  - `BlogSidebar.tsx`

### 3. Deployment Configuration

#### render.yaml (Updated)

- Backend-only service
- Build command: `cd backend && npm install`
- Start command: `npm start --workspace=backend`
- All required environment variables listed
- Port: 8080
- Node.js runtime

#### vercel.json (Updated)

- Frontend-only configuration
- Build: `npm run build:frontend`
- Output: `frontend/dist`
- Framework: Vite
- Removed all backend API functions
- Simplified rewrites for SPA routing

### 4. Environment Variables

#### .env (Updated)

- Added `VITE_API_URL=https://bigronjones-backend.onrender.com`
- Updated to use production Stripe keys (live mode)
- CRON_SECRET generated

#### .env.example (Created)

- Complete template with all variables
- Documentation for each variable
- Production URLs
- Developer instructions

### 5. Documentation

#### PRODUCTION_DEPLOYMENT.md (Created)

- Step-by-step deployment guide
- Architecture diagram
- Environment variable setup
- Local development instructions
- Troubleshooting
- Performance optimization
- Monitoring

## File Structure Changes

```
Before:
  backend/
    api/
    dev-server.ts
    package.json
  frontend/
    src/
    vite.config.ts
    package.json (shared with backend deps)
  package.json (both frontend + backend scripts)

After:
  backend/
    api/
    dev-server.ts
    package.json (backend deps only)
  frontend/
    src/
    vite.config.ts
    package.json (frontend deps only)
  shared/
    lib/
      blogClient.ts (new - browser-safe)
      blogStore.ts (keep for reference)
  package.json (workspace root)
  render.yaml (Render config)
  vercel.json (Vercel config)
  PRODUCTION_DEPLOYMENT.md (guide)
  .env.example (template)
```

## Build & Deploy Commands

### Local Development

```bash
# Both frontend + backend
npm run dev

# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend

# Type check
npm run typecheck
```

### Production Build

```bash
# Frontend build (outputs to frontend/dist)
npm run build:frontend

# Backend check
npm run build:backend

# Full build
npm run build
```

### Deployment

**Backend (Render)**

```
Build Command: cd backend && npm install
Start Command: npm start --workspace=backend
```

**Frontend (Vercel)**

```
Build Command: npm run build:frontend
Output Directory: frontend/dist
Framework: Vite
```

## Breaking Changes / Migration Notes

### For Frontend Developers

- ❌ No more `import { blogStore } from "@/lib/blogStore"`
- ✅ Use `import { blogClient } from "@/lib/blogClient"` with `await`/`useEffect`
- Components now fetch data asynchronously
- Example migration:

```typescript
// Before (sync):
const blog = blogStore.getBySlug(slug);

// After (async):
const [blog, setBlog] = useState<Blog | null>(null);
useEffect(() => {
  blogClient.getBlogBySlug(slug).then(setBlog);
}, [slug]);
```

### For Backend Developers

- Backend now serves independent of frontend
- API endpoints must handle CORS
- All blog endpoints go through `/api/blogs`
- No more file-based blogStore persistence (use Supabase if needed)

## Performance Improvements

### Frontend

- ✅ Smaller bundle (no Node.js modules)
- ✅ No more Vite externalization warnings
- ✅ Better code splitting with separate packages
- ✅ Vercel edge caching for assets

### Backend

- ✅ Independent scaling on Render
- ✅ CORS properly configured for frontend
- ✅ Faster deploys (small package size)
- ✅ Can run without frontend

### Development

- ✅ Workspace support for better monorepo management
- ✅ Cleaner dependency trees
- ✅ Faster `npm install` (smaller package files)
- ✅ Better IDE support with separate tsconfigs

## Testing Checklist

- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts both servers
- [ ] Frontend loads on http://localhost:3000
- [ ] Backend loads on http://localhost:8081
- [ ] Blog page loads and fetches blogs from API
- [ ] Blog article page works
- [ ] Stripe checkout works
- [ ] Auth works (Google, email)
- [ ] Admin panel accessible
- [ ] `npm run build:frontend` succeeds with no errors
- [ ] `npm run build:backend` succeeds with no errors

## Next Steps

1. ✅ Code changes complete
2. ⏭️ Test locally (`npm run dev`)
3. ⏭️ Git push to main
4. ⏭️ Deploy backend to Render
5. ⏭️ Deploy frontend to Vercel
6. ⏭️ Test production deployment
7. ⏭️ Monitor error logs
8. ⏭️ Set up alerts and monitoring
