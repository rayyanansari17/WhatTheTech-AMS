import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { triggerEmail } from '@/lib/send-email-internal'

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

// GET /api/admin/manage-admin - list all admins + pending
export async function GET() {
  const caller = await getCallerProfile()
  if (!caller?.is_super_admin) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const service = getServiceClient()
  const [{ data: admins, error }, { data: pending }] = await Promise.all([
    service
      .from('profiles')
      .select('id, email, full_name, is_organiser, is_super_admin, created_at')
      .eq('is_organiser', true)
      .order('created_at', { ascending: true }),
    service
      .from('pending_admins')
      .select('email, is_super_admin, added_at')
      .order('added_at', { ascending: true }),
  ])

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ admins: admins || [], pending: pending || [] })
}

// POST /api/admin/manage-admin - add admin by email, or update role
// body: { action: 'add' | 'set_super_admin' | 'remove', email?, userId?, value? }
export async function POST(req) {
  const caller = await getCallerProfile()
  if (!caller?.is_super_admin) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { action, email, userId, value } = await req.json()
  const service = getServiceClient()

  if (action === 'add') {
    if (!email) return Response.json({ error: 'email required' }, { status: 400 })
    const normalizedEmail = email.toLowerCase().trim()
    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://app.foundersfest.org'

    const { data: profile } = await service
      .from('profiles')
      .select('id, full_name, is_organiser')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (profile?.is_organiser) return Response.json({ error: 'That user is already an admin.' }, { status: 409 })

    let adminUserId = null
    let message = ''

    if (profile) {
      // Already signed up - grant directly
      await service.from('profiles').update({ is_organiser: true }).eq('id', profile.id)
      adminUserId = profile.id
      message = `${profile.full_name || normalizedEmail} is now an admin.`
    } else {
      // Not signed up yet - add to pending list
      const { error: upsertErr } = await service
        .from('pending_admins')
        .upsert({ email: normalizedEmail, is_super_admin: false }, { onConflict: 'email' })
      if (upsertErr) return Response.json({ error: upsertErr.message }, { status: 500 })
      message = `${normalizedEmail} added. They'll get admin access when they first sign in.`
    }

    // Send admin welcome email (fire-and-forget)
    triggerEmail({
      type: 'admin_access_granted',
      to: normalizedEmail,
      userId: adminUserId,
      props: { adminName: profile?.full_name || '', adminEmail: normalizedEmail, appUrl },
    }).catch(err => console.error('[manage-admin] welcome email failed:', err))

    return Response.json({ success: true, message })
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

  if (action === 'remove_pending') {
    if (!email) return Response.json({ error: 'email required' }, { status: 400 })
    await service.from('pending_admins').delete().eq('email', email.toLowerCase().trim())
    return Response.json({ success: true })
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 })
}
