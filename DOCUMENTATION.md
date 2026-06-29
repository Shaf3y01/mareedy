# Mareedy — Technical & Project Documentation

**Version:** 1.2.0  
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
│       ├── format.ts            # Date formatters (fmtNow, fmtToday, fmtDbTimestamp, fmtDbDay, localNow, localToday, isoToLocalInput)
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
| `patient_no` | `text` | Hospital / file number |
| `name`, `age`, `sex` | `text` | Demographics |
| `pmhx`, `allergies`, `habits` | `text` | Medical history |
| `admitted_at` | `timestamptz` | User-selected admission date/time (not auto-set) |
| `chart_date` | `timestamptz` | Timestamp of most recent vitals entry (nullable) |
| `conscious`, `bp`, `hr`, `spo2`, `o2mode`, `temp`, `rr` | `text` | Vital signs (stored as text for flexibility) |
| `status` | `text` | `stable` \| `watch` \| `critical` |
| `exam` | `jsonb` | `{ appearance, cvs, chest, abdomen, limbs, neuro, examDate }` — `examDate` is a datetime-local string |
| `imaging` | `jsonb` | `{ ctChest, ctBrain, xray, paus, imagingDate }` — `imagingDate` is a datetime-local string |
| `ultrasound`, `endoscopy` | `text` | Free-text imaging notes |
| `labs` | `jsonb` | `{ admission: LabsSet, yesterday: LabsSet, today: LabsSet }` — three independent lab sets |
| `balance` | `jsonb` | `{ sign: '+'\|'-', value: string }` |
| `recommendations` | `text` | Plan / consultant notes |
| `discharged` | `boolean` | `false` = active admission; `true` = historical |
| `created_at`, `updated_at` | `timestamptz` | `updated_at` patched on every save |

**`LabsSet` structure** (repeated three times under `admission`, `yesterday`, `today`):
```
{ labsDate, abg, cbc, renal, lytes, liver, bili, inr, crp, cardiac, thyroid, hba1c }
```

> **Design note:** All lab results are stored in a single `labs` JSONB column structured as three time-point sets. This avoids a wide table and supports the On Admission / Yesterday / Today clinical workflow without extra tables. The tradeoff is that individual values cannot be DB-indexed — acceptable since queries are always by patient.

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
- Collected fields: patient number, name (required), age, sex, acuity level, chief complaint, admission date/time (defaults to now, user-adjustable).
- On confirm: inserts a `patients` row with `admitted_at` set to the selected timestamp, inserts a first `events` row ("Admitted — [complaint]") with the same `occurred_at` timestamp, navigates to the new patient's chart in edit mode.
- The admission date/time is also editable afterwards from the Chart tab's Patient details panel.

### 7.3 Patient Chart — 6 Tabs

| Tab | Content |
|---|---|
| **Chart** | Vitals date/time stamp; vitals (BP, HR, SpO₂, Temp, RR, O₂ support), conscious level; patient details (patient no., name, admission date, PMHx, allergies, habits) |
| **Exam** | Exam date/time stamp; clinical findings in 6 systems: appearance, CVS, chest, abdomen, limbs, neuro |
| **Labs** | Three sub-tabs — **On Admission**, **Yesterday**, **Today** — each with its own date/time stamp and full panel: ABG, CBC, renal, electrolytes, liver, bilirubin, coagulation, cardiac markers, thyroid, HbA1c; fluid balance panel (shared) |
| **Imaging** | Imaging date/time stamp; CT chest, CT brain, X-ray, pelvi-abdominal ultrasound, free-text ultrasound and endoscopy fields |
| **Meds** | Active medication list with dose/route/frequency and start date picker; actions: Escalate, De-escalate, Discontinue, Modify (inline edit); Add medication form |
| **Events** | Chronological log (newest first); add free-text events with a date/time picker; recommendations textarea |

### 7.4a Timestamp Pickers

Every clinical tab has a date/time picker field at the top of its panel:

| Tab | Field stored | Where |
|---|---|---|
| Chart | `chart_date` (DB column) | Top of Complaint & vitals panel |
| Exam | `examDate` inside `exam` JSONB | Top of Exam panel |
| Labs | `labsDate` per set inside `labs` JSONB | Top of each sub-tab |
| Imaging | `imagingDate` inside `imaging` JSONB | Top of Imaging panel |
| Meds | `started` date on the `meds` row | Add medication form |
| Events | `occurred_at` on the `events` row | Next to the Add button |

All pickers default to the current local time. On the Events and Meds tabs the picker resets after each add. On the other tabs the timestamp is saved with the patient record when edit mode is closed.

### 7.4b Labs — Daily Rollover

The Labs tab has a **New Day** button (top-right, next to the sub-tabs). When confirmed:
1. All values and the date stamp from **Today** are copied into **Yesterday**.
2. **Today** is wiped blank, ready for fresh results.
3. The change is immediately persisted to the DB.
4. **On Admission** is never touched by the rollover — it is a permanent baseline.

Intended workflow: hit **New Day** once at the start of each shift handover.

### 7.5 Patient Number & Header Display

- `patient_no` is collected at admission (optional) and editable in both the Chart tab (Patient details panel) and directly in the patient header when edit mode is active.
- When set, it appears as `# 123456` next to the patient name in:
  - The bed card on the ward overview
  - The patient header on the chart page

### 7.6 QR Code Bed Access

Each physical bed has a printed QR code that encodes its direct URL (`https://mareedy.vercel.app/bed/[id]`). Scanning the QR code with any phone camera opens the bed's chart page instantly — no app store installation required.

**Generating codes:** A printable HTML sheet (`mareedy-qr-codes.html`) containing all 9 bed QR codes can be generated from the scratchpad directory. Each card shows the bed number, a teal QR code, and the full URL. Print, laminate, and attach one per bed.

**Authentication handling:** If the scanning user is already logged in, they land directly on the bed chart. If not logged in, the Supabase middleware redirects them to `/login?redirect=/bed/[id]`. After successful sign-in, `login.vue` reads the `redirect` query param and navigates to the originally requested bed rather than the home screen.

**Device support:** Native camera on iOS 13+ and Android reads the code without a third-party app. Works whether Mareedy is installed as a PWA or accessed in the browser.

### 7.7 Edit / Save Flow

- A pencil icon button in `PatientHeader` toggles edit mode globally across all tabs.
- All form inputs are rendered only when `editing === true`; read-only display otherwise.
- When edit mode is turned **off**, a `watch` in `PatientHeader` fires `ward.savePatient(bedId)` — a single `UPDATE` on the patients row covering all scalar columns plus `exam`, `imaging`, `labs`, and `balance` JSONB columns.
- Medications use their own save cycle: `toggleMedEdit` saves name/dose/route/freq/log when the inline edit is closed.
- The Labs **New Day** rollover also calls `savePatient` immediately, bypassing the edit mode cycle.

### 7.8 Discharge

- Discharge button in `PatientHeader` → inline confirmation → `ward.discharge(bedId)`.
- DB: sets `discharged = true`, `bed_id = null` on the patient row.
- Historical records are preserved in the database; only active admissions (discharged = false) are fetched on load.

### 7.9 Authentication

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
  → Not authenticated → redirect to /login?redirect=<original path>
  → Enter email + password → signInWithPassword()
  → Success → navigate to redirect param (or / if none)
  → Session cookie set → all subsequent requests carry JWT
```

### QR Code Scan Flow
```
Doctor scans bed QR code (e.g. /bed/3)
  → Already logged in → lands directly on Bed 3 chart
  → Not logged in → redirect to /login?redirect=/bed/3
  → Sign in → navigate to /bed/3 (redirect param restored)
  → Ward data already loaded (via default layout) → patient chart shown immediately
```

### Admit Patient Flow
```
Ward overview (/)
  → Tap empty bed card → "Admit patient"
  → AdmitSheet opens (bottom sheet)
  → Fill patient no., name, age, sex, acuity, chief complaint
  → Adjust admission date/time if needed (defaults to now)
  → Confirm
  → INSERT patients row (admitted_at = selected timestamp)
  → INSERT events row "Admitted — [complaint]" (occurred_at = same timestamp)
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
Events tab → type in event field → adjust date/time picker → submit
  → INSERT into events table (occurred_at = selected time) → prepended to local list

Meds tab → tap "Add medication" → fill form → adjust start date → Add
  → INSERT into meds table (started = selected date) → appended to local list
```

### Labs Daily Rollover Flow
```
Labs tab → New Day button (top-right)
  → Confirmation banner appears
  → Confirm → Today copied into Yesterday → Today cleared
  → savePatient() called immediately → DB updated
  → Staff fill Today with fresh results
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

`loadWard()` is called via `callOnce('loadWard', ...)` in `app/layouts/default.vue` so it runs exactly once per session regardless of which page the user lands on (home, direct QR link, etc.). The login page opts out via `definePageMeta({ layout: false })`, so `loadWard` is never called while unauthenticated.

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

### Key Types

```ts
interface LabsSet {
  labsDate: string          // datetime-local input string
  abg, cbc, renal, lytes, liver, bili  // sub-objects
  inr, crp, hba1c           // scalar strings
  cardiac, thyroid          // sub-objects
}

interface Patient {
  admittedAt: string        // datetime-local input string
  patientNo: string
  chartDate: string         // datetime-local input string
  exam: { ...fields, examDate: string }
  imaging: { ...fields, imagingDate: string }
  labsSets: { admission: LabsSet; yesterday: LabsSet; today: LabsSet }
  // ... all other fields
}
```

### Action Summary

| Action | DB operation | Local effect |
|---|---|---|
| `loadWard()` | SELECT beds + active patients + events + meds | Replaces `beds[]` |
| `admit()` | INSERT patient (with `admitted_at`, `patient_no`) + INSERT event (with `occurred_at`) | Sets `bed.patient` |
| `discharge()` | UPDATE patient (discharged, bed_id) | Clears `bed.patient` |
| `addBed()` | INSERT bed | Pushes to `beds[]` |
| `removeBed()` | DELETE bed | Filters from `beds[]` |
| `addEvent()` | INSERT event (with custom `occurred_at`) | Unshifts into `patient.events` |
| `addMed()` | INSERT med (with custom `started` date) | Pushes to `patient.meds` |
| `medAction()` | UPDATE med (status + log) | Updates in place |
| `toggleMedEdit()` | UPDATE med (fields + log) on close | Toggles `med.editing` |
| `savePatient()` | UPDATE patient (all clinical fields + labsSets) | No local change needed |

### DB ↔ App Mapping

- **Reading:** `dbRowToPatient()` unpacks the DB row + embedded `events[]` + `meds[]` into the `Patient` TypeScript interface. Events are sorted descending by `occurred_at`. The `labs` JSONB is mapped into `labsSets.{ admission, yesterday, today }` via the `readLabsSet()` helper. Old flat-format labs data (from before the sub-tab restructure) is automatically migrated into the `admission` set.
- **Writing:** `patientToDbRow()` stores `labsSets` directly as the `labs` JSONB value. Datetime-local strings (`admittedAt`, `chartDate`) are converted to UTC ISO before writing; they are converted back to local input format on read using `isoToLocalInput()`.

### Date Handling Pattern

All datetime fields follow a consistent round-trip:

```
DB (UTC timestamptz ISO)
  ↕ isoToLocalInput()  /  new Date(localStr).toISOString()
App (datetime-local string "YYYY-MM-DDTHH:mm")
  ↕ fmtDbTimestamp(new Date(str).toISOString())
Display ("06 Jun 2026 · 21:19")
```

Helper functions live in `app/utils/format.ts` and are auto-imported globally.

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

### Completed in v1.1
- Timestamp pickers on all six clinical tabs (Chart, Exam, Labs, Imaging, Meds, Events)
- User-selectable admission date/time on admit sheet; editable from Chart tab
- Patient number field on admit sheet, patient details, patient header, and bed card
- Labs tab restructured into three independent time-point sets: On Admission / Yesterday / Today
- New Day rollover button (Today → Yesterday, clear Today, immediate save)
- Add Bed button hidden from UI

### Completed in v1.2
- **QR code bed access** — each physical bed has a printed QR code linking directly to its chart page; works with or without the PWA installed
- **Post-login redirect** — scanning a QR while logged out redirects to login and then back to the correct bed after sign-in
- **Direct-link ward loading** — `loadWard()` moved to the default layout so navigating directly to `/bed/[id]` (e.g. via QR scan) loads patient data correctly without visiting the home page first
- **Developer footer** — persistent footer on all pages linking to developer portfolio

### Near-term (v1.3)
- **Supabase Realtime** — push bed/patient changes to all open sessions so multiple staff see updates live without refresh.
- **Acuity-based sorting** — sort bed grid by criticality (critical first) with a toggle.
- **Print view** — CSS `@media print` layout for ward round handover sheets.

### Medium-term (v1.4)
- **Multi-ward support** — `ward_id` column, ward selector in AppBar.
- **Role-based access** — nurse vs. doctor vs. read-only viewer.
- **Offline write queue** — queue mutations when offline, flush on reconnect using Supabase's offline capabilities.

### Long-term
- **Audit trail** — immutable event log for every field change (who changed what and when).
- **Handover report generator** — auto-generate a structured PDF summary for shift handover.
- **Integration API** — webhook endpoints for HIS/EHR systems to push admission/discharge events into Mareedy automatically.
- **Push notifications** — alert on-call staff when a patient's status changes to critical.
