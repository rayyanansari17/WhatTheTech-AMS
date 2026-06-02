import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import ProfileForm from './ProfileForm'

export default async function ProfilePage() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/register')

  const { data: profile } = await supabase
    .from('profiles')
    .select('profile_complete, is_organiser')
    .eq('id', user.id)
    .single()

  if (profile?.is_organiser) redirect('/admin')

  if (profile?.profile_complete) {
    const { data: membership } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    redirect(membership ? '/dashboard' : '/register/team')
  }

  return <ProfileForm />
}
