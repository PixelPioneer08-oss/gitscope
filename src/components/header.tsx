import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { KeyRound, Moon, Search, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { rateStore, tokenStore } from '@/lib/github'
import type { RecentEntry } from '@/hooks/use-recent'
import { cn } from '@/lib/utils'

interface Props {
  current: string
  recent: RecentEntry[]
  dark: boolean
  onToggleTheme: () => void
  onSearch: (login: string) => void
  onHome: () => void
  onOpenToken: () => void
}

export function Header({ current, recent, dark, onToggleTheme, onSearch, onHome, onOpenToken }: Props) {
  const [q, setQ] = useState(current)
  const inputRef = useRef<HTMLInputElement>(null)
  const rate = useSyncExternalStore(rateStore.subscribe, rateStore.get)
  const token = useSyncExternalStore(tokenStore.subscribe, tokenStore.get)

  useEffect(() => setQ(current), [current])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement
      const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || (el as HTMLElement | null)?.isContentEditable
      if ((e.key === '/' && !typing) || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const rateTone = !rate ? '' : rate.remaining === 0 ? 'bg-destructive' : rate.remaining < rate.limit * 0.2 ? 'bg-warning' : 'bg-emerald-500'

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex flex-wrap items-center gap-3 py-2.5">
        <a
          href="?"
          onClick={(e) => {
            e.preventDefault()
            onHome()
          }}
          className="flex items-center gap-2 whitespace-nowrap font-semibold tracking-tight"
          aria-label="GitScope home"
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground" aria-hidden="true">
            <Search className="h-4 w-4" strokeWidth={2.5} />
          </span>
          GitScope
        </a>

        <form
          role="search"
          className="order-2 flex min-w-0 basis-full gap-2 sm:order-none sm:flex-1 sm:basis-auto"
          onSubmit={(e) => {
            e.preventDefault()
            if (q.trim()) {
              inputRef.current?.blur()
              onSearch(q)
            }
          }}
        >
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">GitHub username</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="search"
              placeholder="Search a GitHub username…"
              className="pl-9 pr-10"
              list="gs-recent"
              autoComplete="off"
              spellCheck={false}
              autoCapitalize="off"
              maxLength={60}
            />
            <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border bg-muted px-1.5 font-mono text-[11px] text-muted-foreground sm:block">
              /
            </kbd>
            <datalist id="gs-recent">
              {recent.map((r) => (
                <option key={r.login} value={r.login}>
                  {r.name}
                </option>
              ))}
            </datalist>
          </label>
          <Button type="submit">Explore</Button>
        </form>

        <div className="ml-auto flex items-center gap-1">
          {rate && (
            <span
              className="mr-1 hidden items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-xs text-muted-foreground sm:inline-flex"
              title={`GitHub API: ${rate.remaining} of ${rate.limit} requests left${rate.reset ? `, resets ${new Date(rate.reset * 1000).toLocaleTimeString()}` : ''}`}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', rateTone)} />
              {rate.remaining}/{rate.limit}
            </span>
          )}
          <Button
            variant={token ? 'outline' : 'ghost'}
            size="icon"
            onClick={onOpenToken}
            aria-label={token ? 'Manage GitHub token' : 'Add GitHub token'}
            title="GitHub token"
          >
            <KeyRound />
          </Button>
          <Button variant="ghost" size="icon" onClick={onToggleTheme} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
            {dark ? <Sun /> : <Moon />}
          </Button>
        </div>
      </div>
    </header>
  )
}
