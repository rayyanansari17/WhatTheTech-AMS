import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'

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

  const { data: caller } = await supabase
    .from('profiles')
    .select('is_organiser')
    .eq('id', user.id)
    .single()
  if (!caller?.is_organiser) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { token } = await req.json()
  if (!token) return Response.json({ error: 'Token required' }, { status: 400 })

  const service = getServiceClient()

  const { data: profile } = await service
    .from('profiles')
    .select('id, full_name, email, institution')
    .eq('checkin_token', token.trim())
    .maybeSingle()

  if (!profile) return Response.json({ error: 'Invalid QR code' }, { status: 404 })

  const { data: existing } = await service
    .from('check_ins')
    .select('id, checked_in_at')
    .eq('user_id', profile.id)
    .maybeSingle()

  if (existing) {
    return Response.json({
      alreadyCheckedIn: true,
      name: profile.full_name,
      checkedInAt: existing.checked_in_at,
    }, { status: 409 })
  }

  const { data: membership } = await service
    .from('team_members')
    .select('team_id, teams(team_name)')
    .eq('user_id', profile.id)
    .maybeSingle()

  const { error: insertErr } = await service.from('check_ins').insert({
    user_id: profile.id,
    team_id: membership?.team_id || null,
    checked_in_by: user.id,
  })

  if (insertErr) return Response.json({ error: insertErr.message }, { status: 500 })

  return Response.json({
    success: true,
    name: profile.full_name,
    institution: profile.institution || null,
    teamName: membership?.teams?.team_name || null,
  })
}
