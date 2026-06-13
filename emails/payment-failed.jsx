// Email #10 - Payment failed: Payment Failed + Retry Link
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function PaymentFailedEmail({
  name = 'Hacker',
  retryUrl = '#',
  reason = '',
}) {
  return (
    <BaseLayout preview="Payment didn't go through - retry now to secure your spot.">
      <div style={{ ...s.badge, backgroundColor: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' }}>
        Payment Failed
      </div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>Payment didn't go through</h1>
      <p style={s.p}>
        Hi {name}, your payment for What The Tech Hackathon was not successful.
        {reason ? ` Reason: ${reason}.` : ''} Don't worry - your registration is saved and you can retry now.
      </p>

      <div style={{ ...s.accentLine, borderColor: '#F97316' }}>
        <p style={{ ...s.small, margin: 0 }}>
          <strong>Common reasons for failure:</strong> Insufficient funds, card declined, bank timeout, or UPI rejection.
          Try a different payment method if the issue persists.
        </p>
      </div>

      <div style={s.btnWrap}>
        <Link href={retryUrl} style={s.btn}>Retry Payment →</Link>
      </div>

      <p style={{ ...s.small, textAlign: 'center' }}>
        Or pay via a different method on the payment page.
      </p>

      <Hr style={s.hr} />
      <p style={s.small}>
        If your account was charged but you see this email, please contact us immediately at{' '}
        <Link href="mailto:team@foundersfest.org" style={{ color: '#F97316' }}>team@foundersfest.org</Link>
      </p>
    </BaseLayout>
  )
}
