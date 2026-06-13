// Email #11 - Payment failed, not retried (2hr nudge)
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function NudgeRetryPaymentEmail({ name = 'Hacker', retryUrl = '#' }) {
  return (
    <BaseLayout preview="Still having trouble with payment? We can help.">
      <h1 style={s.h1}>Still having trouble? 🤔</h1>
      <p style={s.p}>
        Hi {name}! Your payment for <strong>What The Tech Hackathon</strong> failed 2 hours ago
        and we noticed you haven't retried yet.
      </p>
      <p style={s.p}>Your registration is still saved - complete payment now to lock in your spot.</p>
      <div style={{ ...s.accentLine }}>
        <p style={{ ...s.small, margin: 0 }}>
          <strong>Tips to fix payment issues:</strong><br />
          • Try a different card or UPI ID<br />
          • Ensure sufficient balance<br />
          • Disable browser extensions / use incognito<br />
          • Contact your bank if the issue persists
        </p>
      </div>
      <div style={s.btnWrap}>
        <Link href={retryUrl} style={s.btn}>Retry Payment →</Link>
      </div>
      <Hr style={s.hr} />
      <p style={s.small}>
        Charged but seeing this email? Contact us at{' '}
        <Link href="mailto:team@foundersfest.org" style={{ color: '#F97316' }}>team@foundersfest.org</Link>
      </p>
    </BaseLayout>
  )
}
