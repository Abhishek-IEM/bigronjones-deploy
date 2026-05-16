<div align="center">

<img src="frontend/public/assets/ron-hero.jpg" alt="Big Ron Jones" width="100%" />

# **BIGRONJONES**

### Practical Advice For Your Real World Goals.

The official website for **Big Ron Jones** — fitness coach, accountability partner, and the team behind 2,000+ real transformations.

[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![React Router](https://img.shields.io/badge/React_Router-7-CA4245?logo=reactrouter&logoColor=white)](https://reactrouter.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?logo=stripe&logoColor=white)](https://stripe.com)
[![Resend](https://img.shields.io/badge/Resend-Email-000000?logo=resend&logoColor=white)](https://resend.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)

[Live Site](https://bigronjones.com) · [Issues](https://github.com/manishsingh1309/bigronjones/issues) · [Repository](https://github.com/manishsingh1309/bigronjones)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Path Aliases](#path-aliases)
- [Quick Start](#quick-start)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
- [Lead-Generation Funnel](#lead-generation-funnel)
- [Routing](#routing)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)
- [Database Setup](#database-setup)
- [Contributing](#contributing)

---

## Overview

A fitness-coaching marketing site, e-commerce store, and lead-generation platform for Big Ron Jones. The codebase is split into a Vite-built React SPA, a set of Vercel serverless functions, and a small shared layer of pure data and utilities. Single repo, single `package.json`, no monorepo tooling needed.

**What it does:**

- 19 marketing/legal/checkout pages with React Router
- Stripe-powered shop and consult bookings
- Resend transactional email (contact, applications, newsletter, lead delivery)
- Gemini AI blog generation
- Lead-generation funnel: Instagram → landing page → form → PDF delivery → multi-day email nurture sequence
- One-click unsubscribe (RFC 8058 compliant) and SEO sitemap/robots generated at build time

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Build tool | **Vite 6** | Fast dev server, native ESM, no Webpack config |
| UI library | **React 19** | Native metadata hoisting (`<title>`/`<meta>`), no helmet dep |
| Routing | **React Router 7 (declarative)** | Standard SPA routing with layout routes |
| Styling | **Tailwind CSS 4** + **`@tailwindcss/vite`** | Utility-first, design-token driven |
| Animation | **Framer Motion** + **GSAP** | Hero/spotlight transitions |
| 3D | **@splinetool/react-spline** + **Three.js** | Hero atmosphere, interactive scenes |
| State | **Zustand** | Cart store, lightweight global state |
| Forms | **react-hook-form** + **Zod** | Lead form validation, type-safe |
| Backend | **Vercel Serverless Functions** | Web-standard `Request`/`Response` handlers |
| Database | **Supabase (Postgres)** | Lead funnel, blog persistence, RLS for security |
| Email | **Resend** | Transactional + audience-based marketing |
| Payments | **Stripe Checkout** | Hosted checkout, no PCI scope |
| AI | **Google Gemini 2.0 Flash** | Daily blog generation |

---

## Project Structure

The repo is split into three top-level layers — `frontend/`, `backend/`, `shared/` — so anyone reading the code knows immediately whether a file runs in the browser, on a serverless function, or both.

```
bigronjones/
│
├── frontend/                     React SPA built by Vite
│   ├── public/                   Static assets served at /
│   │   └── assets/pdfs/          Lead-magnet PDFs (drop yours here)
│   ├── src/
│   │   ├── App.tsx               Route definitions (declarative)
│   │   ├── main.tsx              Entry: BrowserRouter + render
│   │   ├── components/
│   │   │   ├── about/            Hero, philosophy, timeline
│   │   │   ├── analytics/        Google Analytics (VITE_GA_ID)
│   │   │   ├── apply/            Multi-step application form
│   │   │   ├── blog/             Article view, cards, sidebar
│   │   │   ├── checkout/         Cart, Stripe handoff, success
│   │   │   ├── contact/          Contact form
│   │   │   ├── layout/           Navbar, Footer, CustomCursor
│   │   │   ├── leads/            LeadCaptureForm (funnel)
│   │   │   ├── sections/         Home page sections
│   │   │   ├── shared/           PageHeader, FAQs, ProductCard
│   │   │   ├── shop/             ShopGrid, AddToCartActions
│   │   │   ├── testimonials/     TestimonialsGrid
│   │   │   ├── ui/               Toaster, base UI primitives
│   │   │   ├── RootLayout.tsx    Navbar + Footer chrome
│   │   │   └── ScrollToTop.tsx   Resets scroll on route change
│   │   ├── hooks/
│   │   │   ├── useCart.ts        Zustand cart store
│   │   │   ├── useToast.ts
│   │   │   └── useIsMobile.ts
│   │   ├── pages/                One file per route (20 total)
│   │   ├── styles/
│   │   │   └── globals.css       Tailwind v4 source
│   │   └── vite-env.d.ts
│   ├── index.html
│   ├── vite.config.ts            root: __dirname, alias config
│   ├── tsconfig.json             references app + node configs
│   ├── tsconfig.app.json         strict, path aliases
│   └── tsconfig.node.json
│
├── backend/                      Vercel serverless functions + server libs
│   ├── api/                      One file per HTTP endpoint
│   │   ├── apply.ts              POST  application submissions
│   │   ├── blogs.ts              GET   blog list / single
│   │   ├── capture-lead.ts       POST  lead funnel — never lose a lead
│   │   ├── checkout.ts           POST  Stripe Checkout session
│   │   ├── contact.ts            POST  contact form
│   │   ├── generate-blogs.ts     POST  Gemini AI blog generator
│   │   ├── lead-magnet.ts        GET   public magnet by slug
│   │   ├── newsletter.ts         POST  Resend audience signup
│   │   ├── send-sequence.ts      GET   cron: nurture email sender
│   │   └── unsubscribe.ts        GET/POST RFC 8058 one-click
│   ├── lib/
│   │   ├── emailTemplates.ts     PDF delivery + nurture HTML
│   │   ├── email.ts              Resend SDK wrapper
│   │   └── supabase.ts           Service-role client (cached)
│   ├── sql/
│   │   ├── 01_schema.sql         Tables + RLS policies
│   │   └── 02_seed_lead_magnets.sql
│   └── tsconfig.json
│
├── shared/                       Used by both frontend and backend
│   ├── data/
│   │   ├── products.ts           Shop catalog
│   │   ├── programs.ts           Coaching programs
│   │   ├── seedBlogs.ts          Initial blog corpus
│   │   ├── site.ts               Site-wide constants
│   │   ├── team.ts               Ron, Sean, Dr. Shelia
│   │   └── testimonials.ts
│   └── lib/
│       ├── animations.ts         Reusable Framer variants
│       ├── blogStore.ts          Browser-safe blog cache
│       ├── blogUtils.ts          Slug, reading-time helpers
│       ├── cn.ts                 Tailwind className helper
│       ├── leadSchemas.ts        Zod schemas (form + API)
│       └── ronVoice.ts           AI voice/topic constants
│
├── scripts/
│   └── generate-sitemap.mjs      Writes dist/sitemap.xml + robots.txt
│
├── .env.example                  Documents every env var
├── .gitignore
├── eslint.config.mjs
├── package.json                  Single shared deps for FE + BE
├── tsconfig.json                 Root: project references
└── vercel.json                   Functions glob + SPA rewrites
```

**Boundary rules:**

- `frontend/` may **never** import from `backend/`. Server-only code (Resend, Supabase service-role key, Stripe SDK) must stay out of the browser bundle.
- `backend/` may import from `shared/` and from its own files.
- `shared/` may import only from itself — no React, no `next/*`, no `node:*` at module top-level. (`backend/lib/blogStore.ts` lazy-loads `node:fs` only when running on the server.)

---

## Path Aliases

Defined once in [frontend/vite.config.ts](frontend/vite.config.ts) and mirrored in [frontend/tsconfig.app.json](frontend/tsconfig.app.json). Used **only by frontend code**; backend uses relative imports so Vercel's function builder doesn't need to resolve a `paths` config.

| Alias | Resolves to | Example |
|---|---|---|
| `@/components/*` | `frontend/src/components/*` | `import Navbar from "@/components/layout/Navbar"` |
| `@/hooks/*` | `frontend/src/hooks/*` | `import { useCart } from "@/hooks/useCart"` |
| `@/pages/*` | `frontend/src/pages/*` | `import Home from "@/pages/Home"` |
| `@/lib/*` | `shared/lib/*` | `import { cn } from "@/lib/cn"` |
| `@/data/*` | `shared/data/*` | `import { programs } from "@/data/programs"` |
| `@/*` | `frontend/src/*` | catch-all |

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/manishsingh1309/bigronjones.git
cd bigronjones

# 2. Install
npm install

# 3. Set env vars
cp .env.example .env
# Edit .env — fill in Supabase, Resend, Stripe keys

# 4. Run dev server
npm run dev
# → http://localhost:3000
```

> The `npm run dev` server builds the SPA only. Serverless functions don't run locally without `vercel dev` (see [Deployment](#deployment)). The frontend works in dev; API calls 404 until you deploy or run `vercel dev`.

---

## Available Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts Vite dev server with HMR on `:3000` |
| `npm run build` | TypeScript check → Vite production build → sitemap + robots generation |
| `npm run preview` | Serves the built `dist/` locally |
| `npm run typecheck` | Standalone `tsc --noEmit` against the frontend |
| `npm run lint` | ESLint across the repo |

The `build` writes to `dist/` (project root) and runs [scripts/generate-sitemap.mjs](scripts/generate-sitemap.mjs) afterward to produce `dist/sitemap.xml` and `dist/robots.txt`.

---

## Environment Variables

Full reference in [.env.example](.env.example). Required at minimum for production:

| Variable | Where used | Notes |
|---|---|---|
| `SITE_URL` | Backend | Public origin, used in email links + Stripe success URLs |
| `SUPABASE_URL` | Backend | Project URL from Supabase dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | **Service role**, not anon. Bypasses RLS. Server-only. |
| `RESEND_API_KEY` | Backend | Without this, emails are logged but not sent (dev-friendly) |
| `RESEND_FROM_EMAIL` | Backend | e.g. `Big Ron Jones <ron@bigronjones.com>` |
| `RESEND_AUDIENCE_ID` | Backend | Optional — newsletter list ID |
| `CONTACT_INBOX_EMAIL` | Backend | Where contact-form messages route |
| `STRIPE_SECRET_KEY` | Backend | Without this, `/api/checkout` falls back to lead capture |
| `GOOGLE_API_KEY` | Backend | For `/api/generate-blogs` |
| `CRON_SECRET` | Backend | Bearer token protecting `/api/send-sequence` |
| `VITE_GA_ID` | Frontend | Google Analytics 4 measurement ID (optional) |

Anything prefixed `VITE_` is exposed to the browser; everything else is server-only.

---

## Lead-Generation Funnel

The conversion flow: **Instagram → Landing Page → Form → PDF Delivery → Multi-Day Nurture Sequence**.

```
   Instagram link with ?utm_source=instagram
            │
            ▼
   /free/:slug landing page  ──fetch──▶  GET  /api/lead-magnet?slug=…
            │                                       │
            │ User submits form                     ▼
            ▼                              Supabase: lead_magnets
   POST /api/capture-lead
            │
            ├─▶  Validate with Zod (shared/lib/leadSchemas.ts)
            ├─▶  Upsert into Supabase: leads (email, magnet)
            ├─▶  Send PDF email via Resend
            └─▶  Mark pdf_sent = true, increment download_count
                          │
                          ▼
   (next morning, Vercel Cron at 9 AM ET)
   GET  /api/send-sequence  (Authorization: Bearer $CRON_SECRET)
            │
            ├─▶  SELECT leads WHERE next_email_due_at <= NOW
            ├─▶  Find next email_sequences row for each lead's magnet
            ├─▶  Send nurture email via Resend
            └─▶  Update sequence_day, schedule next due date
                          │
                          ▼
   User clicks unsubscribe link in any email
   GET  /api/unsubscribe?email=…&magnet=…
            │
            └─▶  Mark sequence_paused = true, status = 'unsubscribed'
```

**Defensive guarantees in [backend/api/capture-lead.ts](backend/api/capture-lead.ts):**

1. Zod runs before any DB or email work; bad payloads return 422 immediately.
2. Lead is saved to Supabase **before** sending email — if Resend dies, the lead is persisted with `pdf_sent=false` and can be replayed.
3. Upsert on `(email, lead_magnet_slug)` — re-submissions update instead of erroring on the unique constraint.
4. Email failures don't fail the request; logged for replay, success returned to user as long as the lead was saved.
5. `List-Unsubscribe` + `List-Unsubscribe-Post` headers on every send (Gmail/Yahoo bulk-sender compliance).

---

## Routing

Routes are declared in [frontend/src/App.tsx](frontend/src/App.tsx). Two layout groups:

```tsx
<Routes>
  {/* Standalone — no navbar, focused conversion page */}
  <Route path="/free/:slug" element={<FreeLeadMagnet />} />

  {/* Site chrome (navbar + footer) */}
  <Route element={<ChromeLayout />}>
    <Route path="/" element={<Home />} />
    <Route path="/about" element={<About />} />
    <Route path="/programs/:slug" element={<ProgramDetail />} />
    <Route path="/blog/:slug" element={<BlogArticle />} />
    {/* …16 more routes… */}
    <Route path="*" element={<NotFound />} />
  </Route>
</Routes>
```

| Route | Purpose |
|---|---|
| `/` | Home (hero, sections, testimonials, blog, CTA) |
| `/about` | Story, philosophy, timeline |
| `/programs` + `/programs/:slug` | Trial, Men's Alliance, Women's Wellness |
| `/team` | Ron, Sean, Dr. Shelia |
| `/shop` + `/shop/:slug` | Products + private calls |
| `/consult` | 1-on-1 call booking |
| `/blog` + `/blog/:slug` | Daily AI-generated articles |
| `/testimonials` | Client stories |
| `/apply` | 3-step program application |
| `/checkout` + `/checkout/success` | Stripe checkout flow |
| `/contact` | Contact form |
| `/free/:slug` | Lead magnet landing (Instagram-targeted) |
| `/privacy`, `/terms`, `/refund`, `/shipping-policy` | Legal pages |

---

## API Endpoints

All under `/api/*`. Vercel rewrites them to `/backend/api/*` per [vercel.json](vercel.json).

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/apply` | Program application — Resend to inbox + applicant confirmation |
| `GET` | `/api/blogs` | Fetch blog list or single by slug |
| `POST` | `/api/capture-lead` | Lead funnel ingest (Supabase + Resend PDF) |
| `POST` | `/api/checkout` | Stripe Checkout session creation |
| `POST` | `/api/contact` | Contact form → Resend |
| `POST` | `/api/generate-blogs` | Gemini AI blog generation (3 posts/day) |
| `GET` | `/api/lead-magnet?slug=` | Public lead-magnet metadata (edge-cached) |
| `POST` | `/api/newsletter` | Resend audience signup + welcome email |
| `GET` | `/api/send-sequence` | Cron-protected nurture sender |
| `GET/POST` | `/api/unsubscribe` | One-click compliant opt-out |

---

## Deployment

Configured for **Vercel** out of the box. Push to `main` → auto-deploy.

- **Frontend** is built by `npm run build` and served from `dist/`.
- **Backend** functions are auto-discovered from `backend/api/**/*.ts` per the `functions` glob in [vercel.json](vercel.json).
- **SPA routes** are handled by the `/((?!api/).*)` rewrite that falls back to `index.html`.
- **API routes** are bridged from `/api/*` to `/backend/api/*` via rewrite.
- **Cron**: configure Vercel Cron to hit `/api/send-sequence` daily; Vercel auto-injects `Authorization: Bearer $CRON_SECRET`.

For local function testing: `npm install -g vercel && vercel dev`. This boots the SPA + functions on the same port and resolves `/api/*` correctly.

---

## Database Setup

The lead-funnel feature requires a Supabase project. One-time setup:

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run [backend/sql/01_schema.sql](backend/sql/01_schema.sql) — creates `lead_magnets`, `leads`, `email_sequences`, `blog_posts` and their RLS policies.
3. Run [backend/sql/02_seed_lead_magnets.sql](backend/sql/02_seed_lead_magnets.sql) — seeds the initial three magnets.
4. Drop the actual PDFs into [frontend/public/assets/pdfs/](frontend/public/assets/pdfs/) using the filenames declared in the seed file.
5. Settings → API → copy `Project URL` (`SUPABASE_URL`) and the **service_role** key (`SUPABASE_SERVICE_ROLE_KEY`) into your env vars.

For the nurture sequence to actually do anything, insert rows into `email_sequences`. Body paragraphs are joined with `||` as the delimiter:

```sql
insert into public.email_sequences
  (lead_magnet_id, day_number, subject, body_html, cta_text, cta_url)
values (
  (select id from public.lead_magnets where slug = 'mass-gain-guide'),
  1,
  'The #1 mistake people make in week 1',
  'First paragraph.||Second paragraph.||Third paragraph with a CTA hint.',
  'Book a Call with Ron',
  'https://bigronjones.com/consult'
);
```

---

## Contributing

This is a private project. For team members:

```bash
# Always branch off main
git checkout -b feat/your-feature

# Run the full check before pushing
npm run typecheck && npm run build

# Push and open a PR against main
git push -u origin feat/your-feature
```

**House rules:**

- Frontend code never imports from `backend/`. Period.
- New API routes go in `backend/api/<name>.ts` with `export default async function handler(req: Request): Promise<Response>`.
- Schemas that both sides validate go in `shared/lib/`.
- Run `npm run typecheck` before pushing — `npm run build` skips strict TS for build speed.
- Use the existing path aliases (`@/components`, `@/data`, etc.) — don't introduce new ones without updating both `vite.config.ts` and `tsconfig.app.json`.

---

<div align="center">

**Built for real life. No perfect required.**

— Big Ron Jones

</div>
