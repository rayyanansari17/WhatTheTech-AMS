/**
 * GET /api/test/email-log?type=<email_type>
 * Playwright-only route - queries email_logs table to verify emails were sent.
 *
 * MUST NOT be accessible in production.
 * Returns 404 immediately if PLAYWRIGHT_TEST_MODE !== 'true'.
 */
import { createClient } from '@supabase/supabase-js'

export async function GET(req) {
  // ── Guard: only active in test mode ─────────────────────────────────
  if (process.env.PLAYWRIGHT_TEST_MODE !== 'true') {
    return Response.json({ error: 'Not Found' }, { status: 404 })
  }

  // Validate internal secret header
  const secret = req.headers.get('x-internal-secret')
  if (!secret || secret !== process.env.INTERNAL_EMAIL_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const emailType = searchParams.get('type')

  if (!emailType) {
    return Response.json({ error: 'type query param is required' }, { status: 400 })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('email_type', emailType)
      .order('sent_at', { ascending: false })
      .limit(50)

    if (error) throw error

    return Response.json({ logs: data || [], count: data?.length || 0 })
  } catch (err) {
    console.error('[/api/test/email-log]', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

// Block all other methods
export async function POST() {
  if (process.env.PLAYWRIGHT_TEST_MODE !== 'true') {
    return Response.json({ error: 'Not Found' }, { status: 404 })
  }
  return Response.json({ error: 'Method Not Allowed' }, { status: 405 })
}
