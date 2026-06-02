import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

function calculateFee(memberCount) {
  return 1 // TEST PRICE — revert before going live
  if (memberCount === 5) return 1299
  return memberCount * 299
}

export async function POST(req) {
  try {
    const { team_id, member_count } = await req.json()
    if (!team_id || !member_count) {
      return Response.json({ error: 'Missing team_id or member_count' }, { status: 400 })
    }

    const amount = calculateFee(member_count)
    const order = await razorpay.orders.create({
      amount: amount * 100, // in paise
      currency: 'INR',
      receipt: `ff_${team_id.slice(0, 20)}`,
      notes: { team_id, member_count: String(member_count) },
    })

    return Response.json({ order_id: order.id, amount: order.amount })
  } catch (err) {
    console.error('Razorpay order error:', JSON.stringify(err?.error || err, null, 2))
    console.error('Razorpay error message:', err?.message)
    console.error('Razorpay status code:', err?.statusCode)
    const description = err?.error?.description || err?.message || 'Failed to create order'
    return Response.json({ error: description }, { status: 500 })
  }
}
