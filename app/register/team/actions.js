'use server'
import { triggerEmail } from '@/lib/send-email-internal'

export async function sendTeamCreatedEmail({ to, userId, leaderName, teamName, teamCode, track, maxMembers, paymentUrl }) {
  return triggerEmail({
    type: 'team_created',
    to,
    userId,
    props: { leaderName, teamName, teamCode, track, maxMembers, paymentUrl },
  })
}
