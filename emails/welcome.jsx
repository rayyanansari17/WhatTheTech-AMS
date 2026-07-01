// Email #3 - First Google OAuth login: Welcome
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function WelcomeEmail({ name = 'Hacker', dashboardUrl = '#' }) {
  return (
    <BaseLayout preview="Welcome to What The Tech Hackathon! Your journey starts here.">
      <div style={s.badge}>You're In 🎉</div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>Welcome, {name}!</h1>
      <p style={s.p}>
        You've just taken the first step toward building something extraordinary.
        What The Tech Hackathon is where the next generation of founders ship real products -
        in 36 hours, at Gachibowli Indoor Stadium, Hyderabad.
      </p>

      <div style={s.card}>
        <p style={{ ...s.small, margin: 0, fontWeight: 600, color: '#111827' }}>📅 Event Details</p>
        <p style={{ ...s.small, margin: '8px 0 0' }}>📍 Gachibowli Indoor Stadium, Hyderabad</p>
        <p style={{ ...s.small, margin: '4px 0 0' }}>🗓 August 6–9, 2026</p>
        <p style={{ ...s.small, margin: '4px 0 0' }}>🏆 ₹1.5L+ Prize Pool</p>
      </div>

      <p style={s.p}>
        <strong>Your next step:</strong> Complete your profile and create or join a team to lock in your spot.
      </p>

      <div style={s.btnWrap}>
        <Link href={dashboardUrl} style={s.btn}>Complete Your Registration →</Link>
      </div>

      <Hr style={s.hr} />
      <p style={s.small}>
        Questions? Reply to this email or reach us at{' '}
        <Link href="mailto:team@foundersfest.org" style={{ color: '#F97316' }}>team@foundersfest.org</Link>
      </p>
    </BaseLayout>
  )
}
