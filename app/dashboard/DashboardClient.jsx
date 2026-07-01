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
import { Copy, Check, Users, Plus, Minus, Calendar, MapPin, Bell, CreditCard, Clock, ExternalLink, Megaphone, Share2, Mail, MessageCircle, X, LogOut, ChevronDown, ChevronUp } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import CheckinQR from '@/components/dashboard/CheckinQR'
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

function AnnouncementCard({ announcement: a, showDivider }) {
  const [expanded, setExpanded] = useState(false)

  function handleRsvpSystem() {
    toast.success('RSVP recorded!')
  }

  return (
    <div>
      {showDivider && <Separator className="mb-3" />}
      <div>
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground">{a.title}</p>
          <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
            {formatRelativeTime(a.created_at)}
          </span>
        </div>
        <p className={`text-sm text-muted-foreground mt-1 ${expanded ? '' : 'line-clamp-2'}`}>{a.body}</p>
        {a.body?.length > 120 && (
          <button onClick={() => setExpanded(v => !v)}
            className="text-xs text-primary hover:underline mt-0.5 flex items-center gap-0.5">
            {expanded ? <><ChevronUp className="w-3 h-3" />Show less</> : <><ChevronDown className="w-3 h-3" />Show more</>}
          </button>
        )}

        {(a.event_date || a.event_time || a.location) && (
          <div className="flex flex-wrap gap-3 mt-2">
            {(a.event_date || a.event_time) && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3 text-primary" />
                {a.event_date ? new Date(a.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                {a.event_time && ` · ${a.event_time}`}
              </span>
            )}
            {a.location && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 text-primary" />{a.location}
              </span>
            )}
          </div>
        )}

        {a.poster_url && (
          <img src={a.poster_url} alt="Event poster"
            className="mt-2 rounded-xl object-cover max-h-[200px] w-full" />
        )}

        {a.rsvp_type && a.rsvp_type !== 'none' && (
          <div className="mt-2">
            {a.rsvp_type === 'external' && a.rsvp_link ? (
              <a href={a.rsvp_link} target="_blank" rel="noopener noreferrer">
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  <ExternalLink className="w-3 h-3" />RSVP Now
                </button>
              </a>
            ) : a.rsvp_type === 'system' ? (
              <button onClick={handleRsvpSystem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                RSVP
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashboardClient({ user, profile, team, isLeader, announcements }) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [leavingTeam, setLeavingTeam] = useState(false)
  const [addSlotOpen, setAddSlotOpen] = useState(false)
  const [addingSlot, setAddingSlot] = useState(false)
  const [adjustingSlots, setAdjustingSlots] = useState(false)
  const [removeTarget, setRemoveTarget] = useState(null) // { user_id, name }
  const [removingMember, setRemovingMember] = useState(false)

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
    const body = encodeURIComponent(`Hey! Join my team at What The Tech Hackathon.\n\nTeam: ${team?.team_name}\nJoin code: *${team?.team_code}*\n\nSign up at ${window.location.origin} → then enter the join code on the team setup page.`)
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank')
    setShareOpen(false)
  }

  function shareViaWhatsApp() {
    const text = encodeURIComponent(`Join my team *${team?.team_name}* at What The Tech Hackathon!\n\nJoin code: *${team?.team_code}*\nSign up at: ${window.location.origin} → then enter this code on the team setup page.`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
    setShareOpen(false)
  }

  async function copyAndClose() {
    await copyCode()
    setShareOpen(false)
  }

  async function changeSlots(n) {
    if (adjustingSlots) return
    setAdjustingSlots(true)
    try {
      const res = await fetch('/api/team/update-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: team.id, max_members: n }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update slots')
      router.refresh()
    } catch (err) {
      toast.error(err.message || 'Could not update team size')
    } finally {
      setAdjustingSlots(false)
    }
  }

  function loadScript(src) {
    return new Promise((resolve) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(true); return }
      const script = document.createElement('script')
      script.src = src
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  async function handleAddSlot() {
    setAddSlotOpen(false)
    setAddingSlot(true)
    try {
      const res = await fetch('/api/payment/create-slot-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: team.id, additional_slots: 1 }),
      })
      const orderData = await res.json()
      if (orderData.error) throw new Error(orderData.error)

      const { gateway, orderId, paymentSessionId, razorpayOrderId, amount: razorpayAmount, currency } = orderData

      if (gateway === 'razorpay') {
        const loaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js')
        if (!loaded) throw new Error('Failed to load Razorpay checkout')

        const result = await new Promise((resolve) => {
          const rzp = new window.Razorpay({
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: razorpayAmount,
            currency: currency || 'INR',
            order_id: razorpayOrderId,
            name: 'What The Tech Hackathon',
            description: 'Add Team Seat',
            prefill: {
              name: profile?.full_name || '',
              email: user.email,
              contact: profile?.phone || '',
            },
            handler: (response) => resolve(response),
            modal: { ondismiss: () => resolve(null) },
          })
          rzp.open()
        })

        if (!result) { setAddingSlot(false); return }

        const verifyRes = await fetch('/api/payment/verify-slot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: result.razorpay_order_id,
            razorpay_payment_id: result.razorpay_payment_id,
            razorpay_signature: result.razorpay_signature,
            team_id: team.id,
            additional_slots: 1,
          }),
        })
        const verifyData = await verifyRes.json()
        if (verifyData.success) {
          toast.success('Seat added! One more spot is now open for your team.')
          router.refresh()
        } else {
          throw new Error(verifyData.error || 'Payment verification failed')
        }
      } else {
        const { load } = await import('@cashfreepayments/cashfree-js')
        const cashfree = await load({ mode: process.env.NEXT_PUBLIC_CASHFREE_ENV || 'production' })

        const result = await cashfree.checkout({ paymentSessionId, redirectTarget: '_modal' })
        if (result.error) throw new Error(result.error.message || 'Payment failed')
        if (!result.paymentDetails) { setAddingSlot(false); return }

        const verifyRes = await fetch('/api/payment/verify-slot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: orderId, team_id: team.id, additional_slots: 1 }),
        })
        const verifyData = await verifyRes.json()
        if (verifyData.success) {
          toast.success('Seat added! One more spot is now open for your team.')
          router.refresh()
        } else {
          throw new Error(verifyData.error || 'Payment verification failed')
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to add seat')
    } finally {
      setAddingSlot(false)
    }
  }

  async function confirmRemoveMember() {
    if (!removeTarget) return
    setRemovingMember(true)
    try {
      const res = await fetch('/api/team/remove-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: team.id, user_id: removeTarget.user_id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to remove member')
      toast.success(`${removeTarget.name} removed. Their slot stays open for a new teammate.`)
      setRemoveTarget(null)
      router.refresh()
    } catch (err) {
      toast.error(err.message || 'Could not remove member')
    } finally {
      setRemovingMember(false)
    }
  }

  async function handleLeaveTeam() {
    if (!team) return
    if (isLeader && (team.member_count || 1) > 1) {
      toast.error('You must transfer leadership before leaving the team.')
      return
    }
    const confirmed = window.confirm(
      isLeader
        ? 'You are the only member. Leaving will delete the team. Continue?'
        : `Leave team "${team.team_name}"? This cannot be undone.`
    )
    if (!confirmed) return
    setLeavingTeam(true)
    try {
      const res = await fetch('/api/team/leave', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to leave team')
      toast.success('Left team successfully')
      router.refresh()
    } catch (err) {
      toast.error(err.message || 'Failed to leave team')
    } finally {
      setLeavingTeam(false)
    }
  }

  return (
    <>
    {/* Add Seat Info Dialog */}
    <Dialog open={addSlotOpen} onOpenChange={setAddSlotOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add a seat to your team?</DialogTitle>
          <DialogDescription className="pt-1 leading-relaxed">
            You're adding 1 slot — your team size will go from <strong>{team?.max_members}</strong> to{' '}
            <strong>{(team?.max_members || 0) + 1}</strong>.
            <br /><br />
            ₹299 will be charged now. <strong>This payment is non-refundable.</strong> Once someone
            joins this slot, their registration is confirmed.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 justify-end mt-2">
          <Button variant="outline" onClick={() => setAddSlotOpen(false)} disabled={addingSlot}>
            Cancel
          </Button>
          <Button onClick={handleAddSlot} loading={addingSlot}>
            Pay ₹299 &amp; Add Seat
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Remove Member Confirmation Dialog */}
    <Dialog open={!!removeTarget} onOpenChange={(o) => { if (!o && !removingMember) setRemoveTarget(null) }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Remove {removeTarget?.name} from your team?</DialogTitle>
          <DialogDescription className="pt-1 leading-relaxed">
            {team?.payment_status === 'paid' ? (
              <>
                They'll be removed from the team but their{' '}
                <strong>slot stays paid and open</strong>. A new teammate can still join using your
                team code <strong>{team?.team_code}</strong>. No refund is issued for the vacated slot.
              </>
            ) : (
              <>
                They'll be removed from the team. Your slot count stays the same — you can
                invite someone else using your team code <strong>{team?.team_code}</strong>,
                or reduce your team size on the payment page.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 justify-end mt-2">
          <Button variant="outline" onClick={() => setRemoveTarget(null)} disabled={removingMember}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirmRemoveMember} loading={removingMember}>
            Remove Member
          </Button>
        </div>
      </DialogContent>
    </Dialog>

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
                      <Badge variant={team.status === 'approved' ? 'approved' : team.status === 'rejected' ? 'rejected' : team.status === 'partial' ? 'partial' : 'pending'}>
                        {team.status === 'partial' ? 'Partial Payment' : `Application Status: ${team.status}`}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Members */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Members ({team.member_count}/{team.max_members || 5})</p>
                    <div className="flex gap-2 flex-wrap">
                      {team.team_members?.map((m, i) => {
                        const firstName = m.profiles?.full_name?.split(' ')[0] || '?'
                        return (
                          <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1.5">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-xs">{getInitials(m.profiles?.full_name)}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium">{firstName}</span>
                            {isLeader && !m.is_leader && (
                              <button
                                type="button"
                                onClick={() => setRemoveTarget({ user_id: m.user_id, name: firstName })}
                                className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors"
                                title={`Remove ${firstName}`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )
                      })}
                      {Array.from({ length: (team.max_members || 5) - (team.member_count || 0) }).map((_, i) => (
                        <div key={i} className="flex items-center gap-1.5 border border-dashed border-border rounded-full px-3 py-1.5">
                          <Plus className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Empty slot</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Slot adjuster — pre-payment leader only */}
                  {team.payment_status !== 'paid' && isLeader && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-xs text-muted-foreground">Team slots</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => changeSlots(team.max_members - 1)}
                          disabled={team.max_members <= (team.member_count || 1) || team.max_members <= 1 || adjustingSlots}
                          className="w-7 h-7 rounded-full border border-border bg-background hover:bg-accent flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          aria-label="Remove a slot"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-semibold w-6 text-center tabular-nums flex items-center justify-center">
                          {adjustingSlots
                            ? <div className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                            : team.max_members}
                        </span>
                        <button
                          type="button"
                          onClick={() => changeSlots(team.max_members + 1)}
                          disabled={team.max_members >= 5 || adjustingSlots}
                          className="w-7 h-7 rounded-full border border-border bg-background hover:bg-accent flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          aria-label="Add a slot"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Team code (hidden for solo teams) */}
                  {(team.max_members || 5) > 1 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Team Code - share with teammates</p>
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
                  )}

                  {team.payment_status !== 'paid' && isLeader && (
                    <Button className="w-full" variant="default" onClick={() => router.push('/register/payment')}>
                      <CreditCard className="w-4 h-4" /> Complete Payment
                    </Button>
                  )}

                  {team.payment_status !== 'paid' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs"
                      onClick={handleLeaveTeam}
                      disabled={leavingTeam}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      {leavingTeam ? 'Leaving...' : 'Leave Team'}
                    </Button>
                  )}

                  {team.payment_status === 'paid' && isLeader && team.max_members < 5 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => setAddSlotOpen(true)}
                      loading={addingSlot}
                    >
                      <Plus className="w-4 h-4" /> Add a Seat (₹299)
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
                      <AnnouncementCard key={a.id} announcement={a} showDivider={i > 0} />
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
            {team && (() => {
              const isPaid    = team.payment_status === 'paid'
              const isDeposit = team.payment_status === 'deposit_paid'
              const maxMembers = team.max_members || 1
              const balanceAmount = (maxMembers === 5 ? 1299 : maxMembers * 299) - 150
              return (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isPaid ? 'bg-green-50 dark:bg-green-950/30' : isDeposit ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-red-50 dark:bg-red-950/30'
                      }`}>
                        <CreditCard className={`w-4 h-4 ${isPaid ? 'text-green-600' : isDeposit ? 'text-amber-600' : 'text-red-500'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Payment Status</p>
                        <Badge variant={isPaid ? 'paid' : 'unpaid'} className="mt-0.5 text-xs">
                          {isPaid ? 'Paid ✓' : isDeposit ? 'Spot Reserved ✓' : 'Payment Pending'}
                        </Badge>
                      </div>
                    </div>
                    {isDeposit && (
                      <p className="text-xs text-muted-foreground mb-3">
                        ₹150 deposit paid. Balance due: ₹{balanceAmount}.
                      </p>
                    )}
                    {!isPaid && isDeposit && isLeader && (
                      <Button size="sm" className="w-full" onClick={() => router.push('/register/payment')}>
                        Complete Payment →
                      </Button>
                    )}
                    {!isPaid && !isDeposit && isLeader && (
                      <Button size="sm" className="w-full" onClick={() => router.push('/register/payment')}>
                        Pay Now
                      </Button>
                    )}
                    {!isPaid && !isLeader && (
                      <p className="text-xs text-muted-foreground">Your team leader needs to complete payment.</p>
                    )}
                  </CardContent>
                </Card>
              )
            })()}

            {/* Check-in QR */}
            <CheckinQR profile={profile} team={team} />

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
    </>
  )
}
