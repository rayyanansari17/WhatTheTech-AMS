/**
 * POST /api/test/login
 * Playwright-only test login route - bypasses Google OAuth by directly
 * generating a Supabase magic link session for the test user.
 *
 * MUST NOT be accessible in production.
 * Returns 404 immediately if PLAYWRIGHT_TEST_MODE !== 'true'.
 */
import { createClient } from '@supabase/supabase-js'

export async function POST(req) {
  // ── Guard: only active in test mode ─────────────────────────────────
  if (process.env.PLAYWRIGHT_TEST_MODE !== 'true') {
    return Response.json({ error: 'Not Found' }, { status: 404 })
  }

  try {
    const { email, secret } = await req.json()

    // Validate secret
    if (!secret || secret !== process.env.INTERNAL_EMAIL_SECRET) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!email) {
      return Response.json({ error: 'email is required' }, { status: 400 })
    }

    // Use service role client - required for auth.admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Find user by email in auth.admin
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) throw listError

    const user = users.find(u => u.email === email)
    if (!user) {
      return Response.json({ error: `Test user not found: ${email}` }, { status: 404 })
    }

    // Generate a magic link - gives us a valid session URL
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      },
    })
    if (linkError) throw linkError

    return Response.json({
      success: true,
      user: { id: user.id, email: user.email },
      action_link: linkData.properties?.action_link,
      hashed_token: linkData.properties?.hashed_token,
    })
  } catch (err) {
    console.error('[/api/test/login]', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

// Block all other methods
export async function GET() {
  if (process.env.PLAYWRIGHT_TEST_MODE !== 'true') {
    return Response.json({ error: 'Not Found' }, { status: 404 })
  }
  return Response.json({ error: 'Method Not Allowed' }, { status: 405 })
}
