import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { Toaster } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ActivityFeed } from '@/components/activity-feed'
import { Header } from '@/components/header'
import { Home } from '@/components/home'
import { Overview } from '@/components/overview'
import { ProfileSidebar } from '@/components/profile-sidebar'
import { DEFAULT_FILTERS, RepoBrowser, type RepoFilters } from '@/components/repo-browser'
import { RepoSheet } from '@/components/repo-sheet'
import { ProfileError, ProfileSkeleton } from '@/components/states'
import { StatsGrid } from '@/components/stats-grid'
import { TokenDialog } from '@/components/token-dialog'
import { useProfile } from '@/hooks/use-profile'
import { useRecent } from '@/hooks/use-recent'
import { useTheme } from '@/hooks/use-theme'
import type { EventCategory } from '@/lib/events'
import { GitHubError, LOGIN_RE, normalizeLogin, tokenStore, type GHRepo } from '@/lib/github'

function loginFromUrl() {
  const p = new URLSearchParams(location.search).get('user')
  if (p) return normalizeLogin(p)
  const h = decodeURIComponent(location.hash.slice(1)).replace(/^user=/, '').trim()
  return LOGIN_RE.test(h) ? h : ''
}

function writeUrl(login: string, push: boolean) {
  const u = new URL(location.href)
  if (login) u.searchParams.set('user', login)
  else u.searchParams.delete('user')
  u.hash = ''
  if (u.href !== location.href) history[push ? 'pushState' : 'replaceState'](null, '', u)
}

type Tab = 'overview' | 'repos' | 'activity'

export default function App() {
  const { dark, toggle } = useTheme()
  const { recent, add: addRecent, clear: clearRecent } = useRecent()
  const token = useSyncExternalStore(tokenStore.subscribe, tokenStore.get)
  const [login, setLogin] = useState(loginFromUrl)
  const [nonce, setNonce] = useState(0)
  const [tab, setTab] = useState<Tab>('overview')
  const [filters, setFilters] = useState<RepoFilters>(DEFAULT_FILTERS)
  const [evFilter, setEvFilter] = useState<EventCategory | 'all'>('all')
  const [openRepo, setOpenRepo] = useState<GHRepo | null>(null)
  const [tokenOpen, setTokenOpen] = useState(false)

  const valid = !login || LOGIN_RE.test(login)
  const state = useProfile(valid ? login : '', nonce)

  const go = useCallback((raw: string, push = true) => {
    const l = normalizeLogin(raw)
    writeUrl(l, push)
    setLogin(l)
    setTab('overview')
    setFilters(DEFAULT_FILTERS)
    setEvFilter('all')
    setOpenRepo(null)
    window.scrollTo({ top: 0 })
  }, [])

  useEffect(() => {
    const onPop = () => go(loginFromUrl(), false)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [go])

  useEffect(() => {
    if (state.status === 'ready') {
      addRecent({ login: state.user.login, avatar: state.user.avatar_url, name: state.user.name || '' })
      if (state.user.login !== login) writeUrl(state.user.login, false)
      document.title = `${state.user.name || state.user.login} (${state.user.login}) · GitScope`
    } else if (state.status === 'idle') {
      document.title = 'GitScope Profile Explorer'
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const retry = () => setNonce((n) => n + 1)

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        current={login}
        recent={recent}
        dark={dark}
        onToggleTheme={toggle}
        onSearch={(l) => go(l)}
        onHome={() => go('')}
        onOpenToken={() => setTokenOpen(true)}
      />

      <main className="container flex-1 pb-16 pt-6" aria-live="polite">
        {!login && <Home recent={recent} onPick={(l) => go(l)} onClearRecent={clearRecent} />}

        {login && !valid && (
          <ProfileError
            error={new GitHubError('notfound', 'Invalid username')}
            login={login}
            hasToken={!!token}
            onRetry={retry}
            onPick={(l) => go(l)}
            onOpenToken={() => setTokenOpen(true)}
          />
        )}

        {valid && state.status === 'loading' && <ProfileSkeleton />}

        {state.status === 'error' && (
          <ProfileError
            error={state.error}
            login={state.login}
            hasToken={!!token}
            onRetry={retry}
            onPick={(l) => go(l)}
            onOpenToken={() => setTokenOpen(true)}
          />
        )}

        {state.status === 'ready' && (
          <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
            <ProfileSidebar user={state.user} />
            <section className="min-w-0" aria-label="Profile details">
              <StatsGrid user={state.user} repos={state.repos} truncated={state.reposTruncated} />
              <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mt-5">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="repos">
                    Repositories <span className="rounded-full bg-border px-1.5 font-mono text-[11px]">{state.repos.length}</span>
                  </TabsTrigger>
                  <TabsTrigger value="activity">
                    Activity <span className="rounded-full bg-border px-1.5 font-mono text-[11px]">{state.events.length}</span>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                  <Overview
                    repos={state.repos}
                    events={state.events}
                    eventsError={state.eventsError}
                    reposError={state.reposError}
                    onOpenRepo={setOpenRepo}
                    onSeeAll={() => setTab('repos')}
                  />
                </TabsContent>
                <TabsContent value="repos">
                  <RepoBrowser
                    user={state.user}
                    repos={state.repos}
                    truncated={state.reposTruncated}
                    filters={filters}
                    onFilters={setFilters}
                    onOpen={setOpenRepo}
                  />
                </TabsContent>
                <TabsContent value="activity">
                  <ActivityFeed login={state.user.login} events={state.events} error={state.eventsError} filter={evFilter} onFilter={setEvFilter} />
                </TabsContent>
              </Tabs>
            </section>
          </div>
        )}
      </main>

      <footer className="border-t py-5 text-[12.5px] text-muted-foreground">
        <div className="container flex flex-wrap justify-between gap-3">
          <span>Live data from the GitHub public REST API, fetched in your browser.</span>
          <span>
            Press <kbd className="font-mono">/</kbd> to search · <kbd className="font-mono">Esc</kbd> to close panels
          </span>
        </div>
      </footer>

      <RepoSheet repo={openRepo} onClose={() => setOpenRepo(null)} />
      <TokenDialog open={tokenOpen} onOpenChange={setTokenOpen} onSaved={retry} />
      <Toaster theme={dark ? 'dark' : 'light'} position="bottom-right" richColors closeButton />
    </div>
  )
}
