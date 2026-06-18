// Email #30 - Submission edited: Submission Updated
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function SubmissionUpdatedEmail({ name = 'Hacker', teamName = '', projectTitle = '', submissionUrl = '#' }) {
  return (
    <BaseLayout preview="Your project submission has been updated successfully.">
      <div style={s.badge}>Submission Updated</div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>Submission updated ✏️</h1>
      <p style={s.p}>
        The submission for <strong>{teamName}</strong>{projectTitle ? ` - "${projectTitle}"` : ''} has been updated.
        Your latest version is saved and will be reviewed by judges.
      </p>
      <div style={s.btnWrap}>
        <Link href={submissionUrl} style={s.btn}>View Submission →</Link>
      </div>
      <Hr style={s.hr} />
      <p style={s.small}>You can continue editing until the Aug 7 · 10:00 AM deadline.</p>
    </BaseLayout>
  )
}
