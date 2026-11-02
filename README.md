# SupportPilot – AI Customer Support Response Generator

A visually stunning, animation-rich AI customer support platform built with Next.js 14 App Router, Google Gemini multi-turn conversational AI, Supabase PostgreSQL via Prisma ORM, and physics-driven 3D UI components.

---
Live link : https://support-pilot-six.vercel.app/

## Architecture Overview

1. **Multi-Turn AI Support Chat (Gemini Flash)**:
   - Real-time conversational AI grounded **strictly** in approved Knowledge Base (KB) articles.
   - Zero hallucination policy: If an inquiry cannot be answered from approved articles, the assistant explicitly states it doesn't have approved info and triggers smart escalation.
   - Free typing input always available with instant suggestion shortcuts.
   - Client sends `ticketId` and queries; server loads the last 10 messages from the database as multi-turn conversational context.

2. **Smart Escalation & Human Handoff**:
   - Automatically escalates to a live, matching specialist when:
     - Customer taps "Not solved" twice, or indicates frustration ("didn't help", "talk to human").
     - AI cannot find approved KB answers 2 turns in a row (`needsEscalation: true`).
     - Strong negative sentiment combined with Urgent priority.
     - 10-minute session timer expires (configurable, with a 30s demo-mode shortcut).
   - Shows the free specialist's lanyard badge with automatic 3D flip revealing direct Call, Email, and WhatsApp contact options.
   - If no specialist is currently on shift, displays next available time and a "Request Callback" form linked to the ticket.

3. **Supabase PostgreSQL via Prisma ORM**:
   - 100% server-side database access via Prisma (no direct client connections, no `@supabase/supabase-js`, no exposed database keys).
   - Database-backed rate limiting (15 requests/minute per ticket/IP).
   - Row Level Security (RLS) enabled on all tables.
   - Vercel serverless-ready (`runtime = "nodejs"`, `maxDuration = 30`).

4. **Zero-API Fallback (Demo Mode)**:
   - If `GEMINI_API_KEY` is not provided or hits rate limits, the app seamlessly falls back to a deterministic keyword classification & KB drafting engine. A small `"Demo mode (no AI)"` badge appears in the chat header, ensuring presentations never fail.

---

## Security & Row Level Security (RLS)

Supabase automatically exposes tables in the `public` schema via its auto-generated PostgREST HTTP API. Because SupportPilot accesses the database **exclusively** through server-side Prisma queries (connecting with the administrative `postgres` role which bypasses RLS), we lock down the public API completely:

- **RLS Enabled on All Tables**: `Ticket`, `Message`, `KbArticle`, `Agent`, `Callback`, `RateLimit`, and `_prisma_migrations`.
- **Zero Public Policies**: No `SELECT`, `INSERT`, `UPDATE`, or `DELETE` policies are granted to the `anon` or `authenticated` PostgREST roles. Any attempt to query Supabase tables using public anon/publishable keys returns an empty set or `401 Unauthorized`.
- **Privacy Assurance**: Agent personal phone numbers and emails are never returned in public chat endpoints until a valid escalation handoff occurs.
- **Verification**: In your Supabase Dashboard &rarr; **Table Editor**, each table displays the green **RLS Enabled** badge with 0 active policies.

---

## Timezone & Agent Shifts (`APP_TIMEZONE`)

Vercel serverless instances run in UTC. To ensure support agent availability is accurately calculated according to your team's operating hours:
- The `APP_TIMEZONE` environment variable (default: `Asia/Kolkata`) is evaluated at runtime using `Intl.DateTimeFormat`.
- Agent shift start/end times (e.g. `09:00` &ndash; `18:00`) are compared against the current wall-clock time in `APP_TIMEZONE`, regardless of where the serverless function executes globally.

---

## Environment Variables (`.env.local`)

Copy `.env.example` to `.env.local` and configure your credentials:

```bash
# Google Gemini API Key (free tier: https://aistudio.google.com/apikey)
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash

# Supabase PostgreSQL via Prisma (Connect -> ORM tab in Supabase Dashboard)
# NOTE: Use letters and numbers for your DB password; special characters must be URL-encoded.
# DATABASE_URL = Supavisor TRANSACTION pooler (port 6543, pgbouncer=true) for runtime queries
DATABASE_URL="postgres://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"

# DIRECT_URL = Supavisor SESSION pooler (port 5432) for Prisma migrations and db push
DIRECT_URL="postgres://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"

# Application timezone for shift calculation
APP_TIMEZONE=Asia/Kolkata
```

> **Important**: Do not use the `db.<project-ref>.supabase.co` direct connection string; it is IPv6-only by default and will fail on many residential and cloud networks. Always use the Supavisor pooler URLs shown above.

---

## Run on Your Laptop

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a free project at [Supabase](https://supabase.com). Go to **Project Settings &rarr; Database &rarr; Connect &rarr; ORM (Prisma)**, and copy the `DATABASE_URL` (Transaction pooler) and `DIRECT_URL` (Session pooler) into `.env.local`. Also get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).

3. **Initialize the database schema, enable RLS, and seed data**:
   ```bash
   npm run setup
   ```
   *(This runs `prisma db push` to create PostgreSQL tables, applies Row Level Security, and seeds 6 specialists, 15 KB articles, and sample tickets via `prisma/seed.ts`)*.

4. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

1. **Push your code to GitHub** (ensure `.env*` files are excluded by `.gitignore`).
2. **Import the repository into Vercel**.
3. **Add Environment Variables** in Vercel **Project Settings &rarr; Environment Variables**:
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL` (`gemini-2.5-flash`)
   - `DATABASE_URL` (Supavisor Transaction Pooler, port 6543 with `?pgbouncer=true`)
   - `DIRECT_URL` (Supavisor Session Pooler, port 5432)
   - `APP_TIMEZONE` (`Asia/Kolkata`)
4. **Run database setup once from your laptop** against the Supabase database:
   ```bash
   npm run setup
   ```
5. **Deploy**:
   - `package.json` contains `"build": "prisma generate && next build"` and `"postinstall": "prisma generate"`, which automatically builds the Prisma Client during Vercel's build step.
   - Subsequent redeployments preserve all tickets, messages, ratings, and KB edits without resetting data.

> **Note on Free Supabase Projects**: Free tier Supabase projects pause after 7 days of inactivity. If API routes return connection timeouts before a demo, simply visit the Supabase Dashboard and click **Restore Project**.

---

## Application Routes

| Route | Description |
|---|---|
| `/` | Landing page with 3D Perspective Tunnel Hero, How It Works, Bento Grid, and Team Lanyard Rail |
| `/chat` | Multi-turn live AI support chat with session timer ring, follow-up chips, rating, and smart escalation |
| `/dashboard` | Agent Dashboard (Tickets with detail drawer, Approved KB manager, Team live status controls, Analytics) |
| `/api/chat` | Multi-turn Gemini pipeline (retrieve top 3 KB articles &rarr; generate grounded response &rarr; save to DB) |
| `/api/escalate` | Manual or timer-driven handoff to the best-matching available specialist in `APP_TIMEZONE` |
| `/api/tickets/resolve` | Resolves ticket and records customer 1&ndash;5 star satisfaction rating |
| `/api/callback` | Captures customer callback details when all specialists are offline or busy |
| `/api/dashboard/data` | Database endpoint providing live tickets, KB articles, team members, and performance analytics |
| `/api/dashboard/kb` | CRUD endpoint to add, edit, or delete approved KB articles directly in PostgreSQL |
| `/api/dashboard/agent/status` | Real-time status toggle (available / busy / offline) for support specialists |
