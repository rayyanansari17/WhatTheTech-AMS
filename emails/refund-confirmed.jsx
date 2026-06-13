// Email #14 - Refund processed
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function RefundConfirmedEmail({ name = 'Hacker', amount = '', orderId = '', eta = '5–7 business days' }) {
  return (
    <BaseLayout preview="Your refund has been initiated - it'll appear in your account soon.">
      <div style={s.badge}>Refund Initiated</div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>Refund on its way, {name}</h1>
      <p style={s.p}>
        We've initiated your refund for What The Tech Hackathon registration.
        The amount will be credited back to your original payment method.
      </p>
      <div style={s.card}>
        {amount && <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Refund Amount:</strong> {amount}</p>}
        {orderId && <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Order ID:</strong> {orderId}</p>}
        <p style={{ ...s.small, margin: 0 }}><strong>Expected Timeline:</strong> {eta}</p>
      </div>
      <p style={s.p}>
        We're sorry to see you go! If you change your mind and spots are still available,
        you're welcome to re-register.
      </p>
      <Hr style={s.hr} />
      <p style={s.small}>
        Questions about your refund? Contact{' '}
        <Link href="mailto:team@foundersfest.org" style={{ color: '#F97316' }}>team@foundersfest.org</Link>
      </p>
    </BaseLayout>
  )
}
