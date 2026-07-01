import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { Resend } from 'resend'
import { getGroqClient } from '@/lib/groq-client'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

async function requireOrganiser() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const service = getServiceClient()
  const { data: profile } = await service.from('profiles').select('is_organiser').eq('id', user.id).single()
  return profile?.is_organiser ? user : null
}

function timeout(ms) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
  )
}

async function check(name, fn, ms = 7000) {
  const start = Date.now()
  try {
    const result = await Promise.race([fn(), timeout(ms)])
    return { name, status: 'ok', latency_ms: Date.now() - start, message: result?.message ?? null }
  } catch (err) {
    return { name, status: 'error', latency_ms: Date.now() - start, message: err.message }
  }
}

export async function GET() {
  const user = await requireOrganiser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const service = getServiceClient()
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://app.foundersfest.org'

  const checks = await Promise.all([

    // Supabase - simple select with timing
    check('Supabase', async () => {
      const { error } = await service.from('teams').select('id').limit(1)
      if (error) throw new Error(error.message)
    }),

    // Resend - list domains to verify key
    check('Resend', async () => {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const { data, error } = await resend.domains.list()
      if (error) throw new Error(error.message || 'Invalid API key')
      const count = data?.data?.length ?? 0
      return { message: `${count} domain${count !== 1 ? 's' : ''} configured` }
    }),

    // Cashfree - fetch nonexistent order; 404 = keys valid, 401 = invalid
    check('Cashfree', async () => {
      const base = process.env.CASHFREE_ENV === 'sandbox'
        ? 'https://sandbox.cashfree.com'
        : 'https://api.cashfree.com'
      const res = await fetch(`${base}/pg/orders/health_ping_${Date.now()}`, {
        headers: {
          'x-client-id': process.env.CASHFREE_APP_ID,
          'x-client-secret': process.env.CASHFREE_SECRET_KEY,
          'x-api-version': '2025-01-01',
        },
      })
      if (res.status === 401 || res.status === 403) {
        throw new Error(`Authentication failed (HTTP ${res.status})`)
      }
      return { message: `${process.env.CASHFREE_ENV || 'production'} · HTTP ${res.status}` }
    }),

    // Razorpay - list 1 order via REST; 200 = keys valid, 401 = invalid
    check('Razorpay', async () => {
      const credentials = Buffer.from(
        `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
      ).toString('base64')
      const res = await fetch('https://api.razorpay.com/v1/orders?count=1', {
        headers: { Authorization: `Basic ${credentials}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    }),

    // Groq - 1-token completion to verify key + model availability
    check('Groq', async () => {
      const groq = getGroqClient()
      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
      })
      const model = completion.model || 'llama-3.1-8b-instant'
      return { message: model }
    }),

    // Cloudinary - authenticated ping endpoint
    check('Cloudinary', async () => {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME
      const apiKey = process.env.CLOUDINARY_API_KEY
      const apiSecret = process.env.CLOUDINARY_API_SECRET
      if (!cloudName || !apiKey || !apiSecret) throw new Error('Credentials not configured')
      const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/ping`, {
        headers: { Authorization: `Basic ${credentials}` },
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message || `HTTP ${res.status}`)
      }
      return { message: cloudName }
    }),

    // MarkItDown service - GET root, expect non-5xx
    check('MarkItDown', async () => {
      const serviceUrl = (process.env.MARKITDOWN_SERVICE_URL || '').replace(/\/$/, '')
      if (!serviceUrl) throw new Error('MARKITDOWN_SERVICE_URL not configured')
      const res = await fetch(serviceUrl)
      if (res.status >= 500) throw new Error(`HTTP ${res.status}`)
      return { message: serviceUrl.replace(/^https?:\/\//, '').split('/')[0] }
    }),

    // econtracts - GET endpoint; 405/404 = service reachable, 401 = bad key, 5xx = down
    check('econtracts', async () => {
      const base = 'https://uvktoojtpsbbmahrbxeg.supabase.co/functions/v1/api-contracts'
      const res = await fetch(base, {
        headers: { 'X-API-Key': process.env.ECONTRACTS_API_KEY },
      })
      if (res.status >= 500) throw new Error(`Service error: HTTP ${res.status}`)
      if (res.status === 401 || res.status === 403) throw new Error(`Authentication failed (HTTP ${res.status})`)
      return { message: `HTTP ${res.status}` }
    }),

  ])

  return Response.json({ checks })
}
