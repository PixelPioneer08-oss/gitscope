import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Heatmap, HEAT_WEEKS } from '@/components/heatmap'
import { LanguageDonut, StarsChart } from '@/components/charts'
import { RepoCard } from '@/components/repo-card'
import { aggregate } from '@/components/stats-grid'
import type { GHEvent, GHRepo, GitHubError } from '@/lib/github'

interface Props {
  repos: GHRepo[]
  events: GHEvent[]
  eventsError: GitHubError | null
  reposError: GitHubError | null
  onOpenRepo: (r: GHRepo) => void
  onSeeAll: () => void
}

export function Overview({ repos, events, eventsError, reposError, onOpenRepo, onSeeAll }: Props) {
  const { langs } = aggregate(repos)
  const own = [...repos].filter((r) => !r.fork).sort((a, b) => b.stargazers_count - a.stargazers_count)
  const highlights = (own.length ? own : repos).slice(0, 4)

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Contribution activity</CardTitle>
          <CardDescription>Public events over the last {HEAT_WEEKS} weeks. GitHub only exposes about 90 days of events.</CardDescription>
        </CardHeader>
        <CardContent>
          {eventsError ? <p className="text-sm text-muted-foreground">Activity could not be loaded ({eventsError.message}).</p> : <Heatmap events={events} />}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Languages</CardTitle>
            <CardDescription>Primary language, by number of repositories</CardDescription>
          </CardHeader>
          <CardContent>
            {langs.length ? <LanguageDonut langs={langs} /> : <p className="text-sm text-muted-foreground">No language data for these repositories.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Most starred</CardTitle>
            <CardDescription>Top repositories by stars. Click a bar to open it.</CardDescription>
          </CardHeader>
          <CardContent>
            {repos.length ? <StarsChart repos={repos} onOpen={onOpenRepo} /> : <p className="text-sm text-muted-foreground">No public repositories yet.</p>}
          </CardContent>
        </Card>
      </div>

      {highlights.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Top repositories</h2>
            <Button variant="ghost" size="sm" onClick={onSeeAll}>
              See all {repos.length}
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {highlights.map((r) => (
              <RepoCard key={r.id} repo={r} onOpen={onOpenRepo} />
            ))}
          </div>
        </section>
      )}
      {reposError && <p className="text-sm text-muted-foreground">Repositories could not be loaded ({reposError.message}).</p>}
    </div>
  )
}
