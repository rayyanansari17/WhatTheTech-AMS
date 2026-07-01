// Email: Deposit payment confirmed - spot reserved, balance still due
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function DepositSuccessEmail({
  name = 'Hacker',
  teamName = '',
  depositAmount = '₹149',
  balanceAmount = '₹1,150',
  dashboardUrl = '#',
}) {
  return (
    <BaseLayout preview="Your ₹149 deposit is confirmed! Your spot is reserved at What The Tech Hackathon.">
      <div style={s.badgeGreen}>Spot Reserved</div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>Your spot is reserved! 🔒</h1>
      <p style={s.p}>
        Hi {name}, your <strong>{depositAmount} deposit</strong> for <strong>What The Tech Hackathon</strong> has been received.
        Your spot is held. Complete the balance payment before the event to confirm your registration.
      </p>

      <div style={s.card}>
        <p style={{ ...s.small, fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>Deposit Summary</p>
        {teamName && <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Team:</strong> {teamName}</p>}
        <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Deposit Paid:</strong> {depositAmount}</p>
        <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Balance Due:</strong> {balanceAmount}</p>
        <p style={{ ...s.small, margin: 0 }}><strong>Event:</strong> August 6-7, 2026 · GMC Balayogi, Hyderabad</p>
      </div>

      <p style={s.p}>
        <strong>Important:</strong> This deposit is non-refundable. Your registration is only confirmed once the
        full balance is paid. Pay the remaining {balanceAmount} from your dashboard before the payment deadline.
      </p>

      <div style={s.btnWrap}>
        <Link href={dashboardUrl} style={s.btn}>Go to Dashboard</Link>
      </div>

      <Hr style={s.hr} />
      <p style={s.small}>
        Questions?{' '}
        <Link href="mailto:team@foundersfest.org" style={{ color: '#F97316' }}>team@foundersfest.org</Link>
      </p>
    </BaseLayout>
  )
}
