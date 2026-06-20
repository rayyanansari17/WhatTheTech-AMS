'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { sendTeamCreatedEmail, sendTeamJoinEmails } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { TRACKS } from '@/lib/constants'
import { generateTeamCode, generateCheckinToken, getInitials, calculateFee, formatCurrency } from '@/lib/utils'
import { AlertCircle, Users, Plus, Check, ArrowRight, Hash, Sparkles } from 'lucide-react'
import TopNav from '@/components/layout/TopNav'
import toast from 'react-hot-toast'

function FormError({ message }) {
  if (!message) return null
  return <p className="text-destructive text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{message}</p>
}

export default function TeamPage() {
  const router = useRouter()
  const supabase = getSupabaseClient()
  const [tab, setTab] = useState('create')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  // Create team form
  const [teamName, setTeamName] = useState('')
  const [track, setTrack] = useState('')
  const [ideaTitle, setIdeaTitle] = useState('')
  const [maxMembers, setMaxMembers] = useState(1)
  const [nameStatus, setNameStatus] = useState(null) // null | 'checking' | 'available' | 'taken'
  const nameCheckTimeout = { current: null }
  const [nameSuggestions, setNameSuggestions] = useState([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Join team form
  const [teamCode, setTeamCode] = useState('')
  const [teamPreview, setTeamPreview] = useState(null)
  const [codeStatus, setCodeStatus] = useState(null) // null | 'checking' | 'found' | 'not-found' | 'full'

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)
      // Check if already in a team - flat query, no join to avoid RLS recursion
      const { data: membership } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()
      if (membership) {
        router.push('/register/payment')
        return
      }
      setLoading(false)
    }
    load()
  }, [])

  // Debounced team name check - maybeSingle() returns null (not error) when no row found
  async function checkTeamName(name) {
    if (!name || name.length < 2) { setNameStatus(null); return }
    setNameStatus('checking')
    const { data } = await supabase.from('teams').select('id').eq('team_name', name).maybeSingle()
    setNameStatus(data ? 'taken' : 'available')
  }

  async function handleSuggestNames() {
    setLoadingSuggestions(true)
    setShowSuggestions(true)
    try {
      const res = await fetch('/api/team/suggest-names')
      const data = await res.json()
      if (data.names) setNameSuggestions(data.names)
    } catch (err) {
      console.error('Failed to get suggestions:', err)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  function handleTeamNameChange(e) {
    const val = e.target.value
    setTeamName(val)
    if (errors.teamName) setErrors(prev => ({ ...prev, teamName: '' }))
    clearTimeout(nameCheckTimeout.current)
    nameCheckTimeout.current = setTimeout(() => checkTeamName(val), 500)
  }

  // Team code lookup - no nested joins to avoid RLS issues on profiles
  async function lookupTeamCode(code) {
    if (code.length < 7) { setTeamPreview(null); setCodeStatus(null); return }
    setCodeStatus('checking')
    const { data: team, error } = await supabase
      .from('teams')
      .select('id, team_name, team_code, member_count, track')
      .eq('team_code', code.toUpperCase())
      .single()
    if (error || !team) { setCodeStatus('not-found'); setTeamPreview(null); return }
    if (team.member_count >= 5) { setCodeStatus('full'); setTeamPreview(team); return }
    setCodeStatus('found')
    setTeamPreview(team)
  }

  function handleCodeChange(e) {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setTeamCode(val)
    lookupTeamCode(val)
  }

  async function handleCreate(e) {
    e.preventDefault()
    const errs = {}
    if (!teamName.trim()) errs.teamName = 'Team name is required'
    if (nameStatus === 'taken') errs.teamName = 'This team name is already taken'
    if (!track) errs.track = 'Please select a track'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    try {
      const code = generateTeamCode()
      const checkinToken = generateCheckinToken()
      const { data: team, error: teamErr } = await supabase
        .from('teams')
        .insert({ team_name: teamName.trim(), team_code: code, checkin_token: checkinToken, leader_id: user.id, track, idea_title: ideaTitle, max_members: maxMembers })
        .select()
        .single()
      if (teamErr) throw teamErr

      const { error: memberErr } = await supabase
        .from('team_members')
        .insert({ team_id: team.id, user_id: user.id, is_leader: true })
      if (memberErr) throw memberErr

      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
      await sendTeamCreatedEmail({
        to: user.email,
        userId: user.id,
        leaderName: profile?.full_name || user.email.split('@')[0],
        teamName: teamName.trim(),
        teamCode: code,
        track,
        maxMembers,
        paymentUrl: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/register/payment`,
      }).catch(console.error)

      toast.success('Team created!')
      router.push('/register/payment')
    } catch (err) {
      toast.error(err.message || 'Failed to create team')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleJoin() {
    if (codeStatus !== 'found' || !teamPreview) return
    setSubmitting(true)
    try {
      const { error } = await supabase.rpc('join_team', {
        p_team_id: teamPreview.id,
        p_user_id: user.id,
      })
      if (error) throw error

      const [{ data: myProfile }, { data: teamFull }] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
        supabase.from('teams').select('leader_id, track, max_members, profiles!teams_leader_id_fkey(full_name, email)').eq('id', teamPreview.id).maybeSingle(),
      ])
      const myName = myProfile?.full_name || user.email.split('@')[0]
      await sendTeamJoinEmails({
        joiner: { email: user.email, userId: user.id, name: myName },
        leader: { email: teamFull?.profiles?.email || null, userId: teamFull?.leader_id || null, name: teamFull?.profiles?.full_name || '' },
        team: {
          name: teamPreview.team_name,
          code: teamPreview.team_code,
          track: teamFull?.track || teamPreview.track || '',
          currentCount: (teamPreview.member_count || 1) + 1,
          maxMembers: teamFull?.max_members || teamPreview.max_members || 4,
          joinUrl: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/register/payment`,
          dashboardUrl: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/dashboard`,
        },
      }).catch(console.error)

      toast.success(`Joined ${teamPreview.team_name}!`)
      router.push('/register/confirmation')
    } catch (err) {
      toast.error(err.message || 'Failed to join team')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <TopNav stepIndicator="Step 2 of 3 · Team" />

      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-foreground">Set Up Your Team</h1>
          <p className="text-muted-foreground mt-1.5">Create a new team or join an existing one with a code.</p>
        </div>

        {/* Tab toggle */}
        <div className="flex rounded-xl border border-border p-1 bg-background mb-6">
          {[
            { id: 'create', label: 'Create Team', icon: Plus },
            { id: 'join', label: 'Join Team', icon: Hash },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>

        {/* Create Team */}
        {tab === 'create' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />Create a New Team
              </CardTitle>
              <CardDescription>You'll be the team leader. Pay for the whole team after setup.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <Label>Team Name *</Label>
                  <div className="relative mt-1.5">
                    <Input value={teamName} onChange={handleTeamNameChange}
                      placeholder="Choose a unique team name"
                      error={!!errors.teamName}
                      className={nameStatus === 'available' ? 'border-green-400' : ''} />
                    {nameStatus && (
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium ${
                        nameStatus === 'checking' ? 'text-muted-foreground' :
                        nameStatus === 'available' ? 'text-green-600' : 'text-destructive'
                      }`}>
                        {nameStatus === 'checking' ? 'Checking...' :
                         nameStatus === 'available' ? '✓ Available' : '✗ Taken'}
                      </span>
                    )}
                  </div>
                  <FormError message={errors.teamName} />

                  {/* AI name suggestions */}
                  <button
                    type="button"
                    onClick={handleSuggestNames}
                    className="mt-2 flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {loadingSuggestions ? 'Generating names...' : 'Suggest team names with AI'}
                    {loadingSuggestions && (
                      <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                  </button>

                  {showSuggestions && (
                    <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      {loadingSuggestions ? (
                        <div className="grid grid-cols-2 gap-2">
                          {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
                          ))}
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            {nameSuggestions.map((item, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => {
                                  setTeamName(item.name)
                                  checkTeamName(item.name)
                                  setShowSuggestions(false)
                                }}
                                className="flex flex-col items-start p-2.5 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all duration-200 text-left group"
                              >
                                <span className="text-sm font-semibold text-foreground group-hover:text-primary leading-snug">
                                  {item.name}
                                </span>
                                <span className="text-xs text-muted-foreground mt-0.5">{item.vibe}</span>
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={handleSuggestNames}
                            className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                          >
                            ↻ Generate different names
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Team Size *</Label>
                  <div className="mt-2">
                    <div className="flex items-center gap-1.5 bg-muted/50 rounded-xl p-1 border border-border">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setMaxMembers(n)}
                          className={`flex-1 h-9 rounded-lg text-sm font-bold transition-all ${
                            maxMembers === n
                              ? 'bg-primary text-white shadow-sm'
                              : 'text-muted-foreground hover:bg-background hover:text-foreground'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-2 px-1">
                      <span className="text-xs text-muted-foreground">
                        {maxMembers} member{maxMembers > 1 ? 's' : ''} × ₹299
                      </span>
                      <div className="flex items-center gap-1.5">
                        {maxMembers === 5 && (
                          <span className="text-xs line-through text-muted-foreground">₹1,495</span>
                        )}
                        <span className={`text-sm font-bold ${maxMembers === 5 ? 'text-green-600' : 'text-foreground'}`}>
                          {formatCurrency(calculateFee(maxMembers))}
                        </span>
                        {maxMembers === 5 && (
                          <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-full px-2 py-0.5">
                            Best Value
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Track *</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                    {TRACKS.map(t => (
                      <label key={t.value}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-sm ${
                          track === t.value ? 'border-primary bg-accent text-primary font-medium' : 'border-border hover:border-primary/50'
                        }`}>
                        <RadioGroup value={track} onValueChange={setTrack}>
                          <RadioGroupItem value={t.value} />
                        </RadioGroup>
                        {t.label}
                      </label>
                    ))}
                  </div>
                  <FormError message={errors.track} />
                </div>

                <div>
                  <Label>Idea Title <span className="text-xs font-normal text-muted-foreground">(optional)</span></Label>
                  <Input className="mt-1.5" value={ideaTitle} onChange={e => setIdeaTitle(e.target.value)}
                    placeholder="What are you building? (optional)" />
                </div>

                <div className="bg-accent/50 border border-border rounded-lg p-3.5">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Note:</span> After creating your team, you'll be taken to the payment page.
                    {maxMembers > 1 && ' Share your team code with members so they can join.'}
                  </p>
                </div>

                <Button type="submit" className="w-full" size="lg" loading={submitting}>
                  Create Team <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Join Team */}
        {tab === 'join' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />Join a Team
              </CardTitle>
              <CardDescription>Enter the 7-character code your team leader shared with you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label>Team Code</Label>
                <Input
                  className="mt-1.5 text-center font-mono text-xl tracking-widest uppercase h-14 text-2xl font-bold"
                  value={teamCode} onChange={handleCodeChange}
                  placeholder="XXXXXXX" maxLength={7}
                />
                {codeStatus === 'not-found' && teamCode.length === 7 && (
                  <p className="text-destructive text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />No team found with this code
                  </p>
                )}
                {codeStatus === 'full' && (
                  <p className="text-destructive text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />This team is full (5/5 members)
                  </p>
                )}
                {codeStatus === 'checking' && (
                  <p className="text-muted-foreground text-xs mt-1.5">Looking up team...</p>
                )}
              </div>

              {/* Team Preview */}
              {codeStatus === 'found' && teamPreview && (
                <div className="animate-fade-in">
                  <div className="border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{teamPreview.team_name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {TRACKS.find(t => t.value === teamPreview.track)?.label || teamPreview.track}
                        </p>
                      </div>
                      <Badge variant="approved">
                        <Check className="w-3 h-3 mr-1" />Found
                      </Badge>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Members ({teamPreview.member_count}/5)
                      </p>
                      <div className="flex gap-1.5">
                        {Array.from({ length: teamPreview.member_count || 0 }).map((_, i) => (
                          <div key={i} className="h-8 w-8 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                            <Users className="w-3.5 h-3.5 text-primary/60" />
                          </div>
                        ))}
                        {Array.from({ length: 5 - (teamPreview.member_count || 0) }).map((_, i) => (
                          <div key={i} className="h-8 w-8 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                            <Plus className="w-3 h-3 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button className="w-full mt-4" size="lg" onClick={handleJoin} loading={submitting}>
                    Join {teamPreview.team_name} <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <div className="bg-accent/50 border border-border rounded-lg p-3.5">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Note:</span> As a member, you'll go directly to the confirmation page.
                  Your team leader handles the payment.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
