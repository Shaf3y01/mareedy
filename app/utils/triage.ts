// Auto-imported by Nuxt. Pure helpers for triage colours + vitals alerts.

export type Acuity = 'stable' | 'watch' | 'critical'

/** Maps an acuity to the pill colour class used in the design system. */
export function acuityPill(status: string): string {
  return status === 'critical' ? 'p-critical' : status === 'watch' ? 'p-watch' : 'p-stable'
}

/** Maps an acuity to the bed-card left-stripe class. */
export function acuityStripe(status: string): string {
  return 's-' + (status || 'stable')
}

/**
 * Visual-only flag for a vital sign. Returns '', 'warn', or 'alert'.
 * These thresholds are illustrative for the demo — NOT clinical guidance.
 */
export function vitalClass(metric: string, val: string | number | null | undefined): string {
  if (val === '' || val == null) return ''
  const n = parseFloat(String(val).split('/')[0])
  if (Number.isNaN(n)) return ''
  switch (metric) {
    case 'spo2': return n < 92 ? 'alert' : n < 95 ? 'warn' : ''
    case 'hr':   return n > 110 || n < 50 ? 'alert' : n > 100 ? 'warn' : ''
    case 'temp': return n >= 38.5 ? 'alert' : n >= 37.8 ? 'warn' : ''
    case 'rr':   return n >= 25 ? 'alert' : n >= 21 ? 'warn' : ''
    case 'bp':   return n < 90 ? 'alert' : n < 100 ? 'warn' : ''
    default:     return ''
  }
}
