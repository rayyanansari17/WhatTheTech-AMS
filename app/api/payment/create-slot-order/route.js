import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/ratelimit'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
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
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { team_id, additional_slots } = await req.json()
    if (!team_id || !additional_slots || additional_slots < 1) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const service = getServiceClient()

    const { data: team } = await service
      .from('teams')
      .select('id, leader_id, max_members, payment_status')
      .eq('id', team_id)
      .single()

    if (!team || team.leader_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (team.payment_status !== 'paid') {
      return Response.json({ error: 'Complete your initial team payment first' }, { status: 400 })
    }

    if (team.max_members + additional_slots > 5) {
      return Response.json(
        { error: `Cannot exceed 5 members. You can add at most ${5 - team.max_members} slot(s).` },
        { status: 400 }
      )
    }

    const { data: profile } = await service
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single()

    const amount = additional_slots * 299
    const origin = new URL(req.url).origin
    const gateway = activeGateway()

    const gatewayData = await createOrder(team_id, amount, {
      id: user.id,
      name: profile?.full_name || 'Participant',
      email: user.email,
      phone: profile?.phone || '9999999999',
      returnUrl: `${origin}/dashboard`,
    })

    return Response.json({ gateway, ...gatewayData, additional_slots, amount })
  } catch (err) {
    console.error('create-slot-order error:', err)
    return Response.json({ error: err.message || 'Failed to create slot order' }, { status: 500 })
  }
}
