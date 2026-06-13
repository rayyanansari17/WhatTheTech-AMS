import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import DashboardClient from './DashboardClient'
import { Skeleton } from '@/components/ui/skeleton'

async function AnnouncementsServer() {
  const supabase = createSupabaseServerClient()
  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)
  return announcements || []
}

function AnnouncementsSkeleton() {
  return (
    <div className="space-y-3 py-1">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="space-y-1.5 pt-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-5/6" />
        </div>
      ))}
    </div>
  )
}

async function AnnouncementsSlot() {
  const announcements = await AnnouncementsServer()
  return announcements
}

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('team_members').select('team_id, is_leader').eq('user_id', user.id).order('is_leader', { ascending: false }).limit(1).maybeSingle(),
  ])

  if (!profile?.profile_complete) redirect('/register/profile')

  // Fetch team data + announcements in parallel
  const teamId = membership?.team_id
  const [teamResult, membersResult, announcementsResult] = await Promise.all([
    teamId
      ? supabase.from('teams').select('*').eq('id', teamId).single()
      : Promise.resolve({ data: null }),
    teamId
      ? supabase.from('team_members').select('user_id, is_leader, profiles(full_name, github)').eq('team_id', teamId)
      : Promise.resolve({ data: [] }),
    supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(5),
  ])

  const team = teamResult.data
    ? { ...teamResult.data, team_members: membersResult.data || [] }
    : null

  return (
    <DashboardClient
      user={user}
      profile={profile}
      team={team}
      isLeader={membership?.is_leader || false}
      announcements={announcementsResult.data || []}
    />
  )
}
