'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Download, ScrollText, ChevronLeft, ChevronRight } from 'lucide-react'

const ACTION_COLORS = {
  LOGIN:   'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  LOGOUT:  'bg-muted text-muted-foreground',
  CREATE:  'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  READ:    'bg-muted text-muted-foreground',
  UPDATE:  'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  DELETE:  'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
}

const ROLE_CLASS = {
  super_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  organiser:   'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  participant: 'bg-muted text-muted-foreground',
}

const PAGE_SIZE = 50

export default function SystemLogsPage() {
  const [logs, setLogs]       = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(0)
  const [action, setAction]   = useState('all')
  const [search, setSearch]   = useState('')
  const searchDebounce        = useRef(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const fetchLogs = useCallback(async (act, srch, pg) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: PAGE_SIZE, offset: pg * PAGE_SIZE })
      if (act && act !== 'all') params.set('action', act)
      if (srch) params.set('search', srch)
      const res = await fetch(`/api/logs?${params}`)
      if (!res.ok) return
      const data = await res.json()
      setLogs(data.items || [])
      setTotal(data.total || 0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setPage(0)
    fetchLogs(action, debouncedSearch, 0)
  }, [action, debouncedSearch, fetchLogs])

  useEffect(() => {
    fetchLogs(action, debouncedSearch, page)
  }, [page])

  function handleSearchChange(e) {
    const val = e.target.value
    setSearch(val)
    clearTimeout(searchDebounce.current)
    searchDebounce.current = setTimeout(() => setDebouncedSearch(val), 400)
  }

  function exportUrl(format) {
    const params = new URLSearchParams({ format })
    if (action && action !== 'all') params.set('action', action)
    if (debouncedSearch) params.set('search', debouncedSearch)
    return `/api/logs/export?${params}`
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const hasMore    = (page + 1) * PAGE_SIZE < total

  function formatDate(ts) {
    if (!ts) return '-'
    return new Date(ts).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'medium' })
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <ScrollText className="w-6 h-6" /> System Logs
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Full API audit trail. {total.toLocaleString()} entries.</p>
        </div>
        <div className="flex items-center gap-2">
          <a href={exportUrl('csv')} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <Download className="w-3.5 h-3.5 mr-1.5" /> CSV
            </Button>
          </a>
          <a href={exportUrl('log')} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <Download className="w-3.5 h-3.5 mr-1.5" /> .log
            </Button>
          </a>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <Input
          className="w-64"
          placeholder="Search path, email, or name..."
          value={search}
          onChange={handleSearchChange}
        />
        <Select value={action} onValueChange={v => { setAction(v); setPage(0) }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {['LOGIN', 'LOGOUT', 'CREATE', 'READ', 'UPDATE', 'DELETE'].map(a => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              {total === 0
                ? 'No API requests have been logged yet.'
                : 'No logs match your current filters.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Timestamp</th>
                    <th className="text-left px-4 py-3 font-medium">Actor</th>
                    <th className="text-left px-4 py-3 font-medium">Role</th>
                    <th className="text-left px-4 py-3 font-medium">Action</th>
                    <th className="text-left px-4 py-3 font-medium">Method</th>
                    <th className="text-left px-4 py-3 font-medium">Path</th>
                    <th className="text-left px-4 py-3 font-medium">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        {log.user_name || log.user_email
                          ? <>
                              <p className="font-medium truncate">{log.user_name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground truncate">{log.user_email || '-'}</p>
                            </>
                          : <span className="text-muted-foreground text-xs">anon</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        {log.user_role
                          ? <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ROLE_CLASS[log.user_role] || 'bg-muted text-muted-foreground'}`}>
                              {log.user_role}
                            </span>
                          : <span className="text-muted-foreground text-xs">-</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-muted text-muted-foreground'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{log.method}</td>
                      <td className="px-4 py-3 text-xs font-mono max-w-[220px] truncate">{log.path}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">{log.ip_address || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <span>Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={!hasMore} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
