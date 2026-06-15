# Mareedy — Technical & Project Documentation

**Version:** 1.0.0  
**Last updated:** June 2026  
**Live URL:** https://mareedy.vercel.app  
**Repository:** https://github.com/Shaf3y01/mareedy

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Scope & Goals](#2-project-scope--goals)
3. [System Architecture](#3-system-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Repository Structure](#5-repository-structure)
6. [Data Model](#6-data-model)
7. [Feature Specifications](#7-feature-specifications)
8. [User Flows](#8-user-flows)
9. [State Management Design](#9-state-management-design)
10. [Security Model](#10-security-model)
11. [Internationalisation & RTL](#11-internationalisation--rtl)
12. [PWA Architecture](#12-pwa-architecture)
13. [Deployment & CI/CD](#13-deployment--cicd)
14. [Environment Configuration](#14-environment-configuration)
15. [Development Workflow](#15-development-workflow)
16. [Known Limitations & Production Checklist](#16-known-limitations--production-checklist)
17. [Roadmap](#17-roadmap)

---

## 1. Executive Summary

Mareedy (مريضي — "My Patient") is a mobile-first, bilingual Progressive Web App (PWA) designed for critical-care ward teams. It replaces paper-based or spreadsheet bed boards with a real-time, structured digital chart accessible from any device — phone, tablet, or desktop — without requiring an app store installation.

The system manages bed occupancy and full patient clinical records (vitals, examination findings, laboratory results, imaging, medications, and event logs) for a minimum of 9 beds per ward. All data is persisted in a cloud database, protected by authentication, and accessible offline for the app shell.

The project was built as a production-grade scaffold: it runs fully on free-tier services (Supabase + Vercel) and can be deployed to a real clinical environment after the production hardening steps described in §16.

---

## 2. Project Scope & Goals

### In Scope
- Bed grid overview (occupancy, acuity status at a glance)
- Patient admission and discharge workflow
- Structured patient chart with 6 tabs: Chart, Exam, Labs, Imaging, Medications, Events
- Persistent data storage via Supabase Postgres
- Email/password authentication with route protection
- Bilingual UI: English (LTR) and Arabic (RTL)
- PWA install on iOS, Android, and desktop browsers
- Automatic re-deployment on every `git push` via Vercel

### Out of Scope (current version)
- Multi-ward / multi-clinic support
- Role-based access control (nurse vs. doctor vs. admin)
- Real-time multi-device synchronisation (Supabase Realtime)
- Push notifications
- Audit trail / change history beyond the events log
- Integration with existing HIS/PACS systems
- DICOM image viewing

---

## 3. System Architecture

### Layer Diagram

```
┌─────────────────────────────────────────────────┐
│                   Client Layer                  │
│  Browser / PWA (Vue 3 + Nuxt 4)                 │
│  - Pages: /  /bed/[id]  /login  /confirm        │
│  - Pinia store (ward.ts) — single source of     │
│    truth for beds + patients in memory          │
│  - Service worker — caches app shell offline    │
└────────────────────┬────────────────────────────┘
                     │ HTTPS (REST / PostgREST)
┌────────────────────▼────────────────────────────┐
│                  Backend Layer                  │
│  Supabase (managed)                             │
│  - PostgREST auto-API (REST over Postgres)      │
│  - GoTrue Auth (email/password JWT sessions)    │
│  - Row Level Security enforced at DB level      │
│                                                 │
│  Nitro (Nuxt built-in, deployed to Vercel)      │
│  - SSR rendering                                │
│  - Custom API route: GET /api/health            │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│                 Database Layer                  │
│  Supabase Postgres                              │
│  Tables: beds · patients · events · meds        │
│  RLS: all tables, authenticated users only      │
└─────────────────────────────────────────────────┘
                     │ Git push → auto-deploy
┌────────────────────▼────────────────────────────┐
│                  Hosting Layer                  │
│  Vercel (Nitro/Vercel preset)                   │
│  - HTTPS enforced                               │
│  - Edge network CDN for static assets           │
│  - Serverless functions for SSR                 │
└─────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Rendering | SSR + client hydration (Nuxt default) | SEO is irrelevant here; SSR is kept for fast first paint and `callOnce` data loading |
| State | Pinia setup store | Composable-friendly, works cleanly with `useSupabaseClient()` in setup context |
| DB access | Supabase client (PostgREST) directly from browser | No custom API layer needed; RLS enforces data isolation |
| Auth | Supabase GoTrue (JWT) | Integrated with the Supabase client; session token is automatically attached to every DB request |
| Offline | Service worker caches app shell only | Patient data is always live; only the UI assets are cached |

---

## 4. Technology Stack

| Layer | Package | Version | Purpose |
|---|---|---|---|
| Framework | `nuxt` | 4.4.5 | Full-stack Vue framework, SSR, routing, auto-imports |
| UI library | `vue` | 3.5.38 | Component model, reactivity |
| State | `pinia` + `@pinia/nuxt` | 3.0.4 / 0.11.3 | Global ward store |
| Internationalisation | `@nuxtjs/i18n` | 10.4.0 | EN/AR translations, RTL switching |
| PWA | `@vite-pwa/nuxt` | 1.1.1 | Manifest + Workbox service worker generation |
| Backend-as-a-Service | `@nuxtjs/supabase` | 2.0.9 | Supabase client module, auth middleware |
| Supabase JS client | `@supabase/supabase-js` | 2.108.2 | DB queries, auth sessions |
| Build tooling | `vite` | 7.3.5 (via Nuxt) | Module bundler |
| Server runtime | `nitro` | 2.13.4 (via Nuxt) | Nuxt's server engine; Vercel preset |
| Language | TypeScript | 6.0.3 | Type safety across store, components, utilities |
| Hosting | Vercel | — | Serverless deployment, CDN, HTTPS |
| Database | Supabase Postgres | — | Managed Postgres with PostgREST API |

---

## 5. Repository Structure

```
mareedy/
├── app/
│   ├── app.vue                  # Root component — sets <html dir> for RTL
│   ├── assets/
│   │   └── css/main.css         # Global design system (tokens, layout, components)
│   ├── components/
│   │   ├── AdmitSheet.vue       # Bottom sheet for new patient admission
│   │   ├── AppBar.vue           # Top navigation bar (brand, lang toggle, sign-out)
│   │   ├── BedCard.vue          # Single bed card on the grid
│   │   ├── StatusPill.vue       # Acuity badge (stable / watch / critical)
│   │   └── patient/
│   │       ├── PatientHeader.vue    # Name, tabs, edit toggle, discharge button
│   │       ├── ChartTab.vue         # Vitals, conscious level, patient details
│   │       ├── ExamTab.vue          # Clinical examination findings
│   │       ├── LabsTab.vue          # All lab results (ABG, CBC, renal, etc.)
│   │       ├── ImagingTab.vue       # CT, X-ray, ultrasound, endoscopy
│   │       ├── MedsTab.vue          # Medication list with actions
│   │       └── EventsTab.vue        # Chronological event log + recommendations
│   ├── layouts/
│   │   └── default.vue          # AppBar wrapper for all protected pages
│   ├── pages/
│   │   ├── index.vue            # Bed grid (ward overview)
│   │   ├── bed/[id].vue         # Patient chart (dynamic route)
│   │   ├── login.vue            # Auth page (no layout)
│   │   └── confirm.vue          # Supabase auth callback handler
│   ├── stores/
│   │   └── ward.ts              # Pinia setup store — all data + Supabase actions
│   └── utils/
│       ├── format.ts            # Date formatters (fmtNow, fmtToday, fmtDbTimestamp, fmtDbDay)
│       └── triage.ts            # Acuity type, colour helpers, vital sign alert logic
├── i18n/
│   └── locales/
│       ├── en.ts                # English UI strings
│       └── ar.ts                # Arabic UI strings (RTL)
├── public/
│   ├── favicon.ico
│   ├── apple-touch-icon.png
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   └── pwa-maskable-512x512.png
├── server/
│   └── api/
│       └── health.get.ts        # GET /api/health — basic liveness check
├── supabase/
│   └── schema.sql               # Full DB schema + RLS policies + bed seed
├── .env                         # Local secrets (gitignored)
├── .env.example                 # Template for required env vars
├── .gitignore
├── nuxt.config.ts               # Nuxt, i18n, PWA, and Supabase configuration
├── package.json
├── package-lock.json
├── DOCUMENTATION.md             # This file
└── SETUP_GUIDE.md               # Step-by-step beginner setup guide
```

---

## 6. Data Model

### Entity Relationship

```
beds (1) ──────────── (0..1) patients (1) ── (*) events
                                         (1) ── (*) meds
```

### Table: `beds`

| Column | Type | Notes |
|---|---|---|
| `id` | `int` PK | Bed number (1, 2, 3 …). Set explicitly, not auto-increment |
| `created_at` | `timestamptz` | DB default: now() |

### Table: `patients`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Generated by DB |
| `bed_id` | `int` FK → beds | `null` once discharged |
| `name`, `age`, `sex` | `text` | Demographics |
| `pmhx`, `allergies`, `habits` | `text` | Medical history |
| `conscious`, `bp`, `hr`, `spo2`, `o2mode`, `temp`, `rr` | `text` | Vital signs (stored as text for flexibility) |
| `status` | `text` | `stable` \| `watch` \| `critical` |
| `exam` | `jsonb` | `{ appearance, cvs, chest, abdomen, limbs, neuro }` |
| `imaging` | `jsonb` | `{ ctChest, ctBrain, xray, paus }` |
| `ultrasound`, `endoscopy` | `text` | Free-text imaging notes |
| `labs` | `jsonb` | `{ abg, cbc, renal, lytes, liver, bili, inr, crp, cardiac, thyroid, hba1c }` — all lab sub-groups packed into one column |
| `balance` | `jsonb` | `{ sign: '+'\|'-', value: string }` |
| `recommendations` | `text` | Plan / consultant notes |
| `discharged` | `boolean` | `false` = active admission; `true` = historical |
| `created_at`, `updated_at` | `timestamptz` | `updated_at` patched on every save |

> **Design note:** Grouping all lab results into a single `labs` JSONB column avoids a wide table with 30+ columns and lets the client read/write all labs in a single query. The tradeoff is that individual lab values cannot be indexed or queried by the DB — acceptable for a ward chart where queries are always by patient, not by lab value.

### Table: `events`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `patient_id` | `uuid` FK → patients | Cascade delete |
| `occurred_at` | `timestamptz` | DB default: now() |
| `body` | `text` | Free-text event description |

### Table: `meds`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `patient_id` | `uuid` FK → patients | Cascade delete |
| `name`, `dose`, `route`, `freq` | `text` | Prescription fields |
| `started` | `date` | Start date |
| `status` | `text` | `active` \| `escalated` \| `de-escalated` \| `discontinued` |
| `log` | `jsonb` | Array of `{ date, text }` — status change history |
| `created_at` | `timestamptz` | |

---

## 7. Feature Specifications

### 7.1 Bed Grid (Ward Overview)

- Displays all beds in a responsive grid (1 column mobile → 2–3 columns wider screens).
- Each `BedCard` shows: bed number, patient name, age/sex, acuity status pill, and colour-coded left stripe (green = stable, amber = watch, red = critical).
- Empty beds show an "Admit patient" button.
- Ward summary chips at the top: total beds / occupied / free count.
- "Add bed" button appends a new bed (inserts a row into `beds` table). Beds can only be removed when empty and when total count > 9.

### 7.2 Patient Admission

- Triggered from an empty bed card → opens `AdmitSheet` bottom sheet.
- Collected fields: name (required), age, sex, acuity level, chief complaint.
- On confirm: inserts a `patients` row, inserts a first `events` row ("Admitted — [complaint]"), navigates to the new patient's chart in edit mode.

### 7.3 Patient Chart — 6 Tabs

| Tab | Content |
|---|---|
| **Chart** | Vitals (BP, HR, SpO₂, Temp, RR, O₂ support), conscious level, patient details (PMHx, allergies, habits) |
| **Exam** | Clinical findings in 6 systems: appearance, CVS, chest, abdomen, limbs, neuro |
| **Labs** | ABG, CBC, renal function, electrolytes, liver function, bilirubin, coagulation, cardiac markers, thyroid, HbA1c, fluid balance |
| **Imaging** | CT chest, CT brain, X-ray, pelvi-abdominal ultrasound, free-text ultrasound and endoscopy fields |
| **Meds** | Active medication list with dose/route/frequency; actions: Escalate, De-escalate, Discontinue, Modify (inline edit); Add medication form |
| **Events** | Chronological log (newest first); add free-text events; recommendations textarea |

### 7.4 Edit / Save Flow

- A pencil icon button in `PatientHeader` toggles edit mode globally across all tabs.
- All form inputs are rendered only when `editing === true`; read-only display otherwise.
- When edit mode is turned **off**, a `watch` in `PatientHeader` fires `ward.savePatient(bedId)` — a single `UPDATE` on the patients row covering all scalar columns plus `exam`, `imaging`, `labs`, and `balance` JSONB columns.
- Medications use their own save cycle: `toggleMedEdit` saves name/dose/route/freq/log when the inline edit is closed.

### 7.5 Discharge

- Discharge button in `PatientHeader` → inline confirmation → `ward.discharge(bedId)`.
- DB: sets `discharged = true`, `bed_id = null` on the patient row.
- Historical records are preserved in the database; only active admissions (discharged = false) are fetched on load.

### 7.6 Authentication

- Email/password sign-in and account creation on `/login`.
- Supabase GoTrue issues a JWT stored in a cookie/localStorage by the Supabase client.
- `@nuxtjs/supabase` middleware redirects unauthenticated requests to `/login`.
- Sign-out clears the session and redirects to `/login`.
- The `/confirm` route handles the Supabase auth callback for email confirmation and OAuth flows.

---

## 8. User Flows

### Login Flow
```
User visits any URL
  → Not authenticated → redirect to /login
  → Enter email + password → signInWithPassword()
  → Success → navigate to /
  → Session cookie set → all subsequent requests carry JWT
```

### Admit Patient Flow
```
Ward overview (/)
  → Tap empty bed card → "Admit patient"
  → AdmitSheet opens (bottom sheet)
  → Fill name, age, sex, acuity, chief complaint → Confirm
  → INSERT patients row + INSERT events row (admission note)
  → Navigate to /bed/[id]?new=1 (chart opens in edit mode)
  → Fill vitals, exam, labs, imaging → tap pencil to save
  → UPDATE patients row persisted to DB
```

### Document Clinical Update Flow
```
Tap occupied bed card → /bed/[id]
  → Tap pencil icon → edit mode ON
  → Edit any field across any tab
  → Tap pencil icon → edit mode OFF → savePatient() fires
  → Single UPDATE covers all changed fields
```

### Add Event / Medication Flow
```
Events tab → type in event field → submit
  → INSERT into events table → prepended to local list

Meds tab → tap "Add medication" → fill form → Add
  → INSERT into meds table → appended to local list
```

### Discharge Flow
```
Patient chart → Discharge button
  → Inline confirmation appears
  → Confirm → UPDATE patients SET discharged=true, bed_id=null
  → Navigate back to / → bed now shown as empty
```

---

## 9. State Management Design

The entire ward state lives in a single Pinia setup store (`app/stores/ward.ts`).

### State Shape
```ts
beds: Bed[]      // reactive array of { id, patient | null }
loading: boolean // true only during initial loadWard()
```

### Computed
```ts
bedById(id)    // lookup by bed number
occupiedCount  // derived count
```

### Action Summary

| Action | DB operation | Local effect |
|---|---|---|
| `loadWard()` | SELECT beds + active patients + events + meds | Replaces `beds[]` |
| `admit()` | INSERT patient + INSERT event | Sets `bed.patient` |
| `discharge()` | UPDATE patient (discharged, bed_id) | Clears `bed.patient` |
| `addBed()` | INSERT bed | Pushes to `beds[]` |
| `removeBed()` | DELETE bed | Filters from `beds[]` |
| `addEvent()` | INSERT event | Unshifts into `patient.events` |
| `addMed()` | INSERT med | Pushes to `patient.meds` |
| `medAction()` | UPDATE med (status + log) | Updates in place |
| `toggleMedEdit()` | UPDATE med (fields + log) on close | Toggles `med.editing` |
| `savePatient()` | UPDATE patient (all clinical fields) | No local change needed |

### DB ↔ App Mapping

- **Reading:** `dbRowToPatient()` unpacks the flat DB row + embedded `events[]` + `meds[]` arrays into the nested `Patient` TypeScript interface. Events are sorted descending by `occurred_at`. The `labs` JSONB column is spread into individual sub-objects (`abg`, `cbc`, etc.).
- **Writing:** `patientToDbRow()` repacks all sub-objects back into the `labs` JSONB column for the UPDATE call.

---

## 10. Security Model

### Authentication
- All routes except `/login` require an authenticated session.
- Sessions are JWTs issued by Supabase GoTrue, automatically attached to every Supabase client request.
- The anon (public) key only allows what RLS policies permit — it does not bypass security.

### Row Level Security (RLS)
All four tables have RLS enabled. The current policies grant read/write access to **any authenticated user**:

```sql
-- Example (same pattern for all tables):
create policy "auth read patients" on patients
  for select using (auth.role() = 'authenticated');
create policy "auth write patients" on patients
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
```

> **For production:** Policies should be tightened to scope rows by a `clinic_id` or `team_id` column, and differentiated by user role (nurse, doctor, admin). See §16.

### Secrets
- The Supabase publishable (anon) key is safe to expose client-side — it has no privilege beyond what RLS allows.
- The Supabase secret key is never used in this application and should not be added to the frontend or committed to version control.
- Environment variables are injected at build time by Vercel; the `.env` file is gitignored.

### Sensitive Data Warning
Patient data is classified as Special Category data under GDPR and PHI under HIPAA. The current setup (free-tier Supabase, no BAA, single RLS policy for all users) is **not compliant** for production use with real patient records. See §16.

---

## 11. Internationalisation & RTL

- Managed by `@nuxtjs/i18n` with `strategy: 'no_prefix'` (language switched in-place without URL changes).
- Two locales: `en` (LTR, default) and `ar` (RTL).
- `app/app.vue` watches the active locale and sets `<html dir="ltr|rtl">` and `<html lang="...">` dynamically — this alone is enough for the CSS to flip all margins, paddings, and flex directions via the browser's built-in RTL cascade.
- All UI strings are in `i18n/locales/en.ts` and `i18n/locales/ar.ts`.
- Lab abbreviations (pH, Hb, Na⁺, etc.) are deliberately kept untranslated — they are universal clinical notation.
- The Arabic translations are a working scaffold. Clinical terminology should be reviewed by a qualified medical translator before use with clinical staff.

---

## 12. PWA Architecture

Configured via `@vite-pwa/nuxt` (Workbox under the hood).

### Manifest
| Property | Value |
|---|---|
| Name | Mareedy — Critical Care Ward |
| Short name | Mareedy |
| Display | `standalone` (no browser chrome) |
| Orientation | `portrait` |
| Theme color | `#0d7d76` (teal) |
| Icons | 192×192, 512×512, 512×512 maskable |

### Service Worker Strategy
- `registerType: 'autoUpdate'` — when a new version is deployed, installed PWAs update silently on next load.
- `navigateFallback: '/'` — offline navigation always serves the cached shell.
- Cached asset types: `js, css, html, png, svg, ico, woff2`.
- **Patient data is not cached** — all Supabase API calls require an active network connection.

### Install
- **iOS Safari:** Share → Add to Home Screen
- **Android Chrome:** Menu → Install app
- **Desktop Chrome/Edge:** Install icon in address bar

> The service worker is disabled in `npm run dev` to prevent stale-cache confusion during development. Test PWA behaviour with `npm run build && npm run preview`.

---

## 13. Deployment & CI/CD

### Pipeline

```
Developer pushes to main branch on GitHub
  → Vercel webhook triggered (GitHub integration)
  → Vercel pulls repo, runs npm install
  → Runs npm run build (nuxt build)
  → Nitro detects Vercel preset → outputs to .vercel/output/
  → PWA service worker + manifest generated
  → Deployed to Vercel serverless functions + CDN
  → https://mareedy.vercel.app updated
  → Installed PWAs auto-update on next open
```

### Environments

| Environment | URL | Branch | Trigger |
|---|---|---|---|
| Production | https://mareedy.vercel.app | `main` | Every push to `main` |
| Preview | https://mareedy-{hash}.vercel.app | Any PR | Automatic PR deploy |

### Manual Deploy (CLI)
```bash
vercel --prod --yes
```

---

## 14. Environment Configuration

### Required Variables

| Variable | Where set | Description |
|---|---|---|
| `NUXT_PUBLIC_SUPABASE_URL` | `.env` (local) / Vercel env | Supabase project API URL: `https://<ref>.supabase.co` |
| `NUXT_PUBLIC_SUPABASE_KEY` | `.env` (local) / Vercel env | Supabase anon (publishable) key |

> Note: `@nuxtjs/supabase` v2 uses `NUXT_PUBLIC_SUPABASE_*` naming. Earlier versions used `SUPABASE_URL` / `SUPABASE_KEY`.

### Local Setup
```bash
# Copy the template
cp .env.example .env

# Fill in your values
NUXT_PUBLIC_SUPABASE_URL=https://your-ref.supabase.co
NUXT_PUBLIC_SUPABASE_KEY=sb_publishable_...
```

---

## 15. Development Workflow

### Prerequisites
- Node.js 20 or later
- npm 10 or later

### First-Time Setup
```bash
git clone https://github.com/Shaf3y01/mareedy.git
cd mareedy
npm install
cp .env.example .env
# Add your Supabase credentials to .env
npm run dev
```

### Common Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server at http://localhost:3000 |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `git push origin main` | Deploy to production (via Vercel) |
| `vercel --prod --yes` | Deploy to production manually via CLI |
| `vercel env add` | Add an env var to Vercel |

### File Conventions
- **Pages** go in `app/pages/` — Nuxt auto-routes them.
- **Components** go in `app/components/` — auto-imported by name (no import statements needed). `pathPrefix: false` means nested components use just their filename: `<MedsTab />` not `<PatientMedsTab />`.
- **Utilities** in `app/utils/` are auto-imported globally.
- **Store** actions should always update DB first (get the returned ID/row), then update local reactive state from the returned data — this keeps local UUIDs in sync with DB UUIDs.

---

## 16. Known Limitations & Production Checklist

The following must be addressed before using this system with real patient data.

### Compliance
- [ ] Engage a legal advisor to confirm applicable health data law (HIPAA / GDPR / local regulations).
- [ ] Sign a Business Associate Agreement (BAA) with Supabase (requires paid plan) and Vercel.
- [ ] Implement a data processing agreement with your institution.

### Access Control
- [ ] Add a `clinic_id` column to all tables and scope RLS policies to it — prevents staff from one ward seeing another's data.
- [ ] Add a `role` column to a `profiles` table and create role-differentiated policies (e.g. nurses cannot modify doctor recommendations).
- [ ] Enable email confirmation in Supabase Authentication settings.
- [ ] Enforce minimum password strength.
- [ ] Consider SSO / institutional login (SAML/OIDC) instead of email/password.

### Infrastructure
- [ ] Upgrade to a paid Supabase plan — free projects pause after inactivity and have no point-in-time recovery.
- [ ] Enable Supabase automated daily backups.
- [ ] Set up monitoring / alerting (Vercel Analytics, Supabase logs, or an external APM).
- [ ] Configure a custom domain (e.g. `ward.yourclinic.org`) with appropriate DNS and TLS.

### Clinical
- [ ] Have the Arabic translations reviewed by a professional medical translator.
- [ ] Have the vital sign alert thresholds in `triage.ts` reviewed and adjusted by a clinician — current values are illustrative only.
- [ ] Validate that the lab field labels match your institution's reporting terminology.

### Security
- [ ] Rotate any Supabase keys that were shared in non-secure channels.
- [ ] Add rate limiting to the Supabase auth endpoint.
- [ ] Review Vercel deployment access (limit who can trigger production deploys).

---

## 17. Roadmap

### Near-term (v1.1)
- **Supabase Realtime** — push bed/patient changes to all open sessions so multiple staff see updates live without refresh.
- **Acuity-based sorting** — sort bed grid by criticality (critical first) with a toggle.
- **Print view** — CSS `@media print` layout for ward round handover sheets.

### Medium-term (v1.2)
- **Multi-ward support** — `ward_id` column, ward selector in AppBar.
- **Role-based access** — nurse vs. doctor vs. read-only viewer.
- **Offline write queue** — queue mutations when offline, flush on reconnect using Supabase's offline capabilities.

### Long-term
- **Audit trail** — immutable event log for every field change (who changed what and when).
- **Handover report generator** — auto-generate a structured PDF summary for shift handover.
- **Integration API** — webhook endpoints for HIS/EHR systems to push admission/discharge events into Mareedy automatically.
- **Push notifications** — alert on-call staff when a patient's status changes to critical.
