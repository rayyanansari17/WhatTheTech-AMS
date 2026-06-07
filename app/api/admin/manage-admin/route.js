import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

async function getCallerProfile() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('is_organiser, is_super_admin').eq('id', user.id).single()
  return data
}

// GET /api/admin/manage-admin — list all admins
export async function GET() {
  const caller = await getCallerProfile()
  if (!caller?.is_super_admin) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const service = getServiceClient()
  const { data, error } = await service
    .from('profiles')
    .select('id, email, full_name, is_organiser, is_super_admin, created_at')
    .eq('is_organiser', true)
    .order('created_at', { ascending: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ admins: data })
}

// POST /api/admin/manage-admin — add admin by email, or update role
// body: { action: 'add' | 'set_super_admin' | 'remove', email?, userId?, value? }
export async function POST(req) {
  const caller = await getCallerProfile()
  if (!caller?.is_super_admin) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { action, email, userId, value } = await req.json()
  const service = getServiceClient()

  if (action === 'add') {
    if (!email) return Response.json({ error: 'email required' }, { status: 400 })

    const { data: profile, error } = await service
      .from('profiles')
      .select('id, email, full_name, is_organiser')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    if (!profile) return Response.json({ error: 'No account found with that email. Ask them to sign in first.' }, { status: 404 })
    if (profile.is_organiser) return Response.json({ error: 'That user is already an admin.' }, { status: 409 })

    await service.from('profiles').update({ is_organiser: true }).eq('id', profile.id)
    return Response.json({ success: true, message: `${profile.full_name || email} is now an admin.` })
  }

  if (action === 'set_super_admin') {
    if (!userId) return Response.json({ error: 'userId required' }, { status: 400 })
    await service.from('profiles').update({ is_super_admin: !!value }).eq('id', userId)
    return Response.json({ success: true })
  }

  if (action === 'remove') {
    if (!userId) return Response.json({ error: 'userId required' }, { status: 400 })

    const { data: { user } } = await createSupabaseServerClient().auth.getUser()
    if (userId === user?.id) return Response.json({ error: "You can't remove yourself." }, { status: 400 })

    await service.from('profiles').update({ is_organiser: false, is_super_admin: false }).eq('id', userId)
    return Response.json({ success: true })
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 })
}
