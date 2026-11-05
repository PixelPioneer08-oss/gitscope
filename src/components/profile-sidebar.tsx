import { AtSign, Building2, CalendarDays, Copy, ExternalLink, Link as LinkIcon, Mail, MapPin, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { GHUser } from '@/lib/github'
import { compact, fmtDate } from '@/lib/format'

export function shareUrl(login: string) {
  const u = new URL(location.href)
  u.search = ''
  u.hash = ''
  u.searchParams.set('user', login)
  return u.href
}

export function ProfileSidebar({ user }: { user: GHUser }) {
  const blog = user.blog ? (/^https?:\/\//i.test(user.blog) ? user.blog : `https://${user.blog}`) : ''
  const facts: [React.ReactNode, React.ReactNode][] = []
  if (user.company) facts.push([<Building2 key="i" />, <span>{user.company}</span>])
  if (user.location) facts.push([<MapPin key="i" />, <span>{user.location}</span>])
  if (blog)
    facts.push([
      <LinkIcon key="i" />,
      <a href={blog} target="_blank" rel="noopener nofollow" className="hover:underline">
        {user.blog!.replace(/^https?:\/\//, '').replace(/\/$/, '')}
      </a>,
    ])
  if (user.twitter_username)
    facts.push([
      <AtSign key="i" />,
      <a href={`https://x.com/${user.twitter_username}`} target="_blank" rel="noopener" className="hover:underline">
        @{user.twitter_username}
      </a>,
    ])
  if (user.email) facts.push([<Mail key="i" />, <span className="select-all">{user.email}</span>])
  facts.push([<CalendarDays key="i" />, <span>Joined {fmtDate(user.created_at)}</span>])

  const copy = async () => {
    const url = shareUrl(user.login)
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied', { description: url })
    } catch {
      toast(url)
    }
  }

  return (
    <aside aria-label="Profile" className="lg:sticky lg:top-20">
      <div className="flex items-center gap-4 lg:block">
        <img
          src={`${user.avatar_url}&s=520`}
          alt={`Avatar of ${user.login}`}
          width={260}
          height={260}
          className="aspect-square h-auto w-[88px] shrink-0 rounded-full border bg-muted object-cover lg:w-full lg:max-w-[260px]"
        />
        <div className="min-w-0 lg:mt-4">
          <h1 className="break-words text-[22px] font-bold leading-tight tracking-tight">{user.name || user.login}</h1>
          <p className="break-words font-mono text-base text-muted-foreground">{user.login}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {user.type === 'Organization' && <Badge variant="secondary">Organization</Badge>}
            {user.hireable && <Badge variant="secondary">Open to work</Badge>}
            {user.site_admin && <Badge variant="secondary">GitHub staff</Badge>}
          </div>
        </div>
      </div>
      {user.bio && <p className="mt-3 break-words">{user.bio}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
        <Users className="h-4 w-4" aria-hidden="true" />
        <span>
          <b className="tabular-nums text-foreground">{compact(user.followers)}</b> followers
        </span>
        <span>
          <b className="tabular-nums text-foreground">{compact(user.following)}</b> following
        </span>
      </div>
      <ul className="mt-4 grid gap-2 text-[13.5px]">
        {facts.map(([icon, content], i) => (
          <li key={i} className="flex min-w-0 items-center gap-2 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground">
            {icon}
            <span className="min-w-0 truncate">{content}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex gap-2">
        <Button asChild variant="outline" size="sm" className="flex-1">
          <a href={user.html_url} target="_blank" rel="noopener">
            <ExternalLink /> GitHub
          </a>
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={copy}>
          <Copy /> Copy link
        </Button>
      </div>
    </aside>
  )
}
