import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const cookiesToSet = []

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) { return cookieStore.get(name)?.value },
          set(name, value, options) {
            cookiesToSet.push({ name, value, options })
            try { cookieStore.set({ name, value, ...options }) } catch {}
          },
          remove(name, options) {
            cookiesToSet.push({ name, value: '', options })
            try { cookieStore.set({ name, value: '', ...options }) } catch {}
          },
        },
      }
    )

    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && session) {
      const userId = session.user.id

      const { data: profile } = await supabase
        .from('profiles')
        .select('profile_complete, is_organiser')
        .eq('id', userId)
        .single()

      let redirectPath = '/register/profile'

      if (profile?.is_organiser) {
        redirectPath = '/admin'
      } else if (profile?.profile_complete) {
        const { data: membership } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle()
        redirectPath = membership ? '/dashboard' : '/register/team'
      }

      const response = NextResponse.redirect(`${origin}${redirectPath}`)

      // Explicitly set session cookies on the redirect response so the browser
      // stores them before following the redirect. Without this, Next.js route
      // handlers do not automatically merge cookieStore writes into NextResponse.
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set({ name, value, ...options })
      })

      return response
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth`)
}
