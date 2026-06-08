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

export async function sendTeamJoinEmails({ joiner, leader, team }) {
  const sends = [
    triggerEmail({
      type: 'team_invitation',
      to: joiner.email,
      userId: joiner.userId,
      props: {
        inviteeName: joiner.name,
        leaderName: leader.name,
        teamName: team.name,
        teamCode: team.code,
        track: team.track,
        joinUrl: team.joinUrl,
      },
    }),
  ]
  if (leader.email) {
    sends.push(triggerEmail({
      type: 'member_joined',
      to: leader.email,
      userId: leader.userId,
      props: {
        leaderName: leader.name,
        memberName: joiner.name,
        teamName: team.name,
        currentCount: team.currentCount,
        maxMembers: team.maxMembers,
        dashboardUrl: team.dashboardUrl,
      },
    }))
  }
  return Promise.allSettled(sends)
}
