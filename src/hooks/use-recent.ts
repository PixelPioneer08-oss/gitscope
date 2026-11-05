import { useCallback, useState } from 'react'

export interface RecentEntry {
  login: string
  avatar: string
  name: string
}

const KEY = 'gs-recent'

function read(): RecentEntry[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

export function useRecent() {
  const [recent, setRecent] = useState<RecentEntry[]>(read)
  const persist = (v: RecentEntry[]) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(v))
    } catch {
      /* ignore */
    }
  }
  const add = useCallback((e: RecentEntry) => {
    setRecent((prev) => {
      const next = [e, ...prev.filter((r) => r.login.toLowerCase() !== e.login.toLowerCase())].slice(0, 10)
      persist(next)
      return next
    })
  }, [])
  const clear = useCallback(() => {
    persist([])
    setRecent([])
  }, [])
  return { recent, add, clear }
}
