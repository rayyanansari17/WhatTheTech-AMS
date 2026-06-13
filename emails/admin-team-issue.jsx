// Email #44 - Admin: Team Payment Issue Flag
import BaseLayout, { s } from './BaseLayout'

export default function AdminTeamIssueEmail({ teamName = '', leaderName = '', leaderEmail = '', memberCount = 0, paidCount = 0, teamId = '', createdAt = '' }) {
  return (
    <BaseLayout preview={`⚠️ Team payment issue: ${teamName}`}>
      <div style={{ ...s.badge, backgroundColor: '#FFFBEB', color: '#D97706', borderColor: '#FCD34D' }}>
        ⚠️ Team Payment Issue
      </div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>Team with unpaid members flagged</h1>
      <div style={s.card}>
        <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Team:</strong> {teamName}</p>
        <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Leader:</strong> {leaderName} ({leaderEmail})</p>
        <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Members:</strong> {memberCount} total, {paidCount} paid</p>
        <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Unpaid:</strong> {memberCount - paidCount}</p>
        {createdAt && <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Created:</strong> {createdAt}</p>}
        {teamId && <p style={{ ...s.small, margin: 0 }}><strong>Team ID:</strong> {teamId}</p>}
      </div>
      <p style={{ ...s.small, color: '#6B7280' }}>
        Nudge emails have been (or will be) automatically sent to the team leader.
      </p>
    </BaseLayout>
  )
}
