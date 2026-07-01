// Email #24 - 7 days before event: Save The Date + Schedule
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function EventSaveTheDateEmail({ name = 'Hacker', dashboardUrl = '#', scheduleUrl = '#' }) {
  return (
    <BaseLayout preview="7 days to go! Here's your full event schedule and what to bring.">
      <div style={s.badge}>⚡ 7 Days To Go</div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>It's almost time, {name}! 🚀</h1>
      <p style={s.p}>
        What The Tech Hackathon is <strong>one week away</strong>. Here's everything you need to know before you arrive.
      </p>

      <div style={s.card}>
        <p style={{ ...s.small, fontWeight: 700, color: '#111827', margin: '0 0 10px' }}>📅 Schedule Overview</p>
        <p style={{ ...s.small, margin: '0 0 6px' }}>🗓 <strong>Aug 6 · 8:00 AM</strong> - Registration & Check-in</p>
        <p style={{ ...s.small, margin: '0 0 6px' }}>⚡ <strong>Aug 6 · 9:00 AM</strong> - Hacking Begins (36 hours)</p>
        <p style={{ ...s.small, margin: '0 0 6px' }}>📤 <strong>Aug 7 · 10:00 AM</strong> - Submission Deadline</p>
        <p style={{ ...s.small, margin: '0 0 6px' }}>🏆 <strong>Aug 7 · 4:30 PM</strong> - Awards Ceremony</p>
        <p style={{ ...s.small, margin: 0 }}>📍 <strong>Venue:</strong> Gachibowli Indoor Stadium, Hyderabad</p>
      </div>

      <p style={s.p}><strong>What to bring:</strong></p>
      <p style={{ ...s.p, paddingLeft: 16 }}>
        💻 Laptop + charger<br />
        🪪 Valid student/government ID<br />
        🛏 Sleeping bag or pillow (optional)<br />
        💊 Any personal medications<br />
        🎒 Change of clothes
      </p>

      <div style={s.btnWrap}>
        <Link href={scheduleUrl} style={s.btn}>View Full Schedule →</Link>
      </div>

      <Hr style={s.hr} />
      <p style={s.small}>See you there! - Team Founders Fest</p>
    </BaseLayout>
  )
}
