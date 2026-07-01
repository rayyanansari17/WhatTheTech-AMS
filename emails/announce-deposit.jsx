import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function AnnounceDepositEmail({
  name = 'Hacker',
  teamName = '',
  balanceAmount = '₹1,150',
  paymentUrl = '#',
}) {
  return (
    <BaseLayout preview="New: Lock in your seat at What The Tech with just ₹149. Pay the balance before the event.">
      <div style={{ ...s.badgeGreen, background: '#EFF6FF', color: '#1D4ED8', borderColor: '#BFDBFE' }}>
        NEW: Flexible Payment
      </div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>Don't let money hold you back</h1>
      <p style={s.p}>
        Hi {name}, we know paying the full registration fee upfront isn't always easy. So we've
        added a new way to secure your spot.
      </p>
      <p style={s.p}>
        You can now reserve your place at <strong>What The Tech Hackathon</strong> with a{' '}
        <strong>₹149 deposit</strong>. Pay the remaining balance before the event to confirm your
        registration. That's it.
      </p>

      <div style={s.card}>
        {teamName && <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Team:</strong> {teamName}</p>}
        <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Deposit to reserve:</strong> ₹149</p>
        <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Balance due before event:</strong> {balanceAmount}</p>
        <p style={{ ...s.small, margin: 0 }}><strong>Event:</strong> August 6-7, 2026 · GMC Balayogi, Hyderabad</p>
      </div>

      <p style={s.p}>
        With the event approaching and spots filling up, this is the easiest way to make sure your
        team has a seat. The deposit is non-refundable, and your registration is only confirmed once
        the full balance is paid.
      </p>

      <div style={s.btnWrap}>
        <Link href={paymentUrl} style={s.btn}>Reserve My Spot: ₹149</Link>
      </div>

      <Hr style={s.hr} />
      <p style={{ ...s.small, textAlign: 'center' }}>
        Already planning to pay in full? Go ahead. The full payment option is still right there on
        the payment page.
      </p>
    </BaseLayout>
  )
}
