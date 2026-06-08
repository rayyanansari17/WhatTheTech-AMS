/**
 * GET /api/cron/event-ops
 * Runs every hour. Handles time-based event emails:
 *   #24 (7 days before), #25 (24hr before), #26 (2hr before),
 *   #31 (6hr submission warning), #32 (1hr submission warning),
 *   #33 (submission window closed), #39 (certificates), #40 (feedback)
 *
 * Vercel cron: "0 * * * *"
 */
import { createClient } from '@supabase/supabase-js'
import { triggerEmail } from '@/lib/send-email-internal'

export const dynamic = 'force-dynamic'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

// Event config — update these dates before going live
const EVENT_START = new Date('2026-07-06T09:00:00+05:30') // 9 AM IST
const HACKING_START = new Date('2026-07-06T11:00:00+05:30')
const SUBMISSION_DEADLINE = new Date('2026-07-07T10:00:00+05:30')
const EVENT_END = new Date('2026-07-07T18:00:00+05:30')

function hoursUntil(target) {
  return (target - new Date()) / (1000 * 3600)
}

function isInWindow(target, windowHrs, toleranceHrs = 0.5) {
  const h = hoursUntil(target)
  return h >= (windowHrs - toleranceHrs) && h <= (windowHrs + toleranceHrs)
}

export async function GET(req) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://foundersfest-tech.vercel.app'
  let sent = 0

  // Helper: get all paid users with their auth emails
  async function getPaidUsers() {
    const { data: paidTeams } = await supabase
      .from('teams')
      .select('id, team_name')
      .eq('payment_status', 'paid')

    const users = []
    for (const team of paidTeams || []) {
      const { data: members } = await supabase
        .from('team_members')
        .select('user_id, profiles(full_name)')
        .eq('team_id', team.id)
      for (const m of members || []) {
        const { data: authUser } = await supabase.auth.admin.getUserById(m.user_id)
        if (authUser?.user?.email) {
          users.push({ userId: m.user_id, email: authUser.user.email, name: m.profiles?.full_name, teamName: team.team_name, teamId: team.id })
        }
      }
    }
    return users
  }

  // ── #24: 7 days (168 hrs) before event ─────────────────────────────
  if (isInWindow(EVENT_START, 168)) {
    const users = await getPaidUsers()
    for (const u of users) {
      const r = await triggerEmail({
        type: 'event_save_the_date',
        to: u.email,
        userId: u.userId,
        props: { name: u.name, dashboardUrl: `${appUrl}/dashboard`, scheduleUrl: `${appUrl}/dashboard/schedule` },
      })
      if (!r.skipped) sent++
    }
  }

  // ── #25: 24hrs before event ─────────────────────────────────────────
  if (isInWindow(EVENT_START, 24)) {
    const users = await getPaidUsers()
    for (const u of users) {
      const r = await triggerEmail({
        type: 'event_tomorrow',
        to: u.email,
        userId: u.userId,
        props: { name: u.name, teamName: u.teamName, venueUrl: `${appUrl}/dashboard/venue` },
      })
      if (!r.skipped) sent++
    }
  }

  // ── #26: 2hrs before hacking starts ────────────────────────────────
  if (isInWindow(HACKING_START, 2)) {
    const users = await getPaidUsers()
    for (const u of users) {
      const r = await triggerEmail({
        type: 'event_starts_2hrs',
        to: u.email,
        userId: u.userId,
        props: { name: u.name, submissionUrl: `${appUrl}/dashboard` },
      })
      if (!r.skipped) sent++
    }
  }

  // ── #31: 6hrs before submission deadline ────────────────────────────
  if (isInWindow(SUBMISSION_DEADLINE, 6)) {
    const { data: teamsWithoutSubmission } = await supabase
      .from('teams')
      .select('id, team_name')
      .eq('payment_status', 'paid')
      .is('submitted_at', null)

    for (const team of teamsWithoutSubmission || []) {
      const { data: leader } = await supabase
        .from('team_members')
        .select('user_id, profiles(full_name)')
        .eq('team_id', team.id)
        .eq('is_leader', true)
        .maybeSingle()

      if (!leader) continue
      const { data: authUser } = await supabase.auth.admin.getUserById(leader.user_id)
      if (!authUser?.user?.email) continue

      const r = await triggerEmail({
        type: 'warning_6hrs_submit',
        to: authUser.user.email,
        userId: leader.user_id,
        props: { name: leader.profiles?.full_name, teamName: team.team_name, submissionUrl: `${appUrl}/dashboard` },
      })
      if (!r.skipped) sent++
    }
  }

  // ── #32: 1hr before submission deadline ─────────────────────────────
  if (isInWindow(SUBMISSION_DEADLINE, 1)) {
    const { data: teamsWithoutSubmission } = await supabase
      .from('teams')
      .select('id, team_name')
      .eq('payment_status', 'paid')
      .is('submitted_at', null)

    for (const team of teamsWithoutSubmission || []) {
      const { data: members } = await supabase
        .from('team_members')
        .select('user_id, profiles(full_name)')
        .eq('team_id', team.id)

      for (const m of members || []) {
        const { data: authUser } = await supabase.auth.admin.getUserById(m.user_id)
        if (!authUser?.user?.email) continue

        const r = await triggerEmail({
          type: 'warning_1hr_submit',
          to: authUser.user.email,
          userId: m.user_id,
          props: { name: m.profiles?.full_name, teamName: team.team_name, submissionUrl: `${appUrl}/dashboard` },
        })
        if (!r.skipped) sent++
      }
    }
  }

  // ── #33: Deadline just passed, no submission ─────────────────────────
  if (isInWindow(SUBMISSION_DEADLINE, -0.5, 0.5)) { // just passed
    const { data: teamsWithoutSubmission } = await supabase
      .from('teams')
      .select('id, team_name')
      .eq('payment_status', 'paid')
      .is('submitted_at', null)

    for (const team of teamsWithoutSubmission || []) {
      const { data: members } = await supabase
        .from('team_members')
        .select('user_id, profiles(full_name)')
        .eq('team_id', team.id)

      for (const m of members || []) {
        const { data: authUser } = await supabase.auth.admin.getUserById(m.user_id)
        if (!authUser?.user?.email) continue

        const r = await triggerEmail({
          type: 'submission_closed',
          to: authUser.user.email,
          userId: m.user_id,
          props: { name: m.profiles?.full_name, teamName: team.team_name },
        })
        if (!r.skipped) sent++
      }
    }
  }

  // ── #39 & #40: 1 day after event end ────────────────────────────────
  if (isInWindow(new Date(EVENT_END.getTime() + 24 * 3600 * 1000), 0)) {
    const { data: checkedInMembers } = await supabase
      .from('profiles')
      .select('id, full_name')
      .not('checked_in_at', 'is', null)

    for (const profile of checkedInMembers || []) {
      const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)
      if (!authUser?.user?.email) continue

      // #39 Certificate
      await triggerEmail({
        type: 'certificate',
        to: authUser.user.email,
        userId: profile.id,
        props: { name: profile.full_name, certificateUrl: `${appUrl}/certificate` },
      })

      // #40 Feedback
      const r = await triggerEmail({
        type: 'feedback',
        to: authUser.user.email,
        userId: profile.id,
        props: { name: profile.full_name, feedbackUrl: `${appUrl}/feedback` },
      })
      if (!r.skipped) sent += 2
    }
  }

  return Response.json({ ok: true, sent })
}

export { GET as POST }
