// Thin client for GitHub's public REST API, called straight from the browser.
export interface GHUser {
  login: string
  name: string | null
  avatar_url: string
  html_url: string
  bio: string | null
  company: string | null
  location: string | null
  blog: string | null
  email: string | null
  twitter_username: string | null
  hireable: boolean | null
  site_admin: boolean
  type: 'User' | 'Organization' | string
  followers: number
  following: number
  public_repos: number
  public_gists: number
  created_at: string
}

export interface GHRepo {
  id: number
  name: string
  full_name: string
  owner: { login: string }
  html_url: string
  homepage: string | null
  description: string | null
  topics?: string[]
  language: string | null
  stargazers_count: number
  forks_count: number
  watchers_count: number
  open_issues_count: number
  fork: boolean
  archived: boolean
  license: { spdx_id: string | null; name: string } | null
  default_branch: string
  size: number
  created_at: string
  pushed_at: string | null
}

export interface GHEvent {
  id: string
  type: string
  created_at: string
  repo: { name: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any
}

export type ErrorKind = 'notfound' | 'rate' | 'auth' | 'network' | 'other'

export class GitHubError extends Error {
  kind: ErrorKind
  status?: number
  reset?: number
  constructor(kind: ErrorKind, message: string, status?: number, reset?: number) {
    super(message)
    this.kind = kind
    this.status = status
    this.reset = reset
  }
}

const API = 'https://api.github.com'
const CACHE_TTL = 10 * 60 * 1000
export const MAX_REPO_PAGES = 5 // up to 500 repos
const EVENT_PAGES = 3 // GitHub serves at most 300 events from the last 90 days

/* ---------- tiny external stores (token + rate limit) ---------- */
type Listener = () => void
function createStore<T>(initial: T) {
  let value = initial
  const listeners = new Set<Listener>()
  return {
    get: () => value,
    set: (v: T) => {
      value = v
      listeners.forEach((l) => l())
    },
    subscribe: (l: Listener) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
  }
}

function readToken() {
  try {
    return localStorage.getItem('gs-token') || ''
  } catch {
    return ''
  }
}

export const tokenStore = createStore<string>(readToken())
export interface RateInfo {
  remaining: number
  limit: number
  reset: number
}
export const rateStore = createStore<RateInfo | null>(null)

const mem = new Map<string, { t: number; v: unknown }>()

export function saveToken(token: string) {
  const t = token.trim()
  try {
    if (t) localStorage.setItem('gs-token', t)
    else localStorage.removeItem('gs-token')
  } catch {
    /* storage unavailable */
  }
  mem.clear()
  tokenStore.set(t)
}

function updateRate(h: Headers) {
  const rem = h.get('x-ratelimit-remaining')
  const lim = h.get('x-ratelimit-limit')
  if (rem == null || lim == null) return
  rateStore.set({ remaining: +rem, limit: +lim, reset: +(h.get('x-ratelimit-reset') || 0) })
}

interface Res<T> {
  data: T
  link: string
}

export async function gh<T>(path: string, opts: { accept?: string; text?: boolean } = {}): Promise<Res<T>> {
  const url = path.startsWith('http') ? path : API + path
  const token = tokenStore.get()
  const key = `${opts.accept || ''}|${url}|${token ? 't' : 'a'}`
  const hit = mem.get(key)
  if (hit && Date.now() - hit.t < CACHE_TTL) return hit.v as Res<T>
  try {
    const ss = sessionStorage.getItem('gs:' + key)
    if (ss) {
      const o = JSON.parse(ss) as { t: number; v: Res<T> }
      if (Date.now() - o.t < CACHE_TTL) {
        mem.set(key, o)
        return o.v
      }
    }
  } catch {
    /* ignore */
  }

  const headers: Record<string, string> = { Accept: opts.accept || 'application/vnd.github+json' }
  if (token) headers.Authorization = `Bearer ${token}`
  let res: Response
  try {
    res = await fetch(url, { headers })
  } catch {
    throw new GitHubError('network', 'Network error')
  }
  updateRate(res.headers)

  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      msg = ((await res.json()) as { message?: string }).message || msg
    } catch {
      /* ignore */
    }
    const remaining = res.headers.get('x-ratelimit-remaining')
    const reset = +(res.headers.get('x-ratelimit-reset') || 0) || undefined
    if ((res.status === 403 || res.status === 429) && (remaining === '0' || /rate limit/i.test(msg)))
      throw new GitHubError('rate', msg, res.status, reset)
    if (res.status === 401) throw new GitHubError('auth', msg, 401)
    if (res.status === 404) throw new GitHubError('notfound', msg, 404)
    throw new GitHubError('other', msg, res.status)
  }

  const v: Res<T> = { data: (opts.text ? await res.text() : await res.json()) as T, link: res.headers.get('link') || '' }
  const o = { t: Date.now(), v }
  mem.set(key, o)
  try {
    const s = JSON.stringify(o)
    if (s.length < 1_500_000) sessionStorage.setItem('gs:' + key, s)
  } catch {
    /* quota */
  }
  return v
}

export const fetchUser = async (login: string) => (await gh<GHUser>(`/users/${encodeURIComponent(login)}`)).data

export async function fetchRepos(login: string) {
  let all: GHRepo[] = []
  let truncated = false
  for (let p = 1; p <= MAX_REPO_PAGES; p++) {
    const { data, link } = await gh<GHRepo[]>(`/users/${login}/repos?per_page=100&page=${p}&sort=pushed`)
    all = all.concat(data)
    if (data.length < 100 || !/rel="next"/.test(link)) break
    if (p === MAX_REPO_PAGES) truncated = true
  }
  return { repos: all, truncated }
}

export async function fetchEvents(login: string) {
  let all: GHEvent[] = []
  for (let p = 1; p <= EVENT_PAGES; p++) {
    try {
      const { data, link } = await gh<GHEvent[]>(`/users/${login}/events/public?per_page=100&page=${p}`)
      all = all.concat(data)
      if (data.length < 100 || !/rel="next"/.test(link)) break
    } catch (e) {
      if (p === 1) throw e
      break
    }
  }
  return all
}

export const fetchRepoDetail = async (fullName: string) =>
  (await gh<GHRepo & { subscribers_count?: number }>(`/repos/${fullName}`)).data

export const fetchReadmeHtml = async (fullName: string) =>
  (await gh<string>(`/repos/${fullName}/readme`, { accept: 'application/vnd.github.html', text: true })).data

export const LOGIN_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i

export function normalizeLogin(raw: string) {
  return raw
    .trim()
    .replace(/^@/, '')
    .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
    .split(/[/?#]/)[0]
}
