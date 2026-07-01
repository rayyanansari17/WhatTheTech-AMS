'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { calculateFee, formatCurrency, getInitials } from '@/lib/utils'
import {
  Shield, CreditCard, Users, Tag,
  Copy, Check, Info, Plus, Minus, X, FlaskConical,
} from 'lucide-react'
import TopNav from '@/components/layout/TopNav'
import toast from 'react-hot-toast'
import HelpDialog from '@/components/onboarding/HelpDialog'

function PaymentPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = getSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [payingDeposit, setPayingDeposit] = useState(false)
  const [testPaying, setTestPaying] = useState(false)
  const [team, setTeam] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [members, setMembers] = useState([])
  const [codeCopied, setCodeCopied] = useState(false)
  const [adjustingSlots, setAdjustingSlots] = useState(false)
  const [removeTarget, setRemoveTarget] = useState(null) // { user_id, name }
  const [removingMember, setRemovingMember] = useState(false)

  useEffect(() => {
    let channel
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/register'); return }
        setUser(user)

        const [{ data: membership }, { data: prof }] = await Promise.all([
          supabase.from('team_members').select('team_id, is_leader').eq('user_id', user.id).order('is_leader', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('profiles').select('full_name, phone').eq('id', user.id).single(),
        ])

        if (!membership) { router.push('/register/team'); return }
        if (!membership.is_leader) { router.push('/register/confirmation'); return }

        const { data: t } = await supabase.from('teams').select('*').eq('id', membership.team_id).single()
        if (!t) { router.push('/register/team'); return }
        if (t.payment_status === 'paid') { router.push('/register/confirmation'); return }

        setTeam(t)
        setProfile(prof)

        const fetchMembers = async (teamId) => {
          const { data } = await supabase
            .from('team_members')
            .select('user_id, is_leader, profiles(full_name)')
            .eq('team_id', teamId)
          setMembers(data || [])
        }
        await fetchMembers(t.id)

        channel = supabase
          .channel(`team_members:${t.id}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'team_members',
            filter: `team_id=eq.${t.id}`,
          }, () => fetchMembers(t.id))
          .subscribe()
      } catch (err) {
        console.error('Payment page load error:', err)
        toast.error('Failed to load payment details. Please refresh.')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [])

  // Handle return from Cashfree full-page redirect
  useEffect(() => {
    const order_id = searchParams.get('order_id')
    const team_id = searchParams.get('team_id')
    if (!order_id || !team_id) return

    async function verifyRedirectPayment() {
      setPaying(true)
      try {
        const verifyRes = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id, team_id }),
        })
        const data = await verifyRes.json()
        if (data.success) {
          toast.success('Payment successful!')
          router.push('/register/confirmation')
        } else {
          toast.error(data.error || 'Payment verification failed')
          setPaying(false)
        }
      } catch (err) {
        toast.error(err.message || 'Verification failed')
        setPaying(false)
      }
    }
    verifyRedirectPayment()
  }, [searchParams])

  async function copyCode() {
    await navigator.clipboard.writeText(team.team_code)
    setCodeCopied(true)
    toast.success('Team code copied!')
    setTimeout(() => setCodeCopied(false), 2000)
  }

  async function handleTestPayment() {
    if (!team) return
    setTestPaying(true)
    try {
      const rand = () => Math.random().toString(36).slice(2, 12)
      const verifyRes = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: 'test_order_' + rand(),
          team_id: team.id,
        }),
      })
      const data = await verifyRes.json()
      if (data.success) {
        toast.success('Test payment successful!')
        router.push('/register/confirmation')
      } else {
        throw new Error(data.error || 'Test payment failed')
      }
    } catch (err) {
      toast.error(err.message || 'Test payment failed')
    } finally {
      setTestPaying(false)
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

  async function handlePayment() {
    if (!team) return
    setPaying(true)
    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: user.id,
          customer_name: profile?.full_name || user?.user_metadata?.full_name || user?.email,
          customer_email: user.email,
          customer_phone: profile?.phone || '9999999999',
          member_count: team.max_members,
          team_id: team.id,
          isBalancePayment: team.payment_status === 'deposit_paid',
        }),
      })
      const orderData = await res.json()
      if (orderData.error) throw new Error(orderData.error)

      const { gateway, orderId, paymentSessionId, razorpayOrderId, amount: razorpayAmount, currency } = orderData

      if (gateway === 'razorpay') {
        // Load Razorpay checkout script dynamically
        const loaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js')
        if (!loaded) throw new Error('Failed to load Razorpay checkout')

        const result = await new Promise((resolve) => {
          const rzp = new window.Razorpay({
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: razorpayAmount,
            currency: currency || 'INR',
            order_id: razorpayOrderId,
            name: 'What The Tech Hackathon',
            description: 'Hackathon Registration',
            prefill: {
              name: profile?.full_name || user?.user_metadata?.full_name || '',
              email: user.email,
              contact: profile?.phone || '',
            },
            handler: (response) => resolve(response),
            modal: { ondismiss: () => resolve(null) },
          })
          rzp.open()
        })

        if (!result) { setPaying(false); return }

        const verifyRes = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: result.razorpay_order_id,
            razorpay_payment_id: result.razorpay_payment_id,
            razorpay_signature: result.razorpay_signature,
            team_id: team.id,
          }),
        })
        const verifyData = await verifyRes.json()
        if (verifyData.success) {
          toast.success('Payment successful!')
          router.push('/register/confirmation')
        } else {
          throw new Error(verifyData.error || 'Payment verification failed')
        }
      } else {
        // Cashfree flow
        const { load } = await import('@cashfreepayments/cashfree-js')
        const cashfree = await load({
          mode: process.env.NEXT_PUBLIC_CASHFREE_ENV || 'production',
        })

        const result = await cashfree.checkout({
          paymentSessionId,
          redirectTarget: '_modal',
        })

        if (result.error) throw new Error(result.error.message || 'Payment failed')
        if (!result.paymentDetails) { setPaying(false); return }

        const verifyRes = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: orderId, team_id: team.id }),
        })
        const verifyData = await verifyRes.json()
        if (verifyData.success) {
          toast.success('Payment successful!')
          router.push('/register/confirmation')
        } else {
          throw new Error(verifyData.error || 'Payment verification failed')
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to initialize payment')
      setPaying(false)
    }
  }

  async function handleDepositPayment() {
    if (!team) return
    setPayingDeposit(true)
    try {
      const res = await fetch('/api/payment/create-deposit-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: user.id,
          customer_name: profile?.full_name || user?.user_metadata?.full_name || user?.email,
          customer_email: user.email,
          customer_phone: profile?.phone || '9999999999',
          team_id: team.id,
        }),
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
            description: 'Spot Reservation Deposit',
            prefill: {
              name: profile?.full_name || user?.user_metadata?.full_name || '',
              email: user.email,
              contact: profile?.phone || '',
            },
            handler: (response) => resolve(response),
            modal: { ondismiss: () => resolve(null) },
          })
          rzp.open()
        })

        if (!result) { setPayingDeposit(false); return }

        const verifyRes = await fetch('/api/payment/verify-deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: result.razorpay_order_id,
            razorpay_payment_id: result.razorpay_payment_id,
            razorpay_signature: result.razorpay_signature,
            team_id: team.id,
          }),
        })
        const verifyData = await verifyRes.json()
        if (verifyData.success) {
          toast.success('Spot reserved! ₹150 deposit confirmed.')
          router.push('/dashboard')
        } else {
          throw new Error(verifyData.error || 'Deposit verification failed')
        }
      } else {
        const { load } = await import('@cashfreepayments/cashfree-js')
        const cashfree = await load({ mode: process.env.NEXT_PUBLIC_CASHFREE_ENV || 'production' })

        const result = await cashfree.checkout({ paymentSessionId, redirectTarget: '_modal' })

        if (result.error) throw new Error(result.error.message || 'Payment failed')
        if (!result.paymentDetails) { setPayingDeposit(false); return }

        const verifyRes = await fetch('/api/payment/verify-deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: orderId, team_id: team.id }),
        })
        const verifyData = await verifyRes.json()
        if (verifyData.success) {
          toast.success('Spot reserved! ₹150 deposit confirmed.')
          router.push('/dashboard')
        } else {
          throw new Error(verifyData.error || 'Deposit verification failed')
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to initialize deposit payment')
      setPayingDeposit(false)
    }
  }

  async function changeSlots(n) {
    if (!team || adjustingSlots) return
    setAdjustingSlots(true)
    try {
      const res = await fetch('/api/team/update-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: team.id, max_members: n }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update slots')
      setTeam(t => ({ ...t, max_members: n }))
    } catch (err) {
      toast.error(err.message || 'Could not update team size')
    } finally {
      setAdjustingSlots(false)
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
      setMembers(prev => prev.filter(m => m.user_id !== removeTarget.user_id))
      toast.success(`${removeTarget.name} removed from the team`)
      setRemoveTarget(null)
    } catch (err) {
      toast.error(err.message || 'Could not remove member')
    } finally {
      setRemovingMember(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!team) return null

  const amount = calculateFee(team.max_members)
  const fullAmount = team.max_members * 299
  const hasDiscount = team.max_members === 5
  const balanceAmount = (team.max_members === 5 ? 1299 : team.max_members * 299) - 150
  const isDepositPaid = team.payment_status === 'deposit_paid'
  const leaderName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'You'

  return (
    <>

      {/* Remove Member Confirmation Dialog */}
      <Dialog open={!!removeTarget} onOpenChange={(o) => { if (!o && !removingMember) setRemoveTarget(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove {removeTarget?.name} from your team?</DialogTitle>
            <DialogDescription className="pt-1 leading-relaxed">
              They'll be removed and your slot count stays the same — you can lower your team size
              using the <strong>−</strong> button afterwards.
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
        <TopNav
          showTabs
          showUser
          stepIndicator="Step 3 of 3 · Payment"
          user={user}
          profile={profile}
        />

        <div className="max-w-lg mx-auto px-4 py-10">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-extrabold text-foreground">Complete Registration</h1>
              <HelpDialog
                title="About payment"
                sections={[
                  {
                    icon: <CreditCard className="w-4 h-4" />,
                    heading: 'Who pays?',
                    body: 'The team leader pays for everyone. Price is ₹299 per member - a full team of 5 costs ₹1,299 (saving ₹196).',
                  },
                  {
                    icon: <Tag className="w-4 h-4" />,
                    heading: 'Your team code',
                    body: 'Your 7-character code is shown on this page. Share it with teammates - they can join before or after you pay.',
                  },
                  {
                    icon: <Shield className="w-4 h-4" />,
                    heading: 'Secure checkout',
                    body: 'Payments are processed by Razorpay. We never store your card details.',
                  },
                ]}
              />
            </div>
            <p className="text-muted-foreground mt-1.5">
              Review your order and complete payment.
            </p>
          </div>

          <div className="space-y-4">
            {/* ── 1. Team Code (hidden for solo teams) ── */}
            {team.max_members > 1 && (
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="font-label text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                    Share this code with your teammates
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 font-mono text-2xl font-bold tracking-widest text-primary bg-accent border border-border rounded-xl px-5 py-3 text-center select-all">
                      {team.team_code}
                    </div>
                    <button
                      onClick={copyCode}
                      className="h-12 w-12 flex-shrink-0 rounded-xl border border-border bg-background hover:bg-accent flex items-center justify-center transition-colors"
                      title="Copy team code"
                    >
                      {codeCopied
                        ? <Check className="w-4 h-4 text-green-500" />
                        : <Copy className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Teammates can join using this code before or after you pay
                  </p>
                </CardContent>
              </Card>
            )}

            {/* ── 2. Team Slots Preview ── */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-sm font-semibold text-foreground mb-3">Team Slots</p>

                <div className="overflow-x-auto pb-1">
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: `repeat(${team.max_members}, minmax(72px, 1fr))` }}
                >
                  {/* Filled member slots */}
                  {members.map((m) => {
                    const name = m.profiles?.full_name || 'Member'
                    return (
                      <div key={m.user_id} className="relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 border-primary bg-accent/40">
                        {!m.is_leader && (
                          <button
                            type="button"
                            onClick={() => setRemoveTarget({ user_id: m.user_id, name: name.split(' ')[0] })}
                            className="absolute top-1 right-1 w-4 h-4 rounded-full bg-muted hover:bg-destructive/10 hover:text-destructive flex items-center justify-center text-muted-foreground transition-colors"
                            title={`Remove ${name.split(' ')[0]}`}
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {getInitials(name)}
                        </div>
                        <p className="text-xs font-medium text-foreground text-center leading-tight w-full truncate">
                          {name.split(' ')[0]}
                        </p>
                        {m.is_leader && (
                          <span className="text-xs font-medium text-primary bg-primary/10 border border-primary/20 rounded-full px-1.5 py-0">
                            Leader
                          </span>
                        )}
                      </div>
                    )
                  })}

                  {/* Empty slots */}
                  {Array.from({ length: Math.max(0, team.max_members - members.length) }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 border-dashed border-border">
                      <div className="w-9 h-9 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                        <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground text-center leading-tight">
                        Empty<br />Slot
                      </p>
                    </div>
                  ))}
                </div>
                </div>

                {/* Slot adjuster */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <span className="text-sm text-muted-foreground">Slots (tap to adjust)</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => changeSlots(team.max_members - 1)}
                      disabled={team.max_members <= members.length || team.max_members <= 1 || adjustingSlots}
                      className="w-7 h-7 rounded-full border border-border bg-background hover:bg-accent flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label="Remove a slot"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="relative text-sm font-semibold w-6 text-center tabular-nums flex items-center justify-center">
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

                {/* Info note - only for multi-member teams */}
                {team.max_members > 1 && (
                  <div className="mt-3 flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                      Adjust slots above before paying — once paid, slots cannot be removed.
                      Teammates can still join via your team code after payment.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── 4. Order Summary + Pay ── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Team info row */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{team.team_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {team.track?.replace('_', '/') || '-'}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Pricing breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {team.max_members} member{team.max_members > 1 ? 's' : ''} × ₹299
                    </span>
                    {hasDiscount ? (
                      <span className="line-through text-muted-foreground">₹1,495</span>
                    ) : (
                      <span>{formatCurrency(fullAmount)}</span>
                    )}
                  </div>

                  {hasDiscount && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">
                          Best Value discount
                        </span>
                      </div>
                      <span className="text-sm font-medium text-green-600">−₹196</span>
                    </div>
                  )}

                  {isDepositPaid && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-sm text-amber-600 font-medium">Deposit paid</span>
                      </div>
                      <span className="text-sm font-medium text-amber-600">−₹150</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-foreground">{isDepositPaid ? 'Balance Due' : 'Total'}</span>
                    <span className="text-2xl font-bold text-primary">
                      {isDepositPaid ? `₹${balanceAmount}` : formatCurrency(amount)}
                    </span>
                  </div>
                </div>

                {/* Pay button */}
                {isDepositPaid ? (
                  <div className="space-y-3">
                    <div className="border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        ✓ ₹150 deposit paid. Balance due: ₹{balanceAmount}
                      </p>
                    </div>
                    <Button className="w-full" size="xl" onClick={handlePayment} loading={paying}>
                      <CreditCard className="w-4 h-4" />
                      Complete Payment — ₹{balanceAmount}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="border border-border rounded-lg p-4">
                      <p className="text-sm font-semibold mb-0.5">Reserve Your Spot — ₹150</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Non-refundable deposit. Pay the balance of ₹{balanceAmount} before the event to confirm.
                      </p>
                      <Button className="w-full" variant="outline" onClick={handleDepositPayment} loading={payingDeposit} disabled={payingDeposit || paying}>
                        Reserve Spot — ₹150
                      </Button>
                    </div>
                    <div className="relative flex items-center gap-2 my-1">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted-foreground">or</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <Button className="w-full" size="xl" onClick={handlePayment} loading={paying} disabled={paying || payingDeposit}>
                      <CreditCard className="w-4 h-4" />
                      Pay {formatCurrency(amount)} &amp; Register
                    </Button>
                  </div>
                )}

                {process.env.NODE_ENV === 'development' && (
                  <Button
                    variant="outline"
                    className="w-full border-dashed border-amber-400 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                    onClick={handleTestPayment}
                    loading={testPaying}
                  >
                    <FlaskConical className="w-4 h-4" />
                    Test Payment (Dev Only)
                  </Button>
                )}

                <div className="flex flex-col items-center gap-1.5 pt-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Shield className="w-3.5 h-3.5 text-green-500" />
                    Secure payment powered by{' '}
                    <span className="font-semibold text-foreground capitalize">
                      {process.env.NEXT_PUBLIC_ACTIVE_PAYMENT_GATEWAY === 'razorpay' ? 'Razorpay' : 'Cashfree'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    The team leader pays for the whole team.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
      <PaymentPageContent />
    </Suspense>
  )
}
