// Email #41 - Admin: New Registration Alert
import BaseLayout, { s } from './BaseLayout'

export default function AdminNewRegistrationEmail({ userName = '', userEmail = '', teamName = '', track = '', paymentStatus = 'pending', registeredAt = '' }) {
  return (
    <BaseLayout preview={`New registration: ${userName} (${teamName})`}>
      <div style={s.badge}>New Registration</div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>New participant registered</h1>
      <div style={s.card}>
        <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Name:</strong> {userName}</p>
        <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Email:</strong> {userEmail}</p>
        {teamName && <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Team:</strong> {teamName}</p>}
        {track && <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Track:</strong> {track}</p>}
        <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Payment:</strong> {paymentStatus}</p>
        {registeredAt && <p style={{ ...s.small, margin: 0 }}><strong>Registered:</strong> {registeredAt}</p>}
      </div>
    </BaseLayout>
  )
}
