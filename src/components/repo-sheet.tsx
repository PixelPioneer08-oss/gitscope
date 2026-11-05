import { useEffect, useState } from 'react'
import { BookOpen, ExternalLink, Link as LinkIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchReadmeHtml, fetchRepoDetail, GitHubError, type GHRepo } from '@/lib/github'
import { ago, fmtDate, num } from '@/lib/format'
import { langColor } from '@/lib/languages'
import { prepareReadme } from '@/lib/sanitize'

type Readme = { state: 'loading' } | { state: 'ready'; html: string } | { state: 'error'; message: string }

export function RepoSheet({ repo, onClose }: { repo: GHRepo | null; onClose: () => void }) {
  const [watchers, setWatchers] = useState<number | null>(null)
  const [readme, setReadme] = useState<Readme>({ state: 'loading' })

  useEffect(() => {
    if (!repo) return
    let cancelled = false
    setWatchers(null)
    setReadme({ state: 'loading' })
    // Real watcher counts only come from the single-repo endpoint.
    fetchRepoDetail(repo.full_name)
      .then((d) => !cancelled && setWatchers(d.subscribers_count ?? repo.watchers_count))
      .catch(() => !cancelled && setWatchers(repo.watchers_count))
    fetchReadmeHtml(repo.full_name)
      .then((html) => !cancelled && setReadme({ state: 'ready', html: prepareReadme(html, repo.full_name, repo.default_branch) }))
      .catch((e: unknown) => {
        if (cancelled) return
        const kind = e instanceof GitHubError ? e.kind : 'other'
        setReadme({
          state: 'error',
          message:
            kind === 'notfound'
              ? 'This repository has no README.'
              : kind === 'rate'
                ? 'README skipped: the GitHub API limit is used up for this hour.'
                : 'The README could not be loaded.',
        })
      })
    return () => {
      cancelled = true
    }
  }, [repo])

  const homepage = repo?.homepage ? (/^https?:/i.test(repo.homepage) ? repo.homepage : `https://${repo.homepage}`) : ''
  const license = repo?.license ? (repo.license.spdx_id && repo.license.spdx_id !== 'NOASSERTION' ? repo.license.spdx_id : repo.license.name) : 'None'

  return (
    <Sheet open={!!repo} onOpenChange={(o) => !o && onClose()}>
      <SheetContent aria-describedby={undefined}>
        {repo && (
          <>
            <div className="border-b px-5 py-4 pr-12">
              <p className="font-mono text-[12.5px] text-muted-foreground">{repo.owner.login} /</p>
              <SheetTitle className="break-words">{repo.name}</SheetTitle>
              {repo.description && <SheetDescription className="mt-1.5">{repo.description}</SheetDescription>}
            </div>
            <div className="grid min-w-0 content-start gap-4 overflow-y-auto overflow-x-hidden px-5 pb-10 pt-4 [&>*]:min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild size="sm">
                  <a href={repo.html_url} target="_blank" rel="noopener">
                    <ExternalLink /> Open on GitHub
                  </a>
                </Button>
                {homepage && (
                  <Button asChild size="sm" variant="outline">
                    <a href={homepage} target="_blank" rel="noopener nofollow">
                      <LinkIcon /> Website
                    </a>
                  </Button>
                )}
                {repo.fork && <Badge variant="outline">Fork</Badge>}
                {repo.archived && <Badge variant="outline">Archived</Badge>}
              </div>
              {!!repo.topics?.length && (
                <div className="flex flex-wrap gap-1.5">
                  {repo.topics.map((t) => (
                    <Badge key={t} variant="topic">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
              <dl className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
                {(
                  [
                    ['Stars', num(repo.stargazers_count)],
                    ['Forks', num(repo.forks_count)],
                    ['Watchers', watchers == null ? '…' : num(watchers)],
                    ['Open issues', num(repo.open_issues_count)],
                    [
                      'Language',
                      repo.language ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: langColor(repo.language) }} />
                          {repo.language}
                        </span>
                      ) : (
                        '—'
                      ),
                    ],
                    ['License', license],
                    ['Default branch', <span className="font-mono">{repo.default_branch}</span>],
                    ['Size', repo.size >= 1024 ? `${(repo.size / 1024).toFixed(1)} MB` : `${repo.size} KB`],
                    ['Created', fmtDate(repo.created_at)],
                    ['Last push', repo.pushed_at ? ago(repo.pushed_at) : '—'],
                  ] as [string, React.ReactNode][]
                ).map(([k, v]) => (
                  <div key={k} className="min-w-0 rounded-lg border px-3 py-2">
                    <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</dt>
                    <dd className="truncate font-medium tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> README
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {readme.state === 'loading' && (
                    <div className="space-y-2.5">
                      <Skeleton className="h-5 w-1/2" />
                      <Skeleton className="h-3" />
                      <Skeleton className="h-3 w-11/12" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  )}
                  {readme.state === 'error' && <p className="text-sm text-muted-foreground">{readme.message}</p>}
                  {readme.state === 'ready' && <div className="markdown" dangerouslySetInnerHTML={{ __html: readme.html }} />}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
