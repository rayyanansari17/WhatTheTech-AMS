// Email #16 - Invite sent to member: You've Been Invited
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function TeamInvitationEmail({
  inviteeName = 'there',
  leaderName = '',
  teamName = '',
  teamCode = '',
  track = '',
  joinUrl = '#',
}) {
  return (
    <BaseLayout preview={`${leaderName} invited you to join team "${teamName}" at What The Tech Hackathon!`}>
      <div style={s.badge}>Team Invitation 📨</div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>You've been invited!</h1>
      <p style={s.p}>
        Hey {inviteeName}! <strong>{leaderName}</strong> has invited you to join their team{' '}
        <strong>{teamName}</strong> for the <strong>{track}</strong> track at{' '}
        <strong>What The Tech Hackathon</strong>.
      </p>

      <div style={{ ...s.card, textAlign: 'center' }}>
        <p style={{ ...s.small, margin: '0 0 8px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Team Code to Join
        </p>
        <p style={{ fontSize: 36, fontWeight: 800, letterSpacing: '0.2em', color: '#F97316', margin: '0', fontFamily: 'monospace' }}>
          {teamCode}
        </p>
      </div>

      <div style={s.card}>
        <p style={{ ...s.small, margin: '0 0 6px' }}>📍 BITS Pilani, Hyderabad</p>
        <p style={{ ...s.small, margin: '0 0 6px' }}>🗓 July 2–3, 2026</p>
        <p style={{ ...s.small, margin: 0 }}>🏆 ₹1.5L+ Prize Pool</p>
      </div>

      <div style={s.btnWrap}>
        <Link href={joinUrl} style={s.btn}>Accept Invitation →</Link>
      </div>

      <p style={{ ...s.small, textAlign: 'center', color: '#9CA3AF' }}>
        This invitation expires when the team is full or registration closes.
      </p>

      <Hr style={s.hr} />
      <p style={s.small}>
        If you weren't expecting this invite, you can ignore this email.
      </p>
    </BaseLayout>
  )
}
