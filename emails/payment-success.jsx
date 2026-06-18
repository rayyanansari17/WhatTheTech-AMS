// Email #9 - Payment captured: Payment Success + Receipt
import { Link, Hr, Img } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function PaymentSuccessEmail({
  name = 'Hacker',
  teamName = '',
  orderId = '',
  amount = '₹598',
  dashboardUrl = '#',
  qrDataUrl = null,
}) {
  return (
    <BaseLayout preview="Payment confirmed! You're officially registered for What The Tech Hackathon.">
      <div style={s.badgeGreen}>Payment Confirmed</div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>You're officially in! 🎉</h1>
      <p style={s.p}>
        Your payment was successful and your spot at <strong>What The Tech Hackathon</strong> is confirmed.
        Get ready to build, compete, and win.
      </p>

      <div style={s.card}>
        <p style={{ ...s.small, fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>Payment Receipt</p>
        {teamName && <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Team:</strong> {teamName}</p>}
        <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Amount Paid:</strong> {amount}</p>
        {orderId && <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Order ID:</strong> {orderId}</p>}
        <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Event:</strong> August 6-7, 2026</p>
        <p style={{ ...s.small, margin: 0 }}><strong>Venue:</strong> GMC Balayogi Indoor Stadium, Gachibowli, Hyderabad</p>
      </div>

      {qrDataUrl && (
        <div style={{ textAlign: 'center', margin: '24px 0' }}>
          <p style={{ ...s.p, fontWeight: 700, marginBottom: 8 }}>Your Team Check-in QR Code</p>
          <p style={{ ...s.small, color: '#6B7280', marginBottom: 16 }}>
            All team members share this QR. Show it at the venue entrance on event day.
          </p>
          <div style={{
            display: 'inline-block',
            background: '#ffffff',
            border: '1px solid #E5E7EB',
            borderRadius: 12,
            padding: 16,
          }}>
            <Img
              src={qrDataUrl}
              width="200"
              height="200"
              alt="Team Check-in QR Code"
              style={{ display: 'block' }}
            />
          </div>
          <p style={{ ...s.small, color: '#9CA3AF', marginTop: 8 }}>
            Save this email or download the QR from your dashboard.
          </p>
        </div>
      )}

      <p style={s.p}><strong>What's next?</strong></p>
      <p style={{ ...s.p, paddingLeft: 16 }}>
        Share your team code with members<br />
        Keep an eye out for pre-event emails<br />
        Check the schedule at the venue
      </p>

      <div style={s.btnWrap}>
        <Link href={dashboardUrl} style={s.btn}>Go to Dashboard</Link>
      </div>

      <Hr style={s.hr} />
      <p style={s.small}>
        Save this email as your payment receipt. Need help?{' '}
        <Link href="mailto:team@foundersfest.org" style={{ color: '#F97316' }}>team@foundersfest.org</Link>
      </p>
    </BaseLayout>
  )
}
