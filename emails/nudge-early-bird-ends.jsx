// Email #28 - Early bird deadline -24hrs
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function NudgeEarlyBirdEndsEmail({ name = 'Hacker', earlyBirdPrice = '', regularPrice = '', paymentUrl = '#' }) {
  return (
    <BaseLayout preview="Early bird pricing ends tomorrow - pay now and save!">
      <div style={s.badge}>⏰ Early Bird Ends Tomorrow</div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>Last day for early bird pricing!</h1>
      <p style={s.p}>
        Hi {name}! Early bird registration pricing for <strong>What The Tech Hackathon</strong> ends in 24 hours.
        After that, the fee increases.
      </p>
      {earlyBirdPrice && regularPrice && (
        <div style={s.card}>
          <p style={{ ...s.small, margin: '0 0 6px' }}>✅ <strong>Early Bird:</strong> {earlyBirdPrice} (today only)</p>
          <p style={{ ...s.small, margin: 0 }}>❌ <strong>Regular Price:</strong> {regularPrice} (from tomorrow)</p>
        </div>
      )}
      <div style={s.btnWrap}>
        <Link href={paymentUrl} style={s.btn}>Pay Early Bird Price →</Link>
      </div>
      <Hr style={s.hr} />
    </BaseLayout>
  )
}
