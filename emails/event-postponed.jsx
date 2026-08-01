import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function EventPostponedEmail({
  name = 'Hacker',
  teamName = '',
  dashboardUrl = '#',
  workshopVenue = '',
  workshopRsvpUrl = '',
}) {
  return (
    <BaseLayout preview="An important update on What The Tech Hackathon -- we're revising the event dates.">
      <div style={{ ...s.badge, backgroundColor: '#FEF3C7', color: '#92400E', borderColor: '#FDE68A' }}>
        Event Update
      </div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>What The Tech Hackathon is being postponed</h1>
      <p style={s.p}>
        Hi {name}, we wanted to reach you directly with an important update.
      </p>
      <p style={s.p}>
        <strong>What The Tech Hackathon, originally scheduled for August 6-7, 2026, has been postponed.</strong>{' '}
        We're still finalizing the new dates and will share them as soon as they're confirmed.
      </p>

      <div style={{ ...s.accentLine, borderLeftColor: '#F59E0B' }}>
        <p style={{ ...s.small, margin: '0 0 6px', fontWeight: 700, color: '#92400E' }}>
          Nothing else changes
        </p>
        <p style={{ ...s.small, margin: 0 }}>
          Your registration{teamName ? <> for <strong>{teamName}</strong></> : ''} and payment status
          are fully preserved. There's nothing you need to do right now -- just sit tight.
        </p>
      </div>

      {workshopRsvpUrl && (
        <>
          <Hr style={{ ...s.hr, margin: '24px 0' }} />
          <div style={{ ...s.badge, backgroundColor: '#ECFDF5', color: '#065F46', borderColor: '#A7F3D0', marginBottom: 12 }}>
            Already Planned Your Trip?
          </div>
          <p style={s.p}>
            <strong>If you've already booked your travel to Hyderabad for August 6-7, we've got something for you.</strong>
          </p>
          <p style={s.p}>
            We've organized a set of workshops on August 6-7 that are closely aligned with the hackathon themes --
            a great opportunity to connect with the community, learn, and make your visit worthwhile.
          </p>
          {workshopVenue && (
            <p style={{ ...s.small, color: '#6B7280', margin: '-8px 0 16px' }}>
              📍 {workshopVenue}
            </p>
          )}
          <p style={{ ...s.p, fontSize: 13, color: '#6B7280' }}>
            <em>Haven't booked travel yet? No action needed -- there's no obligation to attend.
            Just sit tight and we'll reach out with the new hackathon dates as soon as they're locked in.</em>
          </p>
          <div style={s.btnWrap}>
            <Link href={workshopRsvpUrl} style={{ ...s.btn, backgroundColor: '#059669' }}>
              Reserve Your Workshop Spot →
            </Link>
          </div>
        </>
      )}

      <p style={s.p}>
        We'll email you the new dates the moment they're confirmed -- stay tuned.
      </p>

      <div style={s.btnWrap}>
        <Link href={dashboardUrl} style={s.btn}>View Your Dashboard →</Link>
      </div>

      <Hr style={s.hr} />
      <p style={{ ...s.small, color: '#6B7280' }}>
        Questions? Reply to this email or reach us at hackathon@foundersfest.org.
      </p>
    </BaseLayout>
  )
}
