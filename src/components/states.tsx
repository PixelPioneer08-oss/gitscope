import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, Clock, KeyRound, UserX, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { GitHubError } from '@/lib/github'
import { cn } from '@/lib/utils'
import { EXPLORE } from '@/components/home'

export function StateBlock({
  icon: Icon,
  tone,
  title,
  children,
  actions,
  bare,
}: {
  icon: LucideIcon
  tone?: 'error' | 'warn'
  title: string
  children?: React.ReactNode
  actions?: React.ReactNode
  bare?: boolean
}) {
  const inner = (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      <div
        className={cn(
          'grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground',
          tone === 'error' && 'bg-destructive/10 text-destructive',
          tone === 'warn' && 'bg-warning/15 text-warning',
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="mt-1.5 text-lg font-semibold tracking-tight">{title}</h2>
      {children && <p className="max-w-[52ch] text-muted-foreground">{children}</p>}
      {actions && <div className="mt-2 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  )
  return bare ? inner : <Card>{inner}</Card>
}

export function ProfileError({
  error,
  login,
  hasToken,
  onRetry,
  onPick,
  onOpenToken,
}: {
  error: GitHubError
  login: string
  hasToken: boolean
  onRetry: () => void
  onPick: (l: string) => void
  onOpenToken: () => void
}) {
  if (error.kind === 'notfound')
    return (
      <StateBlock
        icon={UserX}
        tone="error"
        title={`No GitHub user called “${login}”`}
        actions={EXPLORE.slice(0, 5).map(([l]) => (
          <Button key={l} variant="outline" size="sm" className="rounded-full" onClick={() => onPick(l)}>
            {l}
          </Button>
        ))}
      >
        Check the spelling, or try one of these profiles instead.
      </StateBlock>
    )
  if (error.kind === 'rate') {
    const t = error.reset ? new Date(error.reset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'within the hour'
    return (
      <StateBlock
        icon={Clock}
        tone="warn"
        title="GitHub API limit reached"
        actions={
          <>
            {!hasToken && (
              <Button onClick={onOpenToken}>
                <KeyRound /> Add a token
              </Button>
            )}
            <Button variant="outline" onClick={onRetry}>
              Try again
            </Button>
          </>
        }
      >
        {hasToken ? 'Your token has' : 'Anonymous browsing has'} used up its hourly requests. The limit resets at {t}.
        {!hasToken && ' Add a personal access token to get 5,000 requests per hour.'}
      </StateBlock>
    )
  }
  if (error.kind === 'auth')
    return (
      <StateBlock icon={KeyRound} tone="error" title="GitHub rejected your token" actions={<Button onClick={onOpenToken}>Update token</Button>}>
        The saved token is invalid or expired. Replace it, or remove it to browse anonymously.
      </StateBlock>
    )
  return (
    <StateBlock
      icon={error.kind === 'network' ? WifiOff : AlertTriangle}
      tone="error"
      title={error.kind === 'network' ? 'Can’t reach GitHub' : 'Something went wrong'}
      actions={
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      }
    >
      {error.kind === 'network'
        ? 'Check your internet connection, then try again. Some networks or browser extensions block api.github.com.'
        : error.message}
    </StateBlock>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]" aria-busy="true">
      <span className="sr-only">Loading profile…</span>
      <div className="space-y-4">
        <Skeleton className="aspect-square w-24 rounded-full lg:w-full lg:max-w-[260px]" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-14" />
        <Skeleton className="h-24" />
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-[92px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-52 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
