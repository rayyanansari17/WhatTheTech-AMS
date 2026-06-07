/**
 * POST /api/webhooks/razorpay
 * Razorpay payment webhook — payment.captured / payment.failed
 * Configure this URL in Razorpay Dashboard → Webhooks.
 */
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { triggerEmail } from '@/lib/send-email-internal'
import { rateLimit } from '@/lib/ratelimit'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

function verifySignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) return true
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  return expected === signature
}

export async function POST(req) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
  const { success } = rateLimit(ip, { maxRequests: 30, windowMs: 60_000 })
  if (!success) return Response.json({ error: 'Too many requests' }, { status: 429 })

  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    if (!verifySignature(rawBody, signature)) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(rawBody)
    const { event: eventType, payload } = event
    const supabase = getServiceClient()
    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://foundersfest-tech.vercel.app'

    if (eventType === 'payment.captured') {
      const payment = payload.payment?.entity
      const orderId = payment?.order_id
      const paymentId = payment?.id
      const amount = payment?.amount ? payment.amount / 100 : 0

      if (!orderId) return Response.json({ status: 'ok' })

      const { data: team } = await supabase
        .from('teams')
        .select('id, team_name, payment_status')
        .eq('payment_order_id', orderId)
        .maybeSingle()

      if (!team) return Response.json({ status: 'ok' })

      if (team.payment_status !== 'paid') {
        await supabase.from('teams').update({
          payment_status: 'paid',
          payment_id: paymentId,
          amount_paid: amount,
          payment_completed_at: new Date().toISOString(),
        }).eq('id', team.id)
      }

      const { data: members } = await supabase
        .from('team_members')
        .select('user_id, is_leader, profiles(full_name)')
        .eq('team_id', team.id)

      for (const m of members || []) {
        const { data: authUser } = await supabase.auth.admin.getUserById(m.user_id)
        if (!authUser?.user?.email) continue
        await triggerEmail({
          type: 'payment_success',
          to: authUser.user.email,
          userId: m.user_id,
          props: {
            name: m.profiles?.full_name || authUser.user.email.split('@')[0],
            teamName: team.team_name,
            orderId,
            amount: `₹${amount}`,
            dashboardUrl: `${appUrl}/dashboard`,
          },
        })
      }

      if (process.env.ADMIN_EMAIL) {
        const leader = members?.find(m => m.is_leader)
        const { data: leaderAuth } = leader
          ? await supabase.auth.admin.getUserById(leader.user_id)
          : { data: null }
        await triggerEmail({
          type: 'admin_new_registration',
          to: process.env.ADMIN_EMAIL,
          props: {
            userName: leaderAuth?.user?.user_metadata?.full_name || 'Unknown',
            userEmail: leaderAuth?.user?.email || '',
            teamName: team.team_name,
            paymentStatus: 'paid',
            registeredAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          },
        })
      }

      return Response.json({ status: 'ok' })
    }

    if (eventType === 'payment.failed') {
      const payment = payload.payment?.entity
      const orderId = payment?.order_id
      const reason = payment?.error_description || payment?.error_code || 'Payment failed'

      if (!orderId) return Response.json({ status: 'ok' })

      await supabase
        .from('teams')
        .update({ payment_status: 'failed' })
        .eq('payment_order_id', orderId)

      const { data: team } = await supabase
        .from('teams')
        .select('id, leader_id')
        .eq('payment_order_id', orderId)
        .maybeSingle()

      if (team?.leader_id) {
        const { data: authUser } = await supabase.auth.admin.getUserById(team.leader_id)
        if (authUser?.user?.email) {
          await triggerEmail({
            type: 'payment_failed',
            to: authUser.user.email,
            userId: team.leader_id,
            props: {
              name: authUser.user.user_metadata?.full_name || authUser.user.email.split('@')[0],
              retryUrl: `${appUrl}/register/payment`,
              reason,
            },
          })

          if (process.env.ADMIN_EMAIL) {
            await triggerEmail({
              type: 'admin_payment_failure',
              to: process.env.ADMIN_EMAIL,
              props: {
                userName: authUser.user.user_metadata?.full_name || '',
                userEmail: authUser.user.email,
                orderId,
                reason,
                failedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
              },
            })
          }
        }
      }

      return Response.json({ status: 'ok' })
    }

    return Response.json({ status: 'ignored' })
  } catch (err) {
    console.error('[razorpay webhook]', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
