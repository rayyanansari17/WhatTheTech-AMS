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

  const { team_id, max_members } = await req.json()
  if (!team_id || max_members == null) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const service = getServiceClient()

  const { data: team } = await service
    .from('teams')
    .select('id, leader_id, member_count, payment_status')
    .eq('id', team_id)
    .single()

  if (!team || team.leader_id !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (team.payment_status === 'paid') {
    return Response.json({ error: 'Cannot change slots after payment. Use the add-slot flow instead.' }, { status: 400 })
  }

  if (max_members < 1 || max_members > 5) {
    return Response.json({ error: 'Team size must be between 1 and 5' }, { status: 400 })
  }

  if (max_members < team.member_count) {
    return Response.json(
      { error: `Cannot reduce below current member count (${team.member_count})` },
      { status: 400 }
    )
  }

  const { error } = await service
    .from('teams')
    .update({ max_members })
    .eq('id', team_id)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const fee = max_members === 5 ? 1299 : max_members * 299
  return Response.json({ success: true, max_members, fee })
}
