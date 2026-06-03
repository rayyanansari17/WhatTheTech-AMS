// Email #40 — Post-event feedback request
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function FeedbackEmail({ name = 'Hacker', feedbackUrl = '#' }) {
  return (
    <BaseLayout preview="How was your experience at What The Tech Hackathon? Tell us!">
      <h1 style={s.h1}>How was your experience, {name}? 💬</h1>
      <p style={s.p}>
        What The Tech Hackathon just wrapped up and we'd love to hear from you.
        Your feedback directly shapes how we make the next event even better.
      </p>
      <p style={s.p}>
        The survey takes less than <strong>3 minutes</strong> to complete.
      </p>
      <div style={s.btnWrap}>
        <Link href={feedbackUrl} style={s.btn}>Share My Feedback →</Link>
      </div>
      <p style={{ ...s.p, textAlign: 'center', color: '#6B7280', marginTop: 8 }}>
        We read every response — your input matters!
      </p>
      <Hr style={s.hr} />
      <p style={s.small}>Thank you for being part of What The Tech Hackathon 2026. 🙏</p>
    </BaseLayout>
  )
}
