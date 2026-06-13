import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import LandingPage from '@/components/landing/LandingPage'

export default async function RootPage() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('profile_complete, is_organiser')
      .eq('id', user.id)
      .single()

    if (profile?.is_organiser) redirect('/admin')

    // Claim any pending admin grant - covers email/password login which bypasses /auth/callback
    const service = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    const { data: pending } = await service
      .from('pending_admins')
      .select('is_super_admin')
      .eq('email', user.email)
      .maybeSingle()

    if (pending) {
      await Promise.all([
        service.from('profiles').upsert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          is_organiser: true,
          is_super_admin: !!pending.is_super_admin,
        }, { onConflict: 'id' }),
        service.from('pending_admins').delete().eq('email', user.email),
      ])
      redirect('/admin')
    }

    if (profile?.profile_complete) redirect('/dashboard')
    redirect('/register/profile')
  }

  const [
    { data: settings },
    { data: prizes },
    { data: sponsors },
    { data: schedule },
    { data: faqs },
  ] = await Promise.all([
    supabase.from('hackathon_settings').select('*').eq('id', 1).single(),
    supabase.from('prizes').select('*').order('display_order'),
    supabase.from('sponsors').select('*').order('display_order'),
    supabase.from('schedule_items').select('*').order('display_order'),
    supabase.from('faqs').select('*').order('display_order'),
  ])

  return (
    <LandingPage
      settings={settings || null}
      prizes={prizes || []}
      sponsors={sponsors || []}
      schedule={schedule || []}
      faqs={faqs || []}
    />
  )
}
