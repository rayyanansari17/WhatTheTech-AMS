// Email #31 - No submission, 6hrs to deadline
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function Warning6HrsSubmitEmail({ name = 'Hacker', teamName = '', submissionUrl = '#' }) {
  return (
    <BaseLayout preview="6 hours left to submit your project - don't miss the deadline!">
      <div style={{ ...s.badge, backgroundColor: '#FFFBEB', color: '#D97706', borderColor: '#FCD34D' }}>
        ⏰ 6 Hours Left
      </div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>6 hours left, {name}!</h1>
      <p style={s.p}>
        {teamName && <><strong>{teamName}</strong> - </>}
        The submission deadline is in <strong>6 hours</strong> and we haven't received your project yet.
        Submit now - even a work-in-progress counts!
      </p>
      <p style={s.p}>
        <strong>You won't be eligible for judging without a submission.</strong>
      </p>
      <div style={s.btnWrap}>
        <Link href={submissionUrl} style={s.btn}>Submit My Project →</Link>
      </div>
      <Hr style={s.hr} />
      <p style={s.small}>Deadline: July 3, 2026 · 10:00 AM IST</p>
    </BaseLayout>
  )
}
