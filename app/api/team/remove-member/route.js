import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function POST(req) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { team_id, user_id } = await req.json()
  if (!team_id || !user_id) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (user_id === user.id) {
    return Response.json({ error: 'Cannot remove yourself. Use Leave Team instead.' }, { status: 400 })
  }

  const service = getServiceClient()

  // Verify requester is the leader of this team
  const { data: leaderMembership } = await service
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)
    .eq('team_id', team_id)
    .eq('is_leader', true)
    .maybeSingle()

  if (!leaderMembership) {
    return Response.json({ error: 'Only the team leader can remove members' }, { status: 403 })
  }

  // Verify target member exists in this team
  const { data: targetMembership } = await service
    .from('team_members')
    .select('user_id')
    .eq('user_id', user_id)
    .eq('team_id', team_id)
    .maybeSingle()

  if (!targetMembership) {
    return Response.json({ error: 'Member not found in this team' }, { status: 404 })
  }

  const { data: team } = await service
    .from('teams')
    .select('member_count, payment_status')
    .eq('id', team_id)
    .single()

  await service
    .from('team_members')
    .delete()
    .eq('user_id', user_id)
    .eq('team_id', team_id)

  const newCount = Math.max(1, (team?.member_count || 1) - 1)
  await service
    .from('teams')
    .update({ member_count: newCount })
    .eq('id', team_id)

  return Response.json({ success: true, member_count: newCount })
}
