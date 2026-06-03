// Email #19 — Team created, leader not paid (1hr nudge)
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function NudgeSecureTeamSpotEmail({ leaderName = 'Leader', teamName = '', amount = '', paymentUrl = '#' }) {
  return (
    <BaseLayout preview={`Secure ${teamName}'s spot — payment is still pending.`}>
      <h1 style={s.h1}>Secure your team's spot 🔐</h1>
      <p style={s.p}>
        Hi {leaderName}! You created <strong>{teamName}</strong> an hour ago but payment is still pending.
        As team leader, you need to complete payment for the whole team.
      </p>
      <div style={{ ...s.accentLine }}>
        <p style={{ ...s.small, margin: 0 }}>
          Your team's registration is <strong>not confirmed</strong> until payment is complete.
          Members who joined are waiting on you!
        </p>
      </div>
      <div style={s.btnWrap}>
        <Link href={paymentUrl} style={s.btn}>Pay {amount} & Confirm Team →</Link>
      </div>
      <Hr style={s.hr} />
    </BaseLayout>
  )
}
