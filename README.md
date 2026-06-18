# ProCoordinate

Construction project management for contractors. Built with React, Vite, Supabase, Tailwind CSS.

## Features
- Projects dashboard
- Drawings with version control (revision history)
- RFIs (raise, answer, close)
- Daily site logs
- Team management per project

---

## Deploy to procoordinate.com (Step by Step)

### 1. Set up Supabase database

1. Go to [supabase.com](https://supabase.com) → your project (`zddscyzoegqaokqlhtpi`)
2. Click **SQL Editor** → **New Query**
3. Paste the entire contents of `supabase/schema.sql`
4. Click **Run**

### 2. Get your Supabase keys

In your Supabase project → **Settings** → **API**:
- Copy **Project URL** (e.g. `https://zddscyzoegqaokqlhtpi.supabase.co`)
- Copy **anon / public** key

### 3. Set up the code on GitHub

```bash
# Clone or replace your existing repo
cd your-repo
# Copy all these files in, replacing the old ones

git add .
git commit -m "ProCoordinate v1 - full rebuild"
git push origin main
```

### 4. Set environment variables on Vercel

1. Go to [vercel.com](https://vercel.com) → **procoordinate-official** project
2. **Settings** → **Environment Variables**
3. Add:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
4. Click **Save** — Vercel will redeploy automatically

### 5. Enable email auth in Supabase

1. Supabase → **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. For testing you can turn off "Confirm email" under **Authentication** → **Settings** → **Email** (makes signup instant without needing to confirm)

---

## Local development

```bash
# Copy env file and fill in your keys
cp .env.example .env

npm install
npm run dev
```

Open http://localhost:5173

---

## Project structure

```
src/
├── lib/supabase.js          # Supabase client
├── context/AuthContext.jsx  # Auth state
├── components/
│   ├── Layout.jsx           # Main layout wrapper
│   ├── Sidebar.jsx          # Navigation
│   └── ProtectedRoute.jsx   # Auth guard
└── pages/
    ├── Login.jsx            # Sign in / sign up
    ├── Dashboard.jsx        # Overview
    ├── Projects.jsx         # Projects list
    └── ProjectDetail.jsx    # Drawings, RFIs, Logs, Team tabs
```
