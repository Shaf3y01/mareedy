# Mareedy — Critical Care Ward (Nuxt 4 PWA)

A mobile-first bed & patient management app for a critical-care ward.
Vue 3 + Nuxt 4, installable as a PWA, bilingual **English / Arabic** with full
right-to-left support, minimum 9 beds.

This README is written for someone who has **not built a PWA before**. Follow it
top to bottom. Each step ends with a “✅ you should now see…” checkpoint so you
always know it worked before moving on.

> ⚠️ **Real patient data is sensitive.** This is a learning scaffold. Before you
> put any real person's medical information in it, read **§8 Going to
> production** — privacy law (HIPAA / GDPR / your local rules), proper access
> control, and backups are not optional for real clinical data.

---

## 0. How the pieces fit together (read this once)

A PWA is just a normal website that (a) is served over HTTPS, (b) ships a
**manifest** (name + icons) and a **service worker** (a tiny background script
that caches files), so phones let users “Add to Home Screen” and it opens
full-screen like an app. You don't build a separate iOS/Android app — the same
website *becomes* the app.

Your four layers:

| Layer | What it is | What we use |
|------|------------|-------------|
| **Frontend (FE)** | The screens you see | Nuxt 4 (Vue 3) + the PWA module |
| **Backend (BE)** | Logic + secure access to data | Supabase auto-API (+ Nuxt's built-in Nitro server for anything custom) |
| **Database (DB)** | Where patients/beds are stored | Supabase Postgres |
| **Hosting** | Puts it online with HTTPS | Vercel (free) |

The plan: get the **frontend running first** (on built-in demo data, no account
needed), then add the **database + backend + login**, then turn on **PWA
install**, then **deploy**.

---

## 1. Install your tools (once per computer)

1. **Node.js 20 or newer** — Nuxt 4 needs it.
   Get the “LTS” installer from <https://nodejs.org>. Then check in a terminal:
   ```bash
   node -v      # should print v20.x or higher
   ```
2. **VS Code** — the editor: <https://code.visualstudio.com>. Install the
   **Vue (Official)** extension for syntax help.
3. **A terminal** — on Mac use *Terminal*, on Windows use *PowerShell* (or the
   terminal built into VS Code: `View → Terminal`).
4. **A GitHub account** — <https://github.com> (needed for free hosting in §7).

---

## 2. Create the Nuxt 4 project

In your terminal, go to where you keep code and run:

```bash
npm create nuxt@latest mareedy
```

Pick these when asked: package manager **npm**, **TypeScript yes**, init a git
repo **yes**, and you can skip the optional modules (we add ours next). Then:

```bash
cd mareedy
npm run dev
```

Open <http://localhost:3000>.

✅ You should see the default Nuxt welcome page. Press `Ctrl+C` in the terminal
to stop the server when you want.

---

## 3. Add the modules this app uses

Stop the dev server (`Ctrl+C`) and install:

```bash
npm install @pinia/nuxt pinia        # app state (the "ward" store)
npm install @nuxtjs/i18n             # English/Arabic + RTL
npm install -D @vite-pwa/nuxt        # turns the app into a PWA
```

One line on each: **Pinia** holds the shared data (beds, patients) in one place;
**i18n** swaps languages and flips the layout to RTL for Arabic; **@vite-pwa/nuxt**
generates the manifest + service worker.

(We'll add Supabase in §5 — not yet, so the app can run with zero setup first.)

---

## 4. Drop in the app files → Frontend done

Copy everything from this scaffold **into your new `mareedy` folder**, letting it
**overwrite** `nuxt.config.ts` and `app/app.vue`:

```
app/            # all the screens, components, store, styles
i18n/           # English + Arabic text
public/         # PWA icons (already made for you)
server/         # an example API route
supabase/       # the database schema (used in §5)
nuxt.config.ts  # overwrite the generated one
.env.example
.gitignore
```

Then run it:

```bash
npm run dev
```

Open <http://localhost:3000>.

✅ You should see the **ward with 9 beds**. Tap an occupied bed to open the
patient chart, switch tabs (Chart / Exam / Labs / Imaging / Meds / Events),
tap the pencil to edit, tap **Add bed**, and use the **العربية** button
(top-right) to flip the whole UI to Arabic / RTL.

At this point the **frontend is complete**. It's running on built-in demo data
that lives only in memory — refresh and edits reset. Next we make it permanent.

> **Where things live** (so you can find them):
> `app/pages/index.vue` is the bed grid · `app/pages/bed/[id].vue` is the chart ·
> `app/components/` holds the UI pieces · `app/stores/ward.ts` is all the data +
> actions · `i18n/locales/` is the translations · `app/assets/css/main.css` is
> the styling.

---

## 5. Backend & Database (Supabase) → save data + log in

Supabase gives you a Postgres database, an auto-generated secure API, and login —
all on a free tier. (Note: free Supabase projects pause after ~1 week of
inactivity; you click to resume. Fine for learning, see §8 for real use.)

### 5a. Create the project
1. Sign up at <https://supabase.com> → **New project**. Pick a name and a strong
   database password (save it). Choose the region closest to your clinic.
2. When it's ready, go to **Project Settings → API** and copy two values:
   - **Project URL**
   - the **anon / public** key

### 5b. Connect it to Nuxt
1. Install the module:
   ```bash
   npm install @nuxtjs/supabase @supabase/supabase-js
   ```
2. Create a file named **`.env`** in the project root (copy `.env.example`) and
   paste your values:
   ```bash
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_KEY=your-anon-public-key
   ```
   The `.env` file is already git-ignored — never commit it.
3. In `nuxt.config.ts`, **uncomment** the two Supabase lines:
   - add `'@nuxtjs/supabase'` to `modules`
   - uncomment the `supabase: { redirect: false }` block

### 5c. Create the tables
In Supabase, open **SQL Editor → New query**, paste the entire contents of
`supabase/schema.sql`, and click **Run**. This creates the `beds`, `patients`,
`events`, and `meds` tables, turns on Row Level Security (only logged-in users
can touch data), and seeds beds 1–9.

✅ Under **Table Editor** you should now see four tables and 9 rows in `beds`.

### 5d. Turn on login
1. In Supabase: **Authentication → Providers → Email** → make sure it's enabled.
   For easy testing, turn **off** “Confirm email” for now (turn it back on for
   real use).
2. Create `app/pages/login.vue`:
   ```vue
   <script setup lang="ts">
   const supabase = useSupabaseClient()
   const email = ref('')
   const password = ref('')
   const msg = ref('')

   async function signIn() {
     const { error } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
     msg.value = error ? error.message : ''
     if (!error) navigateTo('/')
   }
   async function signUp() {
     const { error } = await supabase.auth.signUp({ email: email.value, password: password.value })
     msg.value = error ? error.message : 'Account created — you can sign in now.'
   }
   </script>

   <template>
     <main class="screen" style="max-width:380px">
       <div class="panel">
         <h3>Sign in</h3>
         <div class="form-grid">
           <div><span class="lab">Email</span><input v-model="email" class="in" type="email" /></div>
           <div><span class="lab">Password</span><input v-model="password" class="in" type="password" /></div>
           <p v-if="msg" style="color:var(--crit);font-size:13px;margin:0">{{ msg }}</p>
           <div class="sheet-actions">
             <button class="btn-ghost btn" type="button" @click="signUp">Create account</button>
             <button class="btn" type="button" @click="signIn">Sign in</button>
           </div>
         </div>
       </div>
     </main>
   </template>
   ```
3. Protect the app so only logged-in staff get in. The Supabase module can do
   this for you — set this in `nuxt.config.ts`:
   ```ts
   supabase: {
     redirect: true,
     redirectOptions: {
       login: '/login',
       callback: '/confirm',
       exclude: ['/login'],
     },
   },
   ```
   Now any not-logged-in visitor is bounced to `/login`. Add a sign-out button
   anywhere with:
   ```ts
   const supabase = useSupabaseClient()
   await supabase.auth.signOut()
   ```

### 5e. Save data to the database
The store (`app/stores/ward.ts`) currently keeps everything in memory. Each
action has a `// 🔌 SUPABASE:` comment showing where a database call goes. The
pattern is always the same — call the Supabase client, then update local state:

```ts
const supabase = useSupabaseClient()

// READ on first load (replace the seed):
const { data: beds } = await supabase.from('beds').select('id').order('id')
const { data: patients } = await supabase
  .from('patients').select('*, events(*), meds(*)').eq('discharged', false)

// CREATE (admit): insert a patient row linked to the bed
await supabase.from('patients').insert({ bed_id: bedId, name, age, sex, status })

// UPDATE (e.g. discharge): free the bed
await supabase.from('patients').update({ discharged: true, bed_id: null }).eq('id', patientId)

// CREATE a child row (event): it's auto-dated by the DB default
await supabase.from('events').insert({ patient_id: patientId, body: text })
```

Two practical tips:
- The grouped clinical fields (`exam`, `imaging`, `labs`, `balance`) are stored
  as JSON columns, so you can save the whole nested object in one go:
  `supabase.from('patients').update({ labs: patient.labs }).eq('id', id)`.
- Save edits when the user leaves the edit mode (a “Save” button), rather than
  on every keystroke.

Convert one action first (e.g. `addEvent`), confirm the row appears in Supabase's
Table Editor, then do the rest the same way.

✅ Add an event, refresh the page — it's still there. Your **backend + database**
are live.

> Want multiple staff to see changes live? Supabase **Realtime** can push row
> changes to every open device — a nice later upgrade.

---

## 6. Make it a real PWA (installable + offline)

Good news: the PWA module is **already configured** in `nuxt.config.ts` (the
`pwa: { … }` block) and the icons are in `public/`. You don't need to write
service-worker code — it's generated for you.

The service worker is intentionally **off in `npm run dev`** (so caching doesn't
confuse you while coding). To see the real PWA you must do a production build:

```bash
npm run build
npm run preview
```

Open the preview URL (usually <http://localhost:3000>) **in Chrome**:
- Look in the address bar for an **install icon** (⊕ / “Install Mareedy”), or
  menu → *Install app*. Install it — it opens in its own window.
- Open DevTools → **Application → Manifest** to see your name + icons, and
  **Application → Service Workers** to confirm one is registered.

On a **phone** you'll test this after deploying (§7), because install needs
HTTPS, which `localhost` fakes for you but your phone won't.

What you get: `registerType: 'autoUpdate'` means when you deploy a new version,
installed apps quietly update themselves. Files are cached, so it opens instantly
and tolerates a flaky connection. (Live database calls still need the network —
caching is for the app shell, not patient data.)

✅ You installed Mareedy as a desktop app and saw the service worker registered.

---

## 7. Put it online for free (Vercel)

PWAs must be served over HTTPS. Vercel does this automatically and detects Nuxt
with near-zero config.

1. **Push your code to GitHub.** In the project folder:
   ```bash
   git add .
   git commit -m "Mareedy app"
   ```
   Create an empty repo on GitHub, then follow its “push an existing repository”
   commands (it shows them). Double-check your `.env` is **not** listed —
   `.gitignore` keeps it out.
2. Go to <https://vercel.com>, sign in with GitHub, **Add New → Project**, and
   import your `mareedy` repo. Vercel auto-detects Nuxt — leave the build
   settings as-is.
3. Add your secrets: in the import screen (or **Project → Settings → Environment
   Variables**) add `SUPABASE_URL` and `SUPABASE_KEY` with the same values from
   your `.env`.
4. Click **Deploy**. After a minute you get a public `https://…vercel.app` URL.
5. Open that URL **on your phone**, then use the browser menu:
   - **iPhone (Safari):** Share → **Add to Home Screen**.
   - **Android (Chrome):** menu → **Install app / Add to Home Screen**.

✅ Mareedy is on your phone's home screen, full-screen, over HTTPS. Every time
you `git push`, Vercel rebuilds and the installed app updates itself.

> Netlify and Cloudflare Pages work the same way (connect GitHub → set the two
> env vars → deploy) if you prefer one of those.

---

## 8. Going to production (don't skip for real patient data)

This scaffold is built to *learn*. Before storing real medical records:

- **Compliance:** patient data is regulated (HIPAA in the US, GDPR in the EU,
  and your country's own health-data law). You likely need a signed agreement
  with your hosting/database provider (e.g. a BAA) and may not be allowed to use
  free tiers. Check before going live.
- **Tighten access:** the included RLS policies let *any* logged-in user read/
  write *everything*. For real use, scope rows to a clinic/team and limit by
  role, and re-enable email confirmation.
- **Backups & uptime:** free Supabase projects pause when idle and have limited
  backups. A real deployment needs a paid plan with automated backups.
- **Auth hardening:** strong password rules or SSO, and a proper sign-out.
- **Translation review:** the Arabic strings in `i18n/locales/ar.ts` are a
  working starting point. Have the clinical terms checked by a clinician or
  professional medical translator. The lab abbreviations (pH, Hb, Na⁺…) are
  universal and left as-is on purpose.

---

## Troubleshooting

- **`npm install` complains about versions / peer deps.** Delete
  `package-lock.json` and `node_modules`, then re-run the install commands in
  §3 (and §5b) to pull current compatible versions. As an alternative to
  `npm install <module>`, `npx nuxi module add <module>` installs *and* wires it
  into the config for you.
- **App won't start after adding Supabase** with “supabase URL/KEY missing.”
  Your `.env` isn't being read — confirm the file is named exactly `.env`, sits
  in the project root, and you restarted `npm run dev`.
- **PWA won't install / no install icon.** You're on `npm run dev` (service
  worker is off there). Use `npm run build && npm run preview`, and use Chrome.
- **Arabic doesn't flip to RTL.** Make sure you copied `app/app.vue` from the
  scaffold (it sets `<html dir>` from the locale) and that the `ar` locale in
  `nuxt.config.ts` has `dir: 'rtl'`.
- **Edits don't persist.** Until §5e is done, data is in-memory by design —
  refreshing resets it.

---

Built with Nuxt 4 · Pinia · @nuxtjs/i18n · @vite-pwa/nuxt · Supabase.
