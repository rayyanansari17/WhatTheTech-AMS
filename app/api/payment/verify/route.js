import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(req) {
  try {
    const { order_id, team_id } = await req.json()

    if (!order_id || !team_id) {
      return Response.json({ error: 'Missing order_id or team_id' }, { status: 400 })
    }

    const supabase = createSupabaseServerClient()

    // Dev-only bypass — skip Cashfree API call when order_id is a test stub
    if (process.env.NODE_ENV === 'development' && order_id.startsWith('test_')) {
      const { data: teamRow } = await supabase
        .from('teams').select('max_members').eq('id', team_id).single()
      const m = teamRow?.max_members || 1
      const amount_paid = m === 5 ? 1299 : m * 299

      const { error } = await supabase.from('teams').update({
        payment_status: 'paid',
        payment_order_id: order_id,
        amount_paid,
      }).eq('id', team_id)

      if (error) throw error
      return Response.json({ success: true })
    }

    // Verify payment status via Cashfree Get Order API
    const res = await fetch(`https://api.cashfree.com/pg/orders/${order_id}`, {
      method: 'GET',
      headers: {
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
        'x-api-version': '2025-01-01',
      },
    })

    const data = await res.json()

    if (!res.ok) {
      const msg = data?.message || 'Failed to fetch order from Cashfree'
      console.error('Cashfree verify error:', data)
      return Response.json({ error: msg }, { status: 500 })
    }

    if (data.order_status !== 'PAID') {
      return Response.json(
        { error: `Payment not completed. Status: ${data.order_status}` },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('teams')
      .update({
        payment_status: 'paid',
        payment_order_id: order_id,
      })
      .eq('id', team_id)

    if (error) throw error

    return Response.json({ success: true, order_id })
  } catch (err) {
    console.error('Cashfree verify error:', err)
    return Response.json({ error: err.message || 'Verification failed' }, { status: 500 })
  }
}
