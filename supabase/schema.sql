-- ============================================================
--  Mareedy database schema  (Supabase / PostgreSQL)
--  Paste this whole file into Supabase → SQL Editor → Run.
--  It creates the tables that mirror the app's data model and
--  turns on Row Level Security so only logged-in staff can read/write.
-- ============================================================

-- 1) BEDS ----------------------------------------------------
create table if not exists beds (
  id          int primary key,
  created_at  timestamptz not null default now()
);

-- 2) PATIENTS ------------------------------------------------
-- Simple fields are columns; grouped clinical data is stored as JSONB
-- (exam, imaging, labs, balance) to match the shape used in the app.
create table if not exists patients (
  id              uuid primary key default gen_random_uuid(),
  bed_id          int references beds (id),         -- current bed (null once discharged)
  patient_no      text default '',
  name            text not null default '',
  age             text default '',
  sex             text default 'F',
  pmhx            text default '',
  allergies       text default '',
  habits          text default '',
  conscious       text default '',
  bp              text default '',
  hr              text default '',
  spo2            text default '',
  o2mode          text default 'Room Air',
  temp            text default '',
  rr              text default '',
  status          text default 'stable',            -- stable | watch | critical
  exam            jsonb default '{}'::jsonb,         -- { appearance, cvs, chest, abdomen, limbs, neuro }
  imaging         jsonb default '{}'::jsonb,         -- { ctChest, ctBrain, xray, paus }
  ultrasound      text default '',
  endoscopy       text default '',
  labs            jsonb default '{}'::jsonb,         -- { abg, cbc, renal, lytes, liver, bili, inr, crp, cardiac, thyroid, hba1c }
  balance         jsonb default '{}'::jsonb,         -- { sign, value }
  recommendations text default '',
  admitted_at     timestamptz not null default now(),
  chart_date      timestamptz,
  discharged      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists patients_bed_idx on patients (bed_id) where discharged = false;

-- 3) EVENTS (one patient → many events) ----------------------
create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references patients (id) on delete cascade,
  occurred_at timestamptz not null default now(),
  body        text not null default ''
);
create index if not exists events_patient_idx on events (patient_id);

-- 4) MEDICATIONS (one patient → many meds) -------------------
create table if not exists meds (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references patients (id) on delete cascade,
  name        text not null default '',
  dose        text default '',
  route       text default 'PO',
  freq        text default '',
  started     date default now(),
  status      text default 'active',                -- active | escalated | de-escalated | discontinued
  log         jsonb default '[]'::jsonb,            -- [ { date, text }, ... ]
  created_at  timestamptz not null default now()
);
create index if not exists meds_patient_idx on meds (patient_id);

-- ============================================================
--  Row Level Security
--  Below: any *logged-in* user can read & write. That's fine for a
--  small single-clinic tool. For multi-clinic / stricter access you
--  would scope rows by team/clinic id and tighten these policies.
-- ============================================================
alter table beds     enable row level security;
alter table patients enable row level security;
alter table events   enable row level security;
alter table meds     enable row level security;

create policy "auth read beds"     on beds     for select using (auth.role() = 'authenticated');
create policy "auth write beds"    on beds     for all    using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth read patients" on patients for select using (auth.role() = 'authenticated');
create policy "auth write patients" on patients for all   using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth read events"   on events   for select using (auth.role() = 'authenticated');
create policy "auth write events"  on events   for all    using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth read meds"     on meds     for select using (auth.role() = 'authenticated');
create policy "auth write meds"    on meds     for all    using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 5) Seed the 9 starting beds --------------------------------
insert into beds (id)
select g from generate_series(1, 9) as g
on conflict (id) do nothing;
