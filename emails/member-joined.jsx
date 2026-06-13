// Email #17 - Invite accepted: Member Joined Notification (to leader)
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function MemberJoinedEmail({
  leaderName = 'Leader',
  memberName = '',
  teamName = '',
  currentCount = 2,
  maxMembers = 4,
  dashboardUrl = '#',
}) {
  const slotsLeft = maxMembers - currentCount
  return (
    <BaseLayout preview={`${memberName} just joined your team ${teamName}!`}>
      <div style={s.badgeGreen}>New Member Joined ✓</div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>Your team is growing, {leaderName}!</h1>
      <p style={s.p}>
        <strong>{memberName}</strong> just joined <strong>{teamName}</strong>.
        Your team now has <strong>{currentCount} of {maxMembers}</strong> members.
      </p>

      <div style={s.card}>
        <p style={{ ...s.small, margin: 0 }}>
          {slotsLeft > 0
            ? `🟡 ${slotsLeft} slot${slotsLeft > 1 ? 's' : ''} remaining - share your team code to fill them.`
            : '🟢 Your team is full! All slots are filled.'}
        </p>
      </div>

      <div style={s.btnWrap}>
        <Link href={dashboardUrl} style={s.btn}>View Your Team →</Link>
      </div>

      <Hr style={s.hr} />
      <p style={s.small}>
        Reminder: As team leader, you need to complete payment to confirm everyone's spot.
      </p>
    </BaseLayout>
  )
}
