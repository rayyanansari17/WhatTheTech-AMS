import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/ratelimit'
import { createOrder, activeGateway } from '@/lib/payment'

export async function POST(req) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
  const { success } = rateLimit(ip, { maxRequests: 10, windowMs: 60_000 })
  if (!success) return NextResponse.json({ error: 'Too many requests, slow down.' }, { status: 429 })

  try {
    const { customer_id, customer_name, customer_email, customer_phone, member_count, team_id } = await req.json()

    if (!customer_id || !customer_email || !member_count || !team_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const feePerPerson = parseInt(process.env.NEXT_PUBLIC_REGISTRATION_FEE_PER_PERSON || '299', 10)
    const fee5Members = parseInt(process.env.NEXT_PUBLIC_REGISTRATION_FEE_5_MEMBERS || '1299', 10)
    const amount = member_count === 5 ? fee5Members : member_count * feePerPerson

    const origin = new URL(req.url).origin
    const gateway = activeGateway()

    const gatewayData = await createOrder(team_id, amount, {
      id: customer_id,
      name: customer_name || 'Participant',
      email: customer_email,
      phone: customer_phone || '9999999999',
      returnUrl: `${origin}/register/payment`,
    })

    return Response.json({ gateway, ...gatewayData })
  } catch (err) {
    console.error('Payment create order error:', err)
    return Response.json({ error: err.message || 'Failed to create order' }, { status: 500 })
  }
}
