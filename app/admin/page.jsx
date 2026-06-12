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
import { Users, CreditCard, CheckCircle, DollarSign, TrendingUp } from 'lucide-react'

export default function AdminOverviewPage() {
  const supabase = getSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [totalTeams, setTotalTeams] = useState(0)
  const [totalParticipants, setTotalParticipants] = useState(0)
  const [paidTeams, setPaidTeams] = useState(0)
  const [totalCollected, setTotalCollected] = useState(0)
  const [recentTeams, setRecentTeams] = useState([])
  const [trackCounts, setTrackCounts] = useState({})

  async function loadData() {
    const [
      { count: teams },
      { count: participants },
      { count: paid },
      { data: payments },
      { data: recent },
      { data: tracks },
    ] = await Promise.all([
      supabase.from('teams').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('is_organiser', true),
      supabase.from('teams').select('*', { count: 'exact', head: true }).eq('payment_status', 'paid'),
      supabase.from('teams').select('amount_paid').eq('payment_status', 'paid'),
      supabase.from('teams').select('*, profiles!teams_leader_id_fkey(full_name, institution)').order('created_at', { ascending: false }).limit(10),
      supabase.from('teams').select('track'),
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
  }

  useEffect(() => {
    setLoading(true)
    loadData().finally(() => setLoading(false))
  }, [])

  const { isRefreshing, isLive, lastUpdated, countdown, justUpdated, manualRefresh } =
    useAdminRefresh({ supabase, onRefresh: loadData, channelName: 'admin-overview-rt', table: 'teams' })

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
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Total Teams" value={totalTeams} icon={Users}
          subtitle="Registered teams" color="primary" />
        <StatsCard title="Participants" value={totalParticipants} icon={TrendingUp}
          subtitle="Individual registrations" color="green" />
        <StatsCard title="Paid Teams" value={paidTeams} icon={CheckCircle}
          subtitle={`${paidPercent}% of all teams`} color="yellow" />
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
    </div>
  )
}
