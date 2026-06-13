// Email #42 - Admin: Payment Failure Alert
import BaseLayout, { s } from './BaseLayout'

export default function AdminPaymentFailureEmail({ userName = '', userEmail = '', teamName = '', orderId = '', amount = '', failedAt = '', reason = '' }) {
  return (
    <BaseLayout preview={`⚠️ Payment failure: ${userName} (${orderId})`}>
      <div style={{ ...s.badge, backgroundColor: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' }}>
        ⚠️ Payment Failure
      </div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>Payment failure detected</h1>
      <div style={s.card}>
        <p style={{ ...s.small, margin: '0 0 6px' }}><strong>User:</strong> {userName} ({userEmail})</p>
        {teamName && <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Team:</strong> {teamName}</p>}
        {orderId && <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Order ID:</strong> {orderId}</p>}
        {amount && <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Amount:</strong> {amount}</p>}
        {reason && <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Reason:</strong> {reason}</p>}
        {failedAt && <p style={{ ...s.small, margin: 0 }}><strong>Time:</strong> {failedAt}</p>}
      </div>
      <p style={{ ...s.small, color: '#6B7280' }}>
        A retry reminder will be automatically sent to the user in 2 hours.
      </p>
    </BaseLayout>
  )
}
