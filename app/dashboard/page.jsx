import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('team_members').select('team_id, is_leader').eq('user_id', user.id).order('is_leader', { ascending: false }).limit(1).maybeSingle(),
  ])

  if (!profile?.profile_complete) redirect('/register/profile')

  let team = null
  if (membership?.team_id) {
    const { data: teamData } = await supabase
      .from('teams')
      .select('*')
      .eq('id', membership.team_id)
      .single()

    if (teamData) {
      const { data: members } = await supabase
        .from('team_members')
        .select('user_id, is_leader, profiles(full_name, github)')
        .eq('team_id', membership.team_id)

      team = { ...teamData, team_members: members || [] }
    }
  }

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <DashboardClient
      user={user}
      profile={profile}
      team={team}
      isLeader={membership?.is_leader || false}
      announcements={announcements || []}
    />
  )
}
