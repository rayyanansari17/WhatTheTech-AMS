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

// Decode user from Supabase JWT cookie without a network call
function getUserFromCookies(request) {
  try {
    const allCookies = request.cookies.getAll()
    // Supabase @supabase/ssr stores the session in a cookie ending with -auth-token
    const authCookie = allCookies.find(c =>
      c.name.endsWith('-auth-token') && !c.name.match(/\.\d+$/)
    ) ?? allCookies.find(c => c.name.includes('-auth-token'))
    if (!authCookie?.value) return null

    let raw = authCookie.value
    if (raw.startsWith('base64-')) raw = atob(raw.slice(7))
    const session = JSON.parse(raw)
    const token = session?.access_token
    if (!token) return null

    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return { id: payload.sub ?? null, email: payload.email ?? null }
  } catch {
    return null
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  if (!pathname.startsWith('/api/')) return response
  if (SELF_LOGGING.some(p => pathname.startsWith(p))) return response
  if (SKIP_PATHS.some(p => pathname.startsWith(p))) return response

  try {
    const user = getUserFromCookies(request)
    const ip   = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
                 ?? request.headers.get('x-real-ip') ?? null

    const service = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    await service.from('request_logs').insert({
      action:     actionForMethod(request.method),
      method:     request.method.toUpperCase(),
      path:       pathname,
      status:     null,
      user_id:    user?.id ?? null,
      user_email: user?.email ?? null,
      user_name:  null,
      user_role:  null,
      ip_address: ip,
    })
  } catch (err) {
    console.error('[middleware:request-log]', err)
  }

  return response
}

export const config = { matcher: '/api/:path*' }
