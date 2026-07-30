import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function SavedSpotApologyEmail({ name = 'Hacker', dashboardUrl = '#' }) {
  return (
    <BaseLayout preview="Sorry for the mixed signal in our last email -- a quick clarification from us.">
      <div style={{ ...s.badge, backgroundColor: '#FEF3C7', color: '#92400E', borderColor: '#FDE68A' }}>
        Quick Clarification
      </div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>Sorry for the confusion, {name}</h1>
      <p style={s.p}>
        Earlier today you received an email from us saying "We Saved Your Spot" and encouraging you
        to log back in and continue your registration.
      </p>
      <p style={s.p}>
        Shortly after that, we made the decision to <strong>postpone What The Tech Hackathon</strong> --
        so that email landed at an awkward moment and sent a confusing message. That's on us, and we're
        genuinely sorry for the mixed signal.
      </p>

      <div style={{ ...s.accentLine, borderLeftColor: '#F59E0B' }}>
        <p style={{ ...s.small, margin: '0 0 6px', fontWeight: 700, color: '#92400E' }}>
          To be clear
        </p>
        <p style={{ ...s.small, margin: 0 }}>
          The August 6-7 dates are postponed. New dates aren't confirmed yet.
          Your account and any progress you've made are completely safe -- there's no rush and
          nothing you need to do right now.
        </p>
      </div>

      <p style={s.p}>
        Whenever you're ready to continue, everything will be waiting exactly as you left it.
        We'll email everyone the moment new dates are locked in.
      </p>

      <div style={s.btnWrap}>
        <Link href={dashboardUrl} style={s.btn}>Go to Your Dashboard →</Link>
      </div>

      <Hr style={s.hr} />
      <p style={{ ...s.small, color: '#6B7280' }}>
        Thanks for your patience. Reply to this email anytime if you have questions.
      </p>
    </BaseLayout>
  )
}
