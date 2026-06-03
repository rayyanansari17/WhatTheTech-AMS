// Email #32 — No submission, 1hr to deadline
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function Warning1HrSubmitEmail({ name = 'Hacker', teamName = '', submissionUrl = '#' }) {
  return (
    <BaseLayout preview="⚠️ 1 hour left — SUBMIT YOUR PROJECT NOW!">
      <div style={{ ...s.badge, backgroundColor: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' }}>
        🚨 1 Hour Left
      </div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>SUBMIT NOW — 1 hour left!</h1>
      <p style={s.p}>
        {teamName && <><strong>{teamName}</strong> — </>}
        The submission deadline is in <strong>1 hour</strong> and your project is not submitted.
      </p>
      <p style={s.p}>
        <strong>This is your final warning.</strong> Submit immediately — incomplete projects are still accepted
        and better than no submission.
      </p>
      <div style={{ ...s.btnWrap, marginBottom: 0 }}>
        <Link href={submissionUrl} style={{ ...s.btn, backgroundColor: '#DC2626' }}>Submit Right Now →</Link>
      </div>
      <Hr style={s.hr} />
    </BaseLayout>
  )
}
