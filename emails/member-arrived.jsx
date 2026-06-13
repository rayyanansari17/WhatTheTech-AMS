// Email #35 - Team member checked in (to leader)
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function MemberArrivedEmail({ leaderName = 'Leader', memberName = '', teamName = '', checkedInCount = 1, totalMembers = 4, dashboardUrl = '#' }) {
  return (
    <BaseLayout preview={`${memberName} just checked in to the hackathon!`}>
      <h1 style={s.h1}>A teammate just arrived! 👋</h1>
      <p style={s.p}>
        Hi {leaderName}! <strong>{memberName}</strong> has just checked in at the venue.
        <strong>{teamName}</strong> now has <strong>{checkedInCount} of {totalMembers}</strong> members checked in.
      </p>
      {checkedInCount < totalMembers && (
        <div style={s.card}>
          <p style={{ ...s.small, margin: 0 }}>
            ⏳ Waiting for {totalMembers - checkedInCount} more member{totalMembers - checkedInCount > 1 ? 's' : ''} to arrive.
          </p>
        </div>
      )}
      <div style={s.btnWrap}>
        <Link href={dashboardUrl} style={s.btn}>View Team →</Link>
      </div>
      <Hr style={s.hr} />
    </BaseLayout>
  )
}
