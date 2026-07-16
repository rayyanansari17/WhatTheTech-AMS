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

  const { team_id, new_name } = await req.json()

  const trimmed = (new_name || '').trim()
  if (!team_id || !trimmed) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (trimmed.length < 2 || trimmed.length > 50) {
    return Response.json({ error: 'Team name must be between 2 and 50 characters' }, { status: 400 })
  }

  const service = getServiceClient()

  const { data: team } = await service
    .from('teams')
    .select('id, team_name, leader_id, name_changed')
    .eq('id', team_id)
    .single()

  if (!team) return Response.json({ error: 'Team not found' }, { status: 404 })

  if (team.leader_id !== user.id) {
    return Response.json({ error: 'Only the team leader can rename the team' }, { status: 403 })
  }

  if (team.name_changed) {
    return Response.json({ error: 'Your team name has already been changed once and cannot be changed again' }, { status: 403 })
  }

  if (trimmed === team.team_name) {
    return Response.json({ error: 'New name is the same as the current name' }, { status: 400 })
  }

  const { data: existing } = await service
    .from('teams')
    .select('id')
    .ilike('team_name', trimmed)
    .neq('id', team_id)
    .maybeSingle()

  if (existing) {
    return Response.json({ error: 'A team with that name already exists' }, { status: 409 })
  }

  const { error } = await service
    .from('teams')
    .update({ team_name: trimmed, name_changed: true, previous_team_name: team.team_name })
    .eq('id', team_id)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ success: true })
}
