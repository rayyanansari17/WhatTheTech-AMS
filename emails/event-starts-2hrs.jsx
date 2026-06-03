// Email #26 — 2hrs before event: It Starts In 2 Hours - Final Info
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function EventStarts2HrsEmail({ name = 'Hacker', wifiPassword = '', submissionUrl = '#' }) {
  return (
    <BaseLayout preview="Hacking starts in 2 hours! Here's your venue Wi-Fi and check-in info.">
      <div style={{ ...s.badge, backgroundColor: '#FFF7ED', color: '#EA580C', borderColor: '#FED7AA' }}>
        ⏱ Starting In 2 Hours
      </div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>It starts in 2 hours, {name}! ⚡</h1>
      <p style={s.p}>
        The hacking officially kicks off at <strong>11:00 AM</strong>. Here's everything you need
        for a smooth start:
      </p>

      <div style={s.card}>
        <p style={{ ...s.small, fontWeight: 700, color: '#111827', margin: '0 0 10px' }}>📋 On-Site Info</p>
        {wifiPassword && (
          <p style={{ ...s.small, margin: '0 0 6px' }}>📶 <strong>Wi-Fi Password:</strong> {wifiPassword}</p>
        )}
        <p style={{ ...s.small, margin: '0 0 6px' }}>🏁 <strong>Hacking Starts:</strong> 11:00 AM</p>
        <p style={{ ...s.small, margin: '0 0 6px' }}>📤 <strong>Submission Deadline:</strong> Jul 3 · 10:00 AM</p>
        <p style={{ ...s.small, margin: 0 }}>🏆 <strong>Awards:</strong> Jul 3 · 4:30 PM</p>
      </div>

      <p style={s.p}>
        <strong>Submission link will go live at 11:00 AM.</strong> Make sure your team's project
        is submitted before the deadline — late submissions will not be accepted.
      </p>

      <div style={s.btnWrap}>
        <Link href={submissionUrl} style={s.btn}>Go to Submission Portal →</Link>
      </div>

      <Hr style={s.hr} />
      <p style={s.small}>Let's build something amazing. You've got this! 💪</p>
    </BaseLayout>
  )
}
