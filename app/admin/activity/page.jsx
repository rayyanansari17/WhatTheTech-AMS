'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Activity } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

const EMAIL_TYPE_LABELS = {
  registration_confirm:          'Registration Confirm',
  payment_success:               'Payment Success',
  payment_deposit:               'Deposit Paid',
  nudge_secure_team_spot:        'Nudge: Pay',
  nudge_deposit_complete:        'Nudge: Balance Due',
  nudge_complete_application_2hr:'Nudge: Complete Profile',
  nudge_team_incomplete:         'Nudge: Incomplete Team',
  announce_deposit:              'Deposit Offer',
  event_tomorrow:                'Event Tomorrow',
  event_starts_2hrs:             'Event Starts Soon',
  warning_1hr_submit:            'Submit Warning',
  submission_closed:             'Submission Closed',
  apology_wrong_dates:           'Apology: Wrong Dates',
  team_invite:                   'Team Invite',
  team_joined:                   'Team Joined',
  check_in_confirm:              'Check-in Confirm',
  admin_invite:                  'Admin Invite',
  test:                          'Test Email',
}

const EMAIL_TYPE_CATEGORY = {
  registration_confirm:          'registration',
  payment_success:               'payment',
  payment_deposit:               'payment',
  nudge_secure_team_spot:        'nudge',
  nudge_deposit_complete:        'nudge',
  nudge_complete_application_2hr:'nudge',
  nudge_team_incomplete:         'nudge',
  announce_deposit:              'nudge',
  event_tomorrow:                'event',
  event_starts_2hrs:             'event',
  warning_1hr_submit:            'event',
  submission_closed:             'event',
  apology_wrong_dates:           'admin',
  team_invite:                   'registration',
  team_joined:                   'registration',
  check_in_confirm:              'event',
  admin_invite:                  'admin',
  test:                          'admin',
}

const CATEGORY_CLASS = {
  registration: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  payment:      'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  nudge:        'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  event:        'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  admin:        'bg-muted text-muted-foreground',
}

const ALL_TYPES = Object.keys(EMAIL_TYPE_LABELS)

export default function ActivityLogPage() {
  const [logs, setLogs]             = useState([])
  const [loading, setLoading]       = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (typeFilter !== 'all') params.set('type', typeFilter)
    fetch(`/api/admin/activity?${params}`)
      .then(r => r.json())
      .then(d => setLogs(d.items || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [typeFilter])

  function recipientName(log) {
    return log.profiles?.full_name || log.metadata?.name || log.metadata?.leaderName || 'Unknown'
  }

  function contextText(log) {
    const parts = []
    if (log.metadata?.teamName) parts.push(log.metadata.teamName)
    if (log.metadata?.amount)   parts.push(log.metadata.amount)
    return parts.join(' · ')
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Activity className="w-6 h-6" /> Activity Log
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Domain events derived from email logs. Most recent 200 entries.</p>
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All event types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All event types</SelectItem>
            {ALL_TYPES.map(t => (
              <SelectItem key={t} value={t}>{EMAIL_TYPE_LABELS[t] || t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              No activity yet. Events will appear here as participants register, form teams, and pay.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left px-4 py-3 font-medium">Timestamp</th>
                    <th className="text-left px-4 py-3 font-medium">Event</th>
                    <th className="text-left px-4 py-3 font-medium">Recipient</th>
                    <th className="text-left px-4 py-3 font-medium">Context</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map(log => {
                    const cat = EMAIL_TYPE_CATEGORY[log.email_type] || 'admin'
                    return (
                      <tr key={log.id} className="hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                          {formatRelativeTime(log.sent_at)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_CLASS[cat]}`}>
                            {EMAIL_TYPE_LABELS[log.email_type] || log.email_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium truncate max-w-[160px]">
                          {recipientName(log)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs truncate max-w-[180px]">
                          {contextText(log)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={log.status === 'sent' ? 'default' : 'destructive'} className="text-xs">
                            {log.status}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
