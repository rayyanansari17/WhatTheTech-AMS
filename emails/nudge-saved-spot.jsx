// Email #8 - Signed up, never logged in again (3 days)
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function NudgeSavedSpotEmail({ name = 'Hacker', loginUrl = '#' }) {
  return (
    <BaseLayout preview="We saved your spot - but it won't last forever.">
      <h1 style={s.h1}>We saved your spot 🔒</h1>
      <p style={s.p}>
        Hi {name}! You signed up for <strong>What The Tech Hackathon</strong> 3 days ago but haven't
        logged back in to complete your registration.
      </p>
      <p style={s.p}>
        We've held your spot - but spots are limited and filling up daily.
        Log in now to secure your place.
      </p>
      <div style={s.card}>
        <p style={{ ...s.small, margin: 0, fontWeight: 600 }}>Why join?</p>
        <p style={{ ...s.small, margin: '8px 0 0' }}>🏆 Win from ₹1.5L+ prize pool</p>
        <p style={{ ...s.small, margin: '4px 0 0' }}>🤝 Network with 1500+ builders</p>
        <p style={{ ...s.small, margin: '4px 0 0' }}>🚀 Ship a real product in 24 hours</p>
        <p style={{ ...s.small, margin: '4px 0 0' }}>📍 BITS Pilani, Hyderabad · July 2–3, 2026</p>
      </div>
      <div style={s.btnWrap}>
        <Link href={loginUrl} style={s.btn}>Log In & Register →</Link>
      </div>
      <Hr style={s.hr} />
    </BaseLayout>
  )
}
