// Email #34 — QR code scanned: Check-in Confirmed!
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function CheckinConfirmedEmail({ name = 'Hacker', teamName = '', checkinTime = '', dashboardUrl = '#' }) {
  return (
    <BaseLayout preview="Check-in confirmed! You're officially at the hackathon.">
      <div style={s.badgeGreen}>Checked In ✓</div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>Welcome to the hackathon, {name}! 🙌</h1>
      <p style={s.p}>
        Your check-in has been confirmed{teamName ? ` for team ${teamName}` : ''}.
        You're officially at <strong>What The Tech Hackathon</strong>. Let the building begin!
      </p>
      <div style={s.card}>
        {checkinTime && <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Checked in at:</strong> {checkinTime}</p>}
        <p style={{ ...s.small, margin: '0 0 6px' }}>⚡ <strong>Hacking starts:</strong> 11:00 AM</p>
        <p style={{ ...s.small, margin: '0 0 6px' }}>📤 <strong>Submission deadline:</strong> Jul 3 · 10:00 AM</p>
        <p style={{ ...s.small, margin: 0 }}>🏆 <strong>Awards:</strong> Jul 3 · 4:30 PM</p>
      </div>
      <div style={s.btnWrap}>
        <Link href={dashboardUrl} style={s.btn}>Go to Dashboard →</Link>
      </div>
      <Hr style={s.hr} />
      <p style={s.small}>Good luck! Build fast, build well. 🚀</p>
    </BaseLayout>
  )
}
