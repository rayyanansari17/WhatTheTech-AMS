'use client'
import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Search, QrCode, Check, UserCheck, Clock } from 'lucide-react'
import { getInitials, formatRelativeTime } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminCheckinPage() {
  const supabase = getSupabaseClient()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [checkins, setCheckins] = useState([])
  const [totalParticipants, setTotalParticipants] = useState(0)
  const [checkingIn, setCheckingIn] = useState(null)

  useEffect(() => {
    loadCheckins()
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('profile_complete', true)
      .then(({ count }) => setTotalParticipants(count || 0))
  }, [])

  async function loadCheckins() {
    const { data } = await supabase
      .from('check_ins')
      .select('*, profiles!check_ins_user_id_fkey(full_name, institution), teams(team_name)')
      .order('checked_in_at', { ascending: false })
      .limit(20)
    setCheckins(data || [])
  }

  useEffect(() => {
    if (!search.trim()) { setResults([]); return }
    const timeout = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from('profiles')
        .select('*, team_members(teams(team_name, team_code))')
        .or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
        .eq('profile_complete', true)
        .limit(10)
      setResults(data || [])
      setSearching(false)
    }, 400)
    return () => clearTimeout(timeout)
  }, [search])

  async function handleCheckin(profile) {
    setCheckingIn(profile.id)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const team = profile.team_members?.[0]?.teams
      const { error } = await supabase.from('check_ins').insert({
        user_id: profile.id,
        team_id: team?.id || null,
        checked_in_by: user.id,
      })
      if (error) {
        if (error.message?.includes('duplicate') || error.code === '23505') {
          toast.error('Already checked in!')
        } else throw error
      } else {
        toast.success(`${profile.full_name} checked in!`)
        setSearch('')
        setResults([])
        loadCheckins()
      }
    } catch (err) {
      toast.error(err.message || 'Check-in failed')
    } finally {
      setCheckingIn(null)
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold">Check-In</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Event day check-in management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{checkins.length}</p>
              <p className="text-xs text-muted-foreground">Checked In</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <QrCode className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalParticipants}</p>
              <p className="text-xs text-muted-foreground">Total Registered</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email to check in..." className="pl-9" autoFocus />
          </div>

          {searching && <p className="text-xs text-muted-foreground mt-2 px-1">Searching...</p>}

          {results.length > 0 && (
            <div className="mt-3 space-y-2">
              {results.map(p => {
                const team = p.team_members?.[0]?.teams
                return (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                    <Avatar className="h-9 w-9"><AvatarFallback>{getInitials(p.full_name)}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{p.full_name}</p>
                      <p className="text-xs text-muted-foreground">{p.email} · {team?.team_name || 'No team'}</p>
                    </div>
                    <Button size="sm" onClick={() => handleCheckin(p)} loading={checkingIn === p.id}>
                      <Check className="w-3.5 h-3.5" />Check In
                    </Button>
                  </div>
                )
              })}
            </div>
          )}

          {search && !searching && results.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No participants found</p>
          )}
        </CardContent>
      </Card>

      {/* Recent check-ins */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4 text-primary" />Recent Check-ins</CardTitle></CardHeader>
        <CardContent>
          {checkins.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No check-ins yet</p>
          ) : (
            <div className="space-y-2">
              {checkins.map(c => (
                <div key={c.id} className="flex items-center gap-3 py-2">
                  <Avatar className="h-7 w-7"><AvatarFallback className="text-xs">{getInitials(c.profiles?.full_name)}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{c.profiles?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{c.teams?.team_name || 'No team'}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="approved" className="text-xs"><Check className="w-2.5 h-2.5 mr-1" />Checked In</Badge>
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(c.checked_in_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
