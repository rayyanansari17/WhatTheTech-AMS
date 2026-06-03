// Email #43 — Admin: Daily Registration Digest
import BaseLayout, { s } from './BaseLayout'

export default function AdminDailyDigestEmail({
  date = '',
  newRegistrations = 0,
  totalRegistrations = 0,
  paidCount = 0,
  unpaidCount = 0,
  totalTeams = 0,
  paymentRevenue = '',
  recentUsers = [],
}) {
  return (
    <BaseLayout preview={`Daily digest: ${newRegistrations} new registrations on ${date}`}>
      <div style={s.badge}>📊 Daily Digest</div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>Registration Digest — {date}</h1>

      <div style={{ display: 'grid', gap: 12, margin: '16px 0' }}>
        <div style={{ ...s.card, margin: 0 }}>
          <p style={{ ...s.small, fontWeight: 700, color: '#111827', margin: '0 0 12px', fontSize: 14 }}>📈 Today's Stats</p>
          <p style={{ ...s.small, margin: '0 0 6px' }}>🆕 <strong>New registrations today:</strong> {newRegistrations}</p>
          <p style={{ ...s.small, margin: '0 0 6px' }}>👥 <strong>Total registrations:</strong> {totalRegistrations}</p>
          <p style={{ ...s.small, margin: '0 0 6px' }}>✅ <strong>Paid:</strong> {paidCount}</p>
          <p style={{ ...s.small, margin: '0 0 6px' }}>⏳ <strong>Unpaid:</strong> {unpaidCount}</p>
          <p style={{ ...s.small, margin: '0 0 6px' }}>🏷 <strong>Teams:</strong> {totalTeams}</p>
          {paymentRevenue && <p style={{ ...s.small, margin: 0 }}>💰 <strong>Revenue:</strong> {paymentRevenue}</p>}
        </div>
      </div>

      {recentUsers.length > 0 && (
        <div style={s.card}>
          <p style={{ ...s.small, fontWeight: 700, color: '#111827', margin: '0 0 10px' }}>🆕 New Registrations</p>
          {recentUsers.slice(0, 10).map((u, i) => (
            <p key={i} style={{ ...s.small, margin: '0 0 5px' }}>
              • {u.name} ({u.email}){u.team ? ` — ${u.team}` : ''}
            </p>
          ))}
          {recentUsers.length > 10 && (
            <p style={{ ...s.small, margin: '6px 0 0', color: '#9CA3AF' }}>
              +{recentUsers.length - 10} more...
            </p>
          )}
        </div>
      )}
    </BaseLayout>
  )
}
