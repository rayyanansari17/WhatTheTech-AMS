import { createSupabaseServerClient } from '@/lib/supabase-server'
import { logApiRequest } from '@/lib/request-log'

export async function POST() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    logApiRequest({
      action: 'LOGOUT', method: 'POST', path: '/api/auth/logout',
      status: 200, user_id: user.id, user_email: user.email,
      user_name: null, user_role: null, ip_address: null,
    }).catch(err => console.error('[logout:log]', err))
  }

  await supabase.auth.signOut()
  return Response.json({ ok: true })
}
