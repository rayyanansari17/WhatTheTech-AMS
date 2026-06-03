'use client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { Moon, Sun, LogOut, User, ChevronDown } from 'lucide-react'
import { useTheme } from 'next-themes'
import { getInitials } from '@/lib/utils'
import toast from 'react-hot-toast'

const NAV_TABS = [
  { href: '/dashboard', label: 'Overview', exact: true },
  { href: '/dashboard/schedule', label: 'Schedule', exact: false },
  { href: '/dashboard/venue', label: 'Venue', exact: false },
]

/**
 * Shared top nav for all participant pages.
 *
 * Props:
 *   showTabs       – render Overview / Schedule / Venue tab links
 *   showUser       – render theme toggle + user avatar dropdown
 *   stepIndicator  – right-side text, e.g. "Step 1 of 3 · Profile"
 *   user           – Supabase auth user object (required when showUser=true)
 *   profile        – profiles row (full_name used for initials + name)
 */
export default function TopNav({
  showTabs = false,
  showUser = false,
  stepIndicator = null,
  user = null,
  profile = null,
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const supabase = getSupabaseClient()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function onMouseDown(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  async function handleLogout() {
    setDropdownOpen(false)
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/')
  }

  function isActive(tab) {
    return tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)
  }

  const rawName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    ''

  const displayName = rawName.length > 12 ? rawName.slice(0, 12) + '…' : rawName

  return (
    <header
      className="sticky top-0 z-[100] w-full bg-white dark:bg-background border-b border-[#e9ecef] dark:border-border"
      style={{ height: 70, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between h-full px-4">

        {/* ── LEFT: Logo ── */}
        <Link href="/dashboard" className="flex items-center flex-shrink-0">
          <img src="/images/logos/ams-logo.png" alt="AMS Logo" className="h-[50px] md:h-[65px] w-auto object-contain" style={{ marginTop: 15 }} />
        </Link>

        {/* ── CENTER: Tabs ── */}
        {showTabs && (
          <nav className="hidden md:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            {NAV_TABS.map(tab => {
              const active = isActive(tab)
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="transition-all"
                  style={{
                    padding: '6px 16px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    background: active ? '#e7f5ff' : 'transparent',
                    color: active ? '#46e74b' : '#868e96',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#495057' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#868e96' }}
                >
                  {tab.label}
                </Link>
              )
            })}
          </nav>
        )}

        {/* ── RIGHT ── */}
        <div className="flex items-center gap-3 flex-shrink-0">

          {/* Step indicator */}
          {stepIndicator && (
            <span
              className="hidden sm:block text-[#868e96] dark:text-muted-foreground"
              style={{ fontSize: 13 }}
            >
              {stepIndicator}
            </span>
          )}

          {showUser && (
            <>
              {/* Theme toggle */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center justify-center rounded-lg text-[#868e96] hover:text-[#495057] hover:bg-[#f1f3f5] dark:hover:bg-muted transition-colors relative"
                style={{ width: 32, height: 32 }}
                aria-label="Toggle theme"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </button>

              {/* Avatar + dropdown */}
              {user && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(v => !v)}
                    className="flex items-center gap-2 rounded-full hover:bg-[#f8f9fa] dark:hover:bg-muted transition-colors"
                    style={{ padding: '4px 8px 4px 4px' }}
                  >
                    {/* Avatar circle */}
                    <div
                      className="flex items-center justify-center rounded-full bg-[#46e74b] flex-shrink-0"
                      style={{ width: 32, height: 32 }}
                    >
                      <span
                        className="text-white leading-none select-none"
                        style={{ fontSize: 13, fontWeight: 600 }}
                      >
                        {getInitials(rawName || user?.email)}
                      </span>
                    </div>

                    {/* Name */}
                    {displayName && (
                      <span
                        className="hidden sm:block text-[#495057] dark:text-muted-foreground max-w-[120px] truncate"
                        style={{ fontSize: 13 }}
                      >
                        {displayName}
                      </span>
                    )}

                    <ChevronDown
                      className={`hidden sm:block w-3.5 h-3.5 text-[#868e96] transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Dropdown card */}
                  {dropdownOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-card rounded-xl border border-[#e9ecef] dark:border-border py-1 z-50 animate-scale-in"
                      style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    >
                      {/* Email label */}
                      <div
                        className="px-3 py-2 border-b border-[#f1f3f5] dark:border-border"
                        style={{ fontSize: 12 }}
                      >
                        <p className="text-[#868e96] truncate">{user?.email}</p>
                      </div>

                      <button
                        onClick={() => { setDropdownOpen(false); router.push('/register/profile') }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[#f8f9fa] dark:hover:bg-muted transition-colors"
                        style={{ fontSize: 13, color: '#495057' }}
                      >
                        <User className="w-3.5 h-3.5 text-[#868e96]" />
                        View Profile
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[#fff5f5] dark:hover:bg-red-950/30 transition-colors"
                        style={{ fontSize: 13, color: '#e03131' }}
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </header>
  )
}
