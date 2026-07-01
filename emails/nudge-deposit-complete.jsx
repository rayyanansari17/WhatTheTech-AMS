// Email: Remind deposit holders to complete balance payment before deadline
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function NudgeDepositCompleteEmail({
  name = 'Hacker',
  teamName = '',
  balanceAmount = '₹1,150',
  deadline = 'the event date',
  paymentUrl = '#',
}) {
  return (
    <BaseLayout preview={`Complete your payment of ${balanceAmount} by ${deadline} to confirm your spot.`}>
      <div style={{ ...s.badgeGreen, background: '#FEF3C7', color: '#92400E' }}>Action Required</div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>Complete your payment 💳</h1>
      <p style={s.p}>
        Hi {name}, you reserved a spot for <strong>What The Tech Hackathon</strong> with a deposit, but your
        registration isn't confirmed yet.
      </p>

      <div style={s.card}>
        {teamName && <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Team:</strong> {teamName}</p>}
        <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Balance Due:</strong> {balanceAmount}</p>
        <p style={{ ...s.small, margin: 0 }}><strong>Pay Before:</strong> {deadline}</p>
      </div>

      <p style={s.p}>
        Pay the remaining balance before the deadline to lock in your spot. After the deadline,
        reserved spots will be released to the waitlist.
      </p>

      <div style={s.btnWrap}>
        <Link href={paymentUrl} style={s.btn}>Complete Payment: {balanceAmount}</Link>
      </div>

      <Hr style={s.hr} />
      <p style={s.small}>
        Need help?{' '}
        <Link href="mailto:team@foundersfest.org" style={{ color: '#F97316' }}>team@foundersfest.org</Link>
      </p>
    </BaseLayout>
  )
}
