// Email #33 - Deadline passed, no submission
import BaseLayout, { s } from './BaseLayout'

export default function SubmissionClosedEmail({ name = 'Hacker', teamName = '' }) {
  return (
    <BaseLayout preview="Submission window has closed - we didn't receive your project.">
      <h1 style={s.h1}>Submission window closed</h1>
      <p style={s.p}>
        Hi {name}, the project submission deadline has passed and we did not receive a submission
        from {teamName ? <strong>{teamName}</strong> : 'your team'}.
      </p>
      <p style={s.p}>
        Unfortunately <strong>your team is not eligible for judging</strong> in this hackathon.
        We hope to see you at the next one!
      </p>
      <div style={{ ...s.accentLine }}>
        <p style={{ ...s.small, margin: 0 }}>
          If you believe this is an error, contact us immediately at{' '}
          <strong>team@foundersfest.org</strong>
        </p>
      </div>
    </BaseLayout>
  )
}
