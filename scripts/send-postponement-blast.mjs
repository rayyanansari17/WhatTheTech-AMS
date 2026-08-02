/**
 * Postponement email blast -- runs via GitHub Actions.
 * Sends the event-postponed notice to all registered participants.
 * Safe to re-run: skips anyone who already got the email within 7 days.
 *
 * Env vars required:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL
 *   SITE_URL, SMTP_DELAY_MS (default 300), DRY_RUN (default false)
 */

import { createClient } from '@supabase/supabase-js'

const SITE_URL    = process.env.SITE_URL || 'https://app.foundersfest.org'
const DRY_RUN     = process.env.DRY_RUN === 'true'
const DELAY_MS    = parseInt(process.env.BREVO_DELAY_MS || '100')
const TEST_EMAIL  = process.env.TEST_EMAIL?.trim() || ''
const BREVO_KEY   = process.env.BREVO_API_KEY
const WAVE        = process.env.WAVE || 'all' // 'paid' | 'all'

// ── Supabase ──────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ── Brevo HTTP send ───────────────────────────────────────────────────────────

async function brevoSend({ to, toName, subject, html }) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender:      { name: 'What The Tech Hackathon', email: 'hackathon@foundersfest.org' },
      to:          [{ email: to, name: toName }],
      replyTo:     { email: 'hackathon@foundersfest.org' },
      subject,
      htmlContent: html,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Brevo ${res.status}: ${err}`)
  }
  const data = await res.json()
  return data.messageId || data.messageId
}

// ── Email HTML ────────────────────────────────────────────────────────────────

function buildHtml({ name, teamName, dashboardUrl }) {
  const teamNote = teamName ? ` for <strong>${teamName}</strong>` : ''
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>What The Tech Hackathon -- Important Update</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px">
<tr><td>
<table width="600" align="center" cellpadding="0" cellspacing="0"
  style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">

  <!-- Header -->
  <tr><td style="background:#0f0f1a;padding:24px 32px">
    <p style="margin:0;color:#ffffff;font-size:17px;font-weight:700;letter-spacing:.3px">
      What The Tech Hackathon
    </p>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:36px 32px">

    <span style="display:inline-block;background:#FEF3C7;color:#92400E;border:1px solid #FDE68A;
      border-radius:20px;padding:4px 14px;font-size:12px;font-weight:700;margin-bottom:20px">
      Event Update
    </span>

    <h1 style="margin:0 0 18px;font-size:22px;font-weight:700;color:#111827;line-height:1.3">
      What The Tech Hackathon is being postponed
    </h1>

    <p style="color:#374151;font-size:15px;line-height:1.65;margin:0 0 16px">
      Hi ${name}, we wanted to reach you directly with an important update.
    </p>

    <p style="color:#374151;font-size:15px;line-height:1.65;margin:0 0 24px">
      <strong>What The Tech Hackathon, originally scheduled for August 6-7, 2026,
      has been postponed.</strong> We are still finalizing the new dates and will
      share them as soon as they are confirmed.
    </p>

    <!-- Highlight box -->
    <div style="border-left:4px solid #F59E0B;background:#FFFBEB;padding:16px 18px;
      border-radius:0 8px 8px 0;margin:0 0 24px">
      <p style="margin:0 0 6px;font-weight:700;color:#92400E;font-size:13px">
        Nothing else changes
      </p>
      <p style="margin:0;color:#374151;font-size:14px;line-height:1.55">
        Your registration${teamNote} and payment status are fully preserved.
        There is nothing you need to do right now -- just sit tight.
      </p>
    </div>

    <p style="color:#374151;font-size:15px;line-height:1.65;margin:0 0 28px">
      We will email you the new dates the moment they are confirmed -- stay tuned.
    </p>

    <!-- Workshop notice -->
    <hr style="border:none;border-top:1px solid #E5E7EB;margin:0 0 24px">
    <span style="display:inline-block;background:#ECFDF5;color:#065F46;border:1px solid #A7F3D0;
      border-radius:20px;padding:4px 14px;font-size:12px;font-weight:700;margin-bottom:14px">
      Already Planned Your Trip?
    </span>
    <p style="color:#374151;font-size:15px;line-height:1.65;margin:0 0 12px">
      <strong>If you've already booked your travel to Hyderabad for August 6-7, we've got something for you.</strong>
    </p>
    <p style="color:#374151;font-size:15px;line-height:1.65;margin:0 0 12px">
      We've organized a set of workshops on August 6-7 that are closely aligned with the hackathon themes --
      a great opportunity to connect with the community, learn, and make your visit worthwhile.
    </p>
    <p style="color:#6B7280;font-size:13px;font-style:italic;margin:0 0 16px">
      Haven't booked travel yet? No action needed -- there's no obligation to attend.
      Just sit tight and we'll reach out with the new hackathon dates as soon as they're locked in.
    </p>
    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:12px 16px;margin:0 0 28px">
      <p style="margin:0;font-size:13px;color:#166534;font-weight:700">RSVP link coming soon</p>
      <p style="margin:4px 0 0;font-size:12px;color:#15803D">
        We'll share the registration link for the workshops shortly -- keep an eye on your inbox.
      </p>
    </div>

    <a href="${dashboardUrl}"
      style="display:inline-block;background:#4F46E5;color:#ffffff;text-decoration:none;
      padding:13px 26px;border-radius:8px;font-weight:600;font-size:14px">
      View Your Dashboard &rarr;
    </a>

    <hr style="border:none;border-top:1px solid #E5E7EB;margin:36px 0 20px">

    <p style="color:#9CA3AF;font-size:13px;margin:0;line-height:1.5">
      Questions? Reply to this email or write to
      <a href="mailto:hackathon@foundersfest.org" style="color:#6B7280">
        hackathon@foundersfest.org
      </a>
    </p>

  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

// ── Dedup check ───────────────────────────────────────────────────────────────

async function alreadySent(userId) {
  const since = new Date(Date.now() - 168 * 3600 * 1000).toISOString()
  const { data } = await supabase
    .from('email_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('email_type', 'event_postponed')
    .gt('sent_at', since)
    .limit(1)
    .maybeSingle()
  return !!data
}

async function logEmail(userId, status, messageId, meta) {
  await supabase.from('email_logs').insert({
    user_id:    userId,
    email_type: 'event_postponed',
    status,
    resend_id:  messageId || null,
    metadata:   meta || null,
  })
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n=== Postponement blast | WAVE=${WAVE} | DRY_RUN=${DRY_RUN} | TEST_EMAIL=${TEST_EMAIL || 'none'} | DELAY=${DELAY_MS}ms ===\n`)

  if (!BREVO_KEY) { console.error('BREVO_API_KEY is not set'); process.exit(1) }
  console.log('Brevo API key present\n')

  // If TEST_EMAIL is set, send only to that address and exit
  if (TEST_EMAIL) {
    console.log(`TEST MODE -- sending only to: ${TEST_EMAIL}`)
    const html = buildHtml({ name: 'Test User', teamName: 'Test Team', dashboardUrl: `${SITE_URL}/dashboard` })
    const msgId = await brevoSend({ to: TEST_EMAIL, toName: 'Test User', subject: 'Important Update: What The Tech Hackathon Postponed', html })
    console.log(`SENT to ${TEST_EMAIL} | messageId: ${msgId}`)
    return
  }

  // Load all non-organiser profiles
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('is_organiser', false)
  if (pErr) { console.error('profiles error:', pErr.message); process.exit(1) }
  console.log(`Total profiles: ${profiles.length}`)

  // Filter to paid/deposit-paid members only for Wave 1
  let targets = profiles
  if (WAVE === 'paid') {
    const { data: paidMembers, error: pmErr } = await supabase
      .from('team_members')
      .select('user_id, teams!inner(payment_status)')
      .in('teams.payment_status', ['paid', 'deposit_paid'])
    if (pmErr) { console.error('team_members error:', pmErr.message); process.exit(1) }
    const paidUserIds = new Set((paidMembers || []).map(m => m.user_id))
    targets = profiles.filter(p => paidUserIds.has(p.id))
    console.log(`Wave 1 (paid+deposit): ${targets.length} of ${profiles.length} profiles`)
  } else {
    console.log(`Wave: all (${profiles.length} profiles)`)
  }

  // Load all auth users in pages to build id -> email map
  const emailMap = {}
  let page = 1
  while (true) {
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) { console.error('listUsers error:', error.message); process.exit(1) }
    users.forEach(u => { emailMap[u.id] = u.email })
    if (users.length < 1000) break
    page++
  }
  console.log(`Auth users: ${Object.keys(emailMap).length}`)

  // Load team memberships for team name lookup
  const { data: memberships } = await supabase
    .from('team_members')
    .select('user_id, teams(team_name)')
  const teamMap = {}
  ;(memberships || []).forEach(m => {
    if (m.teams?.team_name) teamMap[m.user_id] = m.teams.team_name
  })
  console.log(`Team memberships: ${Object.keys(teamMap).length}\n`)

  let sent = 0, skipped = 0, failed = 0, noEmail = 0

  for (const profile of targets) {
    const email = emailMap[profile.id]
    if (!email) { noEmail++; continue }

    const isDup = await alreadySent(profile.id)
    if (isDup) {
      console.log(`  SKIP  [already sent] ${email}`)
      skipped++
      continue
    }

    const name     = profile.full_name || email.split('@')[0]
    const teamName = teamMap[profile.id] || ''

    if (DRY_RUN) {
      console.log(`  DRY   ${name} <${email}> | team: ${teamName || 'none'}`)
      sent++
      continue
    }

    try {
      const html = buildHtml({ name, teamName, dashboardUrl: `${SITE_URL}/dashboard` })
      const msgId = await brevoSend({ to: email, toName: name, subject: 'Important Update: What The Tech Hackathon Postponed', html })
      await logEmail(profile.id, 'sent', msgId, { name, teamName })
      console.log(`  SENT  [${sent + 1}] ${name} <${email}>`)
      sent++
      if (DELAY_MS > 0) await new Promise(r => setTimeout(r, DELAY_MS))
    } catch (err) {
      console.error(`  FAIL  ${email} -- ${err.message}`)
      await logEmail(profile.id, 'failed', null, { name, error: err.message })
      failed++
    }
  }

  console.log(`\n=== Done ===`)
  console.log(`Sent: ${sent} | Skipped (already sent): ${skipped} | Failed: ${failed} | No email: ${noEmail}`)
}

main().catch(err => { console.error(err); process.exit(1) })
