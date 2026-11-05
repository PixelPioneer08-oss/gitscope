import type { GHEvent } from '@/lib/github'
import { num } from '@/lib/format'

export const HEAT_WEEKS = 20

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Commits count for pushes (when GitHub still includes them), 1 for every other event. */
export function eventWeight(e: GHEvent) {
  if (e.type !== 'PushEvent') return 1
  const p = e.payload || {}
  const n = p.distinct_size ?? p.size ?? (Array.isArray(p.commits) ? p.commits.length : null)
  return n && n > 0 ? n : 1
}

export function Heatmap({ events }: { events: GHEvent[] }) {
  const counts: Record<string, number> = {}
  let commits = 0
  events.forEach((e) => {
    const k = dayKey(new Date(e.created_at))
    const w = eventWeight(e)
    counts[k] = (counts[k] || 0) + w
    if (e.type === 'PushEvent') commits += w
  })
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(today)
  start.setDate(start.getDate() - start.getDay() - (HEAT_WEEKS - 1) * 7)

  const cell = 12
  const step = cell + 3
  const left = 28
  const top = 16
  const vals = Object.values(counts)
  const max = Math.max(0, ...vals)
  const level = (v: number) => (!v ? 0 : max <= 4 ? Math.min(v, 4) : v <= max * 0.25 ? 1 : v <= max * 0.5 ? 2 : v <= max * 0.75 ? 3 : 4)

  const rects: JSX.Element[] = []
  const months: JSX.Element[] = []
  let lastMonth = -1
  let lastMonthWeek = -9
  let activeDays = 0
  let best: { v: number; dt: Date } | null = null

  for (let w = 0; w < HEAT_WEEKS; w++) {
    for (let d = 0; d < 7; d++) {
      const dt = new Date(start)
      dt.setDate(start.getDate() + w * 7 + d)
      if (dt > today) continue
      const v = counts[dayKey(dt)] || 0
      if (v) {
        activeDays++
        if (!best || v > best.v) best = { v, dt }
      }
      if (d === 0 && dt.getMonth() !== lastMonth) {
        lastMonth = dt.getMonth()
        if (w < HEAT_WEEKS - 1 && w - lastMonthWeek >= 3) {
          lastMonthWeek = w
          months.push(
            <text key={`m${w}`} x={left + w * step} y={10}>
              {dt.toLocaleDateString(undefined, { month: 'short' })}
            </text>,
          )
        }
      }
      rects.push(
        <rect key={`${w}-${d}`} x={left + w * step} y={top + d * step} width={cell} height={cell} rx={2.5} fill={`hsl(var(--heat-${level(v)}))`}>
          <title>
            {v ? `${v} contribution${v === 1 ? '' : 's'}` : 'No contributions'} on{' '}
            {dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </title>
        </rect>,
      )
    }
  }
  const W = left + HEAT_WEEKS * step
  const H = top + 7 * step
  const total = vals.reduce((s, v) => s + v, 0)

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
        <span>
          <b className="tabular-nums">{num(total)}</b> <span className="text-muted-foreground">contributions</span>
        </span>
        <span>
          <b className="tabular-nums">{num(commits)}</b> <span className="text-muted-foreground">commits pushed</span>
        </span>
        <span>
          <b className="tabular-nums">{activeDays}</b> <span className="text-muted-foreground">active days</span>
        </span>
        {best && (
          <span>
            <span className="text-muted-foreground">Busiest:</span> <b>{best.dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</b>{' '}
            <span className="text-muted-foreground">({best.v})</span>
          </span>
        )}
      </div>
      <div className="overflow-x-auto pb-1">
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Contribution heatmap: ${total} contributions in the last ${HEAT_WEEKS} weeks`}
          className="fill-muted-foreground text-[10px]"
        >
          {months}
          {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((l, i) =>
            l ? (
              <text key={l} x={0} y={top + i * step + 10}>
                {l}
              </text>
            ) : null,
          )}
          {rects}
        </svg>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-[11.5px] text-muted-foreground">
        Less
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: `hsl(var(--heat-${l}))` }} />
        ))}
        More
      </div>
      {!events.length && <p className="mt-2 text-sm text-muted-foreground">No public activity in the last 90 days.</p>}
    </div>
  )
}
