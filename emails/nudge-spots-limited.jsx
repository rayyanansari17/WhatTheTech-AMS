// Email #13 - App complete, not paid (24hr nudge)
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function NudgeSpotsLimitedEmail({ name = 'Hacker', paymentUrl = '#', amount = '₹598' }) {
  return (
    <BaseLayout preview="Only a few spots left - pay now before it's too late!">
      <div style={{ ...s.badge, backgroundColor: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' }}>
        ⚠️ Spots Filling Up
      </div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>Don't lose your spot, {name}</h1>
      <p style={s.p}>
        It's been 24 hours since you completed your profile, but payment is still pending.
        <strong> Registrations are filling up</strong> - we can't hold your spot much longer.
      </p>
      <p style={s.p}>
        Secure your place at <strong>What The Tech Hackathon</strong> right now.
      </p>
      <div style={s.btnWrap}>
        <Link href={paymentUrl} style={s.btn}>Pay {amount} & Lock My Spot →</Link>
      </div>
      <Hr style={s.hr} />
      <p style={s.small}>After payment you'll receive a confirmation email with your receipt.</p>
    </BaseLayout>
  )
}
