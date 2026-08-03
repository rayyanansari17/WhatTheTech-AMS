'use client'
import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import StatsCard from '@/components/admin/StatsCard'
import AdminRefreshBar from '@/components/admin/AdminRefreshBar'
import { useAdminRefresh } from '@/hooks/useAdminRefresh'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { TRACKS } from '@/lib/constants'
import { formatRelativeTime, formatCurrency, getInitials } from '@/lib/utils'
import { Users, CreditCard, CheckCircle, DollarSign, TrendingUp, Bell, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

export default function AdminOverviewPage() {
  const supabase = getSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [totalTeams, setTotalTeams] = useState(0)
  const [totalParticipants, setTotalParticipants] = useState(0)
  const [paidTeams, setPaidTeams] = useState(0)
  const [totalCollected, setTotalCollected] = useState(0)
  const [recentTeams, setRecentTeams] = useState([])
  const [trackCounts, setTrackCounts] = useState({})

  const [unpaidCount, setUnpaidCount] = useState(0)
  const [depositCount, setDepositCount] = useState(0)
  const [incompleteProfileCount, setIncompleteProfileCount] = useState(0)
  const [incompleteTeamCount, setIncompleteTeamCount] = useState(0)

  const [nudgeDialog, setNudgeDialog] = useState(null)
  const [nudgeLoading, setNudgeLoading] = useState(false)
  const [nudgeRecipients, setNudgeRecipients] = useState([])
  const [nudgeSelected, setNudgeSelected] = useState(new Set())
  const [sendingNudge, setSendingNudge] = useState(false)
  const [recipientFilter, setRecipientFilter] = useState('all')

  const [previewDialog, setPreviewDialog] = useState(null)

  const FILTER_TABS = [
    { key: 'all',          label: 'All' },
    { key: 'paid',         label: 'Paid' },
    { key: 'deposit_paid', label: 'Deposit' },
    { key: 'unpaid',       label: 'Unpaid' },
    { key: 'no_team',      label: 'No Team' },
  ]

  function applyFilter(key) {
    setRecipientFilter(key)
    const visible = nudgeRecipients.filter(r => {
      if (key === 'all') return true
      if (key === 'unpaid') return ['unpaid', 'pending', 'failed'].includes(r.paymentStatus)
      return r.paymentStatus === key
    })
    setNudgeSelected(new Set(visible.filter(r => !r.alreadySent).map(r => r.id)))
  }

  async function loadData() {
    const [
      { count: teams },
      { count: participants },
      { count: paid },
      { data: payments },
      { data: recent },
      { data: tracks },
      { count: unpaid },
      { count: incompleteProfiles },
      { count: incompleteTeams },
      { count: deposits },
    ] = await Promise.all([
      supabase.from('teams').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('is_organiser', true),
      supabase.from('teams').select('*', { count: 'exact', head: true }).eq('payment_status', 'paid'),
      supabase.from('teams').select('amount_paid').eq('payment_status', 'paid'),
      supabase.from('teams').select('*, profiles!teams_leader_id_fkey(full_name, institution)').order('created_at', { ascending: false }).limit(10),
      supabase.from('teams').select('track'),
      supabase.from('teams').select('*', { count: 'exact', head: true }).in('payment_status', ['unpaid', 'pending', 'failed']),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('profile_complete', false).eq('is_organiser', false),
      supabase.from('teams').select('*', { count: 'exact', head: true }).lt('member_count', 2),
      supabase.from('teams').select('*', { count: 'exact', head: true }).eq('payment_status', 'deposit_paid'),
    ])
    setTotalTeams(teams || 0)
    setTotalParticipants(participants || 0)
    setPaidTeams(paid || 0)
    setTotalCollected((payments || []).reduce((s, t) => s + (t.amount_paid || 0), 0))
    setRecentTeams(recent || [])
    const counts = {}
    TRACKS.forEach(t => { counts[t.value] = 0 })
    tracks?.forEach(t => { if (t.track) counts[t.track] = (counts[t.track] || 0) + 1 })
    setTrackCounts(counts)
    setUnpaidCount(unpaid || 0)
    setIncompleteProfileCount(incompleteProfiles || 0)
    setIncompleteTeamCount(incompleteTeams || 0)
    setDepositCount(deposits || 0)
  }

  useEffect(() => {
    setLoading(true)
    loadData().finally(() => setLoading(false))
  }, [])

  const { isRefreshing, isLive, lastUpdated, countdown, justUpdated, manualRefresh } =
    useAdminRefresh({ supabase, onRefresh: loadData, channelName: 'admin-overview-rt', table: 'teams' })

  async function openNudgeDialog(type, label) {
    setNudgeLoading(true)
    setNudgeDialog({ type, label })
    setNudgeRecipients([])
    setNudgeSelected(new Set())
    setRecipientFilter('all')
    try {
      const res = await fetch(`/api/admin/nudge?type=${type}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load recipients')
      setNudgeRecipients(data.recipients)
      setNudgeSelected(new Set(data.recipients.filter(r => !r.alreadySent).map(r => r.id)))
    } catch (err) {
      toast.error(err.message)
      setNudgeDialog(null)
    } finally {
      setNudgeLoading(false)
    }
  }

  async function sendNudge() {
    if (!nudgeDialog || sendingNudge) return
    const ids = [...nudgeSelected]
    if (ids.length === 0) { toast.error('No recipients selected'); return }
    setSendingNudge(true)
    try {
      const res = await fetch('/api/admin/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: nudgeDialog.type, ids }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      if (data.skipped > 0 && data.sent === 0) {
        toast.error(`All ${data.skipped} skipped — already emailed recently (dedup window active)`)
      } else if (data.skipped > 0) {
        toast.success(`Sent ${data.sent} email${data.sent !== 1 ? 's' : ''}. ${data.skipped} skipped (already emailed within dedup window).`)
      } else {
        toast.success(`Sent ${data.sent} email${data.sent !== 1 ? 's' : ''} successfully.`)
      }
      setNudgeDialog(null)
    } catch (err) {
      toast.error(err.message || 'Failed to send')
    } finally {
      setSendingNudge(false)
    }
  }

  function toggleRecipient(id) {
    setNudgeSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const paidPercent = totalTeams > 0 ? Math.round((paidTeams / totalTeams) * 100) : 0
  const maxTrackCount = Math.max(...Object.values(trackCounts), 1)

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">Real-time snapshot of Founders Fest registrations.</p>
        </div>
        <AdminRefreshBar
          isRefreshing={isRefreshing} isLive={isLive} lastUpdated={lastUpdated}
          countdown={countdown} justUpdated={justUpdated} onRefresh={manualRefresh}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
        <StatsCard title="Total Teams" value={totalTeams} icon={Users}
          subtitle="Registered teams" color="primary" />
        <StatsCard title="Participants" value={totalParticipants} icon={TrendingUp}
          subtitle="Individual registrations" color="green" />
        <StatsCard title="Paid Teams" value={paidTeams} icon={CheckCircle}
          subtitle={`${paidPercent}% of all teams`} color="yellow" />
        <StatsCard title="Spots Reserved" value={depositCount} icon={CreditCard}
          subtitle={depositCount > 0 ? `₹${depositCount * 149} collected, balance pending` : 'Deposit paid, balance due'} color="yellow" />
        <StatsCard title="Amount Collected" value={formatCurrency(totalCollected)} icon={DollarSign}
          subtitle="Total registration revenue" color="purple" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Track Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Track Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)
            ) : (
              TRACKS.map(track => {
                const count = trackCounts[track.value] || 0
                const pct = Math.round((count / maxTrackCount) * 100)
                return (
                  <div key={track.value}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-foreground">{track.label}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Recent Teams */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Teams</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : recentTeams.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No teams yet.</p>
            ) : (
              <div className="space-y-3">
                {recentTeams.map(team => (
                  <div key={team.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{getInitials(team.team_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{team.team_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {team.profiles?.full_name} · {team.profiles?.institution || 'N/A'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={team.payment_status === 'paid' ? 'paid' : 'unpaid'} className="text-xs">
                        {team.payment_status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatRelativeTime(team.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manual Reminders */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4" /> Manual Reminders
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {[
            { type: 'unpaid_teams',        label: 'Unpaid Teams',                  desc: 'Remind leaders whose payment is still pending',             count: unpaidCount },
            { type: 'deposit_teams',       label: 'Deposit Paid (balance due)',     desc: 'Remind leaders who paid deposit to complete payment',       count: depositCount },
            { type: 'incomplete_profiles', label: 'Incomplete Profiles',           desc: "Nudge users who haven't finished their profile",            count: incompleteProfileCount },
            { type: 'incomplete_teams',    label: 'Incomplete Teams',              desc: 'Warn solo leaders their team needs more members',           count: incompleteTeamCount },
            { type: 'announce_deposit',    label: 'Deposit Offer Announcement',    desc: 'Tell unpaid teams they can reserve a spot for ₹149',        count: unpaidCount },
            { type: 'apology_wrong_dates', label: 'Apology: Wrong Date Emails',    desc: 'Correct the July 5-7 system error - 12 people affected',    count: 12 },
            { type: 'event_postponed',     label: 'Event Postponed Notice',        desc: 'Notify all 1491 registered participants the event is postponed, dates TBD',   count: totalParticipants },
            { type: 'saved_spot_apology',  label: 'Apology: Saved Spot Email',     desc: 'Sorry to 7 people who got "we saved your spot" on postponement day', count: 7 },
          ].map(({ type, label, desc, count }) => (
            <div key={type} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium">
                  {label}
                  <span className="ml-2 text-xs font-semibold bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">{count}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost"
                  onClick={() => setPreviewDialog({ type, label })}>
                  Preview
                </Button>
                <Button size="sm" variant="outline"
                  disabled={count === 0 || nudgeLoading}
                  onClick={() => openNudgeDialog(type, label)}>
                  {nudgeLoading && nudgeDialog?.type === type
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : 'Send Reminder'}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Email preview dialog */}
      <Dialog open={!!previewDialog} onOpenChange={(o) => { if (!o) setPreviewDialog(null) }}>
        <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-5 py-4 border-b border-border shrink-0">
            <DialogTitle className="text-base">Email Preview: {previewDialog?.label}</DialogTitle>
            <DialogDescription className="text-xs">This is how the email looks to recipients.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {previewDialog && (
              <iframe
                key={previewDialog.type}
                src={`/api/admin/preview-email?type=${previewDialog.type}`}
                className="w-full h-full border-0"
                title={`Preview: ${previewDialog.label}`}
              />
            )}
          </div>
          <div className="px-5 py-3 border-t border-border shrink-0 flex justify-between items-center">
            <a
              href={`/api/admin/preview-email?type=${previewDialog?.type}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Open in new tab
            </a>
            <Button variant="outline" size="sm" onClick={() => setPreviewDialog(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recipient preview dialog */}
      <Dialog open={!!nudgeDialog} onOpenChange={(o) => { if (!o && !sendingNudge) setNudgeDialog(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Reminder: {nudgeDialog?.label}</DialogTitle>
            <DialogDescription>
              {nudgeLoading
                ? 'Loading recipients…'
                : `${nudgeSelected.size} of ${nudgeRecipients.length} selected. Deselect anyone you don't want to notify.`}
            </DialogDescription>
          </DialogHeader>

          {/* Filter tabs -- only for event_postponed */}
          {!nudgeLoading && nudgeDialog?.type === 'event_postponed' && nudgeRecipients.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-2">
              {FILTER_TABS.map(tab => {
                const count = tab.key === 'all'
                  ? nudgeRecipients.length
                  : nudgeRecipients.filter(r =>
                      tab.key === 'unpaid'
                        ? ['unpaid', 'pending', 'failed'].includes(r.paymentStatus)
                        : r.paymentStatus === tab.key
                    ).length
                return (
                  <button
                    key={tab.key}
                    onClick={() => applyFilter(tab.key)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      recipientFilter === tab.key
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-foreground'
                    }`}
                  >
                    {tab.label} ({count})
                  </button>
                )
              })}
            </div>
          )}

          <div className="max-h-72 overflow-y-auto border border-border rounded-lg divide-y divide-border mt-2">
            {nudgeLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : nudgeRecipients.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No eligible recipients.</p>
            ) : (
              nudgeRecipients
                .filter(r => {
                  if (recipientFilter === 'all') return true
                  if (recipientFilter === 'unpaid') return ['unpaid', 'pending', 'failed'].includes(r.paymentStatus)
                  return r.paymentStatus === recipientFilter
                })
                .map(r => (
                  <label key={r.id} className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50 ${r.alreadySent ? 'opacity-50' : ''}`}>
                    <input
                      type="checkbox"
                      className="mt-0.5 accent-primary"
                      checked={nudgeSelected.has(r.id)}
                      onChange={() => toggleRecipient(r.id)}
                      disabled={r.alreadySent}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{r.name}</p>
                        {r.alreadySent && (
                          <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded-full shrink-0">sent</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                      {r.detail && <p className="text-xs text-muted-foreground truncate">{r.detail}</p>}
                    </div>
                  </label>
                ))
            )}
          </div>

          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setNudgeDialog(null)} disabled={sendingNudge}>Cancel</Button>
            <Button onClick={sendNudge} disabled={nudgeSelected.size === 0 || sendingNudge || nudgeLoading}>
              {sendingNudge
                ? <><Loader2 className="w-3 h-3 animate-spin mr-1.5" />Sending…</>
                : `Send Emails (${nudgeSelected.size} selected)`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
