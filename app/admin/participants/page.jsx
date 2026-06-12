'use client'
import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, UserCircle, ExternalLink, Github, Linkedin } from 'lucide-react'
import { getInitials, formatDate } from '@/lib/utils'
import { TRACKS, ROLE_TYPES } from '@/lib/constants'
import { useAdminRefresh } from '@/hooks/useAdminRefresh'
import AdminRefreshBar from '@/components/admin/AdminRefreshBar'

function ParticipantDrawer({ profile, open, onClose }) {
  if (!profile) return null
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Participant Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-lg">{getInitials(profile.full_name)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{profile.full_name}</h3>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <div className="flex gap-1.5 mt-1.5">
                {profile.role_type?.split(',').filter(Boolean).map(r => (
                  <Badge key={r} variant="secondary" className="text-xs">
                    {ROLE_TYPES.find(rt => rt.value === r)?.label || r}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Institution', profile.institution],
              ['Year', profile.year_of_study ? `${profile.year_of_study} Year` : '—'],
              ['City', profile.city && profile.state ? `${profile.city}, ${profile.state}` : '—'],
              ['Phone', profile.phone || '—'],
              ['T-Shirt', profile.tshirt_size || '—'],
              ['Dietary', profile.dietary_preference || '—'],
              ['Track', TRACKS.find(t => t.value === profile.track_preference)?.label || '—'],
              ['First Hackathon', profile.first_hackathon ? 'Yes' : 'No'],
            ].map(([k, v]) => (
              <div key={k} className="bg-muted/50 p-2.5 rounded-lg">
                <p className="text-xs text-muted-foreground">{k}</p>
                <p className="font-medium text-sm mt-0.5">{v}</p>
              </div>
            ))}
          </div>

          {profile.bio && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Bio</p>
              <p className="text-sm leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {profile.skills?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map(s => (
                  <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {profile.github && (
              <a href={profile.github.startsWith('http') ? profile.github : `https://${profile.github}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg px-3 py-2">
                <Github className="w-3.5 h-3.5" />GitHub
              </a>
            )}
            {profile.linkedin && (
              <a href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg px-3 py-2">
                <Linkedin className="w-3.5 h-3.5" />LinkedIn
              </a>
            )}
            {profile.resume_url && (
              <a href={profile.resume_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg px-3 py-2">
                <ExternalLink className="w-3.5 h-3.5" />Resume
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminParticipantsPage() {
  const supabase = getSupabaseClient()
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  async function loadParticipants() {
    let query = supabase
      .from('profiles')
      .select('*, team_members(teams(team_name, team_code))')
      .eq('is_organiser', false)
      .eq('profile_complete', true)
      .order('created_at', { ascending: false })
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,institution.ilike.%${search}%`)
    }
    const { data } = await query
    setParticipants(data || [])
  }

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(async () => {
      setLoading(true)
      await loadParticipants()
      setLoading(false)
    }, 400)
    return () => clearTimeout(timeout)
  }, [search])

  const { isRefreshing, isLive, lastUpdated, countdown, justUpdated, manualRefresh } =
    useAdminRefresh({ supabase, onRefresh: loadParticipants, channelName: 'admin-participants-rt', table: 'profiles' })

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold">Participants</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{participants.length} registered participants</p>
        </div>
        <AdminRefreshBar
          isRefreshing={isRefreshing} isLive={isLive} lastUpdated={lastUpdated}
          countdown={countdown} justUpdated={justUpdated} onRefresh={manualRefresh}
        />
      </div>

      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, college..." className="pl-9" />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {['Participant', 'Institution', 'Year', 'Role', 'Team', 'Phone', 'Joined'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-label text-xs font-bold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : participants.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center">
                  <UserCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No participants found</p>
                </td></tr>
              ) : (
                participants.map(p => (
                  <tr key={p.id} className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelected(p)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7"><AvatarFallback className="text-xs">{getInitials(p.full_name)}</AvatarFallback></Avatar>
                        <div>
                          <p className="text-sm font-medium">{p.full_name}</p>
                          <p className="text-xs text-muted-foreground">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{p.institution || '—'}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{p.year_of_study ? `Y${p.year_of_study}` : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.role_type?.split(',').filter(Boolean).slice(0, 2).map(r => (
                          <Badge key={r} variant="secondary" className="text-xs">
                            {ROLE_TYPES.find(rt => rt.value === r)?.label || r}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {p.team_members?.[0]?.teams?.team_name || <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{p.phone || '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(p.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ParticipantDrawer profile={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  )
}
