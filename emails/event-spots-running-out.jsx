// Email #27 - Registration spots < 20: Only 20 Spots Left!
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function EventSpotsRunningOutEmail({ name = 'Hacker', spotsLeft = 20, registerUrl = '#' }) {
  return (
    <BaseLayout preview={`Only ${spotsLeft} spots left at What The Tech Hackathon - act now!`}>
      <div style={{ ...s.badge, backgroundColor: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' }}>
        🚨 Only {spotsLeft} Spots Left
      </div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>Almost sold out, {name}!</h1>
      <p style={s.p}>
        What The Tech Hackathon is nearly full - only <strong>{spotsLeft} spots</strong> remain.
        Complete your registration immediately before they're gone.
      </p>
      <div style={s.btnWrap}>
        <Link href={registerUrl} style={s.btn}>Secure My Spot Now →</Link>
      </div>
      <Hr style={s.hr} />
      <p style={s.small}>Once we hit capacity, registrations will close. No exceptions.</p>
    </BaseLayout>
  )
}
