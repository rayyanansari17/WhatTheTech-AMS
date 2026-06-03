// Email #4 — Registration completed (pre-pay): Registration Confirmation
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function RegistrationConfirmationEmail({
  name = 'Hacker',
  teamName = '',
  paymentUrl = '#',
  amount = '₹598',
}) {
  return (
    <BaseLayout preview="Registration received! Complete payment to confirm your spot.">
      <div style={s.badge}>Registration Received</div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>You're almost there, {name}!</h1>
      <p style={s.p}>
        Your registration details have been saved. One last step — complete payment to
        confirm your spot at What The Tech Hackathon.
      </p>

      {teamName && (
        <div style={s.card}>
          <p style={{ ...s.small, margin: 0 }}>
            <strong>Team:</strong> {teamName}
          </p>
          <p style={{ ...s.small, margin: '6px 0 0' }}>
            <strong>Registration Fee:</strong> {amount}
          </p>
          <p style={{ ...s.small, margin: '6px 0 0' }}>
            <strong>Status:</strong> ⏳ Payment Pending
          </p>
        </div>
      )}

      <div style={{ ...s.accentLine, borderColor: '#F97316' }}>
        <p style={{ ...s.small, margin: 0, color: '#374151' }}>
          <strong>⚠️ Important:</strong> Your spot is reserved for 24 hours. Complete payment
          before it expires to guarantee your place at the hackathon.
        </p>
      </div>

      <div style={s.btnWrap}>
        <Link href={paymentUrl} style={s.btn}>Complete Payment Now →</Link>
      </div>

      <Hr style={s.hr} />
      <p style={s.small}>
        Having trouble? Contact us at{' '}
        <Link href="mailto:team@foundersfest.org" style={{ color: '#F97316' }}>team@foundersfest.org</Link>
      </p>
    </BaseLayout>
  )
}
