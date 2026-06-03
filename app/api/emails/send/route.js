/**
 * POST /api/emails/send
 * Generic email trigger endpoint — called by the app on key events:
 *   welcome, registration_confirmation, payment_success, payment_failed,
 *   team_created, team_invitation, member_joined, team_confirmed,
 *   refund_confirmed, member_declined, checkin_confirmed,
 *   member_arrived, full_team_assembled, submission_confirmed,
 *   submission_updated, certificate, feedback, spots_running_out
 */
import { sendEmail } from '@/lib/email'
import { render } from '@react-email/render'

import WelcomeEmail from '@/emails/welcome'
import RegistrationConfirmationEmail from '@/emails/registration-confirmation'
import PaymentSuccessEmail from '@/emails/payment-success'
import PaymentFailedEmail from '@/emails/payment-failed'
import TeamCreatedEmail from '@/emails/team-created'
import TeamInvitationEmail from '@/emails/team-invitation'
import MemberJoinedEmail from '@/emails/member-joined'
import TeamConfirmedEmail from '@/emails/team-confirmed'
import RefundConfirmedEmail from '@/emails/refund-confirmed'
import MemberDeclinedEmail from '@/emails/member-declined'
import CheckinConfirmedEmail from '@/emails/checkin-confirmed'
import MemberArrivedEmail from '@/emails/member-arrived'
import FullTeamAssembledEmail from '@/emails/full-team-assembled'
import SubmissionConfirmedEmail from '@/emails/submission-confirmed'
import SubmissionUpdatedEmail from '@/emails/submission-updated'
import CertificateEmail from '@/emails/certificate'
import FeedbackEmail from '@/emails/feedback'
import EventSpotsRunningOutEmail from '@/emails/event-spots-running-out'
import AdminNewRegistrationEmail from '@/emails/admin-new-registration'
import AdminPaymentFailureEmail from '@/emails/admin-payment-failure'

const TEMPLATES = {
  welcome:                  { component: WelcomeEmail,               subject: 'Welcome to What The Tech Hackathon! 🚀', dedup: 72 },
  registration_confirmation:{ component: RegistrationConfirmationEmail, subject: 'Registration Received — Complete Payment', dedup: 24 },
  payment_success:          { component: PaymentSuccessEmail,         subject: 'Payment Confirmed ✓ — You\'re In!', dedup: 72 },
  payment_failed:           { component: PaymentFailedEmail,          subject: 'Payment Failed — Retry Now', dedup: 4 },
  team_created:             { component: TeamCreatedEmail,            subject: 'Your Team Is Created 🚀', dedup: 72 },
  team_invitation:          { component: TeamInvitationEmail,         subject: 'You\'ve Been Invited to a Hackathon Team!', dedup: 24 },
  member_joined:            { component: MemberJoinedEmail,           subject: 'A New Member Joined Your Team!', dedup: 1 },
  team_confirmed:           { component: TeamConfirmedEmail,          subject: 'Team Confirmed — You\'re All In! 🎉', dedup: 72 },
  refund_confirmed:         { component: RefundConfirmedEmail,        subject: 'Refund Initiated', dedup: 72 },
  member_declined:          { component: MemberDeclinedEmail,         subject: 'Invitation Declined', dedup: 4 },
  checkin_confirmed:        { component: CheckinConfirmedEmail,       subject: 'Check-in Confirmed! Welcome to the Hackathon 🙌', dedup: 72 },
  member_arrived:           { component: MemberArrivedEmail,          subject: 'Your Teammate Just Arrived!', dedup: 1 },
  full_team_assembled:      { component: FullTeamAssembledEmail,      subject: 'Full Team Here — Let\'s Build! 🎉', dedup: 72 },
  submission_confirmed:     { component: SubmissionConfirmedEmail,    subject: 'Project Submission Confirmed ✓', dedup: 0 },
  submission_updated:       { component: SubmissionUpdatedEmail,      subject: 'Submission Updated', dedup: 0 },
  certificate:              { component: CertificateEmail,            subject: 'Your Certificate of Participation is Ready 🎓', dedup: 72 },
  feedback:                 { component: FeedbackEmail,               subject: 'How Was Your Experience? Share Feedback', dedup: 72 },
  spots_running_out:        { component: EventSpotsRunningOutEmail,   subject: '🚨 Only a Few Spots Left!', dedup: 12 },
  admin_new_registration:   { component: AdminNewRegistrationEmail,   subject: 'New Registration Alert', dedup: 0 },
  admin_payment_failure:    { component: AdminPaymentFailureEmail,    subject: '⚠️ Payment Failure Alert', dedup: 0 },
}

export async function POST(req) {
  try {
    // Verify internal secret to prevent abuse
    const authHeader = req.headers.get('x-internal-secret')
    if (authHeader !== process.env.INTERNAL_EMAIL_SECRET) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, to, userId, props = {} } = await req.json()

    if (!type || !to) {
      return Response.json({ error: 'type and to are required' }, { status: 400 })
    }

    const template = TEMPLATES[type]
    if (!template) {
      return Response.json({ error: `Unknown email type: ${type}` }, { status: 400 })
    }

    const { component: Component, subject, dedup } = template
    const result = await sendEmail({
      to,
      subject,
      react: <Component {...props} />,
      emailType: type,
      userId,
      dedupWindow: dedup,
      metadata: { props },
    })

    return Response.json(result)
  } catch (err) {
    console.error('[/api/emails/send]', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
