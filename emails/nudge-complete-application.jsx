// Email #5 - App started, not completed (2hr nudge)
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function NudgeCompleteApplicationEmail({ name = 'Hacker', continueUrl = '#' }) {
  return (
    <BaseLayout preview="You left your application unfinished - pick up where you left off!">
      <h1 style={s.h1}>You left something behind 👋</h1>
      <p style={s.p}>
        Hi {name}! You started your registration for <strong>What The Tech Hackathon</strong> but didn't finish.
        Your draft is saved - it only takes 2 more minutes to complete.
      </p>
      <div style={{ ...s.accentLine, borderColor: '#F97316' }}>
        <p style={{ ...s.small, margin: 0 }}>
          Spots are limited. Early applicants get priority consideration for our best tracks.
        </p>
      </div>
      <div style={s.btnWrap}>
        <Link href={continueUrl} style={s.btn}>Complete My Application →</Link>
      </div>
      <Hr style={s.hr} />
      <p style={s.small}>This reminder was sent 2 hours after you started registration.</p>
    </BaseLayout>
  )
}
