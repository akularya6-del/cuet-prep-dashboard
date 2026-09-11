# CUET Preparation Dashboard

A private-edit, public-view dashboard for tracking official CUET 2026 syllabus coverage and evidence-based mastery across Mathematics, Chemistry, English, Physical Education, and GAT. It uses no AI API and starts with exactly 0.0% progress.

## Architecture

- **Next.js + TypeScript**: responsive app and Vercel server routes.
- **Static official syllabus**: `lib/syllabus.ts` is version-controlled and sourced from the five PDFs in this repository.
- **Supabase Postgres**: stores only chronological activity events. All metrics are reconstructed from history, so editing or deleting an event recalculates everything.
- **Server-only database key**: browser code never receives the Supabase secret key. Row-level security has no client policies.
- **Owner password session**: `/api/session` verifies `OWNER_PASSWORD` on the server and sets a signed, HTTP-only, same-site cookie. Public visitors can read; only the owner can write.
- **30-second foreground refresh**: saved entries update the current browser immediately and other devices shortly afterwards. The last successful read is cached locally for offline viewing only; offline writes are disabled.

## Official syllabus extraction

| Subject                | Source                   | Representation                                                                                        |
| ---------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------- |
| GAT 501                | `20251227140287889.pdf`  | Flat official list, split only where one bullet contains distinct study areas                         |
| Mathematics 319        | `202512271521179041.pdf` | Section A1 consolidated into the detailed Section B1 Mathematics units to prevent duplicate weighting |
| Physical Education 321 | `202512271937553070.pdf` | Nine visually inspected units; Unit III shared competencies attached to each named sport              |
| Chemistry 306          | `20251227437950608.pdf`  | Ten official units split into study-sized topics                                                      |
| English 101            | `20251227980877010.pdf`  | Every explicitly named topic; the PDF states the list is non-exhaustive                               |

The same Mathematics PDF also contains the alternative Section B2 Applied Mathematics pathway. Its outline is available in Settings for reference, outside the requested **Mathematics (B1)** progress totals. A1 Simple Probability is retained under Probability. Topic IDs are stable; every topic retains cleaned source wording and its source page. These are study-sized groups, not verbatim PDF transcriptions.

Topic raw weights are `min(5, max(1, ceil(words / 14)))` using retained wording. This transparent scope heuristic is not official exam weighting. Weights normalize inside each subject to 100%; the five subjects each contribute 20% overall.

Original PDFs are served under `public/syllabus`. `data/source-pages.json` retains page text and SHA-256 hashes. PE is image-only and was manually inspected; empty extracted text is explicitly marked. Regenerate this archive with `node scripts/prepare-sources.mjs` (requires Poppler `pdftotext`). The root PDFs remain unchanged.

## Progress formula

All internal calculations use full floating-point precision and round only for display.

### Coverage

- First study, revision, or recall: **100% topic coverage**.
- Practice or test without a study event: **60% topic coverage** (proven exposure, not a complete first study).
- No relevant event: **0%**.

Subject coverage is the sum of each topic's coverage multiplied by its normalized topic weight.

### Mastery

Topic mastery is capped at 100 and combines four independently limited components:

1. **Learning — 25 points**: 25 for a first-study event; 20 when revision/recall is the earliest evidence; 10 for applied exposure only.
2. **Recall — 30 points**: `30 × (1 − exp(−0.7 × evidence)) × freshness`. Each attempt adds `(confidence − 1) / 4` evidence, or 0.8 if omitted. Confidence 1 adds zero. Attempt-based intervals are 7, 21, 45, 90, and 150 days; overdue days reduce freshness by `days / 360`, to a 0.65 floor. Revisions are not recalls.
3. **Practice — 20 points**: `20 × min(1, √(allocated questions / 100)) × accuracy`. Shared attempted/correct counts divide equally across selected topics; subject totals count the session once. Zero accuracy earns zero practice points.
4. **Tests — 25 points**: the five newest scored tests use chronological weights 1–5. `25 × weighted accuracy × min(1, 0.55 + 0.15 × (attempts − 1))`. A broad score applies only to explicitly selected topics. Zero scores earn zero test points.

First study alone gives 25% topic mastery. Status thresholds are **Strong ≥70** and **Mastered ≥85**, but weak practice/test accuracy (<65%) or overdue recall prevents those labels. Scores estimate preparation, not exam marks. Dates and daily gains use Asia/Kolkata; future activity is rejected. Display values round to one decimal, never intermediate calculations.

## Local development

Requirements: Node.js 20.9 or later and a free Supabase project.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Without environment variables, the whole syllabus remains browsable and the app clearly reports read-only setup mode.

## Free Supabase setup

1. Create a free project at `https://database.new` (no payment is required for personal usage within the free limits).
2. Open **SQL Editor → New query**.
3. Run **both** SQL migrations in filename order: `202609110001_create_activities.sql`, then `202609110002_audit_and_login.sql`.
4. Open **Project Settings → Data API** and copy the Project URL into `SUPABASE_URL`.
5. Open **Project Settings → API Keys**, rotate the key if it has been exposed, and put a server `sb_secret_…` key in `SUPABASE_SECRET_KEY`. This is server-only; never prefix it with `NEXT_PUBLIC_` or paste it into client code. The legacy `SUPABASE_SERVICE_ROLE_KEY` remains accepted only for older projects.
6. Choose a unique password of **at least 20 characters** for `OWNER_PASSWORD`. Enter values directly into `.env.local`, not chat. Restart the local server after configuring it.

## Tests and production build

```bash
npm test
npm run check
npm run build
```

Tests cover progress reconstruction, zero/poor evidence, chronological tests, shared counts, invalid input, source IDs and normalized weights. An isolated in-memory PostgreSQL test executes both real migrations and checks CRUD, revision preservation, soft deletion, anonymous denial, and login throttling. No test history is seeded into the app.

## Deploy to Vercel

1. Push this folder to a Git repository and import it at `https://vercel.com/new` using a free Hobby account.
2. Keep the detected framework as **Next.js** and the build command as `npm run build`.
3. Add the three values from `.env.example` under **Project Settings → Environment Variables** for Production, Preview, and Development.
4. Deploy. Progress is stored in Supabase, so deployments do not reset it and phone edits appear without a rebuild.

No OpenAI key or paid API is used. [Supabase Free](https://supabase.com/pricing) currently includes a 500 MB database but pauses after one week of inactivity and does not include automatic backups. Resume paused projects in its dashboard. [Vercel Hobby](https://vercel.com/docs/plans/hobby) is intended for personal, non-commercial use and has usage limits. Stay on these plans; do not enable paid upgrades. Pricing checked September 11, 2026.

## Security, recovery and launch checks

- Public viewing includes activity notes. Do not log private information or credentials.
- The signed owner cookie expires after 30 days. Changing `OWNER_PASSWORD` invalidates existing sessions. HTTPS makes the cookie Secure in production; cross-origin writes are rejected.
- Login is limited globally to 10 attempts per 15 minutes across all instances. This is deliberately simple for one personal owner; repeated hostile attempts can temporarily block owner login too.
- Saves use client UUIDs for retry safety. Edits/deletes require the original `updated_at`; stale changes return a conflict instead of overwriting another device. Reads use 500-record incremental pages and deletion markers.
- Deletion hides a row using `deleted_at`; corrections retain the previous row in `activity_revisions`. To recover, inspect the exact row in Supabase SQL Editor and set its `deleted_at` to NULL. Do not bulk-update all rows. Export `activities` and `activity_revisions` regularly using Supabase's table export because Free has no automatic backups.
- This is a single-owner app. Derived charts scan personal history in the browser; move aggregation to SQL if history becomes large enough to affect responsiveness.

After deployment, verify in a private browser that reads work and writes are denied. Unlock on your phone; add study, recall, practice and test entries; refresh another browser; correct and delete one entry; confirm totals reconstruct. Test a stale edit in two tabs and verify it reports a conflict. Try offline mode: cached viewing should remain available but saving must be disabled.

Hosted persistence, production cookies and cross-device sync cannot be verified until your Supabase environment and Vercel deployment are configured. Local database tests do not substitute for those launch checks.

## Changing the model later

- Edit deterministic formulas and status thresholds in `lib/progress.ts`.
- Add or correct official topics in `lib/syllabus.ts`; keep IDs stable after activities exist.
- Add event fields with a new timestamped SQL migration rather than editing an applied migration.
