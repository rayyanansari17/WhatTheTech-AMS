import { sendEmail } from '@/lib/email'

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
import AdminWelcomeEmail from '@/emails/admin-welcome'
import AdminNewRegistrationEmail from '@/emails/admin-new-registration'
import AdminPaymentFailureEmail from '@/emails/admin-payment-failure'
import AdminDailyDigestEmail from '@/emails/admin-daily-digest'
import AdminTeamIssueEmail from '@/emails/admin-team-issue'
import NudgeCompleteApplicationEmail from '@/emails/nudge-complete-application'
import NudgeLastChanceApplyEmail from '@/emails/nudge-last-chance-apply'
import NudgeSpotWaitingEmail from '@/emails/nudge-spot-waiting'
import NudgeSavedSpotEmail from '@/emails/nudge-saved-spot'
import NudgeRetryPaymentEmail from '@/emails/nudge-retry-payment'
import NudgeCompletePaymentEmail from '@/emails/nudge-complete-payment'
import NudgeSpotsLimitedEmail from '@/emails/nudge-spots-limited'
import NudgeSecureTeamSpotEmail from '@/emails/nudge-secure-team-spot'
import NudgeTeamUnpaidFinalEmail from '@/emails/nudge-team-unpaid-final'
import NudgeRemindMembersEmail from '@/emails/nudge-remind-members'
import NudgeTeamIncompleteEmail from '@/emails/nudge-team-incomplete'
import NudgeEarlyBirdEndsEmail from '@/emails/nudge-early-bird-ends'
import EventSaveTheDateEmail from '@/emails/event-save-the-date'
import EventTomorrowEmail from '@/emails/event-tomorrow'
import EventStarts2HrsEmail from '@/emails/event-starts-2hrs'
import EventSpotsRunningOutEmail from '@/emails/event-spots-running-out'
import Warning6HrsSubmitEmail from '@/emails/warning-6hrs-submit'
import Warning1HrSubmitEmail from '@/emails/warning-1hr-submit'
import SubmissionClosedEmail from '@/emails/submission-closed'

const TEMPLATES = {
  // Phase 1 - Core
  welcome:                        { C: WelcomeEmail,                  subject: "Welcome to What The Tech Hackathon! 🚀",                    dedup: 72 },
  registration_confirmation:      { C: RegistrationConfirmationEmail,  subject: "Registration Received - Complete Payment",                  dedup: 24 },
  payment_success:                { C: PaymentSuccessEmail,            subject: "Payment Confirmed ✓ - You're In!",                         dedup: 72 },
  payment_failed:                 { C: PaymentFailedEmail,             subject: "Payment Failed - Retry Now",                               dedup: 4  },
  team_created:                   { C: TeamCreatedEmail,               subject: "Your Team Is Created 🚀",                                  dedup: 1  },
  team_invitation:                { C: TeamInvitationEmail,            subject: "You've Been Invited to a Hackathon Team!",                 dedup: 24 },
  member_joined:                  { C: MemberJoinedEmail,              subject: "A New Member Joined Your Team!",                           dedup: 1  },
  team_confirmed:                 { C: TeamConfirmedEmail,             subject: "Team Confirmed - You're All In! 🎉",                       dedup: 72 },
  refund_confirmed:               { C: RefundConfirmedEmail,           subject: "Refund Initiated",                                         dedup: 72 },
  member_declined:                { C: MemberDeclinedEmail,            subject: "Invitation Declined",                                      dedup: 4  },

  // Phase 2 - Nudges
  nudge_complete_application_2hr: { C: NudgeCompleteApplicationEmail,  subject: "You Left Your Application Unfinished",                     dedup: 20 },
  nudge_last_chance_apply:        { C: NudgeLastChanceApplyEmail,       subject: "Last Chance - Complete Your Application",                  dedup: 20 },
  nudge_spot_waiting:             { C: NudgeSpotWaitingEmail,           subject: "Your Spot Is Waiting ⏳",                                  dedup: 20 },
  nudge_saved_spot:               { C: NudgeSavedSpotEmail,             subject: "We Saved Your Spot 🔒",                                   dedup: 48 },
  nudge_retry_payment:            { C: NudgeRetryPaymentEmail,          subject: "Still Having Trouble? Retry Payment",                     dedup: 20 },
  nudge_complete_payment:         { C: NudgeCompletePaymentEmail,       subject: "Complete Your Payment - Spot Still Available",            dedup: 20 },
  nudge_spots_limited:            { C: NudgeSpotsLimitedEmail,          subject: "Only a Few Spots Left - Pay Now",                         dedup: 20 },
  nudge_secure_team_spot:         { C: NudgeSecureTeamSpotEmail,        subject: "Secure Your Team's Spot - Payment Pending",               dedup: 20 },
  nudge_team_unpaid_final:        { C: NudgeTeamUnpaidFinalEmail,       subject: "Final Reminder: Team Payment Still Pending",              dedup: 20 },
  nudge_remind_members:           { C: NudgeRemindMembersEmail,         subject: "Remind Your Members to Pay",                              dedup: 20 },
  nudge_team_incomplete:          { C: NudgeTeamIncompleteEmail,        subject: "⚠️ Your Team Needs More Members",                         dedup: 20 },
  nudge_early_bird_ends:          { C: NudgeEarlyBirdEndsEmail,         subject: "⏰ Early Bird Pricing Ends Tomorrow!",                     dedup: 20 },

  // Phase 3 - Event Ops
  event_save_the_date:            { C: EventSaveTheDateEmail,           subject: "7 Days To Go - Save The Date + Schedule 📅",              dedup: 72 },
  event_tomorrow:                 { C: EventTomorrowEmail,              subject: "Tomorrow Is Hackathon Day! 🔥",                            dedup: 20 },
  event_starts_2hrs:              { C: EventStarts2HrsEmail,            subject: "⚡ It Starts In 2 Hours - Final Info",                    dedup: 20 },
  spots_running_out:              { C: EventSpotsRunningOutEmail,       subject: "🚨 Almost Sold Out - Act Now!",                           dedup: 12 },
  submission_confirmed:           { C: SubmissionConfirmedEmail,        subject: "Project Submission Confirmed ✓",                          dedup: 0  },
  submission_updated:             { C: SubmissionUpdatedEmail,          subject: "Submission Updated",                                      dedup: 0  },
  warning_6hrs_submit:            { C: Warning6HrsSubmitEmail,          subject: "⏰ 6 Hours Left - Submit Your Project!",                  dedup: 20 },
  warning_1hr_submit:             { C: Warning1HrSubmitEmail,           subject: "🚨 1 Hour Left - Submit Now!",                            dedup: 4  },
  submission_closed:              { C: SubmissionClosedEmail,           subject: "Submission Window Closed",                                dedup: 72 },
  checkin_confirmed:              { C: CheckinConfirmedEmail,           subject: "Check-in Confirmed! Welcome to the Hackathon 🙌",         dedup: 72 },
  member_arrived:                 { C: MemberArrivedEmail,              subject: "Your Teammate Just Arrived!",                             dedup: 1  },
  full_team_assembled:            { C: FullTeamAssembledEmail,          subject: "Full Team Here - Let's Build! 🎉",                        dedup: 72 },

  // Phase 4 - Results & Admin
  admin_access_granted:             { C: AdminWelcomeEmail,              subject: "You now have admin access - What The Tech Hackathon",       dedup: 0  },
  certificate:                    { C: CertificateEmail,                subject: "Your Certificate of Participation is Ready 🎓",           dedup: 72 },
  feedback:                       { C: FeedbackEmail,                   subject: "How Was Your Experience? Share Feedback",                 dedup: 72 },
  admin_new_registration:         { C: AdminNewRegistrationEmail,       subject: "New Registration Alert",                                  dedup: 0  },
  admin_payment_failure:          { C: AdminPaymentFailureEmail,        subject: "⚠️ Payment Failure Alert",                                dedup: 0  },
  admin_daily_digest:             { C: AdminDailyDigestEmail,           subject: "Daily Registration Digest",                               dedup: 0  },
  admin_team_issue:               { C: AdminTeamIssueEmail,             subject: "⚠️ Team Payment Issue Flagged",                           dedup: 0  },
}

/**
 * triggerEmail({ type, to, userId, props })
 *
 * Example:
 *   await triggerEmail({
 *     type: 'payment_success',
 *     to: user.email,
 *     userId: user.id,
 *     props: { name: 'Rayyan', teamName: 'AI warriors', orderId: 'FF_xxx', amount: '₹1', dashboardUrl }
 *   })
 */
export async function triggerEmail({ type, to, userId = null, props = {} }) {
  const template = TEMPLATES[type]
  if (!template) {
    console.error(`[triggerEmail] Unknown type: ${type}`)
    return { error: `Unknown email type: ${type}` }
  }
  const { C, subject, dedup } = template
  return sendEmail({
    to,
    subject,
    react: <C {...props} />,
    emailType: type,
    userId,
    dedupWindow: dedup,
    metadata: props,
  })
}
