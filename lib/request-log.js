import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export function actionForMethod(method) {
  switch (method.toUpperCase()) {
    case 'POST':   return 'CREATE'
    case 'PUT':
    case 'PATCH':  return 'UPDATE'
    case 'DELETE': return 'DELETE'
    default:       return 'READ'
  }
}

export async function logApiRequest(entry) {
  const supabase = getServiceClient()
  await supabase.from('request_logs').insert(entry)
}

export async function listRequestLogs({ action, search, limit = 50, offset = 0 } = {}) {
  const supabase = getServiceClient()
  const cap = Math.min(Number(limit), 1000)
  let q = supabase.from('request_logs').select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + cap - 1)
  if (action) q = q.eq('action', action)
  if (search) {
    const term = `%${search}%`
    q = q.or(`path.ilike.${term},user_email.ilike.${term},user_name.ilike.${term}`)
  }
  const { data, count, error } = await q
  if (error) throw error
  return { items: data || [], total: count || 0 }
}

export async function exportRequestLogsCsv({ action, search } = {}) {
  const { items } = await listRequestLogs({ action, search, limit: 1000, offset: 0 })
  const header = 'created_at,action,method,path,status,user_name,user_email,user_role,ip_address'
  const rows = items.map(r => [
    r.created_at, r.action, r.method, r.path, r.status ?? '',
    csvEscape(r.user_name), csvEscape(r.user_email), r.user_role ?? '', r.ip_address ?? '',
  ].join(','))
  return [header, ...rows].join('\n')
}

export async function exportRequestLogsText({ action, search } = {}) {
  const { items } = await listRequestLogs({ action, search, limit: 1000, offset: 0 })
  return items.map(r =>
    `[${r.created_at}] ${r.action} ${r.method} ${r.path} ${r.status ?? '-'} | ${r.user_email ?? 'anon'} (${r.user_role ?? 'none'}) from ${r.ip_address ?? '-'}`
  ).join('\n')
}

function csvEscape(val) {
  if (!val) return ''
  if (/[,"\n]/.test(val)) return `"${val.replace(/"/g, '""')}"`
  return val
}
