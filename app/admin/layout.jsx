import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import AdminSidebar from '@/components/layout/AdminSidebar'
import AdminMobileNav from '@/components/layout/AdminMobileNav'

export const metadata = { title: 'Admin · Founders Fest AMS' }

export default async function AdminLayout({ children }) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.is_organiser) redirect('/dashboard')

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <div className="hidden md:flex">
        <AdminSidebar user={user} profile={profile} />
      </div>
      <main className="flex-1 overflow-y-auto custom-scroll min-w-0 flex flex-col">
        {/* Mobile-only top nav */}
        <div className="md:hidden">
          <AdminMobileNav isSuperAdmin={profile?.is_super_admin} />
        </div>
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  )
}
