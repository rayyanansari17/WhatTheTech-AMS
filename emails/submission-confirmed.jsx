// Email #29 - Submission uploaded: Project Submission Confirmed
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function SubmissionConfirmedEmail({ name = 'Hacker', teamName = '', projectTitle = '', submissionUrl = '#' }) {
  return (
    <BaseLayout preview={`Project "${projectTitle}" submitted! You're in the running.`}>
      <div style={s.badgeGreen}>Submission Received ✓</div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>Project submitted, {name}! 🎯</h1>
      <p style={s.p}>
        <strong>{teamName}</strong>'s project has been successfully submitted.
        The judges will review it after the submission window closes.
      </p>
      <div style={s.card}>
        {projectTitle && <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Project:</strong> {projectTitle}</p>}
        <p style={{ ...s.small, margin: '0 0 6px' }}><strong>Team:</strong> {teamName}</p>
        <p style={{ ...s.small, margin: 0 }}><strong>Deadline:</strong> Jul 3, 2026 · 10:00 AM</p>
      </div>
      <p style={s.p}>
        You can still edit your submission before the deadline using the button below.
      </p>
      <div style={s.btnWrap}>
        <Link href={submissionUrl} style={s.btn}>View / Edit Submission →</Link>
      </div>
      <Hr style={s.hr} />
      <p style={s.small}>Good luck with the judging! 🏆</p>
    </BaseLayout>
  )
}
