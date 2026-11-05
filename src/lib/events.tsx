import type { LucideIcon } from 'lucide-react'
import { BookMarked, GitBranch, GitCommitHorizontal, GitFork, GitPullRequest, CircleDot, MessageSquare, Rocket, Star, Tag, Users } from 'lucide-react'
import type { GHEvent } from '@/lib/github'

export type EventCategory = 'push' | 'pr' | 'issue' | 'star' | 'release' | 'branch' | 'other'

export const EVENT_CATEGORIES: [EventCategory | 'all', string][] = [
  ['all', 'All'],
  ['push', 'Pushes'],
  ['pr', 'Pull requests'],
  ['issue', 'Issues'],
  ['star', 'Stars'],
  ['release', 'Releases'],
  ['branch', 'Branches & tags'],
  ['other', 'Other'],
]

export interface DescribedEvent {
  cat: EventCategory
  icon: LucideIcon
  text: React.ReactNode
  commits?: { sha: string; message: string }[]
}

const cap = (s: string | undefined) => String(s || '').replace(/^./, (c) => c.toUpperCase())

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener" className="font-medium hover:underline">
      {children}
    </a>
  )
}
const Code = ({ children }: { children: React.ReactNode }) => <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{children}</code>

export function describeEvent(e: GHEvent): DescribedEvent {
  const p = e.payload || {}
  const repo = e.repo?.name || ''
  const R = <Ext href={`https://github.com/${repo}`}>{repo}</Ext>
  const num = (n: unknown, title?: string) => `#${n ?? ''}${title ? ' ' + title : ''}`

  switch (e.type) {
    case 'PushEvent': {
      const n: number | null = p.distinct_size ?? p.size ?? (Array.isArray(p.commits) ? p.commits.length : null)
      const br = String(p.ref || '').replace('refs/heads/', '')
      const commits: { sha: string; message: string }[] = Array.isArray(p.commits)
        ? p.commits
            .slice(-3)
            .reverse()
            .map((c: { sha: string; message?: string }) => ({ sha: c.sha, message: (c.message || '').split('\n')[0] }))
        : p.head
          ? [{ sha: p.head as string, message: 'head commit' }]
          : []
      return {
        cat: 'push',
        icon: GitCommitHorizontal,
        text: (
          <>
            Pushed {n != null ? `${n} commit${n === 1 ? '' : 's'} ` : ''}to <Code>{br || 'a branch'}</Code> in {R}
          </>
        ),
        commits,
      }
    }
    case 'PullRequestEvent': {
      const pr = p.pull_request || {}
      const n = p.number || pr.number
      const act = p.action === 'closed' && pr.merged ? 'Merged' : cap(p.action || 'updated')
      return {
        cat: 'pr',
        icon: GitPullRequest,
        text: (
          <>
            {act} pull request <Ext href={pr.html_url || `https://github.com/${repo}/pull/${n}`}>{num(n, pr.title)}</Ext> in {R}
          </>
        ),
      }
    }
    case 'PullRequestReviewEvent': {
      const pr = p.pull_request || {}
      return {
        cat: 'pr',
        icon: GitPullRequest,
        text: (
          <>
            Reviewed pull request <Ext href={pr.html_url || `https://github.com/${repo}/pulls`}>{num(pr.number, pr.title)}</Ext> in {R}
          </>
        ),
      }
    }
    case 'PullRequestReviewCommentEvent': {
      const pr = p.pull_request || {}
      return {
        cat: 'pr',
        icon: MessageSquare,
        text: (
          <>
            Commented on pull request <Ext href={p.comment?.html_url || pr.html_url || `https://github.com/${repo}`}>{num(pr.number, pr.title)}</Ext> in {R}
          </>
        ),
      }
    }
    case 'IssuesEvent': {
      const is = p.issue || {}
      return {
        cat: 'issue',
        icon: CircleDot,
        text: (
          <>
            {cap(p.action || 'updated')} issue <Ext href={is.html_url || `https://github.com/${repo}/issues`}>{num(is.number, is.title)}</Ext> in {R}
          </>
        ),
      }
    }
    case 'IssueCommentEvent': {
      const is = p.issue || {}
      const isPr = !!is.pull_request
      return {
        cat: isPr ? 'pr' : 'issue',
        icon: MessageSquare,
        text: (
          <>
            Commented on {isPr ? 'pull request' : 'issue'}{' '}
            <Ext href={p.comment?.html_url || is.html_url || `https://github.com/${repo}`}>{num(is.number, is.title)}</Ext> in {R}
          </>
        ),
      }
    }
    case 'WatchEvent':
      return { cat: 'star', icon: Star, text: <>Starred {R}</> }
    case 'ForkEvent':
      return {
        cat: 'other',
        icon: GitFork,
        text: (
          <>
            Forked {R}
            {p.forkee?.full_name && (
              <>
                {' '}
                to <Ext href={`https://github.com/${p.forkee.full_name}`}>{p.forkee.full_name}</Ext>
              </>
            )}
          </>
        ),
      }
    case 'CreateEvent':
      if (p.ref_type === 'repository') return { cat: 'other', icon: BookMarked, text: <>Created repository {R}</> }
      return {
        cat: 'branch',
        icon: p.ref_type === 'tag' ? Tag : GitBranch,
        text: (
          <>
            Created {p.ref_type} <Code>{p.ref}</Code> in {R}
          </>
        ),
      }
    case 'DeleteEvent':
      return {
        cat: 'branch',
        icon: p.ref_type === 'tag' ? Tag : GitBranch,
        text: (
          <>
            Deleted {p.ref_type} <Code>{p.ref}</Code> in {R}
          </>
        ),
      }
    case 'ReleaseEvent': {
      const r = p.release || {}
      return {
        cat: 'release',
        icon: Rocket,
        text: (
          <>
            {cap(p.action || 'published')} release <Ext href={r.html_url || `https://github.com/${repo}/releases`}>{r.name || r.tag_name || 'release'}</Ext> in {R}
          </>
        ),
      }
    }
    case 'PublicEvent':
      return { cat: 'other', icon: BookMarked, text: <>Made {R} public</> }
    case 'MemberEvent':
      return {
        cat: 'other',
        icon: Users,
        text: (
          <>
            {cap(p.action || 'added')} {p.member?.login || 'a collaborator'} to {R}
          </>
        ),
      }
    case 'GollumEvent': {
      const n = (p.pages || []).length
      return {
        cat: 'other',
        icon: BookMarked,
        text: (
          <>
            Updated {n || ''} wiki page{n === 1 ? '' : 's'} in {R}
          </>
        ),
      }
    }
    case 'CommitCommentEvent':
      return { cat: 'other', icon: MessageSquare, text: <>Commented on a commit in {R}</> }
    default:
      return {
        cat: 'other',
        icon: GitCommitHorizontal,
        text: (
          <>
            {String(e.type || 'Event').replace(/Event$/, '')} in {R}
          </>
        ),
      }
  }
}
