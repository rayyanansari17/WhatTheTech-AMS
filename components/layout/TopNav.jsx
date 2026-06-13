'use client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { Moon, Sun, LogOut, User, ChevronDown, Menu, X } from 'lucide-react'
import { useTheme } from 'next-themes'
import { getInitials } from '@/lib/utils'
import toast from 'react-hot-toast'

const NAV_TABS = [
  { href: '/dashboard', label: 'Overview', exact: true },
  { href: '/dashboard/schedule', label: 'Schedule', exact: false },
  { href: '/dashboard/venue', label: 'Venue', exact: false },
]

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function onMouseDown(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false) }, [pathname])

  async function handleLogout() {
    setDropdownOpen(false)
    setMobileMenuOpen(false)
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

  const displayName = rawName.length > 14 ? rawName.slice(0, 14) + '…' : rawName

  return (
    <>
      <header className="sticky top-0 z-[100] w-full bg-white/90 dark:bg-background/90 backdrop-blur-md border-b border-border/60 dark:border-border">
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">

            {/* ── LEFT: Logo ── */}
            <Link href="/dashboard" className="flex items-center flex-shrink-0">
              <img
                src="/images/logos/ams-logo.png"
                alt="Founders Fest"
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </Link>

            {/* ── CENTER: Desktop Tabs ── */}
            {showTabs && (
              <nav className="hidden md:flex items-center gap-1">
                {NAV_TABS.map(tab => {
                  const active = isActive(tab)
                  return (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      className={`relative px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase transition-all duration-150 ${
                        active
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      {tab.label}
                    </Link>
                  )
                })}
              </nav>
            )}

            {/* ── RIGHT ── */}
            <div className="flex items-center gap-1.5 sm:gap-2">

              {/* Step indicator - desktop only */}
              {stepIndicator && (
                <span className="hidden sm:block text-xs text-muted-foreground font-medium mr-1">
                  {stepIndicator}
                </span>
              )}

              {showUser && (
                <>
                  {/* Theme toggle */}
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
                        className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full hover:bg-muted transition-colors"
                      >
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-foreground text-xs font-bold leading-none select-none">
                            {getInitials(rawName || user?.email)}
                          </span>
                        </div>
                        {displayName && (
                          <span className="hidden sm:block text-sm font-medium text-foreground max-w-[120px] truncate">
                            {displayName}
                          </span>
                        )}
                        <ChevronDown className={`hidden sm:block w-3.5 h-3.5 text-muted-foreground transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {dropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-card rounded-xl border border-border py-1 z-50 shadow-lg shadow-black/8">
                          <div className="px-3 py-2.5 border-b border-border">
                            <p className="text-xs font-semibold text-foreground truncate">{rawName || 'User'}</p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
                          </div>
                          <button
                            onClick={() => { setDropdownOpen(false); router.push('/register/profile') }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            View Profile
                          </button>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            Sign Out
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Mobile hamburger - only shown when tabs exist */}
              {showTabs && (
                <button
                  onClick={() => setMobileMenuOpen(v => !v)}
                  className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-0.5"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Mobile nav drawer ── */}
        {showTabs && mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-white dark:bg-background px-4 py-3 space-y-1">
            {/* Step indicator in mobile menu */}
            {stepIndicator && (
              <p className="text-xs text-muted-foreground font-medium px-3 pb-2">{stepIndicator}</p>
            )}
            {NAV_TABS.map(tab => {
              const active = isActive(tab)
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {tab.label}
                </Link>
              )
            })}
            {/* Mobile sign out */}
            {showUser && user && (
              <>
                <div className="border-t border-border pt-2 mt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </header>
    </>
  )
}
