function calculateFee(memberCount) {
  return 1 // TEST PRICE — revert before going live
  if (memberCount === 5) return 1299
  return memberCount * 299
}

export async function POST(req) {
  try {
    const { customer_id, customer_name, customer_email, customer_phone, member_count } = await req.json()

    if (!customer_id || !customer_email || !member_count) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const amount = calculateFee(member_count)
    const order_id = `FF_${String(customer_id).slice(0, 8)}_${Date.now()}`

    const res = await fetch('https://api.cashfree.com/pg/orders', {
      method: 'POST',
      headers: {
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
        'x-api-version': '2025-01-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id,
        order_amount: amount,
        order_currency: 'INR',
        customer_details: {
          customer_id: String(customer_id).slice(0, 50),
          customer_name: customer_name || 'Participant',
          customer_email,
          customer_phone: customer_phone || '9999999999',
        },
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      const msg = data?.message || data?.error || 'Failed to create Cashfree order'
      console.error('Cashfree create order error:', data)
      return Response.json({ error: msg }, { status: 500 })
    }

    return Response.json({
      payment_session_id: data.payment_session_id,
      order_id: data.order_id,
    })
  } catch (err) {
    console.error('Cashfree create order error:', err)
    return Response.json({ error: err.message || 'Failed to create order' }, { status: 500 })
  }
}
