// Email #12 — App complete, not paid (1hr nudge)
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function NudgeCompletePaymentEmail({ name = 'Hacker', teamName = '', amount = '₹598', paymentUrl = '#' }) {
  return (
    <BaseLayout preview="Your registration is complete — just one step left: payment!">
      <h1 style={s.h1}>Almost there, {name}! 💳</h1>
      <p style={s.p}>
        Your profile and team setup for <strong>What The Tech Hackathon</strong> are complete.
        The only thing left is payment to confirm your spot.
      </p>
      <div style={s.card}>
        {teamName && <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Team:</strong> {teamName}</p>}
        <p style={{ ...s.small, margin: 0 }}><strong>Amount Due:</strong> {amount}</p>
      </div>
      <div style={s.btnWrap}>
        <Link href={paymentUrl} style={s.btn}>Pay {amount} Now →</Link>
      </div>
      <Hr style={s.hr} />
      <p style={s.small}>Payment takes less than 2 minutes. Secure and powered by Cashfree.</p>
    </BaseLayout>
  )
}
