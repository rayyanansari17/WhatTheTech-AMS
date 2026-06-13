// Diagnostic only - secured with ADMIN_SECRET
// POST /api/test-email  { "to": "you@gmail.com" }
// Header: Authorization: Bearer <ADMIN_SECRET>
import { triggerEmail } from '@/lib/send-email-internal'

export async function POST(req) {
  const auth = req.headers.get('authorization') || ''
  if (!process.env.ADMIN_SECRET || auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { to } = await req.json()
  if (!to) return Response.json({ error: 'to required' }, { status: 400 })

  const result = await triggerEmail({
    type: 'welcome',
    to,
    props: { name: 'Test User', dashboardUrl: 'https://app.foundersfest.org/dashboard' },
  })

  return Response.json({ result, env: {
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || '(not set)',
    RESEND_API_KEY_SET: !!process.env.RESEND_API_KEY,
    SUPABASE_SERVICE_ROLE_SET: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  }})
}
