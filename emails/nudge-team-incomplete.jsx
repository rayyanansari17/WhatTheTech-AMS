// Email #22 — Team has fewer than min members (48hrs before deadline)
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function NudgeTeamIncompleteEmail({ leaderName = 'Leader', teamName = '', currentMembers = 1, minMembers = 2, teamCode = '', dashboardUrl = '#' }) {
  return (
    <BaseLayout preview={`${teamName} needs ${minMembers - currentMembers} more member(s) to compete.`}>
      <div style={{ ...s.badge, backgroundColor: '#FFFBEB', color: '#D97706', borderColor: '#FCD34D' }}>Team Incomplete</div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>Your team needs more members ⚠️</h1>
      <p style={s.p}>
        Hi {leaderName}! <strong>{teamName}</strong> currently has <strong>{currentMembers} of {minMembers}</strong> required members.
        Teams with fewer than {minMembers} members cannot compete.
      </p>
      <div style={{ ...s.card, textAlign: 'center' }}>
        <p style={{ ...s.small, margin: '0 0 6px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Share This Code</p>
        <p style={{ fontSize: 32, fontWeight: 800, letterSpacing: '0.2em', color: '#F97316', margin: 0, fontFamily: 'monospace' }}>{teamCode}</p>
      </div>
      <div style={s.btnWrap}>
        <Link href={dashboardUrl} style={s.btn}>Invite More Members →</Link>
      </div>
      <Hr style={s.hr} />
      <p style={s.small}>Deadline to reach minimum team size is 48 hours away.</p>
    </BaseLayout>
  )
}
