import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { rateLimit } from '@/lib/ratelimit'
import { verifyPayment, activeGateway } from '@/lib/payment'
import { triggerEmail } from '@/lib/send-email-internal'

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
    const body = await req.json()
    const { team_id } = body

    if (!team_id) return Response.json({ error: 'Missing team_id' }, { status: 400 })

    const supabase = createSupabaseServerClient()
    const adminSupabase = getServiceClient()
    const gateway = activeGateway()

    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://foundersfest-tech.vercel.app'

    // Dev-only bypass
    if (process.env.NODE_ENV === 'development' && body.order_id?.startsWith('test_')) {
      const { data: teamRow } = await supabase.from('teams').select('team_name, max_members').eq('id', team_id).single()
      const { error } = await supabase.from('teams').update({
        payment_status:     'deposit_paid',
        status:             'partial',
        deposit_order_id:   body.order_id,
        deposit_payment_id: null,
        deposit_amount:     149,
        deposit_paid_at:    new Date().toISOString(),
      }).eq('id', team_id)
      if (error) throw error

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const maxMembers = teamRow?.max_members || 1
        const balanceAmount = (maxMembers === 5 ? 1299 : maxMembers * 299) - 149
        await triggerEmail({
          type: 'deposit_success',
          to: user.email,
          userId: user.id,
          props: {
            name: user.user_metadata?.full_name || user.email.split('@')[0],
            teamName: teamRow?.team_name || '',
            depositAmount: '₹149',
            balanceAmount: `₹${balanceAmount}`,
            dashboardUrl: `${appUrl}/dashboard`,
          },
        }).catch(console.error)
      }

      return Response.json({ success: true })
    }

    let result
    let orderId

    if (gateway === 'razorpay') {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return Response.json({ error: 'Missing Razorpay payment fields' }, { status: 400 })
      }
      result = await verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature)
      orderId = razorpay_order_id
    } else {
      const { order_id } = body
      if (!order_id) return Response.json({ error: 'Missing order_id' }, { status: 400 })
      result = await verifyPayment(order_id)
      orderId = order_id
    }

    // Fetch team info for email
    const { data: teamRow } = await supabase.from('teams').select('team_name, max_members').eq('id', team_id).single()

    const { error } = await supabase.from('teams').update({
      payment_status:     'deposit_paid',
      status:             'partial',
      deposit_order_id:   orderId,
      deposit_payment_id: result.paymentId || null,
      deposit_amount:     150,
      deposit_paid_at:    new Date().toISOString(),
    }).eq('id', team_id)

    if (error) throw error

    // Email the leader who just paid
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const maxMembers = teamRow?.max_members || 1
      const balanceAmount = (maxMembers === 5 ? 1299 : maxMembers * 299) - 149
      await triggerEmail({
        type: 'deposit_success',
        to: user.email,
        userId: user.id,
        props: {
          name: user.user_metadata?.full_name || user.email.split('@')[0],
          teamName: teamRow?.team_name || '',
          depositAmount: '₹149',
          balanceAmount: `₹${balanceAmount}`,
          dashboardUrl: `${appUrl}/dashboard`,
        },
      }).catch(console.error)
    }

    return Response.json({ success: true, order_id: orderId })
  } catch (err) {
    console.error('Deposit verify error:', err)
    return Response.json({ error: err.message || 'Verification failed' }, { status: 500 })
  }
}
