// Simple in-memory rate limiter using Map
// Works for basic protection — resets on serverless cold starts

const rateLimitMap = new Map()

export function rateLimit(ip, options = {}) {
  const {
    maxRequests = 10,
    windowMs = 60_000,
  } = options

  const now = Date.now()
  const windowStart = now - windowMs

  const record = rateLimitMap.get(ip) || { requests: [] }

  record.requests = record.requests.filter(time => time > windowStart)

  if (record.requests.length >= maxRequests) {
    rateLimitMap.set(ip, record)
    return { success: false, remaining: 0 }
  }

  record.requests.push(now)
  rateLimitMap.set(ip, record)

  return { success: true, remaining: maxRequests - record.requests.length }
}

// Clean up stale entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of rateLimitMap.entries()) {
    if (record.requests.every(time => now - time > 60_000)) {
      rateLimitMap.delete(ip)
    }
  }
}, 300_000)
