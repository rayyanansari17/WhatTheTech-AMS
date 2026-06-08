'use client'
import { useEffect } from 'react'
import { useTheme } from 'next-themes'

// Applies time-based theme (6AM–6PM light, 6PM–6AM dark) unless
// the user has a saved preference in localStorage (wtt_theme_preference).
export function ThemeAutoSync() {
  const { setTheme } = useTheme()

  useEffect(() => {
    function applyTheme() {
      const saved = localStorage.getItem('wtt_theme_preference')
      if (saved === 'light' || saved === 'dark') {
        setTheme(saved)
        return
      }
      const hour = new Date().getHours()
      setTheme(hour >= 6 && hour < 18 ? 'light' : 'dark')
    }

    applyTheme()

    // Refresh at the next full hour boundary
    const now = new Date()
    const msToNextHour = (60 - now.getMinutes()) * 60_000 - now.getSeconds() * 1000
    const t = setTimeout(applyTheme, msToNextHour)
    return () => clearTimeout(t)
  }, [setTheme])

  return null
}
