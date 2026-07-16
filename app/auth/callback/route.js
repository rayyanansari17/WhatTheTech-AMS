import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logApiRequest } from '@/lib/request-log'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

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

    let session = null
    let error = null
    try {
      const result = await supabase.auth.exchangeCodeForSession(code)
      session = result.data?.session
      error = result.error
    } catch (e) {
      error = e
    }

    if (!error && session) {
      const userId = session.user.id
      const userEmail = session.user.email
      const service = getServiceClient()

      logApiRequest({
        action: 'LOGIN', method: 'GET', path: '/auth/callback',
        status: 302, user_id: userId, user_email: userEmail,
        user_name: session.user.user_metadata?.full_name ?? session.user.user_metadata?.name ?? null,
        user_role: null, ip_address: null,
      }).catch(err => console.error('[callback:login-log]', err))

      // Check if this email was pre-approved as admin (catches cases where trigger missed it)
      const { data: pending } = await service
        .from('pending_admins')
        .select('is_super_admin')
        .eq('email', userEmail)
        .maybeSingle()

      if (pending) {
        // Grant admin access and clean up pending entry
        await service.from('profiles').upsert({
          id: userId,
          email: userEmail,
          full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
          is_organiser: true,
          is_super_admin: !!pending.is_super_admin,
        }, { onConflict: 'id' })
        await service.from('pending_admins').delete().eq('email', userEmail)

        const response = NextResponse.redirect(`${origin}/admin`)
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set({ name, value, ...options })
        })
        return response
      }

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
