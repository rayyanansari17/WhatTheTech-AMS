import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) { return cookieStore.get(name)?.value },
          set(name, value, options) { try { cookieStore.set({ name, value, ...options }) } catch {} },
          remove(name, options) { try { cookieStore.set({ name, value: '', ...options }) } catch {} },
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

      if (profile?.is_organiser) {
        return NextResponse.redirect(`${origin}/admin`)
      }

      if (profile?.profile_complete) {
        const { data: membership } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle()

        return NextResponse.redirect(`${origin}${membership ? '/dashboard' : '/register/team'}`)
      }

      return NextResponse.redirect(`${origin}/register/profile`)
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth`)
}
