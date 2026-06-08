/**
 * GET /api/cron/nudges
 * Runs every hour via Vercel Cron.
 * Handles: #5, #6, #7, #8, #12, #13, #19, #20, #21 nudge emails.
 *
 * Vercel cron schedule: every hour → "0 * * * *"
 */
import { createClient } from '@supabase/supabase-js'
import { triggerEmail } from '@/lib/send-email-internal'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export const dynamic = 'force-dynamic'

export async function GET(req) {
  // Verify Vercel cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://foundersfest-tech.vercel.app'
  const now = new Date()

  let sent = 0
  const errors = []

  try {
    // ── #12: App complete, not paid > 1hr ──────────────────────────────
    const { data: unpaidComplete } = await supabase
      .from('profiles')
      .select('id, full_name, application_completed_at')
      .not('application_completed_at', 'is', null)
      .lt('application_completed_at', new Date(now - 1 * 3600 * 1000).toISOString())

    for (const profile of unpaidComplete || []) {
      // Check if in a team with pending payment
      const { data: membership } = await supabase
        .from('team_members')
        .select('team_id, is_leader')
        .eq('user_id', profile.id)
        .maybeSingle()

      if (!membership) continue

      const { data: team } = await supabase
        .from('teams')
        .select('id, team_name, payment_status, max_members')
        .eq('id', membership.team_id)
        .maybeSingle()

      if (!team || team.payment_status === 'paid') continue

      const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)
      if (!authUser?.user?.email) continue

      const memberCount = team.max_members
      const amount = memberCount === 5 ? '₹1,299' : `₹${memberCount * 299}`

      const result = await triggerEmail({
        type: 'nudge_complete_payment',
        to: authUser.user.email,
        userId: profile.id,
        props: {
          name: profile.full_name || authUser.user.email.split('@')[0],
          teamName: team.team_name,
          amount,
          paymentUrl: `${appUrl}/register/payment`,
        },
      })
      if (!result.skipped) sent++
    }

    // ── #19: Team created, leader not paid > 1hr ────────────────────────
    const { data: unpaidTeams1hr } = await supabase
      .from('teams')
      .select('id, team_name, max_members, created_at')
      .eq('payment_status', 'unpaid')
      .lt('created_at', new Date(now - 1 * 3600 * 1000).toISOString())
      .gt('created_at', new Date(now - 2 * 3600 * 1000).toISOString()) // only in 1-2hr window

    for (const team of unpaidTeams1hr || []) {
      const { data: leader } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', team.id)
        .eq('is_leader', true)
        .maybeSingle()

      if (!leader) continue
      const { data: authUser } = await supabase.auth.admin.getUserById(leader.user_id)
      if (!authUser?.user?.email) continue

      const memberCount = team.max_members
      const amount = memberCount === 5 ? '₹1,299' : `₹${memberCount * 299}`

      const result = await triggerEmail({
        type: 'nudge_secure_team_spot',
        to: authUser.user.email,
        userId: leader.user_id,
        props: {
          leaderName: authUser.user.user_metadata?.full_name || authUser.user.email.split('@')[0],
          teamName: team.team_name,
          amount,
          paymentUrl: `${appUrl}/register/payment`,
        },
      })
      if (!result.skipped) sent++
    }

    // ── #20: Team created, leader not paid > 24hr ───────────────────────
    const { data: unpaidTeams24hr } = await supabase
      .from('teams')
      .select('id, team_name, created_at')
      .eq('payment_status', 'unpaid')
      .lt('created_at', new Date(now - 24 * 3600 * 1000).toISOString())
      .gt('created_at', new Date(now - 25 * 3600 * 1000).toISOString())

    for (const team of unpaidTeams24hr || []) {
      const { data: leader } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', team.id)
        .eq('is_leader', true)
        .maybeSingle()

      if (!leader) continue
      const { data: authUser } = await supabase.auth.admin.getUserById(leader.user_id)
      if (!authUser?.user?.email) continue

      const result = await triggerEmail({
        type: 'nudge_team_unpaid_final',
        to: authUser.user.email,
        userId: leader.user_id,
        props: {
          leaderName: authUser.user.user_metadata?.full_name || authUser.user.email.split('@')[0],
          teamName: team.team_name,
          paymentUrl: `${appUrl}/register/payment`,
        },
      })
      if (!result.skipped) sent++
    }

    // ── #5: App started, not completed > 2hr ───────────────────────────
    const { data: incompleteProfiles2hr } = await supabase
      .from('profiles')
      .select('id, full_name, application_started_at, application_completed_at')
      .not('application_started_at', 'is', null)
      .is('application_completed_at', null)
      .lt('application_started_at', new Date(now - 2 * 3600 * 1000).toISOString())
      .gt('application_started_at', new Date(now - 3 * 3600 * 1000).toISOString())

    for (const profile of incompleteProfiles2hr || []) {
      const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)
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
      if (!result.skipped) sent++
    }

    // ── #6: App started, not completed > 24hr ──────────────────────────
    const { data: incompleteProfiles24hr } = await supabase
      .from('profiles')
      .select('id, full_name, application_started_at, application_completed_at')
      .not('application_started_at', 'is', null)
      .is('application_completed_at', null)
      .lt('application_started_at', new Date(now - 24 * 3600 * 1000).toISOString())
      .gt('application_started_at', new Date(now - 25 * 3600 * 1000).toISOString())

    for (const profile of incompleteProfiles24hr || []) {
      const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)
      if (!authUser?.user?.email) continue

      const result = await triggerEmail({
        type: 'nudge_last_chance_apply',
        to: authUser.user.email,
        userId: profile.id,
        props: {
          name: profile.full_name || authUser.user.email.split('@')[0],
          continueUrl: `${appUrl}/register/profile`,
        },
      })
      if (!result.skipped) sent++
    }

    // ── #7: Logged in, no action > 48hr ────────────────────────────────
    const { data: inactiveUsers } = await supabase
      .from('profiles')
      .select('id, full_name, last_login_at, application_started_at')
      .not('last_login_at', 'is', null)
      .is('application_started_at', null)
      .lt('last_login_at', new Date(now - 48 * 3600 * 1000).toISOString())
      .gt('last_login_at', new Date(now - 49 * 3600 * 1000).toISOString())

    for (const profile of inactiveUsers || []) {
      const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)
      if (!authUser?.user?.email) continue

      const result = await triggerEmail({
        type: 'nudge_spot_waiting',
        to: authUser.user.email,
        userId: profile.id,
        props: {
          name: profile.full_name || authUser.user.email.split('@')[0],
          dashboardUrl: `${appUrl}/dashboard`,
        },
      })
      if (!result.skipped) sent++
    }

    // ── #8: Signed up, never logged in > 3 days ────────────────────────
    const { data: neverLoggedIn } = await supabase
      .from('profiles')
      .select('id, full_name, last_login_at')
      .is('last_login_at', null)
      .lt('created_at', new Date(now - 72 * 3600 * 1000).toISOString())
      .gt('created_at', new Date(now - 73 * 3600 * 1000).toISOString())

    for (const profile of neverLoggedIn || []) {
      const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)
      if (!authUser?.user?.email) continue

      const result = await triggerEmail({
        type: 'nudge_saved_spot',
        to: authUser.user.email,
        userId: profile.id,
        props: {
          name: profile.full_name || authUser.user.email.split('@')[0],
          loginUrl: `${appUrl}/`,
        },
      })
      if (!result.skipped) sent++
    }

  } catch (err) {
    console.error('[cron/nudges]', err)
    errors.push(err.message)
  }

  return Response.json({ ok: true, sent, errors })
}

export { GET as POST }
