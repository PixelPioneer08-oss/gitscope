import { useMemo } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RepoCard } from '@/components/repo-card'
import { StateBlock } from '@/components/states'
import type { GHRepo, GHUser } from '@/lib/github'
import { num } from '@/lib/format'

export type SortKey = 'stars' | 'updated' | 'name'
export interface RepoFilters {
  q: string
  sort: SortKey
  lang: string
  hideForks: boolean
}
export const DEFAULT_FILTERS: RepoFilters = { q: '', sort: 'stars', lang: 'all', hideForks: false }

interface Props {
  user: GHUser
  repos: GHRepo[]
  truncated: boolean
  filters: RepoFilters
  onFilters: (f: RepoFilters) => void
  onOpen: (r: GHRepo) => void
}

const sorters: Record<SortKey, (a: GHRepo, b: GHRepo) => number> = {
  stars: (a, b) => b.stargazers_count - a.stargazers_count || a.name.localeCompare(b.name),
  updated: (a, b) => new Date(b.pushed_at || 0).getTime() - new Date(a.pushed_at || 0).getTime(),
  name: (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
}

export function RepoBrowser({ user, repos, truncated, filters, onFilters, onOpen }: Props) {
  const langs = useMemo(() => [...new Set(repos.map((r) => r.language).filter(Boolean) as string[])].sort(), [repos])
  const list = useMemo(() => {
    const q = filters.q.trim().toLowerCase()
    return repos
      .filter(
        (r) =>
          (filters.lang === 'all' || r.language === filters.lang) &&
          (!filters.hideForks || !r.fork) &&
          (!q ||
            r.name.toLowerCase().includes(q) ||
            (r.description || '').toLowerCase().includes(q) ||
            (r.topics || []).some((t) => t.includes(q))),
      )
      .sort(sorters[filters.sort])
  }, [repos, filters])
  const set = (patch: Partial<RepoFilters>) => onFilters({ ...filters, ...patch })

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="relative min-w-[200px] flex-1">
          <span className="sr-only">Find a repository</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={filters.q} onChange={(e) => set({ q: e.target.value })} type="search" placeholder="Find a repository…" className="pl-9" />
        </label>
        <Select value={filters.sort} onValueChange={(v) => set({ sort: v as SortKey })}>
          <SelectTrigger className="w-[160px]" aria-label="Sort repositories">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stars">Most stars</SelectItem>
            <SelectItem value="updated">Recently pushed</SelectItem>
            <SelectItem value="name">Name A–Z</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.lang} onValueChange={(v) => set({ lang: v })}>
          <SelectTrigger className="w-[170px]" aria-label="Filter by language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All languages</SelectItem>
            {langs.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex cursor-pointer select-none items-center gap-2 text-[13px]">
          <Checkbox checked={filters.hideForks} onCheckedChange={(c) => set({ hideForks: c === true })} />
          Hide forks
        </label>
      </div>
      <p className="mb-3 text-[12.5px] text-muted-foreground" aria-live="polite">
        Showing {list.length} of {repos.length} repositories
        {truncated && ` (the first ${repos.length} of ${num(user.public_repos)} were loaded)`}
      </p>
      {list.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((r) => (
            <RepoCard key={r.id} repo={r} onOpen={onOpen} />
          ))}
        </div>
      ) : (
        <StateBlock
          icon={Search}
          title={repos.length ? 'No repositories match' : 'No public repositories'}
          actions={
            repos.length ? (
              <Button variant="outline" size="sm" onClick={() => onFilters({ ...DEFAULT_FILTERS, sort: filters.sort })}>
                Clear filters
              </Button>
            ) : undefined
          }
        >
          {repos.length ? 'Try a different keyword, or clear the language and fork filters.' : `${user.login} hasn’t published any repositories yet.`}
        </StateBlock>
      )}
    </div>
  )
}
