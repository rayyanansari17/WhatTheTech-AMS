/**
 * POST /api/test/set-session
 * Playwright-only: accepts access_token + refresh_token and sets Supabase
 * session cookies via createServerClient so Next.js server components can
 * read the authenticated session.
 *
 * Returns 404 in production.
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req) {
  if (process.env.PLAYWRIGHT_TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }

  try {
    const { access_token, refresh_token } = await req.json()

    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: 'Missing tokens' }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) { return cookieStore.get(name)?.value },
          set(name, value, options) {
            try { cookieStore.set({ name, value, ...options }) } catch {}
          },
          remove(name, options) {
            try { cookieStore.set({ name, value: '', ...options }) } catch {}
          },
        },
      }
    )

    const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })
    if (error) throw error

    const response = NextResponse.json({ ok: true, userId: data.user?.id })

    // Explicitly copy any cookies set by supabase into the response
    cookieStore.getAll().forEach(cookie => {
      if (cookie.name.startsWith('sb-')) {
        response.cookies.set(cookie.name, cookie.value, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
        })
      }
    })

    return response
  } catch (err) {
    console.error('[/api/test/set-session]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
