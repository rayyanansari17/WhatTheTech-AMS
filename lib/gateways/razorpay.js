import Razorpay from 'razorpay'
import crypto from 'crypto'

function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

export async function createOrder(teamId, amount, customer) {
  const razorpay = getRazorpay()
  const receipt = `FF_${String(customer.id).slice(0, 8)}_${Date.now()}`

  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: 'INR',
    receipt,
    notes: {
      team_id: teamId,
      customer_email: customer.email,
    },
  })

  return {
    orderId: receipt,
    razorpayOrderId: order.id,
    amount: order.amount,
    currency: order.currency,
  }
}

export async function verifyPayment(razorpayOrderId, paymentId, signature) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${paymentId}`)
    .digest('hex')

  if (expected !== signature) throw new Error('Invalid payment signature')

  const razorpay = getRazorpay()
  const payment = await razorpay.payments.fetch(paymentId)

  if (payment.status !== 'captured' && payment.status !== 'authorized') {
    throw new Error(`Payment not captured. Status: ${payment.status}`)
  }

  return {
    success: true,
    amountPaid: payment.amount / 100,
    paymentId,
  }
}
