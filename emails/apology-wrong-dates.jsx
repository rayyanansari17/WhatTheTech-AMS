import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function ApologyWrongDatesEmail({ name = 'Participant', teamName = '', dashboardUrl = '#' }) {
  return (
    <BaseLayout preview="Important correction: please ignore our previous event emails — they were sent in error.">
      <div style={{ ...s.badge, backgroundColor: '#FEF3C7', color: '#92400E' }}>Correction Notice</div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>We owe you an apology</h1>
      <p style={s.p}>
        Hi {name}, we're reaching out to correct a mistake our system made.
      </p>
      <p style={s.p}>
        Between <strong>July 5 and July 7</strong>, you received emails from us with subjects like
        "Event is Tomorrow", "Event Starts in 2 Hours", "1 Hour Left to Submit", and/or
        "Submission Window Closed" — addressed to your team <strong>{teamName}</strong>.
      </p>
      <p style={s.p}>
        <strong>These were sent in error.</strong> Our scheduling system had the wrong dates
        configured and fired these emails a full month early.
      </p>

      <div style={{ ...s.accentLine, borderLeftColor: '#10B981' }}>
        <p style={{ ...s.small, margin: '0 0 6px', fontWeight: 700, color: '#065F46' }}>
          The What The Tech Hackathon is still on — August 6-7, 2026
        </p>
        <p style={{ ...s.small, margin: 0 }}>
          Gachibowli Indoor Stadium, Hyderabad. Nothing has changed.
        </p>
      </div>

      <p style={s.p}>
        If you received a "Submission Window Closed" email stating your team is not eligible
        for judging — <strong>please disregard it completely.</strong> There is no project
        submission requirement at this stage. Your registration is fully valid and your
        team's participation is confirmed.
      </p>

      <div style={s.btnWrap}>
        <Link href={dashboardUrl} style={s.btn}>Go to Your Dashboard →</Link>
      </div>

      <Hr style={s.hr} />
      <p style={{ ...s.small, color: '#6B7280' }}>
        We sincerely apologize for the confusion this caused. If you have any questions,
        reply to this email or reach us at hackathon@foundersfest.org.
      </p>
    </BaseLayout>
  )
}
