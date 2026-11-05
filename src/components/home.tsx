import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { RecentEntry } from '@/hooks/use-recent'

export const EXPLORE: [string, string][] = [
  ['torvalds', 'Creator of Linux and Git'],
  ['gaearon', 'React core, co-created Redux'],
  ['yyx990803', 'Creator of Vue.js and Vite'],
  ['sindresorhus', 'Prolific open-source maintainer'],
  ['karpathy', 'AI researcher, nanoGPT'],
  ['tj', 'Express, Koa and many Node libs'],
  ['kentcdodds', 'Testing Library, educator'],
  ['microsoft', 'Organization account'],
]

const FEATURES = [
  ['Profile and stats', 'Bio, links, followers and totals for stars, forks and open issues across every public repo.'],
  ['Repository browser', 'Search, sort and filter by language. Open any repo to read its README.'],
  ['Activity and heatmap', 'Pushes, pull requests, issues, stars and releases from the last 90 days of public events.'],
  ['Shareable links', 'Every profile has a link like ?user=torvalds that you can send to someone.'],
]

function SectionLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 mt-9 flex items-center justify-between gap-2">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</h2>
      {action}
    </div>
  )
}

export function Home({ recent, onPick, onClearRecent }: { recent: RecentEntry[]; onPick: (l: string) => void; onClearRecent: () => void }) {
  return (
    <div>
      <section className="max-w-2xl space-y-3 pt-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Look inside any GitHub profile</h1>
        <p className="max-w-[60ch] text-[15.5px] text-muted-foreground">
          Type a username to see their repositories, star totals, language mix, recent public activity and a contribution heatmap, all pulled live
          from GitHub.
        </p>
      </section>

      {recent.length > 0 && (
        <>
          <SectionLabel
            action={
              <Button variant="ghost" size="sm" onClick={onClearRecent}>
                <Trash2 /> Clear
              </Button>
            }
          >
            Recent searches
          </SectionLabel>
          <div className="flex flex-wrap gap-2">
            {recent.map((r) => (
              <Button key={r.login} variant="outline" size="sm" className="rounded-full" onClick={() => onPick(r.login)}>
                <img src={`${r.avatar}&s=40`} alt="" className="h-4 w-4 rounded-full" loading="lazy" />
                {r.login}
              </Button>
            ))}
          </div>
        </>
      )}

      <SectionLabel>Try a notable profile</SectionLabel>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3">
        {EXPLORE.map(([login, desc]) => (
          <button
            key={login}
            onClick={() => onPick(login)}
            className="group flex items-center gap-3 rounded-xl border bg-card p-3 text-left shadow-sm transition hover:-translate-y-px hover:border-ring/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <img src={`https://github.com/${login}.png?size=80`} alt="" className="h-10 w-10 shrink-0 rounded-full bg-muted" loading="lazy" />
            <span className="min-w-0">
              <span className="block font-semibold">{login}</span>
              <span className="block truncate text-[12.5px] text-muted-foreground">{desc}</span>
            </span>
          </button>
        ))}
      </div>

      <SectionLabel>What you get</SectionLabel>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
        {FEATURES.map(([t, d]) => (
          <Card key={t} className="p-4">
            <h3 className="mb-1 text-sm font-semibold">{t}</h3>
            <p className="text-[13px] text-muted-foreground">{d}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
