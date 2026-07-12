import { requireSuperAdmin } from '@/lib/admin-auth'
import { listRequestLogs } from '@/lib/request-log'

export async function GET(req) {
  const caller = await requireSuperAdmin()
  if (!caller) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const result = await listRequestLogs({
    action: searchParams.get('action') || undefined,
    search: searchParams.get('search') || undefined,
    limit:  searchParams.get('limit')  || 50,
    offset: searchParams.get('offset') || 0,
  })
  return Response.json(result)
}
