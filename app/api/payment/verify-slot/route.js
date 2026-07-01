import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/ratelimit'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { verifyPayment, activeGateway } from '@/lib/payment'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function POST(req) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
  const { success } = rateLimit(ip, { maxRequests: 10, windowMs: 60_000 })
  if (!success) return NextResponse.json({ error: 'Too many requests, slow down.' }, { status: 429 })

  try {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { team_id, additional_slots } = body

    if (!team_id || !additional_slots || additional_slots < 1) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const service = getServiceClient()

    const { data: team } = await service
      .from('teams')
      .select('id, leader_id, max_members, payment_status, extra_slots_paid, amount_paid')
      .eq('id', team_id)
      .single()

    if (!team || team.leader_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (team.payment_status !== 'paid') {
      return Response.json({ error: 'Team has not completed initial payment' }, { status: 400 })
    }

    if (team.max_members + additional_slots > 5) {
      return Response.json({ error: 'Cannot exceed 5 members' }, { status: 400 })
    }

    const gateway = activeGateway()

    // Dev-only bypass
    if (process.env.NODE_ENV === 'development' && body.order_id?.startsWith('test_')) {
      const { error } = await service.from('teams').update({
        max_members: team.max_members + additional_slots,
        extra_slots_paid: (team.extra_slots_paid || 0) + additional_slots,
        amount_paid: (team.amount_paid || 0) + additional_slots * 299,
      }).eq('id', team_id)

      if (error) return Response.json({ error: error.message }, { status: 500 })
      return Response.json({ success: true })
    }

    if (gateway === 'razorpay') {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return Response.json({ error: 'Missing Razorpay payment fields' }, { status: 400 })
      }
      await verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature)
    } else {
      const { order_id } = body
      if (!order_id) return Response.json({ error: 'Missing order_id' }, { status: 400 })
      await verifyPayment(order_id)
    }

    const { error } = await service.from('teams').update({
      max_members: team.max_members + additional_slots,
      extra_slots_paid: (team.extra_slots_paid || 0) + additional_slots,
      amount_paid: (team.amount_paid || 0) + additional_slots * 299,
    }).eq('id', team_id)

    if (error) return Response.json({ error: error.message }, { status: 500 })

    return Response.json({ success: true })
  } catch (err) {
    console.error('verify-slot error:', err)
    return Response.json({ error: err.message || 'Verification failed' }, { status: 500 })
  }
}
