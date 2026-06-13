'use client'
import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { TRACKS } from '@/lib/constants'
import { getInitials, formatRelativeTime, formatCurrency } from '@/lib/utils'
import { Search, Eye, X, Clock, Users, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAdminRefresh } from '@/hooks/useAdminRefresh'
import AdminRefreshBar from '@/components/admin/AdminRefreshBar'

function TeamDetailModal({ team, open, onClose, onStatusChange }) {
  if (!team) return null
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{team.team_name}</DialogTitle>
          <DialogDescription>
            {TRACKS.find(t => t.value === team.track)?.label || team.track} · {team.member_count} members
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Status</span>
              <Badge variant={team.status} className="ml-2">{team.status}</Badge></div>
            <div><span className="text-muted-foreground">Payment</span>
              <Badge variant={team.payment_status} className="ml-2">{team.payment_status}</Badge></div>
            {team.idea_title && (
              <div className="col-span-2"><span className="text-muted-foreground">Idea: </span>{team.idea_title}</div>
            )}
            {team.payment_id && (
              <div className="col-span-2"><span className="text-muted-foreground">Payment ID: </span>
                <code className="text-xs bg-muted px-1 rounded">{team.payment_id}</code></div>
            )}
            <div><span className="text-muted-foreground">Registered: </span>{formatRelativeTime(team.created_at)}</div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2">Members</p>
            <div className="space-y-2">
              {team.team_members?.map((m, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <Avatar className="h-7 w-7"><AvatarFallback className="text-xs">{getInitials(m.profiles?.full_name)}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.profiles?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{m.profiles?.institution || 'N/A'}</p>
                  </div>
                  {m.is_leader && <Badge variant="default" className="text-xs">Leader</Badge>}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2 flex-wrap">
            <Button size="sm" variant="destructive" onClick={() => { onStatusChange(team.id, 'rejected'); onClose() }}>
              <X className="w-3.5 h-3.5" />Reject
            </Button>
            <Button size="sm" variant="outline" onClick={() => { onStatusChange(team.id, 'waitlisted'); onClose() }}>
              <Clock className="w-3.5 h-3.5" />Waitlist
            </Button>
            <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive hover:text-white border-destructive/40"
              onClick={() => { onClose(); onStatusChange(team.id, '__delete__') }}>
              <Trash2 className="w-3.5 h-3.5" />Remove Team
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminTeamsPage() {
  const supabase = getSupabaseClient()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [trackFilter, setTrackFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])

  const { isRefreshing, isLive, lastUpdated, countdown, justUpdated, manualRefresh } =
    useAdminRefresh({ supabase, onRefresh: loadTeams, channelName: 'admin-teams-rt', table: 'teams' })

  async function loadTeams() {
    setLoading(true)
    let query = supabase
      .from('teams')
      .select('*, profiles!teams_leader_id_fkey(full_name, institution), team_members(is_leader, profiles(full_name, institution, year_of_study))')
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') query = query.eq('status', statusFilter)
    if (trackFilter !== 'all') query = query.eq('track', trackFilter)
    if (paymentFilter !== 'all') query = query.eq('payment_status', paymentFilter)
    if (search) query = query.ilike('team_name', `%${search}%`)

    const { data } = await query
    setTeams(data || [])
    setLoading(false)
  }

  useEffect(() => { loadTeams() }, [statusFilter, trackFilter, paymentFilter])

  useEffect(() => {
    const timeout = setTimeout(loadTeams, 400)
    return () => clearTimeout(timeout)
  }, [search])

  async function updateStatus(id, status) {
    if (status === '__delete__') {
      const team = teams.find(t => t.id === id)
      await deleteTeam(id, team?.team_name || id)
      return
    }
    const { error } = await supabase.from('teams').update({ status }).eq('id', id)
    if (error) {
      toast.error(`Failed to update status: ${error.message}`)
      return
    }
    toast.success(`Team ${status}`)
    loadTeams()
  }

  async function deleteTeam(id, teamName) {
    if (!window.confirm(`Permanently remove "${teamName}"? This cannot be undone.`)) return
    const { error } = await supabase.from('teams').delete().eq('id', id)
    if (error) { toast.error(`Failed to remove team: ${error.message}`); return }
    toast.success('Team removed')
    loadTeams()
  }

  function toggleSelect(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  function toggleAll() {
    setSelectedIds(prev => prev.length === teams.length ? [] : teams.map(t => t.id))
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold">Teams</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{teams.length} team{teams.length !== 1 ? 's' : ''} found</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <span className="text-sm text-muted-foreground">{selectedIds.length} selected</span>
          )}
          <AdminRefreshBar
            isRefreshing={isRefreshing} isLive={isLive} lastUpdated={lastUpdated}
            countdown={countdown} justUpdated={justUpdated} onRefresh={manualRefresh}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teams..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {['pending', 'approved', 'rejected', 'waitlisted'].map(s => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={trackFilter} onValueChange={setTrackFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Track" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tracks</SelectItem>
            {TRACKS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Payment" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left">
                  <Checkbox checked={selectedIds.length === teams.length && teams.length > 0}
                    onCheckedChange={toggleAll} />
                </th>
                {['Team Name', 'Leader', 'Members', 'Track', 'Payment', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-label text-xs font-bold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-4" /></td>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : teams.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No teams found</p>
                  </td>
                </tr>
              ) : (
                teams.map(team => (
                  <tr key={team.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Checkbox checked={selectedIds.includes(team.id)} onCheckedChange={() => toggleSelect(team.id)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7"><AvatarFallback className="text-xs">{getInitials(team.team_name)}</AvatarFallback></Avatar>
                        <div>
                          <p className="text-sm font-medium">{team.team_name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{team.team_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm">{team.profiles?.full_name || '-'}</p>
                      <p className="text-xs text-muted-foreground">{team.profiles?.institution || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">{team.member_count}/{team.max_members || 5}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">
                        {TRACKS.find(t => t.value === team.track)?.label || team.track || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={team.payment_status === 'paid' ? 'paid' : 'unpaid'} className="text-xs">
                        {team.payment_status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={team.status} className="text-xs capitalize">{team.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatRelativeTime(team.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelectedTeam(team)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-accent transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => updateStatus(team.id, 'rejected')}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors" title="Reject">
                          <X className="w-4 h-4" />
                        </button>
                        <button onClick={() => updateStatus(team.id, 'waitlisted')}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950/30 transition-colors" title="Waitlist">
                          <Clock className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteTeam(team.id, team.team_name)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors" title="Remove team">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <TeamDetailModal team={selectedTeam} open={!!selectedTeam} onClose={() => setSelectedTeam(null)} onStatusChange={updateStatus} />
    </div>
  )
}
