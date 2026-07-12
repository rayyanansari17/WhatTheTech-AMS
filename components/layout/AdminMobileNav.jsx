'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, CreditCard, Megaphone, QrCode, Download, UserCircle, Crown, LogOut, Activity, MousePointer2, BarChart3, ListFilter, ScrollText } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/teams', label: 'Teams', icon: Users },
  { href: '/admin/participants', label: 'People', icon: UserCircle },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/announcements', label: 'Announce', icon: Megaphone },
  { href: '/admin/checkin', label: 'Check-In', icon: QrCode },
  { href: '/admin/export', label: 'Export', icon: Download },
  { href: '/admin/site-health', label: 'Health', icon: Activity },
  { href: '/admin/user-tracking', label: 'Tracking', icon: MousePointer2 },
]

export default function AdminMobileNav({ isSuperAdmin }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = getSupabaseClient()

  function isActive(href, exact) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  const items = [
    ...NAV_ITEMS,
    ...(isSuperAdmin ? [
      { href: '/admin/admins',       label: 'Admins',  icon: Crown },
      { href: '/admin/system-stats', label: 'Stats',   icon: BarChart3 },
      { href: '/admin/activity',     label: 'Activity', icon: ListFilter },
      { href: '/admin/system-logs',  label: 'Logs',    icon: ScrollText },
    ] : []),
  ]

  return (
    <div className="bg-background border-b border-border px-2 py-2 overflow-x-auto no-scrollbar">
      <div className="flex gap-1 min-w-max">
        {items.map(item => {
          const active = isActive(item.href, item.exact)
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                active ? 'bg-accent text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}>
              <item.icon className={`w-3.5 h-3.5 flex-shrink-0 ${item.href === '/admin/admins' && !active ? 'text-yellow-500' : ''}`} />
              {item.label}
            </Link>
          )
        })}

        {/* Logout  -  always at the end */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all text-destructive hover:bg-destructive/10 ml-1"
        >
          <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
          Logout
        </button>
      </div>
    </div>
  )
}
