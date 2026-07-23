// Pricing (in INR):
//   1 member  → ₹299
//   2 members → ₹598
//   3 members → ₹897
//   4 members → ₹1,196
//   5 members → ₹1,299 flat (NEXT_PUBLIC_REGISTRATION_FEE_5_MEMBERS)
// Set NEXT_PUBLIC_PAYMENT_TEST_AMOUNT (rupees) to override in dev/test

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit } from '@/lib/ratelimit'
import { createOrder, activeGateway } from '@/lib/payment'

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
    const { customer_id, customer_name, customer_email, customer_phone, member_count, team_id, isBalancePayment } = await req.json()

    if (!customer_id || !customer_email || !member_count || !team_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const feePerPerson = parseInt(process.env.NEXT_PUBLIC_REGISTRATION_FEE_PER_PERSON || '299', 10)
    const fee5Members = parseInt(process.env.NEXT_PUBLIC_REGISTRATION_FEE_5_MEMBERS || '1299', 10)
    let amount = process.env.NEXT_PUBLIC_PAYMENT_TEST_AMOUNT
      ? parseInt(process.env.NEXT_PUBLIC_PAYMENT_TEST_AMOUNT, 10)
      : member_count === 5 ? fee5Members : member_count * feePerPerson

    if (isBalancePayment) {
      const service = getServiceClient()
      const { data: teamRow } = await service.from('teams').select('deposit_amount').eq('id', team_id).single()
      const depositPaid = teamRow?.deposit_amount || 0
      if (depositPaid > 0) amount = amount - depositPaid
    }

    const origin = new URL(req.url).origin
    const gateway = activeGateway()

    const gatewayData = await createOrder(team_id, amount, {
      id: customer_id,
      name: customer_name || 'Participant',
      email: customer_email,
      phone: customer_phone || '9999999999',
      returnUrl: `${origin}/register/payment`,
    })

    // Save order_id to DB immediately so webhook can match payment even if
    // the browser closes before the verify call completes
    if (gatewayData.order_id) {
      const service = getServiceClient()
      await service.from('teams').update({ payment_order_id: gatewayData.order_id }).eq('id', team_id)
    }

    return Response.json({ gateway, ...gatewayData })
  } catch (err) {
    console.error('Payment create order error:', err)
    return Response.json({ error: err.message || 'Failed to create order' }, { status: 500 })
  }
}
