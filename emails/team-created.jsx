// Email #15 - Team created: Team Created Confirmation
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function TeamCreatedEmail({
  leaderName = 'Hacker',
  teamName = '',
  teamCode = '',
  track = '',
  maxMembers = 4,
  paymentUrl = '#',
}) {
  return (
    <BaseLayout preview={`Team "${teamName}" created! Share your team code to invite members.`}>
      <div style={s.badge}>Team Created 🚀</div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>Your team is ready, {leaderName}!</h1>
      <p style={s.p}>
        You've created <strong>{teamName}</strong> for the <strong>{track}</strong> track.
        Share your team code with up to {maxMembers - 1} teammates so they can join.
      </p>

      <div style={{ ...s.card, textAlign: 'center' }}>
        <p style={{ ...s.small, margin: '0 0 8px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Your Team Code
        </p>
        <p style={{ fontSize: 36, fontWeight: 800, letterSpacing: '0.2em', color: '#46e84b', margin: '0', fontFamily: 'monospace' }}>
          {teamCode}
        </p>
        <p style={{ ...s.small, margin: '8px 0 0', color: '#6B7280' }}>
          Share this with your teammates · Max {maxMembers} members
        </p>
      </div>

      <p style={s.p}>
        <strong>Your next step as team leader:</strong> Complete the payment to confirm your team's registration.
        Members can join before or after payment.
      </p>

      <div style={s.btnWrap}>
        <Link href={paymentUrl} style={s.btn}>Complete Payment →</Link>
      </div>

      <Hr style={s.hr} />
      <p style={s.small}>
        You're the team leader - only you can complete payment for the whole team.
      </p>
    </BaseLayout>
  )
}
