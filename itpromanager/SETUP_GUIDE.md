# ITProManager — Complete Setup & Deployment Guide

## What You're Building
A full-stack Next.js 14 app with:
- Supabase (database + auth)
- Vercel (hosting)
- Claude AI (coming Phase 3)

---

## STEP 1 — Install Node.js

1. Go to **https://nodejs.org**
2. Download **Node.js 20 LTS** (Long Term Support)
3. Install it (click Next → Next → Finish)
4. Verify: open Terminal/Command Prompt and run:
   ```
   node --version    # Should show v20.x.x
   npm --version     # Should show 10.x.x
   ```

---

## STEP 2 — Set Up Supabase (Free)

### 2a. Create Account
1. Go to **https://supabase.com**
2. Click **Start your project** → Sign up with GitHub (recommended) or email
3. Click **New project**
4. Fill in:
   - **Name:** `itpromanager`
   - **Database Password:** create a strong password (save it!)
   - **Region:** choose closest to your users
5. Click **Create new project** — wait ~2 minutes

### 2b. Get Your API Keys
1. In your project, go to **Settings → API**
2. Copy these 3 values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role / secret** key → `SUPABASE_SERVICE_ROLE_KEY`

### 2c. Run the Database Schema
1. Go to **SQL Editor** (left sidebar) → **New query**
2. Open the file `supabase-schema.sql` from your project folder
3. Copy ALL the SQL and paste it into the editor
4. Click **Run** (green button)
5. You should see "Success. No rows returned"

### 2d. Enable OAuth Providers
Go to **Authentication → Providers**:

**Google:**
1. Toggle **Google** on
2. Go to https://console.cloud.google.com
3. Create a project → APIs & Services → Credentials → Create OAuth Client ID
4. Application type: **Web application**
5. Authorized redirect URI: `https://[YOUR_PROJECT_ID].supabase.co/auth/v1/callback`
6. Copy Client ID and Client Secret back to Supabase

**Microsoft (Azure):**
1. Toggle **Azure** on
2. Go to https://portal.azure.com → Azure Active Directory → App registrations
3. New registration → Redirect URI: `https://[YOUR_PROJECT_ID].supabase.co/auth/v1/callback`
4. Copy Application (client) ID and create a client secret

**Facebook:**
1. Toggle **Facebook** on
2. Go to https://developers.facebook.com → My Apps → Create App
3. Add Facebook Login product
4. OAuth redirect: `https://[YOUR_PROJECT_ID].supabase.co/auth/v1/callback`
5. Copy App ID and App Secret

> 💡 **Tip:** For MVP testing, you can skip OAuth and just use email/password first!

---

## STEP 3 — Set Up Your Project Locally

### 3a. Install the Project
Open Terminal, navigate to where you want the project, then:

```bash
# Unzip the project files into a folder called itpromanager
cd itpromanager

# Install all dependencies
npm install
```

### 3b. Create Environment File
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` in any text editor (Notepad, VS Code, etc.)
3. Fill in your values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://abcdefghij.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
   ANTHROPIC_API_KEY=sk-ant-...  (leave blank for now)
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### 3c. Run Locally
```bash
npm run dev
```
Open **http://localhost:3000** in your browser. 🎉

---

## STEP 4 — Get Your Claude AI API Key (for Phase 3)

1. Go to **https://console.anthropic.com**
2. Sign up / log in
3. Go to **API Keys** → **Create Key**
4. Name it `itpromanager`
5. Copy the key → paste into `.env.local` as `ANTHROPIC_API_KEY`

> ⚠️ Free tier includes $5 credits. Very generous for development!

---

## STEP 5 — Deploy to Vercel (Free)

### 5a. Push to GitHub
1. Go to **https://github.com** → Create account (free)
2. Create a **New Repository** called `itpromanager` (private)
3. In your terminal:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: ITProManager MVP"
   git remote add origin https://github.com/YOUR_USERNAME/itpromanager.git
   git push -u origin main
   ```

### 5b. Deploy on Vercel
1. Go to **https://vercel.com** → Sign up with GitHub
2. Click **Add New → Project**
3. Import your `itpromanager` repository
4. Click **Environment Variables** and add all 5 variables from your `.env.local`
5. Click **Deploy** — takes ~2 minutes

### 5c. Update Supabase Auth URLs
After Vercel gives you your URL (e.g. `https://itpromanager.vercel.app`):
1. Go to Supabase → **Authentication → URL Configuration**
2. **Site URL:** `https://itpromanager.vercel.app`
3. **Redirect URLs:** add `https://itpromanager.vercel.app/auth/callback`

---

## STEP 6 — Verify Everything Works

✅ Visit your Vercel URL
✅ Landing page loads
✅ Click "Get Started Free" → auth page loads
✅ Create an account with email
✅ Get redirected to dashboard
✅ Create a project in Kanban board
✅ Drag tasks between columns
✅ Admin panel shows your user

---

## Project File Structure

```
itpromanager/
├── src/
│   ├── app/
│   │   ├── (app)/              ← Protected routes (require login)
│   │   │   ├── dashboard/      ← Main dashboard
│   │   │   ├── kanban/         ← Kanban board
│   │   │   ├── project-plan/   ← Project plan (Phase 2)
│   │   │   ├── network/        ← Network diagram (Phase 3)
│   │   │   ├── knowledge/      ← Knowledge base (Phase 2)
│   │   │   ├── admin/          ← Admin panel
│   │   │   └── settings/       ← User settings
│   │   ├── auth/callback/      ← OAuth callback
│   │   ├── login/              ← Auth page
│   │   └── page.tsx            ← Landing page
│   ├── components/
│   │   ├── Sidebar.tsx         ← Navigation sidebar
│   │   ├── Topbar.tsx          ← Top bar
│   │   └── KanbanBoard.tsx     ← Drag-and-drop Kanban
│   ├── lib/supabase/           ← Supabase client, server, middleware
│   ├── types/                  ← TypeScript types
│   └── middleware.ts           ← Auth route protection
├── supabase-schema.sql         ← Run this in Supabase SQL Editor
├── .env.example                ← Copy to .env.local and fill in
├── package.json
└── tailwind.config.js
```

---

## Need Help?

- Supabase docs: https://supabase.com/docs
- Next.js docs: https://nextjs.org/docs
- Vercel docs: https://vercel.com/docs
- Tailwind docs: https://tailwindcss.com/docs

---

## What's Coming Next

| Phase | Features |
|-------|---------|
| Phase 2 | Project Plan with Gantt, Knowledge Base with AI draft |
| Phase 3 | Claude AI plan generator, Network Diagram AI builder |
| Phase 4 | Admin analytics, country map, resource usage charts |
