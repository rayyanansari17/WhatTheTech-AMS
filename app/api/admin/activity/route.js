import { requireSuperAdmin } from '@/lib/admin-auth'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export async function GET(req) {
  const caller = await requireSuperAdmin()
  if (!caller) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')

  const supabase = getServiceClient()
  let q = supabase
    .from('email_logs')
    .select('id, email_type, sent_at, status, metadata, user_id, profiles(full_name)')
    .order('sent_at', { ascending: false })
    .limit(200)

  if (type && type !== 'all') q = q.eq('email_type', type)

  const { data, error } = await q
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ items: data || [] })
}
