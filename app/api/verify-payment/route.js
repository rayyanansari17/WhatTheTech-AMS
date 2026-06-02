import crypto from 'crypto'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(req) {
  try {
    const { order_id, payment_id, signature, team_id } = await req.json()

    if (!order_id || !payment_id || !signature || !team_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createSupabaseServerClient()

    // Dev-only bypass — skip HMAC when all three values are test stubs
    if (
      process.env.NODE_ENV === 'development' &&
      order_id.startsWith('test_') &&
      payment_id.startsWith('test_') &&
      signature.startsWith('test_')
    ) {
      const { data: teamRow } = await supabase
        .from('teams').select('max_members').eq('id', team_id).single()
      const m = teamRow?.max_members || 1
      const amount_paid = m === 5 ? 1299 : m * 299

      const { error } = await supabase.from('teams').update({
        payment_status: 'paid',
        payment_id,
        payment_order_id: order_id,
        amount_paid,
      }).eq('id', team_id)

      if (error) throw error
      return Response.json({ success: true })
    }

    // Verify Razorpay signature
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${order_id}|${payment_id}`)
      .digest('hex')

    if (expected !== signature) {
      return Response.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // Update payment status only — max_members is already set at team creation
    const { error } = await supabase
      .from('teams')
      .update({
        payment_status: 'paid',
        payment_id,
        payment_order_id: order_id,
      })
      .eq('id', team_id)

    if (error) throw error

    return Response.json({ success: true })
  } catch (err) {
    console.error('Payment verification error:', err)
    return Response.json({ error: err.message || 'Verification failed' }, { status: 500 })
  }
}
