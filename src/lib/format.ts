const nf = new Intl.NumberFormat()
const cf = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 })
const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

export const num = (n: number) => nf.format(n)
export const compact = (n: number) => (n >= 10000 ? cf.format(n) : nf.format(n))

export function ago(iso: string) {
  const d = (new Date(iso).getTime() - Date.now()) / 1000
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [u, s] of units) if (Math.abs(d) >= s) return rtf.format(Math.round(d / s), u)
  return 'just now'
}

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
