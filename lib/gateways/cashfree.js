function getBaseUrl() {
  return process.env.CASHFREE_ENV === 'sandbox'
    ? 'https://sandbox.cashfree.com'
    : 'https://api.cashfree.com'
}

function getHeaders() {
  return {
    'x-client-id': process.env.CASHFREE_APP_ID,
    'x-client-secret': process.env.CASHFREE_SECRET_KEY,
    'x-api-version': '2025-01-01',
    'Content-Type': 'application/json',
  }
}

export async function createOrder(teamId, amount, customer) {
  const orderId = `FF_${String(customer.id).slice(0, 8)}_${Date.now()}`

  const res = await fetch(`${getBaseUrl()}/pg/orders`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: String(customer.id).slice(0, 50),
        customer_name: customer.name || 'Participant',
        customer_email: customer.email,
        customer_phone: customer.phone || '9999999999',
      },
      order_meta: {
        return_url: `${customer.returnUrl}?order_id={order_id}&team_id=${teamId}`,
      },
    }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data?.message || 'Failed to create Cashfree order')

  return { orderId: data.order_id, paymentSessionId: data.payment_session_id }
}

export async function verifyPayment(orderId) {
  const res = await fetch(`${getBaseUrl()}/pg/orders/${orderId}`, {
    method: 'GET',
    headers: getHeaders(),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data?.message || 'Failed to fetch order from Cashfree')
  if (data.order_status !== 'PAID') throw new Error(`Payment not completed. Status: ${data.order_status}`)

  return {
    success: true,
    amountPaid: data.order_amount,
    paymentId: data.cf_order_id || orderId,
  }
}
