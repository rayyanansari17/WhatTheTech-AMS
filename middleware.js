import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const SELF_LOGGING = ['/api/auth/logout', '/auth/callback']
const SKIP_PATHS   = ['/api/logs', '/api/admin/stats']

function actionForMethod(m) {
  switch (m.toUpperCase()) {
    case 'POST':   return 'CREATE'
    case 'PUT':
    case 'PATCH':  return 'UPDATE'
    case 'DELETE': return 'DELETE'
    default:       return 'READ'
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  if (!pathname.startsWith('/api/')) return response
  if (SELF_LOGGING.some(p => pathname.startsWith(p))) return response
  if (SKIP_PATHS.some(p => pathname.startsWith(p))) return response

  ;(async () => {
    try {
      const anonClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
      )
      const { data: { user } } = await anonClient.auth.getUser()

      const service = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )

      let userName = null
      let userRole = null
      if (user) {
        const { data: profile } = await service
          .from('profiles')
          .select('full_name, is_super_admin, is_organiser')
          .eq('id', user.id)
          .single()
        userName = profile?.full_name ?? null
        userRole = profile?.is_super_admin ? 'super_admin'
          : profile?.is_organiser ? 'organiser' : 'participant'
      }

      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        ?? request.headers.get('x-real-ip') ?? null

      await service.from('request_logs').insert({
        action:      actionForMethod(request.method),
        method:      request.method.toUpperCase(),
        path:        pathname,
        status:      null,
        user_id:     user?.id ?? null,
        user_email:  user?.email ?? null,
        user_name:   userName,
        user_role:   userRole,
        ip_address:  ip,
      })
    } catch (err) {
      console.error('[middleware:request-log]', err)
    }
  })()

  return response
}

export const config = { matcher: '/api/:path*' }
