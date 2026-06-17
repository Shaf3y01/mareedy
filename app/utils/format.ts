// Auto-imported by Nuxt (anything in app/utils/ is globally available).

/** "06 Jun 2026 · 14:30" — used for event timestamps. */
export function fmtNow(): string {
  const d = new Date()
  return (
    d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  )
}

/** "06 Jun 2026" — used for medication start / action dates. */
export function fmtToday(): string {
  return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Tiny unique id — kept for blankPatient() compatibility before a DB row exists. */
export function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

/** Format a DB timestamptz ISO string to "06 Jun 2026 · 14:30". */
export function fmtDbTimestamp(iso: string): string {
  const d = new Date(iso)
  return (
    d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  )
}

/** Format a DB date string "2026-06-06" to "06 Jun 2026". */
export function fmtDbDay(iso: string): string {
  if (!iso) return fmtToday()
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

/** Convert a UTC ISO string to "YYYY-MM-DDTHH:mm" local time — for binding to datetime-local inputs. */
export function isoToLocalInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Current local datetime as "YYYY-MM-DDTHH:mm" — value for datetime-local inputs. */
export function localNow(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Current local date as "YYYY-MM-DD" — value for date inputs. */
export function localToday(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
