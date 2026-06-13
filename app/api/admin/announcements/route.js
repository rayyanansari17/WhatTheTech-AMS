import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

async function verifyOrganiser(supabase, userId) {
  const { data } = await supabase.from('profiles').select('is_organiser').eq('id', userId).single()
  return !!data?.is_organiser
}

// GET - list all announcements
export async function GET() {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data || [])
}

// POST - create announcement
export async function POST(req) {
  const authClient = createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const service = getServiceClient()
  if (!(await verifyOrganiser(service, user.id)))
    return Response.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { title, body: message, event_date, event_time, location, poster_url, rsvp_type, rsvp_link } = body

  if (!title?.trim() || !message?.trim())
    return Response.json({ error: 'Title and message are required' }, { status: 400 })

  const payload = {
    title: title.trim(),
    body: message.trim(),
    created_by: user.id,
    ...(event_date !== undefined && { event_date: event_date || null }),
    ...(event_time !== undefined && { event_time: event_time || null }),
    ...(location !== undefined && { location: location || null }),
    ...(poster_url !== undefined && { poster_url: poster_url || null }),
    ...(rsvp_type !== undefined && { rsvp_type: rsvp_type || 'none' }),
    ...(rsvp_link !== undefined && { rsvp_link: rsvp_link || null }),
  }

  const { data, error } = await service.from('announcements').insert(payload).select().single()
  if (error) {
    // If new columns don't exist yet (migration not run), fall back to basic insert
    if (error.code === '42703') {
      const { data: basic, error: basicErr } = await service.from('announcements')
        .insert({ title: payload.title, body: payload.body, created_by: user.id })
        .select().single()
      if (basicErr) return Response.json({ error: basicErr.message, needsMigration: true }, { status: 500 })
      return Response.json({ ...basic, needsMigration: true })
    }
    return Response.json({ error: error.message }, { status: 500 })
  }
  return Response.json(data)
}

// DELETE - delete announcement by id
export async function DELETE(req) {
  const authClient = createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const service = getServiceClient()
  if (!(await verifyOrganiser(service, user.id)))
    return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })

  const { error } = await service.from('announcements').delete().eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
