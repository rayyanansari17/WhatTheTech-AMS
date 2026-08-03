/**
 * One-off: send the postponement email to a single address via Resend.
 * Run: node scripts/send-one-off.mjs
 * Logs to email_logs so dedup works correctly for future blasts.
 */

import { createClient } from '@supabase/supabase-js'

const RESEND_KEY   = process.env.RESEND_API_KEY
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SITE_URL     = process.env.NEXT_PUBLIC_SITE_URL || 'https://app.foundersfest.org'

const TO_EMAIL  = 'thanujasantha@gmail.com'
const TO_NAME   = 'Thanuja Santha'
const TEAM_NAME = 'Avengers'
const USER_ID   = 'df3bc0a4-4483-4786-8492-238ccb6c2938'

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
  <tr><td style="background:#0f0f1a;padding:24px 32px">
    <p style="margin:0;color:#ffffff;font-size:17px;font-weight:700;letter-spacing:.3px">What The Tech Hackathon</p>
  </td></tr>
  <tr><td style="padding:36px 32px">
    <span style="display:inline-block;background:#FEF3C7;color:#92400E;border:1px solid #FDE68A;border-radius:20px;padding:4px 14px;font-size:12px;font-weight:700;margin-bottom:20px">Event Update</span>
    <h1 style="margin:0 0 18px;font-size:22px;font-weight:700;color:#111827;line-height:1.3">What The Tech Hackathon is being postponed</h1>
    <p style="color:#374151;font-size:15px;line-height:1.65;margin:0 0 16px">Hi ${name}, we wanted to reach you directly with an important update.</p>
    <p style="color:#374151;font-size:15px;line-height:1.65;margin:0 0 24px">
      <strong>What The Tech Hackathon, originally scheduled for August 6-7, 2026, has been postponed.</strong>
      We are still finalizing the new dates and will share them as soon as they are confirmed.
    </p>
    <div style="border-left:4px solid #F59E0B;background:#FFFBEB;padding:16px 18px;border-radius:0 8px 8px 0;margin:0 0 24px">
      <p style="margin:0 0 6px;font-weight:700;color:#92400E;font-size:13px">Nothing else changes</p>
      <p style="margin:0;color:#374151;font-size:14px;line-height:1.55">
        Your registration${teamNote} and payment status are fully preserved.
        There is nothing you need to do right now -- just sit tight.
      </p>
    </div>
    <p style="color:#374151;font-size:15px;line-height:1.65;margin:0 0 28px">We will email you the new dates the moment they are confirmed -- stay tuned.</p>
    <hr style="border:none;border-top:1px solid #E5E7EB;margin:0 0 24px">
    <span style="display:inline-block;background:#ECFDF5;color:#065F46;border:1px solid #A7F3D0;border-radius:20px;padding:4px 14px;font-size:12px;font-weight:700;margin-bottom:14px">Already Planned Your Trip?</span>
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
    <div style="background:linear-gradient(135deg,#F0FDF4 0%,#ECFDF5 100%);border:1px solid #6EE7B7;border-radius:10px;padding:16px 20px;margin:0 0 28px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span style="font-size:18px">📅</span>
        <p style="margin:0;font-size:14px;color:#065F46;font-weight:700;letter-spacing:-0.01em">Workshop schedule dropping soon</p>
      </div>
      <p style="margin:0 0 10px 26px;font-size:13px;color:#047857;line-height:1.55">
        We're finalizing the lineup -- expect hands-on sessions, real-world problem tracks, and
        speakers from the tech and startup community. Full schedule + registration link coming shortly.
      </p>
      <p style="margin:0 0 0 26px;font-size:12px;color:#6B7280;font-style:italic">
        Watch your inbox -- we'll send you the details as soon as they're live.
      </p>
    </div>
    <a href="${dashboardUrl}" style="display:inline-block;background:#4F46E5;color:#ffffff;text-decoration:none;padding:13px 26px;border-radius:8px;font-weight:600;font-size:14px">View Your Dashboard &rarr;</a>
    <hr style="border:none;border-top:1px solid #E5E7EB;margin:36px 0 20px">
    <p style="color:#9CA3AF;font-size:13px;margin:0;line-height:1.5">
      Questions? Reply to this email or write to <a href="mailto:hackathon@foundersfest.org" style="color:#6B7280">hackathon@foundersfest.org</a>
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

async function main() {
  if (!RESEND_KEY) { console.error('RESEND_API_KEY not set'); process.exit(1) }
  if (!SUPABASE_KEY) { console.error('SUPABASE_SERVICE_ROLE_KEY not set'); process.exit(1) }

  const html = buildHtml({ name: TO_NAME, teamName: TEAM_NAME, dashboardUrl: `${SITE_URL}/dashboard` })

  console.log(`Sending to ${TO_NAME} <${TO_EMAIL}> via Resend...`)
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'What The Tech Hackathon <noreply@hackathon.foundersfest.org>',
      reply_to: 'hackathon@foundersfest.org',
      to: [TO_EMAIL],
      subject: 'Important Update: What The Tech Hackathon Postponed',
      html,
    }),
  })

  const data = await res.json()
  if (!res.ok) { console.error('Resend error:', data); process.exit(1) }
  console.log(`SENT | Resend ID: ${data.id}`)

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  const { error } = await supabase.from('email_logs').insert({
    user_id:    USER_ID,
    email_type: 'event_postponed',
    status:     'sent',
    resend_id:  data.id,
    metadata:   { name: TO_NAME, teamName: TEAM_NAME, provider: 'resend' },
  })
  if (error) console.warn('email_logs insert failed:', error.message)
  else console.log('Logged to email_logs -- dedup active for future blasts')
}

main().catch(err => { console.error(err); process.exit(1) })
