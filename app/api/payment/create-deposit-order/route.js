import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { rateLimit } from '@/lib/ratelimit'
import { createOrder, activeGateway } from '@/lib/payment'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

const DEPOSIT_AMOUNT = 149

export async function POST(req) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
  const { success } = rateLimit(ip, { maxRequests: 10, windowMs: 60_000 })
  if (!success) return NextResponse.json({ error: 'Too many requests, slow down.' }, { status: 429 })

  try {
    const { customer_id, customer_name, customer_email, customer_phone, team_id } = await req.json()

    if (!customer_id || !customer_email || !team_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify session user is the team leader
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== customer_id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const service = getServiceClient()
    const { data: membership } = await service
      .from('team_members')
      .select('is_leader')
      .eq('team_id', team_id)
      .eq('user_id', customer_id)
      .single()

    if (!membership?.is_leader) {
      return Response.json({ error: 'Only the team leader can initiate payment' }, { status: 403 })
    }

    const { data: team } = await service
      .from('teams')
      .select('id, payment_status')
      .eq('id', team_id)
      .single()

    if (!team) return Response.json({ error: 'Team not found' }, { status: 404 })
    if (team.payment_status === 'paid') {
      return Response.json({ error: 'Already paid in full' }, { status: 400 })
    }
    if (team.payment_status === 'deposit_paid') {
      return Response.json({ error: 'Deposit already paid' }, { status: 400 })
    }

    const origin = new URL(req.url).origin
    const gateway = activeGateway()

    const gatewayData = await createOrder(team_id, DEPOSIT_AMOUNT, {
      id: customer_id,
      name: customer_name || 'Participant',
      email: customer_email,
      phone: customer_phone || '9999999999',
      returnUrl: `${origin}/register/payment`,
    })

    return Response.json({ gateway, ...gatewayData })
  } catch (err) {
    console.error('Deposit order creation error:', err)
    return Response.json({ error: err.message || 'Failed to create deposit order' }, { status: 500 })
  }
}
