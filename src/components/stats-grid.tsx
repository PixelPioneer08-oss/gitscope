import { BookMarked, CircleDot, Eye, GitFork, Star, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { GHRepo, GHUser } from '@/lib/github'
import { compact, num } from '@/lib/format'

export function aggregate(repos: GHRepo[]) {
  const sum = (k: 'stargazers_count' | 'forks_count' | 'watchers_count' | 'open_issues_count') => repos.reduce((a, r) => a + (r[k] || 0), 0)
  const langs: Record<string, number> = {}
  repos.forEach((r) => {
    if (r.language) langs[r.language] = (langs[r.language] || 0) + 1
  })
  return {
    stars: sum('stargazers_count'),
    forks: sum('forks_count'),
    watchers: sum('watchers_count'),
    issues: sum('open_issues_count'),
    langs: Object.entries(langs).sort((a, b) => b[1] - a[1]),
  }
}

function Stat({ label, icon: Icon, value, hint }: { label: string; icon: LucideIcon; value: number; hint: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between text-[12.5px] font-medium text-muted-foreground">
        <span>{label}</span>
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums tracking-tight" title={num(value)}>
        {compact(value)}
      </div>
      <div className="text-[11.5px] text-muted-foreground">{hint}</div>
    </Card>
  )
}

export function StatsGrid({ user, repos, truncated }: { user: GHUser; repos: GHRepo[]; truncated: boolean }) {
  const a = aggregate(repos)
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <Stat label="Total stars" icon={Star} value={a.stars} hint={truncated ? `first ${repos.length} of ${num(user.public_repos)} repos` : 'across public repos'} />
      <Stat label="Forks" icon={GitFork} value={a.forks} hint="of their repos" />
      <Stat label="Watchers" icon={Eye} value={a.watchers} hint="as reported by repo list" />
      <Stat label="Open issues" icon={CircleDot} value={a.issues} hint="incl. pull requests" />
      <Stat label="Public repos" icon={BookMarked} value={user.public_repos} hint={`${num(user.public_gists)} gists`} />
      <Stat label="Followers" icon={Users} value={user.followers} hint={`following ${compact(user.following)}`} />
    </div>
  )
}
