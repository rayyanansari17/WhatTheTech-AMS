// Email #25 - 24hrs before event: Tomorrow Is Hackathon Day!
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function EventTomorrowEmail({ name = 'Hacker', teamName = '', venueUrl = '#' }) {
  return (
    <BaseLayout preview="Tomorrow is hackathon day! Here's your final checklist.">
      <div style={s.badge}>🔥 Tomorrow Is The Day</div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>Tomorrow is hackathon day, {name}! 🎉</h1>
      <p style={s.p}>
        The wait is almost over. {teamName && <><strong>{teamName}</strong>, get ready to build.</>}
        Here's your final day-before checklist:
      </p>

      <div style={s.card}>
        <p style={{ ...s.small, margin: '0 0 8px', fontWeight: 700, color: '#111827' }}>✅ Final Checklist</p>
        <p style={{ ...s.small, margin: '0 0 5px' }}>□ Laptop fully charged + charger packed</p>
        <p style={{ ...s.small, margin: '0 0 5px' }}>□ ID card ready for check-in</p>
        <p style={{ ...s.small, margin: '0 0 5px' }}>□ Team idea / rough plan discussed</p>
        <p style={{ ...s.small, margin: '0 0 5px' }}>□ Dev environment set up and tested</p>
        <p style={{ ...s.small, margin: 0 }}>□ Know how to reach Gachibowli Indoor Stadium</p>
      </div>

      <div style={s.card}>
        <p style={{ ...s.small, margin: '0 0 4px' }}>⏰ <strong>Check-in opens at 8:00 AM</strong></p>
        <p style={{ ...s.small, margin: '0 0 4px' }}>📍 Gachibowli Indoor Stadium, Hyderabad</p>
        <p style={{ ...s.small, margin: 0 }}>🚗 Plan your travel - arrive early!</p>
      </div>

      <div style={s.btnWrap}>
        <Link href={venueUrl} style={s.btn}>Get Directions →</Link>
      </div>

      <Hr style={s.hr} />
      <p style={s.small}>Good luck tomorrow - the Founders Fest team is rooting for you! 🚀</p>
    </BaseLayout>
  )
}
