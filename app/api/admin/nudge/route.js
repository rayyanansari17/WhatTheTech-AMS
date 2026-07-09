import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { triggerEmail } from '@/lib/send-email-internal'
import { MIN_TEAM_SIZE } from '@/lib/constants'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

async function requireOrganiser() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const service = getServiceClient()
  const { data: profile } = await service.from('profiles').select('is_organiser').eq('id', user.id).single()
  return profile?.is_organiser ? user : null
}

// GET /api/admin/nudge?type=... - returns candidate recipient list (read-only, no dedup check)
export async function GET(req) {
  const user = await requireOrganiser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: user === null ? 401 : 403 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://app.foundersfest.org'
  const service = getServiceClient()
  const recipients = []

  if (type === 'unpaid_teams') {
    const { data: teams } = await service
      .from('teams')
      .select('id, team_name, max_members')
      .in('payment_status', ['unpaid', 'pending', 'failed'])

    for (const team of teams || []) {
      const { data: leaderMember } = await service
        .from('team_members')
        .select('user_id, profiles(full_name)')
        .eq('team_id', team.id)
        .eq('is_leader', true)
        .maybeSingle()
      if (!leaderMember) continue

      const { data: authUser } = await service.auth.admin.getUserById(leaderMember.user_id)
      if (!authUser?.user?.email) continue

      const amount = team.max_members === 5 ? '₹1,299' : `₹${team.max_members * 299}`
      recipients.push({
        id: team.id,
        name: leaderMember.profiles?.full_name || authUser.user.email.split('@')[0],
        email: authUser.user.email,
        detail: `${team.team_name} · ${amount}`,
      })
    }
  } else if (type === 'deposit_teams') {
    const { data: teams } = await service
      .from('teams')
      .select('id, team_name, max_members')
      .eq('payment_status', 'deposit_paid')

    for (const team of teams || []) {
      const { data: leaderMember } = await service
        .from('team_members')
        .select('user_id, profiles(full_name)')
        .eq('team_id', team.id)
        .eq('is_leader', true)
        .maybeSingle()
      if (!leaderMember) continue

      const { data: authUser } = await service.auth.admin.getUserById(leaderMember.user_id)
      if (!authUser?.user?.email) continue

      const maxMembers = team.max_members || 1
      const balanceAmount = (maxMembers === 5 ? 1299 : maxMembers * 299) - 149
      recipients.push({
        id: team.id,
        name: leaderMember.profiles?.full_name || authUser.user.email.split('@')[0],
        email: authUser.user.email,
        detail: `${team.team_name} · ₹${balanceAmount} balance`,
      })
    }
  } else if (type === 'incomplete_profiles') {
    const { data: profiles } = await service
      .from('profiles')
      .select('id, full_name')
      .eq('profile_complete', false)
      .eq('is_organiser', false)

    for (const profile of profiles || []) {
      const { data: authUser } = await service.auth.admin.getUserById(profile.id)
      if (!authUser?.user?.email) continue
      recipients.push({
        id: profile.id,
        name: profile.full_name || authUser.user.email.split('@')[0],
        email: authUser.user.email,
        detail: '',
      })
    }
  } else if (type === 'incomplete_teams') {
    const { data: teams } = await service
      .from('teams')
      .select('id, team_name, member_count, team_code')
      .lt('member_count', MIN_TEAM_SIZE)

    for (const team of teams || []) {
      const { data: leaderMember } = await service
        .from('team_members')
        .select('user_id, profiles(full_name)')
        .eq('team_id', team.id)
        .eq('is_leader', true)
        .maybeSingle()
      if (!leaderMember) continue

      const { data: authUser } = await service.auth.admin.getUserById(leaderMember.user_id)
      if (!authUser?.user?.email) continue

      recipients.push({
        id: team.id,
        name: leaderMember.profiles?.full_name || authUser.user.email.split('@')[0],
        email: authUser.user.email,
        detail: `${team.team_name} · ${team.member_count}/${MIN_TEAM_SIZE} members · code ${team.team_code}`,
      })
    }
  } else if (type === 'announce_deposit') {
    const { data: teams } = await service
      .from('teams')
      .select('id, team_name, max_members')
      .in('payment_status', ['unpaid', 'pending', 'failed'])

    for (const team of teams || []) {
      const { data: leaderMember } = await service
        .from('team_members')
        .select('user_id, profiles(full_name)')
        .eq('team_id', team.id)
        .eq('is_leader', true)
        .maybeSingle()
      if (!leaderMember) continue

      const { data: authUser } = await service.auth.admin.getUserById(leaderMember.user_id)
      if (!authUser?.user?.email) continue

      const maxMembers = team.max_members || 1
      const balanceAmount = (maxMembers === 5 ? 1299 : maxMembers * 299) - 149
      recipients.push({
        id: team.id,
        name: leaderMember.profiles?.full_name || authUser.user.email.split('@')[0],
        email: authUser.user.email,
        detail: `${team.team_name} · ₹${balanceAmount} balance after deposit`,
      })
    }
  } else if (type === 'apology_wrong_dates') {
    // Unique users who received any of the wrongly-fired July event emails
    const { data: logs } = await service
      .from('email_logs')
      .select('user_id, metadata')
      .in('email_type', ['event_tomorrow', 'event_starts_2hrs', 'warning_1hr_submit', 'submission_closed'])
      .eq('status', 'sent')

    const seen = new Set()
    for (const log of logs || []) {
      if (seen.has(log.user_id)) continue
      seen.add(log.user_id)
      const { data: authUser } = await service.auth.admin.getUserById(log.user_id)
      if (!authUser?.user?.email) continue
      const { data: profile } = await service.from('profiles').select('full_name').eq('id', log.user_id).maybeSingle()
      recipients.push({
        id: log.user_id,
        name: profile?.full_name || log.metadata?.name || authUser.user.email.split('@')[0],
        email: authUser.user.email,
        detail: log.metadata?.teamName ? `Team: ${log.metadata.teamName}` : '',
      })
    }
  } else {
    return Response.json({ error: 'Unknown nudge type' }, { status: 400 })
  }

  return Response.json({ recipients })
}

// POST /api/admin/nudge - sends to explicitly selected ids only
export async function POST(req) {
  const user = await requireOrganiser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: user === null ? 401 : 403 })

  const { type, ids } = await req.json()

  if (!ids || ids.length === 0) {
    return Response.json({ error: 'No recipients selected' }, { status: 400 })
  }

  const service = getServiceClient()
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://app.foundersfest.org'
  let sent = 0
  let skipped = 0

  if (type === 'unpaid_teams') {
    const { data: teams } = await service
      .from('teams')
      .select('id, team_name, max_members')
      .in('payment_status', ['unpaid', 'pending', 'failed'])
      .in('id', ids)

    for (const team of teams || []) {
      const { data: leaderMember } = await service
        .from('team_members')
        .select('user_id, profiles(full_name)')
        .eq('team_id', team.id)
        .eq('is_leader', true)
        .maybeSingle()
      if (!leaderMember) continue

      const { data: authUser } = await service.auth.admin.getUserById(leaderMember.user_id)
      if (!authUser?.user?.email) continue

      const amount = team.max_members === 5 ? '₹1,299' : `₹${team.max_members * 299}`
      const result = await triggerEmail({
        type: 'nudge_secure_team_spot',
        to: authUser.user.email,
        userId: leaderMember.user_id,
        props: {
          leaderName: leaderMember.profiles?.full_name || authUser.user.email.split('@')[0],
          teamName: team.team_name,
          amount,
          paymentUrl: `${appUrl}/register/payment`,
        },
      })
      result.skipped ? skipped++ : sent++
    }
  } else if (type === 'deposit_teams') {
    const deadline = process.env.DEPOSIT_BALANCE_DEADLINE
      ? new Date(process.env.DEPOSIT_BALANCE_DEADLINE).toLocaleDateString('en-IN')
      : 'before the event'

    const { data: teams } = await service
      .from('teams')
      .select('id, team_name, max_members')
      .eq('payment_status', 'deposit_paid')
      .in('id', ids)

    for (const team of teams || []) {
      const { data: leaderMember } = await service
        .from('team_members')
        .select('user_id, profiles(full_name)')
        .eq('team_id', team.id)
        .eq('is_leader', true)
        .maybeSingle()
      if (!leaderMember) continue

      const { data: authUser } = await service.auth.admin.getUserById(leaderMember.user_id)
      if (!authUser?.user?.email) continue

      const maxMembers = team.max_members || 1
      const balanceAmount = (maxMembers === 5 ? 1299 : maxMembers * 299) - 149
      const result = await triggerEmail({
        type: 'nudge_deposit_complete',
        to: authUser.user.email,
        userId: leaderMember.user_id,
        props: {
          name: leaderMember.profiles?.full_name || authUser.user.email.split('@')[0],
          teamName: team.team_name,
          balanceAmount: `₹${balanceAmount}`,
          deadline,
          paymentUrl: `${appUrl}/register/payment`,
        },
      })
      result.skipped ? skipped++ : sent++
    }
  } else if (type === 'incomplete_profiles') {
    const { data: profiles } = await service
      .from('profiles')
      .select('id, full_name')
      .eq('profile_complete', false)
      .eq('is_organiser', false)
      .in('id', ids)

    for (const profile of profiles || []) {
      const { data: authUser } = await service.auth.admin.getUserById(profile.id)
      if (!authUser?.user?.email) continue

      const result = await triggerEmail({
        type: 'nudge_complete_application_2hr',
        to: authUser.user.email,
        userId: profile.id,
        props: {
          name: profile.full_name || authUser.user.email.split('@')[0],
          continueUrl: `${appUrl}/register/profile`,
        },
      })
      result.skipped ? skipped++ : sent++
    }
  } else if (type === 'incomplete_teams') {
    const { data: teams } = await service
      .from('teams')
      .select('id, team_name, member_count, team_code')
      .lt('member_count', MIN_TEAM_SIZE)
      .in('id', ids)

    for (const team of teams || []) {
      const { data: leaderMember } = await service
        .from('team_members')
        .select('user_id, profiles(full_name)')
        .eq('team_id', team.id)
        .eq('is_leader', true)
        .maybeSingle()
      if (!leaderMember) continue

      const { data: authUser } = await service.auth.admin.getUserById(leaderMember.user_id)
      if (!authUser?.user?.email) continue

      const result = await triggerEmail({
        type: 'nudge_team_incomplete',
        to: authUser.user.email,
        userId: leaderMember.user_id,
        props: {
          leaderName: leaderMember.profiles?.full_name || authUser.user.email.split('@')[0],
          teamName: team.team_name,
          currentMembers: team.member_count,
          minMembers: MIN_TEAM_SIZE,
          teamCode: team.team_code,
          dashboardUrl: `${appUrl}/dashboard`,
        },
      })
      result.skipped ? skipped++ : sent++
    }
  } else if (type === 'announce_deposit') {
    const { data: teams } = await service
      .from('teams')
      .select('id, team_name, max_members')
      .in('payment_status', ['unpaid', 'pending', 'failed'])
      .in('id', ids)

    for (const team of teams || []) {
      const { data: leaderMember } = await service
        .from('team_members')
        .select('user_id, profiles(full_name)')
        .eq('team_id', team.id)
        .eq('is_leader', true)
        .maybeSingle()
      if (!leaderMember) continue

      const { data: authUser } = await service.auth.admin.getUserById(leaderMember.user_id)
      if (!authUser?.user?.email) continue

      const maxMembers = team.max_members || 1
      const balanceAmount = (maxMembers === 5 ? 1299 : maxMembers * 299) - 149
      const result = await triggerEmail({
        type: 'announce_deposit',
        to: authUser.user.email,
        userId: leaderMember.user_id,
        props: {
          name: leaderMember.profiles?.full_name || authUser.user.email.split('@')[0],
          teamName: team.team_name,
          balanceAmount: `₹${balanceAmount}`,
          paymentUrl: `${appUrl}/register/payment`,
        },
      })
      result.skipped ? skipped++ : sent++
    }
  } else if (type === 'apology_wrong_dates') {
    for (const userId of ids) {
      const { data: authUser } = await service.auth.admin.getUserById(userId)
      if (!authUser?.user?.email) continue
      const { data: profile } = await service.from('profiles').select('full_name').eq('id', userId).maybeSingle()

      // Get their team name from most recent wrong email log
      const { data: log } = await service
        .from('email_logs')
        .select('metadata')
        .eq('user_id', userId)
        .in('email_type', ['submission_closed', 'warning_1hr_submit', 'event_starts_2hrs', 'event_tomorrow'])
        .order('sent_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const result = await triggerEmail({
        type: 'apology_wrong_dates',
        to: authUser.user.email,
        userId,
        props: {
          name: profile?.full_name || authUser.user.email.split('@')[0],
          teamName: log?.metadata?.teamName || '',
          dashboardUrl: `${appUrl}/dashboard`,
        },
      })
      result.skipped ? skipped++ : sent++
    }
  } else {
    return Response.json({ error: 'Unknown nudge type' }, { status: 400 })
  }

  return Response.json({ ok: true, sent, skipped })
}
