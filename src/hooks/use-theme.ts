import { useCallback, useEffect, useState } from 'react'

type Choice = 'light' | 'dark' | null

function readChoice(): Choice {
  try {
    const t = localStorage.getItem('gs-theme')
    return t === 'light' || t === 'dark' ? t : null
  } catch {
    return null
  }
}

export function useTheme() {
  const [choice, setChoice] = useState<Choice>(readChoice)
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const on = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  const dark = choice ? choice === 'dark' : systemDark
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const toggle = useCallback(() => {
    const next = dark ? 'light' : 'dark'
    try {
      localStorage.setItem('gs-theme', next)
    } catch {
      /* ignore */
    }
    setChoice(next)
  }, [dark])

  return { dark, toggle }
}
