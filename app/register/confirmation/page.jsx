'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TRACKS, HACKATHON_DATES, HACKATHON_VENUE } from '@/lib/constants'
import { Copy, Check, Twitter, MessageCircle, Calendar, MapPin, LayoutDashboard, Users } from 'lucide-react'
import TopNav from '@/components/layout/TopNav'
import toast from 'react-hot-toast'

function AnimatedCheck() {
  return (
    <div className="relative w-24 h-24 mx-auto mb-6">
      {/* Pulse ring */}
      <div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping" />
      <div className="relative w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <path
            d="M10 24L20 34L38 14"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="check-animate"
          />
        </svg>
      </div>
    </div>
  )
}

export default function ConfirmationPage() {
  const router = useRouter()
  const supabase = getSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/register'); return }

      const { data: membership } = await supabase
        .from('team_members')
        .select('team_id, is_leader, teams(*)')
        .eq('user_id', user.id)
        .single()

      if (!membership) { router.push('/register/team'); return }
      setTeam(membership.teams)
      setLoading(false)
    }
    load()
  }, [])

  async function copyCode() {
    if (!team?.team_code) return
    await navigator.clipboard.writeText(team.team_code)
    setCopied(true)
    toast.success('Team code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  const trackLabel = TRACKS.find(t => t.value === team?.track)?.label || team?.track

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <TopNav />
      <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-scale-in">
        <Card className="border-border">
          <CardContent className="pt-8 pb-8 px-4 sm:px-8 text-center">
            <AnimatedCheck />

            <h1 className="text-2xl font-extrabold text-foreground mb-2">You're in! 🎉</h1>
            <p className="text-muted-foreground mb-6">
              Your registration for Founders Fest Tech Edition is confirmed.
            </p>

            {/* Team info */}
            <div className="bg-muted/50 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-foreground">{team?.team_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{trackLabel} · {team?.member_count} member{team?.member_count > 1 ? 's' : ''}</p>
                </div>
                <Badge variant={team?.payment_status === 'paid' ? 'approved' : 'pending'}>
                  {team?.payment_status === 'paid' ? 'Paid ✓' : 'Payment Pending'}
                </Badge>
              </div>

              {(team?.max_members ?? 2) > 1 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Team Code - share with teammates</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 font-mono text-2xl font-bold tracking-widest text-primary bg-accent border border-border rounded-lg px-4 py-2.5 text-center">
                      {team?.team_code}
                    </div>
                    <Button variant="outline" size="icon" onClick={copyCode} className="h-12 w-12 flex-shrink-0">
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Next steps */}
            <div className="text-left mb-6">
              <h3 className="text-sm font-bold text-foreground mb-3">Next Steps</h3>
              <div className="space-y-2.5">
                {[
                  (team?.max_members ?? 2) > 1 && { icon: Users, text: 'Share your team code with teammates so they can join', color: 'text-primary bg-accent' },
                  { icon: Twitter, text: 'Follow @FoundersFest on Twitter/X for live updates', color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/30' },
                  { icon: MessageCircle, text: 'Join our Discord/WhatsApp for all communications', color: 'text-green-600 bg-green-50 dark:bg-green-950/30' },
                  { icon: Calendar, text: `Save the date: ${HACKATHON_DATES}`, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30' },
                  { icon: MapPin, text: HACKATHON_VENUE, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/30' },
                ].filter(Boolean).map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${step.color}`}>
                      <step.icon className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-sm text-muted-foreground leading-snug mt-0.5">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={() => router.push('/dashboard')}>
              <LayoutDashboard className="w-4 h-4" />
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  )
}
