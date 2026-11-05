import { useEffect, useState } from 'react'
import { fetchEvents, fetchRepos, fetchUser, GitHubError, type GHEvent, type GHRepo, type GHUser } from '@/lib/github'

export type ProfileState =
  | { status: 'idle' }
  | { status: 'loading'; login: string }
  | { status: 'error'; login: string; error: GitHubError }
  | {
      status: 'ready'
      login: string
      user: GHUser
      repos: GHRepo[]
      reposTruncated: boolean
      reposError: GitHubError | null
      events: GHEvent[]
      eventsError: GitHubError | null
    }

const asGhError = (e: unknown) => (e instanceof GitHubError ? e : new GitHubError('other', String((e as Error)?.message || e)))

/** Loads a user, their repos and recent public events. `nonce` forces a reload (retry / new token). */
export function useProfile(login: string, nonce: number): ProfileState {
  const [state, setState] = useState<ProfileState>({ status: 'idle' })

  useEffect(() => {
    if (!login) {
      setState({ status: 'idle' })
      return
    }
    let cancelled = false
    setState({ status: 'loading', login })
    ;(async () => {
      try {
        const user = await fetchUser(login)
        const [r, e] = await Promise.allSettled([fetchRepos(user.login), fetchEvents(user.login)])
        if (cancelled) return
        if (r.status === 'rejected' && asGhError(r.reason).kind === 'rate') throw r.reason
        setState({
          status: 'ready',
          login,
          user,
          repos: r.status === 'fulfilled' ? r.value.repos : [],
          reposTruncated: r.status === 'fulfilled' && r.value.truncated,
          reposError: r.status === 'rejected' ? asGhError(r.reason) : null,
          events: e.status === 'fulfilled' ? e.value : [],
          eventsError: e.status === 'rejected' ? asGhError(e.reason) : null,
        })
      } catch (err) {
        if (!cancelled) setState({ status: 'error', login, error: asGhError(err) })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [login, nonce])

  return state
}
