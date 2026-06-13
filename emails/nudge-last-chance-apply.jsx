// Email #6 - App started, not completed (24hr nudge)
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function NudgeLastChanceApplyEmail({ name = 'Hacker', continueUrl = '#' }) {
  return (
    <BaseLayout preview="Last chance - your application is still incomplete.">
      <div style={{ ...s.badge, backgroundColor: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' }}>
        Final Reminder
      </div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>Last chance, {name}</h1>
      <p style={s.p}>
        It's been 24 hours since you started your registration and it's still incomplete.
        Spots at <strong>What The Tech Hackathon</strong> are filling up fast.
      </p>
      <p style={s.p}>
        <strong>Complete your application now</strong> before your reserved spot is released to the waitlist.
      </p>
      <div style={s.btnWrap}>
        <Link href={continueUrl} style={s.btn}>Finish Registration Now →</Link>
      </div>
      <Hr style={s.hr} />
      <p style={s.small}>
        If you no longer wish to participate, you can ignore this email.
      </p>
    </BaseLayout>
  )
}
