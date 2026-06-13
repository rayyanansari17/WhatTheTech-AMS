// Email #20 - Team created, leader not paid (24hr final reminder)
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function NudgeTeamUnpaidFinalEmail({ leaderName = 'Leader', teamName = '', paymentUrl = '#' }) {
  return (
    <BaseLayout preview={`Final reminder: ${teamName}'s registration will expire soon.`}>
      <div style={{ ...s.badge, backgroundColor: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' }}>Final Reminder</div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>Final reminder, {leaderName}</h1>
      <p style={s.p}>
        It's been 24 hours since you created <strong>{teamName}</strong> and payment is still pending.
        Your team's spot will be released if payment isn't completed soon.
      </p>
      <p style={s.p}>
        <strong>Don't let your team down.</strong> Complete payment now to confirm everyone's registration.
      </p>
      <div style={s.btnWrap}>
        <Link href={paymentUrl} style={s.btn}>Complete Team Payment →</Link>
      </div>
      <Hr style={s.hr} />
      <p style={s.small}>This is your final reminder before your spot is released to the waitlist.</p>
    </BaseLayout>
  )
}
