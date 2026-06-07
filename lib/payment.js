import * as cashfree from './gateways/cashfree'
import * as razorpay from './gateways/razorpay'

function getGateway() {
  const gateway = process.env.ACTIVE_PAYMENT_GATEWAY || 'cashfree'
  return gateway === 'razorpay' ? razorpay : cashfree
}

export const createOrder = (...args) => getGateway().createOrder(...args)
export const verifyPayment = (...args) => getGateway().verifyPayment(...args)
export const activeGateway = () => process.env.ACTIVE_PAYMENT_GATEWAY || 'cashfree'
