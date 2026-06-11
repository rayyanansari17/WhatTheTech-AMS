import {
  Html, Head, Body, Container, Section, Img,
  Text, Hr, Link, Preview,
} from '@react-email/components'

const styles = {
  body: { backgroundColor: '#F9FAFB', fontFamily: 'Inter, Arial, sans-serif', margin: 0, padding: 0 },
  wrapper: { maxWidth: 580, margin: '0 auto', padding: '32px 16px' },
  header: { backgroundColor: '#1A1A2E', borderRadius: '12px 12px 0 0', padding: '28px 32px', textAlign: 'center' },
  logoText: { color: '#FFFFFF', fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' },
  tagline: { color: '#9CA3AF', fontSize: 13, margin: '4px 0 0', letterSpacing: '0.05em', textTransform: 'uppercase' },
  body_card: { backgroundColor: '#FFFFFF', borderRadius: '0 0 12px 12px', padding: '32px', border: '1px solid #E5E7EB', borderTop: 'none' },
  footer: { textAlign: 'center', padding: '24px 0 0' },
  footerText: { color: '#9CA3AF', fontSize: 12, margin: '4px 0' },
  footerLink: { color: '#46e84b', textDecoration: 'none' },
  hr: { borderColor: '#E5E7EB', margin: '24px 0' },
}

export default function BaseLayout({ preview, children }) {
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://foundersfest-tech.vercel.app'

  return (
    <Html lang="en">
      <Head />
      {preview && <Preview>{preview}</Preview>}
      <Body style={styles.body}>
        <div style={styles.wrapper}>
          {/* Header */}
          <div style={styles.header}>
            <Img
              src="https://app.foundersfest.org/images/logos/logo.png"
              alt="What The Tech"
              width="90"
              height="90"
              style={{ margin: '0 auto 10px', display: 'block' }}
            />
            <p style={styles.tagline}>Founders Fest · Hackathon Edition</p>
          </div>

          {/* Body card */}
          <div style={styles.body_card}>
            {children}
          </div>

          {/* Footer */}
          <div style={styles.footer}>
            <Hr style={styles.hr} />
            <Text style={styles.footerText}>
              What The Tech Hackathon · BITS Pilani, Hyderabad · Jul 2–3, 2026
            </Text>
            <Text style={styles.footerText}>
              <Link href={appUrl} style={styles.footerLink}>Dashboard</Link>
              {' · '}
              <Link href={`mailto:team@foundersfest.org`} style={styles.footerLink}>Contact Us</Link>
            </Text>
            <Text style={{ ...styles.footerText, fontSize: 11, marginTop: 8 }}>
              You're receiving this because you registered for What The Tech Hackathon.
            </Text>
          </div>
        </div>
      </Body>
    </Html>
  )
}

// Shared style helpers exported for templates to use
export const s = {
  h1: { color: '#111827', fontSize: 24, fontWeight: 700, margin: '0 0 8px', lineHeight: '1.3' },
  h2: { color: '#111827', fontSize: 20, fontWeight: 600, margin: '0 0 8px', lineHeight: '1.3' },
  p: { color: '#374151', fontSize: 15, lineHeight: '1.6', margin: '0 0 16px' },
  small: { color: '#6B7280', fontSize: 13, lineHeight: '1.6', margin: '0 0 12px' },
  btn: {
    display: 'inline-block',
    backgroundColor: '#46e84b',
    color: '#FFFFFF',
    fontWeight: 600,
    fontSize: 15,
    padding: '12px 28px',
    borderRadius: 8,
    textDecoration: 'none',
    textAlign: 'center',
  },
  btnSecondary: {
    display: 'inline-block',
    backgroundColor: '#F3F4F6',
    color: '#374151',
    fontWeight: 600,
    fontSize: 15,
    padding: '12px 28px',
    borderRadius: 8,
    textDecoration: 'none',
    textAlign: 'center',
  },
  badge: {
    display: 'inline-block',
    backgroundColor: '#F0FFF4',
    color: '#15803d',
    fontWeight: 600,
    fontSize: 12,
    padding: '4px 12px',
    borderRadius: 999,
    border: '1px solid #46e84b',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  badgeGreen: {
    display: 'inline-block',
    backgroundColor: '#F0FDF4',
    color: '#16A34A',
    fontWeight: 600,
    fontSize: 12,
    padding: '4px 12px',
    borderRadius: 999,
    border: '1px solid #86EFAC',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#F9FAFB',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: '16px 20px',
    margin: '16px 0',
  },
  hr: { borderColor: '#E5E7EB', margin: '24px 0' },
  btnWrap: { textAlign: 'center', margin: '24px 0' },
  accentLine: {
    borderLeft: '4px solid #46e84b',
    paddingLeft: 16,
    margin: '16px 0',
  },
}
