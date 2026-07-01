// Email #23 - All members paid: Team Confirmed - You're In!
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function TeamConfirmedEmail({
  name = 'Hacker',
  teamName = '',
  members = [],
  track = '',
  dashboardUrl = '#',
}) {
  return (
    <BaseLayout preview={`Team ${teamName} is fully confirmed! See you at the hackathon.`}>
      <div style={s.badgeGreen}>Team Confirmed 🎉</div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>You're In, {name}!</h1>
      <p style={s.p}>
        <strong>{teamName}</strong> is officially registered for What The Tech Hackathon.
        Your whole team is confirmed and ready to build.
      </p>

      <div style={s.card}>
        <p style={{ ...s.small, fontWeight: 700, color: '#111827', margin: '0 0 10px' }}>Your Team</p>
        <p style={{ ...s.small, margin: '0 0 4px' }}><strong>Team Name:</strong> {teamName}</p>
        <p style={{ ...s.small, margin: '0 0 4px' }}><strong>Track:</strong> {track}</p>
        {members.length > 0 && (
          <p style={{ ...s.small, margin: '0 0 4px' }}>
            <strong>Members:</strong> {members.join(', ')}
          </p>
        )}
        <p style={{ ...s.small, margin: '8px 0 0' }}><strong>Event:</strong> August 6–9, 2026 · Gachibowli Indoor Stadium, Hyderabad</p>
      </div>

      <p style={s.p}><strong>Pre-event checklist:</strong></p>
      <p style={{ ...s.p, paddingLeft: 16 }}>
        ✅ All members registered and paid<br />
        📱 Check the Dashboard for schedule updates<br />
        💻 Prepare your dev environment<br />
        🍕 Arrive by 8:00 AM on August 6th for check-in
      </p>

      <div style={s.btnWrap}>
        <Link href={dashboardUrl} style={s.btn}>Go to Dashboard →</Link>
      </div>

      <Hr style={s.hr} />
      <p style={s.small}>Good luck - the team at Founders Fest can't wait to see what you build!</p>
    </BaseLayout>
  )
}
