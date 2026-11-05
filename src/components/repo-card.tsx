import { BookMarked, Clock, GitFork, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { GHRepo } from '@/lib/github'
import { ago, compact } from '@/lib/format'
import { langColor } from '@/lib/languages'

export function RepoCard({ repo, onOpen }: { repo: GHRepo; onOpen: (r: GHRepo) => void }) {
  const topics = (repo.topics || []).slice(0, 4)
  return (
    <button
      onClick={() => onOpen(repo)}
      aria-label={`Open ${repo.name} details`}
      className="flex min-w-0 flex-col gap-2 rounded-xl border bg-card p-4 text-left shadow-sm transition-colors hover:border-ring/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex min-w-0 items-center gap-2">
        <BookMarked className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="truncate font-semibold text-chart-1">{repo.name}</span>
        {repo.fork && <Badge variant="outline">Fork</Badge>}
        {repo.archived && <Badge variant="outline">Archived</Badge>}
      </div>
      <p className={`line-clamp-2 text-[13px] text-muted-foreground ${repo.description ? '' : 'italic'}`}>{repo.description || 'No description'}</p>
      {topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {topics.map((t) => (
            <Badge key={t} variant="topic">
              {t}
            </Badge>
          ))}
        </div>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[12.5px] text-muted-foreground [&_svg]:h-3.5 [&_svg]:w-3.5">
        {repo.language && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: langColor(repo.language) }} />
            {repo.language}
          </span>
        )}
        <span className="inline-flex items-center gap-1" title="Stars">
          <Star aria-hidden="true" />
          <span className="tabular-nums">{compact(repo.stargazers_count)}</span>
        </span>
        <span className="inline-flex items-center gap-1" title="Forks">
          <GitFork aria-hidden="true" />
          <span className="tabular-nums">{compact(repo.forks_count)}</span>
        </span>
        <span className="inline-flex items-center gap-1" title="Last push">
          <Clock aria-hidden="true" />
          {repo.pushed_at ? ago(repo.pushed_at) : 'never pushed'}
        </span>
      </div>
    </button>
  )
}
