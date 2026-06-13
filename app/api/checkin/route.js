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

  const body = await req.json()
  const { token, mode } = body
  if (!token) return Response.json({ error: 'Token required' }, { status: 400 })

  const service = getServiceClient()

  // ── Lookup team by checkin_token ────────────────────────────
  const { data: team } = await service
    .from('teams')
    .select('id, team_name')
    .eq('checkin_token', token.trim())
    .maybeSingle()

  if (!team) return Response.json({ error: 'Invalid QR code' }, { status: 404 })

  // Check if team is already fully checked in
  const { data: existingCheckin } = await service
    .from('check_ins')
    .select('id, checked_in_at')
    .eq('team_id', team.id)
    .maybeSingle()

  if (existingCheckin) {
    return Response.json({
      alreadyCheckedIn: true,
      name: team.team_name,
      checkedInAt: existingCheckin.checked_in_at,
    }, { status: 409 })
  }

  // Fetch all team members with profile info
  const { data: members } = await service
    .from('team_members')
    .select('user_id, profiles(full_name, institution)')
    .eq('team_id', team.id)

  const memberList = (members || []).map(m => ({
    user_id: m.user_id,
    full_name: m.profiles?.full_name || 'Unknown',
    institution: m.profiles?.institution || null,
  }))

  // ── mode: 'lookup' - return member list for admin verification ──
  if (mode === 'lookup') {
    return Response.json({
      mode: 'lookup',
      teamId: team.id,
      teamName: team.team_name,
      members: memberList,
    })
  }

  // ── mode: 'confirm' - check in only the confirmed user IDs ──
  if (mode === 'confirm') {
    const { confirmedUserIds } = body
    if (!confirmedUserIds?.length) {
      return Response.json({ error: 'No members selected' }, { status: 400 })
    }

    const inserts = confirmedUserIds.map(uid => ({
      user_id: uid,
      team_id: team.id,
      checked_in_by: user.id,
    }))

    const { error: insertErr } = await service.from('check_ins').insert(inserts)
    if (insertErr) return Response.json({ error: insertErr.message }, { status: 500 })

    const institution = memberList[0]?.institution || null
    return Response.json({
      success: true,
      teamName: team.team_name,
      memberCount: inserts.length,
      institution,
    })
  }

  // ── Fallback: instant check-in (no mode specified) ──
  const inserts = memberList.map(m => ({
    user_id: m.user_id,
    team_id: team.id,
    checked_in_by: user.id,
  }))

  const { error: insertErr } = await service.from('check_ins').insert(inserts)
  if (insertErr) return Response.json({ error: insertErr.message }, { status: 500 })

  return Response.json({
    success: true,
    teamName: team.team_name,
    memberCount: inserts.length,
    institution: memberList[0]?.institution || null,
  })
}
