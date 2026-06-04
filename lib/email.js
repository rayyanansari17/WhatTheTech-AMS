import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

// Lazy init — avoids crash at build time when env var is missing
let _resend = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

// Service-role Supabase client for server-side email logging
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

const FROM = process.env.RESEND_FROM_EMAIL || 'noreply@hackathon.foundersfest.org'
const REPLY_TO = process.env.RESEND_REPLY_TO || 'team@foundersfest.org'
const FROM_NAME = 'What The Tech Hackathon'

/**
 * Check if an email of this type was already sent to this user within the window.
 * Returns true if we should skip sending (already sent).
 */
async function isDuplicate(supabase, userId, emailType, windowHours = 24) {
  if (!userId) return false
  const { data } = await supabase
    .from('email_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('email_type', emailType)
    .gt('sent_at', new Date(Date.now() - windowHours * 3600 * 1000).toISOString())
    .limit(1)
    .maybeSingle()
  return !!data
}

/**
 * Log a sent (or failed) email to email_logs.
 */
async function logEmail(supabase, { userId, emailType, status, resendId, metadata }) {
  if (!userId) return
  await supabase.from('email_logs').insert({
    user_id: userId,
    email_type: emailType,
    status,
    resend_id: resendId || null,
    metadata: metadata || null,
  })
}

/**
 * Main sendEmail utility.
 *
 * Options:
 *   to          – recipient email address
 *   subject     – email subject (prefix "[WTT Hackathon] " is added automatically)
 *   react       – React Email component (JSX element)
 *   emailType   – unique key for dedup + logging (e.g. 'payment_success')
 *   userId      – Supabase user ID for logging (optional for admin emails)
 *   dedupWindow – hours to check for duplicate send (default 24, 0 = no dedup)
 *   metadata    – extra JSONB stored in email_logs
 */
export async function sendEmail({
  to,
  subject,
  react,
  emailType,
  userId = null,
  dedupWindow = 24,
  metadata = null,
}) {
  const supabase = getServiceClient()

  // Dedup check
  if (userId && dedupWindow > 0) {
    const skip = await isDuplicate(supabase, userId, emailType, dedupWindow)
    if (skip) {
      console.log(`[email] skipping duplicate: ${emailType} → ${to}`)
      return { skipped: true }
    }
  }

  try {
    const { data, error } = await getResend().emails.send({
      from: `${FROM_NAME} <${FROM}>`,
      reply_to: REPLY_TO,
      to,
      subject: `[WTT Hackathon] ${subject}`,
      react,
    })

    if (error) throw new Error(error.message)

    await logEmail(supabase, {
      userId,
      emailType,
      status: 'sent',
      resendId: data?.id,
      metadata,
    })

    console.log(`[email] sent: ${emailType} → ${to} (${data?.id})`)
    return { success: true, id: data?.id }
  } catch (err) {
    console.error(`[email] failed: ${emailType} → ${to}`, err.message)
    await logEmail(supabase, {
      userId,
      emailType,
      status: 'failed',
      metadata: { error: err.message, ...metadata },
    })
    return { success: false, error: err.message }
  }
}

/**
 * Send the same email to multiple recipients (e.g. whole team).
 * Each send is logged individually.
 */
export async function sendEmailToMany(recipients, emailFn) {
  const results = await Promise.allSettled(
    recipients.map(r => emailFn(r))
  )
  return results
}

export { FROM, FROM_NAME }
