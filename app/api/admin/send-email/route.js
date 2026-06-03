/**
 * POST /api/admin/send-email
 * Manual trigger for admin emails: round1_results, final_results, spots_running_out.
 * Protected by ADMIN_SECRET env var.
 *
 * Body: { type, secret, payload? }
 */
import { createClient } from '@supabase/supabase-js'
import { triggerEmail } from '@/lib/send-email-internal'

import ResultsRound1Email from '@/emails/results-round1'
import ResultsFinalEmail from '@/emails/results-final'
import EventSpotsRunningOutEmail from '@/emails/event-spots-running-out'
import { sendEmail } from '@/lib/email'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function POST(req) {
  try {
    const { type, secret, payload = {} } = await req.json()

    if (secret !== process.env.ADMIN_SECRET) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceClient()
    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://foundersfest-tech.vercel.app'
    let sent = 0

    if (type === 'round1_results') {
      // Send to all paid teams — payload.qualifiedTeamIds = string[]
      const { qualifiedTeamIds = [], resultsUrl = `${appUrl}/dashboard` } = payload

      const { data: teams } = await supabase
        .from('teams')
        .select('id, team_name')
        .eq('payment_status', 'paid')

      for (const team of teams || []) {
        const qualified = qualifiedTeamIds.includes(team.id)
        const { data: members } = await supabase
          .from('team_members')
          .select('user_id, profiles(full_name)')
          .eq('team_id', team.id)

        for (const m of members || []) {
          const { data: authUser } = await supabase.auth.admin.getUserById(m.user_id)
          if (!authUser?.user?.email) continue
          await sendEmail({
            to: authUser.user.email,
            subject: qualified ? 'You Qualified for Round 2! 🏆' : 'Round 1 Results Are In',
            react: <ResultsRound1Email
              name={m.profiles?.full_name}
              teamName={team.team_name}
              qualified={qualified}
              resultsUrl={resultsUrl}
            />,
            emailType: 'round1_results',
            userId: m.user_id,
            dedupWindow: 0,
          })
          sent++
        }
      }
    }

    if (type === 'final_results') {
      // payload.winners = [{ teamId, rank, prize }], payload.resultsUrl
      const { winners = [], resultsUrl = `${appUrl}/dashboard` } = payload
      const winnerMap = Object.fromEntries(winners.map(w => [w.teamId, w]))

      const { data: teams } = await supabase
        .from('teams')
        .select('id, team_name')
        .eq('payment_status', 'paid')

      const allWinners = winners.map(w => ({ rank: w.rank, team: teams?.find(t => t.id === w.teamId)?.team_name || '', prize: w.prize }))

      for (const team of teams || []) {
        const winnerInfo = winnerMap[team.id]
        const { data: members } = await supabase
          .from('team_members')
          .select('user_id, profiles(full_name)')
          .eq('team_id', team.id)

        for (const m of members || []) {
          const { data: authUser } = await supabase.auth.admin.getUserById(m.user_id)
          if (!authUser?.user?.email) continue
          await sendEmail({
            to: authUser.user.email,
            subject: winnerInfo ? `🏆 Congratulations — ${winnerInfo.rank}!` : 'Final Hackathon Results',
            react: <ResultsFinalEmail
              name={m.profiles?.full_name}
              teamName={team.team_name}
              placement={winnerInfo?.rank}
              prize={winnerInfo?.prize}
              winners={allWinners}
              resultsUrl={resultsUrl}
            />,
            emailType: 'final_results',
            userId: m.user_id,
            dedupWindow: 0,
          })
          sent++
        }
      }
    }

    if (type === 'spots_running_out') {
      // Send to all unpaid users with incomplete registration
      const { spotsLeft = 20 } = payload
      const { data: incompleteProfiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .is('application_completed_at', null)

      for (const profile of incompleteProfiles || []) {
        const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)
        if (!authUser?.user?.email) continue
        await sendEmail({
          to: authUser.user.email,
          subject: `🚨 Only ${spotsLeft} Spots Left!`,
          react: <EventSpotsRunningOutEmail
            name={profile.full_name}
            spotsLeft={spotsLeft}
            registerUrl={`${appUrl}/register`}
          />,
          emailType: 'spots_running_out',
          userId: profile.id,
          dedupWindow: 12,
        })
        sent++
      }
    }

    return Response.json({ ok: true, sent })
  } catch (err) {
    console.error('[admin/send-email]', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
