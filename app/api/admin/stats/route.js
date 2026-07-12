import { requireSuperAdmin } from '@/lib/admin-auth'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

const COLLECTIONS = ['profiles', 'teams', 'team_members', 'check_ins', 'email_logs', 'announcements']

export async function GET() {
  const caller = await requireSuperAdmin()
  if (!caller) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = getServiceClient()
  const counts = await Promise.all(
    COLLECTIONS.map(async (table) => {
      const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })
      return { table, count: count ?? 0 }
    })
  )
  return Response.json({ counts })
}

export async function DELETE(req) {
  const caller = await requireSuperAdmin()
  if (!caller) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const collection = searchParams.get('collection')
  if (!COLLECTIONS.includes(collection)) {
    return Response.json({ error: 'Unknown collection' }, { status: 400 })
  }

  const supabase = getServiceClient()
  const FAKE_ID = '00000000-0000-0000-0000-000000000000'

  if (collection === 'profiles') {
    await supabase.from('team_members').delete().neq('id', FAKE_ID)
    await supabase.from('check_ins').delete().neq('id', FAKE_ID)
    await supabase.from('email_logs').delete().neq('id', FAKE_ID)
    await supabase.from('teams').delete().neq('id', FAKE_ID)
    await supabase.from('profiles').delete().neq('id', caller.user.id)
  } else if (collection === 'teams') {
    await supabase.from('team_members').delete().neq('id', FAKE_ID)
    await supabase.from('check_ins').delete().neq('id', FAKE_ID)
    await supabase.from('teams').delete().neq('id', FAKE_ID)
  } else {
    await supabase.from(collection).delete().neq('id', FAKE_ID)
  }

  return Response.json({ ok: true })
}
