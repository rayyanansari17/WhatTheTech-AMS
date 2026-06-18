// Email #7 - Logged in, no action taken (48hr nudge)
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function NudgeSpotWaitingEmail({ name = 'Hacker', dashboardUrl = '#' }) {
  return (
    <BaseLayout preview="Your spot is still waiting - don't miss out on What The Tech Hackathon!">
      <h1 style={s.h1}>Your spot is waiting, {name} ⏳</h1>
      <p style={s.p}>
        You logged into the What The Tech Hackathon portal but haven't completed registration yet.
        Your spot is still open, but it won't be for long.
      </p>
      <div style={s.card}>
        <p style={{ ...s.small, margin: 0 }}>
          🏆 ₹1.5L+ prize pool · 📍 GMC Balayogi Indoor Stadium, Hyderabad · 🗓 August 6–9, 2026
        </p>
      </div>
      <div style={s.btnWrap}>
        <Link href={dashboardUrl} style={s.btn}>Claim My Spot →</Link>
      </div>
      <Hr style={s.hr} />
    </BaseLayout>
  )
}
