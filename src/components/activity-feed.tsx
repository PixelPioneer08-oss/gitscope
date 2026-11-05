import { useMemo } from 'react'
import { AlertTriangle, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StateBlock } from '@/components/states'
import { describeEvent, EVENT_CATEGORIES, type EventCategory } from '@/lib/events'
import type { GHEvent, GitHubError } from '@/lib/github'
import { ago } from '@/lib/format'

interface Props {
  login: string
  events: GHEvent[]
  error: GitHubError | null
  filter: EventCategory | 'all'
  onFilter: (f: EventCategory | 'all') => void
}

export function ActivityFeed({ login, events, error, filter, onFilter }: Props) {
  const described = useMemo(() => events.map((e) => ({ e, d: describeEvent(e) })), [events])
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: described.length }
    described.forEach(({ d }) => (c[d.cat] = (c[d.cat] || 0) + 1))
    return c
  }, [described])

  if (error)
    return (
      <StateBlock icon={AlertTriangle} tone="error" title="Activity unavailable">
        {error.message}
      </StateBlock>
    )

  const items = described.filter((x) => filter === 'all' || x.d.cat === filter).slice(0, 150)

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Filter activity">
        {EVENT_CATEGORIES.filter(([k]) => k === 'all' || counts[k]).map(([k, label]) => (
          <Button
            key={k}
            size="sm"
            variant={filter === k ? 'default' : 'outline'}
            className="rounded-full"
            aria-pressed={filter === k}
            onClick={() => onFilter(k)}
          >
            {label}
            <span className="font-mono text-[11px] opacity-60">{counts[k] || 0}</span>
          </Button>
        ))}
      </div>
      <Card>
        {items.length ? (
          <ul className="divide-y px-5">
            {items.map(({ e, d }) => {
              const Icon = d.icon
              return (
                <li key={e.id} className="grid grid-cols-[32px_minmax(0,1fr)_auto] gap-3 py-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="break-words text-[13.5px]">{d.text}</div>
                    {!!d.commits?.length && (
                      <ul className="mt-1.5 grid gap-1">
                        {d.commits.map((c) => (
                          <li key={c.sha} className="flex min-w-0 gap-2 text-[12.5px] text-muted-foreground">
                            <a
                              href={`https://github.com/${e.repo.name}/commit/${c.sha}`}
                              target="_blank"
                              rel="noopener"
                              className="shrink-0 rounded bg-muted px-1.5 font-mono text-xs hover:underline"
                            >
                              {c.sha.slice(0, 7)}
                            </a>
                            <span className="truncate">{c.message}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <time dateTime={e.created_at} title={new Date(e.created_at).toLocaleString()} className="whitespace-nowrap text-xs text-muted-foreground">
                    {ago(e.created_at)}
                  </time>
                </li>
              )
            })}
          </ul>
        ) : (
          <StateBlock bare icon={History} title="No recent public activity">
            {events.length ? 'Nothing of this kind in the last 90 days.' : `${login} has no public events in the last 90 days.`}
          </StateBlock>
        )}
      </Card>
    </div>
  )
}
