'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { getInitials } from '@/lib/utils'
import {
  LayoutDashboard, Users, CreditCard, Megaphone, QrCode, Download, LogOut,
  Zap, ChevronRight, UserCircle, Moon, Sun,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/teams', label: 'Teams', icon: Users },
  { href: '/admin/participants', label: 'Participants', icon: UserCircle },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/admin/checkin', label: 'Check-In', icon: QrCode },
  { href: '/admin/export', label: 'Export', icon: Download },
]

export default function AdminSidebar({ user, profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = getSupabaseClient()
  const { theme, setTheme } = useTheme()

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/')
  }

  function isActive(href, exact) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col border-r border-border bg-background h-screen sticky top-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm text-foreground leading-none">Founders Fest</div>
            <div className="text-xs text-primary font-medium mt-0.5">Organiser Panel</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const active = isActive(item.href, item.exact)
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                active
                  ? 'bg-accent text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}>
              <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
              {item.label}
              {active && <ChevronRight className="w-3 h-3 ml-auto text-primary" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t border-border space-y-1">
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}>
          <LogOut className="w-4 h-4" />Logout
        </Button>
        <div className="flex items-center gap-2.5 px-3 py-2 mt-2 bg-muted/50 rounded-lg">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs">{getInitials(profile?.full_name || user?.email)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{profile?.full_name || 'Organiser'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
