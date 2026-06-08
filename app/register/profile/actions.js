'use server'
import { triggerEmail } from '@/lib/send-email-internal'

export async function sendWelcomeEmail({ to, userId, name }) {
  return triggerEmail({
    type: 'welcome',
    to,
    userId,
    props: {
      name,
      dashboardUrl: 'https://app.foundersfest.org/dashboard',
    },
  })
}
