import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { saveToken, tokenStore } from '@/lib/github'

export function TokenDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; onSaved: () => void }) {
  const [value, setValue] = useState('')
  const hasToken = !!tokenStore.get()

  useEffect(() => {
    if (open) setValue(tokenStore.get())
  }, [open])

  const commit = (t: string) => {
    saveToken(t)
    toast.success(t.trim() ? 'Token saved' : 'Token removed', {
      description: t.trim() ? 'Requests now use your 5,000 per hour limit.' : 'Browsing anonymously (60 requests per hour).',
    })
    onOpenChange(false)
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>GitHub access token</DialogTitle>
          <DialogDescription>
            Anonymous requests are limited to 60 per hour. A token raises that to 5,000. Create a fine-grained token with no extra permissions. It is
            kept only in this browser and sent only to api.github.com.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            commit(value)
          }}
          className="grid gap-2"
        >
          <label htmlFor="gh-token" className="sr-only">
            Token
          </label>
          <Input
            id="gh-token"
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="github_pat_… or ghp_…"
            autoComplete="off"
            spellCheck={false}
            className="font-mono"
          />
          <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener" className="text-[12.5px] text-chart-1 hover:underline">
            Create a token on GitHub
          </a>
          <DialogFooter className="mt-2">
            {hasToken && (
              <Button type="button" variant="ghost" onClick={() => commit('')}>
                Remove token
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save token</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
