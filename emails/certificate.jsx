// Email #39 - Certificate of Participation
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function CertificateEmail({ name = 'Hacker', teamName = '', certificateUrl = '#' }) {
  return (
    <BaseLayout preview="Your certificate of participation is ready to download!">
      <div style={s.badgeGreen}>🎓 Certificate Ready</div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>Your certificate is ready, {name}!</h1>
      <p style={s.p}>
        Thank you for participating in <strong>What The Tech Hackathon 2026</strong>
        {teamName ? ` as part of ${teamName}` : ''}. Your attendance has been confirmed
        and your certificate of participation is ready to download.
      </p>
      <div style={s.card}>
        <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Participant:</strong> {name}</p>
        {teamName && <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Team:</strong> {teamName}</p>}
        <p style={{ ...s.small, margin: 0 }}><strong>Event:</strong> What The Tech Hackathon · July 2–3, 2026</p>
      </div>
      <p style={s.p}>
        Add it to your LinkedIn, resume, or portfolio to showcase your achievement!
      </p>
      <div style={s.btnWrap}>
        <Link href={certificateUrl} style={s.btn}>Download Certificate →</Link>
      </div>
      <Hr style={s.hr} />
      <p style={s.small}>Thank you for building with us. See you at the next one! 🚀</p>
    </BaseLayout>
  )
}
