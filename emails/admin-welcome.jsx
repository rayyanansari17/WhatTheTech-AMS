import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function AdminWelcomeEmail({
  adminName = '',
  adminEmail = '',
  appUrl = 'https://app.foundersfest.org',
}) {
  const displayName = adminName || adminEmail

  return (
    <BaseLayout preview="You've been granted admin access to the What The Tech Hackathon AMS.">
      <div style={s.badge}>Admin Access Granted</div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>Welcome to the team{adminName ? `, ${adminName}` : ''}!</h1>
      <p style={s.p}>
        You've been granted <strong>admin access</strong> to the What The Tech Hackathon management
        panel. You can now manage registrations, teams, payments, check-ins, and more.
      </p>

      <div style={s.card}>
        <p style={{ ...s.small, margin: '0 0 6px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 11 }}>
          Your admin login
        </p>
        <p style={{ ...s.p, margin: 0, fontWeight: 600 }}>{adminEmail}</p>
      </div>

      <p style={s.p}>
        Log in with this email address (or your connected Google account) and you'll be
        automatically redirected to the admin panel.
      </p>

      <div style={s.btnWrap}>
        <Link href={`${appUrl}/admin`} style={s.btn}>Go to Admin Panel →</Link>
      </div>

      <Hr style={s.hr} />
      <p style={s.small}>
        If you believe this was sent in error, contact{' '}
        <Link href="mailto:team@foundersfest.org" style={{ color: '#46e84b' }}>
          team@foundersfest.org
        </Link>.
      </p>
    </BaseLayout>
  )
}
