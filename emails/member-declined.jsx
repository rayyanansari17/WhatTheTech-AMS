// Email #18 - Invite rejected: Member Declined Invite (to leader)
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function MemberDeclinedEmail({ leaderName = 'Leader', memberName = '', teamName = '', teamCode = '', dashboardUrl = '#' }) {
  return (
    <BaseLayout preview={`${memberName} declined your team invitation.`}>
      <h1 style={s.h1}>Invitation Declined</h1>
      <p style={s.p}>
        Hi {leaderName}, <strong>{memberName}</strong> has declined the invitation to join <strong>{teamName}</strong>.
        A slot has opened up - invite someone else using your team code.
      </p>
      <div style={{ ...s.card, textAlign: 'center' }}>
        <p style={{ ...s.small, margin: '0 0 6px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Team Code</p>
        <p style={{ fontSize: 32, fontWeight: 800, letterSpacing: '0.2em', color: '#F97316', margin: 0, fontFamily: 'monospace' }}>{teamCode}</p>
      </div>
      <div style={s.btnWrap}>
        <Link href={dashboardUrl} style={s.btn}>Manage My Team →</Link>
      </div>
      <Hr style={s.hr} />
    </BaseLayout>
  )
}
