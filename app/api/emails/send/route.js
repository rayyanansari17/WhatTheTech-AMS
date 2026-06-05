/**
 * POST /api/emails/send
 * Thin HTTP wrapper over triggerEmail() — see lib/send-email-internal.js for all supported types.
 */
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/ratelimit'
import { triggerEmail } from '@/lib/send-email-internal'

export async function POST(req) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
  const { success } = rateLimit(ip, { maxRequests: 5, windowMs: 60_000 })
  if (!success) return NextResponse.json({ error: 'Too many requests, slow down.' }, { status: 429 })

  try {
    const authHeader = req.headers.get('x-internal-secret')
    if (authHeader !== process.env.INTERNAL_EMAIL_SECRET) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, to, userId, props = {} } = await req.json()

    if (!type || !to) {
      return Response.json({ error: 'type and to are required' }, { status: 400 })
    }

    const result = await triggerEmail({ type, to, userId, props })

    if (result?.error) {
      return Response.json({ error: result.error }, { status: 400 })
    }

    return Response.json(result)
  } catch (err) {
    console.error('[/api/emails/send]', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
