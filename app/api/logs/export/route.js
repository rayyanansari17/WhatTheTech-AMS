import { requireSuperAdmin } from '@/lib/admin-auth'
import { exportRequestLogsCsv, exportRequestLogsText } from '@/lib/request-log'

export async function GET(req) {
  const caller = await requireSuperAdmin()
  if (!caller) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const format = searchParams.get('format') === 'log' ? 'log' : 'csv'
  const filters = {
    action: searchParams.get('action') || undefined,
    search: searchParams.get('search') || undefined,
  }

  if (format === 'csv') {
    const body = await exportRequestLogsCsv(filters)
    return new Response(body, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="system-logs.csv"',
      },
    })
  } else {
    const body = await exportRequestLogsText(filters)
    return new Response(body, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': 'attachment; filename="system-logs.log"',
      },
    })
  }
}
