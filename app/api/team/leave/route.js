import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function POST() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const service = getServiceClient()

  const { data: membership } = await service
    .from('team_members')
    .select('team_id, is_leader, teams(id, member_count, team_name, payment_status)')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) return Response.json({ error: 'You are not in a team' }, { status: 404 })

  if (membership.teams?.payment_status === 'paid') {
    return Response.json({ error: 'Cannot leave a team after payment is complete' }, { status: 400 })
  }

  if (membership.is_leader) {
    const { count } = await service
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', membership.team_id)

    if (count > 1) {
      return Response.json({ error: 'Transfer leadership to another member before leaving' }, { status: 400 })
    }

    // Leader is the only member - delete the whole team
    await service.from('teams').delete().eq('id', membership.team_id)
    return Response.json({ success: true })
  }

  // Non-leader: remove from team_members and decrement count
  await service.from('team_members').delete()
    .eq('user_id', user.id)
    .eq('team_id', membership.team_id)

  const currentCount = membership.teams?.member_count || 1
  await service.from('teams')
    .update({ member_count: Math.max(1, currentCount - 1) })
    .eq('id', membership.team_id)

  return Response.json({ success: true })
}
