'use client'
import { useState, useEffect } from 'react'
import TopNav from '@/components/layout/TopNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { TRACKS, HACKATHON_DATE, HACKATHON_DATES, HACKATHON_VENUE } from '@/lib/constants'
import { getInitials, formatRelativeTime, formatCurrency } from '@/lib/utils'
import { Copy, Check, Users, Plus, Calendar, MapPin, Bell, CreditCard, Clock, ExternalLink, Megaphone, Share2, Mail, MessageCircle, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

function CountdownTimer({ targetDate }) {
  const [time, setTime] = useState({ days: 0, hours: 0, mins: 0, secs: 0 })

  useEffect(() => {
    function update() {
      const now = new Date()
      const diff = new Date(targetDate) - now
      if (diff <= 0) { setTime({ days: 0, hours: 0, mins: 0, secs: 0 }); return }
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      })
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  return (
    <div className="grid grid-cols-4 gap-2">
      {[
        { label: 'Days', value: time.days },
        { label: 'Hours', value: time.hours },
        { label: 'Mins', value: time.mins },
        { label: 'Secs', value: time.secs },
      ].map(unit => (
        <div key={unit.label} className="text-center bg-muted/50 rounded-lg p-2">
          <div className="text-xl font-bold font-mono text-foreground tabular-nums">
            {String(unit.value).padStart(2, '0')}
          </div>
          <div className="text-xs text-muted-foreground">{unit.label}</div>
        </div>
      ))}
    </div>
  )
}

export default function DashboardClient({ user, profile, team, isLeader, announcements }) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const trackLabel = TRACKS.find(t => t.value === team?.track)?.label || team?.track

  async function copyCode() {
    if (!team?.team_code) return
    await navigator.clipboard.writeText(team.team_code)
    setCopied(true)
    toast.success('Team code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  function shareViaEmail() {
    const subject = encodeURIComponent(`Join my team at What The Tech!`)
    const body = encodeURIComponent(`Hey! Join my team at What The Tech Hackathon.\n\nTeam: ${team?.team_name}\nJoin code: ${team?.team_code}\n\nRegister and join at: ${window.location.origin}/register/team`)
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank')
    setShareOpen(false)
  }

  function shareViaWhatsApp() {
    const text = encodeURIComponent(`Join my team *${team?.team_name}* at What The Tech Hackathon!\n\nJoin code: *${team?.team_code}*\nRegister: ${window.location.origin}/register/team`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
    setShareOpen(false)
  }

  async function copyAndClose() {
    await copyCode()
    setShareOpen(false)
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <TopNav showTabs showUser user={user} profile={profile} />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-foreground">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Hacker'}!
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Here's your registration overview.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left column */}
          <div className="flex-1 min-w-0 w-full space-y-4">
            {/* Team Card */}
            {team ? (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{team.team_name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">{trackLabel}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={team.status === 'approved' ? 'approved' : team.status === 'rejected' ? 'rejected' : 'pending'}>
                        Application Status: {team.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Members */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Members ({team.member_count}/{team.max_members || 5})</p>
                    <div className="flex gap-2 flex-wrap">
                      {team.team_members?.map((m, i) => (
                        <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1.5">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs">{getInitials(m.profiles?.full_name)}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">{m.profiles?.full_name?.split(' ')[0] || '?'}</span>
                        </div>
                      ))}
                      {Array.from({ length: (team.max_members || 5) - (team.member_count || 0) }).map((_, i) => (
                        <div key={i} className="flex items-center gap-1.5 border border-dashed border-border rounded-full px-3 py-1.5">
                          <Plus className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Empty slot</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Team code */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Team Code — share with teammates</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 font-mono text-lg font-bold tracking-widest text-primary bg-accent border border-border rounded-lg px-4 py-2 text-center">
                        {team.team_code}
                      </div>
                      <div className="relative">
                        <Button variant="outline" size="icon" onClick={() => setShareOpen(v => !v)} className="h-10 w-10">
                          <Share2 className="w-4 h-4" />
                        </Button>
                        {shareOpen && (
                          <div className="absolute right-0 top-12 z-50 w-44 bg-background border border-border rounded-xl shadow-lg overflow-hidden">
                            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                              <span className="text-xs font-semibold text-foreground">Share team code</span>
                              <button onClick={() => setShareOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <button onClick={shareViaEmail}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-accent transition-colors text-left">
                              <Mail className="w-4 h-4 text-blue-500" /> Email
                            </button>
                            <button onClick={shareViaWhatsApp}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-accent transition-colors text-left">
                              <MessageCircle className="w-4 h-4 text-green-500" /> WhatsApp
                            </button>
                            <button onClick={copyAndClose}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-accent transition-colors text-left">
                              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                              {copied ? 'Copied!' : 'Copy code'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {team.payment_status !== 'paid' && isLeader && (
                    <Button className="w-full" variant="default" onClick={() => router.push('/register/payment')}>
                      <CreditCard className="w-4 h-4" /> Complete Payment
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-10 text-center">
                  <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium text-foreground mb-1">No Team Yet</p>
                  <p className="text-sm text-muted-foreground mb-4">Create or join a team to complete registration.</p>
                  <Button onClick={() => router.push('/register/team')}>Set Up Team</Button>
                </CardContent>
              </Card>
            )}

            {/* Announcements */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-primary" />
                  <CardTitle className="text-base">Announcements</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {announcements.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No announcements yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">Check back closer to the event.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {announcements.map((a, i) => (
                      <div key={a.id}>
                        {i > 0 && <Separator className="mb-3" />}
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">{a.title}</p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                              {formatRelativeTime(a.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="w-full lg:w-72 flex-shrink-0 space-y-4">
            {/* Countdown */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm">Countdown to Event</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CountdownTimer targetDate={HACKATHON_DATE} />
              </CardContent>
            </Card>

            {/* Payment Status */}
            {team && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      team.payment_status === 'paid' ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'
                    }`}>
                      <CreditCard className={`w-4 h-4 ${team.payment_status === 'paid' ? 'text-green-600' : 'text-red-500'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Payment Status</p>
                      <Badge variant={team.payment_status === 'paid' ? 'paid' : 'unpaid'} className="mt-0.5 text-xs">
                        {team.payment_status === 'paid' ? 'Paid ✓' : 'Payment Pending'}
                      </Badge>
                    </div>
                  </div>
                  {team.payment_status !== 'paid' && isLeader && (
                    <Button size="sm" className="w-full" onClick={() => router.push('/register/payment')}>
                      Pay Now
                    </Button>
                  )}
                  {team.payment_status !== 'paid' && !isLeader && (
                    <p className="text-xs text-muted-foreground">Your team leader needs to complete payment.</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Event Info */}
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Event Dates</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{HACKATHON_DATES}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Venue</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{HACKATHON_VENUE}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
