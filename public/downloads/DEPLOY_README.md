# NexPlan — Pitch & ROI Admin Pages
## How to deploy these files into itpromanager repo

### Files to add/update:

```
src/app/pitch/page.tsx          ← NEW — admin-only pitch page
src/app/pitch/PitchClient.tsx   ← NEW — full pitch deck viewer + download
src/app/roi/page.tsx            ← UPDATE — same auth logic, no change needed
src/app/roi/ROIClient.tsx       ← UPDATE — now has 5 tabs incl AI Token Audit
src/app/api/downloads/pitch/route.ts  ← NEW — secure PPTX download API
src/middleware.ts               ← UPDATE — adds /pitch and /api/downloads to protected routes
public/downloads/NexPlan-CIO-Pitch.pptx  ← ADD — the PPTX file
```

### Step 1 — Copy files into repo

```bash
cd C:\Users\RAM\Desktop\projects\itpromanager

# Create directories
mkdir -p src/app/pitch
mkdir -p src/app/api/downloads/pitch
mkdir -p public/downloads
```

### Step 2 — Place the PPTX

Copy `NexPlan-CIO-Pitch.pptx` into `public/downloads/NexPlan-CIO-Pitch.pptx`

### Step 3 — Commit and push

```bash
git add src/app/pitch/ src/app/roi/ src/app/api/downloads/ src/middleware.ts public/downloads/
git commit -m "feat: add /pitch and update /roi — admin only, info@nexplan.io"
git push
```

### Step 4 — Verify live

Visit https://nexplan.io/pitch (must be logged in as info@nexplan.io)
Visit https://nexplan.io/roi (must be logged in as info@nexplan.io)

Anyone else → redirected to /dashboard

### Access control summary

| Route | Who can access |
|---|---|
| nexplan.io/pitch | info@nexplan.io only (Supabase auth + email check) |
| nexplan.io/roi | info@nexplan.io only (Supabase auth + email check) |
| nexplan.io/api/downloads/pitch | info@nexplan.io only (API route checks email) |
| All other routes | Normal Supabase auth |

### Password protection

The pages use Supabase auth (existing login system).
To access /pitch or /roi:
1. Go to nexplan.io/login
2. Enter info@nexplan.io + your password
3. Page loads — no one else can see it, not even other registered users
