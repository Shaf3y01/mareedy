// Example server route. Visit /api/health while `npm run dev` is running.
// Nuxt ships a backend server (Nitro) — anything in server/api/ becomes an
// endpoint. Later you can add privileged routes here that talk to Supabase
// with the service-role key (which must NEVER be exposed to the browser).
export default defineEventHandler(() => {
  return { status: 'ok', app: 'mareedy', time: new Date().toISOString() }
})
